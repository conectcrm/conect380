import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoController } from './mercado-pago.controller';
import { MercadoPagoService } from './mercado-pago.service';
import { AssinaturaEmpresa } from '../planos/entities/assinatura-empresa.entity';
import { BillingEvent } from '../faturamento/entities/billing-event.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AssinaturaEmpresa, BillingEvent])],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
