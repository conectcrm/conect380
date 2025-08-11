import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotacaoController } from './cotacao.controller';
import { CotacaoService } from './cotacao.service';
import { Cotacao } from './entities/cotacao.entity';
import { ItemCotacao } from './entities/item-cotacao.entity';
import { AnexoCotacao } from './entities/anexo-cotacao.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { User } from '../modules/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cotacao,
      ItemCotacao,
      AnexoCotacao,
      Cliente,
      User
    ])
  ],
  controllers: [CotacaoController],
  providers: [CotacaoService],
  exports: [CotacaoService]
})
export class CotacaoModule {}
