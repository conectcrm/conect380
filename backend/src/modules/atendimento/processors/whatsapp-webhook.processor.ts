import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import { WebhookIdempotencyService } from '../services/webhook-idempotency.service';
import { runWithTenant } from '../../../common/tenant/tenant-context';

interface WhatsAppWebhookJob {
  empresaId: string;
  body: any;
}

@Processor('webhooks-in')
export class WhatsAppWebhookProcessor {
  private readonly logger = new Logger(WhatsAppWebhookProcessor.name);

  constructor(
    private readonly webhookService: WhatsAppWebhookService,
    private readonly idempotencyService: WebhookIdempotencyService,
  ) {}

  @Process('process-whatsapp-webhook')
  async handle(job: Job<WhatsAppWebhookJob>) {
    const { empresaId, body } = job.data;

    this.logger.log(`🔄 [PROCESSOR] Processando job ${job.id} - Empresa: ${empresaId}`);

    const messageId = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id;

    try {
      await runWithTenant(empresaId, async () => {
        const duplicate = await this.idempotencyService.isDuplicateAndStore({
          canal: 'whatsapp',
          empresaId,
          messageId,
          payload: body,
        });

        if (duplicate) {
          this.logger.debug(`Ignorando webhook duplicado (job ${job.id})`);
          return;
        }

        this.logger.log(`📨 [PROCESSOR] Chamando webhookService.processar() para job ${job.id}`);
        await this.webhookService.processar(empresaId, body);
        this.logger.log(`✅ [PROCESSOR] Webhook processado com sucesso (job ${job.id})`);
      });
    } catch (error) {
      this.logger.error(
        `❌ [PROCESSOR] Erro ao processar webhook (job ${job.id}): ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }
}
