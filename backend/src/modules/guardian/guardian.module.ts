import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { PlanosModule } from '../planos/planos.module';
import { NotificationModule } from '../../notifications/notification.module';
import { AdminBffAuditInterceptor } from '../admin/interceptors/admin-bff-audit.interceptor';
import { GuardianController } from './guardian.controller';
import { GuardianEmpresasController } from './guardian-empresas.controller';
import { GuardianBffController } from './guardian-bff.controller';
import { GuardianPlanosController } from './guardian-planos.controller';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAudit } from './entities/guardian-critical-audit.entity';
import { GuardianPolicySnapshot } from './entities/guardian-policy-snapshot.entity';
import { GuardianCriticalAuditService } from './services/guardian-critical-audit.service';
import { GuardianCapabilitiesService } from './services/guardian-capabilities.service';
import { GuardianPolicySnapshotService } from './services/guardian-policy-snapshot.service';
import { GuardianRuntimeAlertService } from './services/guardian-runtime-alert.service';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([GuardianCriticalAudit, GuardianPolicySnapshot]),
    AdminModule,
    UsersModule,
    PlanosModule,
    NotificationModule,
  ],
  controllers: [
    GuardianController,
    GuardianEmpresasController,
    GuardianBffController,
    GuardianPlanosController,
  ],
  providers: [
    AdminBffAuditInterceptor,
    GuardianMfaGuard,
    GuardianCriticalAuditService,
    GuardianCapabilitiesService,
    GuardianPolicySnapshotService,
    GuardianRuntimeAlertService,
    GuardianCriticalAuditInterceptor,
  ],
})
export class GuardianModule {}
