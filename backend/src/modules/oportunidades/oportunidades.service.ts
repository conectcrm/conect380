import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oportunidade, EstagioOportunidade } from './oportunidade.entity';
import { Atividade, TipoAtividade } from './atividade.entity';
import { OportunidadeStageEvent } from './oportunidade-stage-event.entity';
import { DashboardV2JobsService } from '../dashboard-v2/dashboard-v2.jobs.service';
import {
  CreateOportunidadeDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';

@Injectable()
export class OportunidadesService {
  private readonly logger = new Logger(OportunidadesService.name);
  private tableColumnsCache = new Map<string, Set<string>>();
  private stageEventsTableAvailable?: boolean;

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
    @InjectRepository(OportunidadeStageEvent)
    private stageEventRepository: Repository<OportunidadeStageEvent>,
    @Optional()
    private readonly dashboardV2JobsService?: DashboardV2JobsService,
  ) {}

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private parseSimpleArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }

    const rows = await this.oportunidadeRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
      `,
      [tableName],
    );

    const columns = new Set<string>(
      rows
        .map((row: { column_name?: string }) => row.column_name)
        .filter((columnName: string | undefined): columnName is string => !!columnName),
    );

    this.tableColumnsCache.set(tableName, columns);
    return columns;
  }

  private async resolveOportunidadesSchema() {
    const columns = await this.getTableColumns('oportunidades');

    const responsavelColumn = columns.has('usuario_id') ? 'usuario_id' : 'responsavel_id';
    const dataFechamentoEsperadoColumn = columns.has('data_fechamento_prevista')
      ? 'data_fechamento_prevista'
      : columns.has('dataFechamentoEsperado')
        ? 'dataFechamentoEsperado'
        : null;
    const dataFechamentoRealColumn = columns.has('data_fechamento_real')
      ? 'data_fechamento_real'
      : columns.has('dataFechamentoReal')
        ? 'dataFechamentoReal'
        : null;
    const createdAtColumn = columns.has('createdAt') ? 'createdAt' : 'criado_em';
    const updatedAtColumn = columns.has('updatedAt') ? 'updatedAt' : 'atualizado_em';
    const estagioMode: 'legacy' | 'modern' =
      responsavelColumn === 'responsavel_id' ? 'modern' : 'legacy';

    return {
      columns,
      responsavelColumn,
      dataFechamentoEsperadoColumn,
      dataFechamentoRealColumn,
      createdAtColumn,
      updatedAtColumn,
      estagioMode,
    };
  }

  private async resolveAtividadesSchema() {
    const columns = await this.getTableColumns('atividades');

    return {
      columns,
      userColumn: columns.has('usuario_id') ? 'usuario_id' : 'criado_por_id',
      dateColumn: columns.has('data') ? 'data' : 'dataAtividade',
      createdAtColumn: columns.has('criado_em') ? 'criado_em' : 'createdAt',
      titleColumn: columns.has('titulo') ? 'titulo' : null,
    };
  }

  private toDatabaseEstagio(
    estagio?: EstagioOportunidade | string,
    mode: 'legacy' | 'modern' = 'legacy',
  ): EstagioOportunidade {
    const normalized = (estagio || '').toString().toLowerCase();
    if (mode === 'modern') {
      switch (normalized) {
        case 'lead':
        case 'leads':
          return EstagioOportunidade.LEADS;
        case 'qualificado':
        case 'qualificacao':
        case 'qualification':
          return EstagioOportunidade.QUALIFICACAO;
        case 'proposta':
        case 'proposal':
          return EstagioOportunidade.PROPOSTA;
        case 'negociacao':
        case 'negotiation':
          return EstagioOportunidade.NEGOCIACAO;
        case 'closing':
        case 'fechamento':
          return EstagioOportunidade.FECHAMENTO;
        case 'ganho':
        case 'won':
          return EstagioOportunidade.GANHO;
        case 'perdido':
        case 'lost':
          return EstagioOportunidade.PERDIDO;
        default:
          return EstagioOportunidade.LEADS;
      }
    }

    switch (normalized) {
      case 'lead':
      case 'leads':
        return 'lead' as unknown as EstagioOportunidade;
      case 'qualificado':
      case 'qualificacao':
      case 'qualification':
        return 'qualificado' as unknown as EstagioOportunidade;
      case 'proposta':
      case 'proposal':
        return 'proposta' as unknown as EstagioOportunidade;
      case 'negociacao':
      case 'negotiation':
      case 'closing':
      case 'fechamento':
        return 'negociacao' as unknown as EstagioOportunidade;
      case 'ganho':
      case 'won':
        return 'ganho' as unknown as EstagioOportunidade;
      case 'perdido':
      case 'lost':
        return 'perdido' as unknown as EstagioOportunidade;
      default:
        return 'lead' as unknown as EstagioOportunidade;
    }
  }

  private fromDatabaseEstagio(estagio?: string | EstagioOportunidade): EstagioOportunidade {
    const normalized = (estagio || '').toString().toLowerCase();
    switch (normalized) {
      case EstagioOportunidade.LEADS:
      case 'lead':
        return EstagioOportunidade.LEADS;
      case EstagioOportunidade.QUALIFICACAO:
      case 'qualificado':
      case 'qualificacao':
        return EstagioOportunidade.QUALIFICACAO;
      case EstagioOportunidade.PROPOSTA:
      case 'proposta':
        return EstagioOportunidade.PROPOSTA;
      case EstagioOportunidade.NEGOCIACAO:
      case 'negociacao':
        return EstagioOportunidade.NEGOCIACAO;
      case EstagioOportunidade.FECHAMENTO:
      case 'closing':
      case 'fechamento':
        return EstagioOportunidade.FECHAMENTO;
      case EstagioOportunidade.GANHO:
      case 'ganho':
        return EstagioOportunidade.GANHO;
      case EstagioOportunidade.PERDIDO:
      case 'perdido':
        return EstagioOportunidade.PERDIDO;
      default:
        return EstagioOportunidade.LEADS;
    }
  }

  private normalizeOportunidade(oportunidade: Oportunidade): Oportunidade {
    oportunidade.estagio = this.fromDatabaseEstagio(oportunidade.estagio);
    return oportunidade;
  }

  private getEstagioFilterValues(estagio: EstagioOportunidade): string[] {
    switch (estagio) {
      case EstagioOportunidade.LEADS:
        return ['lead', 'leads'];
      case EstagioOportunidade.QUALIFICACAO:
        return ['qualificado', 'qualificacao', 'qualification'];
      case EstagioOportunidade.PROPOSTA:
        return ['proposta', 'proposal'];
      case EstagioOportunidade.NEGOCIACAO:
      case EstagioOportunidade.FECHAMENTO:
        return ['negociacao', 'negotiation', 'closing', 'fechamento'];
      case EstagioOportunidade.GANHO:
        return ['ganho', 'won'];
      case EstagioOportunidade.PERDIDO:
        return ['perdido', 'lost'];
      default:
        return ['lead', 'leads'];
    }
  }

  private normalizeStageForEvent(stage?: EstagioOportunidade | string | null): string | null {
    const normalized = (stage || '').toString().trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'lead':
      case 'leads':
        return EstagioOportunidade.LEADS;
      case 'qualificado':
      case 'qualificacao':
      case 'qualification':
        return EstagioOportunidade.QUALIFICACAO;
      case 'proposta':
      case 'proposal':
        return EstagioOportunidade.PROPOSTA;
      case 'negociacao':
      case 'negotiation':
        return EstagioOportunidade.NEGOCIACAO;
      case 'fechamento':
      case 'closing':
        return EstagioOportunidade.FECHAMENTO;
      case 'ganho':
      case 'won':
        return EstagioOportunidade.GANHO;
      case 'perdido':
      case 'lost':
        return EstagioOportunidade.PERDIDO;
      default:
        return normalized;
    }
  }

  private async isStageEventsTableAvailable(): Promise<boolean> {
    if (this.stageEventsTableAvailable !== undefined) {
      return this.stageEventsTableAvailable;
    }

    const columns = await this.getTableColumns('oportunidade_stage_events');
    this.stageEventsTableAvailable =
      columns.has('empresa_id') &&
      columns.has('oportunidade_id') &&
      columns.has('to_stage') &&
      columns.has('changed_at') &&
      columns.has('source');

    if (!this.stageEventsTableAvailable) {
      this.logger.warn(
        'Tabela "oportunidade_stage_events" indisponivel. Dual-write de estagio permanece em modo degradado.',
      );
    }

    return this.stageEventsTableAvailable;
  }

  private async createStageEvent(params: {
    empresaId: string;
    oportunidadeId: string | number;
    fromStage?: EstagioOportunidade | string | null;
    toStage?: EstagioOportunidade | string | null;
    changedBy?: string | null;
    changedAt?: Date;
    source: string;
  }): Promise<void> {
    if (!(await this.isStageEventsTableAvailable())) {
      return;
    }

    const oportunidadeId = params.oportunidadeId?.toString().trim();
    if (!oportunidadeId) {
      this.logger.warn(
        `Nao foi possivel registrar stage event: oportunidade_id invalido (${params.oportunidadeId}).`,
      );
      return;
    }

    const toStage = this.normalizeStageForEvent(params.toStage);
    if (!toStage) {
      return;
    }

    const fromStage = this.normalizeStageForEvent(params.fromStage);
    const changedBy =
      params.changedBy && /^[0-9a-fA-F-]{36}$/.test(params.changedBy) ? params.changedBy : null;

    try {
      await this.stageEventRepository.query(
        `
          INSERT INTO "oportunidade_stage_events" (
            "empresa_id",
            "oportunidade_id",
            "from_stage",
            "to_stage",
            "changed_at",
            "changed_by",
            "source"
          ) VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()), $6, $7)
        `,
        [
          params.empresaId,
          oportunidadeId,
          fromStage,
          toStage,
          params.changedAt ? params.changedAt.toISOString() : null,
          changedBy,
          params.source,
        ],
      );

      await this.dashboardV2JobsService?.enqueueStageEventRecompute({
        empresaId: params.empresaId,
        oportunidadeId,
        changedAt: (params.changedAt || new Date()).toISOString(),
        trigger: params.source,
      });
    } catch (error: any) {
      this.logger.error(
        `Falha ao registrar stage event da oportunidade ${oportunidadeId}: ${error?.message || error}`,
      );
    }
  }

  async create(
    createOportunidadeDto: CreateOportunidadeDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const columns: string[] = [
      'titulo',
      'descricao',
      'valor',
      'probabilidade',
      'estagio',
      'empresa_id',
      schema.responsavelColumn,
      'cliente_id',
    ];
    const values: unknown[] = [
      createOportunidadeDto.titulo,
      createOportunidadeDto.descricao ?? null,
      createOportunidadeDto.valor,
      createOportunidadeDto.probabilidade,
      this.toDatabaseEstagio(createOportunidadeDto.estagio, schema.estagioMode),
      empresaId,
      createOportunidadeDto.responsavel_id,
      createOportunidadeDto.cliente_id ?? null,
    ];

    if (schema.dataFechamentoEsperadoColumn) {
      columns.push(schema.dataFechamentoEsperadoColumn);
      values.push(
        createOportunidadeDto.dataFechamentoEsperado
          ? new Date(createOportunidadeDto.dataFechamentoEsperado)
          : null,
      );
    }

    if (schema.columns.has('prioridade') && createOportunidadeDto.prioridade !== undefined) {
      columns.push('prioridade');
      values.push(createOportunidadeDto.prioridade);
    }

    if (schema.columns.has('origem') && createOportunidadeDto.origem !== undefined) {
      columns.push('origem');
      values.push(createOportunidadeDto.origem);
    }

    if (schema.columns.has('tags') && createOportunidadeDto.tags !== undefined) {
      columns.push('tags');
      values.push(
        createOportunidadeDto.tags.length > 0 ? createOportunidadeDto.tags.join(',') : null,
      );
    }

    if (schema.columns.has('nomeContato')) {
      columns.push('nomeContato');
      values.push(createOportunidadeDto.nomeContato ?? null);
    }
    if (schema.columns.has('emailContato')) {
      columns.push('emailContato');
      values.push(createOportunidadeDto.emailContato ?? null);
    }
    if (schema.columns.has('telefoneContato')) {
      columns.push('telefoneContato');
      values.push(createOportunidadeDto.telefoneContato ?? null);
    }
    if (schema.columns.has('empresaContato')) {
      columns.push('empresaContato');
      values.push(createOportunidadeDto.empresaContato ?? null);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await this.oportunidadeRepository.query(
      `
        INSERT INTO "oportunidades" (${columns.map((column) => this.quoteIdentifier(column)).join(', ')})
        VALUES (${placeholders})
        RETURNING "id"
      `,
      values,
    );
    const savedOportunidadeId = rows?.[0]?.id;

    this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: 'Oportunidade criada',
        oportunidade_id: savedOportunidadeId,
      },
      {
        userId: createOportunidadeDto.responsavel_id,
        empresaId,
      },
    ).catch(() => undefined);

    this.createStageEvent({
      empresaId,
      oportunidadeId: savedOportunidadeId,
      fromStage: null,
      toStage: createOportunidadeDto.estagio,
      changedBy: createOportunidadeDto.responsavel_id,
      source: 'create',
    }).catch(() => undefined);

    return this.findOne(savedOportunidadeId, empresaId);
  }

  async findAll(
    empresaId: string,
    filters?: {
      id?: string;
      estagio?: EstagioOportunidade;
      responsavel_id?: string;
      cliente_id?: string;
      dataInicio?: string;
      dataFim?: string;
    },
  ): Promise<Oportunidade[]> {
    const schema = await this.resolveOportunidadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const responsavelRef = `oportunidade.${this.quoteIdentifier(schema.responsavelColumn)}`;
    const createdAtRef = `oportunidade.${this.quoteIdentifier(schema.createdAtColumn)}`;
    const updatedAtRef = `oportunidade.${this.quoteIdentifier(schema.updatedAtColumn)}`;
    const responsavelAvatarExpr = usersColumns.has('avatar_url')
      ? 'responsavel.avatar_url'
      : 'NULL';
    const dataFechamentoEsperadoExpr = schema.dataFechamentoEsperadoColumn
      ? `oportunidade.${this.quoteIdentifier(schema.dataFechamentoEsperadoColumn)}`
      : 'NULL';
    const dataFechamentoRealExpr = schema.dataFechamentoRealColumn
      ? `oportunidade.${this.quoteIdentifier(schema.dataFechamentoRealColumn)}`
      : 'NULL';
    const prioridadeExpr = schema.columns.has('prioridade')
      ? `oportunidade.${this.quoteIdentifier('prioridade')}`
      : `'medium'`;
    const origemExpr = schema.columns.has('origem')
      ? `oportunidade.${this.quoteIdentifier('origem')}`
      : `'website'`;
    const tagsExpr = schema.columns.has('tags')
      ? `oportunidade.${this.quoteIdentifier('tags')}`
      : 'NULL';
    const nomeContatoExpr = schema.columns.has('nomeContato')
      ? `oportunidade.${this.quoteIdentifier('nomeContato')}`
      : 'NULL';
    const emailContatoExpr = schema.columns.has('emailContato')
      ? `oportunidade.${this.quoteIdentifier('emailContato')}`
      : 'NULL';
    const telefoneContatoExpr = schema.columns.has('telefoneContato')
      ? `oportunidade.${this.quoteIdentifier('telefoneContato')}`
      : 'NULL';
    const empresaContatoExpr = schema.columns.has('empresaContato')
      ? `oportunidade.${this.quoteIdentifier('empresaContato')}`
      : 'NULL';

    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoin('users', 'responsavel', `responsavel.id = ${responsavelRef}`)
      .leftJoin('clientes', 'cliente', 'cliente.id = oportunidade.cliente_id')
      .select('oportunidade.id', 'id')
      .addSelect('oportunidade.empresa_id', 'empresa_id')
      .addSelect('oportunidade.titulo', 'titulo')
      .addSelect('oportunidade.descricao', 'descricao')
      .addSelect('oportunidade.valor', 'valor')
      .addSelect('COALESCE(oportunidade.probabilidade, 0)', 'probabilidade')
      .addSelect('oportunidade.estagio', 'estagio')
      .addSelect(prioridadeExpr, 'prioridade')
      .addSelect(origemExpr, 'origem')
      .addSelect(tagsExpr, 'tags')
      .addSelect(dataFechamentoEsperadoExpr, 'dataFechamentoEsperado')
      .addSelect(dataFechamentoRealExpr, 'dataFechamentoReal')
      .addSelect(responsavelRef, 'responsavel_id')
      .addSelect('oportunidade.cliente_id', 'cliente_id')
      .addSelect(createdAtRef, 'createdAt')
      .addSelect(updatedAtRef, 'updatedAt')
      .addSelect(nomeContatoExpr, 'nomeContato')
      .addSelect(emailContatoExpr, 'emailContato')
      .addSelect(telefoneContatoExpr, 'telefoneContato')
      .addSelect(empresaContatoExpr, 'empresaContato')
      .addSelect('responsavel.id', 'responsavel__id')
      .addSelect('responsavel.nome', 'responsavel__nome')
      .addSelect('responsavel.email', 'responsavel__email')
      .addSelect(responsavelAvatarExpr, 'responsavel__avatar_url')
      .addSelect('cliente.id', 'cliente__id')
      .addSelect('cliente.nome', 'cliente__nome')
      .addSelect('cliente.email', 'cliente__email')
      .addSelect('cliente.telefone', 'cliente__telefone')
      .where('oportunidade.empresa_id = :empresaId', { empresaId })
      .orderBy(updatedAtRef, 'DESC');

    if (filters?.estagio) {
      queryBuilder.andWhere('oportunidade.estagio::text IN (:...estagios)', {
        estagios: this.getEstagioFilterValues(filters.estagio),
      });
    }

    if (filters?.id) {
      queryBuilder.andWhere('oportunidade.id::text = :id', { id: filters.id });
    }

    if (filters?.responsavel_id) {
      queryBuilder.andWhere(`${responsavelRef}::text = :responsavel_id`, {
        responsavel_id: filters.responsavel_id,
      });
    }

    if (filters?.cliente_id) {
      queryBuilder.andWhere('oportunidade.cliente_id = :cliente_id', {
        cliente_id: filters.cliente_id,
      });
    }

    if (filters?.dataInicio && filters?.dataFim) {
      queryBuilder.andWhere(`${createdAtRef} BETWEEN :dataInicio AND :dataFim`, {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
      });
    }

    const oportunidades = await queryBuilder.getRawMany();

    return oportunidades.map((item) => ({
      id: item.id,
      empresa_id: item.empresa_id,
      titulo: item.titulo,
      descricao: item.descricao,
      valor: Number(item.valor || 0),
      probabilidade: Number(item.probabilidade || 0),
      estagio: this.fromDatabaseEstagio(item.estagio),
      prioridade: item.prioridade || 'medium',
      origem: item.origem || 'website',
      tags: this.parseSimpleArray(item.tags),
      dataFechamentoEsperado: item.dataFechamentoEsperado ?? null,
      dataFechamentoReal: item.dataFechamentoReal ?? null,
      responsavel_id: item.responsavel_id?.toString?.() ?? item.responsavel_id,
      cliente_id: item.cliente_id,
      responsavel: item.responsavel__id
        ? {
            id: item.responsavel__id,
            nome: item.responsavel__nome,
            email: item.responsavel__email,
            avatar_url: item.responsavel__avatar_url,
          }
        : undefined,
      cliente: item.cliente__id
        ? {
            id: item.cliente__id,
            nome: item.cliente__nome,
            email: item.cliente__email,
            telefone: item.cliente__telefone,
          }
        : undefined,
      nomeContato: item.nomeContato ?? undefined,
      emailContato: item.emailContato ?? undefined,
      telefoneContato: item.telefoneContato ?? undefined,
      empresaContato: item.empresaContato ?? undefined,
      atividades: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) as Oportunidade[];
  }

  async findOne(id: string, empresaId?: string): Promise<Oportunidade> {
    if (!empresaId) {
      throw new NotFoundException('Oportunidade nao encontrada');
    }

    const [oportunidade] = await this.findAll(empresaId, { id });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada');
    }

    return oportunidade;
  }

  async update(
    id: string,
    updateOportunidadeDto: UpdateOportunidadeDto,
    empresaId: string,
    actorUserId?: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const oportunidade = await this.findOne(id, empresaId);
    const estagioAnterior = oportunidade.estagio;

    const updateData: Record<string, unknown> = {};

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
      updateData.estagio = this.toDatabaseEstagio(
        updateOportunidadeDto.estagio,
        schema.estagioMode,
      );
    }

    if (updateOportunidadeDto.responsavel_id !== undefined) {
      updateData[schema.responsavelColumn] = updateOportunidadeDto.responsavel_id;
    }

    if (updateOportunidadeDto.cliente_id !== undefined) {
      updateData.cliente_id = updateOportunidadeDto.cliente_id ?? null;
    }

    if (
      schema.dataFechamentoEsperadoColumn &&
      updateOportunidadeDto.dataFechamentoEsperado !== undefined
    ) {
      updateData[schema.dataFechamentoEsperadoColumn] = updateOportunidadeDto.dataFechamentoEsperado
        ? new Date(updateOportunidadeDto.dataFechamentoEsperado)
        : null;
    }

    if (schema.columns.has('prioridade') && updateOportunidadeDto.prioridade !== undefined) {
      updateData.prioridade = updateOportunidadeDto.prioridade;
    }
    if (schema.columns.has('origem') && updateOportunidadeDto.origem !== undefined) {
      updateData.origem = updateOportunidadeDto.origem;
    }
    if (schema.columns.has('tags') && updateOportunidadeDto.tags !== undefined) {
      updateData.tags =
        updateOportunidadeDto.tags.length > 0 ? updateOportunidadeDto.tags.join(',') : null;
    }
    if (schema.columns.has('nomeContato') && updateOportunidadeDto.nomeContato !== undefined) {
      updateData.nomeContato = updateOportunidadeDto.nomeContato;
    }
    if (schema.columns.has('emailContato') && updateOportunidadeDto.emailContato !== undefined) {
      updateData.emailContato = updateOportunidadeDto.emailContato;
    }
    if (
      schema.columns.has('telefoneContato') &&
      updateOportunidadeDto.telefoneContato !== undefined
    ) {
      updateData.telefoneContato = updateOportunidadeDto.telefoneContato;
    }
    if (
      schema.columns.has('empresaContato') &&
      updateOportunidadeDto.empresaContato !== undefined
    ) {
      updateData.empresaContato = updateOportunidadeDto.empresaContato;
    }

    if (Object.keys(updateData).length > 0) {
      const entries = Object.entries(updateData);
      const setClause = entries
        .map(([column], index) => `${this.quoteIdentifier(column)} = $${index + 1}`)
        .join(', ');
      const values = entries.map(([, value]) => value);

      await this.oportunidadeRepository.query(
        `
          UPDATE "oportunidades"
          SET ${setClause}
          WHERE "id"::text = $${values.length + 1}
            AND "empresa_id" = $${values.length + 2}
        `,
        [...values, id, empresaId],
      );
    }

    if (updateOportunidadeDto.estagio && updateOportunidadeDto.estagio !== estagioAnterior) {
      await this.createStageEvent({
        empresaId,
        oportunidadeId: oportunidade.id,
        fromStage: estagioAnterior,
        toStage: updateOportunidadeDto.estagio,
        changedBy: actorUserId ?? oportunidade.responsavel_id,
        source: 'update',
      });

      await this.createAtividade(
        {
          tipo: TipoAtividade.NOTA,
          descricao: `Estagio alterado de "${estagioAnterior}" para "${updateOportunidadeDto.estagio}"`,
          oportunidade_id: id,
        },
        {
          userId: actorUserId ?? oportunidade.responsavel_id,
          empresaId,
        },
      );
    }

    return this.findOne(id, empresaId);
  }

  async updateEstagio(
    id: string,
    updateEstagioDto: UpdateEstagioDto,
    empresaId: string,
    actorUserId?: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const oportunidade = await this.findOne(id, empresaId);

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set({
        estagio: this.toDatabaseEstagio(updateEstagioDto.estagio, schema.estagioMode),
      })
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();

    await this.createStageEvent({
      empresaId,
      oportunidadeId: oportunidade.id,
      fromStage: oportunidade.estagio,
      toStage: updateEstagioDto.estagio,
      changedBy: actorUserId ?? oportunidade.responsavel_id,
      source: 'update_estagio',
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
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    return this.findOne(id, empresaId);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    await this.oportunidadeRepository
      .createQueryBuilder()
      .delete()
      .from('oportunidades')
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();
  }

  async createAtividade(
    createAtividadeDto: CreateAtividadeDto,
    context: { userId?: string; empresaId: string },
  ): Promise<Atividade> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const oportunidadeId = createAtividadeDto.oportunidade_id?.toString();
    if (!oportunidadeId) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const oportunidade = await this.findOne(oportunidadeId, context.empresaId);

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const columns: string[] = [
      'tipo',
      'descricao',
      'oportunidade_id',
      'empresa_id',
      atividadeSchema.userColumn,
      atividadeSchema.dateColumn,
    ];
    const values: unknown[] = [
      createAtividadeDto.tipo,
      createAtividadeDto.descricao,
      oportunidade.id,
      context.empresaId,
      context.userId ?? (oportunidade as any).responsavel_id,
      createAtividadeDto.dataAtividade ? new Date(createAtividadeDto.dataAtividade) : new Date(),
    ];

    if (atividadeSchema.titleColumn) {
      columns.splice(1, 0, atividadeSchema.titleColumn);
      values.splice(1, 0, createAtividadeDto.titulo ?? 'Atividade');
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const insertResult = await this.atividadeRepository.query(
      `
        INSERT INTO "atividades" (${columns.map((column) => this.quoteIdentifier(column)).join(', ')})
        VALUES (${placeholders})
        RETURNING
          "id",
          "empresa_id",
          "tipo",
          "descricao",
          "oportunidade_id",
          ${this.quoteIdentifier(atividadeSchema.userColumn)} AS "criado_por_id",
          ${this.quoteIdentifier(atividadeSchema.dateColumn)} AS "dataAtividade",
          ${this.quoteIdentifier(atividadeSchema.createdAtColumn)} AS "createdAt"
      `,
      values,
    );

    const atividade = insertResult?.[0];
    return {
      id: atividade.id,
      empresa_id: atividade.empresa_id,
      tipo: atividade.tipo,
      descricao: atividade.descricao,
      oportunidade_id: atividade.oportunidade_id,
      criado_por_id: atividade.criado_por_id,
      dataAtividade: atividade.dataAtividade,
      createdAt: atividade.createdAt,
      criadoPor: undefined,
    } as Atividade;
  }

  async listarAtividades(oportunidadeId: string, empresaId: string): Promise<Atividade[]> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const oportunidade = await this.findOne(oportunidadeId, empresaId);

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const userRef = `atividade.${this.quoteIdentifier(atividadeSchema.userColumn)}`;
    const dateRef = `atividade.${this.quoteIdentifier(atividadeSchema.dateColumn)}`;
    const createdRef = `atividade.${this.quoteIdentifier(atividadeSchema.createdAtColumn)}`;
    const usuarioAvatarExpr = usersColumns.has('avatar_url') ? 'usuario.avatar_url' : 'NULL';

    const rows = await this.atividadeRepository
      .createQueryBuilder('atividade')
      .leftJoin('users', 'usuario', `usuario.id = ${userRef}`)
      .select('atividade.id', 'id')
      .addSelect('atividade.empresa_id', 'empresa_id')
      .addSelect('atividade.tipo', 'tipo')
      .addSelect('atividade.descricao', 'descricao')
      .addSelect('atividade.oportunidade_id', 'oportunidade_id')
      .addSelect(userRef, 'criado_por_id')
      .addSelect(dateRef, 'dataAtividade')
      .addSelect(createdRef, 'createdAt')
      .addSelect('usuario.id', 'usuario__id')
      .addSelect('usuario.nome', 'usuario__nome')
      .addSelect(usuarioAvatarExpr, 'usuario__avatar_url')
      .where('atividade.oportunidade_id::text = :oportunidadeId', { oportunidadeId })
      .andWhere('atividade.empresa_id = :empresaId', { empresaId })
      .orderBy(dateRef, 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      empresa_id: row.empresa_id,
      tipo: row.tipo,
      descricao: row.descricao,
      oportunidade_id: row.oportunidade_id,
      criado_por_id: row.criado_por_id,
      dataAtividade: row.dataAtividade,
      createdAt: row.createdAt,
      criadoPor: row.usuario__id
        ? {
            id: row.usuario__id,
            nome: row.usuario__nome,
            avatar_url: row.usuario__avatar_url,
          }
        : undefined,
    })) as Atividade[];
  }

  async getMetricas(empresaId: string, filtros?: { dataInicio?: string; dataFim?: string }) {
    let queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .select('oportunidade.estagio', 'estagio')
      .addSelect('oportunidade.valor', 'valor')
      .where('oportunidade.empresa_id = :empresaId', { empresaId });

    if (filtros?.dataInicio && filtros?.dataFim) {
      queryBuilder = queryBuilder.andWhere(
        'oportunidade.createdAt BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
      );
    }

    const todasOportunidades = (await queryBuilder.getRawMany()).map((opp) => ({
      estagio: this.fromDatabaseEstagio(opp.estagio),
      valor: Number(opp.valor || 0),
    }));

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
