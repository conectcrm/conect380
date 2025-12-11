import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationsQueueProducer } from './notifications.queue-producer';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationChannelsService } from './notification-channels.service';
import { IntegracoesConfig } from '../modules/atendimento/entities/integracoes-config.entity'; // 🔐 Para WhatsApp config

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, IntegracoesConfig]), // 🔐 Adicionado IntegracoesConfig
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationsQueueProducer, NotificationsProcessor, NotificationChannelsService],
  exports: [NotificationService, NotificationsQueueProducer, NotificationChannelsService],
})
export class NotificationModule { }
