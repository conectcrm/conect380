import { NotImplementedException } from '@nestjs/common';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';
import {
  assertGatewayProviderEnabled,
  getEnabledGatewayProvidersFromEnv,
} from './gateway-provider-support.util';

describe('gateway-provider-support.util', () => {
  it('bloqueia todos os providers por padrao (default deny)', () => {
    const env = {} as NodeJS.ProcessEnv;

    expect(getEnabledGatewayProvidersFromEnv(env).size).toBe(0);
    expect(() => assertGatewayProviderEnabled(GatewayProvider.STRIPE, env)).toThrow(
      NotImplementedException,
    );
  });

  it('habilita providers a partir de lista por env', () => {
    const env = {
      PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS: 'stripe, mercado_pago ',
    } as NodeJS.ProcessEnv;

    const enabled = getEnabledGatewayProvidersFromEnv(env);

    expect(enabled.has(GatewayProvider.STRIPE)).toBe(true);
    expect(enabled.has(GatewayProvider.MERCADO_PAGO)).toBe(true);
    expect(enabled.has(GatewayProvider.PAGSEGURO)).toBe(false);
    expect(() => assertGatewayProviderEnabled(GatewayProvider.STRIPE, env)).not.toThrow();
  });

  it('aceita nomes do enum e flag global de bypass', () => {
    const envByKey = {
      PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS: 'PAGSEGURO',
    } as NodeJS.ProcessEnv;
    expect(() => assertGatewayProviderEnabled(GatewayProvider.PAGSEGURO, envByKey)).not.toThrow();

    const envBypass = {
      PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED: 'true',
    } as NodeJS.ProcessEnv;
    for (const provider of Object.values(GatewayProvider)) {
      expect(() => assertGatewayProviderEnabled(provider, envBypass)).not.toThrow();
    }
  });

  it('nao bloqueia em NODE_ENV=test sem configuracao explicita', () => {
    const env = { NODE_ENV: 'test' } as NodeJS.ProcessEnv;

    for (const provider of Object.values(GatewayProvider)) {
      expect(() => assertGatewayProviderEnabled(provider, env)).not.toThrow();
    }
  });
});
