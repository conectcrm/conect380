import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('guardian_policy_snapshots')
export class CoreAdminPolicySnapshot {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 32 })
  environment: string;

  @Column({ name: 'policy_source', type: 'varchar', length: 24 })
  policySource: string;

  @Column({ name: 'release_version', type: 'varchar', length: 80, nullable: true })
  releaseVersion: string | null;

  @Column({ name: 'admin_mfa_required', type: 'boolean', default: false })
  adminMfaRequired: boolean;

  @Column({ name: 'legacy_transition_mode', type: 'varchar', length: 64 })
  legacyTransitionMode: string;

  @Column({ name: 'policy_fingerprint', type: 'varchar', length: 64 })
  policyFingerprint: string;

  @Column({ type: 'jsonb' })
  capabilities: Record<string, boolean>;

  @Column({ name: 'enabled_capabilities', type: 'text', array: true, default: '{}' })
  enabledCapabilities: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
