import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente, Produto]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule { }
