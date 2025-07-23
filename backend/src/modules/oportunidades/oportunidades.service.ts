import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { Oportunidade, EstagioOportunidade } from './oportunidade.entity';
import { Atividade, TipoAtividade } from './atividade.entity';
import { CreateOportunidadeDto, UpdateOportunidadeDto, UpdateEstagioDto } from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { User } from '../users/user.entity';

@Injectable()
export class OportunidadesService {
  constructor(
    @InjectRepository(Oportunidade)
    private oportunidadeRepository: Repository<Oportunidade>,
    @InjectRepository(Atividade)
    private atividadeRepository: Repository<Atividade>,
  ) {}

  async create(createOportunidadeDto: CreateOportunidadeDto, user: User): Promise<Oportunidade> {
    const oportunidade = this.oportunidadeRepository.create({
      ...createOportunidadeDto,
      dataFechamentoEsperado: createOportunidadeDto.dataFechamentoEsperado 
        ? new Date(createOportunidadeDto.dataFechamentoEsperado) 
        : null,
    });

    const savedOportunidade = await this.oportunidadeRepository.save(oportunidade);

    // Criar atividade de criação (sem await para não bloquear)
    this.createAtividade({
      tipo: TipoAtividade.NOTA,
      descricao: 'Oportunidade criada',
      oportunidade_id: savedOportunidade.id
    }, user).catch(err => console.log('Erro ao criar atividade:', err));

    return savedOportunidade;
  }

  async findAll(
    user: User,
    filters?: {
      estagio?: EstagioOportunidade;
      responsavel_id?: number;
      cliente_id?: number;
      dataInicio?: string;
      dataFim?: string;
    }
  ): Promise<Oportunidade[]> {
    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoinAndSelect('oportunidade.responsavel', 'responsavel')
      .leftJoinAndSelect('oportunidade.cliente', 'cliente')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .orderBy('oportunidade.updatedAt', 'DESC');

    // Filtros
    if (filters?.estagio) {
      queryBuilder.andWhere('oportunidade.estagio = :estagio', { estagio: filters.estagio });
    }

    if (filters?.responsavel_id) {
      queryBuilder.andWhere('oportunidade.responsavel_id = :responsavel_id', { 
        responsavel_id: filters.responsavel_id 
      });
    }

    if (filters?.cliente_id) {
      queryBuilder.andWhere('oportunidade.cliente_id = :cliente_id', { 
        cliente_id: filters.cliente_id 
      });
    }

    if (filters?.dataInicio && filters?.dataFim) {
      queryBuilder.andWhere('oportunidade.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim
      });
    }

    // Verificar permissões - vendedores só veem suas oportunidades
    if (user.role === 'vendedor') {
      queryBuilder.andWhere('oportunidade.responsavel_id = :userId', { userId: user.id });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, user?: User): Promise<Oportunidade> {
    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoinAndSelect('oportunidade.responsavel', 'responsavel')
      .leftJoinAndSelect('oportunidade.cliente', 'cliente')
      .leftJoinAndSelect('oportunidade.atividades', 'atividades')
      .leftJoinAndSelect('atividades.criadoPor', 'atividadeCriadoPor')
      .where('oportunidade.id = :id', { id })
      .orderBy('atividades.dataAtividade', 'DESC');

    if (user && user.role === 'vendedor') {
      queryBuilder.andWhere('oportunidade.responsavel_id = :userId', { userId: user.id });
    }

    const oportunidade = await queryBuilder.getOne();

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade não encontrada');
    }

