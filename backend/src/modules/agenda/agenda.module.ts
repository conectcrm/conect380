import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendaEvento } from './agenda-evento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaEvento])],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
