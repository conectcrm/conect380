import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { DistribuicaoConfig } from '../entities/distribuicao-config.entity';
import { AtendenteSkill } from '../entities/atendente-skill.entity';
import { DistribuicaoLog } from '../entities/distribuicao-log.entity';
import { Fila } from '../entities/fila.entity';
import { User } from '../../users/user.entity';
import { Ticket } from '../entities/ticket.entity';

/**
 * Service responsável pela distribuição automática avançada de tickets
 * Implementa 4 algoritmos: round-robin, menor-carga, skills-based e híbrido
 */
@Injectable()
export class DistribuicaoAvancadaService {
  private readonly logger = new Logger(DistribuicaoAvancadaService.name);

  // Cache de configurações (TTL: 5 minutos)
  private configCache: Map<string, { config: DistribuicaoConfig; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  // Cache de skills (TTL: 10 minutos)
  private skillsCache: Map<string, { skills: AtendenteSkill[]; timestamp: number }> = new Map();
  private readonly SKILLS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

  // Métricas de performance
  private metricas = {
    distribuicoesTotais: 0,
    distribuicoesComSucesso: 0,
    distribuicoesComFalha: 0,
    tempoTotalMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(
    @InjectRepository(DistribuicaoConfig)
    private readonly distribuicaoConfigRepo: Repository<DistribuicaoConfig>,

    @InjectRepository(AtendenteSkill)
    private readonly atendenteSkillRepo: Repository<AtendenteSkill>,

    @InjectRepository(DistribuicaoLog)
    private readonly distribuicaoLogRepo: Repository<DistribuicaoLog>,

    @InjectRepository(Fila)
    private readonly filaRepo: Repository<Fila>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) { }

  /**
   * Busca configuração com cache
   */
  private async buscarConfiguracaoComCache(filaId: string): Promise<DistribuicaoConfig | null> {
    const cached = this.configCache.get(filaId);
    const now = Date.now();

    // Verifica se cache é válido
    if (cached && (now - cached.timestamp) < this.CACHE_TTL_MS) {
      this.logger.debug(`✅ Cache hit para configuração da fila ${filaId}`);
      this.metricas.cacheHits++;
      return cached.config;
    }

    // Cache miss ou expirado - buscar do banco
    this.logger.debug(`❌ Cache miss para configuração da fila ${filaId}`);
    this.metricas.cacheMisses++;
    const config = await this.distribuicaoConfigRepo.findOne({
      where: { filaId, ativo: true },
    });

    if (config) {
      this.configCache.set(filaId, { config, timestamp: now });
    }

    return config;
  }

  /**
   * Busca skills do atendente com cache
   */
  private async buscarSkillsComCache(atendenteId: string): Promise<AtendenteSkill[]> {
    const cached = this.skillsCache.get(atendenteId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.SKILLS_CACHE_TTL_MS) {
      this.logger.debug(`✅ Cache hit para skills do atendente ${atendenteId}`);
      this.metricas.cacheHits++;
      return cached.skills;
    }

    this.logger.debug(`❌ Cache miss para skills do atendente ${atendenteId}`);
    this.metricas.cacheMisses++;
    const skills = await this.atendenteSkillRepo.find({
      where: { atendenteId },
    });

    this.skillsCache.set(atendenteId, { skills, timestamp: now });
    return skills;
  }

  /**
   * Invalida cache de configuração
   */
  invalidarCacheConfig(filaId: string): void {
    this.configCache.delete(filaId);
    this.logger.log(`🗑️ Cache de configuração invalidado para fila ${filaId}`);
  }

  /**
   * Invalida cache de skills
   */
  invalidarCacheSkills(atendenteId: string): void {
    this.skillsCache.delete(atendenteId);
    this.logger.log(`🗑️ Cache de skills invalidado para atendente ${atendenteId}`);
  }

  /**
   * Limpa todo o cache (útil para testes)
   */
  limparCache(): void {
    this.configCache.clear();
    this.skillsCache.clear();
    this.logger.log('🗑️ Todo o cache foi limpo');
  }

  /**
   * Retorna métricas de performance do service
   */
  obterMetricas() {
    const taxaSucesso = this.metricas.distribuicoesTotais > 0
      ? (this.metricas.distribuicoesComSucesso / this.metricas.distribuicoesTotais) * 100
      : 0;

    const tempoMedio = this.metricas.distribuicoesComSucesso > 0
      ? this.metricas.tempoTotalMs / this.metricas.distribuicoesComSucesso
      : 0;

    const taxaCacheHit = (this.metricas.cacheHits + this.metricas.cacheMisses) > 0
      ? (this.metricas.cacheHits / (this.metricas.cacheHits + this.metricas.cacheMisses)) * 100
      : 0;

    return {
      distribuicoes: {
        total: this.metricas.distribuicoesTotais,
        sucesso: this.metricas.distribuicoesComSucesso,
        falha: this.metricas.distribuicoesComFalha,
        taxaSucessoPct: Number(taxaSucesso.toFixed(2)),
      },
      performance: {
        tempoMedioMs: Number(tempoMedio.toFixed(2)),
        tempoTotalMs: this.metricas.tempoTotalMs,
      },
      cache: {
        hits: this.metricas.cacheHits,
        misses: this.metricas.cacheMisses,
        taxaHitPct: Number(taxaCacheHit.toFixed(2)),
        configsCacheadas: this.configCache.size,
        skillsCacheadas: this.skillsCache.size,
      },
    };
  }

  /**
   * Reseta métricas (útil para testes)
   */
  resetarMetricas(): void {
    this.metricas = {
      distribuicoesTotais: 0,
      distribuicoesComSucesso: 0,
      distribuicoesComFalha: 0,
      tempoTotalMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.logger.log('📊 Métricas resetadas');
  }

  /**
   * Método principal - Distribui um ticket automaticamente
   * @param ticketId ID do ticket a ser distribuído
   * @param requiredSkills Skills opcionais requeridas para o ticket
   * @returns Atendente selecionado
   */
  async distribuirTicket(
    ticketId: string,
    requiredSkills?: string[],
  ): Promise<User> {
    const inicioMs = Date.now();
    this.metricas.distribuicoesTotais++;

    try {
      this.logger.log(`Iniciando distribuição do ticket ${ticketId}`);

      // 1. Buscar ticket
      const ticket = await this.ticketRepo.findOne({
        where: { id: ticketId },
        relations: ['fila'],
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} não encontrado`);
      }

      if (!ticket.fila) {
        throw new BadRequestException(
          `Ticket ${ticketId} não está associado a uma fila`,
        );
      }

      const filaId = ticket.fila.id;

      // 2. Buscar configuração de distribuição da fila (COM CACHE)
      const config = await this.buscarConfiguracaoComCache(filaId);

      if (!config) {
        throw new NotFoundException(
          `Configuração de distribuição não encontrada para a fila ${filaId}`,
        );
      }

      this.logger.log(
        `Usando algoritmo: ${config.algoritmo} para fila ${filaId}`,
      );

      // 3. Selecionar algoritmo e executar distribuição
      let atendente: User;
      let motivo: string;

      try {
        switch (config.algoritmo) {
          case 'round-robin':
            atendente = await this.roundRobin(filaId, config);
            motivo = 'Distribuição circular (Round-Robin)';
            break;

          case 'menor-carga':
            atendente = await this.menorCarga(filaId, config);
            motivo = 'Atendente com menor carga de trabalho';
            break;

          case 'skills':
            if (!requiredSkills || requiredSkills.length === 0) {
              this.logger.warn(
                'Skills requeridas não fornecidas, usando menor-carga como fallback',
              );
              atendente = await this.menorCarga(filaId, config);
              motivo = 'Menor carga (fallback - sem skills requeridas)';
            } else {
              atendente = await this.skillsBased(filaId, requiredSkills, config);
              motivo = `Skills-based: ${requiredSkills.join(', ')}`;
            }
            break;

          case 'hibrido':
            atendente = await this.hibrido(filaId, requiredSkills, config);
            motivo = requiredSkills?.length
              ? `Híbrido: skills (${requiredSkills.join(', ')}) + menor carga`
              : 'Híbrido: menor carga (sem skills)';
            break;

          default:
            throw new BadRequestException(
              `Algoritmo desconhecido: ${config.algoritmo}`,
            );
        }
      } catch (error) {
        // Se nenhum atendente disponível e overflow permitido
        if (
          error instanceof NotFoundException &&
          config.permitirOverflow &&
          config.filaBackupId
        ) {
          this.logger.warn(
            `Nenhum atendente disponível na fila ${filaId}, tentando fila de backup ${config.filaBackupId}`,
          );

          // Tentar fila de backup
          const backupConfig = await this.distribuicaoConfigRepo.findOne({
            where: { filaId: config.filaBackupId, ativo: true },
          });

          if (backupConfig) {
            atendente = await this.menorCarga(
              config.filaBackupId,
              backupConfig,
            );
            motivo = `Overflow para fila backup (${config.filaBackupId})`;
          } else {
            throw new NotFoundException(
              'Nenhum atendente disponível na fila principal ou backup',
            );
          }
        } else {
          throw error;
        }
      }

      // 4. Obter carga atual do atendente
      const cargaAtual = await this.obterCargaAtendente(atendente.id);

      // 5. Registrar log de auditoria
      await this.registrarLog({
        ticketId,
        atendenteId: atendente.id,
        filaId,
        algoritmo: config.algoritmo,
        motivo,
        cargaAtendente: cargaAtual,
        realocacao: false,
      });

      this.logger.log(
        `Ticket ${ticketId} distribuído para atendente ${atendente.nome} (carga: ${cargaAtual})`,
      );

      // 6. Registrar métricas de sucesso
      const tempoMs = Date.now() - inicioMs;
      this.metricas.distribuicoesComSucesso++;
      this.metricas.tempoTotalMs += tempoMs;
      this.logger.debug(`⏱️ Distribuição concluída em ${tempoMs}ms`);

      return atendente;
    } catch (error) {
      // Registrar falha nas métricas
      this.metricas.distribuicoesComFalha++;
      this.logger.error(`❌ Falha na distribuição: ${error.message}`);
      throw error;
    }
  }

  /**
   * Algoritmo 1: Round-Robin (Distribuição Circular)
   */
  private async roundRobin(
    filaId: string,
    config: DistribuicaoConfig,
  ): Promise<User> {
    this.logger.debug(`Executando Round-Robin para fila ${filaId}`);

    const fila = await this.filaRepo.findOne({
      where: { id: filaId },
      relations: ['atendentes', 'atendentes.atendente'],
    });

    if (!fila || !fila.atendentes || fila.atendentes.length === 0) {
      throw new NotFoundException(
        `Nenhum atendente vinculado à fila ${filaId}`,
      );
    }

    const atendentesDisponiveis = await this.filtrarAtendentesDisponiveis(
      fila.atendentes.map((fa) => fa.atendente),
      filaId,
      config,
    );

    if (atendentesDisponiveis.length === 0) {
      throw new NotFoundException(
        'Nenhum atendente disponível na fila para Round-Robin',
      );
    }

    // Buscar último atendente que recebeu ticket
    const ultimaDistribuicao = await this.distribuicaoLogRepo.findOne({
      where: { filaId },
      order: { timestamp: 'DESC' },
    });

    let proximoIndex = 0;

    if (ultimaDistribuicao) {
      const ultimoIndex = atendentesDisponiveis.findIndex(
        (a) => a.id === ultimaDistribuicao.atendenteId,
      );

      if (ultimoIndex !== -1) {
        proximoIndex = (ultimoIndex + 1) % atendentesDisponiveis.length;
      }
    }

    return atendentesDisponiveis[proximoIndex];
  }

  /**
   * Algoritmo 2: Menor Carga
   */
  private async menorCarga(
    filaId: string,
    config: DistribuicaoConfig,
  ): Promise<User> {
    this.logger.debug(`Executando Menor Carga para fila ${filaId}`);

    const fila = await this.filaRepo.findOne({
      where: { id: filaId },
      relations: ['atendentes', 'atendentes.atendente'],
    });

    if (!fila || !fila.atendentes || fila.atendentes.length === 0) {
      throw new NotFoundException(
        `Nenhum atendente vinculado à fila ${filaId}`,
      );
    }

    const atendentesDisponiveis = await this.filtrarAtendentesDisponiveis(
      fila.atendentes.map((fa) => fa.atendente),
      filaId,
      config,
    );

    if (atendentesDisponiveis.length === 0) {
      throw new NotFoundException(
        'Nenhum atendente disponível na fila para Menor Carga',
      );
    }

    // Contar tickets em aberto por atendente
    const cargasPorAtendente = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('ticket.atendenteId', 'atendenteId')
      .addSelect('COUNT(ticket.id)', 'totalTickets')
      .where('ticket.status NOT IN (:...statusFinalizados)', {
        statusFinalizados: ['fechado', 'resolvido', 'cancelado'],
      })
      .andWhere('ticket.atendenteId IN (:...atendenteIds)', {
        atendenteIds: atendentesDisponiveis.map((a) => a.id),
      })
      .groupBy('ticket.atendenteId')
      .orderBy('totalTickets', 'ASC')
      .getRawMany();

    if (cargasPorAtendente.length === 0) {
      return atendentesDisponiveis[0];
    }

    // Atendentes sem tickets têm prioridade
    const atendentesComTickets = cargasPorAtendente.map(
      (c) => c.atendenteId,
    );
    const atendenteSemTicket = atendentesDisponiveis.find(
      (a) => !atendentesComTickets.includes(a.id),
    );

    if (atendenteSemTicket) {
      return atendenteSemTicket;
    }

    const menorCargaId = cargasPorAtendente[0].atendenteId;
    return atendentesDisponiveis.find((a) => a.id === menorCargaId);
  }

  /**
   * Algoritmo 3: Skills-Based
   */
  private async skillsBased(
    filaId: string,
    requiredSkills: string[],
    config: DistribuicaoConfig,
  ): Promise<User> {
    this.logger.debug(
      `Executando Skills-Based para fila ${filaId} com skills: ${requiredSkills.join(', ')}`,
    );

    const fila = await this.filaRepo.findOne({
      where: { id: filaId },
      relations: ['atendentes', 'atendentes.atendente'],
    });

    if (!fila || !fila.atendentes || fila.atendentes.length === 0) {
      throw new NotFoundException(
        `Nenhum atendente vinculado à fila ${filaId}`,
      );
    }

    const atendentesDisponiveis = await this.filtrarAtendentesDisponiveis(
      fila.atendentes.map((fa) => fa.atendente),
      filaId,
      config,
    );

    if (atendentesDisponiveis.length === 0) {
      throw new NotFoundException(
        'Nenhum atendente disponível na fila para Skills-Based',
      );
    }

    const atendenteIdsDisponiveis = atendentesDisponiveis.map((a) => a.id);

    const skillsAtendentes = await this.atendenteSkillRepo
      .createQueryBuilder('skill')
      .where('skill.atendenteId IN (:...ids)', { ids: atendenteIdsDisponiveis })
      .andWhere('skill.skill IN (:...requiredSkills)', { requiredSkills })
      .andWhere('skill.ativo = :ativo', { ativo: true })
      .orderBy('skill.nivel', 'DESC')
      .getMany();

    if (skillsAtendentes.length === 0) {
      throw new NotFoundException(
        `Nenhum atendente possui as skills requeridas: ${requiredSkills.join(', ')}`,
      );
    }

    // Calcular score por atendente
    const scoresPorAtendente = new Map<string, number>();

    skillsAtendentes.forEach((skill) => {
      const scoreAtual = scoresPorAtendente.get(skill.atendenteId) || 0;
      scoresPorAtendente.set(skill.atendenteId, scoreAtual + skill.nivel);
    });

    const atendentesOrdenados = Array.from(scoresPorAtendente.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([atendenteId]) => atendenteId);

    const melhorAtendenteId = atendentesOrdenados[0];
    return atendentesDisponiveis.find((a) => a.id === melhorAtendenteId);
  }

  /**
   * Algoritmo 4: Híbrido (Skills + Menor Carga)
   */
  private async hibrido(
    filaId: string,
    requiredSkills: string[] | undefined,
    config: DistribuicaoConfig,
  ): Promise<User> {
    this.logger.debug(`Executando Híbrido para fila ${filaId}`);

    if (!requiredSkills || requiredSkills.length === 0) {
      return this.menorCarga(filaId, config);
    }

    const fila = await this.filaRepo.findOne({
      where: { id: filaId },
      relations: ['atendentes', 'atendentes.atendente'],
    });

    if (!fila || !fila.atendentes || fila.atendentes.length === 0) {
      throw new NotFoundException(
        `Nenhum atendente vinculado à fila ${filaId}`,
      );
    }

    const atendentesDisponiveis = await this.filtrarAtendentesDisponiveis(
      fila.atendentes.map((fa) => fa.atendente),
      filaId,
      config,
    );

    if (atendentesDisponiveis.length === 0) {
      throw new NotFoundException(
        'Nenhum atendente disponível na fila para Híbrido',
      );
    }

    const atendenteIdsDisponiveis = atendentesDisponiveis.map((a) => a.id);

    const skillsAtendentes = await this.atendenteSkillRepo
      .createQueryBuilder('skill')
      .where('skill.atendenteId IN (:...ids)', { ids: atendenteIdsDisponiveis })
      .andWhere('skill.skill IN (:...requiredSkills)', { requiredSkills })
      .andWhere('skill.ativo = :ativo', { ativo: true })
      .getMany();

    if (skillsAtendentes.length === 0) {
      this.logger.warn(
        `Nenhum atendente com skills ${requiredSkills.join(', ')}, usando menor-carga`,
      );
      return this.menorCarga(filaId, config);
    }

    const atendentesComSkills = [
      ...new Set(skillsAtendentes.map((s) => s.atendenteId)),
    ];

    const candidatos = atendentesDisponiveis.filter((a) =>
      atendentesComSkills.includes(a.id),
    );

    // Entre os que têm skills, aplicar menor carga
    const cargasPorAtendente = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('ticket.atendenteId', 'atendenteId')
      .addSelect('COUNT(ticket.id)', 'totalTickets')
      .where('ticket.status NOT IN (:...statusFinalizados)', {
        statusFinalizados: ['fechado', 'resolvido', 'cancelado'],
      })
      .andWhere('ticket.atendenteId IN (:...atendenteIds)', {
        atendenteIds: candidatos.map((a) => a.id),
      })
      .groupBy('ticket.atendenteId')
      .orderBy('totalTickets', 'ASC')
      .getRawMany();

    if (cargasPorAtendente.length === 0) {
      return candidatos[0];
    }

    const atendentesComTickets = cargasPorAtendente.map((c) => c.atendenteId);
    const candidatoSemTicket = candidatos.find(
      (a) => !atendentesComTickets.includes(a.id),
    );

    if (candidatoSemTicket) {
      return candidatoSemTicket;
    }

    const menorCargaId = cargasPorAtendente[0].atendenteId;
    return candidatos.find((a) => a.id === menorCargaId);
  }

  /**
   * Filtra atendentes disponíveis
   */
  private async filtrarAtendentesDisponiveis(
    atendentes: User[],
    filaId: string,
    config: DistribuicaoConfig,
  ): Promise<User[]> {
    const disponiveis: User[] = [];

    for (const atendente of atendentes) {
      if (!atendente.ativo) {
        continue;
      }

      if (config.priorizarOnline) {
        if (
          !atendente.status_atendente ||
          !['online', 'disponivel'].includes(atendente.status_atendente)
        ) {
          continue;
        }
      }

      const atingiuCapacidade = await this.atingiuCapacidadeMaxima(
        atendente.id,
        filaId,
        config.capacidadeMaxima,
      );

      if (atingiuCapacidade) {
        continue;
      }

      disponiveis.push(atendente);
    }

    return disponiveis;
  }

  /**
   * Verifica se atendente atingiu capacidade máxima
   */
  private async atingiuCapacidadeMaxima(
    atendenteId: string,
    filaId: string,
    capacidadeMaxima: number,
  ): Promise<boolean> {
    const cargaAtual = await this.ticketRepo.count({
      where: {
        atendenteId,
        filaId,
        status: Not(In(['fechado', 'resolvido', 'cancelado'])),
      },
    });

    return cargaAtual >= capacidadeMaxima;
  }

  /**
   * Obtém carga atual do atendente
   */
  private async obterCargaAtendente(atendenteId: string): Promise<number> {
    return this.ticketRepo.count({
      where: {
        atendenteId,
        status: Not(In(['fechado', 'resolvido', 'cancelado'])),
      },
    });
  }

  /**
   * Registra log de auditoria
   */
  private async registrarLog(data: {
    ticketId: string;
    atendenteId: string;
    filaId: string;
    algoritmo: string;
    motivo: string;
    cargaAtendente: number;
    realocacao: boolean;
    motivoRealocacao?: string;
  }): Promise<void> {
    try {
      const logData = this.distribuicaoLogRepo.create({
        ticketId: data.ticketId,
        atendenteId: data.atendenteId,
        filaId: data.filaId,
        algoritmo: data.algoritmo as 'round-robin' | 'menor-carga' | 'skills' | 'hibrido',
        motivo: data.motivo,
        cargaAtendente: data.cargaAtendente,
        realocacao: data.realocacao,
        motivoRealocacao: data.motivoRealocacao,
      });

      await this.distribuicaoLogRepo.save(logData);
      this.logger.debug(
        `Log de distribuição registrado para ticket ${data.ticketId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar log de distribuição: ${error.message}`,
      );
    }
  }

  /**
   * Realoca ticket para outro atendente
   */
  async realocarTicket(
    ticketId: string,
    novoAtendenteId: string,
    motivoRealocacao: string,
  ): Promise<void> {
    this.logger.log(
      `Realocando ticket ${ticketId} para atendente ${novoAtendenteId}`,
    );

    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['fila'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} não encontrado`);
    }

    const novoAtendente = await this.userRepo.findOne({
      where: { id: novoAtendenteId },
    });

    if (!novoAtendente) {
      throw new NotFoundException(
        `Atendente ${novoAtendenteId} não encontrado`,
      );
    }

    const cargaAtual = await this.obterCargaAtendente(novoAtendenteId);

    await this.registrarLog({
      ticketId,
      atendenteId: novoAtendenteId,
      filaId: ticket.fila.id,
      algoritmo: 'manual',
      motivo: 'Realocação manual',
      cargaAtendente: cargaAtual,
      realocacao: true,
      motivoRealocacao,
    });

    this.logger.log(
      `Ticket ${ticketId} realocado com sucesso para ${novoAtendente.nome}`,
    );
  }
}
