import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ticket, StatusTicket, PrioridadeTicket, OrigemTicket } from '../entities/ticket.entity';

export interface CriarTicketDto {
  empresaId: string;
  canalId: string;
  clienteNumero: string;
  clienteNome?: string;
  clienteEmail?: string;
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
  limite?: number;
  pagina?: number;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) { }

  /**
   * Busca ou cria um ticket ativo para o cliente
   * Usado pelo webhook para garantir que cada cliente tenha um ticket ativo
   */
  async buscarOuCriarTicket(dados: BuscarOuCriarTicketDto): Promise<Ticket> {
    this.logger.log(`🔍 Buscando ticket para cliente: ${dados.clienteNumero}`);

    // 1. Buscar ticket aberto/em atendimento do cliente neste canal
    let ticket = await this.ticketRepository.findOne({
      where: {
        empresaId: dados.empresaId,
        canalId: dados.canalId,
        contatoTelefone: dados.clienteNumero,
        status: In([StatusTicket.ABERTO, StatusTicket.EM_ATENDIMENTO, StatusTicket.AGUARDANDO]),
      },
      order: { createdAt: 'DESC' },
    });

    // 2. Se não existir, criar novo ticket
    if (!ticket) {
      this.logger.log(`✨ Criando novo ticket para ${dados.clienteNumero}`);

      ticket = this.ticketRepository.create({
        empresaId: dados.empresaId,
        canalId: dados.canalId,
        contatoTelefone: dados.clienteNumero,
        contatoNome: dados.clienteNome || dados.clienteNumero,
        assunto: dados.assunto || 'Novo atendimento via WhatsApp',
        status: StatusTicket.ABERTO,
        prioridade: PrioridadeTicket.MEDIA,
        data_abertura: new Date(),
        ultima_mensagem_em: new Date(),
      });

      ticket = await this.ticketRepository.save(ticket);
      this.logger.log(`✅ Ticket criado: ${ticket.id} (Número: ${ticket.numero})`);
    } else {
      // 3. Se já existe, atualizar última interação
      ticket.ultima_mensagem_em = new Date();
      ticket = await this.ticketRepository.save(ticket);
      this.logger.log(`♻️ Ticket existente atualizado: ${ticket.id} (Número: ${ticket.numero})`);
    }

    return ticket;
  }

  /**
   * Busca ticket por ID
   */
  async buscarPorId(id: string, empresaId?: string): Promise<Ticket> {
    const where: any = { id };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const ticket = await this.ticketRepository.findOne({ where });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} não encontrado`);
    }

    return ticket;
  }

  /**
   * Lista tickets com filtros
   */
  async listar(filtros: FiltrarTicketsDto): Promise<{ tickets: Ticket[]; total: number }> {
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.empresaId = :empresaId', { empresaId: filtros.empresaId });

    // Filtros opcionais
    if (filtros.status && filtros.status.length > 0) {
      queryBuilder.andWhere('ticket.status IN (:...status)', { status: filtros.status });
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

    // Ordenação
    queryBuilder.orderBy('ticket.ultima_mensagem_em', 'DESC');

    // Paginação
    const limite = filtros.limite || 50;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    const [tickets, total] = await queryBuilder
      .take(limite)
      .skip(skip)
      .getManyAndCount();

    this.logger.log(`📋 Listando ${tickets.length} de ${total} tickets`);

    return { tickets, total };
  }

  /**
   * Cria um novo ticket manualmente
   */
  async criar(dados: CriarTicketDto): Promise<Ticket> {
    this.logger.log(`➕ Criando ticket para: ${dados.clienteNome || dados.clienteNumero}`);

    const ticket = this.ticketRepository.create({
      empresaId: dados.empresaId,
      canalId: dados.canalId,
      contatoTelefone: dados.clienteNumero,
      contatoNome: dados.clienteNome || dados.clienteNumero,
      assunto: dados.assunto || 'Novo ticket',
      status: StatusTicket.ABERTO,
      prioridade: (dados.prioridade as any) || PrioridadeTicket.MEDIA,
      data_abertura: new Date(),
      ultima_mensagem_em: new Date(),
    });

    const ticketSalvo = await this.ticketRepository.save(ticket);
    this.logger.log(`✅ Ticket criado: ${ticketSalvo.id} (Número: ${ticketSalvo.numero})`);

    return ticketSalvo;
  }

  /**
   * Atribui ticket a um atendente
   */
  async atribuir(ticketId: string, atendenteId: string): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.atendenteId = atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`👤 Ticket ${ticketId} atribuído para atendente ${atendenteId}`);

    return ticketAtualizado;
  }

  /**
   * Atualiza status do ticket
   */
  async atualizarStatus(
    ticketId: string,
    status: StatusTicket,
  ): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.status = status;

    // Se resolvendo, registrar data
    if (status === StatusTicket.RESOLVIDO && !ticket.data_resolucao) {
      ticket.data_resolucao = new Date();
    }

    // Se fechando, registrar data
    if (status === StatusTicket.FECHADO && !ticket.data_fechamento) {
      ticket.data_fechamento = new Date();
    }

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`📝 Status do ticket ${ticketId} atualizado para ${status}`);

    return ticketAtualizado;
  }

  /**
   * Atualiza prioridade do ticket
   */
  async atualizarPrioridade(
    ticketId: string,
    prioridade: PrioridadeTicket,
  ): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.prioridade = prioridade;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`🔥 Prioridade do ticket ${ticketId} atualizada para ${prioridade}`);

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
  async buscarPorTelefone(
    empresaId: string,
    telefone: string,
  ): Promise<Ticket[]> {
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
        status: In([StatusTicket.ABERTO, StatusTicket.EM_ATENDIMENTO, StatusTicket.AGUARDANDO]),
      },
    });
  }

  /**
   * Transfere ticket para outro atendente
   */
  async transferir(ticketId: string, dados: any): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    // Armazenar atendente anterior
    const atendenteAnterior = ticket.atendenteId;

    // Atualizar ticket
    ticket.atendenteId = dados.atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    
    this.logger.log(
      `🔄 Ticket ${ticketId} transferido de ${atendenteAnterior || 'fila'} para ${dados.atendenteId}. ` +
      `Motivo: ${dados.motivo}`
    );

    // TODO: Criar nota interna com motivo e notaInterna
    // TODO: Se notificarAgente, enviar notificação

    return ticketAtualizado;
  }

  /**
   * Encerra um ticket
   */
  async encerrar(ticketId: string, dados: any): Promise<any> {
    const ticket = await this.buscarPorId(ticketId);

    // Atualizar status
    ticket.status = StatusTicket.RESOLVIDO;
    ticket.data_resolucao = new Date();
    ticket.data_fechamento = new Date();

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    
    this.logger.log(
      `🏁 Ticket ${ticketId} encerrado. Motivo: ${dados.motivo}`
    );

    // TODO: Criar follow-up se solicitado
    let followUp = null;
    if (dados.criarFollowUp && dados.dataFollowUp) {
      // Criar follow-up
      this.logger.log(`📅 Follow-up criado para ${dados.dataFollowUp}`);
    }

    // TODO: Enviar solicitação CSAT se solicitado
    const csatEnviado = dados.solicitarAvaliacao || false;
    if (csatEnviado) {
      this.logger.log(`⭐ Solicitação CSAT enviada`);
    }

    return {
      ticket: ticketAtualizado,
      followUp,
      csatEnviado,
    };
  }

  /**
   * Reabre um ticket encerrado
   */
  async reabrir(ticketId: string): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    // Verificar se está encerrado
    if (ticket.status !== StatusTicket.RESOLVIDO && ticket.status !== StatusTicket.FECHADO) {
      throw new Error('Ticket não está encerrado');
    }

    // Reabrir
    ticket.status = StatusTicket.ABERTO;
    ticket.data_resolucao = null;
    ticket.data_fechamento = null;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    
    this.logger.log(`🔓 Ticket ${ticketId} reaberto`);

    return ticketAtualizado;
  }
}
