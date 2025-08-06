import { Controller, Post, Get, Body, Param, Headers, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';

export interface CreateCustomerDto {
  email: string;
  first_name: string;
  last_name: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: string;
    number: string;
  };
  address?: {
    street_name: string;
    street_number: number;
    zip_code: string;
  };
}

export interface CreatePreferenceDto {
  items: Array<{
    id: string;
    title: string;
    currency_id: string;
    quantity: number;
    unit_price: number;
  }>;
  payer: {
    name: string;
    surname: string;
    email: string;
    phone?: {
      area_code: string;
      number: string;
    };
    identification?: {
      type: string;
      number: string;
    };
    address?: {
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
  payment_methods: any;
  notification_url: string;
  statement_descriptor: string;
  external_reference: string;
  expires: boolean;
  expiration_date_from: string;
  expiration_date_to: string;
}

export interface CreatePixPaymentDto {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference: string;
  notification_url: string;
  date_of_expiration: string;
}

export interface CreateCardPaymentDto {
  transaction_amount: number;
  token: string;
  description: string;
  installments: number;
  payment_method_id: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference: string;
  notification_url: string;
}

@Controller('mercadopago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(private readonly mercadoPagoService: MercadoPagoService) { }

  @Post('customers')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      this.logger.log('Criando cliente no Mercado Pago');
      return await this.mercadoPagoService.createCustomer(createCustomerDto);
    } catch (error) {
      this.logger.error('Erro ao criar cliente:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('customers/:id')
  async getCustomer(@Param('id') customerId: string) {
    try {
      return await this.mercadoPagoService.getCustomer(customerId);
    } catch (error) {
      this.logger.error('Erro ao buscar cliente:', error);
      throw new HttpException(
        error.message || 'Cliente não encontrado',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post('preferences')
  async createPreference(@Body() createPreferenceDto: CreatePreferenceDto) {
    try {
      this.logger.log('Criando preferência no Mercado Pago');
      return await this.mercadoPagoService.createPreference(createPreferenceDto);
    } catch (error) {
      this.logger.error('Erro ao criar preferência:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('payments/pix')
  async createPixPayment(@Body() createPixPaymentDto: CreatePixPaymentDto) {
    try {
      this.logger.log('Criando pagamento PIX');
      return await this.mercadoPagoService.createPixPayment(createPixPaymentDto);
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PIX:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('payments/card')
  async createCardPayment(@Body() createCardPaymentDto: CreateCardPaymentDto) {
    try {
      this.logger.log('Criando pagamento com cartão');
      return await this.mercadoPagoService.createCardPayment(createCardPaymentDto);
    } catch (error) {
      this.logger.error('Erro ao criar pagamento com cartão:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('payments/:id')
  async getPayment(@Param('id') paymentId: string) {
    try {
      return await this.mercadoPagoService.getPayment(paymentId);
    } catch (error) {
      this.logger.error('Erro ao buscar pagamento:', error);
      throw new HttpException(
        error.message || 'Pagamento não encontrado',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post('payments/:id/refund')
  async refundPayment(@Param('id') paymentId: string, @Body() body: { amount?: number }) {
    try {
      this.logger.log(`Estornando pagamento: ${paymentId}`);
      return await this.mercadoPagoService.refundPayment(paymentId, body.amount);
    } catch (error) {
      this.logger.error('Erro ao estornar pagamento:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhooks')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string
  ) {
    try {
      this.logger.log(`Webhook recebido: ${body.type} - ID: ${requestId}`);

      // Validar assinatura do webhook
      const isValid = await this.mercadoPagoService.validateWebhookSignature(
        body,
        signature,
        requestId
      );

      if (!isValid) {
        this.logger.warn('Webhook com assinatura inválida');
        throw new HttpException('Assinatura inválida', HttpStatus.UNAUTHORIZED);
      }

      // Processar webhook baseado no tipo
      await this.mercadoPagoService.processWebhook(body);

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('payment-methods')
  async getPaymentMethods() {
    try {
      return await this.mercadoPagoService.getPaymentMethods();
    } catch (error) {
      this.logger.error('Erro ao buscar métodos de pagamento:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('installments')
  async getInstallments(@Param('amount') amount: number, @Param('paymentMethodId') paymentMethodId: string) {
    try {
      return await this.mercadoPagoService.getInstallments(amount, paymentMethodId);
    } catch (error) {
      this.logger.error('Erro ao buscar parcelas:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
