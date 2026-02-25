import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dashboard_v2_metric_divergence')
export class DashboardV2MetricDivergence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'varchar', length: 80 })
  metric_key: string;

  @Column({ type: 'date' })
  period_start: string;

  @Column({ type: 'date' })
  period_end: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  v1_value: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  v2_value: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  divergence_pct: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
