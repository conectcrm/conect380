import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fila, EstrategiaDistribuicao } from '../entities/fila.entity';
import { FilaAtendente } from '../entities/fila-atendente.entity';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { User } from '../../users/user.entity';
import { CreateFilaDto, UpdateFilaDto, AddAtendenteFilaDto, AtribuirTicketDto } from '../dto/fila';
import { DistribuicaoAvancadaService } from './distribuicao-avancada.service';

export interface MetricasFila {
  totalTickets: number;
  ticketsAguardando: number;
  ticketsEmAtendimento: number;
  ticketsFinalizados: number;
  tempoMedioEspera: number;
  tempoMedioAtendimento: number;
  taxaResolucao: number;
  atendentesDisponiveis: number;
  atendentesBloqueados: number;
}

@Injectable()
export class FilaService {
  private readonly logger = new Logger(FilaService.name);

  // Armazena o índice do último atendente usado (ROUND_ROBIN)
  private roundRobinIndices: Map<string, number> = new Map();

  constructor(
    @InjectRepository(Fila)
    private readonly filaRepository: Repository<Fila>,

    @InjectRepository(FilaAtendente)
    private readonly filaAtendenteRepository: Repository<FilaAtendente>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @Inject(forwardRef(() => DistribuicaoAvancadaService))
    private readonly distribuicaoAvancadaService: DistribuicaoAvancadaService,
  ) {}

