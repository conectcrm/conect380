import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { PlanosModule } from '../planos/planos.module';
import { AdminBffAuditInterceptor } from '../admin/interceptors/admin-bff-audit.interceptor';
import { GuardianController } from './guardian.controller';
import { GuardianEmpresasController } from './guardian-empresas.controller';
import { GuardianBffController } from './guardian-bff.controller';
import { GuardianPlanosController } from './guardian-planos.controller';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAudit } from './entities/guardian-critical-audit.entity';
import { GuardianCriticalAuditService } from './services/guardian-critical-audit.service';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([GuardianCriticalAudit]),
    AdminModule,
    UsersModule,
    PlanosModule,
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
    GuardianCriticalAuditInterceptor,
  ],
})
export class GuardianModule {}
