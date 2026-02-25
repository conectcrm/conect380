import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';
import { Meta } from './entities/meta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meta])],
  controllers: [MetasController],
  providers: [MetasService],
  exports: [MetasService],
})
export class MetasModule {}