    return oportunidade;
  }

  async update(id: number, updateOportunidadeDto: UpdateOportunidadeDto, user: User): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, user);

    // Verificar se pode editar
    if (user.role === 'vendedor' && oportunidade.responsavel_id !== user.id) {
      throw new ForbiddenException('Você só pode editar suas próprias oportunidades');
    }

    const estadoAnterior = { ...oportunidade };

    await this.oportunidadeRepository.update(id, {
      ...updateOportunidadeDto,
      dataFechamentoEsperado: updateOportunidadeDto.dataFechamentoEsperado 
        ? new Date(updateOportunidadeDto.dataFechamentoEsperado) 
        : undefined,
    });

    // Registrar mudanças importantes
    if (updateOportunidadeDto.estagio && updateOportunidadeDto.estagio !== estadoAnterior.estagio) {
      await this.createAtividade({
        tipo: TipoAtividade.NOTA,
        descricao: `Estágio alterado de "${estadoAnterior.estagio}" para "${updateOportunidadeDto.estagio}"`,
        oportunidade_id: id
      }, user);
    }

    return this.findOne(id);
  }

  async updateEstagio(id: number, updateEstagioDto: UpdateEstagioDto, user: User): Promise<Oportunidade> {
    const oportunidade = await this.findOne(id, user);

    const updateData: Partial<Oportunidade> = {
      estagio: updateEstagioDto.estagio
    };

    // Se for fechamento (ganho ou perdido), registrar data
    if (updateEstagioDto.estagio === EstagioOportunidade.GANHO || 
        updateEstagioDto.estagio === EstagioOportunidade.PERDIDO) {
      updateData.dataFechamentoReal = updateEstagioDto.dataFechamentoReal 
        ? new Date(updateEstagioDto.dataFechamentoReal)
        : new Date();
    }

    await this.oportunidadeRepository.update(id, updateData);

    // Registrar atividade de mudança de estágio
    const descricao = updateEstagioDto.estagio === EstagioOportunidade.GANHO 
      ? 'Oportunidade GANHA! 🎉'
      : updateEstagioDto.estagio === EstagioOportunidade.PERDIDO
      ? 'Oportunidade perdida'
      : `Movido para estágio: ${updateEstagioDto.estagio}`;

    await this.createAtividade({
      tipo: TipoAtividade.NOTA,
      descricao,
      oportunidade_id: id
    }, user);

    return this.findOne(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const oportunidade = await this.findOne(id, user);

    if (user.role === 'vendedor' && oportunidade.responsavel_id !== user.id) {
      throw new ForbiddenException('Você só pode excluir suas próprias oportunidades');
    }

    await this.oportunidadeRepository.remove(oportunidade);
  }

  async createAtividade(createAtividadeDto: CreateAtividadeDto, user: User): Promise<Atividade> {
    const atividade = this.atividadeRepository.create({
      ...createAtividadeDto,
      criado_por_id: user.id,
      dataAtividade: createAtividadeDto.dataAtividade 
        ? new Date(createAtividadeDto.dataAtividade)
        : new Date(),
    });

    return await this.atividadeRepository.save(atividade);
  }

  async getMetricas(user: User, filtros?: { dataInicio?: string; dataFim?: string }) {
    let queryBuilder = this.oportunidadeRepository.createQueryBuilder('oportunidade');

    // Aplicar filtros de permissão
    if (user.role === 'vendedor') {
      queryBuilder = queryBuilder.where('oportunidade.responsavel_id = :userId', { userId: user.id });
    }

    // Filtros de data
    if (filtros?.dataInicio && filtros?.dataFim) {
      queryBuilder = queryBuilder.andWhere('oportunidade.createdAt BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });
    }

    const todasOportunidades = await queryBuilder.getMany();

    const totalOportunidades = todasOportunidades.length;
    const valorTotalPipeline = todasOportunidades.reduce((sum, opp) => sum + Number(opp.valor), 0);
    
    const oportunidadesGanhas = todasOportunidades.filter(opp => opp.estagio === EstagioOportunidade.GANHO);
    const valorGanho = oportunidadesGanhas.reduce((sum, opp) => sum + Number(opp.valor), 0);
    
    const taxaConversao = totalOportunidades > 0 
      ? ((oportunidadesGanhas.length / totalOportunidades) * 100).toFixed(1)
      : 0;

    const valorMedio = totalOportunidades > 0 ? valorTotalPipeline / totalOportunidades : 0;

    // Distribuição por estágio
    const distribuicaoPorEstagio = {};
    Object.values(EstagioOportunidade).forEach(estagio => {
      const oportunidadesEstagio = todasOportunidades.filter(opp => opp.estagio === estagio);
      distribuicaoPorEstagio[estagio] = {
        quantidade: oportunidadesEstagio.length,
        valor: oportunidadesEstagio.reduce((sum, opp) => sum + Number(opp.valor), 0)
      };
    });

    return {
      totalOportunidades,
      valorTotalPipeline,
      valorGanho,
      taxaConversao: Number(taxaConversao),
      valorMedio,
      distribuicaoPorEstagio
    };
  }

  async getPipelineData(user: User) {
    const oportunidades = await this.findAll(user);
    
    const pipeline = {};
    Object.values(EstagioOportunidade).forEach(estagio => {
      pipeline[estagio] = {
        id: estagio,
        title: this.getEstagioLabel(estagio),
        color: this.getEstagioColor(estagio),
        opportunities: oportunidades.filter(opp => opp.estagio === estagio)
      };
    });

    return {
      stages: pipeline,
      stageOrder: Object.values(EstagioOportunidade)
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
      [EstagioOportunidade.PERDIDO]: 'Perdido'
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
      [EstagioOportunidade.PERDIDO]: '#EF4444'
    };
    return colors[estagio];
  }
}
