import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { User } from '../users/user.entity';
import { Oportunidade } from './oportunidade.entity';

@Entity('oportunidade_stage_events')
export class OportunidadeStageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Oportunidade, (oportunidade) => oportunidade.stageEvents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'oportunidade_id' })
  oportunidade: Oportunidade;

  @Column('uuid')
  oportunidade_id: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  from_stage: string | null;

  @Column({ type: 'varchar', length: 80 })
  to_stage: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  changed_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User | null;

  @Column('uuid', { nullable: true })
  changed_by: string | null;

  @Column({ type: 'varchar', length: 40 })
  source: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
