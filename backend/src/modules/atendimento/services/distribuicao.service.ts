import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fila, EstrategiaDistribuicao } from '../entities/fila.entity';
import { FilaAtendente } from '../entities/fila-atendente.entity';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { User } from '../../users/user.entity';

/**
 * Service responsável pela distribuição automática de tickets
 *
 * Implementa 3 algoritmos:
 * 1. ROUND_ROBIN: Revezamento circular entre atendentes
 * 2. MENOR_CARGA: Atribui para quem tem menos tickets ativos
 * 3. PRIORIDADE: Atribui baseado na prioridade configurada em FilaAtendente
 */
@Injectable()
export class DistribuicaoService {
  private readonly logger = new Logger(DistribuicaoService.name);

  constructor(
    @InjectRepository(Fila)
    private readonly filaRepository: Repository<Fila>,

    @InjectRepository(FilaAtendente)
    private readonly filaAtendenteRepository: Repository<FilaAtendente>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Distribui um ticket para um atendente disponível
   *
   * @param ticketId - ID do ticket a ser distribuído
   * @returns Ticket atualizado com atendenteId
   */
  async distribuirTicket(ticketId: string, empresaId: string): Promise<Ticket> {
    this.logger.log(`🎯 Iniciando distribuição do ticket ${ticketId}`);

    // 1. Buscar ticket
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, empresaId },
      relations: ['fila'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} não encontrado`);
    }

    if (ticket.atendenteId) {
      this.logger.warn(`Ticket ${ticketId} já está atribuído ao atendente ${ticket.atendenteId}`);
      return ticket;
    }

    if (!ticket.filaId) {
      throw new BadRequestException(`Ticket ${ticketId} não está em nenhuma fila`);
    }

    // 2. Buscar fila e validar se distribuição automática está ativada
    const fila = await this.filaRepository.findOne({
      where: { id: ticket.filaId, empresaId },
    });

    if (!fila) {
      throw new NotFoundException(`Fila ${ticket.filaId} não encontrada`);
    }

    if (!fila.distribuicaoAutomatica) {
      this.logger.log(`Fila ${fila.nome} não tem distribuição automática ativada`);
      return ticket;
    }

    // 3. Buscar atendente disponível usando algoritmo configurado
    const atendenteId = await this.calcularProximoAtendente(
      fila.id,
      fila.estrategiaDistribuicao,
      empresaId,
    );

    if (!atendenteId) {
      this.logger.warn(`Nenhum atendente disponível na fila ${fila.nome}`);
      return ticket;
    }

    // 4. Atribuir atendente
    ticket.atendenteId = atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;
    await this.ticketRepository.save(ticket);

    this.logger.log(`✅ Ticket ${ticketId} distribuído para atendente ${atendenteId}`);

    return ticket;
  }

  /**
   * Redistribui todos os tickets pendentes de uma fila
   *
   * @param filaId - ID da fila
   * @returns Número de tickets redistribuídos
   */
  async redistribuirFila(filaId: string, empresaId: string): Promise<{ distribuidos: number }> {
    this.logger.log(`🔄 Redistribuindo tickets da fila ${filaId}`);

    const ticketsPendentes = await this.ticketRepository.find({
      where: {
        filaId,
        empresaId,
        atendenteId: null,
        status: StatusTicket.FILA,
      },
    });

    let distribuidos = 0;

    for (const ticket of ticketsPendentes) {
      try {
        await this.distribuirTicket(ticket.id, empresaId);
        distribuidos++;
      } catch (error) {
        this.logger.error(`Erro ao distribuir ticket ${ticket.id}: ${error.message}`);
      }
    }

    this.logger.log(
      `✅ Redistribuição concluída: ${distribuidos}/${ticketsPendentes.length} tickets`,
    );

    return { distribuidos };
  }

  /**
   * Calcula o próximo atendente a receber um ticket baseado no algoritmo configurado
   *
   * @param filaId - ID da fila
   * @param estrategia - Algoritmo de distribuição
   * @returns ID do atendente escolhido ou null se nenhum disponível
   */
  async calcularProximoAtendente(
    filaId: string,
    estrategia: EstrategiaDistribuicao,
    empresaId: string,
  ): Promise<string | null> {
    // 1. Buscar atendentes disponíveis
    const atendentesDisponiveis = await this.buscarAtendentesDisponiveis(filaId, empresaId);

    if (atendentesDisponiveis.length === 0) {
      this.logger.warn(`Nenhum atendente disponível na fila ${filaId}`);
      return null;
    }

    // 2. Aplicar algoritmo
    let atendenteEscolhido: FilaAtendente;

    switch (estrategia) {
      case EstrategiaDistribuicao.ROUND_ROBIN:
        atendenteEscolhido = await this.algoritmoRoundRobin(
          atendentesDisponiveis,
          filaId,
          empresaId,
        );
        break;

      case EstrategiaDistribuicao.MENOR_CARGA:
        atendenteEscolhido = await this.algoritmoMenorCarga(atendentesDisponiveis, empresaId);
        break;

      case EstrategiaDistribuicao.PRIORIDADE:
        atendenteEscolhido = await this.algoritmoPrioridade(atendentesDisponiveis, empresaId);
        break;

      default:
        atendenteEscolhido = await this.algoritmoMenorCarga(atendentesDisponiveis, empresaId);
    }

    this.logger.log(
      `🎯 Algoritmo ${estrategia}: Escolhido atendente ${atendenteEscolhido.atendenteId}`,
    );

    return atendenteEscolhido.atendenteId;
  }

  /**
   * Busca atendentes disponíveis para receber tickets
   *
   * Critérios:
   * - Atendente está ativo na fila (FilaAtendente.ativo = true)
   * - Atendente não atingiu capacidade máxima
   */
  private async buscarAtendentesDisponiveis(
    filaId: string,
    empresaId: string,
  ): Promise<FilaAtendente[]> {
    // Buscar todos atendentes da fila
    const filasAtendentes = await this.filaAtendenteRepository.find({
      where: { filaId, empresaId, ativo: true },
      relations: ['atendente'],
    });

    if (filasAtendentes.length === 0) {
      return [];
    }

    // Contar tickets ativos de cada atendente
    const atendentesComCapacidade: FilaAtendente[] = [];

    for (const filaAtendente of filasAtendentes) {
      const ticketsAtivos = await this.ticketRepository.count({
        where: {
          atendenteId: filaAtendente.atendenteId,
          empresaId,
          status: StatusTicket.EM_ATENDIMENTO,
        },
      });

      // Verifica se atendente ainda tem capacidade
      if (ticketsAtivos < filaAtendente.capacidade) {
        atendentesComCapacidade.push(filaAtendente);
      }
    }

    return atendentesComCapacidade;
  }

  /**
   * Algoritmo ROUND_ROBIN: Revezamento circular
   *
   * Lógica:
   * 1. Busca último atendente que recebeu ticket
   * 2. Escolhe o próximo na lista
   * 3. Se chegou no fim, volta pro começo
   */
  private async algoritmoRoundRobin(
    atendentes: FilaAtendente[],
    filaId: string,
    empresaId: string,
  ): Promise<FilaAtendente> {
    // Buscar último ticket distribuído nesta fila
    const ultimoTicket = await this.ticketRepository.findOne({
      where: { filaId, empresaId },
      order: { createdAt: 'DESC' },
    });

    if (!ultimoTicket || !ultimoTicket.atendenteId) {
      // Se não há histórico, retorna o primeiro
      return atendentes[0];
    }

    // Encontrar índice do último atendente
    const indexUltimo = atendentes.findIndex((a) => a.atendenteId === ultimoTicket.atendenteId);

    // Próximo atendente (circular)
    const proximoIndex = indexUltimo >= 0 ? (indexUltimo + 1) % atendentes.length : 0;

    return atendentes[proximoIndex];
  }

  /**
   * Algoritmo MENOR_CARGA: Atribui para quem tem menos tickets ativos
   *
   * Lógica:
   * 1. Conta tickets ativos de cada atendente
   * 2. Retorna o que tem menos
   * 3. Em caso de empate, usa prioridade
   */
  private async algoritmoMenorCarga(
    atendentes: FilaAtendente[],
    empresaId: string,
  ): Promise<FilaAtendente> {
    const atendentesComCarga = await Promise.all(
      atendentes.map(async (atendente) => {
        const carga = await this.ticketRepository.count({
          where: {
            atendenteId: atendente.atendenteId,
            empresaId,
            status: StatusTicket.EM_ATENDIMENTO,
          },
        });

        return { atendente, carga };
      }),
    );

    // Ordenar por carga (menor primeiro) e depois por prioridade (menor = maior prioridade)
    atendentesComCarga.sort((a, b) => {
      if (a.carga !== b.carga) {
        return a.carga - b.carga;
      }
      return a.atendente.prioridade - b.atendente.prioridade;
    });

    return atendentesComCarga[0].atendente;
  }

  /**
   * Algoritmo PRIORIDADE: Atribui baseado na prioridade configurada
   *
   * Lógica:
   * 1. Ordena atendentes por prioridade (1 = maior)
   * 2. Retorna o de maior prioridade
   * 3. Em caso de empate, usa menor carga
   */
  private async algoritmoPrioridade(
    atendentes: FilaAtendente[],
    empresaId: string,
  ): Promise<FilaAtendente> {
    const atendentesComCarga = await Promise.all(
      atendentes.map(async (atendente) => {
        const carga = await this.ticketRepository.count({
          where: {
            atendenteId: atendente.atendenteId,
            empresaId,
            status: StatusTicket.EM_ATENDIMENTO,
          },
        });

        return { atendente, carga };
      }),
    );

    // Ordenar por prioridade (menor = maior prioridade) e depois por carga
    atendentesComCarga.sort((a, b) => {
      if (a.atendente.prioridade !== b.atendente.prioridade) {
        return a.atendente.prioridade - b.atendente.prioridade;
      }
      return a.carga - b.carga;
    });

    return atendentesComCarga[0].atendente;
  }

  /**
   * Busca estatísticas de distribuição para o dashboard
   *
   * @param empresaId - ID da empresa
   * @returns Estatísticas de tickets e filas
   */
  async buscarEstatisticas(empresaId: string) {
    this.logger.log(`Buscando estatisticas de distribuicao - Empresa: ${empresaId}`);

    const totalAguardando = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.empresaId = :empresaId', { empresaId })
      .andWhere('ticket.atendenteId IS NULL')
      .andWhere('ticket.status IN (:...status)', {
        status: [StatusTicket.FILA, StatusTicket.AGUARDANDO_CLIENTE],
      })
      .getCount();

    const totalEmAtendimento = await this.ticketRepository.count({
      where: {
        empresaId,
        status: StatusTicket.EM_ATENDIMENTO,
      },
    });

    const totalFinalizados = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.empresaId = :empresaId', { empresaId })
      .andWhere('ticket.status IN (:...status)', {
        status: [StatusTicket.ENCERRADO, StatusTicket.CONCLUIDO],
      })
      .getCount();

    const atendentesDisponiveisRaw = await this.filaAtendenteRepository
      .createQueryBuilder('fa')
      .select('COUNT(DISTINCT fa.atendenteId)', 'count')
      .where('fa.empresaId = :empresaId', { empresaId })
      .andWhere('fa.ativo = :ativo', { ativo: true })
      .getRawOne<{ count?: string }>();

    const atendentesDisponiveis = Number(atendentesDisponiveisRaw?.count || 0);

    const distribuicaoRaw = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.atendenteId', 'atendenteId')
      .addSelect('COUNT(*)', 'quantidade')
      .where('ticket.empresaId = :empresaId', { empresaId })
      .andWhere('ticket.status = :status', { status: StatusTicket.EM_ATENDIMENTO })
      .andWhere('ticket.atendenteId IS NOT NULL')
      .groupBy('ticket.atendenteId')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ atendenteId: string; quantidade: string }>();

    const atendenteIds = distribuicaoRaw.map((item) => item.atendenteId);
    const atendentes = atendenteIds.length
      ? await this.userRepository.find({
          where: { empresa_id: empresaId },
          select: ['id', 'nome'],
        })
      : [];

    const nomesAtendentes = new Map(
      atendentes
        .filter((atendente) => atendenteIds.includes(atendente.id))
        .map((atendente) => [atendente.id, atendente.nome]),
    );

    const totalDistribuidos = totalEmAtendimento + totalFinalizados;
    const totalConsiderado = totalDistribuidos + totalAguardando;
    const taxaDistribuicao =
      totalConsiderado > 0 ? Number(((totalDistribuidos / totalConsiderado) * 100).toFixed(1)) : 0;

    const distribuicaoPorAtendente = distribuicaoRaw.map((item) => {
      const quantidade = Number(item.quantidade || 0);
      const percentual =
        totalEmAtendimento > 0 ? Number(((quantidade / totalEmAtendimento) * 100).toFixed(1)) : 0;

      return {
        atendenteId: item.atendenteId,
        atendenteNome:
          nomesAtendentes.get(item.atendenteId) || `Atendente ${item.atendenteId.substring(0, 8)}`,
        quantidade,
        percentual,
      };
    });

    const atendenteComMaisTickets =
      distribuicaoPorAtendente.length > 0
        ? {
            nome: distribuicaoPorAtendente[0].atendenteNome,
            quantidade: distribuicaoPorAtendente[0].quantidade,
          }
        : null;

    return {
      totalAguardando,
      totalEmAtendimento,
      totalFinalizados,
      atendentesDisponiveis,
      totalDistribuidos,
      totalPendentes: totalAguardando,
      taxaDistribuicao,
      atendenteComMaisTickets,
      distribuicaoPorAtendente,
    };
  }

  /**
   * Lista todas as filas disponiveis para configuracao
   *
   * @param empresaId - ID da empresa
   * @returns Lista de filas
   */
  async listarFilas(empresaId: string) {
    this.logger.log(`📋 Listando filas - Empresa: ${empresaId}`);

    const filas = await this.filaRepository.find({
      where: {
        empresaId,
        ativo: true,
      },
      order: {
        nome: 'ASC',
      },
    });

    return filas.map((fila) => ({
      id: fila.id,
      nome: fila.nome,
      autoDistribuicao: fila.distribuicaoAutomatica || false,
      algoritmo: fila.estrategiaDistribuicao || 'ROUND_ROBIN',
    }));
  }

  /**
   * Busca configuração de auto-distribuição de uma fila
   *
   * @param filaId - ID da fila
   * @param empresaId - ID da empresa
   * @returns Configuração da fila
   */
  async buscarConfiguracao(filaId: string, empresaId: string) {
    this.logger.log(`⚙️ Buscando configuração - Fila: ${filaId}, Empresa: ${empresaId}`);

    try {
      const fila = await this.filaRepository.findOne({
        where: {
          id: filaId,
          empresaId,
        },
      });

      if (!fila) {
        this.logger.warn(`Fila não encontrada: ${filaId}`);
        throw new NotFoundException('Fila não encontrada');
      }

      return {
        filaId: fila.id,
        nome: fila.nome,
        autoDistribuicao: fila.distribuicaoAutomatica || false,
        algoritmo: fila.estrategiaDistribuicao || 'ROUND_ROBIN',
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar configuração: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new BadRequestException(error.message);
    }
  }

  /**
   * Atualiza configuração de auto-distribuição de uma fila
   *
   * @param filaId - ID da fila
   * @param empresaId - ID da empresa
   * @param autoDistribuicao - Habilitar/desabilitar auto-distribuição
   * @param algoritmo - Algoritmo a usar (ROUND_ROBIN, MENOR_CARGA, PRIORIDADE)
   * @returns Fila atualizada
   */
  async atualizarConfiguracao(
    filaId: string,
    empresaId: string,
    autoDistribuicao: boolean,
    algoritmo: string,
  ) {
    this.logger.log(
      `💾 Atualizando configuração - Fila: ${filaId}, Auto: ${autoDistribuicao}, Algoritmo: ${algoritmo}`,
    );

    const fila = await this.filaRepository.findOne({
      where: {
        id: filaId,
        empresaId,
      },
    });

    if (!fila) {
      throw new NotFoundException('Fila não encontrada');
    }

    fila.distribuicaoAutomatica = autoDistribuicao;
    fila.estrategiaDistribuicao = algoritmo as EstrategiaDistribuicao;

    await this.filaRepository.save(fila);

    return {
      filaId: fila.id,
      nome: fila.nome,
      autoDistribuicao: fila.distribuicaoAutomatica,
      algoritmo: fila.estrategiaDistribuicao,
    };
  }
}
