import { GatewayProvider } from '../entities/configuracao-gateway.entity';

export type PaymentProviderCheckoutPreference = {
  id?: string | null;
  init_point?: string | null;
  sandbox_init_point?: string | null;
};

export type PaymentProviderReconciliationSummary = {
  processed: number;
  errors: number;
};

export interface PaymentProvider {
  readonly provider: GatewayProvider;
  assertCheckoutReady(): void;
  createPreference(payload: Record<string, unknown>): Promise<PaymentProviderCheckoutPreference>;
  reconcileRecentPayments(options?: {
    lookbackHours?: number;
    limit?: number;
  }): Promise<PaymentProviderReconciliationSummary>;
}
