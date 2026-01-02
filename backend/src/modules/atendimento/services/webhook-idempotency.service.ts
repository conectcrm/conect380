import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createHash } from 'crypto';

interface IdempotencyParams {
  canal: string;
  empresaId: string;
  messageId?: string;
  payload?: any;
}

@Injectable()
export class WebhookIdempotencyService {
  private readonly logger = new Logger(WebhookIdempotencyService.name);
  private readonly redisClient: any;

  constructor(@InjectQueue('webhooks-in') webhooksQueue: Queue) {
    // Bull expõe o cliente Redis; usamos para SET NX EX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.redisClient = (webhooksQueue as any)?.client;
  }

  private buildKey(params: IdempotencyParams, fingerprint: string): string {
    const canal = params.canal || 'unknown';
    const empresa = params.empresaId || 'na';
    const msg = params.messageId || 'no-message-id';
    return `idemp:webhook:${canal}:${empresa}:${msg}:${fingerprint}`;
  }

  private hashPayload(payload: any): string {
    try {
      const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return createHash('sha256').update(json).digest('hex');
    } catch (error) {
      this.logger.warn(`Não foi possível gerar hash do payload: ${error?.message}`);
      return 'hash-error';
    }
  }

  async isDuplicateAndStore(params: IdempotencyParams): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn('Redis não disponível para idempotência; prosseguindo sem dedupe.');
      return false;
    }

    const fingerprint = params.messageId || this.hashPayload(params.payload) || 'hash-error';
    const key = this.buildKey(params, fingerprint);
    const ttlSeconds = parseInt(process.env.WEBHOOK_IDEMP_TTL_SECONDS || '259200', 10); // 3 dias padrão

    try {
      const result = await this.redisClient.set(key, '1', 'NX', 'EX', ttlSeconds);
      const duplicate = result !== 'OK';

      if (duplicate) {
        this.logger.warn(`Webhook duplicado detectado (key=${key}). Ignorando.`);
      }

      return duplicate;
    } catch (error) {
      this.logger.error(`Erro na verificação de idempotência: ${error?.message}`);
      return false;
    }
  }
}
