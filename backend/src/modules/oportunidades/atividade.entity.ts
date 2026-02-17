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

  @Column({ type: 'varchar' })
  tipo: TipoAtividade;

  @Column('text')
  descricao: string;

  @Column({ type: 'timestamp', name: 'dataAtividade' })
  dataAtividade: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
