import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';
import { PlanoModulo } from './entities/plano-modulo.entity';
import { AssinaturaEmpresa } from './entities/assinatura-empresa.entity';
import { PlanosService } from './planos.service';
import { PlanosController } from './planos.controller';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';
import { AssinaturaDueDateSchedulerService } from './assinatura-due-date-scheduler.service';
import { TenantBillingPolicyService } from './tenant-billing-policy.service';
import { MercadoPagoModule } from '../mercado-pago/mercado-pago.module';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { Pagamento } from '../faturamento/entities/pagamento.entity';
import { BillingEvent } from '../faturamento/entities/billing-event.entity';
import { BillingSelfServiceController } from './billing-self-service.controller';
import { BillingSelfServiceService } from './billing-self-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plano,
      ModuloSistema,
      PlanoModulo,
      AssinaturaEmpresa,
      User,
      Cliente,
      Empresa,
      Fatura,
      Pagamento,
      BillingEvent,
    ]),
    forwardRef(() => MercadoPagoModule),
  ],
  controllers: [PlanosController, AssinaturasController, BillingSelfServiceController],
  providers: [
    PlanosService,
    AssinaturasService,
    AssinaturaDueDateSchedulerService,
    TenantBillingPolicyService,
    BillingSelfServiceService,
  ],
  exports: [
    PlanosService,
    AssinaturasService,
    AssinaturaDueDateSchedulerService,
    TenantBillingPolicyService,
    BillingSelfServiceService,
  ],
})
export class PlanosModule {}
