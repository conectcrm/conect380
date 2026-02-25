import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboard_aging_stage_daily')
export class DashboardAgingStageDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'date' })
  date_key: string;

  @Column({ type: 'varchar', length: 80 })
  stage: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  avg_days: number;

  @Column({ type: 'int', default: 0 })
  stalled_count: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
