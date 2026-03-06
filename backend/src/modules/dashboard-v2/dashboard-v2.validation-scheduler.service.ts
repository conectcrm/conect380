import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagTenant } from './entities/feature-flag-tenant.entity';
import { DashboardV2AggregationService } from './services/dashboard-v2-aggregation.service';
import { DashboardV2ValidationService } from './services/dashboard-v2-validation.service';

@Injectable()
export class DashboardV2ValidationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DashboardV2ValidationSchedulerService.name);
  private readonly enabled =
    process.env.DASHBOARD_V2_VALIDATION_SCHEDULER_ENABLED !== 'false' &&
    process.env.NODE_ENV !== 'test';
  private readonly intervalMs = Number(
    process.env.DASHBOARD_V2_VALIDATION_SCHEDULER_INTERVAL_MS || 15 * 60 * 1000,
  );
  private readonly runHourUtc = Number(process.env.DASHBOARD_V2_VALIDATION_RUN_HOUR_UTC || 3);
  private readonly runMinuteUtc = Number(
    process.env.DASHBOARD_V2_VALIDATION_RUN_MINUTE_UTC || 20,
  );
  private readonly windowDays = Math.max(
    1,
    Number(process.env.DASHBOARD_V2_VALIDATION_WINDOW_DAYS || 30),
  );

  private intervalId: NodeJS.Timeout | null = null;
  private lastSubmittedDateKey: string | null = null;

  constructor(
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagRepository: Repository<FeatureFlagTenant>,
    private readonly aggregationService: DashboardV2AggregationService,
    private readonly validationService: DashboardV2ValidationService,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Scheduler de validacao V1 vs V2 desabilitado por configuracao.');
      return;
    }

    this.intervalId = setInterval(() => {
      this.runValidationCycle(false).catch((error) => {
        this.logger.error(
          `Falha no scheduler de validacao V1 vs V2: ${error?.message || error}`,
        );
      });
    }, this.intervalMs);

    void this.runValidationCycle(false);
    this.logger.log(
      `Scheduler de validacao V1 vs V2 iniciado (intervalo=${this.intervalMs}ms, horario alvo=${this.runHourUtc}:${this.runMinuteUtc} UTC).`,
    );
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runValidationNow(): Promise<void> {
    await this.runValidationCycle(true);
  }

  private async runValidationCycle(force: boolean): Promise<void> {
    const now = new Date();
    const todayKey = this.toDateKey(now);

    if (!force) {
      if (this.lastSubmittedDateKey === todayKey) {
        return;
      }

      if (!this.isTargetTimeReached(now)) {
        return;
      }
    }

    const tenantIds = await this.resolveEnabledTenants();
    if (!tenantIds.length) {
      this.lastSubmittedDateKey = todayKey;
      this.logger.log('Nenhum tenant elegivel para validacao V1 vs V2 no ciclo atual.');
      return;
    }

    const range = this.resolveRange(now);
    let successCount = 0;

    for (const empresaId of tenantIds) {
      try {
        await this.aggregationService.ensureMetricsForRange(empresaId, range);
        const overview = await this.aggregationService.getOverview(empresaId, range);
        await this.validationService.compareOverview({
          empresaId,
          range,
          receitaFechada: Number(overview.receitaFechada || 0),
          ticketMedio: Number(overview.ticketMedio || 0),
        });
        successCount += 1;
      } catch (error: any) {
        this.logger.warn(
          `Falha na validacao V1 vs V2 do tenant ${empresaId}: ${error?.message || error}`,
        );
      }
    }

    this.lastSubmittedDateKey = todayKey;
    this.logger.log(
      `Ciclo de validacao V1 vs V2 concluido: ${successCount}/${tenantIds.length} tenants processados.`,
    );
  }

  private async resolveEnabledTenants(): Promise<string[]> {
    const rows = await this.featureFlagRepository
      .createQueryBuilder('flag')
      .select('DISTINCT flag.empresa_id', 'empresa_id')
      .where('flag.flag_key = :flagKey', { flagKey: 'dashboard_v2_enabled' })
      .andWhere('(flag.enabled = true OR flag.rollout_percentage > 0)')
      .getRawMany<{ empresa_id: string }>();

    return rows
      .map((row) => row.empresa_id)
      .filter((empresaId): empresaId is string => typeof empresaId === 'string' && !!empresaId);
  }

  private resolveRange(referenceDate: Date): { start: Date; end: Date } {
    const end = new Date(referenceDate);
    end.setUTCHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - this.windowDays + 1);
    start.setUTCHours(0, 0, 0, 0);

    return { start, end };
  }

  private isTargetTimeReached(now: Date): boolean {
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();

    if (hour > this.runHourUtc) return true;
    if (hour < this.runHourUtc) return false;
    return minute >= this.runMinuteUtc;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
