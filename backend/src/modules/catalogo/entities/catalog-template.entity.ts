import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { CatalogTemplateField } from './catalog-template-field.entity';

@Entity('catalog_templates')
export class CatalogTemplate {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  code: string;

  @Column({ type: 'uuid', name: 'empresa_id', nullable: true })
  empresaId?: string | null;

  @ManyToOne(() => Empresa, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa | null;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string | null;

  @Column({ type: 'varchar', name: 'item_kind', length: 40 })
  itemKind: string;

  @Column({ type: 'varchar', name: 'business_type', length: 40 })
  businessType: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @OneToMany(() => CatalogTemplateField, (field) => field.template, { cascade: false })
  fields?: CatalogTemplateField[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
