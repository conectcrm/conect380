import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Ticket, StatusTicket, PrioridadeTicket, OrigemTicket } from '../entities/ticket.entity';
import { Mensagem, RemetenteMensagem } from '../entities/mensagem.entity';
import { SessaoTriagem, ResultadoSessao } from '../../triagem/entities/sessao-triagem.entity';
import { Evento, TipoEvento } from '../../eventos/evento.entity';
import { Contato } from '../../clientes/contato.entity';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';

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
    private readonly atendimentoGateway: AtendimentoGateway,
    private readonly whatsAppSenderService: WhatsAppSenderService,
  ) { }

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
          { telefone: `%${ultimosDigitos}` }
        )
        .getOne();

      if (contato) {
        this.logger.debug(
          `✅ Contato encontrado: ${contato.nome} (ID: ${contato.id}, Cliente: ${contato.cliente?.nome || 'SEM CLIENTE'})`,
        );
      } else {
        this.logger.debug(`❌ NENHUM contato encontrado para telefone: ${telefoneNormalizado} (últimos 8: ${ultimosDigitos})`);
      }

      return contato;
    } catch (error) {
      this.logger.error(`Erro ao buscar contato por telefone: ${error.message}`);
      return null;
    }
  }

  private calcularTempoAtendimento(ticket: Ticket): number {
    if (!ticket?.data_abertura) {
      return 0;
    }

    const inicioMs = new Date(ticket.data_abertura).getTime();
    if (Number.isNaN(inicioMs)) {
      return 0;
    }

    const statusNormalizado = typeof ticket.status === 'string'
      ? ticket.status.toUpperCase()
      : undefined;

    const status = (statusNormalizado as StatusTicket) || StatusTicket.ABERTO;
    const encerrado =
      status === StatusTicket.RESOLVIDO || status === StatusTicket.FECHADO;

    let fimMs: number | undefined;

    if (encerrado) {
      const candidatos: (Date | null | undefined)[] =
        status === StatusTicket.FECHADO
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
        contatoFoto: dados.clienteFoto || null,
        assunto: dados.assunto || 'Novo atendimento via WhatsApp',
        status: StatusTicket.ABERTO,
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

      // 🔔 Notificar sidebar em tempo real sobre novo ticket
      this.atendimentoGateway.notificarNovoTicket(ticket);
      this.atendimentoGateway.notificarStatusTicket(ticket.id, ticket.status, ticket);
    } else {
      // 3. Se já existe, atualizar última interação
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

    return ticket;
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
    this.logger.log(`➕ Criando ticket para: ${dados.contatoId || dados.contatoTelefone || 'contato não especificado'}`);

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
          this.logger.log(`👤 Atendente atribuído automaticamente: ${atendenteInfo.nome} (${atendenteInfo.id})`);
        } else {
          this.logger.warn(`⚠️ Nenhum atendente disponível para departamento ${dados.departamentoId} / núcleo ${dados.nucleoId}`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao atribuir atendente automaticamente: ${error.message}`, error.stack);
      }
    }

    // 🔔 Notificar sidebar em tempo real sobre novo ticket
    this.atendimentoGateway.notificarNovoTicket(ticketSalvo);
    this.atendimentoGateway.notificarStatusTicket(ticketSalvo.id, ticketSalvo.status, ticketSalvo);

    // Adicionar informações do atendente ao retorno
    return {
      ...ticketSalvo,
      atendenteNome: atendenteInfo?.nome || null,
    };
  }

  /**
   * Busca ticket por ID
   */
  async buscarPorId(id: string, empresaId?: string): Promise<Ticket> {
    const where: any = { id };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const ticket = await this.ticketRepository.findOne({
      where,
      // Removido relations temporariamente - relações não definidas na entity
      // relations: ['canal', 'atendente', 'fila'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} não encontrado`);
    }

    // Adicionar campos calculados + contato completo
    const [mensagensNaoLidas, totalMensagens, ultimaMensagemObj, contatoCompleto] = await Promise.all([
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

    // 🔍 DEBUG: Log dos tickets retornados
    this.logger.debug(
      `🔍 Tickets retornados: ${tickets.map((t) => `#${t.numero} (${t.id.substring(0, 8)}..., status: ${t.status}, tel: ${t.contatoTelefone})`).join(' | ')}`,
    );

    // ✨ ADICIONAR CAMPOS CALCULADOS + CONTATO COMPLETO
    const ticketsComCampos = await Promise.all(
      tickets.map(async (ticket) => {
        const [mensagensNaoLidas, totalMensagens, ultimaMensagemObj, contatoCompleto] = await Promise.all([
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
      })
    );

    this.logger.log(`📋 Listando ${tickets.length} de ${total} tickets (com campos calculados)`);

    return { tickets: ticketsComCampos as any, total };
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
      contatoFoto: dados.clienteFoto || null,
      assunto: dados.assunto || 'Novo ticket',
      status: StatusTicket.ABERTO,
      prioridade: (dados.prioridade as any) || PrioridadeTicket.MEDIA,
      data_abertura: new Date(),
      ultima_mensagem_em: new Date(),
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
    this.logger.log(`🔍 Buscando atendente disponível para departamento ${departamentoId} / núcleo ${nucleoId}`);

    try {
      const params: any[] = [];
      const filtros: string[] = ['aa.ativo = true'];
      const condicoesMatch: string[] = [];
      let departamentoPlaceholder: string | null = null;

      if (departamentoId) {
        departamentoPlaceholder = `$${params.length + 1}`;
        condicoesMatch.push(`aa.departamento_id = ${departamentoPlaceholder}`);
        params.push(departamentoId);
      }

      if (nucleoId) {
        const placeholder = `$${params.length + 1}`;
        condicoesMatch.push(`aa.nucleo_id = ${placeholder}`);
        params.push(nucleoId);
      }

      if (condicoesMatch.length > 0) {
        filtros.push(`(${condicoesMatch.join(' OR ')})`);
      }

      const whereClause = filtros
        .map((clause, index) => (index === 0 ? clause : `AND ${clause}`))
        .join('\n        ');

      const prioridadeDireta = departamentoPlaceholder
        ? `CASE WHEN aa.departamento_id = ${departamentoPlaceholder} THEN 0 ELSE 1 END ASC,`
        : '';

      const query = `
        SELECT 
          aa.atendente_id,
          u.nome as atendente_nome,
          COALESCE(
            (SELECT COUNT(*) 
             FROM atendimento_tickets t 
             WHERE t.atendente_id = aa.atendente_id 
             AND t.status IN ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE')
            ), 0
          ) as tickets_ativos
        FROM atendente_atribuicoes aa
        INNER JOIN users u ON u.id = aa.atendente_id
        WHERE ${whereClause}
        ORDER BY ${prioridadeDireta} tickets_ativos ASC, aa.prioridade ASC, aa.updated_at ASC
        LIMIT 1
      `;

      const result = await this.ticketRepository.query(query, params);

      if (!result || result.length === 0) {
        this.logger.warn(`⚠️ Nenhum atendente encontrado para departamento ${departamentoId} / núcleo ${nucleoId}`);
        return null;
      }

      const atendenteSelecionado = result[0];
      this.logger.log(`✅ Atendente selecionado: ${atendenteSelecionado.atendente_nome} (tickets ativos: ${atendenteSelecionado.tickets_ativos})`);

      // Atribuir ticket ao atendente
      await this.ticketRepository.update(ticketId, {
        atendenteId: atendenteSelecionado.atendente_id,
        status: 'EM_ATENDIMENTO' as any,
      });

      return {
        id: atendenteSelecionado.atendente_id,
        nome: atendenteSelecionado.atendente_nome,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atribuir automaticamente: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Atribui ticket a um atendente
   */
  async atribuir(ticketId: string, atendenteId: string, enviarBoasVindas: boolean = false): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    // Verificar se estava ABERTO e vai para EM_ATENDIMENTO
    const primeiraAtribuicao = ticket.status === StatusTicket.ABERTO && !ticket.atendenteId;

    ticket.atendenteId = atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;

    const ticketAtualizado = await this.ticketRepository.save(ticket);
    this.logger.log(`👤 Ticket ${ticketId} atribuído para atendente ${atendenteId}`);

    // 🆕 Enviar mensagem de boas-vindas se for primeira atribuição ou solicitado
    if ((primeiraAtribuicao || enviarBoasVindas) && ticket.contatoTelefone) {
      try {
        // Buscar nome do atendente (se disponível no ticket ou contexto)
        const nomeAtendente = (ticket as any).atendenteNome || 'nosso atendente';

        const mensagemBoasVindas = `👋 *Olá!*\n\n` +
          `Sou *${nomeAtendente}* e vou te ajudar agora! 😊\n\n` +
          `📱 Estou online e à disposição.\n\n` +
          `💬 _Como posso ajudar você?_`;

        // ⏳ Indicador de digitação antes de enviar (mais natural)
        await this.whatsAppSenderService.enviarIndicadorDigitacao(
          ticket.empresaId,
          ticket.contatoTelefone,
        );
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1s

        await this.whatsAppSenderService.enviarMensagem(
          ticket.empresaId,
          ticket.contatoTelefone,
          mensagemBoasVindas,
        );

        this.logger.log(`📱 [WHATSAPP] Mensagem de boas-vindas enviada ao cliente`);
      } catch (error) {
        this.logger.error(`❌ [WHATSAPP] Erro ao enviar boas-vindas: ${error.message}`);
      }
    }

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

    const statusFinal = this.definirStatusEncerramento(dados?.motivo);
    const agora = new Date();

    ticket.status = statusFinal;
    ticket.data_resolucao = agora;
    ticket.data_fechamento = agora;

    const ticketAtualizado = await this.ticketRepository.save(ticket);

    this.logger.log(`🏁 Ticket ${ticketId} encerrado. Motivo: ${dados?.motivo || 'não informado'}`);

    const followUp = await this.criarFollowUpCasoNecessario(ticketAtualizado, dados);
    const csatEnviado = await this.enviarCsatSeSolicitado(ticketAtualizado, dados?.solicitarAvaliacao);

    await this.finalizarSessoesTriagem(ticketAtualizado, dados?.motivo, dados?.solicitarAvaliacao);

    return {
      ticket: ticketAtualizado,
      followUp: followUp ?? undefined,
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
      return StatusTicket.RESOLVIDO;
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
      return StatusTicket.FECHADO;
    }

    return StatusTicket.RESOLVIDO;
  }

  private async criarFollowUpCasoNecessario(ticket: Ticket, dados: any) {
    if (!dados?.criarFollowUp || !dados?.dataFollowUp) {
      return null;
    }

    if (!ticket.atendenteId) {
      this.logger.warn(`⚠️ Não foi possível criar follow-up: ticket ${ticket.id} sem atendente associado`);
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
        descricao: dados.observacoes || `Revisar atendimento do cliente ${ticket.contatoNome || ticket.contatoTelefone}`,
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
      this.logger.log(`📅 Follow-up agendado: evento ${eventoSalvo.id} em ${eventoSalvo.dataInicio.toISOString()}`);

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

  private async finalizarSessoesTriagem(ticket: Ticket, motivo?: string, solicitouCsat?: boolean): Promise<void> {
    if (!ticket?.id) {
      return;
    }

    try {
      const query = this.sessaoTriagemRepository
        .createQueryBuilder('sessao')
        .where('sessao.ticketId = :ticketId', { ticketId: ticket.id });

      if (ticket.contatoTelefone) {
        query.orWhere(new Brackets((qb) => {
          qb.where('sessao.empresaId = :empresaId', { empresaId: ticket.empresaId })
            .andWhere('sessao.contatoTelefone = :telefone', { telefone: ticket.contatoTelefone })
            .andWhere('sessao.status IN (:...statusAtivos)', { statusAtivos: ['em_andamento', 'transferido'] });
        }));
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
        this.logger.log(`🔚 ${atualizadas.length} sessão(ões) de triagem finalizadas para o ticket ${ticket.id}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao finalizar sessões de triagem: ${error.message}`);
    }
  }

  private definirResultadoSessao(statusTicket: string): ResultadoSessao {
    if (statusTicket === StatusTicket.RESOLVIDO) {
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
        .andWhere('sessao.status IN (:...statusValidos)', { statusValidos: ['concluido', 'transferido'] })
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
