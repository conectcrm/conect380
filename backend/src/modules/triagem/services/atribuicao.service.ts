import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Equipe } from '../entities/equipe.entity';
import { AtendenteEquipe } from '../entities/atendente-equipe.entity';
import { AtendenteAtribuicao } from '../entities/atendente-atribuicao.entity';
import { EquipeAtribuicao } from '../entities/equipe-atribuicao.entity';
import { NucleoAtendimento } from '../entities/nucleo-atendimento.entity';
import { Departamento } from '../entities/departamento.entity';
import { User } from '../../users/user.entity';
import { Ticket, StatusTicket } from '../../atendimento/entities/ticket.entity';
import { appendFileSync } from 'fs';
import { join } from 'path';

export interface CreateEquipeDto {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}

export interface UpdateEquipeDto extends Partial<CreateEquipeDto> {}

export interface AtribuirAtendenteDto {
  atendenteId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade?: number;
}

export interface AtribuirEquipeDto {
  equipeId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade?: number;
}

/**
 * Service para gerenciar equipes e atribuições de atendentes
 */
@Injectable()
export class AtribuicaoService {
  private readonly logger = new Logger(AtribuicaoService.name);

  constructor(
    @InjectRepository(Equipe)
    private readonly equipeRepository: Repository<Equipe>,
    @InjectRepository(AtendenteEquipe)
    private readonly atendenteEquipeRepository: Repository<AtendenteEquipe>,
    @InjectRepository(AtendenteAtribuicao)
    private readonly atendenteAtribuicaoRepository: Repository<AtendenteAtribuicao>,
    @InjectRepository(EquipeAtribuicao)
    private readonly equipeAtribuicaoRepository: Repository<EquipeAtribuicao>,
    @InjectRepository(NucleoAtendimento)
    private readonly nucleoRepository: Repository<NucleoAtendimento>,
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  private async buscarEquipeDaEmpresa(empresaId: string, equipeId: string): Promise<Equipe> {
    const equipe = await this.equipeRepository.findOne({
      where: { id: equipeId, empresaId },
      relations: ['atendenteEquipes', 'atendenteEquipes.atendente', 'atribuicoes'],
    });

    if (!equipe) {
      throw new NotFoundException(`Equipe ${equipeId} nao encontrada para a empresa`);
    }

    return equipe;
  }

  private async validarAtendenteDaEmpresa(empresaId: string, atendenteId: string): Promise<User> {
    const atendente = await this.userRepository.findOne({
      where: { id: atendenteId, empresa_id: empresaId },
    });

    if (!atendente) {
      throw new NotFoundException(`Atendente ${atendenteId} nao encontrado para a empresa`);
    }

    return atendente;
  }

  private async validarNucleoDaEmpresa(empresaId: string, nucleoId: string): Promise<void> {
    const nucleo = await this.nucleoRepository.findOne({
      where: { id: nucleoId, empresaId },
    });

    if (!nucleo) {
      throw new NotFoundException(`Nucleo ${nucleoId} nao encontrado para a empresa`);
    }
  }

  private async validarDepartamentoDaEmpresa(
    empresaId: string,
    departamentoId: string,
  ): Promise<void> {
    const departamento = await this.departamentoRepository.findOne({
      where: { id: departamentoId, empresaId },
    });

    if (!departamento) {
      throw new NotFoundException(
        `Departamento ${departamentoId} nao encontrado para a empresa`,
      );
    }
  }

  // ========================================================================
  // GESTÃO DE EQUIPES
  // ========================================================================

  /**
   * Cria uma nova equipe
   */
  async criarEquipe(empresaId: string, dto: CreateEquipeDto): Promise<Equipe> {
    this.logger.log(`Criando equipe "${dto.nome}" para empresa ${empresaId}`);

    const equipe = this.equipeRepository.create({
      empresaId,
      nome: dto.nome,
      descricao: dto.descricao,
      cor: dto.cor || '#3B82F6',
      icone: dto.icone || 'users',
      ativo: dto.ativo ?? true,
    });
    try {
      const tracePath = join(__dirname, 'criar-equipe.trace.log');
      const timestamp = new Date().toISOString();
      appendFileSync(
        tracePath,
        `${timestamp} - Tentativa de criar equipe "${dto.nome}" para empresa ${empresaId}\n`,
      );
    } catch (traceError) {
      this.logger.warn(
        `Não foi possível gravar trace de criação de equipe: ${traceError.message}`,
      );
    }
    try {
      return await this.equipeRepository.save(equipe);
    } catch (error) {
      this.logger.error(
        `Erro ao criar equipe para empresa ${empresaId}: ${error.message}`,
        error.stack,
      );
      try {
        const logPath = join(__dirname, 'criar-equipe.error.log');
        const timestamp = new Date().toISOString();
        appendFileSync(
          logPath,
          `${timestamp} - Erro ao criar equipe (empresa ${empresaId}): ${error.message}\n${error.stack}\n\n`,
        );
      } catch (fileError) {
        this.logger.error('Falha ao registrar erro em backend.err', fileError.stack);
      }
      throw new BadRequestException({
        mensagem: 'Falha ao criar equipe',
        detalhe: error.message,
        codigo: error.code,
      });
    }
  }

  /**
   * Lista todas as equipes de uma empresa
   */
  async listarEquipes(empresaId: string): Promise<Equipe[]> {
    return await this.equipeRepository.find({
      where: { empresaId },
      relations: ['atendenteEquipes', 'atribuicoes'],
      order: { nome: 'ASC' },
    });
  }

  /**
   * Busca uma equipe por ID
   */
  async buscarEquipe(empresaId: string, equipeId: string): Promise<Equipe> {
    return this.buscarEquipeDaEmpresa(empresaId, equipeId);
  }

  /**
   * Atualiza uma equipe
   */
  async atualizarEquipe(empresaId: string, equipeId: string, dto: UpdateEquipeDto): Promise<Equipe> {
    const equipe = await this.buscarEquipeDaEmpresa(empresaId, equipeId);

    Object.assign(equipe, dto);

    return await this.equipeRepository.save(equipe);
  }

  /**
   * Remove uma equipe
   */
  async removerEquipe(empresaId: string, equipeId: string): Promise<void> {
    const equipe = await this.buscarEquipeDaEmpresa(empresaId, equipeId);
    await this.equipeRepository.remove(equipe);
    this.logger.log(`Equipe ${equipeId} removida`);
  }

  // ========================================================================
  // GESTÃO DE MEMBROS DA EQUIPE
  // ========================================================================

  /**
   * Adiciona um atendente a uma equipe
   */
  async adicionarAtendenteNaEquipe(
    empresaId: string,
    equipeId: string,
    atendenteId: string,
    funcao: string = 'membro',
  ): Promise<AtendenteEquipe> {
    const equipe = await this.buscarEquipeDaEmpresa(empresaId, equipeId);
    await this.validarAtendenteDaEmpresa(empresaId, atendenteId);

    const existente = await this.atendenteEquipeRepository.findOne({
      where: { empresaId, equipeId, atendenteId },
    });

    if (existente) {
      throw new BadRequestException('Atendente ja esta nessa equipe');
    }

    const atendenteEquipe = this.atendenteEquipeRepository.create({
      empresaId: equipe.empresaId,
      equipeId,
      atendenteId,
      funcao,
    });

    return await this.atendenteEquipeRepository.save(atendenteEquipe);
  }

  /**
   * Remove um atendente de uma equipe
   */
  async removerAtendenteDaEquipe(
    empresaId: string,
    equipeId: string,
    atendenteId: string,
  ): Promise<void> {
    const atendenteEquipe = await this.atendenteEquipeRepository.findOne({
      where: { empresaId, equipeId, atendenteId },
    });

    if (!atendenteEquipe) {
      throw new NotFoundException('Atendente nao esta nessa equipe');
    }

    await this.atendenteEquipeRepository.remove(atendenteEquipe);
  }

  /**
   * Lista atendentes de uma equipe
   */
  async listarAtendentesEquipe(empresaId: string, equipeId: string): Promise<User[]> {
    await this.buscarEquipeDaEmpresa(empresaId, equipeId);

    const relacoes = await this.atendenteEquipeRepository.find({
      where: { empresaId, equipeId },
      relations: ['atendente'],
    });

    return relacoes
      .map((r) => r.atendente)
      .filter((atendente) => atendente?.empresa_id === empresaId);
  }

  // ========================================================================
  // ATRIBUIÇÕES DIRETAS (Atendente → Núcleo/Departamento)
  // ========================================================================

  /**
    * Atribui um atendente diretamente a um núcleo ou departamento
   */
  async atribuirAtendenteANucleoDepartamento(
    empresaId: string,
    dto: AtribuirAtendenteDto,
  ): Promise<AtendenteAtribuicao> {
    if (!dto.nucleoId && !dto.departamentoId) {
      throw new BadRequestException('E necessario informar nucleoId ou departamentoId');
    }

    await this.validarAtendenteDaEmpresa(empresaId, dto.atendenteId);

    if (dto.nucleoId) {
      await this.validarNucleoDaEmpresa(empresaId, dto.nucleoId);
    }

    if (dto.departamentoId) {
      await this.validarDepartamentoDaEmpresa(empresaId, dto.departamentoId);
    }

    const existente = await this.atendenteAtribuicaoRepository.findOne({
      where: {
        empresaId,
        atendenteId: dto.atendenteId,
        nucleoId: dto.nucleoId || null,
        departamentoId: dto.departamentoId || null,
      },
    });

    if (existente) {
      throw new BadRequestException('Atribuicao ja existe');
    }

    const atribuicao = this.atendenteAtribuicaoRepository.create({
      empresaId,
      atendenteId: dto.atendenteId,
      nucleoId: dto.nucleoId || null,
      departamentoId: dto.departamentoId || null,
      prioridade: dto.prioridade || 0,
      ativo: true,
    });

    return await this.atendenteAtribuicaoRepository.save(atribuicao);
  }

  /**
    * Remove uma atribuição direta de atendente
   */
  async removerAtribuicaoAtendente(empresaId: string, atribuicaoId: string): Promise<void> {
    const atribuicao = await this.atendenteAtribuicaoRepository.findOne({
      where: { id: atribuicaoId, empresaId },
    });

    if (!atribuicao) {
      throw new NotFoundException('Atribuicao nao encontrada');
    }

    await this.atendenteAtribuicaoRepository.remove(atribuicao);
  }

  /**
    * Lista atribuições de um atendente
   */
  async listarAtribuicoesAtendente(
    empresaId: string,
    atendenteId: string,
  ): Promise<AtendenteAtribuicao[]> {
    await this.validarAtendenteDaEmpresa(empresaId, atendenteId);

    return await this.atendenteAtribuicaoRepository.find({
      where: { empresaId, atendenteId, ativo: true },
      relations: ['nucleo', 'departamento'],
      order: { prioridade: 'ASC' },
    });
  }

  // ========================================================================
  // ATRIBUIÇÕES DE EQUIPE (Equipe → Núcleo/Departamento)
  // ========================================================================

  /**
    * Atribui uma equipe a um núcleo ou departamento
   */
  async atribuirEquipeANucleoDepartamento(
    empresaId: string,
    dto: AtribuirEquipeDto,
  ): Promise<EquipeAtribuicao> {
    if (!dto.nucleoId && !dto.departamentoId) {
      throw new BadRequestException('E necessario informar nucleoId ou departamentoId');
    }

    await this.buscarEquipeDaEmpresa(empresaId, dto.equipeId);

    if (dto.nucleoId) {
      await this.validarNucleoDaEmpresa(empresaId, dto.nucleoId);
    }

    if (dto.departamentoId) {
      await this.validarDepartamentoDaEmpresa(empresaId, dto.departamentoId);
    }

    const existente = await this.equipeAtribuicaoRepository.findOne({
      where: {
        empresaId,
        equipeId: dto.equipeId,
        nucleoId: dto.nucleoId || null,
        departamentoId: dto.departamentoId || null,
      },
    });

    if (existente) {
      throw new BadRequestException('Atribuicao ja existe');
    }

    const atribuicao = this.equipeAtribuicaoRepository.create({
      empresaId,
      equipeId: dto.equipeId,
      nucleoId: dto.nucleoId || null,
      departamentoId: dto.departamentoId || null,
      prioridade: dto.prioridade || 0,
      ativo: true,
    });

    return await this.equipeAtribuicaoRepository.save(atribuicao);
  }

  /**
    * Remove uma atribuição de equipe
   */
  async removerAtribuicaoEquipe(empresaId: string, atribuicaoId: string): Promise<void> {
    const atribuicao = await this.equipeAtribuicaoRepository.findOne({
      where: { id: atribuicaoId, empresaId },
    });

    if (!atribuicao) {
      throw new NotFoundException('Atribuicao nao encontrada');
    }

    await this.equipeAtribuicaoRepository.remove(atribuicao);
  }

  /**
    * Lista atribuições de uma equipe
   */
  async listarAtribuicoesEquipe(empresaId: string, equipeId: string): Promise<EquipeAtribuicao[]> {
    await this.buscarEquipeDaEmpresa(empresaId, equipeId);

    return await this.equipeAtribuicaoRepository.find({
      where: { empresaId, equipeId, ativo: true },
      relations: ['nucleo', 'departamento'],
      order: { prioridade: 'ASC' },
    });
  }

  // ========================================================================
  // BUSCA DE ATENDENTES DISPONIVEIS (usado pelo bot de triagem)
  // ========================================================================

  async buscarAtendentesDisponiveis(
    empresaId: string,
    nucleoId: string,
    departamentoId?: string,
  ): Promise<User[]> {
    this.logger.log(
      `Buscando atendentes disponiveis - Empresa: ${empresaId}, Nucleo: ${nucleoId}, Departamento: ${departamentoId || 'N/A'}`,
    );

    const query = this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .leftJoin(
        'atendente_atribuicoes',
        'atrib',
        'atrib.atendente_id = user.id AND atrib.ativo = true AND atrib.empresa_id = :empresaId',
      )
      .leftJoin(
        'atendente_equipes',
        'ae',
        'ae.atendente_id = user.id AND ae.empresa_id = :empresaId',
      )
      .leftJoin(
        'equipe_atribuicoes',
        'equipeAtrib',
        'equipeAtrib.equipe_id = ae.equipe_id AND equipeAtrib.ativo = true AND equipeAtrib.empresa_id = :empresaId',
      )
      .where('user.empresa_id = :empresaId', { empresaId })
      .andWhere('user.ativo = true')
      .andWhere(
        new Brackets((qb) => {
          const conditions: { cond: string; params?: Record<string, unknown> }[] = [
            { cond: 'atrib.nucleo_id = :nucleoId', params: { nucleoId } },
            { cond: 'equipeAtrib.nucleo_id = :nucleoId', params: { nucleoId } },
          ];

          if (departamentoId) {
            conditions.push({
              cond: 'atrib.departamento_id = :departamentoId',
              params: { departamentoId },
            });
            conditions.push({
              cond: 'equipeAtrib.departamento_id = :departamentoId',
              params: { departamentoId },
            });
          }

          const [primeira, ...resto] = conditions;

          if (!primeira) {
            qb.where('1=0');
            return;
          }

          qb.where(primeira.cond, primeira.params || {});
          resto.forEach(({ cond, params }) => {
            qb.orWhere(cond, params || {});
          });
        }),
      )
      .distinct(true);

    const rawIds = await query.getRawMany();
    const ids = rawIds.map((row) => row.id).filter(Boolean);

    if (ids.length === 0) {
      this.logger.log('0 atendentes encontrados');
      return [];
    }

    const atendentes = await this.userRepository.find({
      where: { id: In(ids), empresa_id: empresaId },
    });

    this.logger.log(`${atendentes.length} atendentes encontrados`);

    return atendentes;
  }

  private async mapearPrioridadeDisponibilidade(
    empresaId: string,
    ids: string[],
    nucleoId?: string,
    departamentoId?: string,
  ): Promise<Record<string, number>> {
    const prioridades: Record<string, number> = {};

    ids.forEach((id) => {
      if (id) {
        prioridades[id] = 99;
      }
    });

    const atualizar = (atendenteId: string | null | undefined, valor: number) => {
      if (!atendenteId) {
        return;
      }

      const atual = prioridades[atendenteId];
      if (atual === undefined || valor < atual) {
        prioridades[atendenteId] = valor;
      }
    };

    if (ids.length === 0) {
      return prioridades;
    }

    if (departamentoId) {
      const diretasDepartamento = await this.atendenteAtribuicaoRepository.find({
        where: {
          empresaId,
          atendenteId: In(ids),
          departamentoId,
          ativo: true,
        },
      });

      diretasDepartamento.forEach((atribuicao) => atualizar(atribuicao.atendenteId, 0));
    }

    if (nucleoId) {
      const diretasNucleo = await this.atendenteAtribuicaoRepository.find({
        where: {
          empresaId,
          atendenteId: In(ids),
          nucleoId,
          ativo: true,
        },
      });

      diretasNucleo.forEach((atribuicao) => atualizar(atribuicao.atendenteId, 1));
    }

    if (departamentoId) {
      const equipeDepartamento = await this.atendenteEquipeRepository
        .createQueryBuilder('ae')
        .select('ae.atendenteId', 'atendenteId')
        .innerJoin(
          'equipe_atribuicoes',
          'ea',
          'ea.equipe_id = ae.equipe_id AND ea.ativo = true AND ea.empresa_id = :empresaId',
          { empresaId },
        )
        .where('ae.atendenteId IN (:...ids)', { ids })
        .andWhere('ae.empresa_id = :empresaId', { empresaId })
        .andWhere('ea.departamento_id = :departamentoId', { departamentoId })
        .getRawMany();

      equipeDepartamento.forEach((row) => atualizar(row.atendenteId, 2));
    }

    if (nucleoId) {
      const equipeNucleo = await this.atendenteEquipeRepository
        .createQueryBuilder('ae')
        .select('ae.atendenteId', 'atendenteId')
        .innerJoin(
          'equipe_atribuicoes',
          'ea',
          'ea.equipe_id = ae.equipe_id AND ea.ativo = true AND ea.empresa_id = :empresaId',
          { empresaId },
        )
        .where('ae.atendenteId IN (:...ids)', { ids })
        .andWhere('ae.empresa_id = :empresaId', { empresaId })
        .andWhere('ea.nucleo_id = :nucleoId', { nucleoId })
        .getRawMany();

      equipeNucleo.forEach((row) => atualizar(row.atendenteId, 3));
    }

    return prioridades;
  }

  /**
   * Seleciona o atendente com menor carga de trabalho
    * TODO: Implementar lógica de contagem de tickets ativos por atendente
   */
  async selecionarAtendentePorCarga(
    atendentes: User[],
    empresaId?: string,
    prioridadePorAtendente?: Record<string, number>,
  ): Promise<User | null> {
    if (atendentes.length === 0) {
      return null;
    }

    const atendenteIds = atendentes.map((at) => at.id).filter(Boolean);

    if (atendenteIds.length === 0) {
      return null;
    }

    try {
      const statusAtivos = [
        StatusTicket.FILA,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO_CLIENTE,
      ];

      const query = this.ticketRepository
        .createQueryBuilder('ticket')
        .select('ticket.atendenteId', 'atendenteId')
        .addSelect('COUNT(ticket.id)', 'total')
        .where('ticket.atendenteId IN (:...ids)', { ids: atendenteIds })
        .andWhere('ticket.status IN (:...statusAtivos)', {
          statusAtivos,
        });

      if (empresaId) {
        query.andWhere('ticket.empresaId = :empresaId', { empresaId });
      }

      const cargasRaw = await query.groupBy('ticket.atendenteId').getRawMany();

      const cargas = cargasRaw.reduce<Record<string, number>>((acc, row) => {
        if (row.atendenteId) {
          acc[row.atendenteId] = Number(row.total) || 0;
        }
        return acc;
      }, {});

      const ordenados = [...atendentes].sort((a, b) => {
        const prioridadeA = prioridadePorAtendente?.[a.id] ?? 99;
        const prioridadeB = prioridadePorAtendente?.[b.id] ?? 99;

        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }

        const cargaA = cargas[a.id] ?? 0;
        const cargaB = cargas[b.id] ?? 0;

        if (cargaA !== cargaB) {
          return cargaA - cargaB;
        }

        const nomeA = (a.nome || '').toLocaleLowerCase();
        const nomeB = (b.nome || '').toLocaleLowerCase();
        if (nomeA !== nomeB) {
          return nomeA.localeCompare(nomeB);
        }

        return (a.id || '').localeCompare(b.id || '');
      });

      const selecionado = ordenados[0] ?? null;

      if (selecionado) {
        const cargaSelecionado = cargas[selecionado.id] ?? 0;
        const prioridadeSelecionado = prioridadePorAtendente?.[selecionado.id] ?? 99;
        this.logger.log(
          `Atendente ${selecionado.id} selecionado com ${cargaSelecionado} tickets ativos (prioridade ${prioridadeSelecionado})`,
        );
      }

      return selecionado;
    } catch (error) {
      this.logger.warn(
        `Falha ao calcular carga dos atendentes: ${error instanceof Error ? error.message : String(error)}`,
      );
      return atendentes[0];
    }
  }

  async selecionarAtendenteParaRoteamento(
    empresaId: string,
    nucleoId: string,
    departamentoId?: string,
  ): Promise<User | null> {
    const candidatos = await this.buscarAtendentesDisponiveis(empresaId, nucleoId, departamentoId);

    if (candidatos.length === 0) {
      this.logger.warn(
        `⚠️ Nenhum atendente disponível para roteamento automático (empresa ${empresaId}, núcleo ${nucleoId}, departamento ${departamentoId || 'N/A'})`,
      );
      return null;
    }

    const ids = candidatos.map((c) => c.id).filter(Boolean);
    const prioridades = await this.mapearPrioridadeDisponibilidade(empresaId, ids, nucleoId, departamentoId);

    return this.selecionarAtendentePorCarga(candidatos, empresaId, prioridades);
  }
}


