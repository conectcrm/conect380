import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendaEvento } from './agenda-evento.entity';
import { User } from '../users/user.entity';
import { NotificationModule } from '../../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaEvento, User]), NotificationModule],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
