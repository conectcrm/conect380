import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MetasModule } from '../metas/metas.module';
import { EventosModule } from '../eventos/eventos.module';
import { Proposta } from '../propostas/proposta.entity';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { SessaoTriagem } from '../triagem/entities/sessao-triagem.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposta, User, Cliente, SessaoTriagem]),
    MetasModule,
    EventosModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
