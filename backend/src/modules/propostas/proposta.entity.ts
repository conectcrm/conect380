import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export interface ProdutoProposta {
  id: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

export interface ClienteProposta {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  documento?: string;
  status?: string;
}

@Entity('propostas')
export class Proposta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: string;

  @Column({ nullable: true })
  titulo: string;

  @Column('jsonb')
  cliente: ClienteProposta;

  @Column('jsonb', { default: [] })
  produtos: ProdutoProposta[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  descontoGlobal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  impostos: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valor: number;

  @Column({
    type: 'enum',
    enum: ['avista', 'boleto', 'cartao', 'pix', 'recorrente'],
    default: 'avista'
  })
  formaPagamento: string;

  @Column({ default: 30 })
  validadeDias: number;

  @Column('text', { nullable: true })
  observacoes: string;

  @Column({ default: false })
  incluirImpostosPDF: boolean;

  @Column({
    type: 'enum',
    enum: ['rascunho', 'enviada', 'visualizada', 'aprovada', 'rejeitada', 'expirada'],
    default: 'rascunho'
  })
  status: string;

  @Column({ nullable: true })
  dataVencimento: Date;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  vendedor_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User;

  @Column({ nullable: true })
  empresa_id: string;

  @Column('jsonb', { nullable: true })
  portalAccess: {
    accessedAt?: string;
    ip?: string;
    userAgent?: string;
  };

  @Column('jsonb', { nullable: true })
  emailDetails: {
    sentAt?: string;
    emailCliente?: string;
    linkPortal?: string;
  };

  @CreateDateColumn()
  criadaEm: Date;

  @UpdateDateColumn()
  atualizadaEm: Date;

  // Getters para compatibilidade com a interface existente
  get createdAt(): string {
    return this.criadaEm?.toISOString();
  }

  get updatedAt(): string {
    return this.atualizadaEm?.toISOString();
  }
}
