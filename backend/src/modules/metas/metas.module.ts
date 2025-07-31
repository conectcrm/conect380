import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetasService } from './metas.service';
import { MetasController } from './metas.controller';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Meta]) // Será adicionado quando criarmos a entidade
  ],
  controllers: [MetasController],
  providers: [MetasService],
  exports: [MetasService], // Exporta o service para uso em outros módulos
})
export class MetasModule { }
