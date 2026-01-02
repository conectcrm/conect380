import { NotificationRetryMeta } from './retry-strategy';

// Presets para reutilização pelos produtores de canais
export const RETRY_META_TRANSIENT: NotificationRetryMeta = { statusCode: 503 };
export const RETRY_META_RATE_LIMIT: NotificationRetryMeta = { statusCode: 429 };
