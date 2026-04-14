import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposta } from '../propostas/proposta.entity';
import { ComissoesController } from './comissoes.controller';
import { ComissoesService } from './comissoes.service';
import { ComissaoLancamento } from './entities/comissao-lancamento.entity';
import { ComissaoLancamentoParticipante } from './entities/comissao-lancamento-participante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComissaoLancamento, ComissaoLancamentoParticipante, Proposta])],
  providers: [ComissoesService],
  controllers: [ComissoesController],
  exports: [ComissoesService],
})
export class ComissoesModule {}

