import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { UserAccessChangeRequest } from './entities/user-access-change-request.entity';
import { AdminBreakGlassAccess } from './entities/admin-break-glass-access.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationModule } from '../../notifications/notification.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersDebugController } from './users-debug.controller';
import { UserActivitiesService } from './services/user-activities.service';
import { UserActivitiesController } from './user-activities.controller';
import { AdminBreakGlassAccessService } from './services/admin-break-glass-access.service';

const usersDevControllers = process.env.NODE_ENV === 'development' ? [UsersDebugController] : [];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Empresa,
      EmpresaConfig,
      UserActivity,
      UserAccessChangeRequest,
      AdminBreakGlassAccess,
      Notification,
    ]),
    NotificationModule,
    MulterModule.register({}),
  ],
  providers: [UsersService, UserActivitiesService, AdminBreakGlassAccessService],
  controllers: [UsersController, ...usersDevControllers, UserActivitiesController],
  exports: [UsersService, UserActivitiesService, AdminBreakGlassAccessService, TypeOrmModule],
})
export class UsersModule {}
