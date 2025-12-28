import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Demanda } from '../entities/demanda.entity';
import { Ticket } from '../entities/ticket.entity';
import { Mensagem } from '../entities/mensagem.entity';
import { CreateDemandaDto } from '../dto/create-demanda.dto';
import { UpdateDemandaDto } from '../dto/update-demanda.dto';

/**
 * Service para gerenciar demandas dos clientes
 *
 * @deprecated ⚠️ ESTE SERVICE ESTÁ SENDO DESCONTINUADO
 *
 * 🔄 **MIGRAÇÃO EM ANDAMENTO**: Sprint 1 - Unificação Tickets + Demandas
 *
 * **Por que deprecado?**
 * - Tickets e Demandas são conceitos redundantes no sistema
 * - Entity Ticket foi expandida para absorver funcionalidades de Demanda
 * - Manter dois sistemas paralelos aumenta complexidade e duplicação
 *
 * **O que usar no lugar?**
 * - Use `TicketService` com campo `tipo: TipoTicket.DEMANDA`
 * - Entity Ticket agora tem: cliente_id, titulo, descricao, tipo, data_vencimento, responsavel_id, autor_id
 * - Filtre tickets por tipo: `ticketService.listar({ tipo: 'demanda' })`
 *
 * **Quando este service será removido?**
 * - Sprint 2-3 (após migração SQL e validação frontend)
 * - Migration SQL migrará registros de demandas → tickets
 * - Este service continuará funcionando até conclusão da migração
 *
 * **Referência**: Ver ROADMAP_UNIFICACAO_TICKETS_DEMANDAS.md e SPRINT_1_PROGRESSO.md
 *
 * Funcionalidades (legado):
 * - CRUD completo de demandas
 * - Buscar demandas por cliente
 * - Buscar demandas por telefone (fallback)
 * - Buscar demandas por ticket
 * - Filtrar por status, prioridade, tipo
 * - Atualizar status (abrir, iniciar, concluir, cancelar)
 * - Atribuir responsável
 */
@Injectable()
export class DemandaService {
  private readonly logger = new Logger(DemandaService.name);

