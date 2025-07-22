import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../modules/users/user.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

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

  @Column({ default: 'starter' })
  plano: string;

  @Column({ 
    type: 'enum', 
    enum: ['ativa', 'inativa', 'trial', 'suspensa'],
    default: 'trial'
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  data_expiracao: Date;

  @Column({ default: false })
  email_verificado: boolean;

  @Column({ nullable: true })
  token_verificacao: string;

  @Column({ type: 'json', nullable: true })
  configuracoes: any;

  @Column({ type: 'json', nullable: true })
  limites: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, user => user.empresa)
  usuarios: User[];
}
