import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DashboardV2QueryDto } from './dto/dashboard-v2-query.dto';
import { DashboardV2CacheService } from './services/dashboard-v2-cache.service';
import { DashboardV2FeatureFlagService } from './services/dashboard-v2-feature-flag.service';
import { DashboardV2AggregationService } from './services/dashboard-v2-aggregation.service';
import { DashboardV2ValidationService } from './services/dashboard-v2-validation.service';
import { MetasService } from '../metas/metas.service';
import {
  dashboardV2SnapshotRequestsTotal,
  dashboardV2SnapshotStageDurationHistogram,
  incrementCounter,
  observeHistogram,
} from '../../config/metrics';

type DateRange = {
  start: Date;
  end: Date;
};

type CacheEnvelope<T> = {
  hit: boolean;
  key: string;
  generatedAt: string;
  data: T;
};

type DashboardV2SnapshotPayload = {
  overview: {
    receitaFechada: number;
    receitaPrevista: number;
    metaReceita: number;
    ticketMedio: number;
    cicloMedioDias: number;
    oportunidadesAtivas: number;
  };
  trends: {
    points: Array<{
      date: string;
      receitaFechada: number;
      receitaPrevista: number;
      ticketMedio: number;
      conversao: number;
    }>;
  };
  funnel: {
    steps: Array<{
      fromStage: string;
      toStage: string;
      entered: number;
      progressed: number;
      conversionRate: number;
    }>;
  };
  pipelineSummary: {
    totalValor: number;
    stages: Array<{
      stage: string;
      quantidade: number;
      valor: number;
      agingMedioDias: number;
      paradas: number;
    }>;
  };
  insights: {
    insights: Array<{
      id: string;
      type: 'warning' | 'opportunity' | 'info';
      title: string;
      description: string;
      impact: 'alto' | 'medio' | 'baixo';
      action?: string;
    }>;
  };
};

type DashboardV2SnapshotOverview = Omit<DashboardV2SnapshotPayload['overview'], 'metaReceita'>;

@Injectable()
export class DashboardV2Service {
  private readonly logger = new Logger(DashboardV2Service.name);

  constructor(
    private readonly featureFlagService: DashboardV2FeatureFlagService,
    private readonly cacheService: DashboardV2CacheService,
    private readonly aggregationService: DashboardV2AggregationService,
    private readonly validationService: DashboardV2ValidationService,
    private readonly metasService: MetasService,
  ) {}

  async getFeatureFlag(empresaId: string) {
    return this.featureFlagService.resolve(empresaId);
  }

