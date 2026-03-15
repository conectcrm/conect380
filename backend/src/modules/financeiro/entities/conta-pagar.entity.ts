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
import { Empresa } from '../../../empresas/entities/empresa.entity';

export type StatusContaPagar = 'pendente' | 'paga' | 'vencida' | 'cancelada';

@Entity('contas_pagar')
export class ContaPagar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, nullable: true })
  numero?: string;

  @Column()
  descricao: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column('decimal', { name: 'valor_original', precision: 15, scale: 2, nullable: true })
  valorOriginal?: number;

  @Column('decimal', { name: 'valor_desconto', precision: 15, scale: 2, nullable: true, default: 0 })
  valorDesconto?: number;

  @Column('decimal', { name: 'valor_multa', precision: 15, scale: 2, nullable: true, default: 0 })
  valorMulta?: number;

  @Column('decimal', { name: 'valor_juros', precision: 15, scale: 2, nullable: true, default: 0 })
  valorJuros?: number;

  @Column('decimal', { name: 'valor_total', precision: 15, scale: 2, nullable: true })
  valorTotal?: number;

  @Column('decimal', { name: 'valor_pago', precision: 15, scale: 2, nullable: true, default: 0 })
  valorPago?: number;

  @Column('decimal', { name: 'valor_restante', precision: 15, scale: 2, nullable: true })
  valorRestante?: number;

  @Column({ name: 'data_emissao', type: 'date', nullable: true })
  dataEmissao?: Date;

  @Column({ name: 'data_vencimento' })
  dataVencimento: Date;

  @Column({ name: 'data_pagamento', nullable: true })
  dataPagamento?: Date;

  @Column({ name: 'data_agendamento', type: 'date', nullable: true })
  dataAgendamento?: Date;

  @Column({
    type: 'enum',
    enum: ['pendente', 'paga', 'vencida', 'cancelada'],
    default: 'pendente',
  })
  status: StatusContaPagar;

  @Column({ length: 50, nullable: true })
  categoria?: string;

  @Column({ length: 10, nullable: true })
  prioridade?: string;

  @Column({ name: 'tipo_pagamento', length: 30, nullable: true })
  tipoPagamento?: string;

  @Column({ name: 'forma_pagamento', length: 30, nullable: true })
  formaPagamento?: string;

  @Column({ name: 'conta_bancaria_id', nullable: true })
  contaBancariaId?: string;

  @Column({ name: 'comprovante_pagamento', length: 500, nullable: true })
  comprovantePagamento?: string;

  @Column({ default: false })
  recorrente?: boolean;

  @Column({ name: 'frequencia_recorrencia', length: 50, nullable: true })
  frequenciaRecorrencia?: string;

  @Column({ name: 'necessita_aprovacao', default: false })
  necessitaAprovacao?: boolean;

  @Column({ name: 'aprovado_por', nullable: true })
  aprovadoPor?: string;

  @Column({ name: 'data_aprovacao', nullable: true })
  dataAprovacao?: Date;

  @Column({ name: 'criado_por', nullable: true })
  criadoPor?: string;

  @Column({ name: 'atualizado_por', nullable: true })
  atualizadoPor?: string;

  @Column({ name: 'centro_custo_id', nullable: true })
  centroCustoId?: string;

  @Column({ name: 'anexos', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  anexos?: unknown[];

  @Column({ name: 'tags', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  tags?: string[];

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

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa_rel: Empresa;

  @Column({ nullable: true })
  observacoes?: string;

  @Column({ name: 'numero_documento', nullable: true })
  numeroDocumento?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
