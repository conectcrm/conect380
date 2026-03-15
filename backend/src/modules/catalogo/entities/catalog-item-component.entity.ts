import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { CatalogItem } from './catalog-item.entity';

@Entity('catalog_item_components')
export class CatalogItemComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'parent_item_id' })
  parentItemId: string;

  @ManyToOne(() => CatalogItem, (item) => item.componentsAsParent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_item_id' })
  parentItem: CatalogItem;

  @Column({ type: 'uuid', name: 'child_item_id' })
  childItemId: string;

  @ManyToOne(() => CatalogItem, (item) => item.componentsAsChild, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_item_id' })
  childItem: CatalogItem;

  @Column({ type: 'varchar', name: 'component_role', length: 30 })
  componentRole: string;

  @Column({ type: 'numeric', precision: 12, scale: 4, default: 1 })
  quantity: number;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', name: 'affects_price', default: false })
  affectsPrice: boolean;

  @Column({ type: 'boolean', name: 'is_default', default: true })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
