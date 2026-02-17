import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oportunidade, EstagioOportunidade } from './oportunidade.entity';
import { Atividade, TipoAtividade } from './atividade.entity';
import {
  CreateOportunidadeDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';

@Injectable()
export class OportunidadesService {
  private readonly canonicalStageOrder: EstagioOportunidade[] = [
    EstagioOportunidade.LEADS,
    EstagioOportunidade.QUALIFICACAO,
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.FECHAMENTO,
    EstagioOportunidade.GANHO,
    EstagioOportunidade.PERDIDO,
  ];

  constructor(
    @InjectRepository(Oportunidade)
    private oportunidadeRepository: Repository<Oportunidade>,
    @InjectRepository(Atividade)
    private atividadeRepository: Repository<Atividade>,
  ) {}

  private toDatabaseEstagio(
    estagio?: EstagioOportunidade | string,
  ): EstagioOportunidade {
    if (estagio && Object.values(EstagioOportunidade).includes(estagio as EstagioOportunidade)) {
      return estagio as EstagioOportunidade;
    }

    return EstagioOportunidade.LEADS;
  }

  private fromDatabaseEstagio(estagio?: string | EstagioOportunidade): EstagioOportunidade {
    if (estagio && Object.values(EstagioOportunidade).includes(estagio as EstagioOportunidade)) {
      return estagio as EstagioOportunidade;
    }

    return EstagioOportunidade.LEADS;
  }

  private normalizeOportunidade(oportunidade: Oportunidade): Oportunidade {
    oportunidade.estagio = this.fromDatabaseEstagio(oportunidade.estagio);
    return oportunidade;
  }

  async create(
    createOportunidadeDto: CreateOportunidadeDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const oportunidade = this.oportunidadeRepository.create({
      titulo: createOportunidadeDto.titulo,
      descricao: createOportunidadeDto.descricao,
      valor: createOportunidadeDto.valor,
      probabilidade: createOportunidadeDto.probabilidade,
      estagio: this.toDatabaseEstagio(createOportunidadeDto.estagio),
      prioridade: createOportunidadeDto.prioridade,
      origem: createOportunidadeDto.origem,
      tags: createOportunidadeDto.tags?.length ? createOportunidadeDto.tags : null,
      empresa_id: empresaId,
      responsavel_id: createOportunidadeDto.responsavel_id,
      cliente_id: createOportunidadeDto.cliente_id ?? null,
      nomeContato: createOportunidadeDto.nomeContato,
      emailContato: createOportunidadeDto.emailContato,
      telefoneContato: createOportunidadeDto.telefoneContato,
      empresaContato: createOportunidadeDto.empresaContato,
      dataFechamentoEsperado: createOportunidadeDto.dataFechamentoEsperado
        ? new Date(createOportunidadeDto.dataFechamentoEsperado)
        : null,
    });

    const savedOportunidade = await this.oportunidadeRepository.save(oportunidade);

    this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: 'Oportunidade criada',
        oportunidade_id: savedOportunidade.id,
      },
      {
        userId: savedOportunidade.responsavel_id,
        empresaId,
      },
    ).catch(() => undefined);

    return this.normalizeOportunidade(savedOportunidade);
  }

  async findAll(
    empresaId: string,
    filters?: {
      estagio?: EstagioOportunidade;
      responsavel_id?: string;
      cliente_id?: string;
      dataInicio?: string;
      dataFim?: string;
    },
  ): Promise<Oportunidade[]> {
    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoinAndSelect('oportunidade.responsavel', 'responsavel')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .where('oportunidade.empresa_id = :empresaId', { empresaId })
      .orderBy('oportunidade.updatedAt', 'DESC');

    if (filters?.estagio) {
      queryBuilder.andWhere('oportunidade.estagio = :estagio', {
        estagio: this.toDatabaseEstagio(filters.estagio),
      });
    }

    if (filters?.responsavel_id) {
      queryBuilder.andWhere('oportunidade.responsavel_id = :responsavel_id', {
        responsavel_id: filters.responsavel_id,
      });
    }

    if (filters?.cliente_id) {
      queryBuilder.andWhere('oportunidade.cliente_id = :cliente_id', {
        cliente_id: filters.cliente_id,
      });
    }

    if (filters?.dataInicio && filters?.dataFim) {
      queryBuilder.andWhere('oportunidade.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
      });
    }

    const oportunidades = await queryBuilder.getMany();
    return oportunidades.map((item) => this.normalizeOportunidade(item));
  }

  async findOne(id: number, empresaId?: string): Promise<Oportunidade> {
    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoinAndSelect('oportunidade.responsavel', 'responsavel')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .where('oportunidade.id = :id', { id });

    if (empresaId) {
      queryBuilder.andWhere('oportunidade.empresa_id = :empresaId', { empresaId });
    }

    queryBuilder.orderBy('atividades.dataAtividade', 'DESC');

    const oportunidade = await queryBuilder.getOne();

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada');
    }

    return this.normalizeOportunidade(oportunidade);
  }

  async update(
    id: number,
    updateOportunidadeDto: UpdateOportunidadeDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, empresaId);
    const estagioAnterior = oportunidade.estagio;

    const updateData: Partial<Oportunidade> = {};

    if (updateOportunidadeDto.titulo !== undefined) {
      updateData.titulo = updateOportunidadeDto.titulo;
    }

    if (updateOportunidadeDto.descricao !== undefined) {
      updateData.descricao = updateOportunidadeDto.descricao;
    }

    if (updateOportunidadeDto.valor !== undefined) {
      updateData.valor = updateOportunidadeDto.valor;
    }

    if (updateOportunidadeDto.probabilidade !== undefined) {
      updateData.probabilidade = updateOportunidadeDto.probabilidade;
    }

    if (updateOportunidadeDto.estagio !== undefined) {
      updateData.estagio = this.toDatabaseEstagio(updateOportunidadeDto.estagio);
    }

    if (updateOportunidadeDto.prioridade !== undefined) {
      updateData.prioridade = updateOportunidadeDto.prioridade;
    }

    if (updateOportunidadeDto.origem !== undefined) {
      updateData.origem = updateOportunidadeDto.origem;
    }

    if (updateOportunidadeDto.tags !== undefined) {
      updateData.tags = updateOportunidadeDto.tags?.length ? updateOportunidadeDto.tags : null;
    }

    if (updateOportunidadeDto.responsavel_id !== undefined) {
      updateData.responsavel_id = updateOportunidadeDto.responsavel_id;
    }

    if (updateOportunidadeDto.cliente_id !== undefined) {
      updateData.cliente_id = updateOportunidadeDto.cliente_id ?? null;
    }

    if (updateOportunidadeDto.nomeContato !== undefined) {
      updateData.nomeContato = updateOportunidadeDto.nomeContato;
    }

    if (updateOportunidadeDto.emailContato !== undefined) {
      updateData.emailContato = updateOportunidadeDto.emailContato;
    }

    if (updateOportunidadeDto.telefoneContato !== undefined) {
      updateData.telefoneContato = updateOportunidadeDto.telefoneContato;
    }

    if (updateOportunidadeDto.empresaContato !== undefined) {
      updateData.empresaContato = updateOportunidadeDto.empresaContato;
    }

    if (updateOportunidadeDto.dataFechamentoEsperado !== undefined) {
      updateData.dataFechamentoEsperado = updateOportunidadeDto.dataFechamentoEsperado
        ? new Date(updateOportunidadeDto.dataFechamentoEsperado)
        : null;
    }

    await this.oportunidadeRepository.update(id, updateData);

    if (updateOportunidadeDto.estagio && updateOportunidadeDto.estagio !== estagioAnterior) {
      await this.createAtividade(
        {
          tipo: TipoAtividade.NOTA,
          descricao: `Estagio alterado de "${estagioAnterior}" para "${updateOportunidadeDto.estagio}"`,
          oportunidade_id: id,
        },
        {
          userId: oportunidade.responsavel_id,
          empresaId,
        },
      );
    }

    return this.findOne(id, empresaId);
  }

  async updateEstagio(
    id: number,
    updateEstagioDto: UpdateEstagioDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, empresaId);

    await this.oportunidadeRepository.update(id, {
      estagio: this.toDatabaseEstagio(updateEstagioDto.estagio),
    });

    const descricao =
      updateEstagioDto.estagio === EstagioOportunidade.GANHO
        ? 'Oportunidade GANHA'
        : updateEstagioDto.estagio === EstagioOportunidade.PERDIDO
          ? 'Oportunidade perdida'
          : `Movido para estagio: ${updateEstagioDto.estagio}`;

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao,
        oportunidade_id: id,
      },
      {
        userId: oportunidade.responsavel_id,
        empresaId,
      },
    );

    return this.findOne(id, empresaId);
  }

  async remove(id: number, empresaId: string): Promise<void> {
    const oportunidade = await this.findOne(id, empresaId);
    await this.oportunidadeRepository.remove(oportunidade);
  }

  async createAtividade(
    createAtividadeDto: CreateAtividadeDto,
    context: { userId?: string; empresaId: string },
  ): Promise<Atividade> {
    const oportunidade = await this.oportunidadeRepository.findOne({
      where: {
        id: createAtividadeDto.oportunidade_id,
        empresa_id: context.empresaId,
      },
    });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const atividade = this.atividadeRepository.create({
      tipo: createAtividadeDto.tipo,
      descricao: createAtividadeDto.descricao,
      oportunidade_id: oportunidade.id,
      empresa_id: context.empresaId,
      criado_por_id: context.userId ?? oportunidade.responsavel_id,
      dataAtividade: createAtividadeDto.dataAtividade
        ? new Date(createAtividadeDto.dataAtividade)
        : new Date(),
    });

    return this.atividadeRepository.save(atividade);
  }

  async listarAtividades(oportunidadeId: number, empresaId: string): Promise<Atividade[]> {
    const oportunidade = await this.oportunidadeRepository.findOne({
      where: {
        id: oportunidadeId,
        empresa_id: empresaId,
      },
    });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    return this.atividadeRepository.find({
      where: {
        oportunidade_id: oportunidadeId,
        empresa_id: empresaId,
      },
      relations: ['criadoPor'],
      order: {
        dataAtividade: 'DESC',
      },
    });
  }

  async getMetricas(empresaId: string, filtros?: { dataInicio?: string; dataFim?: string }) {
    let queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .where('oportunidade.empresa_id = :empresaId', { empresaId });

    if (filtros?.dataInicio && filtros?.dataFim) {
      queryBuilder = queryBuilder.andWhere('oportunidade.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      });
    }

    const todasOportunidades = (await queryBuilder.getMany()).map((opp) =>
      this.normalizeOportunidade(opp),
    );

    const totalOportunidades = todasOportunidades.length;
    const valorTotalPipeline = todasOportunidades.reduce((sum, opp) => sum + Number(opp.valor), 0);

    const oportunidadesGanhas = todasOportunidades.filter(
      (opp) => opp.estagio === EstagioOportunidade.GANHO,
    );
    const valorGanho = oportunidadesGanhas.reduce((sum, opp) => sum + Number(opp.valor), 0);

    const taxaConversao =
      totalOportunidades > 0
        ? ((oportunidadesGanhas.length / totalOportunidades) * 100).toFixed(1)
        : 0;

    const valorMedio = totalOportunidades > 0 ? valorTotalPipeline / totalOportunidades : 0;

    const distribuicaoPorEstagio = {};
    this.canonicalStageOrder.forEach((estagio) => {
      const oportunidadesEstagio = todasOportunidades.filter((opp) => opp.estagio === estagio);
      distribuicaoPorEstagio[estagio] = {
        quantidade: oportunidadesEstagio.length,
        valor: oportunidadesEstagio.reduce((sum, opp) => sum + Number(opp.valor), 0),
      };
    });

    return {
      totalOportunidades,
      valorTotalPipeline,
      valorGanho,
      taxaConversao: Number(taxaConversao),
      valorMedio,
      distribuicaoPorEstagio,
    };
  }

  async getPipelineData(empresaId: string) {
    const oportunidades = await this.findAll(empresaId);

    const pipeline = {};
    this.canonicalStageOrder.forEach((estagio) => {
      pipeline[estagio] = {
        id: estagio,
        title: this.getEstagioLabel(estagio),
        color: this.getEstagioColor(estagio),
        opportunities: oportunidades.filter((opp) => opp.estagio === estagio),
      };
    });

    return {
      stages: pipeline,
      stageOrder: this.canonicalStageOrder,
    };
  }

  private getEstagioLabel(estagio: EstagioOportunidade): string {
    const labels = {
      [EstagioOportunidade.LEADS]: 'Leads',
      [EstagioOportunidade.QUALIFICACAO]: 'Qualificacao',
      [EstagioOportunidade.PROPOSTA]: 'Proposta',
      [EstagioOportunidade.NEGOCIACAO]: 'Negociacao',
      [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
      [EstagioOportunidade.GANHO]: 'Ganho',
      [EstagioOportunidade.PERDIDO]: 'Perdido',
    };
    return labels[estagio];
  }

  private getEstagioColor(estagio: EstagioOportunidade): string {
    const colors = {
      [EstagioOportunidade.LEADS]: '#6B7280',
      [EstagioOportunidade.QUALIFICACAO]: '#3B82F6',
      [EstagioOportunidade.PROPOSTA]: '#F59E0B',
      [EstagioOportunidade.NEGOCIACAO]: '#8B5CF6',
      [EstagioOportunidade.FECHAMENTO]: '#06B6D4',
      [EstagioOportunidade.GANHO]: '#10B981',
      [EstagioOportunidade.PERDIDO]: '#EF4444',
    };
    return colors[estagio];
  }
}
