import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CatalogTemplate } from './catalog-template.entity';

@Entity('catalog_template_fields')
export class CatalogTemplateField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'template_code', length: 80 })
  templateCode: string;

  @ManyToOne(() => CatalogTemplate, (template) => template.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_code', referencedColumnName: 'code' })
  template: CatalogTemplate;

  @Column({ type: 'varchar', name: 'field_key', length: 80 })
  fieldKey: string;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  @Column({ type: 'varchar', length: 40 })
  section: string;

  @Column({ type: 'varchar', name: 'field_type', length: 30 })
  fieldType: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options?: Array<{ value: string; label: string }> | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', name: 'help_text', nullable: true })
  helpText?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
