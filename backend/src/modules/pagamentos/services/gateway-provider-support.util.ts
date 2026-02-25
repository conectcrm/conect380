import { NotImplementedException } from '@nestjs/common';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';

const ALL_GATEWAY_PROVIDERS = Object.values(GatewayProvider);

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function resolveProviderToken(token: string): GatewayProvider | null {
  const normalized = normalizeToken(token);

  const byValue = ALL_GATEWAY_PROVIDERS.find((provider) => provider === normalized);
  if (byValue) {
    return byValue;
  }

  const byKey = Object.entries(GatewayProvider).find(
    ([key]) => normalizeToken(key) === normalized,
  )?.[1];

  return byKey ?? null;
}

export function getEnabledGatewayProvidersFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): Set<GatewayProvider> {
  const nodeEnv = normalizeToken(env.NODE_ENV || '');

  if (normalizeToken(env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED || '') === 'true') {
    return new Set(ALL_GATEWAY_PROVIDERS);
  }

  const rawList = env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS || '';
  if (!rawList.trim() && nodeEnv === 'test') {
    return new Set(ALL_GATEWAY_PROVIDERS);
  }

  const enabled = new Set<GatewayProvider>();

  for (const token of rawList.split(',')) {
    if (!token.trim()) continue;
    const provider = resolveProviderToken(token);
    if (provider) {
      enabled.add(provider);
    }
  }

  return enabled;
}

export function shouldLogGatewayProviderBlockedInEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const nodeEnv = normalizeToken(env.NODE_ENV || '');
  const appEnv = normalizeToken(env.APP_ENV || '');
  const isJestRuntime = typeof env.JEST_WORKER_ID === 'string' && env.JEST_WORKER_ID.length > 0;
  const isTest = isJestRuntime || nodeEnv === 'test' || appEnv === 'test';

  if (!isTest) {
    return true;
  }

  return normalizeToken(env.GATEWAY_FEATURE_GATE_LOGS_IN_TEST || '') === 'true';
}

export function assertGatewayProviderEnabled(
  provider: GatewayProvider,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const enabled = getEnabledGatewayProvidersFromEnv(env);

  if (enabled.has(provider)) {
    return;
  }

  throw new NotImplementedException(
    `Gateway ${provider} nao esta habilitado neste ambiente. Configure PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS ou use PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=true apenas para desenvolvimento/homologacao.`,
  );
}
