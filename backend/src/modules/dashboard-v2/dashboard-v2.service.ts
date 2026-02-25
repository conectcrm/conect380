import { ForbiddenException, Injectable } from '@nestjs/common';
import { DashboardV2QueryDto } from './dto/dashboard-v2-query.dto';
import { DashboardV2CacheService } from './services/dashboard-v2-cache.service';
import { DashboardV2FeatureFlagService } from './services/dashboard-v2-feature-flag.service';
import { DashboardV2AggregationService } from './services/dashboard-v2-aggregation.service';
import { DashboardV2ValidationService } from './services/dashboard-v2-validation.service';

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

@Injectable()
export class DashboardV2Service {
  constructor(
    private readonly featureFlagService: DashboardV2FeatureFlagService,
    private readonly cacheService: DashboardV2CacheService,
    private readonly aggregationService: DashboardV2AggregationService,
    private readonly validationService: DashboardV2ValidationService,
  ) {}

  async getFeatureFlag(empresaId: string) {
    return this.featureFlagService.resolve(empresaId);
  }

  async getOverview(empresaId: string, query: DashboardV2QueryDto) {
    await this.ensureEnabled(empresaId);

    const context = this.resolveContext(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'overview',
      this.toFilterHash(query),
      async () => {
        await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        return this.aggregationService.getOverview(empresaId, context.range);
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

    const context = this.resolveContext(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'trends',
      this.toFilterHash(query),
      async () => {
        await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        return this.aggregationService.getTrends(empresaId, context.range);
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

    const context = this.resolveContext(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'funnel',
      this.toFilterHash(query),
      async () => {
        await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        return this.aggregationService.getFunnel(empresaId, context.range);
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

    const context = this.resolveContext(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'pipeline-summary',
      this.toFilterHash(query),
      async () => {
        await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        return this.aggregationService.getPipelineSummary(empresaId, context.range);
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

    const context = this.resolveContext(query);
    const response = await this.withCache(
      empresaId,
      context.periodKey,
      'insights',
      this.toFilterHash(query),
      async () => {
        await this.aggregationService.ensureMetricsForRange(empresaId, context.range);
        return this.aggregationService.getInsights(empresaId, context.range);
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
