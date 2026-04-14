import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '../produtos/produto.entity';
import { CategoriaProduto } from '../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../categorias-produtos/entities/configuracao-produto.entity';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';
import { CatalogItem } from './entities/catalog-item.entity';
import { CatalogItemComponent } from './entities/catalog-item-component.entity';
import { CatalogTemplate } from './entities/catalog-template.entity';
import { CatalogTemplateField } from './entities/catalog-template-field.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogItem,
      CatalogItemComponent,
      CatalogTemplate,
      CatalogTemplateField,
      Produto,
      CategoriaProduto,
      SubcategoriaProduto,
      ConfiguracaoProduto,
    ]),
  ],
  providers: [CatalogoService],
  controllers: [CatalogoController],
  exports: [CatalogoService],
})
export class CatalogoModule {}
