import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum MetaTipo {
  MENSAL = 'mensal',
  TRIMESTRAL = 'trimestral',
  ANUAL = 'anual',
}

@Entity('metas')
export class Meta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MetaTipo, default: MetaTipo.MENSAL })
  tipo: MetaTipo;

  @Column({ type: 'varchar', length: 20 })
  periodo: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  valor: number;

  @Column({ type: 'uuid', name: 'vendedor_id', nullable: true })
  vendedorId?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  regiao?: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @Column({ type: 'uuid', name: 'empresa_id', nullable: true })
  empresaId?: string;

  @ManyToOne(() => Empresa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @CreateDateColumn({ name: 'criada_em' })
  criadaEm: Date;

  @UpdateDateColumn({ name: 'atualizada_em' })
  atualizadaEm: Date;
}
