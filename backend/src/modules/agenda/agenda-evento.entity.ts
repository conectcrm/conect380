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

export enum AgendaTipo {
  REUNIAO = 'reuniao',
  LIGACAO = 'ligacao',
  TAREFA = 'tarefa',
  EVENTO = 'evento',
  FOLLOW_UP = 'follow-up',
}

export enum AgendaLocationType {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

export enum AgendaReminderType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  BOTH = 'both',
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

  @Column({ type: 'timestamp with time zone' })
  inicio: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
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

  @Column({ type: 'enum', enum: AgendaTipo, default: AgendaTipo.EVENTO })
  tipo: AgendaTipo;

  @Column({ type: 'enum', enum: AgendaLocationType, default: AgendaLocationType.PRESENCIAL })
  location_type: AgendaLocationType;

  @Column({ type: 'int', nullable: true })
  reminder_time?: number | null;

  @Column({ type: 'enum', enum: AgendaReminderType, nullable: true })
  reminder_type?: AgendaReminderType | null;

  @Column({ type: 'boolean', default: false })
  email_offline: boolean;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[] | null;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'jsonb', nullable: true })
  recurring_pattern?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column('uuid', { nullable: true })
  responsavel_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responsavel_nome?: string | null;

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
