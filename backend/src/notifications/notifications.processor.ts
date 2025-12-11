import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // 🔐 NOVO
import { Repository } from 'typeorm'; // 🔐 NOVO
import axios from 'axios';
import twilio from 'twilio';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import * as nodemailer from 'nodemailer';
import { NotificationService } from './notification.service';
import { NotificationJobName } from './constants/notification-job-names';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsQueueProducer } from './notifications.queue-producer';
import { NotificationType } from './entities/notification.entity';
import { IntegracoesConfig } from '../modules/atendimento/entities/integracoes-config.entity'; // 🔐 NOVO

type SendEmailJobPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  context?: Record<string, any>;
};

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  private readonly adminNotifyUserId = process.env.NOTIFICATIONS_ADMIN_USER_ID;
  private fcmInitialized = false;

  private readonly MAX_RETRY_AFTER_MS = 120_000; // 2min cap

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationsProducer: NotificationsQueueProducer,
    @InjectRepository(IntegracoesConfig) // 🔐 NOVO - Para buscar credenciais WhatsApp
    private readonly integracaoRepo: Repository<IntegracoesConfig>,
  ) { }

  private parseRetryAfterMs(error: any): number | undefined {
    const header = error?.response?.headers?.['retry-after'] || error?.response?.headers?.['Retry-After'];
    if (!header) return undefined;

    if (!Number.isNaN(Number(header))) {
      return Math.min(Number(header) * 1000, this.MAX_RETRY_AFTER_MS);
    }

    const dateTs = Date.parse(header);
    if (!Number.isNaN(dateTs)) {
      const diff = dateTs - Date.now();
      if (diff > 0) {
        return Math.min(diff, this.MAX_RETRY_AFTER_MS);
      }
    }

    return undefined;
  }

  private async notifyAdmin(title: string, message: string, data?: Record<string, any>) {
    if (!this.adminNotifyUserId) return;
    try {
      await this.notificationsProducer.enqueueNotifyUser({
        userId: this.adminNotifyUserId,
        type: NotificationType.SISTEMA,
        title,
        message,
        data,
      });
    } catch (notifyErr) {
      this.logger.warn(
        `Falha ao notificar admin (${title}): ${notifyErr?.message || notifyErr}`,
      );
    }
  }

  private normalizeWhatsappNumber(raw: string): { normalized: string; warning?: string } {
    let digits = (raw || '').replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');

    if (!digits.startsWith('55')) {
      digits = `55${digits}`;
    }

    if (digits.length < 12 || digits.length > 13) {
      throw new Error(`Número de telefone inválido após normalização (${digits})`);
    }

    const warning = digits.length === 12 ? 'Formato com 12 dígitos; valide se há nono dígito' : undefined;

    return { normalized: digits, warning };
  }

  private normalizeSmsNumber(raw: string): string {
    let digits = (raw || '').replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');

    if (!digits.startsWith('55') && !digits.startsWith('1') && digits.length <= 11) {
      // Default to Brazil if clearly local; otherwise keep as provided with country code
      digits = `55${digits}`;
    }

    if (digits.length < 10 || digits.length > 15) {
      throw new Error(`Número SMS inválido após normalização (${digits})`);
    }

    return `+${digits}`;
  }

  private initFcmIfNeeded() {
    if (this.fcmInitialized) return;

    const serviceAccount = process.env.FCM_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FCM_PROJECT_ID;

    try {
      if (serviceAccount) {
        const parsed = JSON.parse(serviceAccount);
        initializeApp({
          credential: cert(parsed),
          projectId: projectId || parsed.project_id,
        });
      } else {
        initializeApp({
          credential: applicationDefault(),
          projectId,
        });
      }
      this.fcmInitialized = true;
      this.logger.log('FCM inicializado para envio de push');
    } catch (error: any) {
      this.logger.error(`Erro ao inicializar FCM: ${error?.message || error}`);
      throw new Error('Falha ao inicializar FCM');
    }
  }

  @Process(NotificationJobName.NOTIFY_USER)
  async handleNotify(job: Job<CreateNotificationDto>) {
    const data = job.data;
    try {
      await this.notificationService.create(data);
      this.logger.log(
        `Notificação criada via queue (jobId=${job.id}) para user=${data.userId}`,
      );
    } catch (error: any) {
      // Deixar Bull aplicar retries/backoff já configurados
      this.logger.error(
        `Erro ao processar notification jobId=${job.id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  @Process(NotificationJobName.SEND_EMAIL)
  async handleSendEmail(job: Job<SendEmailJobPayload>) {
    const data = job.data;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const from = data.from || process.env.SMTP_FROM || user;

    if (!data.to) {
      throw new Error('Payload de e-mail inválido: destinatário ausente');
    }
    if (!data.subject) {
      throw new Error('Payload de e-mail inválido: subject ausente');
    }

    if (!host || !user || !pass) {
      throw new Error('SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASSWORD)');
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });

      this.logger.log(`Email enviado via notifications (jobId=${job.id}) to=${data.to}`);
    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar email (jobId=${job.id}) to=${data.to}: ${error?.message || error}`,
      );

      const attempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= attempts;

      if (isLastAttempt && this.adminNotifyUserId) {
        void this.notificationsProducer.enqueueNotifyUser({
          userId: this.adminNotifyUserId,
          type: NotificationType.SISTEMA,
          title: 'Falha ao enviar e-mail',
          message: `Não foi possível enviar e-mail para ${data.to} após ${attempts} tentativas`,
          data: {
            context: 'send-email',
            jobId: job.id,
            to: data.to,
            subject: data.subject,
            error: error?.message || String(error),
          },
        }).catch((notifyErr) => {
          this.logger.warn(
            `Falha ao notificar admin sobre erro de e-mail (jobId=${job.id}): ${notifyErr?.message || notifyErr}`,
          );
        });
      }

      throw error;
    }
  }

  @Process(NotificationJobName.SEND_WHATSAPP)
  async handleSendWhatsapp(
    job: Job<{ to?: string; message?: string; empresaId?: string; context?: Record<string, any> }>,
  ) {
    const data = job.data || {};
    const toRaw = data.to?.trim();
    const messageRaw = data.message?.trim();
    const empresaId = data.empresaId;

    if (!toRaw) {
      throw new Error('Payload WhatsApp inválido: destinatário ausente');
    }

    if (!messageRaw) {
      throw new Error('Payload WhatsApp inválido: mensagem ausente');
    }

    if (!empresaId) {
      throw new Error('Payload WhatsApp inválido: empresaId ausente (necessário para buscar credenciais)');
    }

    // 🔐 Buscar credenciais do banco de dados (fonte única de verdade)
    let accessToken: string | undefined;
    let phoneNumberId: string | undefined;

    try {
      const config = await this.integracaoRepo.findOne({
        where: { 
          empresaId, 
          tipo: 'whatsapp_business_api', 
          ativo: true 
        },
      });

      if (!config) {
        this.logger.warn(`⚠️ Nenhuma configuração WhatsApp ativa encontrada para empresa ${empresaId}`);
      } else {
        this.logger.log(`✅ Configuração WhatsApp encontrada: ${config.id}`);

        const credenciais = config.credenciais || {};
        accessToken = credenciais.whatsapp_api_token || config.whatsappApiToken;
        phoneNumberId = credenciais.whatsapp_phone_number_id || config.whatsappPhoneNumberId;
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar config WhatsApp: ${error instanceof Error ? error.message : error}`,
      );
    }

    if (!accessToken || !phoneNumberId) {
      await this.notifyAdmin(
        'WhatsApp não configurado',
        `Envio para ${toRaw} falhou: credenciais não encontradas no banco de dados`,
        {
          context: 'send-whatsapp',
          jobId: job.id,
          to: toRaw,
          empresaId,
          missingCredentials: [
            !accessToken ? 'whatsapp_api_token' : undefined,
            !phoneNumberId ? 'whatsapp_phone_number_id' : undefined,
          ].filter((value): value is string => Boolean(value)),
          payloadKeys: Object.keys(data || {}),
        },
      );

      throw new Error(
        `WhatsApp não configurado para empresa ${empresaId}. ` +
        `Configure na tela de Integrações: ${!accessToken ? 'Access Token' : ''} ${!phoneNumberId ? 'Phone Number ID' : ''}`
      );
    }

    const { normalized, warning } = this.normalizeWhatsappNumber(toRaw);
    let body = messageRaw;

    if (messageRaw.length > 4096) {
      body = messageRaw.slice(0, 4096);
      this.logger.warn(`Mensagem WhatsApp >4096 caracteres; truncada para envio (jobId=${job.id})`);
    }

    this.logger.log(
      `Enviando WhatsApp (jobId=${job.id}) para=${normalized} preview="${body.slice(0, 120)}"${warning ? ` (${warning})` : ''}`,
    );

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalized,
          type: 'text',
          text: {
            body,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id;
      this.logger.log(
        `WhatsApp enviado com sucesso (jobId=${job.id}) id=${messageId || 'desconhecido'}`,
      );
    } catch (error: any) {
      const httpStatus = error?.response?.status;
      const waError = error?.response?.data?.error;
      const waCode = waError?.code;
      const waSubcode = waError?.error_subcode;
      const waMessage = waError?.message;
      const retryAfterMs = this.parseRetryAfterMs(error);

      this.logger.error(
        `Erro ao enviar WhatsApp (jobId=${job.id}) status=${httpStatus ?? 'n/a'} code=${waCode ?? 'n/a'} subcode=${waSubcode ?? 'n/a'} msg=${error?.message}`,
      );

      if (waMessage) {
        this.logger.error(`WhatsApp API: ${waMessage}`);
      }

      if (error?.response?.data) {
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }

      const attempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= attempts;

      // Se 429 e Retry-After presente, reagendar o job antes de consumir tentativa
      if (httpStatus === 429 && retryAfterMs && retryAfterMs > 0) {
        await job.moveToDelayed(Date.now() + retryAfterMs);
        this.logger.warn(
          `Retry-After WhatsApp (jobId=${job.id}) httpStatus=429 delay=${retryAfterMs}ms`);
        return;
      }

      if (isLastAttempt) {
        await this.notifyAdmin(
          'Falha ao enviar WhatsApp',
          `Não foi possível enviar WhatsApp para ${toRaw} após ${attempts} tentativas`,
          {
            context: 'send-whatsapp',
            jobId: job.id,
            to: toRaw,
            normalized,
            httpStatus,
            waCode,
            waSubcode,
            waMessage,
            attempts,
            payloadContext: data.context,
            messagePreview: body.slice(0, 120),
          },
        );
      }

      if (httpStatus && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) {
        job.discard();
        this.logger.warn(
          `Descartando retries para WhatsApp (jobId=${job.id}) por status 4xx (${httpStatus}).`,
        );
      }

      throw error;
    }
  }

  @Process(NotificationJobName.SEND_SMS)
  async handleSendSms(job: Job<any>) {
    const data = job.data as { to?: string; message?: string; context?: Record<string, any> };
    const toRaw = data?.to?.trim();
    const messageRaw = data?.message?.trim();

    if (!toRaw) {
      throw new Error('Payload SMS inválido: destinatário ausente');
    }

    if (!messageRaw) {
      throw new Error('Payload SMS inválido: mensagem ausente');
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;

    if (!accountSid || !authToken || !from) {
      await this.notifyAdmin(
        'SMS não configurado',
        `Envio SMS para ${toRaw} falhou: falta configurar credenciais Twilio`,
        {
          context: 'send-sms',
          jobId: job.id,
          to: toRaw,
          missingEnv: [
            !accountSid ? 'TWILIO_ACCOUNT_SID' : undefined,
            !authToken ? 'TWILIO_AUTH_TOKEN' : undefined,
            !from ? 'TWILIO_FROM' : undefined,
          ].filter((value): value is string => Boolean(value)),
          payloadKeys: Object.keys(data || {}),
        },
      );

      throw new Error('Twilio não configurado (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM)');
    }

    const to = this.normalizeSmsNumber(toRaw);
    const body = messageRaw.length > 1600 ? messageRaw.slice(0, 1600) : messageRaw;
    if (messageRaw.length > 1600) {
      this.logger.warn(`Mensagem SMS >1600 caracteres; truncada (jobId=${job.id})`);
    }

    this.logger.log(`Enviando SMS (jobId=${job.id}) to=${to} preview="${body.slice(0, 120)}"`);

    const client = twilio(accountSid, authToken);

    try {
      const response = await client.messages.create({
        from,
        to,
        body,
      });

      this.logger.log(`SMS enviado com sucesso (jobId=${job.id}) sid=${response.sid}`);
    } catch (error: any) {
      const code = error?.code;
      const status = error?.status || error?.statusCode;
      const moreInfo = error?.moreInfo;
      const retryAfterMs = this.parseRetryAfterMs(error);

      this.logger.error(
        `Erro ao enviar SMS (jobId=${job.id}) status=${status ?? 'n/a'} code=${code ?? 'n/a'} msg=${error?.message}`,
      );
      if (moreInfo) {
        this.logger.error(`Twilio moreInfo: ${moreInfo}`);
      }

      const attempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= attempts;

      if ((status === 429 || code === 20429) && retryAfterMs && retryAfterMs > 0) {
        await job.moveToDelayed(Date.now() + retryAfterMs);
        this.logger.warn(
          `Retry-After SMS (jobId=${job.id}) status=${status ?? code} delay=${retryAfterMs}ms`,
        );
        return;
      }

      if (isLastAttempt) {
        await this.notifyAdmin(
          'Falha ao enviar SMS',
          `Não foi possível enviar SMS para ${toRaw} após ${attempts} tentativas`,
          {
            context: 'send-sms',
            jobId: job.id,
            to: toRaw,
            normalized: to,
            status,
            code,
            moreInfo,
            attempts,
            payloadContext: data?.context,
            messagePreview: body.slice(0, 120),
          },
        );
      }

      const numericStatus = typeof status === 'string' ? Number(status) : status;
      if (numericStatus && numericStatus >= 400 && numericStatus < 500 && numericStatus !== 429) {
        job.discard();
        this.logger.warn(
          `Descartando retries para SMS (jobId=${job.id}) por status 4xx (${numericStatus}).`,
        );
      }

      throw error;
    }
  }

  @Process(NotificationJobName.SEND_PUSH)
  async handleSendPush(job: Job<any>) {
    const data = job.data as {
      token?: string;
      userId?: string;
      title?: string;
      body?: string;
      data?: Record<string, any>;
      context?: Record<string, any>;
    };

    const token = data?.token?.trim();
    const title = data?.title?.trim();
    const body = data?.body?.trim();

    if (!token) {
      throw new Error('Payload push inválido: token ausente');
    }

    if (!title && !body) {
      throw new Error('Payload push inválido: título ou body obrigatórios');
    }

    if (!process.env.FCM_PROJECT_ID) {
      await this.notifyAdmin(
        'Push não configurado (FCM)',
        `Envio push falhou: falta FCM_PROJECT_ID (jobId=${job.id})`,
        {
          context: 'send-push',
          jobId: job.id,
          token,
          userId: data?.userId,
          missingEnv: ['FCM_PROJECT_ID'],
          payloadKeys: Object.keys(data || {}),
        },
      );
      throw new Error('FCM não configurado (FCM_PROJECT_ID)');
    }

    // Inicializa FCM uma vez
    this.initFcmIfNeeded();

    const message = {
      token,
      notification: title || body ? { title, body } : undefined,
      data: data?.data ? this.toStringRecord(data.data) : undefined,
    } as const;

    try {
      const response = await getMessaging().send(message);
      this.logger.log(`Push enviado (jobId=${job.id}) token=${token.slice(0, 8)}... id=${response}`);
    } catch (error: any) {
      const code = error?.code;
      const status = error?.status;
      const messageErr = error?.message;
      const retryAfterMs = this.parseRetryAfterMs(error);

      this.logger.error(
        `Erro ao enviar push (jobId=${job.id}) code=${code ?? 'n/a'} status=${status ?? 'n/a'} msg=${messageErr}`,
      );

      const attempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= attempts;

      if (status === 429 && retryAfterMs && retryAfterMs > 0) {
        await job.moveToDelayed(Date.now() + retryAfterMs);
        this.logger.warn(
          `Retry-After push (jobId=${job.id}) status=${status} delay=${retryAfterMs}ms`,
        );
        return;
      }

      if (isLastAttempt) {
        await this.notifyAdmin(
          'Falha ao enviar push',
          `Não foi possível enviar push para token ${token.slice(0, 8)}... após ${attempts} tentativas`,
          {
            context: 'send-push',
            jobId: job.id,
            tokenPrefix: token.slice(0, 8),
            userId: data?.userId,
            code,
            status,
            messageErr,
            attempts,
            payloadContext: data?.context,
            title,
            bodyPreview: body?.slice(0, 120),
          },
        );
      }

      const numericStatus = typeof status === 'string' ? Number(status) : status;
      if (numericStatus && numericStatus >= 400 && numericStatus < 500 && numericStatus !== 429) {
        job.discard();
        this.logger.warn(
          `Descartando retries para push (jobId=${job.id}) por status 4xx (${numericStatus}).`,
        );
      }

      throw error;
    }
  }

  private toStringRecord(obj: Record<string, any>): Record<string, string> {
    return Object.entries(obj || {}).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
      return acc;
    }, {});
  }
}
