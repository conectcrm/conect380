import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Proposta } from '../propostas/proposta.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { User } from '../users/user.entity';
import { Oportunidade } from '../oportunidades/oportunidade.entity';
import { Lead } from '../leads/lead.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposta, Contrato, Fatura, User, Oportunidade, Lead])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