  async getSnapshot(empresaId: string, query: DashboardV2QueryDto) {
    const startedAt = Date.now();
    const stageDurationMs = {
      ensureMetrics: 0,
      aggregateQueries: 0,
      deriveInsights: 0,
    };
    let status: 'hit' | 'miss' | 'error' = 'error';
    let cacheKey: string | null = null;
    let periodKey: string | null = null;
    let requiresSourceQuery = false;

    try {
      await this.ensureEnabled(empresaId);
      this.validateFilters(query);

      const context = this.resolveContext(query);
      periodKey = context.periodKey;
      requiresSourceQuery = this.requiresSourceQuery(query);
      const response = await this.withCache<DashboardV2SnapshotPayload>(
        empresaId,
        context.periodKey,
        'snapshot',
        this.toFilterHash(query),
        async () => {
          if (!requiresSourceQuery) {
            const ensureMetricsStartedAt = Date.now();
            try {
              await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
              stageDurationMs.ensureMetrics = Date.now() - ensureMetricsStartedAt;
              observeHistogram(
                dashboardV2SnapshotStageDurationHistogram,
                stageDurationMs.ensureMetrics / 1000,
                { empresaId, stage: 'ensure_metrics', status: 'done' },
              );
            } catch (error) {
              stageDurationMs.ensureMetrics = Date.now() - ensureMetricsStartedAt;
              observeHistogram(
                dashboardV2SnapshotStageDurationHistogram,
                stageDurationMs.ensureMetrics / 1000,
                { empresaId, stage: 'ensure_metrics', status: 'error' },
              );
              throw error;
            }
          } else {
            observeHistogram(dashboardV2SnapshotStageDurationHistogram, 0, {
              empresaId,
              stage: 'ensure_metrics',
              status: 'skipped',
            });
          }

          const aggregateQueriesStartedAt = Date.now();
          let overview: DashboardV2SnapshotOverview | null = null;
          let trends: DashboardV2SnapshotPayload['trends']['points'] | null = null;
          let funnel: DashboardV2SnapshotPayload['funnel']['steps'] | null = null;
          let pipelineSummary: DashboardV2SnapshotPayload['pipelineSummary'] | null = null;
          let metaReceita = 0;

          try {
            [overview, metaReceita, trends, funnel, pipelineSummary] = await Promise.all([
              this.aggregationService.getOverview(empresaId, context.range, query),
              this.metasService.getMetaValorParaRange(
                context.range.start,
                context.range.end,
                query.vendedorId,
                undefined,
                empresaId,
              ),
              this.aggregationService.getTrends(empresaId, context.range, query),
              this.aggregationService.getFunnel(empresaId, context.range, query),
              this.aggregationService.getPipelineSummary(empresaId, context.range, query),
            ]);
            stageDurationMs.aggregateQueries = Date.now() - aggregateQueriesStartedAt;
            observeHistogram(
              dashboardV2SnapshotStageDurationHistogram,
              stageDurationMs.aggregateQueries / 1000,
              { empresaId, stage: 'aggregate_queries', status: 'done' },
            );
          } catch (error) {
            stageDurationMs.aggregateQueries = Date.now() - aggregateQueriesStartedAt;
            observeHistogram(
              dashboardV2SnapshotStageDurationHistogram,
              stageDurationMs.aggregateQueries / 1000,
              { empresaId, stage: 'aggregate_queries', status: 'error' },
            );
            throw error;
          }

          const deriveInsightsStartedAt = Date.now();
          let insights: DashboardV2SnapshotPayload['insights']['insights'] = [];

          try {
            insights = this.aggregationService.buildInsights({
              overview: overview!,
              trends: trends!,
              pipelineSummary: pipelineSummary!,
            });
            stageDurationMs.deriveInsights = Date.now() - deriveInsightsStartedAt;
            observeHistogram(
              dashboardV2SnapshotStageDurationHistogram,
              stageDurationMs.deriveInsights / 1000,
              { empresaId, stage: 'derive_insights', status: 'done' },
            );
          } catch (error) {
            stageDurationMs.deriveInsights = Date.now() - deriveInsightsStartedAt;
            observeHistogram(
              dashboardV2SnapshotStageDurationHistogram,
              stageDurationMs.deriveInsights / 1000,
              { empresaId, stage: 'derive_insights', status: 'error' },
            );
            throw error;
          }

          return {
            overview: {
              ...overview!,
              metaReceita: Number(metaReceita || 0),
            },
            trends: { points: trends! },
            funnel: { steps: funnel! },
            pipelineSummary: pipelineSummary!,
            insights: { insights },
          };
        },
      );

      status = response.hit ? 'hit' : 'miss';
      cacheKey = response.key;
      incrementCounter(dashboardV2SnapshotRequestsTotal, {
        empresaId,
        status,
      });

      void this.validationService.compareOverview({
        empresaId,
        range: context.range,
        receitaFechada: response.data.overview.receitaFechada,
        ticketMedio: response.data.overview.ticketMedio,
        vendedorId: query.vendedorId,
      });

      const cache = {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      };

      return {
        overview: {
          ...response.data.overview,
          cache,
        },
        trends: {
          ...response.data.trends,
          cache,
        },
        funnel: {
          ...response.data.funnel,
          cache,
        },
        pipelineSummary: {
          ...response.data.pipelineSummary,
          cache,
        },
        insights: {
          ...response.data.insights,
          cache,
        },
      };
    } catch (error) {
      incrementCounter(dashboardV2SnapshotRequestsTotal, {
        empresaId,
        status: 'error',
      });
      throw error;
    } finally {
      const totalDurationSeconds = (Date.now() - startedAt) / 1000;
      observeHistogram(dashboardV2SnapshotStageDurationHistogram, totalDurationSeconds, {
        empresaId,
        stage: 'total',
        status,
      });

      this.logger.log(
        JSON.stringify({
          event: 'dashboard_v2_snapshot_latency',
          empresaId,
          status,
          durationMs: Math.round(totalDurationSeconds * 1000),
          periodKey,
          cacheKey,
          requiresSourceQuery,
          stagesMs: stageDurationMs,
        }),
      );
    }
  }

  async getOverview(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);
    this.validateFilters(query);

