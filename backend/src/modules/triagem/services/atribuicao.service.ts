import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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

export interface UpdateEquipeDto extends Partial<CreateEquipeDto> { }

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
  ) { }

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
      this.logger.warn(`Não foi possível gravar trace de criação de equipe: ${traceError.message}`);
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
  async buscarEquipe(equipeId: string): Promise<Equipe> {
    const equipe = await this.equipeRepository.findOne({
      where: { id: equipeId },
      relations: ['atendenteEquipes', 'atendenteEquipes.atendente', 'atribuicoes'],
    });

    if (!equipe) {
      throw new NotFoundException(`Equipe ${equipeId} não encontrada`);
    }

    return equipe;
  }

  /**
   * Atualiza uma equipe
   */
  async atualizarEquipe(
    equipeId: string,
    dto: UpdateEquipeDto,
  ): Promise<Equipe> {
    const equipe = await this.buscarEquipe(equipeId);

    Object.assign(equipe, dto);

    return await this.equipeRepository.save(equipe);
  }

  /**
   * Remove uma equipe
   */
  async removerEquipe(equipeId: string): Promise<void> {
    const equipe = await this.buscarEquipe(equipeId);
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
    equipeId: string,
    atendenteId: string,
    funcao: string = 'membro',
  ): Promise<AtendenteEquipe> {
    const equipe = await this.equipeRepository.findOne({ where: { id: equipeId } });

    if (!equipe) {
      throw new NotFoundException('Equipe não encontrada');
    }

    const usuario = await this.userRepository.findOne({ where: { id: atendenteId } });

    if (!usuario) {
      throw new NotFoundException('Usuário do atendente não encontrado');
    }

    if (usuario.empresa_id !== equipe.empresaId) {
      throw new BadRequestException('Atendente pertence a outra empresa');
    }

    // Verificar se já existe
    const existente = await this.atendenteEquipeRepository.findOne({
      where: { equipeId, atendenteId },
    });

    if (existente) {
      throw new BadRequestException('Atendente já está nessa equipe');
    }

    const atendenteEquipe = this.atendenteEquipeRepository.create({
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
    equipeId: string,
    atendenteId: string,
  ): Promise<void> {
    const atendenteEquipe = await this.atendenteEquipeRepository.findOne({
      where: { equipeId, atendenteId },
    });

    if (!atendenteEquipe) {
      throw new NotFoundException('Atendente não está nessa equipe');
    }

    await this.atendenteEquipeRepository.remove(atendenteEquipe);
  }

  /**
   * Lista atendentes de uma equipe
   */
  async listarAtendentesEquipe(equipeId: string): Promise<User[]> {
    const relacoes = await this.atendenteEquipeRepository.find({
      where: { equipeId },
      relations: ['atendente'],
    });

    return relacoes.map((r) => r.atendente);
  }

  // ========================================================================
  // ATRIBUIÇÕES DIRETAS (Atendente → Núcleo/Departamento)
  // ========================================================================

  /**
   * Atribui um atendente diretamente a um núcleo ou departamento
   */
  async atribuirAtendenteANucleoDepartamento(
    dto: AtribuirAtendenteDto,
  ): Promise<AtendenteAtribuicao> {
    if (!dto.nucleoId && !dto.departamentoId) {
      throw new BadRequestException(
        'É necessário informar nucleoId ou departamentoId',
      );
    }

    // Verificar se o atendente existe
    const atendente = await this.userRepository.findOne({
      where: { id: dto.atendenteId },
    });
    if (!atendente) {
      throw new NotFoundException(
        `Atendente ${dto.atendenteId} não encontrado`,
      );
    }

    // Verificar se o núcleo existe (se informado)
    if (dto.nucleoId) {
      const nucleo = await this.nucleoRepository.findOne({
        where: { id: dto.nucleoId },
      });
      if (!nucleo) {
        throw new NotFoundException(`Núcleo ${dto.nucleoId} não encontrado`);
      }
    }

    // Verificar se o departamento existe (se informado)
    if (dto.departamentoId) {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: dto.departamentoId },
      });
      if (!departamento) {
        throw new NotFoundException(
          `Departamento ${dto.departamentoId} não encontrado`,
        );
      }
    }

    // Verificar duplicata
    const existente = await this.atendenteAtribuicaoRepository.findOne({
      where: {
        atendenteId: dto.atendenteId,
        nucleoId: dto.nucleoId || null,
        departamentoId: dto.departamentoId || null,
      },
    });

    if (existente) {
      throw new BadRequestException('Atribuição já existe');
    }

    const atribuicao = this.atendenteAtribuicaoRepository.create({
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
  async removerAtribuicaoAtendente(atribuicaoId: string): Promise<void> {
    const atribuicao = await this.atendenteAtribuicaoRepository.findOne({
      where: { id: atribuicaoId },
    });

    if (!atribuicao) {
      throw new NotFoundException('Atribuição não encontrada');
    }

    await this.atendenteAtribuicaoRepository.remove(atribuicao);
  }

  /**
   * Lista atribuições de um atendente
   */
  async listarAtribuicoesAtendente(
    atendenteId: string,
  ): Promise<AtendenteAtribuicao[]> {
    return await this.atendenteAtribuicaoRepository.find({
      where: { atendenteId, ativo: true },
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
    dto: AtribuirEquipeDto,
  ): Promise<EquipeAtribuicao> {
    if (!dto.nucleoId && !dto.departamentoId) {
      throw new BadRequestException(
        'É necessário informar nucleoId ou departamentoId',
      );
    }

    // Verificar se a equipe existe
    const equipe = await this.equipeRepository.findOne({
      where: { id: dto.equipeId },
    });
    if (!equipe) {
      throw new NotFoundException(`Equipe ${dto.equipeId} não encontrada`);
    }

    // Verificar se o núcleo existe (se informado)
    if (dto.nucleoId) {
      const nucleo = await this.nucleoRepository.findOne({
        where: { id: dto.nucleoId },
      });
      if (!nucleo) {
        throw new NotFoundException(`Núcleo ${dto.nucleoId} não encontrado`);
      }
    }

    // Verificar se o departamento existe (se informado)
    if (dto.departamentoId) {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: dto.departamentoId },
      });
      if (!departamento) {
        throw new NotFoundException(
          `Departamento ${dto.departamentoId} não encontrado`,
        );
      }
    }

    const existente = await this.equipeAtribuicaoRepository.findOne({
      where: {
        equipeId: dto.equipeId,
        nucleoId: dto.nucleoId || null,
        departamentoId: dto.departamentoId || null,
      },
    });

    if (existente) {
      throw new BadRequestException('Atribuição já existe');
    }

    const atribuicao = this.equipeAtribuicaoRepository.create({
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
  async removerAtribuicaoEquipe(atribuicaoId: string): Promise<void> {
    const atribuicao = await this.equipeAtribuicaoRepository.findOne({
      where: { id: atribuicaoId },
    });

    if (!atribuicao) {
      throw new NotFoundException('Atribuição não encontrada');
    }

    await this.equipeAtribuicaoRepository.remove(atribuicao);
  }

  /**
   * Lista atribuições de uma equipe
   */
  async listarAtribuicoesEquipe(equipeId: string): Promise<EquipeAtribuicao[]> {
    return await this.equipeAtribuicaoRepository.find({
      where: { equipeId, ativo: true },
      relations: ['nucleo', 'departamento'],
      order: { prioridade: 'ASC' },
    });
  }

  // ========================================================================
  // BUSCA DE ATENDENTES DISPONÍVEIS (usado pelo bot de triagem)
  // ========================================================================

  /**
   * Busca atendentes disponíveis para um núcleo/departamento
   * Lógica hierárquica:
   * 1. Atribuições diretas ao departamento (maior prioridade)
   * 2. Atribuições diretas ao núcleo
   * 3. Atribuições via equipe → departamento
   * 4. Atribuições via equipe → núcleo
   */
  async buscarAtendentesDisponiveis(
    empresaId: string,
    nucleoId: string,
    departamentoId?: string,
  ): Promise<User[]> {
    this.logger.log(
      `Buscando atendentes disponíveis - Empresa: ${empresaId}, Núcleo: ${nucleoId}, Departamento: ${departamentoId || 'N/A'}`,
    );

    const query = this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .leftJoin('atendente_atribuicoes', 'atrib', 'atrib.atendente_id = user.id')
      .leftJoin('atendente_equipes', 'ae', 'ae.atendente_id = user.id')
      .leftJoin('equipe_atribuicoes', 'equipeAtrib', 'equipeAtrib.equipe_id = ae.equipe_id')
      .where('user.empresa_id = :empresaId', { empresaId })
      .andWhere('user.ativo = true')
      .andWhere(
        new Brackets((qb) => {
          // Atribuição direta ao núcleo
          qb.where('atrib.nucleo_id = :nucleoId AND atrib.ativo = true', {
            nucleoId,
          });

          // Atribuição direta ao departamento (se fornecido)
          if (departamentoId) {
            qb.orWhere(
              'atrib.departamento_id = :departamentoId AND atrib.ativo = true',
              { departamentoId },
            );
          }

          // Atribuição via equipe → núcleo
          qb.orWhere(
            'equipeAtrib.nucleo_id = :nucleoId AND equipeAtrib.ativo = true',
          );

          // Atribuição via equipe → departamento
          if (departamentoId) {
            qb.orWhere(
              'equipeAtrib.departamento_id = :departamentoId AND equipeAtrib.ativo = true',
            );
          }
        }),
      )
      .distinct(true);

    const rawIds = await query.getRawMany();
    const ids = rawIds.map((row) => row.id).filter(Boolean);

    if (ids.length === 0) {
      this.logger.log('0 atendentes encontrados');
      return [];
    }

    const atendentes = await this.userRepository.find({ where: { id: In(ids) } });

    this.logger.log(`${atendentes.length} atendentes encontrados`);

    return atendentes;
  }

  /**
   * Seleciona o atendente com menor carga de trabalho
   * TODO: Implementar lógica de contagem de tickets ativos por atendente
   */
  async selecionarAtendentePorCarga(
    atendentes: User[],
    empresaId?: string,
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
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO,
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
        this.logger.log(
          `Atendente ${selecionado.id} selecionado com ${cargaSelecionado} tickets ativos`,
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
}
