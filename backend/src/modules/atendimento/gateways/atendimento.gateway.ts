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

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, especificar domínios permitidos
    credentials: true,
  },
  namespace: '/atendimento',
})
export class AtendimentoGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AtendimentoGateway.name);
  private connectedClients = new Map<string, { userId: string; role: string }>();

  constructor(private jwtService: JwtService) { }

  // ═══════════════════════════════════════════════════════════════
  // CONEXÃO E DESCONEXÃO
  // ═══════════════════════════════════════════════════════════════

  async handleConnection(client: Socket) {
    try {
      // Extrair token do handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Cliente ${client.id} tentou conectar sem token`);
        client.disconnect();
        return;
      }

      // Validar token JWT
      const payload = await this.jwtService.verifyAsync(token);

      // Armazenar informações do cliente
      this.connectedClients.set(client.id, {
        userId: payload.sub,
        role: payload.role,
      });

      // Adicionar usuário a sala específica
      client.join(`user:${payload.sub}`);

      // Se for atendente, adicionar à sala de atendentes
      if (payload.role === 'atendente' || payload.role === 'admin') {
        client.join('atendentes');
      }

      this.logger.log(`Cliente conectado: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`);

      // Notificar outros atendentes sobre novo atendente online
      if (payload.role === 'atendente') {
        this.server.to('atendentes').emit('atendente:online', {
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
      this.logger.error(`Erro ao conectar cliente ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      this.logger.log(`Cliente desconectado: ${client.id} (User: ${clientInfo.userId})`);

      // Notificar outros atendentes sobre atendente offline
      if (clientInfo.role === 'atendente') {
        this.server.to('atendentes').emit('atendente:offline', {
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
   * Cliente está digitando
   */
  @SubscribeMessage('mensagem:digitando')
  handleDigitando(
    @MessageBody() data: { ticketId: string; atendenteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      // Notificar outros participantes do ticket
      this.server.to(`ticket:${data.ticketId}`).emit('mensagem:digitando', {
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
    // Notificar sala do ticket
    this.server.to(`ticket:${mensagem.ticketId}`).emit('mensagem:nova', mensagem);

    // Notificar atendentes disponíveis se ticket não tiver atendente
    if (!mensagem.atendenteId) {
      this.server.to('atendentes').emit('mensagem:nao-atribuida', mensagem);
    }

    this.logger.log(`Nova mensagem notificada no ticket ${mensagem.ticketId}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TICKETS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Entrar na sala de um ticket específico
   */
  @SubscribeMessage('ticket:entrar')
  handleEntrarTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ticket:${data.ticketId}`);
    this.logger.log(`Cliente ${client.id} entrou no ticket ${data.ticketId}`);

    return { success: true, ticketId: data.ticketId };
  }

  /**
   * Sair da sala de um ticket
   */
  @SubscribeMessage('ticket:sair')
  handleSairTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`ticket:${data.ticketId}`);
    this.logger.log(`Cliente ${client.id} saiu do ticket ${data.ticketId}`);

    return { success: true, ticketId: data.ticketId };
  }

  /**
   * Notificar novo ticket criado
   */
  notificarNovoTicket(ticket: any) {
    // Notificar todos os atendentes
    this.server.to('atendentes').emit('ticket:novo', ticket);

    this.logger.log(`Novo ticket criado: ${ticket.id}`);
  }

  /**
   * Notificar atualização de status do ticket
   */
  notificarStatusTicket(ticketId: string, status: string, dados?: any) {
    // Notificar sala do ticket
    this.server.to(`ticket:${ticketId}`).emit('ticket:status', {
      ticketId,
      status,
      ...dados,
      timestamp: new Date(),
    });

    // Notificar atendentes
    this.server.to('atendentes').emit('ticket:atualizado', {
      ticketId,
      status,
      ...dados,
    });

    this.logger.log(`Status do ticket ${ticketId} atualizado para ${status}`);
  }

  /**
   * Notificar atribuição de ticket a atendente
   */
  notificarAtribuicaoTicket(ticketId: string, atendenteId: string, dados?: any) {
    // Notificar atendente específico
    this.server.to(`user:${atendenteId}`).emit('ticket:atribuido', {
      ticketId,
      atendenteId,
      ...dados,
      timestamp: new Date(),
    });

    // Notificar outros atendentes
    this.server.to('atendentes').emit('ticket:atualizado', {
      ticketId,
      atendenteId,
      status: 'atribuido',
      ...dados,
    });

    this.logger.log(`Ticket ${ticketId} atribuído ao atendente ${atendenteId}`);
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

    this.logger.log(`Notificação enviada ao usuário ${userId}: ${tipo}`);
  }

  /**
   * Enviar notificação para todos os atendentes
   */
  notificarAtendentes(tipo: string, dados: any) {
    this.server.to('atendentes').emit('notificacao', {
      tipo,
      dados,
      timestamp: new Date(),
    });

    this.logger.log(`Notificação enviada a todos atendentes: ${tipo}`);
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

    if (clientInfo && clientInfo.role === 'atendente') {
      // Notificar outros atendentes sobre mudança de status
      this.server.to('atendentes').emit('atendente:status:atualizado', {
        userId: clientInfo.userId,
        status: data.status,
        timestamp: new Date(),
      });

      this.logger.log(`Atendente ${clientInfo.userId} mudou status para ${data.status}`);

      return { success: true, status: data.status };
    }

    return { success: false, message: 'Não autorizado' };
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
      if (info.role === 'atendente') {
        atendentes.push(info.userId);
      }
    });
    return atendentes;
  }
}