    const context = this.resolveContext(query);
    const requiresSourceQuery = this.requiresSourceQuery(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'overview',
      this.toFilterHash(query),
      async () => {
        if (!requiresSourceQuery) {
          await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        }

        const [overview, metaReceita] = await Promise.all([
          this.aggregationService.getOverview(empresaId, context.range, query),
          this.metasService.getMetaValorParaRange(
            context.range.start,
            context.range.end,
            query.vendedorId,
            undefined,
            empresaId,
          ),
        ]);

        return {
          ...overview,
          metaReceita: Number(metaReceita || 0),
        };
      },
    );

    void this.validationService.compareOverview({
      empresaId,
      range: context.range,
      receitaFechada: response.data.receitaFechada,
      ticketMedio: response.data.ticketMedio,
      vendedorId: query.vendedorId,
    });

    return {
      ...response.data,
      cache: {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      },
    };
  }

  async getTrends(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);
    this.validateFilters(query);

    const context = this.resolveContext(query);
    const requiresSourceQuery = this.requiresSourceQuery(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'trends',
      this.toFilterHash(query),
      async () => {
        if (!requiresSourceQuery) {
          await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        }

        return this.aggregationService.getTrends(empresaId, context.range, query);
      },
    );

    return {
      points: response.data,
      cache: {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      },
    };
  }

  async getFunnel(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);
    this.validateFilters(query);

    const context = this.resolveContext(query);
    const requiresSourceQuery = this.requiresSourceQuery(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'funnel',
      this.toFilterHash(query),
      async () => {
        if (!requiresSourceQuery) {
          await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        }

        return this.aggregationService.getFunnel(empresaId, context.range, query);
      },
    );

    return {
      steps: response.data,
      cache: {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      },
    };
  }

  async getPipelineSummary(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);
    this.validateFilters(query);

    const context = this.resolveContext(query);
    const requiresSourceQuery = this.requiresSourceQuery(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'pipeline-summary',
      this.toFilterHash(query),
      async () => {
        if (!requiresSourceQuery) {
          await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        }

        return this.aggregationService.getPipelineSummary(empresaId, context.range, query);
      },
    );

    return {
      ...response.data,
      cache: {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      },
    };
  }

  async getInsights(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);
    this.validateFilters(query);

    const context = this.resolveContext(query);
    const requiresSourceQuery = this.requiresSourceQuery(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'insights',
      this.toFilterHash(query),
      async () => {
        if (!requiresSourceQuery) {
          await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        }

        return this.aggregationService.getInsights(empresaId, context.range, query);
      },
    );

    return {
      insights: response.data,
      cache: {
        hit: response.hit,
        key: response.key,
        generatedAt: response.generatedAt,
      },
    };
  }

  private async ensureEnabled(empresaId: string): Promise<void> {
    const decision = await this.featureFlagService.resolve(empresaId);

    if (!decision.enabled) {
      throw new ForbiddenException('Dashboard V2 desabilitado para esta empresa.');
    }
  }

  private resolveContext(query: DashboardV2QueryDto): {
    range: DateRange;
    periodKey: string;
  } {
    const range = this.aggregationService.resolveDateRange(query);

    return {
      range,
      periodKey: this.aggregationService.periodKey(range),
    };
  }

  private toFilterHash(query: DashboardV2QueryDto): Record<string, unknown> {
    return {
      vendedorId: query.vendedorId || null,
      pipelineId: query.pipelineId || null,
      timezone: query.timezone || null,
      periodStart: query.periodStart || null,
      periodEnd: query.periodEnd || null,
    };
  }

  private validateFilters(query: DashboardV2QueryDto): void {
    if (query.pipelineId) {
      throw new BadRequestException(
        'Filtro pipelineId ainda nao esta disponivel neste tenant. Utilize o filtro por vendedor.',
      );
    }
  }

  private requiresSourceQuery(query: DashboardV2QueryDto): boolean {
    return Boolean(query.vendedorId || query.pipelineId);
  }

  private async withCache<T>(
    empresaId: string,
    periodKey: string,
    scope: string,
    filters: Record<string, unknown>,
    resolver: () => Promise<T>,
  ): Promise<CacheEnvelope<T>> {
    const key = this.cacheService.buildKey({
      empresaId,
      periodKey,
      scope,
      filters,
    });

    const cached = await this.cacheService.get<T>(key, empresaId);

    if (cached) {
      return {
        hit: true,
        key,
        generatedAt: cached.generatedAt,
        data: cached.data,
      };
    }

    const data = await resolver();
    const generatedAt = new Date().toISOString();

    await this.cacheService.set(key, empresaId, data);

    return {
      hit: false,
      key,
      generatedAt,
      data,
    };
  }
}
