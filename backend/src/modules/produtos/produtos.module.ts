import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './produto.entity';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { CategoriaProduto } from '../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../categorias-produtos/entities/configuracao-produto.entity';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, CategoriaProduto, SubcategoriaProduto, ConfiguracaoProduto]),
  ],
  providers: [ProdutosService, CacheService],
  controllers: [ProdutosController],
  exports: [ProdutosService],
})
export class ProdutosModule {}
