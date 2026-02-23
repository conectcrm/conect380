import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DashboardV2JobsService } from './dashboard-v2.jobs.service';

@Injectable()
export class DashboardV2ReprocessSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DashboardV2ReprocessSchedulerService.name);
  private readonly enabled =
    process.env.DASHBOARD_V2_DAILY_REPROCESS_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
  private readonly intervalMs = Number(
    process.env.DASHBOARD_V2_DAILY_REPROCESS_INTERVAL_MS || 15 * 60 * 1000,
  );
  private intervalId: NodeJS.Timeout | null = null;
  private lastSubmittedDateKey: string | null = null;

  constructor(private readonly jobsService: DashboardV2JobsService) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Reprocessamento diario Dashboard V2 desabilitado por configuracao.');
      return;
    }

    this.intervalId = setInterval(() => {
      this.enqueueIfNeeded().catch((error) => {
        this.logger.error(`Falha no scheduler diario: ${error?.message || error}`);
      });
    }, this.intervalMs);

    void this.enqueueIfNeeded();

    this.logger.log(`Scheduler Dashboard V2 iniciado (intervalo=${this.intervalMs}ms).`);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async enqueueIfNeeded(): Promise<void> {
    const now = new Date();
    const today = this.toDateKey(now);

    if (today === this.lastSubmittedDateKey) {
      return;
    }

    const yesterdayDate = new Date(now);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = this.toDateKey(yesterdayDate);

    await this.jobsService.enqueueDailyReprocess({
      dateKey: yesterday,
      trigger: 'scheduler',
    });

    await this.jobsService.enqueueDailyReprocess({
      dateKey: today,
      trigger: 'scheduler',
    });

    this.lastSubmittedDateKey = today;
    this.logger.log(`Reprocessamentos diarios enfileirados para ${yesterday} e ${today}.`);
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
