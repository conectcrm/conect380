import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { Oportunidade, EstagioOportunidade } from './oportunidade.entity';
import { Atividade, TipoAtividade } from './atividade.entity';
import {
  CreateOportunidadeDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { User } from '../users/user.entity';

@Injectable()
export class OportunidadesService {
  constructor(
    @InjectRepository(Oportunidade)
    private oportunidadeRepository: Repository<Oportunidade>,
    @InjectRepository(Atividade)
    private atividadeRepository: Repository<Atividade>,
  ) { }

  async create(createOportunidadeDto: CreateOportunidadeDto, empresaId: string): Promise<Oportunidade> {
    const oportunidade = this.oportunidadeRepository.create({
      ...createOportunidadeDto,
      empresa_id: empresaId,  // ✅ ADICIONADO - Associar à empresa do token JWT
      dataFechamentoEsperado: createOportunidadeDto.dataFechamentoEsperado
        ? new Date(createOportunidadeDto.dataFechamentoEsperado)
        : null,
    });

    const savedOportunidade =
      await this.oportunidadeRepository.save(oportunidade);

    // Criar atividade de criação da oportunidade (não bloquear o fluxo)
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
    ).catch((err) => console.log('Erro ao criar atividade:', err));

    return savedOportunidade;
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
      .leftJoinAndSelect('oportunidade.cliente', 'cliente')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .where('oportunidade.empresa_id = :empresaId', { empresaId })
      .orderBy('oportunidade.updatedAt', 'DESC');

    // Filtros
    if (filters?.estagio) {
      queryBuilder.andWhere('oportunidade.estagio = :estagio', { estagio: filters.estagio });
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

    return queryBuilder.getMany();
  }

  async findOne(id: number, empresaId?: string): Promise<Oportunidade> {
    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoinAndSelect('oportunidade.responsavel', 'responsavel')
      .leftJoinAndSelect('oportunidade.cliente', 'cliente')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .where('oportunidade.id = :id', { id });

    if (empresaId) {
      queryBuilder.andWhere('oportunidade.empresa_id = :empresaId', { empresaId });
    }

    queryBuilder.orderBy('atividades.dataAtividade', 'DESC');

    const oportunidade = await queryBuilder.getOne();

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade não encontrada');
    }

    return oportunidade;
  }

  async update(
    id: number,
    updateOportunidadeDto: UpdateOportunidadeDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, empresaId);

    const estadoAnterior = { ...oportunidade };

    await this.oportunidadeRepository.update(id, {
      ...updateOportunidadeDto,
      dataFechamentoEsperado: updateOportunidadeDto.dataFechamentoEsperado
        ? new Date(updateOportunidadeDto.dataFechamentoEsperado)
        : undefined,
    });

    // Registrar mudanças importantes
    if (updateOportunidadeDto.estagio && updateOportunidadeDto.estagio !== estadoAnterior.estagio) {
      await this.createAtividade(
        {
          tipo: TipoAtividade.NOTA,
          descricao: `Estágio alterado de "${estadoAnterior.estagio}" para "${updateOportunidadeDto.estagio}"`,
          oportunidade_id: id,
        },
        {
          userId: oportunidade.responsavel_id,
          empresaId,
        },
      );
    }

    return this.findOne(id);
  }

  async updateEstagio(
    id: number,
    updateEstagioDto: UpdateEstagioDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, empresaId);

    const updateData: Partial<Oportunidade> = {
      estagio: updateEstagioDto.estagio,
    };

    // Se for fechamento (ganho ou perdido), registrar data
    if (
      updateEstagioDto.estagio === EstagioOportunidade.GANHO ||
      updateEstagioDto.estagio === EstagioOportunidade.PERDIDO
    ) {
      updateData.dataFechamentoReal = updateEstagioDto.dataFechamentoReal
        ? new Date(updateEstagioDto.dataFechamentoReal)
        : new Date();
    }

    await this.oportunidadeRepository.update(id, updateData);

    // Registrar atividade de mudança de estágio
    const descricao =
      updateEstagioDto.estagio === EstagioOportunidade.GANHO
        ? 'Oportunidade GANHA! 🎉'
        : updateEstagioDto.estagio === EstagioOportunidade.PERDIDO
          ? 'Oportunidade perdida'
          : `Movido para estágio: ${updateEstagioDto.estagio}`;

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

    return this.findOne(id);
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
      throw new NotFoundException('Oportunidade não encontrada para esta empresa');
    }

    const atividade = this.atividadeRepository.create({
      ...createAtividadeDto,
      empresa_id: context.empresaId,
      criado_por_id: context.userId ?? oportunidade.responsavel_id,
      dataAtividade: createAtividadeDto.dataAtividade
        ? new Date(createAtividadeDto.dataAtividade)
        : new Date(),
    });

    return await this.atividadeRepository.save(atividade);
  }

  async listarAtividades(oportunidadeId: number, empresaId: string): Promise<Atividade[]> {
    // Verificar se a oportunidade pertence à empresa
    const oportunidade = await this.oportunidadeRepository.findOne({
      where: {
        id: oportunidadeId,
        empresa_id: empresaId,
      },
    });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade não encontrada para esta empresa');
    }

    // Buscar atividades com informações do criador
    const atividades = await this.atividadeRepository.find({
      where: {
        oportunidade_id: oportunidadeId,
        empresa_id: empresaId,
      },
      relations: ['criadoPor'],
      order: {
        dataAtividade: 'DESC',
      },
    });

    return atividades;
  }

  async getMetricas(empresaId: string, filtros?: { dataInicio?: string; dataFim?: string }) {
    let queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .where('oportunidade.empresa_id = :empresaId', { empresaId });

    // Filtros de data
    if (filtros?.dataInicio && filtros?.dataFim) {
      queryBuilder = queryBuilder.andWhere(
        'oportunidade.createdAt BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
      );
    }

    const todasOportunidades = await queryBuilder.getMany();

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

    // Distribuição por estágio
    const distribuicaoPorEstagio = {};
    Object.values(EstagioOportunidade).forEach((estagio) => {
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
    Object.values(EstagioOportunidade).forEach((estagio) => {
      pipeline[estagio] = {
        id: estagio,
        title: this.getEstagioLabel(estagio),
        color: this.getEstagioColor(estagio),
        opportunities: oportunidades.filter((opp) => opp.estagio === estagio),
      };
    });

    return {
      stages: pipeline,
      stageOrder: Object.values(EstagioOportunidade),
    };
  }

  private getEstagioLabel(estagio: EstagioOportunidade): string {
    const labels = {
      [EstagioOportunidade.LEADS]: 'Leads',
      [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
      [EstagioOportunidade.PROPOSTA]: 'Proposta',
      [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
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
