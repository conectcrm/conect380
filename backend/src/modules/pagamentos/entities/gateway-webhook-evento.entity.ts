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
import { GatewayProvider } from './configuracao-gateway.entity';

export enum GatewayWebhookEventoStatus {
  RECEBIDO = 'recebido',
  PROCESSANDO = 'processando',
  PROCESSADO = 'processado',
  FALHA = 'falha',
}

@Entity('webhooks_gateway_eventos')
@Index('IDX_webhooks_gateway_eventos_empresa_created_at', ['empresaId', 'createdAt'])
@Index('IDX_webhooks_gateway_eventos_empresa_gateway_status', ['empresaId', 'gateway', 'status'])
@Index(
  'UQ_webhooks_gateway_eventos_empresa_gateway_idempotency',
  ['empresaId', 'gateway', 'idempotencyKey'],
  { unique: true },
)
export class GatewayWebhookEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({
    type: 'enum',
    enum: GatewayProvider,
  })
  gateway: GatewayProvider;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 180 })
  idempotencyKey: string;

  @Column({ name: 'event_id', type: 'varchar', length: 180, nullable: true })
  eventId?: string;

  @Column({ name: 'request_id', type: 'varchar', length: 180, nullable: true })
  requestId?: string;

  @Column({ name: 'referencia_gateway', type: 'varchar', length: 180, nullable: true })
  referenciaGateway?: string;

  @Column({
    type: 'enum',
    enum: GatewayWebhookEventoStatus,
    default: GatewayWebhookEventoStatus.RECEBIDO,
  })
  status: GatewayWebhookEventoStatus;

  @Column({ type: 'int', default: 0 })
  tentativas: number;

  @Column({ name: 'payload_raw', type: 'jsonb', default: () => "'{}'::jsonb" })
  payloadRaw: Record<string, unknown>;

  @Column({ name: 'erro', type: 'text', nullable: true })
  erro?: string;

  @Column({ name: 'processado_em', type: 'timestamp', nullable: true })
  processadoEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
