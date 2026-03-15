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

export enum AdminBreakGlassStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity('admin_break_glass_accesses')
@Index('IDX_admin_break_glass_empresa_status', ['empresaId', 'status'])
@Index('IDX_admin_break_glass_target_status', ['targetUserId', 'status'])
@Index('IDX_admin_break_glass_expires_status', ['expiresAt', 'status'])
export class AdminBreakGlassAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser: User | null;

  @Column({ name: 'revoked_by_user_id', type: 'uuid', nullable: true })
  revokedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revoked_by_user_id' })
  revokedByUser: User | null;

  @Column({ type: 'varchar', length: 32, default: AdminBreakGlassStatus.REQUESTED })
  status: AdminBreakGlassStatus;

  @Column({ name: 'scope_permissions', type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  scopePermissions: string[];

  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes: number;

  @Column({ name: 'request_reason', type: 'text' })
  requestReason: string;

  @Column({ name: 'approval_reason', type: 'text', nullable: true })
  approvalReason: string | null;

  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string | null;

  @Column({ name: 'requested_at', type: 'timestamp', default: () => 'now()' })
  requestedAt: Date;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
