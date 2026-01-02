import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id', nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, { nullable: true })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa | null;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_hash', length: 128 })
  token_hash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expires_at: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  used_at: Date | null;

  @Column({ name: 'requested_ip', type: 'varchar', length: 45, nullable: true })
  requested_ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
