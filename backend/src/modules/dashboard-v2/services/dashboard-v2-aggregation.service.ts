import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Oportunidade } from '../../oportunidades/oportunidade.entity';
import { OportunidadeStageEvent } from '../../oportunidades/oportunidade-stage-event.entity';
import { Proposta } from '../../propostas/proposta.entity';
import { DashboardV2QueryDto } from '../dto/dashboard-v2-query.dto';
import { DashboardAgingStageDaily } from '../entities/dashboard-aging-stage-daily.entity';
import { DashboardFunnelMetricsDaily } from '../entities/dashboard-funnel-metrics-daily.entity';
import { DashboardPipelineSnapshotDaily } from '../entities/dashboard-pipeline-snapshot-daily.entity';
import { DashboardRevenueMetricsDaily } from '../entities/dashboard-revenue-metrics-daily.entity';

type DateRange = {
  start: Date;
  end: Date;
};

type DashboardV2SourceFilters = Pick<DashboardV2QueryDto, 'vendedorId' | 'pipelineId'>;

type DashboardV2TrendPoint = {
  date: string;
  receitaFechada: number;
  receitaPrevista: number;
  ticketMedio: number;
  cicloMedioDias: number;
  oportunidadesAtivas: number;
  conversao: number;
};

@Injectable()
export class DashboardV2AggregationService {
  private readonly logger = new Logger(DashboardV2AggregationService.name);
  private readonly approvedStatus = ['aprovada', 'aceita'];
  private readonly finalStatus = ['aprovada', 'aceita', 'rejeitada', 'expirada'];
  private oportunidadeResponsavelColumnSql: string | null = null;
  private oportunidadeResponsavelColumnSqlPromise: Promise<string> | null = null;

  constructor(
    @InjectRepository(Oportunidade)
    private readonly oportunidadeRepository: Repository<Oportunidade>,
    @InjectRepository(OportunidadeStageEvent)
    private readonly stageEventRepository: Repository<OportunidadeStageEvent>,
    @InjectRepository(Proposta)
    private readonly propostaRepository: Repository<Proposta>,
    @InjectRepository(DashboardPipelineSnapshotDaily)
    private readonly pipelineSnapshotRepository: Repository<DashboardPipelineSnapshotDaily>,
    @InjectRepository(DashboardFunnelMetricsDaily)
    private readonly funnelMetricsRepository: Repository<DashboardFunnelMetricsDaily>,
    @InjectRepository(DashboardAgingStageDaily)
    private readonly agingStageRepository: Repository<DashboardAgingStageDaily>,
    @InjectRepository(DashboardRevenueMetricsDaily)
    private readonly revenueMetricsRepository: Repository<DashboardRevenueMetricsDaily>,
  ) {}

  resolveDateRange(input?: { periodStart?: string; periodEnd?: string }): DateRange {
    const now = new Date();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - 29);
    defaultStart.setHours(0, 0, 0, 0);

