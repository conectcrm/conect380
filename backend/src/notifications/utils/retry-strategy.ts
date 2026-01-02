import { BackoffOptions } from 'bull';

export type NotificationRetryMeta = {
  statusCode?: number;
  code?: string;
  retryAfterMs?: number;
};

export type RetryDecision = {
  attempts: number;
  backoff: BackoffOptions;
};

// Pequeno jitter para evitar thundering herd em casos de retry simultâneo
const jitter = (base: number, factor = 0.2) => {
  const delta = base * factor;
  const min = base - delta;
  const max = base + delta;
  return Math.max(0, Math.floor(Math.random() * (max - min + 1) + min));
};

const DEFAULT_ATTEMPTS = 5;
const MAX_RETRY_AFTER_MS = 120_000; // 2min cap

export function notificationRetryStrategy(error?: NotificationRetryMeta): RetryDecision {
  const status = error?.statusCode;
  const retryAfter = error?.retryAfterMs;

  // 4xx (exceto 429): não retentar
  if (status && status >= 400 && status < 500 && status !== 429) {
    return {
      attempts: 1,
      backoff: { type: 'fixed', delay: 0 },
    };
  }

  // 429: respeitar Retry-After, com limite
  if (status === 429) {
    const delay = jitter(Math.min(retryAfter ?? 10_000, MAX_RETRY_AFTER_MS));
    return {
      attempts: DEFAULT_ATTEMPTS,
      backoff: { type: 'fixed', delay },
    };
  }

  // 5xx/timeouts: backoff exponencial com base 5s + jitter
  return {
    attempts: DEFAULT_ATTEMPTS,
    backoff: { type: 'exponential', delay: jitter(5000) },
  };
}