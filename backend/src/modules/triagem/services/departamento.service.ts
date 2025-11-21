import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Departamento } from '../entities/departamento.entity';
import {
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
  FilterDepartamentoDto,
} from '../dto/departamento.dto';

@Injectable()
export class DepartamentoService {
  private readonly logger = new Logger(DepartamentoService.name);

  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
  ) {}

  /**
   * Cria um novo departamento
   */
  async create(empresaId: string, createDto: CreateDepartamentoDto): Promise<Departamento> {
    this.logger.log(`Criando departamento "${createDto.nome}" para empresa ${empresaId}`);

    // Validar se o nome já existe no mesmo núcleo
    const existente = await this.departamentoRepository.findOne({
      where: {
        empresaId,
        nucleoId: createDto.nucleoId,
        nome: createDto.nome,
      },
    });

    if (existente) {
      throw new BadRequestException(
        `Já existe um departamento com o nome "${createDto.nome}" neste núcleo`,
      );
    }

    const departamento = this.departamentoRepository.create({
      empresaId,
      nucleoId: createDto.nucleoId,
      nome: createDto.nome,
      descricao: createDto.descricao,
      codigo: createDto.codigo,
      cor: createDto.cor,
      icone: createDto.icone,
      ativo: createDto.ativo ?? true,
      ordem: createDto.ordem,
      atendentesIds: createDto.atendentesIds || [],
      supervisorId: createDto.supervisorId,
      horarioFuncionamento: createDto.horarioFuncionamento as any,
      slaRespostaMinutos: createDto.slaRespostaMinutos,
      slaResolucaoHoras: createDto.slaResolucaoHoras,
      mensagemBoasVindas: createDto.mensagemBoasVindas,
      mensagemTransferencia: createDto.mensagemTransferencia,
      tipoDistribuicao: createDto.tipoDistribuicao as any,
      capacidadeMaximaTickets: createDto.capacidadeMaximaTickets,
      skills: createDto.skills,
    });

    const saved = await this.departamentoRepository.save(departamento);
    this.logger.log(`Departamento "${saved.nome}" criado com ID: ${saved.id}`);

    return saved;
  }

  /**
   * Busca todos os departamentos com filtros opcionais
   */
  async findAll(empresaId: string, filters?: FilterDepartamentoDto): Promise<Departamento[]> {
    try {
      this.logger.log(`Buscando departamentos para empresa ${empresaId}`);

      const query = this.departamentoRepository
        .createQueryBuilder('dept')
        .leftJoinAndSelect('dept.nucleo', 'nucleo')
        .where('dept.empresaId = :empresaId', { empresaId })
        .orderBy('dept.ordem', 'ASC')
        .addOrderBy('dept.nome', 'ASC');

      if (filters?.nucleoId) {
        query.andWhere('dept.nucleoId = :nucleoId', {
          nucleoId: filters.nucleoId,
        });
      }

      if (filters?.ativo !== undefined) {
        query.andWhere('dept.ativo = :ativo', { ativo: filters.ativo });
      }

      if (filters?.nome) {
        query.andWhere('dept.nome ILIKE :nome', {
          nome: `%${filters.nome}%`,
        });
      }

      if (filters?.busca) {
        query.andWhere(
          '(dept.nome ILIKE :busca OR dept.descricao ILIKE :busca OR dept.codigo ILIKE :busca)',
          { busca: `%${filters.busca}%` },
        );
      }

      if (filters?.tipoDistribuicao) {
        query.andWhere('dept.tipoDistribuicao = :tipo', {
          tipo: filters.tipoDistribuicao,
        });
      }

      if (filters?.supervisorId) {
        query.andWhere('dept.supervisorId = :supervisorId', {
          supervisorId: filters.supervisorId,
        });
      }

      const departamentos = await query.getMany();
      this.logger.log(`Encontrados ${departamentos.length} departamentos`);

      return departamentos;
    } catch (error) {
      this.logger.error('Erro ao buscar departamentos:', error);
      throw error;
    }
  }

  /**
   * Busca departamentos por núcleo (apenas ativos)
   */
  async findByNucleo(empresaId: string, nucleoId: string): Promise<Departamento[]> {
    this.logger.log(`Buscando departamentos ativos do núcleo ${nucleoId}`);

    return this.departamentoRepository.find({
      where: {
        empresaId,
        nucleoId,
        ativo: true,
      },
      order: {
        ordem: 'ASC',
        nome: 'ASC',
      },
    });
  }

  /**
   * Busca um departamento específico
   */
  async findOne(empresaId: string, id: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findOne({
      where: { id, empresaId },
      relations: ['nucleo', 'supervisor'],
    });

    if (!departamento) {
      throw new NotFoundException(`Departamento com ID ${id} não encontrado`);
    }

    return departamento;
  }

  /**
   * Atualiza um departamento
   */
  async update(
    empresaId: string,
    id: string,
    updateDto: UpdateDepartamentoDto,
  ): Promise<Departamento> {
    this.logger.log(`Atualizando departamento ${id}`);

    const departamento = await this.findOne(empresaId, id);

    // Se está alterando o nome, validar duplicidade
    if (updateDto.nome && updateDto.nome !== departamento.nome) {
      const existente = await this.departamentoRepository.findOne({
        where: {
          empresaId,
          nucleoId: departamento.nucleoId,
          nome: updateDto.nome,
        },
      });

      if (existente) {
        throw new BadRequestException(
          `Já existe um departamento com o nome "${updateDto.nome}" neste núcleo`,
        );
      }
    }

    Object.assign(departamento, updateDto);

    const saved = await this.departamentoRepository.save(departamento);
    this.logger.log(`Departamento ${id} atualizado com sucesso`);

    return saved;
  }

  /**
   * Remove um departamento
   */
  async remove(empresaId: string, id: string): Promise<void> {
    this.logger.log(`Removendo departamento ${id}`);

    const departamento = await this.findOne(empresaId, id);

    // Verificar se há tickets em aberto (implementação futura)
    // const ticketsAbertos = await this.verificarTicketsAbertos(id);
    // if (ticketsAbertos > 0) {
    //   throw new BadRequestException(
    //     `Não é possível remover departamento com ${ticketsAbertos} tickets em aberto`,
    //   );
    // }

    await this.departamentoRepository.remove(departamento);
    this.logger.log(`Departamento ${id} removido com sucesso`);
  }

  /**
   * Adiciona atendente a um departamento
   */
  async adicionarAtendente(
    empresaId: string,
    id: string,
    atendenteId: string,
  ): Promise<Departamento> {
    const departamento = await this.findOne(empresaId, id);

    if (!departamento.atendentesIds.includes(atendenteId)) {
      departamento.atendentesIds.push(atendenteId);
      return this.departamentoRepository.save(departamento);
    }

    return departamento;
  }

  /**
   * Remove atendente de um departamento
   */
  async removerAtendente(
    empresaId: string,
    id: string,
    atendenteId: string,
  ): Promise<Departamento> {
    const departamento = await this.findOne(empresaId, id);

    departamento.atendentesIds = departamento.atendentesIds.filter((id) => id !== atendenteId);

    return this.departamentoRepository.save(departamento);
  }

  /**
   * Busca estatísticas do departamento
   */
  async getEstatisticas(empresaId: string, id: string) {
    const departamento = await this.findOne(empresaId, id);

    return {
      id: departamento.id,
      nome: departamento.nome,
      totalAtendentes: departamento.atendentesIds.length,
      ativo: departamento.ativo,
      capacidadeMaxima: departamento.capacidadeMaximaTickets,
      tipoDistribuicao: departamento.tipoDistribuicao,
      slaResposta: departamento.slaRespostaMinutos,
      slaResolucao: departamento.slaResolucaoHoras,
      // Métricas futuras:
      // ticketsAbertos: 0,
      // ticketsResolvidos: 0,
      // tempoMedioResposta: 0,
      // tempoMedioResolucao: 0,
      // taxaSatisfacao: 0,
    };
  }

  /**
   * Reordena departamentos
   */
  async reordenar(
    empresaId: string,
    nucleoId: string,
    ordenacao: { id: string; ordem: number }[],
  ): Promise<void> {
    this.logger.log(`Reordenando departamentos do núcleo ${nucleoId}`);

    for (const item of ordenacao) {
      await this.departamentoRepository.update(
        { id: item.id, empresaId, nucleoId },
        { ordem: item.ordem },
      );
    }

    this.logger.log('Departamentos reordenados com sucesso');
  }
}
