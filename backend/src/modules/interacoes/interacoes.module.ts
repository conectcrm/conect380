import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteracoesService } from './interacoes.service';
import { InteracoesController } from './interacoes.controller';
import { Interacao } from './interacao.entity';
import { Lead } from '../leads/lead.entity';
import { Contato } from '../clientes/contato.entity';
import { User } from '../users/user.entity';
import { AgendaModule } from '../agenda/agenda.module';

@Module({
  imports: [TypeOrmModule.forFeature([Interacao, Lead, Contato, User]), AgendaModule],
  controllers: [InteracoesController],
  providers: [InteracoesService],
  exports: [InteracoesService],
})
export class InteracoesModule { }

