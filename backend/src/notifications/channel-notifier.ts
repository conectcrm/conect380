import { Logger } from '@nestjs/common';
import { NotificationChannelsService } from './notification-channels.service';
import { ChannelPolicyKey, ChannelPolicyEntry, getChannelPolicy } from './channel-policy';

export type ChannelTargets = {
  phone?: string;
  pushToken?: string;
  userId?: string;
};

export interface NotifyByPolicyParams {
  policyKey: ChannelPolicyKey;
  channels: NotificationChannelsService;
  logger: Logger;
  targets: ChannelTargets;
  message: string;
  context?: Record<string, any>;
}

export async function notifyByPolicy(params: NotifyByPolicyParams) {
  const entries = getChannelPolicy(params.policyKey);
  if (!entries.length) return;

  const { phone, pushToken } = params.targets;

  const senders: Array<Promise<void>> = [];

  const enqueue = (entry: ChannelPolicyEntry) => {
    switch (entry.channel) {
      case 'whatsapp': {
        if (!phone) {
          params.logger?.debug?.(`Canal whatsapp ignorado: phone ausente para policy=${params.policyKey}`);
          return;
        }
        senders.push(
          params.channels.sendWhatsapp({
            to: phone,
            message: params.message,
            context: params.context,
            retryMeta: entry.retryMeta,
          }),
        );
        return;
      }
      case 'sms': {
        if (!phone) {
          params.logger?.debug?.(`Canal sms ignorado: phone ausente para policy=${params.policyKey}`);
          return;
        }
        senders.push(
          params.channels.sendSms({
            to: phone,
            message: params.message,
            context: params.context,
            retryMeta: entry.retryMeta,
          }),
        );
        return;
      }
      case 'push': {
        if (!pushToken) {
          params.logger?.debug?.(`Canal push ignorado: pushToken ausente para policy=${params.policyKey}`);
          return;
        }
        senders.push(
          params.channels.sendPush({
            token: pushToken,
            body: params.message,
            context: params.context,
            retryMeta: entry.retryMeta,
            userId: params.targets.userId,
          }),
        );
        return;
      }
      default:
        params.logger?.debug?.(`Canal não suportado em policy=${params.policyKey}: ${entry.channel}`);
    }
  };

  entries.forEach(enqueue);

  try {
    await Promise.allSettled(senders);
  } catch (err) {
    // Todas as promises já foram tratadas com settled; este catch é defensivo
    params.logger?.debug?.(`Falha ao notificar canais de policy=${params.policyKey}: ${err?.message || err}`);
  }
}
