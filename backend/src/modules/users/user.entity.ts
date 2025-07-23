import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VENDEDOR = 'vendedor',
  USER = 'user',
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

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissoes: string[];

  @Column('uuid')
  empresa_id: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ length: 10, default: 'pt-BR' })
  idioma_preferido: string;

  @Column({ type: 'json', nullable: true })
  configuracoes: {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
  };

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_login: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Empresa, empresa => empresa.usuarios)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
