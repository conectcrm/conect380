import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracaoGateway } from './entities/configuracao-gateway.entity';
import { TransacaoGateway } from './entities/transacao-gateway.entity';
import { GatewayWebhookEvento } from './entities/gateway-webhook-evento.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { Pagamento } from '../faturamento/entities/pagamento.entity';
import { FaturamentoModule } from '../faturamento/faturamento.module';
import { MercadoPagoModule } from '../mercado-pago/mercado-pago.module';
import { ConfiguracaoGatewayController } from './controllers/configuracao-gateway.controller';
import { GatewayTransacoesController } from './controllers/pagamentos.controller';
import { GatewayWebhookController } from './controllers/gateway-webhook.controller';
import { ConfiguracaoGatewayService } from './services/configuracao-gateway.service';
import { PagamentosGatewayService } from './services/pagamentos.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { MercadoPagoPaymentProviderService } from './services/mercado-pago-payment-provider.service';
import { PaymentProviderRegistryService } from './services/payment-provider-registry.service';

@Module({
  imports: [
    FaturamentoModule,
    forwardRef(() => MercadoPagoModule),
    TypeOrmModule.forFeature([
      ConfiguracaoGateway,
      TransacaoGateway,
      GatewayWebhookEvento,
      Fatura,
      Pagamento,
    ]),
  ],
  controllers: [
    ConfiguracaoGatewayController,
    GatewayTransacoesController,
    GatewayWebhookController,
  ],
  providers: [
    ConfiguracaoGatewayService,
    PagamentosGatewayService,
    GatewayWebhookService,
    MercadoPagoPaymentProviderService,
    PaymentProviderRegistryService,
  ],
  exports: [
    ConfiguracaoGatewayService,
    PagamentosGatewayService,
    GatewayWebhookService,
    PaymentProviderRegistryService,
  ],
})
export class PagamentosModule {}
