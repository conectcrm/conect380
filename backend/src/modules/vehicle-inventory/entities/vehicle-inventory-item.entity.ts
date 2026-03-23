import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('vehicle_inventory_items')
export class VehicleInventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 60, nullable: true })
  code?: string | null;

  @Column({ type: 'varchar', length: 100 })
  marca: string;

  @Column({ type: 'varchar', length: 120 })
  modelo: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  versao?: string | null;

  @Column({ type: 'int', name: 'ano_fabricacao' })
  anoFabricacao: number;

  @Column({ type: 'int', name: 'ano_modelo' })
  anoModelo: number;

  @Column({ type: 'int', nullable: true })
  quilometragem?: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  combustivel?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cambio?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cor?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  placa?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  chassi?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  renavam?: string | null;

  @Column({ type: 'numeric', name: 'valor_compra', precision: 12, scale: 2, nullable: true })
  valorCompra?: number | null;

  @Column({ type: 'numeric', name: 'valor_venda', precision: 12, scale: 2, default: 0 })
  valorVenda: number;

  @Column({ type: 'varchar', length: 30, default: 'disponivel' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
