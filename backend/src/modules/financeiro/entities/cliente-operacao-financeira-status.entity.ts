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
import { Cliente } from '../../clientes/cliente.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export type StatusOperacaoFinanceiraCliente =
  | 'ativo'
  | 'em_risco'
  | 'bloqueado_automatico'
  | 'bloqueado_manual';

export type OrigemStatusOperacaoFinanceira = 'sistema' | 'automacao' | 'manual';

@Entity('clientes_operacao_financeira_status')
@Index('IDX_clientes_operacao_financeira_status_empresa_status', ['empresaId', 'statusOperacional'])
@Index('IDX_clientes_operacao_financeira_status_empresa_cliente', ['empresaId', 'clienteId'])
@Index('UQ_clientes_operacao_financeira_status_empresa_cliente', ['empresaId', 'clienteId'], {
  unique: true,
})
export class ClienteOperacaoFinanceiraStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => Cliente, { eager: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'status_operacional', default: 'ativo' })
  statusOperacional: StatusOperacaoFinanceiraCliente;

  @Column({ name: 'origem_status', default: 'sistema' })
  origemStatus: OrigemStatusOperacaoFinanceira;

  @Column({ nullable: true, type: 'text' })
  motivo: string | null;

  @Column({ name: 'bloqueio_manual', default: false })
  bloqueioManual: boolean;

  @Column({ name: 'saldo_vencido', type: 'decimal', precision: 15, scale: 2, default: 0 })
  saldoVencido: number;

  @Column({ name: 'dias_maior_atraso', type: 'integer', default: 0 })
  diasMaiorAtraso: number;

  @Column({ name: 'quantidade_titulos_vencidos', type: 'integer', default: 0 })
  quantidadeTitulosVencidos: number;

  @Column({ name: 'ultima_avaliacao_em', type: 'timestamp', nullable: true })
  ultimaAvaliacaoEm: Date | null;

  @Column({ name: 'bloqueado_em', type: 'timestamp', nullable: true })
  bloqueadoEm: Date | null;

  @Column({ name: 'desbloqueado_em', type: 'timestamp', nullable: true })
  desbloqueadoEm: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
