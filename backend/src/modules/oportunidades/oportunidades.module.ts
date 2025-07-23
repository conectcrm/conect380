import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OportunidadesService } from './oportunidades.service';
import { OportunidadesController } from './oportunidades.controller';
import { Oportunidade } from './oportunidade.entity';
import { Atividade } from './atividade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Oportunidade, Atividade])],
  controllers: [OportunidadesController],
  providers: [OportunidadesService],
  exports: [OportunidadesService],
})
export class OportunidadesModule {}
