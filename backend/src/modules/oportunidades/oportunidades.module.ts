import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OportunidadesService } from './oportunidades.service';
import { OportunidadesController } from './oportunidades.controller';
import { Oportunidade } from './oportunidade.entity';
import { Atividade } from './atividade.entity';
import { OportunidadeStageEvent } from './oportunidade-stage-event.entity';
import { OportunidadeItemPreliminar } from './oportunidade-item-preliminar.entity';
import { DashboardV2Module } from '../dashboard-v2/dashboard-v2.module';
import { PropostasModule } from '../propostas/propostas.module';
import { ClientesModule } from '../clientes/clientes.module';
import { FeatureFlagTenant } from '../dashboard-v2/entities/feature-flag-tenant.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { OportunidadesStaleMonitorService } from './oportunidades-stale-monitor.service';
import { Lead } from '../leads/lead.entity';
import { User } from '../users/user.entity';
import { NotificationModule } from '../../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Oportunidade,
      Atividade,
      OportunidadeStageEvent,
      OportunidadeItemPreliminar,
      FeatureFlagTenant,
      Empresa,
      Lead,
      User,
    ]),
    DashboardV2Module,
    NotificationModule,
    ClientesModule,
    forwardRef(() => PropostasModule),
  ],
  controllers: [OportunidadesController],
  providers: [OportunidadesService, OportunidadesStaleMonitorService],
  exports: [OportunidadesService],
})
export class OportunidadesModule {}
