import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Oportunidade } from '../../oportunidades/oportunidade.entity';
import { OportunidadeStageEvent } from '../../oportunidades/oportunidade-stage-event.entity';
import { Proposta } from '../../propostas/proposta.entity';
import { DashboardAgingStageDaily } from '../entities/dashboard-aging-stage-daily.entity';
import { DashboardFunnelMetricsDaily } from '../entities/dashboard-funnel-metrics-daily.entity';
import { DashboardPipelineSnapshotDaily } from '../entities/dashboard-pipeline-snapshot-daily.entity';
import { DashboardRevenueMetricsDaily } from '../entities/dashboard-revenue-metrics-daily.entity';

type DateRange = {
  start: Date;
  end: Date;
};

@Injectable()
export class DashboardV2AggregationService {
  private readonly logger = new Logger(DashboardV2AggregationService.name);
  private readonly approvedStatus = ['aprovada', 'aceita'];
  private readonly finalStatus = ['aprovada', 'aceita', 'rejeitada', 'expirada'];

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

    const start = input?.periodStart ? new Date(input.periodStart) : defaultStart;
    const end = input?.periodEnd ? new Date(input.periodEnd) : defaultEnd;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: defaultStart, end: defaultEnd };
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return start <= end ? { start, end } : { start: end, end: start };
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

    if (count > 0) {
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

  async getOverview(empresaId: string, range: DateRange) {
    const rows = await this.revenueMetricsRepository.find({
      where: {
        empresa_id: empresaId,
        date_key: Between(this.toDateKey(range.start), this.toDateKey(range.end)),
      },
      order: { date_key: 'ASC' },
    });

    const receitaFechada = rows.reduce((acc, row) => acc + Number(row.receita_fechada || 0), 0);
    const receitaPrevista = rows.reduce((acc, row) => acc + Number(row.receita_prevista || 0), 0);
    const ticketMedio =
      rows.length > 0
        ? rows.reduce((acc, row) => acc + Number(row.ticket_medio || 0), 0) / rows.length
        : 0;
    const cicloMedioDias =
      rows.length > 0
        ? rows.reduce((acc, row) => acc + Number(row.ciclo_medio_dias || 0), 0) / rows.length
        : 0;

    const lastDay = rows[rows.length - 1];
    return {
      receitaFechada: Number(receitaFechada.toFixed(2)),
      receitaPrevista: Number(receitaPrevista.toFixed(2)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      cicloMedioDias: Number(cicloMedioDias.toFixed(2)),
      oportunidadesAtivas: Number(lastDay?.oportunidades_ativas || 0),
    };
  }

  async getTrends(empresaId: string, range: DateRange) {
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

  async getFunnel(empresaId: string, range: DateRange) {
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

  async getPipelineSummary(empresaId: string, range: DateRange) {
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

  async getInsights(empresaId: string, range: DateRange) {
    const [overview, trends, pipelineSummary] = await Promise.all([
      this.getOverview(empresaId, range),
      this.getTrends(empresaId, range),
      this.getPipelineSummary(empresaId, range),
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

    await this.pipelineSnapshotRepository.insert(
      rows.map((row) => ({
        empresa_id: empresaId,
        date_key: dateKey,
        stage: row.stage,
        quantidade: Number(row.quantidade || 0),
        valor_total: Number(row.valor_total || 0),
      })),
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

    await this.funnelMetricsRepository.insert(
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

    await this.agingStageRepository.insert(
      rows.map((row: any) => ({
        empresa_id: empresaId,
        date_key: dateKey,
        stage: row.stage,
        avg_days: Number(row.avg_days || 0),
        stalled_count: Number(row.stalled_count || 0),
      })),
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

    await this.revenueMetricsRepository.delete({ empresa_id: empresaId, date_key: dateKey });

    await this.revenueMetricsRepository.insert({
      empresa_id: empresaId,
      date_key: dateKey,
      receita_fechada: Number(approvedStats?.receita_fechada || 0),
      receita_prevista: Number(previstoStats?.receita_prevista || 0),
      ticket_medio: Number(approvedStats?.ticket_medio || 0),
      ciclo_medio_dias: Number(cycleStats?.ciclo_medio_dias || 0),
      oportunidades_ativas: Number(ativosStats?.oportunidades_ativas || 0),
    });
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
    return date.toISOString().slice(0, 10);
  }
}
