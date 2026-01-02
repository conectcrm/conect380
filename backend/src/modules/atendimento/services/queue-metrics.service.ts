import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { createHash } from 'crypto';
import { setTimeout as sleep } from 'timers/promises';
import { filaJobsTotal, filaJobDuracaoHistogram, filaWaitingGauge } from '../../../config/metrics';
import { NotificationsQueueProducer } from '../../../notifications/notifications.queue-producer';
import { NotificationChannelsService } from '../../../notifications/notification-channels.service';
import { NotificationType } from '../../../notifications/entities/notification.entity';
import { notifyByPolicy } from '../../../notifications/channel-notifier';
import { ChannelPolicyKey } from '../../../notifications/channel-policy';

@Injectable()
export class QueueMetricsService implements OnModuleInit {
  private readonly logger = new Logger(QueueMetricsService.name);

  private breakerState: Record<string, { failCount: number; openedUntil?: number }> = {};
  private backlogAlertState: Record<string, number> = {};

  private static readonly BREAKER_THRESHOLD = 5;
  private static readonly BREAKER_COOLDOWN_MS = 60_000; // 60s
  private static readonly BACKLOG_COOLDOWN_MS = 5 * 60_000; // 5min

  constructor(
    @InjectQueue('webhooks-in') private readonly webhooksQueue: Queue,
    @InjectQueue('webhooks-in-dlq') private readonly webhooksDlq: Queue,
    @InjectQueue('messages-out') private readonly messagesOutQueue: Queue,
    @InjectQueue('messages-out-dlq') private readonly messagesOutDlq: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('notifications-dlq') private readonly notificationsDlq: Queue,
    private readonly notificationsProducer: NotificationsQueueProducer,
    private readonly notificationChannels: NotificationChannelsService,
  ) { }

  private readonly adminNotifyUserId = process.env.NOTIFICATIONS_ADMIN_USER_ID;
  private readonly adminAlertPhone = process.env.NOTIFICATIONS_ADMIN_PHONE?.trim();
  private readonly notificationsBacklogThreshold = Number(process.env.NOTIFICATIONS_BACKLOG_THRESHOLD || 500);
  private readonly backlogPolicy: ChannelPolicyKey = 'notifications-backlog';
  private readonly breakerPolicy: ChannelPolicyKey = 'notifications-breaker';

  private getAdminPhone(): string | undefined {
    const raw = this.adminAlertPhone;
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return undefined;
    return raw;
  }

  onModuleInit() {
    this.instrumentQueue(this.webhooksQueue, this.webhooksDlq, 'webhooks-in');
    this.instrumentQueue(this.messagesOutQueue, this.messagesOutDlq, 'messages-out');
    this.instrumentQueue(this.notificationsQueue, this.notificationsDlq, 'notifications');
  }

