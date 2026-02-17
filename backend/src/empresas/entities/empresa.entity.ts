import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../modules/users/user.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ unique: true })
  cnpj: string;

  @Column({ unique: true })
  email: string;

  @Column()
  telefone: string;

  @Column()
  endereco: string;

  @Column()
  cidade: string;

  @Column({ length: 2 })
  estado: string;

  @Column()
  cep: string;

  @Column({ unique: true })
  subdominio: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: 'starter' })
  plano: string;

  @Column({ type: 'varchar', length: 30, default: 'trial' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  trial_end_date: Date;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'timestamp', nullable: true })
  data_expiracao: Date;

  @Column({ default: false })
  email_verificado: boolean;

  @Column({ nullable: true })
  token_verificacao: string;

  @Column({ type: 'json', nullable: true })
  configuracoes: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  limites: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };

  @Column({ type: 'json', nullable: true })
  uso_mensal: {
    clientes?: number;
    tickets?: number;
    storage_mb?: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_mensal: number;

  @Column({ type: 'text', nullable: true })
  notas_internas: string;

  @Column({ type: 'uuid', nullable: true })
  account_manager_id: string;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_acesso: Date;

  @Column({ type: 'integer', nullable: true })
  health_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.empresa)
  usuarios: User[];
}
