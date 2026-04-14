import { Injectable } from '@nestjs/common';
import { MercadoPagoService } from '../../mercado-pago/mercado-pago.service';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';
import {
  PaymentProvider,
  PaymentProviderCheckoutPreference,
  PaymentProviderReconciliationSummary,
} from './payment-provider.contract';

@Injectable()
export class MercadoPagoPaymentProviderService implements PaymentProvider {
  readonly provider = GatewayProvider.MERCADO_PAGO;

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  assertCheckoutReady(): void {
    this.mercadoPagoService.assertCheckoutReady();
  }

  async createPreference(
    payload: Record<string, unknown>,
  ): Promise<PaymentProviderCheckoutPreference> {
    return this.mercadoPagoService.createPreference(payload);
  }

  async reconcileRecentPayments(options?: {
    lookbackHours?: number;
    limit?: number;
  }): Promise<PaymentProviderReconciliationSummary> {
    return this.mercadoPagoService.reconcileRecentPayments(options);
  }
}

