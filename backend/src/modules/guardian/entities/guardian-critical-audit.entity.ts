import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('guardian_critical_audits')
export class GuardianCriticalAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @Column({ name: 'actor_role', type: 'varchar', length: 40, nullable: true })
  actorRole: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  @Column({ name: 'empresa_id', type: 'uuid', nullable: true })
  empresaId: string | null;

  @Column({ name: 'target_type', type: 'varchar', length: 80, nullable: true })
  targetType: string | null;

  @Column({ name: 'target_id', type: 'varchar', length: 120, nullable: true })
  targetId: string | null;

  @Column({ name: 'request_ip', type: 'varchar', length: 45, nullable: true })
  requestIp: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'http_method', type: 'varchar', length: 10 })
  httpMethod: string;

  @Column({ name: 'route', type: 'varchar', length: 255 })
  route: string;

  @Column({ name: 'status_code', type: 'integer' })
  statusCode: number;

  @Column({ name: 'outcome', type: 'varchar', length: 16 })
  outcome: string;

  @Column({ name: 'before_payload', type: 'jsonb', nullable: true })
  beforePayload: Record<string, unknown> | null;

  @Column({ name: 'after_payload', type: 'jsonb', nullable: true })
  afterPayload: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 120, nullable: true })
  requestId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

