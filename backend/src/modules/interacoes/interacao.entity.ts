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
import { Lead } from '../leads/lead.entity';
import { Contato } from '../clientes/contato.entity';
import { User } from '../users/user.entity';

export enum TipoInteracao {
  CHAMADA = 'chamada',
  EMAIL = 'email',
  REUNIAO = 'reuniao',
  NOTA = 'nota',
  OUTRO = 'outro',
}

@Entity('interacoes')
export class Interacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50 })
  tipo: TipoInteracao;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo?: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'timestamp', nullable: true })
  data_referencia?: Date;

  @Column({ type: 'timestamp', nullable: true })
  proxima_acao_em?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  proxima_acao_descricao?: string;

  @Column('uuid', { nullable: true })
  agenda_event_id?: string;

  @Column('uuid', { nullable: true })
  lead_id?: string;

  @ManyToOne(() => Lead, { nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead?: Lead;

  @Column('uuid', { nullable: true })
  contato_id?: string;

  @ManyToOne(() => Contato, { nullable: true })
  @JoinColumn({ name: 'contato_id' })
  contato?: Contato;

  @Column('uuid', { nullable: true })
  responsavel_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel?: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

