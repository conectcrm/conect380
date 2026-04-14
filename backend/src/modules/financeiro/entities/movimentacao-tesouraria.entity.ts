import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { ContaBancaria } from './conta-bancaria.entity';

export enum MovimentacaoTesourariaStatus {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  CANCELADA = 'cancelada',
}

@Entity('tesouraria_movimentacoes')
@Index('IDX_movimentacoes_tesouraria_empresa', ['empresaId'])
@Index('IDX_movimentacoes_tesouraria_empresa_status', ['empresaId', 'status'])
@Index('IDX_movimentacoes_tesouraria_conta_origem', ['contaOrigemId'])
@Index('IDX_movimentacoes_tesouraria_conta_destino', ['contaDestinoId'])
@Index('UQ_movimentacoes_tesouraria_empresa_correlation', ['empresaId', 'correlationId'], {
  unique: true,
})
export class MovimentacaoTesouraria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'conta_origem_id' })
  contaOrigemId: string;

  @ManyToOne(() => ContaBancaria)
  @JoinColumn({ name: 'conta_origem_id' })
  contaOrigem: ContaBancaria;

  @Column({ name: 'conta_destino_id' })
  contaDestinoId: string;

  @ManyToOne(() => ContaBancaria)
  @JoinColumn({ name: 'conta_destino_id' })
  contaDestino: ContaBancaria;

  @Column({
    type: 'enum',
    enum: MovimentacaoTesourariaStatus,
    default: MovimentacaoTesourariaStatus.PENDENTE,
  })
  status: MovimentacaoTesourariaStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column({ length: 255, nullable: true })
  descricao?: string;

  @Column({ name: 'correlation_id', length: 120 })
  correlationId: string;

  @Column({ name: 'origem_id', length: 160, nullable: true })
  origemId?: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  auditoria: Array<Record<string, unknown>>;

  @Column({ name: 'criado_por', nullable: true })
  criadoPor?: string;

  @Column({ name: 'atualizado_por', nullable: true })
  atualizadoPor?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
