import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OportunidadesService } from './oportunidades.service';
import { OportunidadesController } from './oportunidades.controller';
import { Oportunidade } from './oportunidade.entity';
import { Atividade } from './atividade.entity';
import { OportunidadeStageEvent } from './oportunidade-stage-event.entity';
import { DashboardV2Module } from '../dashboard-v2/dashboard-v2.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Oportunidade, Atividade, OportunidadeStageEvent]),
    DashboardV2Module,
  ],
  controllers: [OportunidadesController],
  providers: [OportunidadesService],
  exports: [OportunidadesService],
})
export class OportunidadesModule {}
