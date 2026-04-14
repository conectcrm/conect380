import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oportunidade_itens_preliminares')
export class OportunidadeItemPreliminar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  // Mantido como texto para compatibilidade entre schemas legados (id numerico) e modernos (uuid).
  @Column({ type: 'varchar', length: 64 })
  oportunidade_id: string;

  @Column('uuid', { nullable: true })
  produto_id?: string | null;

  @Column('uuid', { nullable: true })
  catalog_item_id?: string | null;

  @Column({ type: 'varchar', length: 255 })
  nome_snapshot: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku_snapshot?: string | null;

  @Column({ type: 'text', nullable: true })
  descricao_snapshot?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  preco_unitario_estimado: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 1 })
  quantidade_estimada: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  desconto_percentual: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal_estimado: number;

  @Column({ type: 'varchar', length: 30, default: 'manual' })
  origem: string;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
