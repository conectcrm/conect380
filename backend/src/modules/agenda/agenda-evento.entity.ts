import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Interacao } from '../interacoes/interacao.entity';

export enum AgendaStatus {
  CONFIRMADO = 'confirmado',
  PENDENTE = 'pendente',
  CANCELADO = 'cancelado',
}

export enum AgendaPrioridade {
  ALTA = 'alta',
  MEDIA = 'media',
  BAIXA = 'baixa',
}

export enum AgendaAttendeeRsvpStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
}

@Entity('agenda_eventos')
export class AgendaEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fim?: Date;

  @Column({ type: 'boolean', default: false })
  all_day: boolean;

  @Column({ type: 'enum', enum: AgendaStatus, default: AgendaStatus.CONFIRMADO })
  status: AgendaStatus;

  @Column({ type: 'enum', enum: AgendaPrioridade, default: AgendaPrioridade.MEDIA })
  prioridade: AgendaPrioridade;

  @Column({ type: 'varchar', length: 255, nullable: true })
  local?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string;

  @Column({ type: 'jsonb', nullable: true })
  attendees?: string[];

  @Column({ type: 'jsonb', nullable: true })
  attendee_responses?: Record<string, AgendaAttendeeRsvpStatus>;

  @Column('uuid', { nullable: true })
  criado_por_id?: string;

  @Column('uuid', { nullable: true })
  interacao_id?: string;

  @ManyToOne(() => Interacao, { nullable: true })
  @JoinColumn({ name: 'interacao_id' })
  interacao?: Interacao;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
