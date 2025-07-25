import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersDebugController } from './users-debug.controller';
import { UserActivitiesService } from './services/user-activities.service';
import { UserActivitiesController } from './user-activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Empresa, UserActivity])],
  providers: [UsersService, UserActivitiesService],
  controllers: [UsersController, UsersDebugController, UserActivitiesController],
  exports: [UsersService, UserActivitiesService],
})
export class UsersModule {}
