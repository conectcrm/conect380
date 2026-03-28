import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoController } from './mercado-pago.controller';
import { MercadoPagoService } from './mercado-pago.service';
import { AssinaturaEmpresa } from '../planos/entities/assinatura-empresa.entity';
import { BillingEvent } from '../faturamento/entities/billing-event.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { Pagamento } from '../faturamento/entities/pagamento.entity';
import { FaturamentoModule } from '../faturamento/faturamento.module';
import { EmpresasModule } from '../../empresas/empresas.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => FaturamentoModule),
    forwardRef(() => EmpresasModule),
    TypeOrmModule.forFeature([AssinaturaEmpresa, BillingEvent, Fatura, Pagamento]),
  ],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
