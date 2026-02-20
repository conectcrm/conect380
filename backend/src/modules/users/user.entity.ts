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

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  GERENTE = 'gerente',
  MANAGER = 'gerente', // alias legado
  VENDEDOR = 'vendedor',
  SUPORTE = 'suporte',
  USER = 'suporte', // alias legado
  FINANCEIRO = 'financeiro',
}

const USER_ROLE_DB_VALUES: string[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.GERENTE,
  UserRole.VENDEDOR,
  UserRole.SUPORTE,
  UserRole.FINANCEIRO,
];

export enum StatusAtendente {
  DISPONIVEL = 'DISPONIVEL',
  OCUPADO = 'OCUPADO',
  AUSENTE = 'AUSENTE',
  OFFLINE = 'OFFLINE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ length: 20, nullable: true, select: false, insert: false, update: false })
  telefone: string;

  // Keep alias keys in UserRole for legacy code paths, but only persist unique enum labels in DB.
  @Column({ type: 'enum', enum: USER_ROLE_DB_VALUES, default: UserRole.VENDEDOR })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true, select: false, insert: false, update: false })
  permissoes: string[];

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'text', nullable: true, select: false, insert: false, update: false })
  avatar_url: string;

  @Column({
    length: 10,
    default: 'pt-BR',
    select: false,
    insert: false,
    update: false,
  })
  idioma_preferido: string;

  @Column({ type: 'json', nullable: true, select: false, insert: false, update: false })
  configuracoes: {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
  };

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: false })
  deve_trocar_senha: boolean;

  @Column({ type: 'enum', enum: StatusAtendente, nullable: true })
  status_atendente: StatusAtendente;

  @Column({ type: 'integer', default: 5, nullable: true })
  capacidade_maxima: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  tickets_ativos: number;

  @Column({ type: 'timestamp', nullable: true, select: false, insert: false, update: false })
  ultimo_login: Date;

  @CreateDateColumn({ name: 'criado_em' })
  created_at: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  updated_at: Date;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
