import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user.entity';

export enum AtividadeTipo {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CRIACAO = 'CRIACAO',
  EDICAO = 'EDICAO',
  EXCLUSAO = 'EXCLUSAO',
  ALTERACAO_STATUS = 'ALTERACAO_STATUS',
  RESET_SENHA = 'RESET_SENHA',
}

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @Column({
    type: 'enum',
    enum: AtividadeTipo,
    default: AtividadeTipo.LOGIN,
  })
  tipo: AtividadeTipo;

  @Column()
  descricao: string;

  @Column({ nullable: true, type: 'text' })
  detalhes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