    const parsedStart = this.parseDateInput(input?.periodStart);
    const parsedEnd = this.parseDateInput(input?.periodEnd);
    const start = parsedStart ? new Date(parsedStart) : defaultStart;
    const end = parsedEnd ? new Date(parsedEnd) : defaultEnd;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: defaultStart, end: defaultEnd };
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return start <= end ? { start, end } : { start: end, end: start };
  }

  private parseDateInput(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const localDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (localDateMatch) {
      const year = Number(localDateMatch[1]);
      const month = Number(localDateMatch[2]);
      const day = Number(localDateMatch[3]);
      const parsed = new Date(year, month - 1, day);

      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  periodKey(range: DateRange): string {
    return `${this.toDateKey(range.start)}_${this.toDateKey(range.end)}`;
  }

  async ensureMetricsForRange(empresaId: string, range: DateRange): Promise<void> {
    const count = await this.revenueMetricsRepository
      .createQueryBuilder('r')
      .where('r.empresa_id = :empresaId', { empresaId })
      .andWhere('r.date_key BETWEEN :start AND :end', {
        start: this.toDateKey(range.start),
        end: this.toDateKey(range.end),
      })
      .getCount();

    const expectedDays = Math.max(
      1,
      Math.ceil((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1,
    );

    if (count >= expectedDays) {
      return;
    }

    await this.recomputeRangeMetrics(empresaId, range.start, range.end);
  }

  async recomputeRangeMetrics(empresaId: string, start: Date, end: Date): Promise<void> {
    const safeStart = new Date(start);
    safeStart.setHours(0, 0, 0, 0);
    const safeEnd = new Date(end);
    safeEnd.setHours(23, 59, 59, 999);

    const days = Math.max(1, Math.ceil((safeEnd.getTime() - safeStart.getTime()) / 86_400_000) + 1);
    const limitDays = Number(process.env.DASHBOARD_V2_RECOMPUTE_LIMIT_DAYS || 120);
    const effectiveDays = Math.min(days, limitDays);
    const initialDate = new Date(safeEnd);
    initialDate.setDate(initialDate.getDate() - effectiveDays + 1);
    initialDate.setHours(0, 0, 0, 0);

    const cursor = new Date(initialDate);
    while (cursor <= safeEnd) {
      await this.recomputeDailyMetrics(empresaId, new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  async recomputeDailyMetrics(empresaId: string, day: Date): Promise<void> {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dateKey = this.toDateKey(dayStart);

    await Promise.all([
      this.recomputePipelineSnapshot(empresaId, dateKey, dayEnd),
      this.recomputeFunnelMetrics(empresaId, dateKey, dayStart, dayEnd),
      this.recomputeAgingStage(empresaId, dateKey, dayEnd),
      this.recomputeRevenueMetrics(empresaId, dateKey, dayStart, dayEnd),
    ]);
  }

  async getOverview(empresaId: string, range: DateRange, filters: DashboardV2SourceFilters = {}) {
    if (this.useSourceFilters(filters)) {
      const trendPoints = await this.getTrendPointsFromSource(empresaId, range, filters);
      return this.toOverview(trendPoints);
    }

    const rows = await this.revenueMetricsRepository.find({
      where: {
        empresa_id: empresaId,
        date_key: Between(this.toDateKey(range.start), this.toDateKey(range.end)),
      },
      order: { date_key: 'ASC' },
    });

    return this.toOverview(
      rows.map((row) => ({
        date: row.date_key,
        receitaFechada: Number(row.receita_fechada || 0),
        receitaPrevista: Number(row.receita_prevista || 0),
        ticketMedio: Number(row.ticket_medio || 0),
        cicloMedioDias: Number(row.ciclo_medio_dias || 0),
        oportunidadesAtivas: Number(row.oportunidades_ativas || 0),
        conversao: 0,
      })),
    );
  }

  async getTrends(empresaId: string, range: DateRange, filters: DashboardV2SourceFilters = {}) {
    if (this.useSourceFilters(filters)) {
      return this.getTrendPointsFromSource(empresaId, range, filters);
    }

    const [revenueRows, funnelRows] = await Promise.all([
      this.revenueMetricsRepository.find({
        where: {
          empresa_id: empresaId,
          date_key: Between(this.toDateKey(range.start), this.toDateKey(range.end)),
        },
        order: { date_key: 'ASC' },
      }),
      this.funnelMetricsRepository.find({
        where: {
          empresa_id: empresaId,
          date_key: Between(this.toDateKey(range.start), this.toDateKey(range.end)),
        },
      }),
    ]);

    const conversionByDate = new Map<string, { progressed: number; entered: number }>();
    for (const row of funnelRows) {
      const key = row.date_key;
      const current = conversionByDate.get(key) || { progressed: 0, entered: 0 };
      current.progressed += Number(row.progressed_count || 0);
      current.entered += Number(row.entered_count || 0);
      conversionByDate.set(key, current);
    }

    return revenueRows.map((row) => {
      const conversion = conversionByDate.get(row.date_key) || { progressed: 0, entered: 0 };
      const conversao =
        conversion.entered > 0 ? (conversion.progressed / conversion.entered) * 100 : 0;

      return {
        date: row.date_key,
        receitaFechada: Number(row.receita_fechada || 0),
        receitaPrevista: Number(row.receita_prevista || 0),
        ticketMedio: Number(row.ticket_medio || 0),
        conversao: Number(conversao.toFixed(2)),
      };
    });
  }

  async getFunnel(empresaId: string, range: DateRange, filters: DashboardV2SourceFilters = {}) {
    if (this.useSourceFilters(filters)) {
      return this.getFunnelFromSource(empresaId, range, filters);
    }

    const rows = await this.funnelMetricsRepository
      .createQueryBuilder('f')
      .select('f.from_stage', 'fromStage')
      .addSelect('f.to_stage', 'toStage')
      .addSelect('SUM(f.entered_count)::int', 'entered')
      .addSelect('SUM(f.progressed_count)::int', 'progressed')
      .where('f.empresa_id = :empresaId', { empresaId })
      .andWhere('f.date_key BETWEEN :start AND :end', {
        start: this.toDateKey(range.start),
        end: this.toDateKey(range.end),
      })
      .groupBy('f.from_stage')
      .addGroupBy('f.to_stage')
      .orderBy('f.from_stage', 'ASC')
      .addOrderBy('f.to_stage', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      const entered = Number(row.entered || 0);
      const progressed = Number(row.progressed || 0);
      return {
        fromStage: row.fromStage,
        toStage: row.toStage,
        entered,
        progressed,
        conversionRate: entered > 0 ? Number(((progressed / entered) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getPipelineSummary(
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters = {},
  ) {
    if (this.useSourceFilters(filters)) {
      return this.getPipelineSummaryFromSource(empresaId, range, filters);
    }

    const lastDate = await this.pipelineSnapshotRepository
      .createQueryBuilder('p')
      .select('MAX(p.date_key)', 'maxDate')
      .where('p.empresa_id = :empresaId', { empresaId })
      .andWhere('p.date_key <= :end', { end: this.toDateKey(range.end) })
      .getRawOne<{ maxDate?: string }>();

    const dateKey = lastDate?.maxDate;
    if (!dateKey) {
      return { totalValor: 0, stages: [] };
    }

    const [pipelineRows, agingRows] = await Promise.all([
      this.pipelineSnapshotRepository.find({
        where: { empresa_id: empresaId, date_key: dateKey },
        order: { stage: 'ASC' },
      }),
      this.agingStageRepository.find({
        where: { empresa_id: empresaId, date_key: dateKey },
      }),
    ]);

    const agingMap = new Map<string, DashboardAgingStageDaily>();
    agingRows.forEach((row) => agingMap.set(row.stage, row));

    const stages = pipelineRows.map((row) => {
      const aging = agingMap.get(row.stage);
      return {
        stage: row.stage,
        quantidade: Number(row.quantidade || 0),
        valor: Number(row.valor_total || 0),
        agingMedioDias: Number(aging?.avg_days || 0),
        paradas: Number(aging?.stalled_count || 0),
      };
    });

    return {
      totalValor: Number(stages.reduce((acc, item) => acc + item.valor, 0).toFixed(2)),
      stages,
    };
  }

  async getInsights(empresaId: string, range: DateRange, filters: DashboardV2SourceFilters = {}) {
    const [overview, trends, pipelineSummary] = await Promise.all([
      this.getOverview(empresaId, range, filters),
      this.getTrends(empresaId, range, filters),
      this.getPipelineSummary(empresaId, range, filters),
    ]);

    const insights: Array<{
      id: string;
      type: 'warning' | 'opportunity' | 'info';
      title: string;
      description: string;
      impact: 'alto' | 'medio' | 'baixo';
      action?: string;
    }> = [];

    if (overview.receitaPrevista > overview.receitaFechada * 1.4) {
      insights.push({
        id: 'previsto-maior-que-fechado',
        type: 'opportunity',
        title: 'Pipeline acima do realizado',
        description:
          'A receita prevista esta significativamente maior que a receita fechada. Priorize oportunidades com maior probabilidade.',
        impact: 'alto',
        action: 'Revisar oportunidades em negociacao',
      });
    }

    const latestTrend = trends[trends.length - 1];
    const previousTrend = trends.length > 1 ? trends[trends.length - 2] : undefined;
    if (latestTrend && previousTrend && latestTrend.receitaFechada < previousTrend.receitaFechada) {
      insights.push({
        id: 'queda-receita-fechada',
        type: 'warning',
        title: 'Queda recente na receita fechada',
        description:
          'A receita fechada do ultimo dia esta abaixo do dia anterior no periodo selecionado.',
        impact: 'medio',
        action: 'Investigar gargalos na etapa final do funil',
      });
    }

    const stalledTotal = pipelineSummary.stages.reduce((acc, item) => acc + item.paradas, 0);
    if (stalledTotal > 0) {
      insights.push({
        id: 'oportunidades-paradas',
        type: 'warning',
        title: 'Oportunidades paradas detectadas',
        description: `${stalledTotal} oportunidades com aging acima do limite configurado.`,
        impact: 'alto',
        action: 'Executar follow-up das oportunidades paradas',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'painel-estavel',
        type: 'info',
        title: 'Indicadores estaveis',
        description: 'Nao foram detectados desvios criticos no periodo analisado.',
        impact: 'baixo',
      });
    }

    return insights;
  }

  private useSourceFilters(filters: DashboardV2SourceFilters): boolean {
    return Boolean(filters.vendedorId || filters.pipelineId);
  }

  private toOverview(points: DashboardV2TrendPoint[]) {
    const receitaFechada = points.reduce((acc, row) => acc + Number(row.receitaFechada || 0), 0);
    const receitaPrevista = points.reduce((acc, row) => acc + Number(row.receitaPrevista || 0), 0);
    const ticketMedio =
      points.length > 0
        ? points.reduce((acc, row) => acc + Number(row.ticketMedio || 0), 0) / points.length
        : 0;
    const cicloMedioDias =
      points.length > 0
        ? points.reduce((acc, row) => acc + Number(row.cicloMedioDias || 0), 0) / points.length
        : 0;

    const lastDay = points[points.length - 1];
    return {
      receitaFechada: Number(receitaFechada.toFixed(2)),
      receitaPrevista: Number(receitaPrevista.toFixed(2)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      cicloMedioDias: Number(cicloMedioDias.toFixed(2)),
      oportunidadesAtivas: Number(lastDay?.oportunidadesAtivas || 0),
    };
  }

  private buildDateSeries(range: DateRange): string[] {
    const keys: string[] = [];
    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
      keys.push(this.toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
  }

  private createEmptyTrendPoints(range: DateRange): DashboardV2TrendPoint[] {
    return this.buildDateSeries(range).map((date) => ({
      date,
      receitaFechada: 0,
      receitaPrevista: 0,
      ticketMedio: 0,
      cicloMedioDias: 0,
      oportunidadesAtivas: 0,
      conversao: 0,
    }));
  }

  private async getTrendPointsFromSource(
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<DashboardV2TrendPoint[]> {
    const points = this.createEmptyTrendPoints(range);
    const pointsMap = new Map(points.map((point) => [point.date, point]));

    await Promise.all([
      this.mergeRevenueFromSource(pointsMap, empresaId, range, filters),
      this.mergePipelineProjectionFromSource(pointsMap, empresaId, range, filters),
      this.mergeConversionFromSource(pointsMap, empresaId, range, filters),
    ]);

    return points;
  }

  private async mergeRevenueFromSource(
    pointsMap: Map<string, DashboardV2TrendPoint>,
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<void> {
    const approvedParams: unknown[] = [
      empresaId,
      range.start.toISOString(),
      range.end.toISOString(),
      this.approvedStatus,
    ];
    const finalParams: unknown[] = [
      empresaId,
      range.start.toISOString(),
      range.end.toISOString(),
      this.finalStatus,
    ];

    let approvedVendedorClause = '';
    let finalVendedorClause = '';
    if (filters.vendedorId) {
      approvedParams.push(filters.vendedorId);
      approvedVendedorClause = ` AND p."vendedor_id" = $${approvedParams.length}`;

      finalParams.push(filters.vendedorId);
      finalVendedorClause = ` AND p."vendedor_id" = $${finalParams.length}`;
    }

    const [approvedRows, cycleRows] = await Promise.all([
      this.propostaRepository.query(
        `
          SELECT
            TO_CHAR(DATE(p."criadaEm"), 'YYYY-MM-DD') AS date_key,
            COALESCE(SUM(p.total), 0)::numeric AS receita_fechada,
            COALESCE(AVG(p.total), 0)::numeric AS ticket_medio
          FROM propostas p
          WHERE p."empresa_id" = $1
            AND p."criadaEm" BETWEEN $2::timestamptz AND $3::timestamptz
            AND LOWER(p.status::text) = ANY($4::text[])
            ${approvedVendedorClause}
          GROUP BY DATE(p."criadaEm")
        `,
        approvedParams,
      ),
      this.propostaRepository.query(
        `
          SELECT
            TO_CHAR(DATE(p."criadaEm"), 'YYYY-MM-DD') AS date_key,
            COALESCE(
              AVG(EXTRACT(EPOCH FROM (COALESCE(p."atualizadaEm", p."criadaEm") - p."criadaEm")) / 86400.0),
              0
            )::numeric AS ciclo_medio_dias
          FROM propostas p
          WHERE p."empresa_id" = $1
            AND p."criadaEm" BETWEEN $2::timestamptz AND $3::timestamptz
            AND LOWER(p.status::text) = ANY($4::text[])
            ${finalVendedorClause}
          GROUP BY DATE(p."criadaEm")
        `,
        finalParams,
      ),
    ]);

    approvedRows.forEach((row: { date_key?: string; receita_fechada?: string; ticket_medio?: string }) => {
      if (!row.date_key) return;
      const current = pointsMap.get(row.date_key);
      if (!current) return;

      current.receitaFechada = Number(row.receita_fechada || 0);
      current.ticketMedio = Number(row.ticket_medio || 0);
    });

    cycleRows.forEach((row: { date_key?: string; ciclo_medio_dias?: string }) => {
      if (!row.date_key) return;
      const current = pointsMap.get(row.date_key);
      if (!current) return;

      current.cicloMedioDias = Number(row.ciclo_medio_dias || 0);
    });
  }

  private async mergePipelineProjectionFromSource(
    pointsMap: Map<string, DashboardV2TrendPoint>,
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<void> {
    const responsavelColumn = await this.getOportunidadeResponsavelColumnSql();
    const params: unknown[] = [empresaId, this.toDateKey(range.start), this.toDateKey(range.end)];
    let vendedorClause = '';

    if (filters.vendedorId) {
      params.push(filters.vendedorId);
      vendedorClause = ` AND ${responsavelColumn}::text = $${params.length}::text`;
    }

    const rows = await this.oportunidadeRepository.query(
      `
        WITH dias AS (
          SELECT generate_series($2::date, $3::date, interval '1 day')::date AS date_key
        )
        SELECT
          TO_CHAR(d.date_key, 'YYYY-MM-DD') AS date_key,
          COALESCE(SUM((o.valor * o.probabilidade) / 100.0), 0)::numeric AS receita_prevista,
          COUNT(o.id)::int AS oportunidades_ativas
        FROM dias d
        LEFT JOIN oportunidades o
          ON o.empresa_id = $1
          AND o."createdAt" <= (d.date_key + interval '1 day' - interval '1 millisecond')
          AND ${this.stageNormalizeSql('o.estagio')} NOT IN ('won', 'lost')
          ${vendedorClause}
        GROUP BY d.date_key
        ORDER BY d.date_key ASC
      `,
      params,
    );

    rows.forEach((row: { date_key?: string; receita_prevista?: string; oportunidades_ativas?: string }) => {
      if (!row.date_key) return;
      const current = pointsMap.get(row.date_key);
      if (!current) return;

      current.receitaPrevista = Number(row.receita_prevista || 0);
      current.oportunidadesAtivas = Number(row.oportunidades_ativas || 0);
    });
  }

  private async mergeConversionFromSource(
    pointsMap: Map<string, DashboardV2TrendPoint>,
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<void> {
    const responsavelColumn = await this.getOportunidadeResponsavelColumnSql();
    const fromStageExpr = this.stageNormalizeSql('e.from_stage');
    const toStageExpr = this.stageNormalizeSql('e.to_stage');
    const params: unknown[] = [empresaId, range.start.toISOString(), range.end.toISOString()];
    let vendedorClause = '';

    if (filters.vendedorId) {
      params.push(filters.vendedorId);
      vendedorClause = ` AND ${responsavelColumn}::text = $${params.length}::text`;
    }

    const rows = await this.stageEventRepository.query(
      `
        WITH movements AS (
          SELECT
            TO_CHAR(DATE(e.changed_at), 'YYYY-MM-DD') AS date_key,
            ${fromStageExpr} AS from_stage,
            ${toStageExpr} AS to_stage,
            COUNT(*)::int AS progressed_count,
            SUM(COUNT(*)) OVER (
              PARTITION BY DATE(e.changed_at), ${fromStageExpr}
            )::int AS entered_count
          FROM oportunidade_stage_events e
          INNER JOIN oportunidades o
            ON o.id::text = e.oportunidade_id::text
            AND o.empresa_id = e.empresa_id
          WHERE e.empresa_id = $1
            AND e.from_stage IS NOT NULL
            AND e.changed_at BETWEEN $2::timestamptz AND $3::timestamptz
            ${vendedorClause}
          GROUP BY DATE(e.changed_at), ${fromStageExpr}, ${toStageExpr}
        )
        SELECT
          date_key,
          COALESCE(SUM(progressed_count), 0)::int AS progressed,
          COALESCE(SUM(entered_count), 0)::int AS entered
        FROM movements
        GROUP BY date_key
        ORDER BY date_key ASC
      `,
      params,
    );

    rows.forEach((row: { date_key?: string; entered?: string; progressed?: string }) => {
      if (!row.date_key) return;
      const current = pointsMap.get(row.date_key);
      if (!current) return;

      const entered = Number(row.entered || 0);
      const progressed = Number(row.progressed || 0);
      current.conversao = entered > 0 ? Number(((progressed / entered) * 100).toFixed(2)) : 0;
    });
  }

  private async getFunnelFromSource(
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<
    Array<{
      fromStage: string;
      toStage: string;
      entered: number;
      progressed: number;
      conversionRate: number;
    }>
  > {
    const responsavelColumn = await this.getOportunidadeResponsavelColumnSql();
    const fromStageExpr = this.stageNormalizeSql('e.from_stage');
    const toStageExpr = this.stageNormalizeSql('e.to_stage');
    const params: unknown[] = [empresaId, range.start.toISOString(), range.end.toISOString()];
    let vendedorClause = '';

    if (filters.vendedorId) {
      params.push(filters.vendedorId);
      vendedorClause = ` AND ${responsavelColumn}::text = $${params.length}::text`;
    }

    const rows = await this.stageEventRepository.query(
      `
        WITH movements AS (
          SELECT
            ${fromStageExpr} AS from_stage,
            ${toStageExpr} AS to_stage,
            COUNT(*)::int AS progressed_count,
            SUM(COUNT(*)) OVER (PARTITION BY ${fromStageExpr})::int AS entered_count
          FROM oportunidade_stage_events e
          INNER JOIN oportunidades o
            ON o.id::text = e.oportunidade_id::text
            AND o.empresa_id = e.empresa_id
          WHERE e.empresa_id = $1
            AND e.from_stage IS NOT NULL
            AND e.changed_at BETWEEN $2::timestamptz AND $3::timestamptz
            ${vendedorClause}
          GROUP BY ${fromStageExpr}, ${toStageExpr}
        )
        SELECT
          from_stage AS "fromStage",
          to_stage AS "toStage",
          entered_count::int AS entered,
          progressed_count::int AS progressed
        FROM movements
        ORDER BY from_stage ASC, to_stage ASC
      `,
      params,
    );

    return rows.map((row: { fromStage: string; toStage: string; entered: string; progressed: string }) => {
      const entered = Number(row.entered || 0);
      const progressed = Number(row.progressed || 0);

      return {
        fromStage: row.fromStage,
        toStage: row.toStage,
        entered,
        progressed,
        conversionRate: entered > 0 ? Number(((progressed / entered) * 100).toFixed(2)) : 0,
      };
    });
  }

  private async getPipelineSummaryFromSource(
    empresaId: string,
    range: DateRange,
    filters: DashboardV2SourceFilters,
  ): Promise<{
    totalValor: number;
    stages: Array<{
      stage: string;
      quantidade: number;
      valor: number;
      agingMedioDias: number;
      paradas: number;
    }>;
  }> {
    const responsavelColumn = await this.getOportunidadeResponsavelColumnSql();
    const stageExpr = this.stageNormalizeSql('o.estagio');
    const pipelineParams: unknown[] = [empresaId, range.end.toISOString()];
    let pipelineVendedorClause = '';

    if (filters.vendedorId) {
      pipelineParams.push(filters.vendedorId);
      pipelineVendedorClause = ` AND ${responsavelColumn}::text = $${pipelineParams.length}::text`;
    }

    const pipelineRows = await this.oportunidadeRepository.query(
      `
        SELECT
          ${stageExpr} AS stage,
          COUNT(*)::int AS quantidade,
          COALESCE(SUM(o.valor), 0)::numeric AS valor_total
        FROM oportunidades o
        WHERE o.empresa_id = $1
          AND o."createdAt" <= $2::timestamptz
          ${pipelineVendedorClause}
        GROUP BY ${stageExpr}
        ORDER BY ${stageExpr} ASC
      `,
      pipelineParams,
    );

    const agingParams: unknown[] = [empresaId, range.end.toISOString()];
    let agingVendedorClause = '';
    if (filters.vendedorId) {
      agingParams.push(filters.vendedorId);
      agingVendedorClause = ` AND ${responsavelColumn}::text = $${agingParams.length}::text`;
    }

    agingParams.push(Number(process.env.DASHBOARD_V2_STALLED_DAYS || 3));
    const stalledLimitParam = agingParams.length;

    const agingRows = await this.stageEventRepository.query(
      `
        WITH scoped_oportunidades AS (
          SELECT o.id
          FROM oportunidades o
          WHERE o.empresa_id = $1
            AND o."createdAt" <= $2::timestamptz
            ${agingVendedorClause}
        ),
        latest_stage AS (
          SELECT DISTINCT ON (e.oportunidade_id)
            e.oportunidade_id,
            ${this.stageNormalizeSql('e.to_stage')} AS stage,
            e.changed_at
          FROM oportunidade_stage_events e
          INNER JOIN scoped_oportunidades so
            ON so.id::text = e.oportunidade_id::text
          WHERE e.empresa_id = $1
            AND e.changed_at <= $2::timestamptz
          ORDER BY e.oportunidade_id, e.changed_at DESC
        )
        SELECT
          ls.stage AS stage,
          AVG(EXTRACT(EPOCH FROM ($2::timestamptz - ls.changed_at)) / 86400.0)::numeric(8,2) AS avg_days,
          SUM(
            CASE
              WHEN EXTRACT(EPOCH FROM ($2::timestamptz - ls.changed_at)) / 86400.0 > $${stalledLimitParam}
              THEN 1
              ELSE 0
            END
          )::int AS stalled_count
        FROM latest_stage ls
        GROUP BY ls.stage
      `,
      agingParams,
    );

    const agingMap = new Map<string, { avg_days?: string; stalled_count?: string }>();
    agingRows.forEach((row: { stage?: string; avg_days?: string; stalled_count?: string }) => {
      if (!row.stage) return;
      agingMap.set(row.stage, row);
    });

    const stages = pipelineRows.map((row: { stage?: string; quantidade?: string; valor_total?: string }) => {
      const stage = String(row.stage || 'leads');
      const aging = agingMap.get(stage);

      return {
        stage,
        quantidade: Number(row.quantidade || 0),
        valor: Number(row.valor_total || 0),
        agingMedioDias: Number(aging?.avg_days || 0),
        paradas: Number(aging?.stalled_count || 0),
      };
    });

    return {
      totalValor: Number(stages.reduce((acc, item) => acc + item.valor, 0).toFixed(2)),
      stages,
    };
  }

  private async recomputePipelineSnapshot(
    empresaId: string,
    dateKey: string,
    dayEnd: Date,
  ): Promise<void> {
    const stageExpr = this.stageNormalizeSql('o.estagio');
    const rows = await this.oportunidadeRepository
      .createQueryBuilder('o')
      .select(stageExpr, 'stage')
      .addSelect('COUNT(*)::int', 'quantidade')
      .addSelect('COALESCE(SUM(o.valor), 0)::numeric', 'valor_total')
      .where('o.empresa_id = :empresaId', { empresaId })
      .andWhere('o.createdAt <= :dayEnd', { dayEnd })
      .groupBy(stageExpr)
      .getRawMany<{ stage: string; quantidade: string; valor_total: string }>();

    await this.pipelineSnapshotRepository.delete({ empresa_id: empresaId, date_key: dateKey });
    if (rows.length === 0) return;

    await this.pipelineSnapshotRepository.upsert(
      rows.map((row) => ({
        empresa_id: empresaId,
        date_key: dateKey,
        stage: row.stage,
        quantidade: Number(row.quantidade || 0),
        valor_total: Number(row.valor_total || 0),
      })),
      ['empresa_id', 'date_key', 'stage'],
    );
  }

  private async recomputeFunnelMetrics(
    empresaId: string,
    dateKey: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<void> {
    const fromStageExpr = this.stageNormalizeSql('e.from_stage');
    const toStageExpr = this.stageNormalizeSql('e.to_stage');
    const rows = await this.stageEventRepository
      .createQueryBuilder('e')
      .select(fromStageExpr, 'from_stage')
      .addSelect(toStageExpr, 'to_stage')
      .addSelect('COUNT(*)::int', 'progressed_count')
      .addSelect(`SUM(COUNT(*)) OVER (PARTITION BY ${fromStageExpr})::int`, 'entered_count')
      .where('e.empresa_id = :empresaId', { empresaId })
      .andWhere('e.from_stage IS NOT NULL')
      .andWhere('e.changed_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .groupBy(fromStageExpr)
      .addGroupBy(toStageExpr)
      .getRawMany<{
        from_stage: string;
        to_stage: string;
        progressed_count: string;
        entered_count: string;
      }>();

    await this.funnelMetricsRepository.delete({ empresa_id: empresaId, date_key: dateKey });
    if (rows.length === 0) return;

    await this.funnelMetricsRepository.upsert(
      rows.map((row) => {
        const enteredCount = Number(row.entered_count || 0);
        const progressedCount = Number(row.progressed_count || 0);
        const conversionRate = enteredCount > 0 ? (progressedCount / enteredCount) * 100 : 0;

        return {
          empresa_id: empresaId,
          date_key: dateKey,
          from_stage: row.from_stage,
          to_stage: row.to_stage,
          entered_count: enteredCount,
          progressed_count: progressedCount,
          conversion_rate: Number(conversionRate.toFixed(2)),
        };
      }),
      ['empresa_id', 'date_key', 'from_stage', 'to_stage'],
    );
  }

  private async recomputeAgingStage(
    empresaId: string,
    dateKey: string,
    dayEnd: Date,
  ): Promise<void> {
    const rows = await this.stageEventRepository.query(
      `
        WITH latest_stage AS (
          SELECT DISTINCT ON (e.oportunidade_id)
            e.oportunidade_id,
            ${this.stageNormalizeSql('e.to_stage')} AS stage,
            e.changed_at
          FROM oportunidade_stage_events e
          WHERE e.empresa_id = $1
            AND e.changed_at <= $2
          ORDER BY e.oportunidade_id, e.changed_at DESC
        )
        SELECT
          ls.stage AS stage,
          AVG(EXTRACT(EPOCH FROM ($2::timestamptz - ls.changed_at)) / 86400.0)::numeric(8,2) AS avg_days,
          SUM(
            CASE
              WHEN EXTRACT(EPOCH FROM ($2::timestamptz - ls.changed_at)) / 86400.0 > $3
              THEN 1
              ELSE 0
            END
          )::int AS stalled_count
        FROM latest_stage ls
        GROUP BY ls.stage
      `,
      [empresaId, dayEnd.toISOString(), Number(process.env.DASHBOARD_V2_STALLED_DAYS || 3)],
    );

    await this.agingStageRepository.delete({ empresa_id: empresaId, date_key: dateKey });
    if (rows.length === 0) return;

    await this.agingStageRepository.upsert(
      rows.map((row: any) => ({
        empresa_id: empresaId,
        date_key: dateKey,
        stage: row.stage,
        avg_days: Number(row.avg_days || 0),
        stalled_count: Number(row.stalled_count || 0),
      })),
      ['empresa_id', 'date_key', 'stage'],
    );
  }

  private async recomputeRevenueMetrics(
    empresaId: string,
    dateKey: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<void> {
    const [approvedStats, cycleStats, previstoStats, ativosStats] = await Promise.all([
      this.propostaRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.total), 0)', 'receita_fechada')
        .addSelect('COALESCE(AVG(p.total), 0)', 'ticket_medio')
        .where('p.empresaId = :empresaId', { empresaId })
        .andWhere('p.criadaEm BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('LOWER(p.status::text) IN (:...status)', { status: this.approvedStatus })
        .getRawOne<{ receita_fechada?: string; ticket_medio?: string }>(),
      this.propostaRepository
        .createQueryBuilder('p')
        .select(
          'COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(p.atualizadaEm, p.criadaEm) - p.criadaEm)) / 86400.0), 0)',
          'ciclo_medio_dias',
        )
        .where('p.empresaId = :empresaId', { empresaId })
        .andWhere('p.criadaEm BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('LOWER(p.status::text) IN (:...status)', { status: this.finalStatus })
        .getRawOne<{ ciclo_medio_dias?: string }>(),
      this.oportunidadeRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM((o.valor * o.probabilidade) / 100.0), 0)', 'receita_prevista')
        .where('o.empresa_id = :empresaId', { empresaId })
        .andWhere('o.createdAt <= :dayEnd', { dayEnd })
        .andWhere(`${this.stageNormalizeSql('o.estagio')} NOT IN (:...stages)`, {
          stages: ['won', 'lost'],
        })
        .getRawOne<{ receita_prevista?: string }>(),
      this.oportunidadeRepository
        .createQueryBuilder('o')
        .select('COUNT(*)::int', 'oportunidades_ativas')
        .where('o.empresa_id = :empresaId', { empresaId })
        .andWhere('o.createdAt <= :dayEnd', { dayEnd })
        .andWhere(`${this.stageNormalizeSql('o.estagio')} NOT IN (:...stages)`, {
          stages: ['won', 'lost'],
        })
        .getRawOne<{ oportunidades_ativas?: string }>(),
    ]);

    await this.revenueMetricsRepository.upsert(
      {
      empresa_id: empresaId,
      date_key: dateKey,
      receita_fechada: Number(approvedStats?.receita_fechada || 0),
      receita_prevista: Number(previstoStats?.receita_prevista || 0),
      ticket_medio: Number(approvedStats?.ticket_medio || 0),
      ciclo_medio_dias: Number(cycleStats?.ciclo_medio_dias || 0),
      oportunidades_ativas: Number(ativosStats?.oportunidades_ativas || 0),
      },
      ['empresa_id', 'date_key'],
    );
  }

  private async getOportunidadeResponsavelColumnSql(): Promise<string> {
    if (this.oportunidadeResponsavelColumnSql) {
      return this.oportunidadeResponsavelColumnSql;
    }

    if (this.oportunidadeResponsavelColumnSqlPromise) {
      return this.oportunidadeResponsavelColumnSqlPromise;
    }

    this.oportunidadeResponsavelColumnSqlPromise = (async () => {
      try {
        const rows: Array<{ column_name?: string }> = await this.oportunidadeRepository.query(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'oportunidades'
              AND table_schema NOT IN ('pg_catalog', 'information_schema')
              AND column_name IN ('responsavel_id', 'responsavelId', 'usuario_id', 'usuarioId')
            ORDER BY CASE
              WHEN column_name = 'responsavel_id' THEN 0
              WHEN column_name = 'responsavelId' THEN 1
              WHEN column_name = 'usuario_id' THEN 2
              WHEN column_name = 'usuarioId' THEN 3
              ELSE 4
            END
            LIMIT 1
          `,
        );

        const columnName = rows?.[0]?.column_name;
        if (columnName && typeof columnName === 'string') {
          return `o."${columnName}"`;
        }

        this.logger.warn(
          'Nenhuma coluna de responsavel/usuario encontrada em oportunidades; filtro por vendedor sera vazio.',
        );
      } catch (error) {
        this.logger.warn(
          `Falha ao detectar coluna de responsavel em oportunidades: ${
            (error as Error)?.message || 'desconhecido'
          }`,
        );
      }

      return 'NULL::text';
    })();

    const resolved = await this.oportunidadeResponsavelColumnSqlPromise;
    this.oportunidadeResponsavelColumnSql = resolved;
    this.oportunidadeResponsavelColumnSqlPromise = null;

    return resolved;
  }

  private stageNormalizeSql(columnRef: string): string {
    return `
      CASE LOWER(COALESCE(${columnRef}::text, ''))
        WHEN 'lead' THEN 'leads'
        WHEN 'leads' THEN 'leads'
        WHEN 'qualificado' THEN 'qualification'
        WHEN 'qualificacao' THEN 'qualification'
        WHEN 'qualification' THEN 'qualification'
        WHEN 'proposta' THEN 'proposal'
        WHEN 'proposal' THEN 'proposal'
        WHEN 'negociacao' THEN 'negotiation'
        WHEN 'negotiation' THEN 'negotiation'
        WHEN 'fechamento' THEN 'closing'
        WHEN 'closing' THEN 'closing'
        WHEN 'ganho' THEN 'won'
        WHEN 'won' THEN 'won'
        WHEN 'perdido' THEN 'lost'
        WHEN 'lost' THEN 'lost'
        ELSE LOWER(COALESCE(${columnRef}::text, 'leads'))
      END
    `;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