  /**
   * Lista todas as filas da empresa
   */
  async listar(empresaId: string): Promise<Fila[]> {
    try {
      return await this.filaRepository.find({
        where: { empresaId },
        relations: ['atendentes', 'atendentes.atendente'],
        order: { ordem: 'ASC', nome: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar filas: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao listar filas');
    }
  }

  /**
   * Busca uma fila por ID
   */
  async buscarPorId(id: string, empresaId: string): Promise<Fila> {
    try {
      const fila = await this.filaRepository.findOne({
        where: { id, empresaId },
        relations: ['atendentes', 'atendentes.atendente'],
      });

      if (!fila) {
        throw new NotFoundException('Fila não encontrada');
      }

      return fila;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar fila ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao buscar fila');
    }
  }

  /**
   * Cria uma nova fila
   */
  async criar(empresaId: string, dto: CreateFilaDto): Promise<Fila> {
    try {
      // ⚠️ Validar empresaId
      if (!empresaId || empresaId.trim() === '') {
        this.logger.error('❌ empresaId está vazio ao criar fila');
        throw new BadRequestException('empresaId é obrigatório');
      }

      this.logger.log(`Criando fila: ${dto.nome} para empresa ${empresaId}`);

      const fila = this.filaRepository.create({
        ...dto,
        empresaId,
        estrategiaDistribuicao: dto.estrategiaDistribuicao || EstrategiaDistribuicao.ROUND_ROBIN,
        capacidadeMaxima: dto.capacidadeMaxima || 10,
        distribuicaoAutomatica: dto.distribuicaoAutomatica || false,
        ordem: dto.ordem || 0,
        ativo: dto.ativo !== undefined ? dto.ativo : true,
      });

      const filaSalva = await this.filaRepository.save(fila);
      this.logger.log(`Fila criada com sucesso: ${filaSalva.id}`);

      return filaSalva;
    } catch (error) {
      this.logger.error(`Erro ao criar fila: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao criar fila');
    }
  }

  /**
   * Atualiza uma fila existente
   */
  async atualizar(id: string, empresaId: string, dto: UpdateFilaDto): Promise<Fila> {
    try {
      this.logger.log(`Atualizando fila: ${id}`);

      const fila = await this.buscarPorId(id, empresaId);

      Object.assign(fila, dto);

      const filaAtualizada = await this.filaRepository.save(fila);
      this.logger.log(`Fila atualizada com sucesso: ${filaAtualizada.id}`);

      return filaAtualizada;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar fila ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao atualizar fila');
    }
  }

  /**
   * Remove uma fila (soft delete)
   */
  async remover(id: string, empresaId: string): Promise<void> {
    try {
      this.logger.log(`Removendo fila: ${id}`);

      const fila = await this.buscarPorId(id, empresaId);

      // Verificar se há tickets ativos nesta fila
      const ticketsAtivos = await this.ticketRepository.count({
        where: {
          filaId: id,
          status: StatusTicket.EM_ATENDIMENTO,
        },
      });

      if (ticketsAtivos > 0) {
        throw new BadRequestException(
          `Não é possível remover fila com ${ticketsAtivos} ticket(s) ativo(s)`,
        );
      }

      await this.filaRepository.softDelete(id);
      this.logger.log(`Fila removida com sucesso: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao remover fila ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao remover fila');
    }
  }

  /**
   * Adiciona um atendente a uma fila
   */
  async adicionarAtendente(
    filaId: string,
    empresaId: string,
    dto: AddAtendenteFilaDto,
  ): Promise<FilaAtendente> {
    try {
      this.logger.log(`Adicionando atendente ${dto.atendenteId} à fila ${filaId}`);

      // Verificar se fila existe
      await this.buscarPorId(filaId, empresaId);

      // Verificar se atendente existe
      const atendente = await this.userRepository.findOne({
        where: { id: dto.atendenteId },
      });

      if (!atendente) {
        throw new NotFoundException('Atendente não encontrado');
      }

      // Verificar se atendente já está na fila
      const jaExiste = await this.filaAtendenteRepository.findOne({
        where: {
          filaId,
          atendenteId: dto.atendenteId,
        },
      });

      if (jaExiste) {
        throw new BadRequestException('Atendente já está nesta fila');
      }

      // Criar relacionamento
      const filaAtendente = this.filaAtendenteRepository.create({
        filaId,
        atendenteId: dto.atendenteId,
        capacidade: dto.capacidade || 10,
        prioridade: dto.prioridade || 5,
        ativo: true,
      });

      const resultado = await this.filaAtendenteRepository.save(filaAtendente);
      this.logger.log(`Atendente ${dto.atendenteId} adicionado à fila ${filaId}`);

      return resultado;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao adicionar atendente à fila: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao adicionar atendente à fila');
    }
  }

  /**
   * Remove um atendente de uma fila
   */
  async removerAtendente(filaId: string, atendenteId: string, empresaId: string): Promise<void> {
    try {
      this.logger.log(`Removendo atendente ${atendenteId} da fila ${filaId}`);

      // Verificar se fila existe
      await this.buscarPorId(filaId, empresaId);

      const filaAtendente = await this.filaAtendenteRepository.findOne({
        where: { filaId, atendenteId },
      });

      if (!filaAtendente) {
        throw new NotFoundException('Atendente não encontrado nesta fila');
      }

      // Verificar se atendente tem tickets ativos nesta fila
      const ticketsAtivos = await this.ticketRepository.count({
        where: {
          filaId,
          atendenteId,
          status: StatusTicket.EM_ATENDIMENTO,
        },
      });

      if (ticketsAtivos > 0) {
        throw new BadRequestException(
          `Atendente possui ${ticketsAtivos} ticket(s) ativo(s) nesta fila`,
        );
      }

      await this.filaAtendenteRepository.remove(filaAtendente);
      this.logger.log(`Atendente ${atendenteId} removido da fila ${filaId}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao remover atendente da fila: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao remover atendente da fila');
    }
  }

  /**
   * Distribui um ticket para um atendente baseado na estratégia da fila
   */
  async distribuirTicket(
    empresaId: string,
    dto: AtribuirTicketDto,
  ): Promise<{ ticket: Ticket; atendente: User }> {
    try {
      this.logger.log(`Distribuindo ticket ${dto.ticketId} na fila ${dto.filaId}`);

      // Buscar ticket
      const ticket = await this.ticketRepository.findOne({
        where: { id: dto.ticketId },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket não encontrado');
      }

      // Buscar fila
      const fila = await this.buscarPorId(dto.filaId, empresaId);

      // Se distribuição manual, atribuir diretamente
      if (dto.distribuicaoAutomatica === false) {
        if (!dto.atendenteId) {
          throw new BadRequestException('atendenteId é obrigatório quando distribuição é manual');
        }

        const atendente = await this.userRepository.findOne({
          where: { id: dto.atendenteId },
        });

        if (!atendente) {
          throw new NotFoundException('Atendente não encontrado');
        }

        // Verificar se atendente está na fila
        const filaAtendente = await this.filaAtendenteRepository.findOne({
          where: {
            filaId: dto.filaId,
            atendenteId: dto.atendenteId,
            ativo: true,
          },
        });

        if (!filaAtendente) {
          throw new BadRequestException('Atendente não está nesta fila');
        }

        // Atribuir ticket
        ticket.filaId = dto.filaId;
        ticket.atendenteId = dto.atendenteId;
        ticket.status = StatusTicket.EM_ATENDIMENTO;
        await this.ticketRepository.save(ticket);

        this.logger.log(`Ticket ${dto.ticketId} atribuído manualmente para ${dto.atendenteId}`);

        return { ticket, atendente };
      }

      // Distribuição automática baseada na estratégia da fila
      let atendente: User;

      // 🚀 NOVO: Tentar usar Distribuição Avançada primeiro (se configurada)
      try {
        atendente = await this.distribuicaoAvancadaService.distribuirTicket(dto.ticketId);

        if (atendente) {
          this.logger.log(
            `✨ Distribuição Avançada: Ticket ${dto.ticketId} → Atendente ${atendente.nome}`,
          );

          // Atribuir ticket
          ticket.filaId = dto.filaId;
          ticket.atendenteId = atendente.id;
          ticket.status = StatusTicket.EM_ATENDIMENTO;
          await this.ticketRepository.save(ticket);

          // Atualizar contador de tickets do atendente
          await this.userRepository.update(atendente.id, {
            tickets_ativos: atendente.tickets_ativos + 1,
          });

          this.logger.log(
            `Ticket ${dto.ticketId} distribuído via algoritmo avançado para ${atendente.id}`,
          );

          return { ticket, atendente };
        }
      } catch (error) {
        // Se distribuição avançada falhar, continua com estratégia antiga
        this.logger.warn(
          `⚠️ Distribuição Avançada não disponível para fila ${dto.filaId}: ${error.message}`,
        );
      }

      // Fallback: Distribuição padrão (estratégia antiga)
      switch (fila.estrategiaDistribuicao) {
        case EstrategiaDistribuicao.ROUND_ROBIN:
          atendente = await this.distribuirRoundRobin(fila);
          break;

        case EstrategiaDistribuicao.MENOR_CARGA:
          atendente = await this.distribuirMenorCarga(fila);
          break;

        case EstrategiaDistribuicao.PRIORIDADE:
          atendente = await this.distribuirPorPrioridade(fila);
          break;

        default:
          throw new BadRequestException(
            `Estratégia de distribuição inválida: ${fila.estrategiaDistribuicao}`,
          );
      }

      if (!atendente) {
        throw new BadRequestException('Nenhum atendente disponível nesta fila');
      }

      // Atribuir ticket
      ticket.filaId = dto.filaId;
      ticket.atendenteId = atendente.id;
      ticket.status = StatusTicket.EM_ATENDIMENTO;
      await this.ticketRepository.save(ticket);

      // Atualizar contador de tickets do atendente
      await this.userRepository.update(atendente.id, {
        tickets_ativos: atendente.tickets_ativos + 1,
      });

      this.logger.log(
        `Ticket ${dto.ticketId} distribuído automaticamente para ${atendente.id} (${fila.estrategiaDistribuicao})`,
      );

      return { ticket, atendente };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao distribuir ticket: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao distribuir ticket');
    }
  }

  /**
   * ROUND_ROBIN: Rotação circular entre atendentes
   */
  private async distribuirRoundRobin(fila: Fila): Promise<User | null> {
    this.logger.log(`Distribuindo com estratégia ROUND_ROBIN na fila ${fila.id}`);

    // Buscar atendentes ativos da fila
    const filasAtendentes = await this.filaAtendenteRepository.find({
      where: { filaId: fila.id, ativo: true },
      relations: ['atendente'],
      order: { prioridade: 'ASC' },
    });

    if (filasAtendentes.length === 0) {
      return null;
    }

    // Obter índice atual para esta fila
    const indiceAtual = this.roundRobinIndices.get(fila.id) || 0;

    // Buscar atendentes disponíveis (capacidade não atingida)
    const atendentesDisponiveis: User[] = [];

    for (const fa of filasAtendentes) {
      const atendente = fa.atendente;
      if (atendente.status_atendente === 'DISPONIVEL' && atendente.tickets_ativos < fa.capacidade) {
        atendentesDisponiveis.push(atendente);
      }
    }

    if (atendentesDisponiveis.length === 0) {
      this.logger.warn(`Nenhum atendente disponível na fila ${fila.id}`);
      return null;
    }

    // Rotacionar para o próximo atendente
    const proximoIndice = indiceAtual % atendentesDisponiveis.length;
    const atendenteEscolhido = atendentesDisponiveis[proximoIndice];

    // Atualizar índice para próxima chamada
    this.roundRobinIndices.set(fila.id, proximoIndice + 1);

    this.logger.log(
      `ROUND_ROBIN: Atendente ${atendenteEscolhido.id} escolhido (índice ${proximoIndice}/${atendentesDisponiveis.length})`,
    );

    return atendenteEscolhido;
  }

  /**
   * MENOR_CARGA: Atribui para quem tem menos tickets
   */
  private async distribuirMenorCarga(fila: Fila): Promise<User | null> {
    this.logger.log(`Distribuindo com estratégia MENOR_CARGA na fila ${fila.id}`);

    // Buscar atendentes ativos da fila
    const filasAtendentes = await this.filaAtendenteRepository.find({
      where: { filaId: fila.id, ativo: true },
      relations: ['atendente'],
    });

    if (filasAtendentes.length === 0) {
      return null;
    }

    // Filtrar atendentes disponíveis e ordenar por carga (tickets_ativos)
    const atendentesDisponiveis = filasAtendentes
      .filter(
        (fa) =>
          fa.atendente.status_atendente === 'DISPONIVEL' &&
          fa.atendente.tickets_ativos < fa.capacidade,
      )
      .map((fa) => fa.atendente)
      .sort((a, b) => a.tickets_ativos - b.tickets_ativos);

    if (atendentesDisponiveis.length === 0) {
      this.logger.warn(`Nenhum atendente disponível na fila ${fila.id}`);
      return null;
    }

    // Escolher o com menor carga
    const atendenteEscolhido = atendentesDisponiveis[0];

    this.logger.log(
      `MENOR_CARGA: Atendente ${atendenteEscolhido.id} escolhido (${atendenteEscolhido.tickets_ativos} tickets ativos)`,
    );

    return atendenteEscolhido;
  }

  /**
   * PRIORIDADE: Atribui baseado na prioridade configurada (1=alta, 10=baixa)
   */
  private async distribuirPorPrioridade(fila: Fila): Promise<User | null> {
    this.logger.log(`Distribuindo com estratégia PRIORIDADE na fila ${fila.id}`);

    // Buscar atendentes ativos da fila, ordenados por prioridade
    const filasAtendentes = await this.filaAtendenteRepository.find({
      where: { filaId: fila.id, ativo: true },
      relations: ['atendente'],
      order: { prioridade: 'ASC' }, // 1 = alta prioridade
    });

    if (filasAtendentes.length === 0) {
      return null;
    }

    // Percorrer atendentes por ordem de prioridade
    for (const fa of filasAtendentes) {
      const atendente = fa.atendente;
      if (atendente.status_atendente === 'DISPONIVEL' && atendente.tickets_ativos < fa.capacidade) {
        this.logger.log(
          `PRIORIDADE: Atendente ${atendente.id} escolhido (prioridade ${fa.prioridade}, ${atendente.tickets_ativos} tickets ativos)`,
        );
        return atendente;
      }
    }

    this.logger.warn(`Nenhum atendente disponível na fila ${fila.id} (todos em capacidade máxima)`);
    return null;
  }

  /**
   * Obter métricas de uma fila
   */
  async obterMetricas(filaId: string, empresaId: string): Promise<MetricasFila> {
    try {
      this.logger.log(`Obtendo métricas da fila ${filaId}`);

      // Verificar se fila existe
      await this.buscarPorId(filaId, empresaId);

      // Total de tickets
      const totalTickets = await this.ticketRepository.count({
        where: { filaId },
      });

      // Tickets aguardando
      const ticketsAguardando = await this.ticketRepository.count({
        where: { filaId, status: StatusTicket.AGUARDANDO_CLIENTE },
      });

      // Tickets em atendimento
      const ticketsEmAtendimento = await this.ticketRepository.count({
        where: { filaId, status: StatusTicket.EM_ATENDIMENTO },
      });

      // Tickets finalizados
      const ticketsFinalizados = await this.ticketRepository.count({
        where: { filaId, status: StatusTicket.ENCERRADO },
      });

      // Atendentes disponíveis
      const filasAtendentes = await this.filaAtendenteRepository.find({
        where: { filaId, ativo: true },
        relations: ['atendente'],
      });

      const atendentesDisponiveis = filasAtendentes.filter(
        (fa) =>
          fa.atendente.status_atendente === 'DISPONIVEL' &&
          fa.atendente.tickets_ativos < fa.capacidade,
      ).length;

      const atendentesBloqueados = filasAtendentes.filter(
        (fa) =>
          fa.atendente.status_atendente !== 'DISPONIVEL' ||
          fa.atendente.tickets_ativos >= fa.capacidade,
      ).length;

      // TODO: Implementar cálculo de tempo médio (requer histórico de tickets)
      const tempoMedioEspera = 0;
      const tempoMedioAtendimento = 0;

      // Taxa de resolução
      const taxaResolucao = totalTickets > 0 ? (ticketsFinalizados / totalTickets) * 100 : 0;

      return {
        totalTickets,
        ticketsAguardando,
        ticketsEmAtendimento,
        ticketsFinalizados,
        tempoMedioEspera,
        tempoMedioAtendimento,
        taxaResolucao: Math.round(taxaResolucao * 100) / 100,
        atendentesDisponiveis,
        atendentesBloqueados,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao obter métricas da fila ${filaId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao obter métricas da fila');
    }
  }

  // ========================================
  // MÉTODOS ENTERPRISE - Consolidação Equipe → Fila
  // ========================================

  /**
   * Atribui núcleo e/ou departamento a uma fila
   * @param filaId - ID da fila
   * @param nucleoId - ID do núcleo (opcional)
   * @param departamentoId - ID do departamento (opcional)
   * @returns Fila atualizada
   */
  async atribuirNucleoOuDepartamento(
    filaId: string,
    empresaId: string,
    nucleoId?: string,
    departamentoId?: string,
  ): Promise<Fila> {
    try {
      // Validar que pelo menos um foi fornecido
      if (!nucleoId && !departamentoId) {
        throw new BadRequestException('É necessário fornecer nucleoId ou departamentoId');
      }

      // Buscar fila
      const fila = await this.buscarPorId(filaId, empresaId);

      // Atualizar campos
      if (nucleoId) {
        fila.nucleoId = nucleoId;
      }
      if (departamentoId) {
        fila.departamentoId = departamentoId;
      }

      // Salvar
      const filaAtualizada = await this.filaRepository.save(fila);

      this.logger.log(
        `Fila ${filaId} atribuída - Núcleo: ${nucleoId || 'N/A'}, Departamento: ${departamentoId || 'N/A'}`,
      );

      return filaAtualizada;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atribuir núcleo/departamento à fila ${filaId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Erro ao atribuir núcleo/departamento à fila');
    }
  }

  /**
   * Lista filas de um núcleo específico
   * @param nucleoId - ID do núcleo
   * @param empresaId - ID da empresa
   * @returns Lista de filas
   */
  async listarPorNucleo(nucleoId: string, empresaId: string): Promise<Fila[]> {
    try {
      return await this.filaRepository.find({
        where: {
          nucleoId,
          empresaId,
          ativo: true,
        },
        relations: ['atendentes', 'atendentes.atendente', 'nucleo'],
        order: { ordem: 'ASC', nome: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar filas do núcleo ${nucleoId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Erro ao listar filas por núcleo');
    }
  }

  /**
   * Lista filas de um departamento específico
   * @param departamentoId - ID do departamento
   * @param empresaId - ID da empresa
   * @returns Lista de filas
   */
  async listarPorDepartamento(departamentoId: string, empresaId: string): Promise<Fila[]> {
    try {
      return await this.filaRepository.find({
        where: {
          departamentoId,
          empresaId,
          ativo: true,
        },
        relations: ['atendentes', 'atendentes.atendente', 'departamento'],
        order: { ordem: 'ASC', nome: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar filas do departamento ${departamentoId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Erro ao listar filas por departamento');
    }
  }

  /**
   * Busca fila ideal para um núcleo (distribuição inteligente)
   * Usado pelo bot de triagem para escolher fila automaticamente
   * @param nucleoId - ID do núcleo
   * @param empresaId - ID da empresa
   * @returns Fila com menor carga ou null
   */
  async buscarFilaIdealPorNucleo(nucleoId: string, empresaId: string): Promise<Fila | null> {
    try {
      const filas = await this.listarPorNucleo(nucleoId, empresaId);

      if (filas.length === 0) {
        this.logger.warn(`Nenhuma fila ativa encontrada para núcleo ${nucleoId}`);
        return null;
      }

      // Filtrar filas com distribuição automática ativa
      const filasAutomaticas = filas.filter((fila) => fila.distribuicaoAutomatica);

      if (filasAutomaticas.length === 0) {
        // Se nenhuma tem distribuição automática, retornar primeira
        return filas[0];
      }

      // Buscar fila com menor carga
      let filaIdeal = filasAutomaticas[0];
      let menorCarga = await this.contarTicketsAtivos(filaIdeal.id);

      for (const fila of filasAutomaticas.slice(1)) {
        const carga = await this.contarTicketsAtivos(fila.id);
        if (carga < menorCarga) {
          menorCarga = carga;
          filaIdeal = fila;
        }
      }

      this.logger.log(
        `Fila ideal para núcleo ${nucleoId}: ${filaIdeal.nome} (carga: ${menorCarga})`,
      );

      return filaIdeal;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar fila ideal para núcleo ${nucleoId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Conta tickets ativos em uma fila (aguardando + em atendimento)
   * @param filaId - ID da fila
   * @returns Número de tickets ativos
   */
  private async contarTicketsAtivos(filaId: string): Promise<number> {
    try {
      return await this.ticketRepository.count({
        where: [
          { filaId: filaId, status: StatusTicket.AGUARDANDO_CLIENTE },
          { filaId: filaId, status: StatusTicket.EM_ATENDIMENTO },
        ],
      });
    } catch (error) {
      this.logger.error(`Erro ao contar tickets ativos da fila ${filaId}: ${error.message}`);
      return 0;
    }
  }
}
