import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('billing_events')
@Index('IDX_billing_events_empresa_occurred_at', ['empresaId', 'occurredAt'])
@Index('IDX_billing_events_aggregate_occurred_at', ['aggregateType', 'aggregateId', 'occurredAt'])
@Index('IDX_billing_events_correlation_id', ['correlationId'])
export class BillingEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 40 })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 120 })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 80 })
  eventType: string;

  @Column({ type: 'varchar', length: 40, default: 'system' })
  source: string;

  @Column({ type: 'varchar', length: 24, default: 'recorded' })
  status: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @Column({ name: 'correlation_id', type: 'varchar', length: 120, nullable: true })
  correlationId?: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ name: 'actor_role', type: 'varchar', length: 40, nullable: true })
  actorRole?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'occurred_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
