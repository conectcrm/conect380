import { API_BASE_URL } from './api';

interface MercadoPagoCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: {
    area_code: string;
    number: string;
  };
  identification: {
    type: string;
    number: string;
  };
  address: {
    street_name: string;
    street_number: number;
    zip_code: string;
  };
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  operation_type: string;
  date_created: string;
  date_approved: string;
  money_release_date: string;
  currency_id: string;
  transaction_amount: number;
  net_received_amount: number;
  total_paid_amount: number;
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  external_reference: string;
  description: string;
  payer: {
    id: string;
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  payment_method: {
    id: string;
    type: string;
  };
  point_of_interaction: {
    type: string;
    transaction_data: {
      qr_code_base64?: string;
      qr_code?: string;
      ticket_url?: string;
    };
  };
}

interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  items: Array<{
    id: string;
    title: string;
    currency_id: string;
    picture_url: string;
    description: string;
    category_id: string;
    quantity: number;
    unit_price: number;
  }>;
  payer: {
    name: string;
    surname: string;
    email: string;
    phone: {
      area_code: string;
      number: string;
    };
    identification: {
      type: string;
      number: string;
    };
    address: {
      street_name: string;
      street_number: number;
      zip_code: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  payment_methods: {
    excluded_payment_methods: Array<{ id: string }>;
    excluded_payment_types: Array<{ id: string }>;
    installments: number;
  };
  notification_url: string;
  statement_descriptor: string;
  external_reference: string;
  expires: boolean;
  expiration_date_from: string;
  expiration_date_to: string;
}

interface CreatePaymentParams {
  valor: number;
  descricao: string;
  email_pagador: string;
  referencia_externa: string;
  metodo_pagamento?: 'pix' | 'boleto' | 'cartao' | 'todos';
  vencimento?: string;
  dados_pagador?: {
    nome: string;
    sobrenome: string;
    documento: string;
    tipo_documento: 'CPF' | 'CNPJ';
    telefone?: string;
    endereco?: {
      rua: string;
      numero: number;
      cep: string;
      cidade: string;
      estado: string;
    };
  };
}

interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  cardToken?: string;
  valor: number;
  descricao: string;
  referencia_externa: string;
}

