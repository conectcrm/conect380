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
import { EmpresaConfig } from '../modules/empresas/entities/empresa-config.entity';
import { EmpresaConfigService } from '../modules/empresas/services/empresa-config.service';
import { EmpresaConfigController } from '../modules/empresas/controllers/empresa-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, User, EmpresaModulo, EmpresaConfig]), MailModule],
  controllers: [
    // ⚠️ ORDEM CRÍTICA: Rotas específicas ANTES de rotas dinâmicas!
    // EmpresaConfigController tem @Controller('empresas/config') → deve vir ANTES
    // EmpresasController tem @Get(':id') → captura qualquer coisa, deve vir DEPOIS
    EmpresaConfigController, // ← '/empresas/config' (específico)
    MinhasEmpresasController,
    EmpresaModuloController,
    EmpresasController, // ← '/empresas/:id' (dinâmico)
  ],
  providers: [EmpresasService, EmpresaModuloService, EmpresaConfigService],
  exports: [
    EmpresasService,
    EmpresaModuloService,
    EmpresaConfigService,
    TypeOrmModule, // ✅ Exportar TypeOrmModule para testes terem acesso aos repositories
  ],
})
export class EmpresasModule {}
