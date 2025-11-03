import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasController, MinhasEmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { User } from '../modules/users/user.entity';
import { MailModule } from '../mail/mail.module';
import { EmpresaModulo } from '../modules/empresas/entities/empresa-modulo.entity';
import { EmpresaModuloService } from '../modules/empresas/services/empresa-modulo.service';
import { EmpresaModuloController } from '../modules/empresas/controllers/empresa-modulo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User, EmpresaModulo]),
    MailModule
  ],
  controllers: [EmpresasController, MinhasEmpresasController, EmpresaModuloController],
  providers: [EmpresasService, EmpresaModuloService],
  exports: [EmpresasService, EmpresaModuloService]
})
export class EmpresasModule { }
