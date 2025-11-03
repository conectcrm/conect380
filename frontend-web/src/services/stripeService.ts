import { loadStripe, Stripe, StripeError } from '@stripe/stripe-js';

interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  metadata: Record<string, string>;
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: string;
          interval_count: number;
        };
      };
    }>;
  };
}

interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret: string;
}

interface CreatePaymentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  automatic_payment_methods?: {
    enabled: boolean;
  };
}

interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

class StripeService {
  private stripe: Stripe | null = null;
  private apiBaseUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn('⚠️ Stripe publishable key não encontrada. Funcionalidades de pagamento podem não funcionar.');
      return;
    }

    try {
      this.stripe = await loadStripe(publishableKey);
      console.log('✅ Stripe inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);
    }
  }

  // Criar cliente no Stripe
  async criarCustomer(dados: {
    email: string;
    nome: string;
    telefone?: string;
    endereco?: any;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    try {
      console.log('🔄 Criando cliente no Stripe:', dados.email);

      const response = await fetch(`${this.apiBaseUrl}/stripe/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          email: dados.email,
          name: dados.nome,
          phone: dados.telefone,
          address: dados.endereco,
          metadata: {
            source: 'conectcrm',
            created_at: new Date().toISOString(),
            ...dados.metadata
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar cliente no Stripe');
      }

      const customer = await response.json();
      console.log('✅ Cliente criado no Stripe:', customer.id);

      return customer;
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }
  }

  // Criar pagamento único (Payment Intent)
  async criarPagamento(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      console.log('🔄 Criando pagamento no Stripe:', params);

      const response = await fetch(`${this.apiBaseUrl}/stripe/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // Converter para centavos
          currency: params.currency || 'brl',
          customer: params.customerId,
          description: params.description,
          metadata: {
            source: 'conectcrm',
            created_at: new Date().toISOString(),
            ...params.metadata
          },
          automatic_payment_methods: params.automatic_payment_methods || {
            enabled: true
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar pagamento');
      }

      const paymentIntent = await response.json();
      console.log('✅ Pagamento criado:', paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      throw error;
    }
  }

  // Criar assinatura recorrente
  async criarAssinatura(params: CreateSubscriptionParams): Promise<StripeSubscription> {
    try {
      console.log('🔄 Criando assinatura no Stripe:', params);

      const response = await fetch(`${this.apiBaseUrl}/stripe/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          customer: params.customerId,
          items: [{
            price: params.priceId
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
          metadata: {
            source: 'conectcrm',
            created_at: new Date().toISOString(),
            ...params.metadata
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar assinatura');
      }

      const subscription = await response.json();
      console.log('✅ Assinatura criada:', subscription.id);

      return subscription;
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      throw error;
    }
  }

  // Confirmar pagamento no frontend
  async confirmarPagamento(clientSecret: string, elementos: any): Promise<{ error?: StripeError; paymentIntent?: any }> {
    if (!this.stripe) {
      throw new Error('Stripe não foi inicializado');
    }

    try {
      console.log('🔄 Confirmando pagamento...');

      const result = await this.stripe.confirmPayment({
        elements: elementos,
        confirmParams: {
          return_url: `${window.location.origin}/billing/success`
        }
      });

      if (result.error) {
        console.error('❌ Erro ao confirmar pagamento:', result.error);
        return { error: result.error };
      }

      console.log('✅ Pagamento confirmado:', result.paymentIntent?.id);
      return { paymentIntent: result.paymentIntent };
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  // Cancelar assinatura
  async cancelarAssinatura(subscriptionId: string, cancelImediatamente: boolean = false): Promise<StripeSubscription> {
    try {
      console.log('🔄 Cancelando assinatura:', subscriptionId);

      const response = await fetch(`${this.apiBaseUrl}/stripe/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          cancel_at_period_end: !cancelImediatamente
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cancelar assinatura');
      }

      const subscription = await response.json();
      console.log('✅ Assinatura cancelada:', subscription.id);

      return subscription;
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  // Reativar assinatura
  async reativarAssinatura(subscriptionId: string): Promise<StripeSubscription> {
    try {
      console.log('🔄 Reativando assinatura:', subscriptionId);

      const response = await fetch(`${this.apiBaseUrl}/stripe/subscriptions/${subscriptionId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao reativar assinatura');
      }

      const subscription = await response.json();
      console.log('✅ Assinatura reativada:', subscription.id);

      return subscription;
    } catch (error) {
      console.error('❌ Erro ao reativar assinatura:', error);
      throw error;
    }
  }

  // Listar assinaturas de um cliente
  async listarAssinaturas(customerId: string): Promise<StripeSubscription[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/stripe/customers/${customerId}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao listar assinaturas');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar assinaturas:', error);
      throw error;
    }
  }

  // Obter detalhes de um pagamento
  async obterPagamento(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/stripe/payment-intents/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao obter pagamento');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao obter pagamento:', error);
      throw error;
    }
  }

  // Processar webhook do Stripe
  async processarWebhook(eventType: string, data: any): Promise<void> {
    try {
      console.log('🔄 Processando webhook Stripe:', eventType);

      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePagamentoSucesso(data);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePagamentoFalhou(data);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleAssinaturaAtualizada(data);
          break;

        case 'customer.subscription.deleted':
          await this.handleAssinaturaCancelada(data);
          break;

        default:
          console.log('ℹ️ Evento webhook não tratado:', eventType);
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Handlers internos para webhooks
  private async handlePagamentoSucesso(paymentIntent: any): Promise<void> {
    console.log('✅ Pagamento bem-sucedido:', paymentIntent.id);

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('stripe:payment:success', {
      detail: { paymentIntent }
    }));
  }

  private async handlePagamentoFalhou(paymentIntent: any): Promise<void> {
    console.log('❌ Pagamento falhou:', paymentIntent.id);

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('stripe:payment:failed', {
      detail: { paymentIntent }
    }));
  }

  private async handleAssinaturaAtualizada(subscription: any): Promise<void> {
    console.log('🔄 Assinatura atualizada:', subscription.id);

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('stripe:subscription:updated', {
      detail: { subscription }
    }));
  }

  private async handleAssinaturaCancelada(subscription: any): Promise<void> {
    console.log('❌ Assinatura cancelada:', subscription.id);

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('stripe:subscription:cancelled', {
      detail: { subscription }
    }));
  }

  // Utilitários
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  public formatarValor(valor: number, moeda: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda
    }).format(valor);
  }

  public getStripeInstance(): Stripe | null {
    return this.stripe;
  }
}

// Singleton instance
export const stripeService = new StripeService();
export default stripeService;
