import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_JWT_SECRET = 'conectcrm-dev-jwt-secret-change-me';
let hasWarnedFallback = false;

export function resolveJwtSecret(configService?: ConfigService): string {
  const secret =
    configService?.get<string>('JWT_SECRET')?.trim() || process.env.JWT_SECRET?.trim();
  const nodeEnv =
    configService?.get<string>('NODE_ENV')?.trim() || process.env.NODE_ENV?.trim() || 'development';

  if (secret) {
    return secret;
  }

  if (nodeEnv !== 'production') {
    if (!hasWarnedFallback) {
      // eslint-disable-next-line no-console
      console.warn(
        '[JWT] JWT_SECRET ausente; usando fallback apenas para ambiente local.',
      );
      hasWarnedFallback = true;
    }
    process.env.JWT_SECRET = DEV_FALLBACK_JWT_SECRET;
    return DEV_FALLBACK_JWT_SECRET;
  }

  throw new Error('JWT_SECRET is required in production');
}
