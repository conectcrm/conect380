import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Oportunidade } from './oportunidade.entity';
import { User } from '../users/user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

export enum TipoAtividade {
  LIGACAO = 'call',
  EMAIL = 'email',
  REUNIAO = 'meeting',
  NOTA = 'note',
  TAREFA = 'task',
}

export enum StatusAtividade {
  PENDENTE = 'pending',
  CONCLUIDA = 'completed',
}

@Entity('atividades')
export class Atividade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Oportunidade, (oportunidade) => oportunidade.atividades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oportunidade_id' })
  oportunidade: Oportunidade;

  @Column('int')
  oportunidade_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'criado_por_id' })
  criadoPor: User;

  @Column('uuid', { name: 'criado_por_id' })
  criado_por_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel?: User;

  @Column('uuid', { name: 'responsavel_id', nullable: true })
  responsavel_id?: string | null;

  @Column({ type: 'varchar' })
  tipo: TipoAtividade;

  @Column('text')
  descricao: string;

  @Column({ type: 'varchar', default: StatusAtividade.PENDENTE })
  status: StatusAtividade;

  @Column({ type: 'text', name: 'resultado_conclusao', nullable: true })
  resultadoConclusao?: string | null;

  @Column({ type: 'timestamp', name: 'dataAtividade' })
  dataAtividade: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'concluido_por' })
  concluidoPor?: User | null;

  @Column('uuid', { name: 'concluido_por', nullable: true })
  concluido_por?: string | null;

  @Column({ type: 'timestamp', name: 'concluido_em', nullable: true })
  concluidoEm?: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