  constructor(
    @InjectRepository(Demanda)
    private readonly demandaRepository: Repository<Demanda>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Mensagem)
    private readonly mensagemRepository: Repository<Mensagem>,
  ) { }

  /**
   * Criar nova demanda
   * @deprecated Use TicketService.criar() com tipo: 'demanda'
   */
  async criar(dto: CreateDemandaDto, autorId: string, empresaId: string): Promise<Demanda> {
    this.logger.warn(`⚠️ [DEPRECATED] DemandaService.criar() - Migre para TicketService.criar({ tipo: 'demanda' })`);
    this.logger.log(`📋 Criando demanda: ${dto.titulo}`);

    // Validar que pelo menos um identificador foi fornecido
    if (!dto.clienteId && !dto.contatoTelefone && !dto.ticketId) {
      throw new Error('É necessário fornecer clienteId, contatoTelefone ou ticketId');
    }

    const demanda = this.demandaRepository.create({
      ...dto,
      autorId,
      empresaId: dto.empresaId || empresaId,
      tipo: dto.tipo || 'outros',
      prioridade: dto.prioridade || 'media',
      status: dto.status || 'aberta',
    });

    const demandaSalva = await this.demandaRepository.save(demanda);
    this.logger.log(`✅ Demanda criada: ${demandaSalva.id}`);

    // Retornar com relações preenchidas
    return await this.buscarPorId(demandaSalva.id);
  }

  /**
   * Buscar demanda por ID
   */
  async buscarPorId(id: string): Promise<Demanda> {
    const demanda = await this.demandaRepository.findOne({
      where: { id },
      relations: ['autor', 'responsavel'],
    });

    if (!demanda) {
      throw new NotFoundException(`Demanda ${id} não encontrada`);
    }

    return demanda;
  }

  /**
   * Listar todas as demandas com filtros opcionais
   * @deprecated Use TicketService.listar({ tipo: 'demanda' })
   */
  async listarTodas(
    empresaId?: string,
    status?: string,
    prioridade?: string,
    tipo?: string,
  ): Promise<Demanda[]> {
    this.logger.warn(`⚠️ [DEPRECATED] DemandaService.listarTodas() - Migre para TicketService.listar({ tipo: 'demanda' })`);
    this.logger.log('📋 Listando todas as demandas');

    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (tipo) where.tipo = tipo;

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar todas as demandas de um cliente
   * Ordena por: urgente primeiro, depois por data de criação (mais recente)
   */
  async buscarPorCliente(clienteId: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do cliente ${clienteId}`);

    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC', // urgente > alta > media > baixa
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas por telefone do contato
   */
  async buscarPorTelefone(contatoTelefone: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do telefone ${contatoTelefone}`);

    const where: any = { contatoTelefone };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas de um ticket específico
   */
  async buscarPorTicket(ticketId: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do ticket ${ticketId}`);

    const where: any = { ticketId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas por status
   */
  async buscarPorStatus(status: Demanda['status'], empresaId?: string): Promise<Demanda[]> {
    const where: any = { status };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Atualizar demanda
   * @deprecated Use TicketService.atualizar()
   */
  async atualizar(id: string, dto: UpdateDemandaDto): Promise<Demanda> {
    this.logger.warn(`⚠️ [DEPRECATED] DemandaService.atualizar() - Migre para TicketService.atualizar()`);
    const demanda = await this.buscarPorId(id);

    // Atualizar campos permitidos
    if (dto.titulo !== undefined) demanda.titulo = dto.titulo;
    if (dto.descricao !== undefined) demanda.descricao = dto.descricao;
    if (dto.tipo !== undefined) demanda.tipo = dto.tipo;
    if (dto.prioridade !== undefined) demanda.prioridade = dto.prioridade;
    if (dto.status !== undefined) demanda.status = dto.status;
    if (dto.dataVencimento !== undefined) demanda.dataVencimento = new Date(dto.dataVencimento);
    if (dto.responsavelId !== undefined) demanda.responsavelId = dto.responsavelId;

    // Se status mudou para 'concluida', registrar data de conclusão
    if (dto.status === 'concluida' && demanda.status !== 'concluida') {
      demanda.dataConclusao = new Date();
    }

    const demandaAtualizada = await this.demandaRepository.save(demanda);
    this.logger.log(`✅ Demanda ${id} atualizada`);

    return await this.buscarPorId(demandaAtualizada.id);
  }

  /**
   * Atribuir responsável
   */
  async atribuirResponsavel(id: string, responsavelId: string): Promise<Demanda> {
    return await this.atualizar(id, { responsavelId });
  }

  /**
   * Alterar status
   */
  async alterarStatus(id: string, status: Demanda['status']): Promise<Demanda> {
    return await this.atualizar(id, { status });
  }

  /**
   * Iniciar demanda (status → em_andamento)
   */
  async iniciar(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'em_andamento');
  }

  /**
   * Concluir demanda (status → concluida + registrar data)
   */
  async concluir(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'concluida');
  }

  /**
   * Cancelar demanda
   */
  async cancelar(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'cancelada');
  }

  /**
   * Deletar demanda
   */
  async deletar(id: string): Promise<void> {
    const demanda = await this.buscarPorId(id);
    await this.demandaRepository.remove(demanda);
    this.logger.log(`🗑️ Demanda ${id} deletada`);
  }

  /**
   * Contar demandas de um cliente
   */
  async contarPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }

  /**
   * Contar demandas abertas de um cliente
   */
  async contarAbertasPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId, status: 'aberta' };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }

  /**
   * Contar demandas urgentes de um cliente
   */
  async contarUrgentesPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId, prioridade: 'urgente' };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }

  /**
   * CONVERTER TICKET EM DEMANDA
   * Cria uma demanda a partir de um ticket de atendimento
   * @deprecated Feature será removida - Tickets agora suportam tipo 'demanda' nativamente
   */
  async converterTicketEmDemanda(
    ticketId: string,
    dto: Partial<CreateDemandaDto>,
    autorId: string,
  ): Promise<Demanda> {
    try {
      this.logger.warn(`⚠️ [DEPRECATED] DemandaService.converterTicketEmDemanda() - Use TicketService.atualizar(ticketId, { tipo: 'demanda', titulo, descricao })`);
      this.logger.log(`🎫➡️📋 Convertendo ticket ${ticketId} em demanda`);
      this.logger.log(`Autor: ${autorId}, DTO: ${JSON.stringify(dto)}`);

      // 1. Buscar ticket com relações
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['fila'],
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} não encontrado`);
      }

      this.logger.log(`✅ Ticket encontrado: ${ticket.numero} - ${ticket.assunto}`);

      // 2. Verificar se já existe demanda para este ticket
      const demandaExistente = await this.demandaRepository.findOne({
        where: { ticketId },
      });

      if (demandaExistente) {
        this.logger.warn(`⚠️ Ticket ${ticketId} já possui demanda ${demandaExistente.id}`);
        throw new ConflictException({
          message: `Ticket já foi convertido em demanda`,
          demandaId: demandaExistente.id,
        });
      }

      this.logger.log(`✅ Ticket não possui demanda, prosseguindo...`);

      // 3. Buscar última mensagem do ticket
      this.logger.log(`🔍 Buscando última mensagem...`);
      const ultimaMensagemObj = await this.mensagemRepository.findOne({
        where: { ticketId },
        order: { createdAt: 'DESC' },
      });

      const ultimaMensagem = ultimaMensagemObj?.conteudo || '';
      this.logger.log(`✅ Mensagem encontrada: ${ultimaMensagem.substring(0, 50)}...`);

      const titulo = dto.titulo || `Demanda do ticket #${ticket.numero || ticketId.substring(0, 8)}`;

      this.logger.log(`📝 Montando descrição...`);
      const descricao = dto.descricao || (await this.montarDescricaoDoTicket(ticket, ultimaMensagem));

      // 4. Determinar tipo de demanda baseado no contexto
      const tipo = dto.tipo || this.inferirTipoDemanda(ticket, ultimaMensagem);
      this.logger.log(`🏷️ Tipo inferido: ${tipo}`);

      // 5. Determinar prioridade baseado no ticket
      const prioridade = dto.prioridade || this.inferirPrioridade(ticket);
      this.logger.log(`⚡ Prioridade inferida: ${prioridade}`);

      // 6. Criar demanda
      this.logger.log(`💾 Criando demanda...`);
      const demanda = this.demandaRepository.create({
        titulo,
        descricao,
        tipo,
        prioridade,
        status: dto.status || 'aberta',
        ticketId: ticket.id,
        clienteId: dto.clienteId || null,
        contatoTelefone: ticket.contatoTelefone || null,
        responsavelId: dto.responsavelId || ticket.atendenteId,
        autorId,
        empresaId: ticket.empresaId,
        dataVencimento: dto.dataVencimento,
      });

      this.logger.log(`💾 Salvando demanda no banco...`);
      const demandaSalva = await this.demandaRepository.save(demanda);

      this.logger.log(`✅ Demanda ${demandaSalva.id} criada com sucesso a partir do ticket ${ticketId}!`);

      // Retornar com relações carregadas
      return await this.buscarPorId(demandaSalva.id);

    } catch (error) {
      this.logger.error(`❌ Erro ao converter ticket em demanda: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Montar descrição da demanda a partir do contexto do ticket
   */
  private async montarDescricaoDoTicket(ticket: Ticket, ultimaMensagem: string): Promise<string> {
    let descricao = '';

    if (ultimaMensagem) {
      descricao += `**Última mensagem do cliente:**\n${ultimaMensagem}\n\n`;
    }

    // Contar total de mensagens do ticket
    const totalMensagens = await this.mensagemRepository.count({
      where: { ticketId: ticket.id },
    });

    descricao += `---\n**Contexto do Ticket:**\n`;
    descricao += `- Número: #${ticket.numero || ticket.id.substring(0, 8)}\n`;
    descricao += `- Fila: ${ticket.fila?.nome || 'N/A'}\n`;
    descricao += `- Contato: ${ticket.contatoNome || ticket.contatoTelefone || 'N/A'}\n`;
    descricao += `- Status: ${ticket.status}\n`;
    descricao += `- Mensagens: ${totalMensagens}\n`;
    descricao += `- Aberto em: ${ticket.createdAt?.toISOString() || 'N/A'}\n`;

    return descricao;
  }

  /**
   * Inferir tipo de demanda baseado no contexto do ticket
   */
  private inferirTipoDemanda(ticket: Ticket, ultimaMensagem: string): Demanda['tipo'] {
    const mensagemLower = ultimaMensagem.toLowerCase();

    // Palavras-chave para cada tipo
    const keywords = {
      tecnica: ['erro', 'bug', 'falha', 'não funciona', 'problema técnico', 'travou', 'sistema'],
      suporte: ['ajuda', 'dúvida', 'como', 'tutorial', 'auxílio', 'suporte'],
      financeira: ['pagamento', 'fatura', 'boleto', 'cobrança', 'preço', 'valor', 'financeiro'],
      comercial: ['venda', 'proposta', 'orçamento', 'plano', 'upgrade', 'contrato'],
      reclamacao: ['reclamação', 'insatisfeito', 'problema', 'ruim', 'péssimo', 'cancelar'],
      solicitacao: ['solicito', 'preciso', 'gostaria', 'quero', 'necessito'],
    };

    // Verificar keywords
    for (const [tipo, palavras] of Object.entries(keywords)) {
      if (palavras.some(palavra => mensagemLower.includes(palavra))) {
        return tipo as Demanda['tipo'];
      }
    }

    // Default
    return 'suporte';
  }

  /**
   * Inferir prioridade baseado no ticket
   */
  private inferirPrioridade(ticket: Ticket): Demanda['prioridade'] {
    // Se ticket tem SLA vencido ou próximo de vencer
    if (ticket.slaExpiresAt) {
      const agora = new Date();
      const sla = new Date(ticket.slaExpiresAt);
      const horasRestantes = (sla.getTime() - agora.getTime()) / (1000 * 60 * 60);

      if (horasRestantes < 0) {
        return 'urgente'; // SLA já vencido
      } else if (horasRestantes < 2) {
        return 'alta'; // Menos de 2 horas
      }
    }

    // Se ticket está há muito tempo aberto (> 3 dias)
    if (ticket.createdAt) {
      const diasAberto = (new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (diasAberto > 3) {
        return 'alta';
      }
    }

    // Default
    return 'media';
  }
}
