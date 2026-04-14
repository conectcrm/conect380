import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('feature_flags_tenant')
export class FeatureFlagTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'varchar', length: 80 })
  flag_key: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  rollout_percentage: number;

  @Column('uuid', { nullable: true })
  updated_by: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;
}
