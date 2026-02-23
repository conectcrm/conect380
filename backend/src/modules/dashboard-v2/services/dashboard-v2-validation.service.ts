import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from '../../dashboard/dashboard.service';
import { DashboardV2MetricDivergence } from '../entities/dashboard-v2-metric-divergence.entity';

type DateRange = {
  start: Date;
  end: Date;
};

type CompareOverviewInput = {
  empresaId: string;
  range: DateRange;
  receitaFechada: number;
  ticketMedio: number;
  vendedorId?: string;
};

@Injectable()
export class DashboardV2ValidationService {
  private readonly logger = new Logger(DashboardV2ValidationService.name);
  private readonly compareEnabled = process.env.DASHBOARD_V2_COMPARE_ENABLED !== 'false';
  private readonly divergenceThreshold = Number(
    process.env.DASHBOARD_V2_DIVERGENCE_THRESHOLD_PCT || 3,
  );
  private readonly cooldownMs = Number(
    process.env.DASHBOARD_V2_COMPARE_COOLDOWN_MS || 60 * 60 * 1000,
  );
  private readonly compareCache = new Map<string, number>();

  constructor(
    private readonly dashboardService: DashboardService,
    @InjectRepository(DashboardV2MetricDivergence)
    private readonly divergenceRepository: Repository<DashboardV2MetricDivergence>,
  ) {}

  async compareOverview(input: CompareOverviewInput): Promise<void> {
    if (!this.compareEnabled) return;

    const cacheKey = this.buildCacheKey(input);
    const now = Date.now();
    const lastRun = this.compareCache.get(cacheKey);
    if (lastRun && now - lastRun < this.cooldownMs) {
      return;
    }

    this.compareCache.set(cacheKey, now);
    this.cleanupCache(now);

    try {
      const periodo = this.resolvePeriodo(input.range);
      const kpis = await this.dashboardService.getKPIs(
        periodo,
        input.vendedorId,
        undefined,
        input.empresaId,
      );

      const metrics = [
        {
          key: 'receita_fechada',
          v1: Number(kpis?.faturamentoTotal?.valor || 0),
          v2: Number(input.receitaFechada || 0),
        },
        {
          key: 'ticket_medio',
          v1: Number(kpis?.ticketMedio?.valor || 0),
          v2: Number(input.ticketMedio || 0),
        },
      ];

      const divergences = metrics
        .map((metric) => {
          const baseline = Math.max(Math.abs(metric.v1), 1);
          const divergencePct = (Math.abs(metric.v2 - metric.v1) / baseline) * 100;
          return {
            ...metric,
            divergencePct: Number(divergencePct.toFixed(2)),
          };
        })
        .filter((metric) => metric.divergencePct > this.divergenceThreshold);

      if (!divergences.length) return;

      await this.divergenceRepository.insert(
        divergences.map((metric) => ({
          empresa_id: input.empresaId,
          metric_key: metric.key,
          period_start: this.toDateKey(input.range.start),
          period_end: this.toDateKey(input.range.end),
          v1_value: Number(metric.v1.toFixed(2)),
          v2_value: Number(metric.v2.toFixed(2)),
          divergence_pct: metric.divergencePct,
        })),
      );

      this.logger.warn(
        `Divergencia V1 vs V2 registrada (empresa=${input.empresaId}, metrics=${divergences
          .map((item) => `${item.key}:${item.divergencePct}%`)
          .join(', ')})`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Falha na validacao paralela V1 vs V2 (empresa=${input.empresaId}): ${error?.message || error}`,
      );
    }
  }

  private resolvePeriodo(range: DateRange): string {
    const days = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86_400_000));

    if (days <= 8) return 'semanal';
    if (days <= 32) return 'mensal';
    if (days <= 100) return 'trimestral';
    if (days <= 190) return 'semestral';
    return 'anual';
  }

  private buildCacheKey(input: CompareOverviewInput): string {
    return [
      input.empresaId,
      input.vendedorId || 'all',
      this.toDateKey(input.range.start),
      this.toDateKey(input.range.end),
    ].join(':');
  }

  private cleanupCache(now: number): void {
    for (const [key, value] of this.compareCache.entries()) {
      if (now - value > this.cooldownMs * 3) {
        this.compareCache.delete(key);
      }
    }
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
