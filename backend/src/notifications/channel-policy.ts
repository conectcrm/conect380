import { NotificationRetryMeta } from './utils/retry-strategy';
import { RETRY_META_TRANSIENT, RETRY_META_RATE_LIMIT } from './utils/retry-presets';

export type ChannelPolicyKey =
  | 'sla-alert'
  | 'notifications-backlog'
  | 'notifications-breaker'
  | 'ticket-priority-high'
  | 'ticket-escalation';

export type ChannelName = 'whatsapp' | 'sms' | 'push';

export interface ChannelPolicyEntry {
  channel: ChannelName;
  retryMeta?: NotificationRetryMeta;
}

export const channelPolicy: Record<ChannelPolicyKey, ChannelPolicyEntry[]> = {
  'sla-alert': [
    { channel: 'whatsapp', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'sms', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'push', retryMeta: RETRY_META_TRANSIENT },
  ],
  'notifications-backlog': [
    { channel: 'whatsapp', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'sms', retryMeta: RETRY_META_TRANSIENT },
  ],
  'notifications-breaker': [
    { channel: 'whatsapp', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'sms', retryMeta: RETRY_META_TRANSIENT },
  ],
  'ticket-priority-high': [
    { channel: 'whatsapp', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'sms', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'push', retryMeta: RETRY_META_TRANSIENT },
  ],
  'ticket-escalation': [
    { channel: 'whatsapp', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'sms', retryMeta: RETRY_META_TRANSIENT },
    { channel: 'push', retryMeta: RETRY_META_TRANSIENT },
  ],
};

export function getChannelPolicy(key: ChannelPolicyKey): ChannelPolicyEntry[] {
  return channelPolicy[key] || [];
}

export const RATE_LIMIT_POLICY = RETRY_META_RATE_LIMIT;
