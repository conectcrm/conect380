import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboard_funnel_metrics_daily')
export class DashboardFunnelMetricsDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'date' })
  date_key: string;

  @Column({ type: 'varchar', length: 80 })
  from_stage: string;

  @Column({ type: 'varchar', length: 80 })
  to_stage: string;

  @Column({ type: 'int', default: 0 })
  entered_count: number;

  @Column({ type: 'int', default: 0 })
  progressed_count: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  conversion_rate: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
