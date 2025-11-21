import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Fornecedor } from './fornecedor.entity';

export type StatusContaPagar = 'pendente' | 'paga' | 'vencida' | 'cancelada';

@Entity('contas_pagar')
export class ContaPagar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  descricao: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column({ name: 'data_vencimento' })
  dataVencimento: Date;

  @Column({ name: 'data_pagamento', nullable: true })
  dataPagamento?: Date;

  @Column({
    type: 'enum',
    enum: ['pendente', 'paga', 'vencida', 'cancelada'],
    default: 'pendente',
  })
  status: StatusContaPagar;

  @Column({ name: 'fornecedor_id' })
  fornecedorId: string;

  @ManyToOne(() => Fornecedor, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'fornecedor_id',
    foreignKeyConstraintName: 'fk_contas_pagar_fornecedor',
  })
  fornecedor: Fornecedor;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @Column({ nullable: true })
  observacoes?: string;

  @Column({ name: 'numero_documento', nullable: true })
  numeroDocumento?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
