import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrquestradorController } from './orquestrador.controller';
import { OrquestradorService } from './services/orquestrador.service';
import { FluxoAutomatizado } from './entities/fluxo-automatizado.entity';
import { EventoFluxo } from './entities/evento-fluxo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FluxoAutomatizado, EventoFluxo])],
  controllers: [OrquestradorController],
  providers: [OrquestradorService],
  exports: [OrquestradorService],
})
export class OrquestradorModule {}
