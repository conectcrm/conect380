import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 20, unique: true })
  cnpj: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'text', nullable: true })
  endereco: string;

  @Column({ length: 100, nullable: true })
  cidade: string;

  @Column({ length: 2, nullable: true })
  estado: string;

  @Column({ length: 10, nullable: true })
  cep: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'json', nullable: true })
  configuracoes: {
    tema?: {
      cor_primaria?: string;
      cor_secundaria?: string;
      fonte?: string;
    };
    idioma_padrao?: string;
    timezone?: string;
  };

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, user => user.empresa)
  usuarios: User[];
}
