import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export type DlqReprocessStatus = 'success' | 'partial' | 'failed';

@Entity('dlq_reprocess_audit')
@Index(['fila', 'createdAt'])
export class DlqReprocessAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId!: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'action_id', type: 'varchar', unique: true })
  actionId!: string;

  @Column({ type: 'varchar', nullable: true })
  actor!: string | null;

  @Column({ type: 'varchar' })
  fila!: string;

  @Column({ type: 'jsonb', nullable: true })
  filters!: Record<string, unknown> | null;

  @Column({ name: 'total_filtrados', type: 'int', default: 0 })
  totalFiltrados!: number;

  @Column({ name: 'total_selecionados', type: 'int', default: 0 })
  totalSelecionados!: number;

  @Column({ type: 'int', default: 0 })
  reprocessados!: number;

  @Column({ name: 'ignorados_sem_job_name', type: 'int', default: 0 })
  ignoradosSemJobName!: number;

  @Column({ name: 'ignorados_sem_payload', type: 'int', default: 0 })
  ignoradosSemPayload!: number;

  @Column({ name: 'ignorados_job_name_invalido', type: 'int', default: 0 })
  ignoradosJobNameInvalido!: number;

  @Column({ name: 'ignorados_max_attempt', type: 'int', default: 0 })
  ignoradosMaxAttempt!: number;

  @Column({ type: 'varchar', default: 'success' })
  status!: DlqReprocessStatus;

  @Column({ name: 'sample_jobs', type: 'jsonb', nullable: true })
  sampleJobs!: Record<string, unknown>[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
