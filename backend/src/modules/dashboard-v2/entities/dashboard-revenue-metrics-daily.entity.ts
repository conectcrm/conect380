import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboard_revenue_metrics_daily')
export class DashboardRevenueMetricsDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'date' })
  date_key: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  receita_fechada: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  receita_prevista: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  ticket_medio: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  ciclo_medio_dias: number;

  @Column({ type: 'int', default: 0 })
  oportunidades_ativas: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
