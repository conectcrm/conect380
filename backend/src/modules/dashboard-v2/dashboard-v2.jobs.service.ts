import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { incrementCounter, filaJobsTotal } from '../../config/metrics';
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
export class DashboardV2JobsService {
  private readonly logger = new Logger(DashboardV2JobsService.name);

  constructor(@InjectQueue(DASHBOARD_V2_QUEUE) private readonly queue: Queue) {}

  async enqueueStageEventRecompute(payload: StageEventRecomputePayload): Promise<void> {
    const jobId = `${DashboardV2JobName.RECOMPUTE_STAGE_EVENT}:${payload.empresaId}:${payload.oportunidadeId || 'na'}:${payload.changedAt || 'now'}`;

    await this.queue.add(DashboardV2JobName.RECOMPUTE_STAGE_EVENT, payload, {
      jobId,
      removeOnComplete: true,
      removeOnFail: false,
    });

    incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'enqueued' });
    this.logger.debug(`Job enfileirado: ${jobId}`);
  }

  async enqueueDailyReprocess(payload: DailyReprocessPayload): Promise<void> {
    const target = payload.dateKey || new Date().toISOString().slice(0, 10);
    const scope = payload.empresaId || 'all';
    const jobId = `${DashboardV2JobName.REPROCESS_DAILY}:${scope}:${target}`;

    await this.queue.add(DashboardV2JobName.REPROCESS_DAILY, payload, {
      jobId,
      removeOnComplete: true,
      removeOnFail: false,
    });

    incrementCounter(filaJobsTotal, { fila: DASHBOARD_V2_QUEUE, status: 'enqueued' });
    this.logger.debug(`Job enfileirado: ${jobId}`);
  }
}
