import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboard_pipeline_snapshot_daily')
export class DashboardPipelineSnapshotDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'date' })
  date_key: string;

  @Column({ type: 'varchar', length: 80 })
  stage: string;

  @Column({ type: 'int', default: 0 })
  quantidade: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  valor_total: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
