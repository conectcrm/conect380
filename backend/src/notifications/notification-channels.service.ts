import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  NotificationsQueueProducer,
  SendWhatsappJobPayload,
  SendSmsJobPayload,
  SendPushJobPayload,
  NotificationRetryMeta,
} from './notifications.queue-producer';

interface WhatsappParams {
  to: string;
  message: string;
  context?: Record<string, any>;
  retryMeta?: NotificationRetryMeta;
}

interface SmsParams {
  to: string;
  message: string;
  context?: Record<string, any>;
  retryMeta?: NotificationRetryMeta;
}

interface PushParams {
  token: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  userId?: string;
  context?: Record<string, any>;
  retryMeta?: NotificationRetryMeta;
}

@Injectable()
export class NotificationChannelsService {
  private readonly logger = new Logger(NotificationChannelsService.name);

  constructor(private readonly notificationsProducer: NotificationsQueueProducer) {}

  private ensure(value: string | undefined, field: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new BadRequestException(`${field} é obrigatório`);
    }
    return trimmed;
  }

  async sendWhatsapp(params: WhatsappParams) {
    const to = this.ensure(params.to, 'Destino (to)');
    const message = this.ensure(params.message, 'Mensagem');

    const payload: SendWhatsappJobPayload = {
      to,
      message,
      context: params.context,
    };

    await this.notificationsProducer.enqueueSendWhatsapp(payload, params.retryMeta);
    this.logger.log(`WhatsApp enfileirado para ${to}`);
  }

  async sendSms(params: SmsParams) {
    const to = this.ensure(params.to, 'Destino (to)');
    const message = this.ensure(params.message, 'Mensagem');

    const payload: SendSmsJobPayload = {
      to,
      message,
      context: params.context,
    };

    await this.notificationsProducer.enqueueSendSms(payload, params.retryMeta);
    this.logger.log(`SMS enfileirado para ${to}`);
  }

  async sendPush(params: PushParams) {
    const token = this.ensure(params.token, 'Token push');
    const title = params.title?.trim();
    const body = params.body?.trim();

    if (!title && !body) {
      throw new BadRequestException('Título ou corpo do push é obrigatório');
    }

    const payload: SendPushJobPayload = {
      token,
      userId: params.userId,
      title,
      body,
      data: params.data,
      context: params.context,
    };

    await this.notificationsProducer.enqueueSendPush(payload, params.retryMeta);
    this.logger.log(`Push enfileirado para token=${token.slice(0, 8)}...`);
  }
}
