import { Module } from '@nestjs/common';
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
import { MercadoPagoModule } from '../mercado-pago/mercado-pago.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plano, ModuloSistema, PlanoModulo, AssinaturaEmpresa]),
    MercadoPagoModule,
  ],
  controllers: [PlanosController, AssinaturasController],
  providers: [PlanosService, AssinaturasService, AssinaturaDueDateSchedulerService],
  exports: [PlanosService, AssinaturasService, AssinaturaDueDateSchedulerService],
})
export class PlanosModule {}
