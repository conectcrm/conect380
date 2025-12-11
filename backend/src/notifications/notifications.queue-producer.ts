import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import {
  notificationRetryStrategy,
  NotificationRetryMeta,
  RetryDecision,
} from './utils/retry-strategy';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationJobName } from './constants/notification-job-names';

export type SendEmailJobPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  context?: Record<string, any>;
};

export type SendWhatsappJobPayload = {
  to: string;
  message: string;
  empresaId?: string; // 🔐 NOVO - ID da empresa para buscar credenciais WhatsApp
  context?: Record<string, any>;
};

export type SendSmsJobPayload = {
  to: string;
  message: string;
  context?: Record<string, any>;
};

export type SendPushJobPayload = {
  token: string;
  userId?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  context?: Record<string, any>;
};

// Re-export para consumo externo sem importar direto do utilitário
export type { NotificationRetryMeta };

// Produtor simples para fila notifications com backoff/jitter por default
@Injectable()
export class NotificationsQueueProducer {
  private readonly logger = new Logger(NotificationsQueueProducer.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) { }

  private buildRetry(meta?: NotificationRetryMeta): RetryDecision {
    return notificationRetryStrategy(meta);
  }

  async enqueueNotifyUser(payload: CreateNotificationDto, retryMeta?: NotificationRetryMeta) {
    const retry = this.buildRetry(retryMeta);
    await this.notificationsQueue.add(NotificationJobName.NOTIFY_USER, payload, {
      attempts: retry.attempts,
      backoff: retry.backoff,
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(
      `Job enfileirado em notifications (${NotificationJobName.NOTIFY_USER}) para user=${payload.userId} title="${payload.title}"`,
    );
  }

  // Wrapper de compatibilidade
  async enqueueNotification(payload: CreateNotificationDto, retryMeta?: NotificationRetryMeta) {
    return this.enqueueNotifyUser(payload, retryMeta);
  }

  async enqueue(jobName: NotificationJobName, payload: Record<string, any>, retryMeta?: NotificationRetryMeta) {
    const retry = this.buildRetry(retryMeta);
    await this.notificationsQueue.add(jobName, payload, {
      attempts: retry.attempts,
      backoff: retry.backoff,
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(
      `Job enfileirado em notifications (${jobName}) payloadKeys=[${Object.keys(payload || {}).join(',')}]`,
    );
  }

  async enqueueSendEmail(payload: SendEmailJobPayload, retryMeta?: NotificationRetryMeta) {
    return this.enqueue(NotificationJobName.SEND_EMAIL, payload, retryMeta);
  }

  async enqueueSendWhatsapp(payload: SendWhatsappJobPayload, retryMeta?: NotificationRetryMeta) {
    return this.enqueue(NotificationJobName.SEND_WHATSAPP, payload, retryMeta);
  }

  async enqueueSendSms(payload: SendSmsJobPayload, retryMeta?: NotificationRetryMeta) {
    return this.enqueue(NotificationJobName.SEND_SMS, payload, retryMeta);
  }

  async enqueueSendPush(payload: SendPushJobPayload, retryMeta?: NotificationRetryMeta) {
    return this.enqueue(NotificationJobName.SEND_PUSH, payload, retryMeta);
  }
}
