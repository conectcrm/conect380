import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './services/contratos.service';
import { AssinaturaDigitalService } from './services/assinatura-digital.service';
import { PdfContratoService } from './services/pdf-contrato.service';
import { Contrato } from './entities/contrato.entity';
import { AssinaturaContrato } from './entities/assinatura-contrato.entity';
import { PropostasModule } from '../propostas/propostas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contrato, AssinaturaContrato]),
    PropostasModule, // Para acessar o EmailIntegradoService
  ],
  controllers: [ContratosController],
  providers: [
    ContratosService,
    AssinaturaDigitalService,
    PdfContratoService,
  ],
  exports: [
    ContratosService,
    AssinaturaDigitalService,
    PdfContratoService,
    TypeOrmModule, // Exporta os repositórios
  ],
})
export class ContratosModule { }
