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
import { User } from '../user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum UserAccessChangeAction {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
}

export enum UserAccessChangeStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('user_access_change_requests')
@Index('IDX_user_access_change_requests_empresa_status', ['empresaId', 'status'])
@Index('IDX_user_access_change_requests_requested_by', ['requestedByUserId'])
@Index('IDX_user_access_change_requests_target_user', ['targetUserId'])
export class UserAccessChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 32 })
  action: UserAccessChangeAction;

  @Column({ type: 'varchar', length: 32, default: UserAccessChangeStatus.REQUESTED })
  status: UserAccessChangeStatus;

  @Column({ name: 'requested_by_user_id', type: 'uuid', nullable: true })
  requestedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User | null;

  @Column({ name: 'request_payload', type: 'jsonb' })
  requestPayload: Record<string, unknown>;

  @Column({ name: 'request_reason', type: 'text', nullable: true })
  requestReason: string | null;

  @Column({ name: 'decided_by_user_id', type: 'uuid', nullable: true })
  decidedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decided_by_user_id' })
  decidedByUser: User | null;

  @Column({ name: 'decision_reason', type: 'text', nullable: true })
  decisionReason: string | null;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt: Date | null;

  @Column({ name: 'applied_user_id', type: 'uuid', nullable: true })
  appliedUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'applied_user_id' })
  appliedUser: User | null;

  @Column({ name: 'applied_at', type: 'timestamp', nullable: true })
  appliedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
