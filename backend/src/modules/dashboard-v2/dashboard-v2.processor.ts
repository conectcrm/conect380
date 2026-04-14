import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import {
  filaJobDuracaoHistogram,
  filaJobsTotal,
  incrementCounter,
  observeHistogram,
} from '../../config/metrics';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { DashboardV2AggregationService } from './services/dashboard-v2-aggregation.service';
import { DashboardV2CacheService } from './services/dashboard-v2-cache.service';
import { DASHBOARD_V2_QUEUE, DashboardV2JobName } from './dashboard-v2.constants';

type StageEventRecomputePayload = {
  empresaId: string;
  oportunidadeId?: string;
  changedAt?: string;
  trigger: string;
};

type DailyReprocessPayload = {
  empresaId?: string;
  dateKey?: string;
  trigger: string;
};

@Injectable()
@Processor(DASHBOARD_V2_QUEUE)
export class DashboardV2Processor {
  private readonly logger = new Logger(DashboardV2Processor.name);
  private readonly redisClient: any;

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly aggregationService: DashboardV2AggregationService,
    private readonly cacheService: DashboardV2CacheService,
    @InjectQueue(DASHBOARD_V2_QUEUE) queue: Queue,
  ) {
    this.redisClient = (queue as any)?.client;
  }

  @Process(DashboardV2JobName.RECOMPUTE_STAGE_EVENT)
  async handleStageEventRecompute(job: Job<StageEventRecomputePayload>): Promise<void> {
    const startedAt = Date.now();
    const payload = job.data;

    if (!payload?.empresaId) {
      this.logger.warn(`Job ${job.id} ignorado: empresaId ausente.`);
      return;
    }

    const changedAt = payload.changedAt ? new Date(payload.changedAt) : new Date();
    if (Number.isNaN(changedAt.getTime())) {
      this.logger.warn(`Job ${job.id} ignorado: changedAt invalido.`);
      return;
    }

    const lockKey = `dash:v2:lock:stage:${payload.empresaId}:${changedAt.toISOString().slice(0, 10)}`;
    const acquired = await this.acquireLock(lockKey, 60);

    if (!acquired) {
      this.logger.debug(`Job ${job.id} ignorado por lock ativo (${lockKey}).`);
      return;
    }

    try {
      await this.aggregationService.recomputeRangeMetrics(payload.empresaId, changedAt, new Date());
      await this.cacheService.delByPrefix(`dash:v2:${payload.empresaId}:`);
      incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'completed' });
    } catch (error: any) {
      incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'failed' });
      this.logger.error(
        `Falha no recompute por stage_event (empresa=${payload.empresaId}): ${error?.message || error}`,
      );
      throw error;
    } finally {
      observeHistogram(filaJobDuracaoHistogram, (Date.now() - startedAt) / 1000, {
        fila: DASHBOARD_V2_QUEUE,
      });
    }
  }

  @Process(DashboardV2JobName.REPROCESS_DAILY)
  async handleDailyReprocess(job: Job<DailyReprocessPayload>): Promise<void> {
    const startedAt = Date.now();
    const payload = job.data;
    const targetDate = this.resolveDate(payload?.dateKey);
    const targetDateKey = this.toDateKey(targetDate);

    try {
      const empresas = payload?.empresaId
        ? [payload.empresaId]
        : (
            await this.empresaRepository.find({
              where: { ativo: true },
              select: { id: true } as any,
            })
          ).map((empresa) => empresa.id);

      for (const empresaId of empresas) {
        const lockKey = `dash:v2:lock:daily:${empresaId}:${targetDateKey}`;
        const acquired = await this.acquireLock(lockKey, 6 * 60 * 60);

        if (!acquired) {
          continue;
        }

        await this.aggregationService.recomputeDailyMetrics(empresaId, targetDate);
        await this.cacheService.delByPrefix(`dash:v2:${empresaId}:`);
      }

      incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'completed' });
    } catch (error: any) {
      incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'failed' });
      this.logger.error(
        `Falha no reprocessamento diario (${targetDateKey}): ${error?.message || error}`,
      );
      throw error;
    } finally {
      observeHistogram(filaJobDuracaoHistogram, (Date.now() - startedAt) / 1000, {
        fila: DASHBOARD_V2_QUEUE,
      });
    }
  }

  private async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redisClient) {
      return true;
    }

    try {
      const result = await this.redisClient.set(key, '1', 'NX', 'EX', ttlSeconds);
      return result === 'OK';
    } catch (error: any) {
      this.logger.warn(`Falha ao adquirir lock ${key}: ${error?.message || error}`);
      return true;
    }
  }

  private resolveDate(dateKey?: string): Date {
    if (dateKey) {
      const parsed = new Date(`${dateKey}T00:00:00.000Z`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
