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

  @Column({
    type: 'enum',
    enum: TipoAtividade,
    default: TipoAtividade.NOTA,
  })
  tipo: TipoAtividade;

  @Column('text')
  descricao: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dataAtividade: Date;

  // Relacionamentos
  @ManyToOne(() => Oportunidade, (oportunidade) => oportunidade.atividades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oportunidade_id' })
  oportunidade: Oportunidade;

  @Column('int')
  oportunidade_id: number;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'criado_por_id' })
  criadoPor: User;

  @Column('varchar')
  criado_por_id: string;

  @CreateDateColumn()
  createdAt: Date;
}
