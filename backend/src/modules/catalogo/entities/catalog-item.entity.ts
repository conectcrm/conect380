import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { Produto } from '../../produtos/produto.entity';
import { CategoriaProduto } from '../../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../../categorias-produtos/entities/configuracao-produto.entity';
import { CatalogItemComponent } from './catalog-item-component.entity';
import { CatalogTemplate } from './catalog-template.entity';

@Entity('catalog_items')
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'legacy_produto_id', nullable: true })
  legacyProdutoId?: string | null;

  @ManyToOne(() => Produto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'legacy_produto_id' })
  legacyProduto?: Produto | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code?: string | null;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string | null;

  @Column({ type: 'varchar', name: 'item_kind', length: 40 })
  itemKind: string;

  @Column({ type: 'varchar', name: 'business_type', length: 40 })
  businessType: string;

  @Column({ type: 'varchar', name: 'template_code', length: 80, nullable: true })
  templateCode?: string | null;

  @ManyToOne(() => CatalogTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_code', referencedColumnName: 'code' })
  template?: CatalogTemplate | null;

  @Column({ type: 'uuid', name: 'categoria_id', nullable: true })
  categoriaId?: string | null;

  @ManyToOne(() => CategoriaProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoria?: CategoriaProduto | null;

  @Column({ type: 'uuid', name: 'subcategoria_id', nullable: true })
  subcategoriaId?: string | null;

  @ManyToOne(() => SubcategoriaProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategoria_id' })
  subcategoria?: SubcategoriaProduto | null;

  @Column({ type: 'uuid', name: 'configuracao_id', nullable: true })
  configuracaoId?: string | null;

  @ManyToOne(() => ConfiguracaoProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'configuracao_id' })
  configuracao?: ConfiguracaoProduto | null;

  @Column({ type: 'varchar', length: 30, default: 'ativo' })
  status: string;

  @Column({ type: 'varchar', name: 'billing_model', length: 30, nullable: true })
  billingModel?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  recurrence?: string | null;

  @Column({ type: 'varchar', name: 'unit_code', length: 40, nullable: true })
  unitCode?: string | null;

  @Column({ type: 'numeric', name: 'sale_price', precision: 12, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'numeric', name: 'cost_amount', precision: 12, scale: 2, nullable: true })
  costAmount?: number | null;

  @Column({ type: 'varchar', name: 'currency_code', length: 8, default: 'BRL' })
  currencyCode: string;

  @Column({ type: 'boolean', name: 'track_stock', default: false })
  trackStock: boolean;

  @Column({ type: 'int', name: 'stock_current', nullable: true })
  stockCurrent?: number | null;

  @Column({ type: 'int', name: 'stock_min', nullable: true })
  stockMin?: number | null;

  @Column({ type: 'int', name: 'stock_max', nullable: true })
  stockMax?: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string | null;

  @Column({ type: 'varchar', name: 'supplier_name', length: 255, nullable: true })
  supplierName?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => CatalogItemComponent, (component) => component.parentItem, { cascade: false })
  componentsAsParent?: CatalogItemComponent[];

  @OneToMany(() => CatalogItemComponent, (component) => component.childItem, { cascade: false })
  componentsAsChild?: CatalogItemComponent[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
