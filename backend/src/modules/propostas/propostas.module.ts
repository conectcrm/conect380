import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PropostasController } from './propostas.controller';
import { PropostasService } from './propostas.service';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { EmailController } from './email.controller';
import { EmailIntegradoService } from './email-integrado.service';
import { Proposta } from './proposta.entity';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposta, User, Cliente])
  ],
  providers: [
    PdfService,
    PropostasService,
    PortalService,
    EmailIntegradoService
  ],
  controllers: [
    PdfController,
    PropostasController,
    PortalController,
    EmailController
  ],
  exports: [
    PdfService,
    PropostasService,
    PortalService,
    EmailIntegradoService
  ],
})
export class PropostasModule { }
