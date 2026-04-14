import { GatewayProvider } from '../entities/configuracao-gateway.entity';
import { MercadoPagoPaymentProviderService } from './mercado-pago-payment-provider.service';
import { PaymentProviderRegistryService } from './payment-provider-registry.service';

describe('PaymentProviderRegistryService', () => {
  it('resolve provider mercadopago', () => {
    const mercadoPagoProvider = {
      provider: GatewayProvider.MERCADO_PAGO,
      assertCheckoutReady: jest.fn(),
      createPreference: jest.fn(),
      reconcileRecentPayments: jest.fn(),
    } as unknown as MercadoPagoPaymentProviderService;

    const service = new PaymentProviderRegistryService(mercadoPagoProvider);
    const resolved = service.getProvider(GatewayProvider.MERCADO_PAGO);

    expect(resolved).toBe(mercadoPagoProvider);
  });

  it('throws for unsupported provider', () => {
    const mercadoPagoProvider = {
      provider: GatewayProvider.MERCADO_PAGO,
      assertCheckoutReady: jest.fn(),
      createPreference: jest.fn(),
      reconcileRecentPayments: jest.fn(),
    } as unknown as MercadoPagoPaymentProviderService;

    const service = new PaymentProviderRegistryService(mercadoPagoProvider);

    expect(() => service.getProvider(GatewayProvider.STRIPE)).toThrow(
      'Provider de pagamento nao suportado: stripe',
    );
  });
});

