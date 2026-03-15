import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './lead.entity';
import { OportunidadesModule } from '../oportunidades/oportunidades.module';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Empresa]), OportunidadesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
