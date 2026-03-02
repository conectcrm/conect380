import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { User } from '../users/user.entity';
import { EmpresaModulo } from '../empresas/entities/empresa-modulo.entity';
import { ModuloEmpresa } from './entities/modulo-empresa.entity';
import { HistoricoPlano } from './entities/historico-plano.entity';
import { EmpresaModuloService } from '../empresas/services/empresa-modulo.service';
import { AdminEmpresasController } from './controllers/admin-empresas.controller';
import { AdminEmpresasService } from './services/admin-empresas.service';
import { AdminBffController } from './controllers/admin-bff.controller';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../../notifications/notification.module';
import { AdminBffService } from './services/admin-bff.service';
import { AdminBffAuditInterceptor } from './interceptors/admin-bff-audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User, EmpresaModulo, ModuloEmpresa, HistoricoPlano]),
    UsersModule,
    NotificationModule,
  ],
  controllers: [AdminEmpresasController, AdminBffController],
  providers: [AdminEmpresasService, EmpresaModuloService, AdminBffService, AdminBffAuditInterceptor],
  exports: [AdminEmpresasService, AdminBffService],
})
export class AdminModule {}
