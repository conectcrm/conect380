import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets, Not } from 'typeorm';
import {
  Ticket,
  StatusTicket,
  TipoTicket,
  PrioridadeTicket,
  OrigemTicket,
  SeveridadeTicket,
  NivelAtendimentoTicket,
} from '../entities/ticket.entity';
import { Mensagem, RemetenteMensagem } from '../entities/mensagem.entity';
import { SessaoTriagem, ResultadoSessao } from '../../triagem/entities/sessao-triagem.entity';
import { Evento, TipoEvento } from '../../eventos/evento.entity';
import { Contato } from '../../clientes/contato.entity';
import { User } from '../../users/user.entity';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { AtribuicaoService } from '../../triagem/services/atribuicao.service';
import { MensagemService } from './mensagem.service';
import {
  validarTransicaoStatus,
  gerarMensagemErroTransicao,
  obterDescricaoTransicao,
} from '../utils/status-validator';
import { notifyByPolicy } from '../../../notifications/channel-notifier';
import { ChannelPolicyKey } from '../../../notifications/channel-policy';
import { NotificationChannelsService } from '../../../notifications/notification-channels.service';
// 🔍 OpenTelemetry imports
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { withSpan, addAttributes, recordException } from '../../../common/tracing/tracing.helpers';
// 📊 Prometheus metrics imports
import {
  ticketsCriadosTotal,
  ticketsEncerradosTotal,
  ticketsTransferidosTotal,
  ticketTempoVidaHistogram,
  MetricTimer,
  incrementCounter,
  observeHistogram,
} from '../../../config/metrics';

export interface CriarTicketDto {
  empresaId: string;
  canalId: string;
  clienteNumero: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteFoto?: string;
  assunto?: string;
  descricao?: string;
  origem: string;
  prioridade?: string;
  metadata?: Record<string, any>;
}

export interface BuscarOuCriarTicketDto {
  empresaId: string;
  canalId: string;
  clienteNumero: string;
  clienteNome?: string;
  clienteFoto?: string;
  assunto?: string;
  origem?: string;
}

