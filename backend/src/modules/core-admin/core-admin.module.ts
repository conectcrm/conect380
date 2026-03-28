import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { PlanosModule } from '../planos/planos.module';
import { NotificationModule } from '../../notifications/notification.module';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { User } from '../users/user.entity';
import { EmpresaModulo } from '../empresas/entities/empresa-modulo.entity';
import { ModuloEmpresa } from './entities/modulo-empresa.entity';
import { HistoricoPlano } from './entities/historico-plano.entity';
import { EmpresaModuloService } from '../empresas/services/empresa-modulo.service';
import { CoreAdminMfaGuard } from './guards/core-admin-mfa.guard';
import { CoreAdminCriticalAudit } from './entities/core-admin-critical-audit.entity';
import { CoreAdminPolicySnapshot } from './entities/core-admin-policy-snapshot.entity';
import { CoreAdminCriticalAuditService } from './services/core-admin-critical-audit.service';
import { CoreAdminCapabilitiesService } from './services/core-admin-capabilities.service';
import { CoreAdminPolicySnapshotService } from './services/core-admin-policy-snapshot.service';
import { CoreAdminRuntimeAlertService } from './services/core-admin-runtime-alert.service';
import { CoreAdminEmpresasService } from './services/core-admin-empresas.service';
import { CoreAdminBffService } from './services/core-admin-bff.service';
import { CoreAdminBffAuditInterceptor } from './interceptors/core-admin-bff-audit.interceptor';
import { CoreAdminCriticalAuditInterceptor } from './interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminController } from './core-admin.controller';
import { CoreAdminEmpresasController } from './core-admin-empresas.controller';
import { CoreAdminBffController } from './core-admin-bff.controller';
import { CoreAdminPlanosController } from './core-admin-planos.controller';
import { FeatureFlagTenant } from '../dashboard-v2/entities/feature-flag-tenant.entity';
import { CoreAdminFeatureFlagService } from './services/core-admin-feature-flag.service';
import { CoreAdminFeatureFlagsController } from './core-admin-feature-flags.controller';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoreAdminCriticalAudit,
      CoreAdminPolicySnapshot,
      FeatureFlagTenant,
      Empresa,
      User,
      EmpresaModulo,
      ModuloEmpresa,
      HistoricoPlano,
    ]),
    UsersModule,
    PlanosModule,
    NotificationModule,
    MailModule,
  ],
  controllers: [
    CoreAdminController,
    CoreAdminEmpresasController,
    CoreAdminBffController,
    CoreAdminPlanosController,
    CoreAdminFeatureFlagsController,
  ],
  providers: [
    CoreAdminBffAuditInterceptor,
    CoreAdminEmpresasService,
    CoreAdminBffService,
    EmpresaModuloService,
    CoreAdminMfaGuard,
    CoreAdminCriticalAuditService,
    CoreAdminCapabilitiesService,
    CoreAdminPolicySnapshotService,
    CoreAdminRuntimeAlertService,
    CoreAdminCriticalAuditInterceptor,
    CoreAdminFeatureFlagService,
  ],
  exports: [
    CoreAdminCapabilitiesService,
    CoreAdminPolicySnapshotService,
    CoreAdminCriticalAuditService,
    CoreAdminFeatureFlagService,
  ],
})
export class CoreAdminModule {}
