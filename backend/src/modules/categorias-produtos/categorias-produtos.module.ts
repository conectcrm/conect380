import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasProdutosController } from './categorias-produtos.controller';
import { SubcategoriasProdutosController } from './subcategorias-produtos.controller';
import { ConfiguracoesProdutosController } from './configuracoes-produtos.controller';
import { CategoriasProdutosService } from './categorias-produtos.service';
import { CategoriaProduto } from './entities/categoria-produto.entity';
import { SubcategoriaProduto } from './entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from './entities/configuracao-produto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaProduto, SubcategoriaProduto, ConfiguracaoProduto])],
  controllers: [
    CategoriasProdutosController,
    SubcategoriasProdutosController,
    ConfiguracoesProdutosController,
  ],
  providers: [CategoriasProdutosService],
  exports: [CategoriasProdutosService],
})
export class CategoriasProdutosModule {}