export interface FiltrarTicketsDto {
  empresaId: string;
  status?: string[];
  canalId?: string;
  filaId?: string;
  atendenteId?: string;
  prioridade?: string;
  tipo?: TipoTicket; // 🆕 Filtro para unificação Tickets+Demandas
  limite?: number;
  pagina?: number;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Mensagem)
    private mensagemRepository: Repository<Mensagem>,
    @InjectRepository(SessaoTriagem)
    private sessaoTriagemRepository: Repository<SessaoTriagem>,
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,
    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly atendimentoGateway: AtendimentoGateway,
    private readonly whatsAppSenderService: WhatsAppSenderService,
    private readonly mensagemService: MensagemService,
    @Inject(forwardRef(() => AtribuicaoService))
    private readonly atribuicaoService: AtribuicaoService,
    private readonly notificationChannels: NotificationChannelsService,
  ) { }

  private readonly highPriorityPolicy: ChannelPolicyKey = 'ticket-priority-high';
  private readonly escalationPolicy: ChannelPolicyKey = 'ticket-escalation';
  private readonly adminAlertPhone = process.env.NOTIFICATIONS_ADMIN_PHONE?.trim();

  /**
   * Busca contato completo com relação cliente pelo telefone
   * Normaliza o telefone para buscar (remove caracteres especiais)
   * Busca pelos últimos 8 dígitos para ignorar diferenças de código de país, DDD e dígito 9
   */
  private async buscarContatoPorTelefone(telefone: string): Promise<Contato | null> {
    if (!telefone) return null;

    try {
      // Normalizar telefone (remover caracteres especiais)
      const telefoneNormalizado = telefone.replace(/\D/g, '');

      this.logger.debug(`🔍 Buscando contato com telefone normalizado: ${telefoneNormalizado}`);

      // Extrair últimos 8 dígitos do número (ignora código país, DDD e dígito 9)
      const ultimosDigitos = telefoneNormalizado.slice(-8);

      this.logger.debug(`🔍 Buscando pelos últimos 8 dígitos: ${ultimosDigitos}`);

      // Buscar contato usando QueryBuilder com LIKE para flexibilizar a busca
      // (permite buscar mesmo com +, -, espaços, etc no banco)
      const contato = await this.contatoRepository
        .createQueryBuilder('contato')
        .leftJoinAndSelect('contato.cliente', 'cliente')
        .where('contato.ativo = :ativo', { ativo: true })
        .andWhere(
          `REPLACE(REPLACE(REPLACE(REPLACE(contato.telefone, '+', ''), '-', ''), ' ', ''), '(', '') LIKE :telefone`,
          { telefone: `%${ultimosDigitos}` },
        )
        .getOne();

      if (contato) {
        this.logger.debug(
          `✅ Contato encontrado: ${contato.nome} (ID: ${contato.id}, Cliente: ${contato.cliente?.nome || 'SEM CLIENTE'})`,
        );
      } else {
        this.logger.debug(
          `❌ NENHUM contato encontrado para telefone: ${telefoneNormalizado} (últimos 8: ${ultimosDigitos})`,
        );
      }

      return contato;
    } catch (error) {
      this.logger.error(`Erro ao buscar contato por telefone: ${error.message}`);
      return null;
    }
  }

  private isHighPriority(prioridade?: string | null): boolean {
    if (!prioridade) return false;
    const normalized = prioridade.toString().toUpperCase();
    return normalized === PrioridadeTicket.ALTA || normalized === PrioridadeTicket.URGENTE;
  }

  private getAdminPhone(): string | undefined {
    const raw = this.adminAlertPhone;
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return undefined;
    return raw;
  }

  private async tentarNotificarPrioridadeAlta(ticket: Ticket): Promise<void> {
    try {
      if (!this.isHighPriority(ticket?.prioridade)) return;

      const phone = this.getAdminPhone();
      if (!phone) {
        this.logger.debug('[Ticket] NOTIFICATIONS_ADMIN_PHONE ausente; alerta externo não enviado');
        return;
      }

      const numero = ticket.numero ? `#${ticket.numero}` : ticket.id?.slice(0, 8) || 'ticket';
      const assunto = ticket.assunto || 'Ticket prioritário';
      const message = `Ticket ${numero} prioridade ${ticket.prioridade}: ${assunto}`.slice(0, 280);

      await notifyByPolicy({
        policyKey: this.escalationPolicy,
        channels: this.notificationChannels,
        logger: this.logger,
        targets: { phone },
        message,
        context: {
          source: 'ticket-priority-high',
          ticketId: ticket.id,
          prioridade: ticket.prioridade,
          numero: ticket.numero,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar prioridade alta do ticket ${ticket?.id || 'desconhecido'}: ${error?.message || error}`,
      );
    }
  }

  private async notificarEscalacao(ticket: Ticket, level: NivelAtendimentoTicket, reason: string): Promise<void> {
    try {
      const phone = this.getAdminPhone();
      if (!phone) {
        this.logger.debug('[Ticket] NOTIFICATIONS_ADMIN_PHONE ausente; alerta de escalonamento não enviado');
        return;
      }

      const numero = ticket.numero ? `#${ticket.numero}` : ticket.id?.slice(0, 8) || 'ticket';
      const assunto = ticket.assunto || 'Ticket escalonado';
      const message = `Ticket ${numero} escalonado para ${level}: ${assunto} (motivo: ${reason})`.slice(0, 280);

      await notifyByPolicy({
        policyKey: this.highPriorityPolicy,
        channels: this.notificationChannels,
        logger: this.logger,
        targets: { phone },
        message,
        context: {
          source: 'ticket-escalation',
          ticketId: ticket.id,
          level,
          reason,
          numero: ticket.numero,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar escalonamento do ticket ${ticket?.id || 'desconhecido'}: ${error?.message || error}`,
      );
    }
  }

  private resolverSlaExpiration(slaTargetMinutes?: number, slaExpiresAt?: Date | string | null): Date | undefined {
    if (slaTargetMinutes && slaTargetMinutes > 0) {
      return new Date(Date.now() + slaTargetMinutes * 60 * 1000);
    }

    if (slaExpiresAt) {
      const data = new Date(slaExpiresAt);
      if (!Number.isNaN(data.getTime())) {
        return data;
      }
    }

    return undefined;
  }

  private calcularTempoAtendimento(ticket: Ticket): number {
    if (!ticket?.data_abertura) {
      return 0;
    }

    const inicioMs = new Date(ticket.data_abertura).getTime();
    if (Number.isNaN(inicioMs)) {
      return 0;
    }

    const statusNormalizado =
      typeof ticket.status === 'string' ? ticket.status.toUpperCase() : undefined;

    const status = (statusNormalizado as StatusTicket) || StatusTicket.FILA;
    const encerrado = status === StatusTicket.ENCERRADO;

    let fimMs: number | undefined;

    if (encerrado) {
      const candidatos: (Date | null | undefined)[] =
        status === StatusTicket.ENCERRADO
          ? [ticket.data_fechamento, ticket.data_resolucao]
          : [ticket.data_resolucao, ticket.data_fechamento];

      candidatos.push(ticket.updatedAt);

      for (const candidato of candidatos) {
        if (!candidato) {
          continue;
        }

        const valor = new Date(candidato).getTime();
        if (!Number.isNaN(valor)) {
          fimMs = valor;
          break;
        }
      }
    }

    if (!fimMs) {
      fimMs = Date.now();
    }

    return Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
  }

  /**
   * Busca ou cria um ticket ativo para o cliente
   * Usado pelo webhook para garantir que cada cliente tenha um ticket ativo
   */
  async buscarOuCriarTicket(dados: BuscarOuCriarTicketDto): Promise<Ticket> {
    return withSpan('ticket.buscarOuCriar', async (span) => {
      // 📊 Adicionar atributos para rastreamento
      addAttributes(span, {
        'ticket.empresaId': dados.empresaId,
        'ticket.canalId': dados.canalId,
        'ticket.clienteNumero': dados.clienteNumero,
        'ticket.clienteNome': dados.clienteNome || 'unknown',
      });

      this.logger.log(`🔍 Buscando ticket para cliente: ${dados.clienteNumero}`);

      // 1. Buscar ticket aberto/em atendimento/aguardando do cliente neste canal
      // 🔧 FIX: Incluir TODOS os status ativos, não apenas ABERTO/EM_ATENDIMENTO/AGUARDANDO
      // Um ticket com atendente designado NÃO deve criar novo ticket!
      let ticket = await this.ticketRepository.findOne({
        where: {
          empresaId: dados.empresaId,
          canalId: dados.canalId,
          contatoTelefone: dados.clienteNumero,
          status: In([StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO, StatusTicket.ENVIO_ATIVO]),
        },
        order: { createdAt: 'DESC' },
      });

      // 🔧 Se não encontrou com status padrão, buscar qualquer ticket NÃO FECHADO/RESOLVIDO
      // Isso garante que tickets com atendente designado sejam encontrados
      if (!ticket) {
        this.logger.log(`🔍 Ticket não encontrado com status padrão, buscando tickets ativos...`);

        ticket = await this.ticketRepository.findOne({
          where: {
            empresaId: dados.empresaId,
            canalId: dados.canalId,
            contatoTelefone: dados.clienteNumero,
            status: Not(In([StatusTicket.ENCERRADO, StatusTicket.ENCERRADO])),
          },
          order: { createdAt: 'DESC' },
        });

        if (ticket) {
          this.logger.log(
            `✅ Encontrado ticket ativo com status ${ticket.status} (ID: ${ticket.id})`,
          );
          addAttributes(span, {
            'ticket.found': true,
            'ticket.id': ticket.id,
            'ticket.status': ticket.status,
            'ticket.searchType': 'fallback-active',
          });
        }
      } else {
        addAttributes(span, {
          'ticket.found': true,
          'ticket.id': ticket.id,
          'ticket.status': ticket.status,
          'ticket.searchType': 'standard',
        });
      }

      // 2. Se não existir, criar novo ticket
      if (!ticket) {
        addAttributes(span, { 'ticket.found': false, 'ticket.action': 'create' });
        this.logger.log(`✨ Criando novo ticket para ${dados.clienteNumero}`); ticket = this.ticketRepository.create({
          empresaId: dados.empresaId,
          canalId: dados.canalId,
          contatoTelefone: dados.clienteNumero,
          contatoNome: dados.clienteNome || dados.clienteNumero,
          contatoFoto: dados.clienteFoto || null,
          assunto: dados.assunto || 'Novo atendimento via WhatsApp',
          status: StatusTicket.FILA,
          prioridade: PrioridadeTicket.MEDIA,
          data_abertura: new Date(),
          ultima_mensagem_em: new Date(),
        });

        ticket = await this.ticketRepository.save(ticket);

        // 🔧 FALLBACK: Se trigger não gerou número, gerar manualmente
        if (!ticket.numero) {
          this.logger.warn(`⚠️ Trigger não gerou número - gerando manualmente`);
          const ultimoTicket = await this.ticketRepository
            .createQueryBuilder('ticket')
            .where('ticket.empresaId = :empresaId', { empresaId: dados.empresaId })
            .andWhere('ticket.numero IS NOT NULL')
            .orderBy('ticket.numero', 'DESC')
            .getOne();

          ticket.numero = (ultimoTicket?.numero || 0) + 1;
          ticket = await this.ticketRepository.save(ticket);
          this.logger.log(`🔢 Número gerado manualmente: ${ticket.numero}`);
        }

        this.logger.log(`✅ Ticket criado: ${ticket.id} (Número: ${ticket.numero})`);
        addAttributes(span, { 'ticket.numero': ticket.numero, 'ticket.created': true });

        // 📊 Incrementar métrica de tickets criados
        incrementCounter(ticketsCriadosTotal, {
          empresaId: dados.empresaId,
          canalId: dados.canalId || 'unknown',
          departamentoId: 'none',
          origem: 'webhook',
        });

        // 🔔 Notificar sidebar em tempo real sobre novo ticket
        this.atendimentoGateway.notificarNovoTicket(ticket);
        this.atendimentoGateway.notificarStatusTicket(ticket.id, ticket.status, ticket);

        void this.tentarNotificarPrioridadeAlta(ticket);
      } else {
        // 3. Se já existe, atualizar última interação
        addAttributes(span, { 'ticket.action': 'update' });
        ticket.ultima_mensagem_em = new Date();
        if (dados.clienteFoto && dados.clienteFoto !== ticket.contatoFoto) {
          ticket.contatoFoto = dados.clienteFoto;
        }
        ticket = await this.ticketRepository.save(ticket);

        // 🔧 FALLBACK: Se ticket existente não tem número, gerar agora
        if (!ticket.numero) {
          this.logger.warn(`⚠️ Ticket existente sem número - gerando agora`);
          const ultimoTicket = await this.ticketRepository
            .createQueryBuilder('ticket')
            .where('ticket.empresaId = :empresaId', { empresaId: dados.empresaId })
            .andWhere('ticket.numero IS NOT NULL')
            .orderBy('ticket.numero', 'DESC')
            .getOne();

          ticket.numero = (ultimoTicket?.numero || 0) + 1;
          ticket = await this.ticketRepository.save(ticket);
          this.logger.log(`🔢 Número gerado: ${ticket.numero}`);
        }

        this.logger.log(`♻️ Ticket existente atualizado: ${ticket.id} (Número: ${ticket.numero})`);

        // 🔄 Atualizar card na sidebar em tempo real
        this.atendimentoGateway.notificarStatusTicket(ticket.id, ticket.status, ticket);
      }

      // ✅ Marcar span como bem-sucedido
      span.setStatus({ code: SpanStatusCode.OK });
      addAttributes(span, { 'ticket.finalId': ticket.id, 'ticket.finalStatus': ticket.status });

      return ticket;
    });
  }

  /**
   * Cria um novo ticket diretamente para triagem (sem buscar existente)
   * Usado pelo bot de triagem após departamento selecionado
   */
  async criarParaTriagem(dados: {
    contatoId?: string;
    contatoTelefone?: string; // 🆕 Fallback quando não há contatoId
    contatoNome?: string; // 🆕 Fallback quando não há contatoId
    departamentoId?: string;
    nucleoId?: string;
    empresaId: string;
    canalOrigem: string;
    prioridade: string;
    assunto: string;
    descricao?: string;
  }): Promise<any> {
    return withSpan('ticket.criarParaTriagem', async (span) => {
      addAttributes(span, {
        'ticket.empresaId': dados.empresaId,
        'ticket.departamentoId': dados.departamentoId || 'none',
        'ticket.nucleoId': dados.nucleoId || 'none',
        'ticket.contatoId': dados.contatoId || 'none',
        'ticket.prioridade': dados.prioridade,
      });

      this.logger.log(
        `➕ Criando ticket para: ${dados.contatoId || dados.contatoTelefone || 'contato não especificado'}`,
      );

      // Buscar contato se fornecido
      let contato: Contato | null = null;
      if (dados.contatoId) {
        contato = await this.contatoRepository.findOne({
          where: { id: dados.contatoId },
          relations: ['cliente'],
        });

        if (contato) {
          this.logger.log(`✅ Contato encontrado no banco: ${contato.nome} (${contato.telefone})`);
        }
      }

      // 🆕 Se não tem contato mas tem telefone/nome, usar os dados fornecidos
      const telefone = contato?.telefone || dados.contatoTelefone || null;
      const nome = contato?.nome || dados.contatoNome || null;

      if (!contato && (dados.contatoTelefone || dados.contatoNome)) {
        this.logger.log(`⚠️ Ticket sem vínculo de contato - usando: ${nome} (${telefone})`);
      }

      // Criar ticket
      const ticket = this.ticketRepository.create({
        empresaId: dados.empresaId,
        contatoTelefone: telefone,
        contatoNome: nome,
        contatoFoto: null, // Contato não tem campo foto
        assunto: dados.assunto,
        status: 'ABERTO' as any,
        prioridade: dados.prioridade as any,
        data_abertura: new Date(),
        ultima_mensagem_em: new Date(),
      });

      let ticketSalvo = await this.ticketRepository.save(ticket);

      // Gerar número se não foi gerado automaticamente
      if (!ticketSalvo.numero) {
        this.logger.warn(`⚠️ Trigger não gerou número - gerando manualmente`);
        const ultimoTicket = await this.ticketRepository
          .createQueryBuilder('ticket')
          .where('ticket.empresaId = :empresaId', { empresaId: dados.empresaId })
          .andWhere('ticket.numero IS NOT NULL')
          .orderBy('ticket.numero', 'DESC')
          .getOne();

        ticketSalvo.numero = (ultimoTicket?.numero || 0) + 1;
        ticketSalvo = await this.ticketRepository.save(ticketSalvo);
        this.logger.log(`🔢 Número gerado manualmente: ${ticketSalvo.numero}`);
      }

      this.logger.log(`✅ Ticket criado: ${ticketSalvo.id} (Número: ${ticketSalvo.numero})`);
      addAttributes(span, { 'ticket.id': ticketSalvo.id, 'ticket.numero': ticketSalvo.numero });

      // 📊 Incrementar métrica de tickets criados
      incrementCounter(ticketsCriadosTotal, {
        empresaId: dados.empresaId,
        canalId: dados.canalOrigem || 'unknown',
        departamentoId: dados.departamentoId || 'none',
        origem: 'triagem-bot',
      });

      // 🤖 ATRIBUIÇÃO AUTOMÁTICA DE ATENDENTE
      let atendenteInfo: { id: string; nome: string } | null = null;
      if (dados.departamentoId || dados.nucleoId) {
        try {
          atendenteInfo = await this.atribuirAutomaticamente(
            ticketSalvo.id,
            dados.empresaId,
            dados.departamentoId,
            dados.nucleoId,
          );

          if (atendenteInfo) {
            ticketSalvo.atendenteId = atendenteInfo.id;
            this.logger.log(
              `👤 Atendente atribuído automaticamente: ${atendenteInfo.nome} (${atendenteInfo.id})`,
            );
            addAttributes(span, {
              'ticket.atendenteId': atendenteInfo.id,
              'ticket.atendenteNome': atendenteInfo.nome,
            });
          } else {
            this.logger.warn(
              `⚠️ Nenhum atendente disponível para departamento ${dados.departamentoId} / núcleo ${dados.nucleoId}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Erro ao atribuir atendente automaticamente: ${error.message}`,
            error.stack,
          );
        }
      }

      // 🔔 Notificar sidebar em tempo real sobre novo ticket
      this.atendimentoGateway.notificarNovoTicket(ticketSalvo);
      this.atendimentoGateway.notificarStatusTicket(ticketSalvo.id, ticketSalvo.status, ticketSalvo);

      // ✅ Marcar span como bem-sucedido
      span.setStatus({ code: SpanStatusCode.OK });

      // Adicionar informações do atendente ao retorno
      return {
        ...ticketSalvo,
        atendenteNome: atendenteInfo?.nome || null,
      };
    });
  }

  /**
   * Busca ticket por ID
   * 🆕 Popula relações User (autor, responsavel) para unificação
   */
  async buscarPorId(id: string, empresaId?: string): Promise<Ticket> {
    const where: any = { id };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const ticket = await this.ticketRepository.findOne({
      where,
      relations: ['autor', 'responsavel'], // 🆕 Carregar relações User
      // Removido relations temporariamente - relações não definidas na entity
      // relations: ['canal', 'atendente', 'fila', 'autor', 'responsavel'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} não encontrado`);
    }

    // Adicionar campos calculados + contato completo
    const [mensagensNaoLidas, totalMensagens, ultimaMensagemObj, contatoCompleto] =
      await Promise.all([
        this.contarMensagensNaoLidas(ticket.id),
        this.contarMensagens(ticket.id),
        this.mensagemRepository.findOne({
          where: { ticketId: ticket.id },
          order: { createdAt: 'DESC' },
        }),
        // 🔍 BUSCAR CONTATO COMPLETO COM CLIENTE VINCULADO
        this.buscarContatoPorTelefone(ticket.contatoTelefone),
      ]);

    // Calcular tempo de atendimento em segundos
    const tempoAtendimento = this.calcularTempoAtendimento(ticket);

    // 🎯 MONTAR OBJETO CONTATO PARA FRONTEND
    // ⚠️ LEFT JOIN garante que query funciona mesmo se cliente foi deletado
    // Optional chaining (?.) retorna undefined se cliente não existe
    // Fallback (|| null) garante valor null consistente para frontend
    const clienteVinculado = contatoCompleto?.cliente || null;

    const contato = {
      id: contatoCompleto?.id || null, // ← ID do contato
      nome: contatoCompleto?.nome || ticket.contatoNome || 'Sem nome', // ← NOME DO SISTEMA (prioridade) ou WhatsApp (fallback)
      telefone: ticket.contatoTelefone || '',
      email: contatoCompleto?.email || null, // ← E-MAIL DO CONTATO
      foto: ticket.contatoFoto || null,
      clienteVinculado, // ← null se cliente foi deletado (sem erro!)
    };

    return {
      ...ticket,
      contato, // ← Adicionar objeto contato completo
      mensagensNaoLidas,
      totalMensagens,
      ultimaMensagem: ultimaMensagemObj?.conteudo || 'Sem mensagens',
      tempoAtendimento,
    } as any;
  }

  /**
   * Lista tickets com filtros
   */
  async listar(filtros: FiltrarTicketsDto): Promise<{ tickets: Ticket[]; total: number }> {
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      // Removido leftJoinAndSelect temporariamente - relações não definidas na entity
      // .leftJoinAndSelect('ticket.canal', 'canal')
      // .leftJoinAndSelect('ticket.atendente', 'atendente')
      // .leftJoinAndSelect('ticket.fila', 'fila')
      .where('ticket.empresaId = :empresaId', { empresaId: filtros.empresaId });

    // ✅ CORREÇÃO: Filtros opcionais de status com fallback inteligente
    if (filtros.status && filtros.status.length > 0) {
      // Se status foi especificado, usar filtro exato
      queryBuilder.andWhere('ticket.status IN (:...status)', { status: filtros.status });
    } else {
      // ✅ Se status NÃO foi especificado, excluir apenas tickets FECHADOS
      // Isso garante que tickets novos (ABERTO, EM_ATENDIMENTO, AGUARDANDO, etc) apareçam
      queryBuilder.andWhere('ticket.status != :statusFechado', {
        statusFechado: StatusTicket.ENCERRADO,
      });
    }

    if (filtros.canalId) {
      queryBuilder.andWhere('ticket.canalId = :canalId', { canalId: filtros.canalId });
    }

    if (filtros.filaId) {
      queryBuilder.andWhere('ticket.filaId = :filaId', { filaId: filtros.filaId });
    }

    if (filtros.atendenteId) {
      queryBuilder.andWhere('ticket.atendenteId = :atendenteId', {
        atendenteId: filtros.atendenteId,
      });
    }

    if (filtros.prioridade) {
      queryBuilder.andWhere('ticket.prioridade = :prioridade', {
        prioridade: filtros.prioridade,
      });
    }

    // 🆕 Filtro por tipo (suporte à unificação Tickets+Demandas)
    if (filtros.tipo) {
      queryBuilder.andWhere('ticket.tipo = :tipo', {
        tipo: filtros.tipo,
      });
    }

    // Ordenação
    queryBuilder.orderBy('ticket.ultima_mensagem_em', 'DESC');

    // Paginação
    const limite = filtros.limite || 50;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    const [tickets, total] = await queryBuilder.take(limite).skip(skip).getManyAndCount();

    // 🔍 DEBUG: Log dos tickets retornados
    this.logger.debug(
      `🔍 Tickets retornados: ${tickets.map((t) => `#${t.numero} (${t.id.substring(0, 8)}..., status: ${t.status}, tel: ${t.contatoTelefone})`).join(' | ')}`,
    );

    // ✨ ADICIONAR CAMPOS CALCULADOS + CONTATO COMPLETO
    const ticketsComCampos = await Promise.all(
      tickets.map(async (ticket) => {
        const [mensagensNaoLidas, totalMensagens, ultimaMensagemObj, contatoCompleto] =
          await Promise.all([
            this.contarMensagensNaoLidas(ticket.id),
            this.contarMensagens(ticket.id),
            this.mensagemRepository.findOne({
              where: { ticketId: ticket.id },
              order: { createdAt: 'DESC' },
            }),
            // 🔍 BUSCAR CONTATO COMPLETO COM CLIENTE VINCULADO
            this.buscarContatoPorTelefone(ticket.contatoTelefone),
          ]);

        // Calcular tempo de atendimento em segundos
        const tempoAtendimento = this.calcularTempoAtendimento(ticket);

        // 🎯 MONTAR OBJETO CONTATO PARA FRONTEND
        // ⚠️ LEFT JOIN garante que query funciona mesmo se cliente foi deletado
        // Optional chaining (?.) retorna undefined se cliente não existe
        // Fallback (|| null) garante valor null consistente para frontend
        const clienteVinculado = contatoCompleto?.cliente || null;

        const contato = {
          id: contatoCompleto?.id || null, // ← ID do contato
          nome: contatoCompleto?.nome || ticket.contatoNome || 'Sem nome', // ← NOME DO SISTEMA (prioridade) ou WhatsApp (fallback)
          telefone: ticket.contatoTelefone || '',
          email: contatoCompleto?.email || null, // ← E-MAIL DO CONTATO
          foto: ticket.contatoFoto || null,
          clienteVinculado, // ← null se cliente foi deletado (sem erro!)
        };

        // 🔍 DEBUG: Ver o que está sendo retornado
        if (contatoCompleto) {
          if (clienteVinculado) {
            this.logger.debug(
              `✅ Contato encontrado para ticket ${ticket.id.substring(0, 8)}...: ${contatoCompleto.nome} (Cliente: ${clienteVinculado.nome})`,
            );
          } else {
            this.logger.debug(
              `⚠️ Contato encontrado mas sem cliente vinculado para ticket ${ticket.id.substring(0, 8)}...`,
            );
          }
        } else {
          this.logger.debug(
            `⚠️ NENHUM contato encontrado no banco para telefone: ${ticket.contatoTelefone}`,
          );
        }

        return {
          ...ticket,
          contato, // ← Adicionar objeto contato completo
          mensagensNaoLidas,
          totalMensagens,
          ultimaMensagem: ultimaMensagemObj?.conteudo || 'Sem mensagens',
          tempoAtendimento,
        };
      }),
    );

    this.logger.log(`📋 Listando ${tickets.length} de ${total} tickets (com campos calculados)`);

    return { tickets: ticketsComCampos as any, total };
  }

  /**
   * Cria um novo ticket manualmente
   * 🆕 Suporta campos da unificação Tickets+Demandas
   */
  async criar(dados: CriarTicketDto): Promise<Ticket> {
    this.logger.log(`➕ Criando ticket para: ${dados.clienteNome || dados.clienteNumero}`);

    const ticket = this.ticketRepository.create({
      empresaId: dados.empresaId,
      canalId: dados.canalId,
      contatoTelefone: dados.clienteNumero,
      contatoNome: dados.clienteNome || dados.clienteNumero,
      contatoFoto: dados.clienteFoto || null,
      assunto: dados.assunto || 'Novo ticket',
      status: StatusTicket.FILA,
      prioridade: (dados.prioridade as any) || PrioridadeTicket.MEDIA,
      data_abertura: new Date(),
      ultima_mensagem_em: new Date(),
      // 🆕 Campos da unificação Tickets+Demandas
      cliente_id: dados.cliente_id || null,
      titulo: dados.titulo || null,
      descricao: dados.descricao || null,
      tipo: dados.tipo || null,
      data_vencimento: dados.data_vencimento ? new Date(dados.data_vencimento) : null,
      responsavel_id: dados.responsavel_id || null,
      autor_id: dados.autor_id || null,
    });

    const ticketSalvo = await this.ticketRepository.save(ticket);

    // 🔧 FALLBACK: Se trigger não gerou número, gerar manualmente
    if (!ticketSalvo.numero) {
      this.logger.warn(`⚠️ Trigger não gerou número - gerando manualmente`);
      const ultimoTicket = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.empresaId = :empresaId', { empresaId: dados.empresaId })
        .andWhere('ticket.numero IS NOT NULL')
        .orderBy('ticket.numero', 'DESC')
        .getOne();

      ticketSalvo.numero = (ultimoTicket?.numero || 0) + 1;
      await this.ticketRepository.save(ticketSalvo);
      this.logger.log(`🔢 Número gerado manualmente: ${ticketSalvo.numero}`);
    }

    this.logger.log(`✅ Ticket criado: ${ticketSalvo.id} (Número: ${ticketSalvo.numero})`);

    void this.tentarNotificarPrioridadeAlta(ticketSalvo);

    return ticketSalvo;
  }

  /**
   * Busca e atribui automaticamente um atendente disponível
   * Lógica: Round-robin baseado em menor número de tickets ativos
   */
  private async atribuirAutomaticamente(
    ticketId: string,
    empresaId: string,
    departamentoId?: string,
    nucleoId?: string,
  ): Promise<{ id: string; nome: string } | null> {
    this.logger.log(
      `🔍 Buscando atendente disponível para departamento ${departamentoId} / núcleo ${nucleoId}`,
    );

    try {
      if (!nucleoId) {
        this.logger.warn(
          `⚠️ Núcleo não informado para atribuição automática do ticket ${ticketId}`,
        );
        return null;
      }

      const candidato = await this.atribuicaoService.selecionarAtendenteParaRoteamento(
        empresaId,
        nucleoId,
        departamentoId,
      );

      if (!candidato) {
        this.logger.warn(
          `⚠️ Nenhum atendente encontrado para departamento ${departamentoId} / núcleo ${nucleoId}`,
        );
        return null;
      }

      await this.ticketRepository.update(ticketId, {
        atendenteId: candidato.id,
        status: StatusTicket.EM_ATENDIMENTO,
      });

      this.logger.log(`✅ Atendente selecionado: ${candidato.nome} (${candidato.id})`);

      return {
        id: candidato.id,
        nome: candidato.nome,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atribuir automaticamente: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Atribui ticket a um atendente
   */
  async atribuir(
    ticketId: string,
    atendenteId: string,
    enviarBoasVindas: boolean = false,
  ): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);
    this.logger.debug(
      `[ATRIBUIR] Ticket ${ticketId} antes da atribuição -> status=${ticket.status} atendenteAtual=${ticket.atendenteId || 'nenhum'}`,
    );

    // Verificar se estava ABERTO e vai para EM_ATENDIMENTO
    const primeiraAtribuicao = ticket.status === StatusTicket.FILA && !ticket.atendenteId;

    ticket.atendenteId = atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    const telefoneCliente = ticket.contatoTelefone || ticketAtualizado.contatoTelefone;
    this.logger.log(`👤 Ticket ${ticketId} atribuído para atendente ${atendenteId}`);

    // 🆕 Enviar mensagem de boas-vindas se for primeira atribuição ou solicitado
    this.logger.debug(
      `[SAUDACAO] Avaliando envio automático: primeira=${primeiraAtribuicao} enviarBoasVindas=${enviarBoasVindas} telefone=${telefoneCliente || 'N/A'}`,
    );

    if ((primeiraAtribuicao || enviarBoasVindas) && telefoneCliente) {
      // Buscar melhor nome possível para apresentar ao cliente
      let nomeAtendente = (ticket as any).atendenteNome || null;

      if ((!nomeAtendente || nomeAtendente.trim().length === 0) && atendenteId) {
        try {
          const atendente = await this.userRepository.findOne({ where: { id: atendenteId } });
          nomeAtendente = atendente?.nome || nomeAtendente;
        } catch (buscaErro) {
          this.logger.warn(
            `⚠️ Não foi possível obter nome do atendente ${atendenteId}: ${buscaErro instanceof Error ? buscaErro.message : buscaErro}`,
          );
        }
      }

      nomeAtendente = nomeAtendente || 'nosso atendente';

      const mensagemBoasVindas = `Olá, em que posso ajuda-lo?`;

      try {
        await this.whatsAppSenderService.enviarIndicadorDigitacao(
          ticketAtualizado.empresaId,
          telefoneCliente,
        );
      } catch (indicadorErro) {
        this.logger.warn(
          `⚠️ [WHATSAPP] Não foi possível enviar indicador de digitação: ${indicadorErro instanceof Error ? indicadorErro.message : indicadorErro}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const mensagemSalva = await this.mensagemService.enviar({
          ticketId: ticketAtualizado.id,
          conteudo: mensagemBoasVindas,
          tipoRemetente: RemetenteMensagem.ATENDENTE,
          remetenteId: atendenteId,
        });

        this.logger.log(
          `📱 [WHATSAPP] Mensagem de boas-vindas automática enviada (${mensagemSalva.id})`,
        );
        await this.atualizarUltimaMensagem(ticketAtualizado.id);
      } catch (erroSaudacao) {
        this.logger.error(
          `❌ Falha ao registrar/enviar mensagem de boas-vindas automática: ${erroSaudacao instanceof Error ? erroSaudacao.message : erroSaudacao}`,
        );
      }
    }

    return ticketAtualizado;
  }

  /**
   * Atualiza campos gerais do ticket (atendenteId, filaId, etc)
   * 🆕 Suporta atualização de campos da unificação Tickets+Demandas
   */
  async atualizar(
    ticketId: string,
    empresaId: string,
    dados: Partial<{
      atendenteId?: string;
      filaId?: string;
      cliente_id?: string;
      titulo?: string;
      descricao?: string;
      tipo?: TipoTicket;
      data_vencimento?: string | Date;
      responsavel_id?: string;
      autor_id?: string;
      [key: string]: any;
    }>,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, empresaId },
    });

    if (!ticket) {
      throw new HttpException('Ticket não encontrado', HttpStatus.NOT_FOUND);
    }

    // 🆕 Tratamento especial para data_vencimento (string → Date)
    if (dados.data_vencimento) {
      dados.data_vencimento = new Date(dados.data_vencimento);
    }

    // Atualizar campos
    Object.assign(ticket, dados);

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`✅ Ticket ${ticketId} atualizado com ${JSON.stringify(dados)}`);

    // 🔔 Notificar via WebSocket
    try {
      await Promise.resolve(
        this.atendimentoGateway.notificarStatusTicket(
          ticketAtualizado.id,
          ticketAtualizado.status,
          ticketAtualizado,
        ),
      );
    } catch (wsError) {
      this.logger.warn(
        `⚠️ Erro ao notificar WebSocket: ${wsError instanceof Error ? wsError.message : wsError}`,
      );
    }

    return ticketAtualizado;
  }

  /**
   * Atualiza status do ticket com validação de transições
   */
  async atualizarStatus(ticketId: string, status: StatusTicket): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    // ✅ VALIDAR TRANSIÇÃO
    const statusAtual = ticket.status as StatusTicket;
    const transicaoValida = validarTransicaoStatus(statusAtual, status);

    if (!transicaoValida) {
      const mensagemErro = gerarMensagemErroTransicao(statusAtual, status);
      this.logger.warn(`⚠️ Transição inválida: ${ticketId} (${statusAtual} → ${status})`);
      throw new BadRequestException(mensagemErro);
    }

    // Log da transição
    const descricao = obterDescricaoTransicao(statusAtual, status);
    this.logger.log(`🔄 Transição: ${ticketId} (${statusAtual} → ${status}): ${descricao}`);

    ticket.status = status;

    // Se resolvendo, registrar data
    if (status === StatusTicket.ENCERRADO && !ticket.data_resolucao) {
      ticket.data_resolucao = new Date();
    }

    // Se fechando, registrar data
    if (status === StatusTicket.ENCERRADO && !ticket.data_fechamento) {
      ticket.data_fechamento = new Date();
    }

    // Se reabrindo, limpar datas
    if (status === StatusTicket.FILA && statusAtual === StatusTicket.ENCERRADO) {
      ticket.data_resolucao = null;
      ticket.data_fechamento = null;
      this.logger.log(`♻️ Ticket ${ticketId} reaberto - datas zeradas`);
    }

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`✅ Status do ticket ${ticketId} atualizado para ${status}`);

    // 🔔 Notificar via WebSocket
    try {
      await Promise.resolve(
        this.atendimentoGateway.notificarStatusTicket(
          ticketAtualizado.id,
          ticketAtualizado.status,
          ticketAtualizado,
        ),
      );
    } catch (error) {
      this.logger.error(
        `⚠️ Erro ao notificar atualização de status via WebSocket: ${error.message}`,
      );
    }

    return ticketAtualizado;
  }

  /**
   * Atualiza prioridade do ticket
   */
  async atualizarPrioridade(ticketId: string, prioridade: PrioridadeTicket): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.prioridade = prioridade;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`🔥 Prioridade do ticket ${ticketId} atualizada para ${prioridade}`);

    void this.tentarNotificarPrioridadeAlta(ticketAtualizado);

    return ticketAtualizado;
  }

  /**
   * Registra primeira resposta do atendente
   */
  async registrarPrimeiraResposta(ticketId: string): Promise<void> {
    const ticket = await this.buscarPorId(ticketId);

    if (!ticket.data_primeira_resposta) {
      ticket.data_primeira_resposta = new Date();
      await this.ticketRepository.save(ticket);
      this.logger.log(`⏱️ Primeira resposta registrada para ticket ${ticketId}`);
    }
  }

  /**
   * Atualiza timestamp da última mensagem
   */
  async atualizarUltimaMensagem(ticketId: string): Promise<void> {
    await this.ticketRepository.update(ticketId, {
      ultima_mensagem_em: new Date(),
    });
  }

  /**
   * Busca tickets por número de telefone do cliente
   */
  async buscarPorTelefone(empresaId: string, telefone: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: {
        empresaId,
        contatoTelefone: telefone,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  /**
   * Conta tickets ativos de um atendente
   */
  async contarTicketsAtivos(atendenteId: string): Promise<number> {
    return await this.ticketRepository.count({
      where: {
        atendenteId: atendenteId,
        status: In([StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO, StatusTicket.ENVIO_ATIVO]),
      },
    });
  }

  async escalar(
    ticketId: string,
    dados: { level: NivelAtendimentoTicket; reason: string; slaTargetMinutes?: number; slaExpiresAt?: Date },
  ): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    if (!dados?.level) {
      throw new BadRequestException('Nível de escalonamento é obrigatório');
    }

    if (ticket.assignedLevel === dados.level) {
      throw new BadRequestException('Ticket já está no nível informado');
    }

    ticket.assignedLevel = dados.level;
    ticket.escalationReason = dados.reason;
    ticket.escalationAt = new Date();

    if (dados.slaTargetMinutes || dados.slaExpiresAt) {
      ticket.slaTargetMinutes = dados.slaTargetMinutes ?? ticket.slaTargetMinutes;
      ticket.slaExpiresAt = this.resolverSlaExpiration(dados.slaTargetMinutes, dados.slaExpiresAt) ?? ticket.slaExpiresAt;
    }

    const salvo = await this.ticketRepository.save(ticket);

    try {
      await Promise.resolve(
        this.atendimentoGateway.notificarStatusTicket(
          salvo.id,
          salvo.status,
          salvo,
        ),
      );
    } catch (error) {
      this.logger.error(`⚠️ Erro ao notificar websocket após escalonamento: ${error?.message || error}`);
    }

    void this.notificarEscalacao(salvo, dados.level, dados.reason);
    if (this.isHighPriority(salvo.prioridade)) {
      void this.tentarNotificarPrioridadeAlta(salvo);
    }

    return salvo;
  }

  async desescalar(ticketId: string, dados?: { reason?: string }): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.assignedLevel = NivelAtendimentoTicket.N1;
    ticket.escalationReason = dados?.reason || null;
    ticket.escalationAt = null;

    const salvo = await this.ticketRepository.save(ticket);

    try {
      await Promise.resolve(this.atendimentoGateway.notificarStatusTicket(salvo.id, salvo.status, salvo));
    } catch (error) {
      this.logger.error(`⚠️ Erro ao notificar websocket após desescalada: ${error?.message || error}`);
    }

    return salvo;
  }

  async reatribuir(ticketId: string, dados: {
    filaId?: string;
    atendenteId?: string;
    assignedLevel?: NivelAtendimentoTicket;
    severity?: SeveridadeTicket;
  }): Promise<Ticket> {
    if (!dados.filaId && !dados.atendenteId && !dados.assignedLevel && !dados.severity) {
      throw new BadRequestException('Informe pelo menos filaId, atendenteId, assignedLevel ou severity');
    }

    const ticket = await this.buscarPorId(ticketId);

    if (dados.filaId) {
      ticket.filaId = dados.filaId;
    }
    if (dados.atendenteId) {
      ticket.atendenteId = dados.atendenteId;
      ticket.status = StatusTicket.EM_ATENDIMENTO;
    }
    if (dados.assignedLevel) {
      ticket.assignedLevel = dados.assignedLevel;
    }
    if (dados.severity) {
      ticket.severity = dados.severity;
    }

    const salvo = await this.ticketRepository.save(ticket);

    try {
      await Promise.resolve(this.atendimentoGateway.notificarStatusTicket(salvo.id, salvo.status, salvo));
    } catch (error) {
      this.logger.error(`⚠️ Erro ao notificar websocket após reatribuição: ${error?.message || error}`);
    }

    return salvo;
  }

  /**
   * Transfere ticket para outro atendente
   */
  async transferir(ticketId: string, dados: any): Promise<Ticket> {
    return withSpan('ticket.transferir', async (span) => {
      try {
        addAttributes(span, {
          'ticket.id': ticketId,
          'ticket.novoAtendenteId': dados.atendenteId,
          'ticket.motivo': dados.motivo || 'not-specified',
        });

        const ticket = await this.buscarPorId(ticketId);

        // Armazenar atendente anterior
        const atendenteAnterior = ticket.atendenteId;
        addAttributes(span, {
          'ticket.atendenteAnterior': atendenteAnterior || 'none',
          'ticket.statusAnterior': ticket.status,
        });

        // Atualizar ticket
        ticket.atendenteId = dados.atendenteId;
        ticket.status = StatusTicket.EM_ATENDIMENTO;

        const ticketAtualizado = await this.ticketRepository.save(ticket);

        this.logger.log(
          `🔄 Ticket ${ticketId} transferido de ${atendenteAnterior || 'fila'} para ${dados.atendenteId}. ` +
          `Motivo: ${dados.motivo}`,
        );

        // 📊 Incrementar métrica de transferências
        incrementCounter(ticketsTransferidosTotal, {
          empresaId: ticket.empresaId,
          departamentoOrigem: 'unknown', // TODO: buscar do ticket
          departamentoDestino: 'unknown', // TODO: buscar do atendente
        });

        // TODO: Criar nota interna com motivo e notaInterna
        // TODO: Se notificarAgente, enviar notificação

        span.setStatus({ code: SpanStatusCode.OK });
        return ticketAtualizado;
      } catch (error) {
        recordException(span, error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      }
    });
  }

  /**
   * Encerra um ticket
   */
  async encerrar(ticketId: string, dados: any): Promise<any> {
    return withSpan('ticket.encerrar', async (span) => {
      try {
        addAttributes(span, {
          'ticket.id': ticketId,
          'ticket.motivo': dados?.motivo || 'not-specified',
          'ticket.solicitarAvaliacao': dados?.solicitarAvaliacao || false,
        });

        const ticket = await this.buscarPorId(ticketId);
        addAttributes(span, { 'ticket.statusAnterior': ticket.status });

        const statusFinal = this.definirStatusEncerramento(dados?.motivo);
        const agora = new Date();

        ticket.status = statusFinal;
        ticket.data_resolucao = agora;
        ticket.data_fechamento = agora;

        const ticketAtualizado = await this.ticketRepository.save(ticket);

        this.logger.log(
          `🏁 Ticket ${ticketId} encerrado. Motivo: ${dados?.motivo || 'não informado'}`,
        );

        const followUp = await this.criarFollowUpCasoNecessario(ticketAtualizado, dados);
        const csatEnviado = await this.enviarCsatSeSolicitado(
          ticketAtualizado,
          dados?.solicitarAvaliacao,
        );

        await this.finalizarSessoesTriagem(
          ticketAtualizado,
          dados?.motivo,
          dados?.solicitarAvaliacao,
        );

        addAttributes(span, {
          'ticket.statusFinal': statusFinal,
          'ticket.followUpCriado': !!followUp,
          'ticket.csatEnviado': csatEnviado,
        });

        // 📊 Incrementar métrica de tickets encerrados
        incrementCounter(ticketsEncerradosTotal, {
          empresaId: ticket.empresaId,
          departamentoId: 'unknown', // TODO: buscar do ticket
          motivo: dados?.motivo || 'not-specified',
        });

        // 📊 Registrar tempo de vida do ticket (criação → fechamento)
        if (ticket.data_abertura) {
          const tempoVidaSegundos =
            (ticketAtualizado.data_fechamento.getTime() - ticket.data_abertura.getTime()) / 1000;
          observeHistogram(
            ticketTempoVidaHistogram,
            tempoVidaSegundos,
            {
              empresaId: ticket.empresaId,
              departamentoId: 'unknown', // TODO: buscar do ticket
            },
          );
        }

        span.setStatus({ code: SpanStatusCode.OK });

        return {
          ticket: ticketAtualizado,
          followUp: followUp ?? undefined,
          csatEnviado,
        };
      } catch (error) {
        recordException(span, error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      }
    });
  }

  /**
   * Reabre um ticket encerrado
   */
  async reabrir(ticketId: string): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    // Verificar se está encerrado
    if (ticket.status !== StatusTicket.ENCERRADO) {
      throw new Error('Ticket não está encerrado');
    }

    // Reabrir
    ticket.status = StatusTicket.FILA;
    ticket.data_resolucao = null;
    ticket.data_fechamento = null;

    const ticketAtualizado = await this.ticketRepository.save(ticket);

    this.logger.log(`🔓 Ticket ${ticketId} reaberto`);

    return ticketAtualizado;
  }

  // ========== MÉTODOS PRIVADOS - CAMPOS CALCULADOS ==========

  /**
   * Conta mensagens não lidas de um ticket
   * Considera apenas mensagens recebidas do cliente que ainda não foram lidas
   */
  private async contarMensagensNaoLidas(ticketId: string): Promise<number> {
    try {
      const count = await this.mensagemRepository.count({
        where: {
          ticketId,
          remetente: RemetenteMensagem.CLIENTE,
          // TODO: Adicionar campo 'lida: false' quando implementado
        },
      });
      return count;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao contar mensagens não lidas: ${error.message}`);
      return 0;
    }
  }

  /**
   * Conta total de mensagens de um ticket
   */
  private async contarMensagens(ticketId: string): Promise<number> {
    try {
      const count = await this.mensagemRepository.count({
        where: { ticketId },
      });
      return count;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao contar mensagens: ${error.message}`);
      return 0;
    }
  }

  private definirStatusEncerramento(motivo?: string): StatusTicket {
    const valor = (motivo || '').toLowerCase();
    if (valor === 'resolvido') {
      return StatusTicket.ENCERRADO;
    }

    // Aceita variações que podem vir do frontend
    const motivosFechamento = new Set([
      'cancelado',
      'cancelado_cliente',
      'sem_resposta',
      'duplicado',
      'spam',
      'outro',
    ]);

    if (motivosFechamento.has(valor)) {
      return StatusTicket.ENCERRADO;
    }

    return StatusTicket.ENCERRADO;
  }

  private async criarFollowUpCasoNecessario(ticket: Ticket, dados: any) {
    if (!dados?.criarFollowUp || !dados?.dataFollowUp) {
      return null;
    }

    if (!ticket.atendenteId) {
      this.logger.warn(
        `⚠️ Não foi possível criar follow-up: ticket ${ticket.id} sem atendente associado`,
      );
      return null;
    }

    const dataFollowUp = new Date(dados.dataFollowUp);
    if (Number.isNaN(dataFollowUp.getTime())) {
      this.logger.warn(`⚠️ Data de follow-up inválida recebida: ${dados.dataFollowUp}`);
      return null;
    }

    try {
      const evento = this.eventoRepository.create({
        titulo: ticket.numero
          ? `Follow-up atendimento #${ticket.numero}`
          : 'Follow-up de atendimento',
        descricao:
          dados.observacoes ||
          `Revisar atendimento do cliente ${ticket.contatoNome || ticket.contatoTelefone}`,
        dataInicio: dataFollowUp,
        dataFim: new Date(dataFollowUp.getTime() + 30 * 60 * 1000),
        diaInteiro: true,
        tipo: TipoEvento.FOLLOW_UP,
        cor: '#2563EB',
        clienteId: null,
        usuarioId: ticket.atendenteId,
        empresaId: ticket.empresaId,
      });

      const eventoSalvo = await this.eventoRepository.save(evento);
      this.logger.log(
        `📅 Follow-up agendado: evento ${eventoSalvo.id} em ${eventoSalvo.dataInicio.toISOString()}`,
      );

      return {
        id: eventoSalvo.id,
        dataAgendamento: eventoSalvo.dataInicio,
      };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao criar follow-up: ${error.message}`);
      return null;
    }
  }

  private async enviarCsatSeSolicitado(ticket: Ticket, solicitar?: boolean): Promise<boolean> {
    if (!solicitar) {
      return false;
    }

    if (!ticket.contatoTelefone) {
      this.logger.warn(`⚠️ CSAT não enviado: ticket ${ticket.id} sem telefone do contato`);
      return false;
    }

    try {
      const mensagem = this.montarMensagemCsat(ticket);
      const resultado = await this.whatsAppSenderService.enviarMensagem(
        ticket.empresaId,
        ticket.contatoTelefone,
        mensagem,
      );

      if (!resultado.sucesso) {
        this.logger.warn(`⚠️ Falha no envio do CSAT: ${resultado.erro || 'motivo desconhecido'}`);
        return false;
      }

      this.logger.log('⭐ Solicitação CSAT enviada com sucesso');
      return true;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao enviar CSAT: ${error.message}`);
      return false;
    }
  }

  private montarMensagemCsat(ticket: Ticket): string {
    const nomeCliente = ticket.contatoNome || 'cliente';
    const protocolo = ticket.numero ? `#${ticket.numero}` : `protocolo ${ticket.id}`;

    return [
      `Olá ${nomeCliente}! 😊 Aqui é a equipe de atendimento ConectCRM.`,
      `Gostaríamos de saber como foi o atendimento referente ao ${protocolo}.`,
      'Por favor, responda com uma nota de 1 a 10, onde 10 significa "Excelente" e 1 "Muito ruim".',
      'Basta enviar apenas o número da nota. A sua opinião é muito importante para continuarmos melhorando. Muito obrigado! 🙏',
    ].join('\n');
  }

  private async finalizarSessoesTriagem(
    ticket: Ticket,
    motivo?: string,
    solicitouCsat?: boolean,
  ): Promise<void> {
    if (!ticket?.id) {
      return;
    }

    try {
      const query = this.sessaoTriagemRepository
        .createQueryBuilder('sessao')
        .where('sessao.ticketId = :ticketId', { ticketId: ticket.id });

      if (ticket.contatoTelefone) {
        query.orWhere(
          new Brackets((qb) => {
            qb.where('sessao.empresaId = :empresaId', { empresaId: ticket.empresaId })
              .andWhere('sessao.contatoTelefone = :telefone', { telefone: ticket.contatoTelefone })
              .andWhere('sessao.status IN (:...statusAtivos)', {
                statusAtivos: ['em_andamento', 'transferido'],
              });
          }),
        );
      }

      const sessoes = await query.getMany();

      if (!sessoes.length) {
        return;
      }

      const sessoesUnicas = new Map<string, SessaoTriagem>();
      for (const sessao of sessoes) {
        sessoesUnicas.set(sessao.id, sessao);
      }

      const atualizadas: SessaoTriagem[] = [];
      for (const sessao of sessoesUnicas.values()) {
        if (sessao.status === 'concluido') {
          continue;
        }

        sessao.contexto = sessao.contexto || {};
        sessao.concluir(this.definirResultadoSessao(ticket.status));
        sessao.salvarNoContexto('__ticketStatusFinal', ticket.status);
        sessao.salvarNoContexto('__ticketEncerradoEm', new Date().toISOString());
        if (motivo) {
          sessao.salvarNoContexto('__motivoEncerramento', motivo);
        }
        if (solicitouCsat) {
          sessao.salvarNoContexto('__aguardandoCsat', true);
          sessao.salvarNoContexto('__csatSolicitadoEm', new Date().toISOString());
          if (ticket.numero) {
            sessao.salvarNoContexto('__ticketNumero', ticket.numero);
          }
        }
        atualizadas.push(sessao);
      }

      if (atualizadas.length) {
        await this.sessaoTriagemRepository.save(atualizadas);
        this.logger.log(
          `🔚 ${atualizadas.length} sessão(ões) de triagem finalizadas para o ticket ${ticket.id}`,
        );
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao finalizar sessões de triagem: ${error.message}`);
    }
  }

  private definirResultadoSessao(statusTicket: string): ResultadoSessao {
    if (statusTicket === StatusTicket.ENCERRADO) {
      return 'transferido_humano';
    }
    return 'ticket_criado';
  }

  async registrarRespostaCsat(dados: {
    empresaId: string;
    telefone: string;
    mensagem: string;
  }): Promise<{ registrado: boolean; nota?: number; ticketId?: string }> {
    const nota = this.extrairNotaCsat(dados.mensagem);
    if (nota === null) {
      return { registrado: false };
    }

    try {
      const sessoes = await this.sessaoTriagemRepository
        .createQueryBuilder('sessao')
        .where('sessao.empresaId = :empresaId', { empresaId: dados.empresaId })
        .andWhere('sessao.contatoTelefone = :telefone', { telefone: dados.telefone })
        .andWhere('sessao.status IN (:...statusValidos)', {
          statusValidos: ['concluido', 'transferido'],
        })
        .orderBy('sessao.updatedAt', 'DESC')
        .take(10)
        .getMany();

      if (!sessoes.length) {
        return { registrado: false };
      }

      const agora = Date.now();
      const sessaoAguardando = sessoes.find((sessao) => {
        const contexto = sessao.contexto || {};
        if (!contexto.__aguardandoCsat) {
          return false;
        }

        const encerradoIso = contexto.__ticketEncerradoEm as string | undefined;
        if (encerradoIso) {
          const encerradoTime = Date.parse(encerradoIso);
          if (!Number.isNaN(encerradoTime)) {
            const diffHoras = (agora - encerradoTime) / (1000 * 60 * 60);
            if (diffHoras > 72) {
              return false;
            }
          }
        }

        return true;
      });

      if (!sessaoAguardando) {
        return { registrado: false };
      }

      sessaoAguardando.contexto = sessaoAguardando.contexto || {};
      sessaoAguardando.satisfacaoNota = nota;
      sessaoAguardando.satisfacaoComentario = dados.mensagem;
      sessaoAguardando.salvarNoContexto('__aguardandoCsat', false);
      sessaoAguardando.salvarNoContexto('__csatRespondidoEm', new Date().toISOString());
      sessaoAguardando.salvarNoContexto('__csatNota', nota);

      await this.sessaoTriagemRepository.save(sessaoAguardando);
      this.logger.log(`⭐ CSAT registrado (nota ${nota}) para sessão ${sessaoAguardando.id}`);

      return {
        registrado: true,
        nota,
        ticketId: sessaoAguardando.ticketId || undefined,
      };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao registrar resposta CSAT: ${error.message}`);
      return { registrado: false };
    }
  }

  private extrairNotaCsat(mensagem: string): number | null {
    if (!mensagem) {
      return null;
    }

    const texto = mensagem.trim();
    const somenteNumero = texto.match(/\b(10|[1-9])\b/);
    if (!somenteNumero) {
      return null;
    }

    const nota = Number(somenteNumero[1]);
    if (nota >= 1 && nota <= 10) {
      return nota;
    }

    return null;
  }
}
