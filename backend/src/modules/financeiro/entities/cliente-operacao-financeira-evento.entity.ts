import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/cliente.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { ClienteOperacaoFinanceiraStatus, StatusOperacaoFinanceiraCliente } from './cliente-operacao-financeira-status.entity';

export type TipoEventoOperacaoFinanceiraCliente =
  | 'avaliacao'
  | 'marcacao_risco'
  | 'bloqueio_automatico'
  | 'bloqueio_manual'
  | 'desbloqueio_automatico'
  | 'desbloqueio_manual';

@Entity('clientes_operacao_financeira_eventos')
@Index('IDX_clientes_operacao_financeira_eventos_empresa_cliente', ['empresaId', 'clienteId', 'createdAt'])
export class ClienteOperacaoFinanceiraEvento {
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

  @Column({ name: 'status_id', type: 'uuid', nullable: true })
  statusId: string | null;

  @ManyToOne(() => ClienteOperacaoFinanceiraStatus, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'status_id' })
  status: ClienteOperacaoFinanceiraStatus | null;

  @Column({ name: 'tipo_evento', type: 'varchar' })
  tipoEvento: TipoEventoOperacaoFinanceiraCliente;

  @Column({ name: 'estado_anterior', type: 'varchar', nullable: true })
  estadoAnterior: StatusOperacaoFinanceiraCliente | null;

  @Column({ name: 'estado_novo', type: 'varchar', nullable: true })
  estadoNovo: StatusOperacaoFinanceiraCliente | null;

  @Column({ nullable: true, type: 'text' })
  motivo: string | null;

  @Column({ name: 'saldo_vencido', type: 'decimal', precision: 15, scale: 2, default: 0 })
  saldoVencido: number;

  @Column({ name: 'dias_maior_atraso', type: 'integer', default: 0 })
  diasMaiorAtraso: number;

  @Column({ name: 'ator_id', type: 'varchar', nullable: true })
  atorId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
