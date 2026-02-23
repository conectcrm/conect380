import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationModule } from '../../notifications/notification.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersDebugController } from './users-debug.controller';
import { UserActivitiesService } from './services/user-activities.service';
import { UserActivitiesController } from './user-activities.controller';

const usersDevControllers = process.env.NODE_ENV === 'development' ? [UsersDebugController] : [];

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Empresa, UserActivity, Notification]),
    NotificationModule,
    MulterModule.register({}),
  ],
  providers: [UsersService, UserActivitiesService],
  controllers: [UsersController, ...usersDevControllers, UserActivitiesController],
  exports: [UsersService, UserActivitiesService, TypeOrmModule],
})
export class UsersModule {}
