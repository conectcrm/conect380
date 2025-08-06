import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Customer, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private mercadoPago: MercadoPagoConfig;
  private customerApi: Customer;
  private preferenceApi: Preference;
  private paymentApi: Payment;

  constructor(private configService: ConfigService) {
    this.initializeMercadoPago();
  }

  private initializeMercadoPago() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('Access Token do Mercado Pago não configurado');
      return;
    }

    try {
      this.mercadoPago = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
          idempotencyKey: 'DEV',
        }
      });

      this.customerApi = new Customer(this.mercadoPago);
      this.preferenceApi = new Preference(this.mercadoPago);
      this.paymentApi = new Payment(this.mercadoPago);

      this.logger.log('Mercado Pago inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Mercado Pago:', error);
    }
  }

  async createCustomer(customerData: any) {
    try {
      const customer = await this.customerApi.create({
        body: {
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          phone: customerData.phone,
          identification: customerData.identification,
          address: customerData.address,
          date_registered: new Date().toISOString(),
          description: `Cliente ConectCRM - ${customerData.email}`,
          default_address: customerData.address ? customerData.address.street_name : undefined,
          default_card: undefined
        }
      });

      this.logger.log(`Cliente criado: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await this.customerApi.get({ customerId });
      return customer;
    } catch (error) {
      this.logger.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  async createPreference(preferenceData: any) {
    try {
      const preference = await this.preferenceApi.create({
        body: {
          items: preferenceData.items,
          payer: {
            name: preferenceData.payer.name,
            surname: preferenceData.payer.surname,
            email: preferenceData.payer.email,
            phone: preferenceData.payer.phone,
            identification: preferenceData.payer.identification,
            address: preferenceData.payer.address
          },
          back_urls: preferenceData.back_urls,
          auto_return: preferenceData.auto_return,
          payment_methods: preferenceData.payment_methods,
          notification_url: preferenceData.notification_url,
          statement_descriptor: preferenceData.statement_descriptor,
          external_reference: preferenceData.external_reference,
          expires: preferenceData.expires,
          expiration_date_from: preferenceData.expiration_date_from,
          expiration_date_to: preferenceData.expiration_date_to,
          date_of_expiration: preferenceData.expiration_date_to,
          metadata: {
            origem: 'ConectCRM',
            timestamp: new Date().toISOString()
          }
        }
      });

      this.logger.log(`Preferência criada: ${preference.id}`);
      return preference;
    } catch (error) {
      this.logger.error('Erro ao criar preferência:', error);
      throw error;
    }
  }

  async createPixPayment(paymentData: any) {
    try {
      const payment = await this.paymentApi.create({
        body: {
          transaction_amount: paymentData.transaction_amount,
          description: paymentData.description,
          payment_method_id: 'pix',
          payer: {
            email: paymentData.payer.email,
            first_name: paymentData.payer.first_name,
            last_name: paymentData.payer.last_name,
            identification: paymentData.payer.identification
          },
          external_reference: paymentData.external_reference,
          notification_url: paymentData.notification_url,
          date_of_expiration: paymentData.date_of_expiration,
          metadata: {
            origem: 'ConectCRM',
            tipo: 'PIX',
            timestamp: new Date().toISOString()
          }
        }
      });

      this.logger.log(`Pagamento PIX criado: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PIX:', error);
      throw error;
    }
  }

  async createCardPayment(paymentData: any) {
    try {
      const payment = await this.paymentApi.create({
        body: {
          transaction_amount: paymentData.transaction_amount,
          token: paymentData.token,
          description: paymentData.description,
          installments: paymentData.installments,
          payment_method_id: paymentData.payment_method_id,
          issuer_id: paymentData.issuer_id,
          payer: {
            email: paymentData.payer.email,
            identification: paymentData.payer.identification
          },
          external_reference: paymentData.external_reference,
          notification_url: paymentData.notification_url,
          statement_descriptor: 'ConectCRM',
          metadata: {
            origem: 'ConectCRM',
            tipo: 'Cartão',
            parcelas: paymentData.installments,
            timestamp: new Date().toISOString()
          }
        }
      });

      this.logger.log(`Pagamento com cartão criado: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento com cartão:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.paymentApi.get({ id: paymentId });
      return payment;
    } catch (error) {
      this.logger.error('Erro ao buscar pagamento:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      // Usar a nova API do Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          amount: amount,
          metadata: {
            origem: 'ConectCRM',
            timestamp: new Date().toISOString()
          }
        })
      });

      const refund = await response.json();
      this.logger.log(`Estorno criado para pagamento ${paymentId}: ${refund.id || 'ID não disponível'}`);
      return refund;
    } catch (error) {
      this.logger.error('Erro ao estornar pagamento:', error);
      throw error;
    }
  }

  async validateWebhookSignature(body: any, signature: string, requestId: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');

      if (!webhookSecret) {
        this.logger.warn('Webhook secret não configurado, pulando validação');
        return true; // Em desenvolvimento, pode pular validação
      }

      // Extrair timestamp e hash da assinatura
      const signatureParts = signature.split(',');
      const timestamp = signatureParts.find(part => part.startsWith('ts='))?.split('=')[1];
      const hash = signatureParts.find(part => part.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !hash) {
        return false;
      }

      // Construir string para validação
      const dataString = `id:${body.data?.id};request-id:${requestId};ts:${timestamp};`;

      // Calcular HMAC
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(dataString);
      const expectedHash = hmac.digest('hex');

      return expectedHash === hash;
    } catch (error) {
      this.logger.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  async processWebhook(webhookData: any) {
    try {
      const { type, data, action } = webhookData;

      this.logger.log(`Processando webhook: ${type} - ${action}`);

      switch (type) {
        case 'payment':
          await this.handlePaymentWebhook(data.id, action);
          break;

        case 'plan':
          await this.handlePlanWebhook(data.id, action);
          break;

        case 'subscription':
          await this.handleSubscriptionWebhook(data.id, action);
          break;

        case 'invoice':
          await this.handleInvoiceWebhook(data.id, action);
          break;

        default:
          this.logger.log(`Tipo de webhook não tratado: ${type}`);
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async handlePaymentWebhook(paymentId: string, action: string) {
    try {
      const payment = await this.getPayment(paymentId);

      this.logger.log(`Webhook pagamento ${paymentId}: ${payment.status} - ${action}`);

      // Aqui você pode implementar lógica específica para cada status
      switch (payment.status) {
        case 'approved':
          await this.handleApprovedPayment(payment);
          break;

        case 'rejected':
          await this.handleRejectedPayment(payment);
          break;

        case 'pending':
          await this.handlePendingPayment(payment);
          break;

        case 'in_process':
          await this.handleProcessingPayment(payment);
          break;

        case 'cancelled':
          await this.handleCancelledPayment(payment);
          break;

        case 'refunded':
          await this.handleRefundedPayment(payment);
          break;
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook de pagamento:', error);
    }
  }

  private async handleApprovedPayment(payment: any) {
    this.logger.log(`Pagamento aprovado: ${payment.id}`);

    // Implementar lógica para pagamento aprovado
    // - Atualizar status da fatura
    // - Enviar email de confirmação
    // - Ativar serviços
    // - Registrar no sistema de faturamento
  }

  private async handleRejectedPayment(payment: any) {
    this.logger.log(`Pagamento rejeitado: ${payment.id}`);

    // Implementar lógica para pagamento rejeitado
    // - Notificar cliente
    // - Sugerir novos métodos de pagamento
    // - Registrar tentativa de pagamento
  }

  private async handlePendingPayment(payment: any) {
    this.logger.log(`Pagamento pendente: ${payment.id}`);

    // Implementar lógica para pagamento pendente
    // - Aguardar confirmação
    // - Enviar instruções de pagamento (PIX, boleto)
  }

  private async handleProcessingPayment(payment: any) {
    this.logger.log(`Pagamento em processamento: ${payment.id}`);

    // Implementar lógica para pagamento em processamento
    // - Aguardar confirmação bancária
  }

  private async handleCancelledPayment(payment: any) {
    this.logger.log(`Pagamento cancelado: ${payment.id}`);

    // Implementar lógica para pagamento cancelado
    // - Liberar reserva de produtos/serviços
    // - Notificar cliente
  }

  private async handleRefundedPayment(payment: any) {
    this.logger.log(`Pagamento estornado: ${payment.id}`);

    // Implementar lógica para pagamento estornado
    // - Desativar serviços
    // - Processar reembolso
    // - Notificar cliente
  }

  private async handlePlanWebhook(planId: string, action: string) {
    this.logger.log(`Webhook plano ${planId}: ${action}`);
    // Implementar lógica para planos de assinatura
  }

  private async handleSubscriptionWebhook(subscriptionId: string, action: string) {
    this.logger.log(`Webhook assinatura ${subscriptionId}: ${action}`);
    // Implementar lógica para assinaturas
  }

  private async handleInvoiceWebhook(invoiceId: string, action: string) {
    this.logger.log(`Webhook fatura ${invoiceId}: ${action}`);
    // Implementar lógica para faturas
  }

  async getPaymentMethods() {
    try {
      // Implementar busca de métodos de pagamento
      // Por enquanto, retorna métodos padrão do Brasil
      return {
        payment_methods: [
          {
            id: 'pix',
            name: 'PIX',
            payment_type_id: 'bank_transfer',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/pix.png'
          },
          {
            id: 'visa',
            name: 'Visa',
            payment_type_id: 'credit_card',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/visa.png'
          },
          {
            id: 'master',
            name: 'Mastercard',
            payment_type_id: 'credit_card',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/mastercard.png'
          },
          {
            id: 'bolbradesco',
            name: 'Boleto Bancário',
            payment_type_id: 'ticket',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/bank.png'
          }
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar métodos de pagamento:', error);
      throw error;
    }
  }

  async getInstallments(amount: number, paymentMethodId: string) {
    try {
      // Implementar busca de parcelas
      // Por enquanto, retorna parcelas padrão
      const maxInstallments = paymentMethodId === 'pix' ? 1 : 12;
      const installments = [];

      for (let i = 1; i <= maxInstallments; i++) {
        const installmentAmount = amount / i;
        const totalAmount = amount * (i > 6 ? 1 + (i - 6) * 0.02 : 1); // Juros após 6x

        installments.push({
          installments: i,
          installment_rate: i > 6 ? (i - 6) * 2 : 0,
          discount_rate: 0,
          reimbursement_rate: null,
          labels: i === 1 ? ['CFT_ZERO'] : [],
          min_allowed_amount: 5,
          max_allowed_amount: 30000,
          recommended_message: `${i}x de R$ ${installmentAmount.toFixed(2)}${i > 6 ? ` (com juros)` : ` sem juros`}`,
          installment_amount: installmentAmount,
          total_amount: totalAmount,
          payment_method_option_id: paymentMethodId
        });
      }

      return { installments };
    } catch (error) {
      this.logger.error('Erro ao buscar parcelas:', error);
      throw error;
    }
  }
}
