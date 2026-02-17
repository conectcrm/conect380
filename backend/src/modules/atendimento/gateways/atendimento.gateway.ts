import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnlineStatusService } from '../services/online-status.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { runWithTenant } from '../../../common/tenant/tenant-context';

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, especificar domínios permitidos
    credentials: true,
  },
  namespace: '/atendimento',
})
export class AtendimentoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AtendimentoGateway.name);
  private connectedClients = new Map<string, { userId: string; role: string; empresaId: string }>();
  private readonly DEBUG = process.env.NODE_ENV !== 'production'; // ✅ Controle de logs
  private readonly atendenteRoles = new Set([
    'atendente',
    'admin',
    'manager',
    'supervisor',
    'gestor',
    'coordenador',
    'user',
    'vendedor',
  ]);

  constructor(
    private jwtService: JwtService,
    private onlineStatusService: OnlineStatusService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  private empresaRoom(empresaId: string): string {
    return `empresa:${empresaId}`;
  }

  private atendentesRoom(empresaId: string): string {
    return `empresa:${empresaId}:atendentes`;
  }

  private ticketRoom(empresaId: string, ticketId: string): string {
    return `ticket:${empresaId}:${ticketId}`;
  }

  private extrairEmpresaId(dados: any): string | undefined {
    if (!dados || typeof dados !== 'object') return undefined;
    const empresaId = (dados as any).empresaId ?? (dados as any).empresa_id;
    if (typeof empresaId === 'string' && empresaId.trim().length > 0) return empresaId;
    if ((dados as any).ticket && typeof (dados as any).ticket === 'object') {
      const empresaTicket = (dados as any).ticket.empresaId ?? (dados as any).ticket.empresa_id;
      if (typeof empresaTicket === 'string' && empresaTicket.trim().length > 0) return empresaTicket;
    }
    return undefined;
  }

  private normalizarRole(role: unknown): string {
    return (role ?? '').toString().trim().toLowerCase();
  }

  private ehAtendenteRole(role: unknown): boolean {
    return this.atendenteRoles.has(this.normalizarRole(role));
  }

  private construirPayloadTicketAtualizado(ticketId: string, status: string, dados?: any) {
    const basePayload = {
      id: ticketId,
      ticketId,
      status,
      updatedAt: new Date(),
    };

    if (!dados || typeof dados !== 'object') {
      return { ...basePayload, ...(dados ?? {}) };
    }

    if ('id' in dados) {
      return {
        ...dados,
        id: (dados as any).id,
        ticketId: (dados as any).ticketId ?? (dados as any).id,
        status: (dados as any).status ?? status,
        updatedAt: (dados as any).updatedAt ?? basePayload.updatedAt,
      };
    }

    if ('ticket' in dados && dados.ticket && typeof dados.ticket === 'object') {
      const ticket = dados.ticket;
      if ('id' in ticket) {
        return {
          ...ticket,
          id: ticket.id,
          ticketId: ticket.ticketId ?? ticket.id,
          status: ticket.status ?? status,
          updatedAt: ticket.updatedAt ?? basePayload.updatedAt,
        };
      }
    }

    return { ...basePayload, ...dados };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONEXÃO E DESCONEXÃO
  // ═══════════════════════════════════════════════════════════════

  async handleConnection(client: Socket) {
    try {
      if (this.DEBUG) this.logger.log(`🔌 Cliente ${client.id} tentando conectar...`);

      // Extrair token do handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`❌ Cliente ${client.id} tentou conectar SEM TOKEN`);
        client.disconnect();
        return;
      }

      // Validar token JWT
      const payload = await this.jwtService.verifyAsync(token);
      const roleNormalizado = this.normalizarRole(payload.role);
      const empresaId = (payload as any).empresa_id;

      if (!empresaId || typeof empresaId !== 'string') {
        this.logger.warn(`❌ Cliente ${client.id} token sem empresa_id (User: ${payload.sub})`);
        client.disconnect();
        return;
      }
      if (this.DEBUG)
        this.logger.log(`✅ Token válido! User: ${payload.sub}, Role: ${payload.role}`);

      // Armazenar informações do cliente
      this.connectedClients.set(client.id, {
        userId: payload.sub,
        role: roleNormalizado,
        empresaId,
      });

      // Adicionar usuário a sala específica
      client.join(`user:${payload.sub}`);

      // Isolamento por empresa (room base)
      client.join(this.empresaRoom(empresaId));

      // Se for atendente, adicionar à sala de atendentes
      if (this.ehAtendenteRole(roleNormalizado)) {
        client.join(this.atendentesRoom(empresaId));
      }

      this.logger.log(
        `✅ Cliente conectado: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`,
      );

      // Notificar outros atendentes sobre novo atendente online
      if (this.ehAtendenteRole(roleNormalizado)) {
        this.server.to(this.atendentesRoom(empresaId)).emit('atendente:online', {
          userId: payload.sub,
          timestamp: new Date(),
        });
      }

      // Enviar confirmação de conexão
      client.emit('connected', {
        message: 'Conectado ao servidor de atendimento',
        clientId: client.id,
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao conectar cliente ${client.id}: ${error.message}`);
      if (this.DEBUG) this.logger.error(error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      this.logger.log(`Cliente desconectado: ${client.id} (User: ${clientInfo.userId})`);

      // Notificar outros atendentes sobre atendente offline
      if (this.ehAtendenteRole(clientInfo.role)) {
        this.server.to(this.atendentesRoom(clientInfo.empresaId)).emit('atendente:offline', {
          userId: clientInfo.userId,
          timestamp: new Date(),
        });
      }

      this.connectedClients.delete(client.id);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MENSAGENS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Notificar sala do ticket quando um participante está digitando.
   */
  @SubscribeMessage('mensagem:digitando')
  handleDigitando(
    @MessageBody() data: { ticketId: string; atendenteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      // Notificar outros participantes do ticket
      this.server.to(this.ticketRoom(clientInfo.empresaId, data.ticketId)).emit('mensagem:digitando', {
        ticketId: data.ticketId,
        userId: clientInfo.userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Nova mensagem enviada
   */
  notificarNovaMensagem(mensagem: any) {
    this.logger.log(
      `📤 Notificando nova mensagem: ticket=${mensagem.ticketId}, remetente=${mensagem.remetente?.tipo}`,
    );

    try {
      const empresaId = this.extrairEmpresaId(mensagem);
      if (!empresaId) {
        this.logger.warn(
          `⚠️ Nova mensagem sem empresaId - emit ficará limitado ao room do ticket apenas (ticket=${mensagem?.ticketId})`,
        );
      }

      // 1️⃣ SEMPRE emitir para sala do ticket (atendente que está atendendo)
      const ticketRoom = empresaId
        ? this.ticketRoom(empresaId, mensagem.ticketId)
        : `ticket:${mensagem.ticketId}`;
      this.logger.log(`   🎯 Emitindo 'nova_mensagem' para sala '${ticketRoom}'...`);
      this.server.to(ticketRoom).emit('nova_mensagem', mensagem);

      if (this.server?.sockets?.adapter) {
        this.logger.log(
          `   → Sala '${ticketRoom}': ${this.server.sockets.adapter.rooms.get(ticketRoom)?.size || 0} clientes`,
        );
      }

      // 2️⃣ Se ticket NÃO tem atendente, emitir para fila de atendentes disponíveis
      if (!mensagem.atendenteId) {
        this.logger.log(`   🎯 Ticket SEM atendente - emitindo para fila 'atendentes'...`);
        if (empresaId) {
          this.server.to(this.atendentesRoom(empresaId)).emit('mensagem:nao-atribuida', mensagem);
        }

        if (this.server?.sockets?.adapter) {
          this.logger.log(
            `   → Sala '${empresaId ? this.atendentesRoom(empresaId) : 'atendentes'}' (fila): ${empresaId ? this.server.sockets.adapter.rooms.get(this.atendentesRoom(empresaId))?.size || 0 : 0} clientes`,
          );
        }
      } else {
        // 3️⃣ Ticket COM atendente - emitir apenas para o atendente específico
        this.logger.log(
          `   ✅ Ticket COM atendente (${mensagem.atendenteId}) - notificando apenas atendente designado`,
        );

        // Emitir para sala pessoal do atendente (caso não esteja na sala do ticket)
        this.server.to(`user:${mensagem.atendenteId}`).emit('nova_mensagem', mensagem);

        if (this.server?.sockets?.adapter) {
          this.logger.log(
            `   → Sala 'user:${mensagem.atendenteId}': ${this.server.sockets.adapter.rooms.get(`user:${mensagem.atendenteId}`)?.size || 0} clientes`,
          );
        }
      }

      this.logger.log(`✅ Evento 'nova_mensagem' emitido com sucesso!`);
    } catch (error) {
      this.logger.error(`❌ Erro ao emitir evento: ${error.message}`);
      this.logger.error(error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TICKETS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Entrar na sala de um ticket específico
   */
  @SubscribeMessage('ticket:entrar')
  async handleEntrarTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo?.empresaId) {
        return { success: false, message: 'Não autenticado' };
      }

      return await runWithTenant(clientInfo.empresaId, async () => {
        const ticket = await this.ticketRepository.findOne({
          where: {
            id: data.ticketId,
            empresaId: clientInfo.empresaId,
          },
        });

        if (!ticket) {
          this.logger.warn(
            `🚫 Cliente ${client.id} tentou entrar em ticket fora do tenant (ticket=${data.ticketId}, empresa=${clientInfo.empresaId})`,
          );
          return { success: false, message: 'Ticket não encontrado' };
        }

        const roomName = this.ticketRoom(clientInfo.empresaId, data.ticketId);
        client.join(roomName);

        // 🔍 DEBUG: Verificar se realmente entrou
        const isInRoom = client.rooms.has(roomName);

        this.logger.log(`🚪 Cliente ${client.id} ENTROU no ticket ${data.ticketId}`);
        this.logger.log(`   ✅ Cliente está na sala? ${isInRoom}`);

        // Verificar adapter antes de acessar
        if (this.server?.sockets?.adapter) {
          const roomSize = this.server.sockets.adapter.rooms.get(roomName)?.size || 0;
          this.logger.log(`   📊 Total de clientes na sala: ${roomSize}`);
        }

        this.logger.log(`   🎫 Salas do cliente: ${Array.from(client.rooms).join(', ')}`);

        return { success: true, ticketId: data.ticketId };
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao entrar no ticket ${data.ticketId}: ${error.message}`);
      this.logger.error(error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sair da sala de um ticket
   */
  @SubscribeMessage('ticket:sair')
  handleSairTicket(@MessageBody() data: { ticketId: string }, @ConnectedSocket() client: Socket) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (clientInfo?.empresaId) {
        client.leave(this.ticketRoom(clientInfo.empresaId, data.ticketId));
      }
      // Fallback (compat)
      client.leave(`ticket:${data.ticketId}`);
      this.logger.log(`🚪 Cliente ${client.id} SAIU do ticket ${data.ticketId}`);
      return { success: true, ticketId: data.ticketId };
    } catch (error) {
      this.logger.error(`❌ Erro ao sair do ticket ${data.ticketId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar novo ticket criado
   */
  notificarNovoTicket(ticket: any) {
    const empresaId = this.extrairEmpresaId(ticket);
    const ticketId = ticket?.id ?? ticket?.ticketId;
    const status = (ticket?.status ?? 'aberto').toString();
    const payload = this.construirPayloadTicketAtualizado(ticketId, status, ticket);

    if (!ticketId) {
      const referencia = ticket ? JSON.stringify(ticket).slice(0, 200) : 'payload indisponível';
      this.logger.warn(`⚠️ Tentativa de notificar novo ticket sem ID válido (${referencia})`);
    }

    if (!this.server) {
      this.logger.warn('⚠️ WebSocket server ainda não inicializado - novo ticket será ignorado');
      return;
    }

    if (empresaId) {
      this.server.to(this.empresaRoom(empresaId)).emit('novo_ticket', payload);
    }

    if (this.DEBUG) {
      this.logger.log(`Novo ticket criado: ${payload.id}`);

      if (this.server.sockets?.adapter) {
        const atendentesAtivos = empresaId
          ? this.server.sockets.adapter.rooms.get(this.atendentesRoom(empresaId))?.size || 0
          : 0;
        this.logger.log(`   🎯 Evento enviado para ${atendentesAtivos} atendentes conectados`);
      }
    }
  }

  /**
   * Notificar atualização de status do ticket
   */
  notificarStatusTicket(ticketId: string, status: string, dados?: any) {
    if (!this.server) {
      this.logger.warn('⚠️ WebSocket server ainda não inicializado - atualização ignorada');
      return;
    }

    const payload = this.construirPayloadTicketAtualizado(ticketId, status, dados);
    const empresaId = this.extrairEmpresaId(payload) ?? this.extrairEmpresaId(dados);

    if (!empresaId) {
      this.logger.warn(`⚠️ notificarStatusTicket sem empresaId (ticket=${ticketId})`);
    }

    // Notificar sala do ticket
    if (empresaId) {
      this.server.to(this.ticketRoom(empresaId, ticketId)).emit('ticket:status', {
        ...payload,
        timestamp: new Date(),
      });
    }

    // Fallback (compat)
    this.server.to(`ticket:${ticketId}`).emit('ticket:status', {
      ...payload,
      timestamp: new Date(),
    });

    // Notificar clientes conectados da mesma empresa
    if (empresaId) {
      this.server.to(this.empresaRoom(empresaId)).emit('ticket_atualizado', payload);
    }

    if (this.DEBUG) {
      this.logger.log(`Status do ticket ${ticketId} atualizado para ${status}`);
    }
  }

  /**
   * Notificar atribuição de ticket a atendente
   */
  notificarAtribuicaoTicket(ticketId: string, atendenteId: string, dados?: any) {
    if (!this.server) {
      this.logger.warn('⚠️ WebSocket server ainda não inicializado - atribuição ignorada');
      return;
    }

    // Notificar atendente específico
    this.server.to(`user:${atendenteId}`).emit('ticket:atribuido', {
      ticketId,
      atendenteId,
      ...dados,
      timestamp: new Date(),
    });

    // Notificar outros atendentes
    const payload = this.construirPayloadTicketAtualizado(ticketId, 'atribuido', dados);
    const empresaId = this.extrairEmpresaId(payload) ?? this.extrairEmpresaId(dados);

    if (empresaId) {
      this.server.to(this.empresaRoom(empresaId)).emit('ticket_atualizado', {
        ticketId,
        atendenteId,
        status: 'atribuido',
        ...payload,
      });
    }

    if (this.DEBUG) {
      this.logger.log(`Ticket ${ticketId} atribuído ao atendente ${atendenteId}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICAÇÕES GERAIS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Enviar notificação para usuário específico
   */
  notificarUsuario(userId: string, tipo: string, dados: any) {
    this.server.to(`user:${userId}`).emit('notificacao', {
      tipo,
      dados,
      timestamp: new Date(),
    });

    if (this.DEBUG) {
      this.logger.log(`Notificação enviada ao usuário ${userId}: ${tipo}`);
    }
  }

  /**
   * Enviar notificação para todos os atendentes
   */
  notificarAtendentes(empresaId: string, tipo: string, dados: any) {
    this.server.to(this.atendentesRoom(empresaId)).emit('notificacao', {
      tipo,
      dados,
      timestamp: new Date(),
    });

    if (this.DEBUG) {
      this.logger.log(`Notificação enviada a todos atendentes (${empresaId}): ${tipo}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS DE ATENDENTES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Atualizar status do atendente (online, ocupado, ausente, offline)
   */
  @SubscribeMessage('atendente:status')
  handleAtendenteStatus(
    @MessageBody() data: { status: string },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo && this.ehAtendenteRole(clientInfo.role)) {
      // Notificar outros atendentes sobre mudança de status
      this.server.to(this.atendentesRoom(clientInfo.empresaId)).emit('atendente:status:atualizado', {
        userId: clientInfo.userId,
        status: data.status,
        timestamp: new Date(),
      });

      if (this.DEBUG) {
        this.logger.log(`Atendente ${clientInfo.userId} mudou status para ${data.status}`);
      }

      return { success: true, status: data.status };
    }

    return { success: false, message: 'Não autorizado' };
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS ONLINE/OFFLINE DE CONTATOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Notificar mudança de status online de um contato
   */
  async notificarMudancaStatusContato(
    contatoId: number,
    empresaId: string,
    isOnline: boolean,
    lastActivity?: Date,
  ) {
    const statusData = {
      contatoId,
      isOnline,
      lastActivity,
      timestamp: new Date(),
    };

    // Notificar todos os atendentes da mesma empresa sobre a mudança de status
    this.server.to(this.atendentesRoom(empresaId)).emit('contato:status:atualizado', statusData);

    if (this.DEBUG) {
      this.logger.log(
        `📱 Status do contato ${contatoId} atualizado (empresa=${empresaId}): ${isOnline ? 'ONLINE' : 'OFFLINE'}`,
      );
    }
  }

  /**
   * Solicitar status online de um contato específico
   */
  @SubscribeMessage('contato:status:verificar')
  async handleVerificarStatusContato(
    @MessageBody() data: { contatoId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);

      if (!clientInfo || !this.ehAtendenteRole(clientInfo.role)) {
        return { success: false, message: 'Não autorizado' };
      }

      // Buscar dados do contato para obter última atividade
      const contato = await this.onlineStatusService.getContactActivityData(
        data.contatoId,
        clientInfo.empresaId,
      );
      const isOnline = this.onlineStatusService.calculateOnlineStatus(
        contato?.last_activity || null,
      );

      // Responder apenas para o cliente que solicitou
      client.emit('contato:status:resposta', {
        contatoId: data.contatoId,
        isOnline,
        lastActivity: contato?.last_activity,
        timestamp: new Date(),
      });

      return { success: true, contatoId: data.contatoId, isOnline };
    } catch (error) {
      this.logger.error(`Erro ao verificar status do contato ${data.contatoId}:`, error);
      return { success: false, message: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualizar atividade de um contato (chamado quando contato interage)
   */
  async atualizarAtividadeContato(
    contatoId: number,
    empresaId: string,
    tipoInteracao: string = 'mensagem',
  ) {
    try {
      // Atualizar atividade no banco
      await this.onlineStatusService.updateContactActivity(contatoId.toString(), empresaId);

      // Buscar dados atualizados e verificar status
      const contato = await this.onlineStatusService.getContactActivityData(contatoId, empresaId);
      const isOnline = this.onlineStatusService.calculateOnlineStatus(
        contato?.last_activity || null,
      );

      // Notificar mudança de status
      const statusData = {
        contatoId,
        isOnline,
        lastActivity: contato?.last_activity || undefined,
        timestamp: new Date(),
      };

      this.server
        .to(this.atendentesRoom(empresaId))
        .emit('contato:status:atualizado', statusData);

      if (this.DEBUG) {
        this.logger.log(
          `🔄 Atividade atualizada para contato ${contatoId} (${tipoInteracao}): ${isOnline ? 'ONLINE' : 'OFFLINE'}`,
        );
      }
    } catch (error) {
      this.logger.error(`Erro ao atualizar atividade do contato ${contatoId}:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obter número de clientes conectados
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obter lista de atendentes online
   */
  getAtendentesOnline(): string[] {
    const atendentes: string[] = [];
    this.connectedClients.forEach((info) => {
      if (this.ehAtendenteRole(info.role)) {
        atendentes.push(info.userId);
      }
    });
    return atendentes;
  }
}