class MercadoPagoService {
  private apiBaseUrl = `${API_BASE_URL}/api`;
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    console.log('🔄 Inicializando Mercado Pago Service...');
    this.initializeMercadoPago();
  }

  private async initializeMercadoPago() {
    const publicKey = this.isProduction
      ? process.env.REACT_APP_MP_PUBLIC_KEY_PROD
      : process.env.REACT_APP_MP_PUBLIC_KEY_TEST;

    if (!publicKey) {
      console.warn(
        '⚠️ Chave pública do Mercado Pago não encontrada. Funcionalidades de pagamento podem não funcionar.',
      );
      return;
    }

    try {
      // Inicializar SDK do Mercado Pago se disponível
      if (typeof window !== 'undefined' && (window as any).MercadoPago) {
        (window as any).MercadoPago.configure({
          public_key: publicKey,
          locale: 'pt-BR',
        });
        console.log('✅ Mercado Pago SDK inicializado');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Mercado Pago:', error);
    }
  }

  // Criar cliente no Mercado Pago
  async criarCustomer(dados: {
    email: string;
    nome: string;
    sobrenome: string;
    documento: string;
    tipo_documento: 'CPF' | 'CNPJ';
    telefone?: string;
    endereco?: any;
  }): Promise<MercadoPagoCustomer> {
    try {
      console.log('🔄 Criando cliente no Mercado Pago:', dados.email);

      const response = await fetch(`${this.apiBaseUrl}/mercadopago/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          email: dados.email,
          first_name: dados.nome,
          last_name: dados.sobrenome,
          phone: dados.telefone
            ? {
              area_code: dados.telefone.substring(0, 2),
              number: dados.telefone.substring(2),
            }
            : undefined,
          identification: {
            type: dados.tipo_documento,
            number: dados.documento,
          },
          address: dados.endereco
            ? {
              street_name: dados.endereco.rua,
              street_number: dados.endereco.numero,
              zip_code: dados.endereco.cep,
            }
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar cliente no Mercado Pago');
      }

      const customer = await response.json();
      console.log('✅ Cliente criado no Mercado Pago:', customer.id);

      return customer;
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }
  }

  // Criar preferência de pagamento (Checkout Pro)
  async criarPreferencia(params: CreatePaymentParams): Promise<MercadoPagoPreference> {
    try {
      console.log('🔄 Criando preferência no Mercado Pago:', params);

      const response = await fetch(`${this.apiBaseUrl}/mercadopago/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          items: [
            {
              id: params.referencia_externa,
              title: params.descricao,
              currency_id: 'BRL',
              quantity: 1,
              unit_price: params.valor,
            },
          ],
          payer: {
            name: params.dados_pagador?.nome || '',
            surname: params.dados_pagador?.sobrenome || '',
            email: params.email_pagador,
            phone: params.dados_pagador?.telefone
              ? {
                area_code: params.dados_pagador.telefone.substring(0, 2),
                number: params.dados_pagador.telefone.substring(2),
              }
              : undefined,
            identification: params.dados_pagador
              ? {
                type: params.dados_pagador.tipo_documento,
                number: params.dados_pagador.documento,
              }
              : undefined,
            address: params.dados_pagador?.endereco
              ? {
                street_name: params.dados_pagador.endereco.rua,
                street_number: params.dados_pagador.endereco.numero,
                zip_code: params.dados_pagador.endereco.cep,
              }
              : undefined,
          },
          back_urls: {
            success: `${window.location.origin}/billing/success`,
            failure: `${window.location.origin}/billing/error`,
            pending: `${window.location.origin}/billing/pending`,
          },
          auto_return: 'approved',
          payment_methods: this.getPaymentMethodsConfig(params.metodo_pagamento),
          notification_url: `${this.apiBaseUrl}/mercadopago/webhooks`,
          statement_descriptor: 'ConectCRM',
          external_reference: params.referencia_externa,
          expires: !!params.vencimento,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to:
            params.vencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar preferência');
      }

      const preference = await response.json();
      console.log('✅ Preferência criada:', preference.id);

      return preference;
    } catch (error) {
      console.error('❌ Erro ao criar preferência:', error);
      throw error;
    }
  }

  // Criar pagamento PIX
  async criarPagamentoPix(params: CreatePaymentParams): Promise<MercadoPagoPayment> {
    try {
      console.log('🔄 Criando pagamento PIX:', params);

      const response = await fetch(`${this.apiBaseUrl}/mercadopago/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          transaction_amount: params.valor,
          description: params.descricao,
          payment_method_id: 'pix',
          payer: {
            email: params.email_pagador,
            first_name: params.dados_pagador?.nome || '',
            last_name: params.dados_pagador?.sobrenome || '',
            identification: params.dados_pagador
              ? {
                type: params.dados_pagador.tipo_documento,
                number: params.dados_pagador.documento,
              }
              : undefined,
          },
          external_reference: params.referencia_externa,
          notification_url: `${this.apiBaseUrl}/mercadopago/webhooks`,
          date_of_expiration:
            params.vencimento || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar pagamento PIX');
      }

      const payment = await response.json();
      console.log('✅ Pagamento PIX criado:', payment.id);

      return payment;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento PIX:', error);
      throw error;
    }
  }

  // Criar pagamento com cartão
  async criarPagamentoCartao(
    params: CreatePaymentParams & { cardToken: string; installments: number },
  ): Promise<MercadoPagoPayment> {
    try {
      console.log('🔄 Criando pagamento com cartão:', params);

      const response = await fetch(`${this.apiBaseUrl}/mercadopago/payments/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          transaction_amount: params.valor,
          token: params.cardToken,
          description: params.descricao,
          installments: params.installments,
          payment_method_id: 'visa', // Será detectado automaticamente pelo token
          payer: {
            email: params.email_pagador,
            identification: params.dados_pagador
              ? {
                type: params.dados_pagador.tipo_documento,
                number: params.dados_pagador.documento,
              }
              : undefined,
          },
          external_reference: params.referencia_externa,
          notification_url: `${this.apiBaseUrl}/mercadopago/webhooks`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar pagamento com cartão');
      }

      const payment = await response.json();
      console.log('✅ Pagamento com cartão criado:', payment.id);

      return payment;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento com cartão:', error);
      throw error;
    }
  }

  // Obter status de um pagamento
  async obterPagamento(paymentId: string): Promise<MercadoPagoPayment> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/mercadopago/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
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

  // Estornar pagamento
  async estornarPagamento(paymentId: string, valor?: number): Promise<any> {
    try {
      console.log('🔄 Estornando pagamento:', paymentId);

      const response = await fetch(`${this.apiBaseUrl}/mercadopago/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          amount: valor, // Se não informado, estorna valor total
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao estornar pagamento');
      }

      const refund = await response.json();
      console.log('✅ Pagamento estornado:', refund.id);

      return refund;
    } catch (error) {
      console.error('❌ Erro ao estornar pagamento:', error);
      throw error;
    }
  }

  // Processar webhook do Mercado Pago
  async processarWebhook(eventType: string, data: any): Promise<void> {
    try {
      console.log('🔄 Processando webhook Mercado Pago:', eventType);

      switch (eventType) {
        case 'payment':
          await this.handlePagamentoWebhook(data);
          break;

        case 'plan':
          await this.handlePlanoWebhook(data);
          break;

        case 'subscription':
          await this.handleAssinaturaWebhook(data);
          break;

        default:
          console.log('ℹ️ Evento webhook não tratado:', eventType);
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Configuração de métodos de pagamento
  private getPaymentMethodsConfig(metodo?: 'pix' | 'boleto' | 'cartao' | 'todos') {
    switch (metodo) {
      case 'pix':
        return {
          excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }],
          installments: 1,
        };

      case 'boleto':
        return {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'bank_transfer' },
          ],
          installments: 1,
        };

      case 'cartao':
        return {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'bank_transfer' }],
          installments: 12,
        };

      default:
        return {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12,
        };
    }
  }

  // Handlers internos para webhooks
  private async handlePagamentoWebhook(data: any): Promise<void> {
    const pagamento = await this.obterPagamento(data.id);

    console.log('🔔 Webhook pagamento:', pagamento.status);

    // Disparar eventos personalizados baseados no status
    switch (pagamento.status) {
      case 'approved':
        window.dispatchEvent(
          new CustomEvent('mercadopago:payment:approved', {
            detail: { payment: pagamento },
          }),
        );
        break;

      case 'rejected':
        window.dispatchEvent(
          new CustomEvent('mercadopago:payment:rejected', {
            detail: { payment: pagamento },
          }),
        );
        break;

      case 'pending':
        window.dispatchEvent(
          new CustomEvent('mercadopago:payment:pending', {
            detail: { payment: pagamento },
          }),
        );
        break;

      case 'in_process':
        window.dispatchEvent(
          new CustomEvent('mercadopago:payment:processing', {
            detail: { payment: pagamento },
          }),
        );
        break;
    }
  }

  private async handlePlanoWebhook(data: any): Promise<void> {
    console.log('🔔 Webhook plano:', data);
  }

  private async handleAssinaturaWebhook(data: any): Promise<void> {
    console.log('🔔 Webhook assinatura:', data);
  }

  // Utilitários
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  public formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  public gerarQRCodePix(qrCodeBase64: string): string {
    return `data:image/png;base64,${qrCodeBase64}`;
  }

  // Status helpers
  public getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'yellow';
      case 'in_process':
        return 'blue';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  }

  public getStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
        return 'Pendente';
      case 'in_process':
        return 'Processando';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  }
}

// Singleton instance
export const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;
