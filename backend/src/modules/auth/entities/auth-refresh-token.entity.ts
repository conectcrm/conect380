import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('auth_refresh_tokens')
export class AuthRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 128, unique: true })
  tokenHash: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'empresa_id', type: 'uuid', nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoke_reason', type: 'varchar', length: 80, nullable: true })
  revokeReason: string | null;

  @Column({ name: 'replaced_by_token_hash', type: 'varchar', length: 128, nullable: true })
  replacedByTokenHash: string | null;

  @Column({ name: 'requested_ip', type: 'varchar', length: 45, nullable: true })
  requestedIp: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
