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

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User, EmpresaModulo, ModuloEmpresa, HistoricoPlano]),
  ],
  controllers: [AdminEmpresasController],
  providers: [AdminEmpresasService, EmpresaModuloService],
  exports: [AdminEmpresasService],
})
export class AdminModule {}