  private instrumentQueue(queue: Queue, dlq: Queue, nomeFila: string) {
    queue.on('waiting', async () => {
      try {
        const waiting = await queue.getWaitingCount();
        filaWaitingGauge.set({ fila: nomeFila }, waiting);

        if (nomeFila === 'notifications') {
          this.tryNotifyBacklog(waiting, nomeFila);
        }
      } catch (error) {
        this.logger.warn(`Erro ao coletar waitingCount da fila ${nomeFila}: ${error?.message}`);
      }
    });

    queue.on('completed', async (job: Job) => {
      filaJobsTotal.inc({ fila: nomeFila, status: 'completed' });
      if (job.processedOn && job.finishedOn) {
        const duracao = (job.finishedOn - job.processedOn) / 1000;
        filaJobDuracaoHistogram.observe({ fila: nomeFila }, duracao);
      }

      // reset breaker on success (por jobName)
      this.resetBreaker(nomeFila, job?.name);
    });

    queue.on('failed', async (job: Job, err: Error) => {
      filaJobsTotal.inc({ fila: nomeFila, status: 'failed' });

      const payload = (job.data as any)?.data ?? job.data;
      const payloadHash = createHash('sha1')
        .update(JSON.stringify(payload || {}))
        .digest('hex');

      const errorMeta = {
        errCode: (err as any)?.code || err?.name || 'Error',
        httpStatus: (err as any)?.statusCode || (err as any)?.status || null,
        originQueue: nomeFila,
        jobName: job.name,
        payloadHash,
        failedAt: new Date().toISOString(),
        message: err?.message,
      };

      try {
        await dlq.add(
          'dlq',
          {
            originalJobId: job.id,
            jobName: job.name,
            queue: nomeFila,
            data: payload,
            error: errorMeta,
            stacktrace: job.stacktrace,
          },
          {
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      } catch (dlqError) {
        this.logger.error(`Erro ao enviar job ${job.id} para DLQ: ${dlqError?.message}`);
      }

      // Circuit breaker por jobName (apenas notifications)
      if (nomeFila === 'notifications') {
        await this.applyBreaker(queue, nomeFila, job?.name);
      }
    });

    queue.on('active', () => {
      filaJobsTotal.inc({ fila: nomeFila, status: 'enqueued' });
    });
  }

  private async applyBreaker(queue: Queue, nomeFila: string, jobName?: string) {
    const now = Date.now();
    const key = this.buildBreakerKey(nomeFila, jobName);
    const state = this.breakerState[key] || { failCount: 0 };

    // Se já está aberto, apenas mantém contagem
    if (state.openedUntil && state.openedUntil > now) {
      this.breakerState[key] = state;
      return;
    }

    state.failCount += 1;

    if (state.failCount >= QueueMetricsService.BREAKER_THRESHOLD) {
      const openedUntil = now + QueueMetricsService.BREAKER_COOLDOWN_MS;
      this.breakerState[key] = { failCount: state.failCount, openedUntil };

      try {
        await queue.pause();
        this.logger.warn(
          `Circuit breaker aberto para fila ${nomeFila} (job=${jobName || 'unknown'}, falhas consecutivas: ${state.failCount}). Retomando em ${QueueMetricsService.BREAKER_COOLDOWN_MS / 1000}s`,
        );

        // Notificar admin se configurado
        if (nomeFila === 'notifications' && this.adminNotifyUserId) {
          const msg = `Job=${jobName || 'unknown'} pausado após ${state.failCount} falhas. Retoma em ${QueueMetricsService.BREAKER_COOLDOWN_MS / 1000}s`;

          void this.notificationsProducer.enqueueNotification({
            userId: this.adminNotifyUserId,
            type: NotificationType.SISTEMA,
            title: 'Circuit breaker aberto em notifications',
            message: msg,
            data: { jobName: jobName || 'unknown', failCount: state.failCount },
          }).catch((err) => {
            this.logger.warn(`Falha ao enfileirar alerta de breaker: ${err?.message || err}`);
          });

          const preview = msg.slice(0, 280);
          const adminPhone = this.getAdminPhone();

          void notifyByPolicy({
            policyKey: this.breakerPolicy,
            channels: this.notificationChannels,
            logger: this.logger,
            targets: { phone: adminPhone },
            message: preview,
            context: { source: 'notifications-breaker', jobName, failCount: state.failCount },
          });
        }

        await sleep(QueueMetricsService.BREAKER_COOLDOWN_MS);
        await queue.resume();
        this.logger.warn(`Circuit breaker fechado para fila ${nomeFila} (job=${jobName || 'unknown'})`);
        this.resetBreaker(nomeFila, jobName);
      } catch (breakerError) {
        this.logger.error(`Erro ao operar breaker da fila ${nomeFila}: ${breakerError?.message}`);
      }
    } else {
      this.breakerState[key] = state;
    }
  }

  private resetBreaker(nomeFila: string, jobName?: string) {
    const key = this.buildBreakerKey(nomeFila, jobName);
    this.breakerState[key] = { failCount: 0, openedUntil: undefined };
  }

  private buildBreakerKey(nomeFila: string, jobName?: string) {
    return `${nomeFila}:${jobName || 'unknown'}`;
  }

  private tryNotifyBacklog(waiting: number, nomeFila: string) {
    if (!this.adminNotifyUserId || !this.notificationsBacklogThreshold) return;
    if (waiting < this.notificationsBacklogThreshold) return;

    const now = Date.now();
    const lastAlert = this.backlogAlertState[nomeFila] || 0;
    if (now - lastAlert < QueueMetricsService.BACKLOG_COOLDOWN_MS) return;

    this.backlogAlertState[nomeFila] = now;

    const msg = `Fila ${nomeFila} com waiting=${waiting} (threshold=${this.notificationsBacklogThreshold}).`;

    void this.notificationsProducer.enqueueNotification({
      userId: this.adminNotifyUserId,
      type: NotificationType.SISTEMA,
      title: 'Backlog alto na fila notifications',
      message: msg,
      data: { queue: nomeFila, waiting, threshold: this.notificationsBacklogThreshold },
    }).catch((err) => {
      this.logger.warn(`Falha ao enfileirar alerta de backlog: ${err?.message || err}`);
    });

    const preview = msg.slice(0, 280);
    const adminPhone = this.getAdminPhone();

    void notifyByPolicy({
      policyKey: this.backlogPolicy,
      channels: this.notificationChannels,
      logger: this.logger,
      targets: { phone: adminPhone },
      message: preview,
      context: { source: 'notifications-backlog', queue: nomeFila, waiting, threshold: this.notificationsBacklogThreshold },
    });
  }
}
