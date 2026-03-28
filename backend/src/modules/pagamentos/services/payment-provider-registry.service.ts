import { Injectable, NotImplementedException } from '@nestjs/common';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';
import { MercadoPagoPaymentProviderService } from './mercado-pago-payment-provider.service';
import { PaymentProvider } from './payment-provider.contract';

@Injectable()
export class PaymentProviderRegistryService {
  private readonly providers: ReadonlyMap<GatewayProvider, PaymentProvider>;

  constructor(private readonly mercadoPagoProvider: MercadoPagoPaymentProviderService) {
    this.providers = new Map<GatewayProvider, PaymentProvider>([
      [this.mercadoPagoProvider.provider, this.mercadoPagoProvider],
    ]);
  }

  getProvider(provider: GatewayProvider): PaymentProvider {
    const resolved = this.providers.get(provider);
    if (!resolved) {
      throw new NotImplementedException(`Provider de pagamento nao suportado: ${provider}`);
    }
    return resolved;
  }
}

