import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Demanda } from './demanda.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum StatusSincronizacao {
  PENDENTE = 'pendente',
  SINCRONIZADO = 'sincronizado',
  ERRO = 'erro',
  CONFLITO = 'conflito',
}

@Entity('atendimento_redmine_integrations')
@Index(['demandaId'])
@Index(['empresaId'])
@Index(['redmineIssueId'])
export class RedmineIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Vínculo com demanda
  @Column({ type: 'uuid', name: 'demanda_id' })
  demandaId: string;

  @ManyToOne(() => Demanda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'demanda_id' })
  demanda: Demanda;

  // Vínculo com empresa
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Dados Redmine
  @Column({ type: 'varchar', length: 255, name: 'redmine_url' })
  redmineUrl: string;

  @Column({ type: 'int', name: 'redmine_issue_id' })
  redmineIssueId: number;

  @Column({ type: 'int', name: 'redmine_project_id' })
  redmineProjectId: number;

  // Sincronização
  @Column({
    type: 'enum',
    enum: StatusSincronizacao,
    default: StatusSincronizacao.PENDENTE,
    name: 'status_sincronizacao',
  })
  statusSincronizacao: StatusSincronizacao;

  @Column({ type: 'timestamp', name: 'ultima_sincronizacao', nullable: true })
  ultimaSincronizacao: Date;

  @Column({ type: 'text', name: 'erro_sincronizacao', nullable: true })
  erroSincronizacao: string;

  // Metadados da issue Redmine (cache)
  @Column({ type: 'jsonb', nullable: true })
  metadados: {
    tracker_id?: number;
    status_id?: number;
    priority_id?: number;
    assigned_to_id?: number;
    done_ratio?: number;
    updated_on?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
