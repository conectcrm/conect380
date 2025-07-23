import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Atividade } from './atividade.entity';

export enum EstagioOportunidade {
  LEADS = 'leads',
  QUALIFICACAO = 'qualification',
  PROPOSTA = 'proposal',
  NEGOCIACAO = 'negotiation',
  FECHAMENTO = 'closing',
  GANHO = 'won',
  PERDIDO = 'lost'
}

export enum PrioridadeOportunidade {
  BAIXA = 'low',
  MEDIA = 'medium',
  ALTA = 'high'
}

export enum OrigemOportunidade {
  WEBSITE = 'website',
  INDICACAO = 'indicacao',
  TELEFONE = 'telefone',
  EMAIL = 'email',
  REDES_SOCIAIS = 'redes_sociais',
  EVENTO = 'evento',
  PARCEIRO = 'parceiro',
  CAMPANHA = 'campanha'
}

@Entity('oportunidades')
export class Oportunidade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  titulo: string;

  @Column('text', { nullable: true })
  descricao: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  valor: number;

  @Column({ type: 'int', default: 0, comment: 'Probabilidade de fechamento (0-100)' })
  probabilidade: number;

  @Column({
    type: 'enum',
    enum: EstagioOportunidade,
    default: EstagioOportunidade.LEADS
  })
  estagio: EstagioOportunidade;

  @Column({
    type: 'enum',
    enum: PrioridadeOportunidade,
    default: PrioridadeOportunidade.MEDIA
  })
  prioridade: PrioridadeOportunidade;

  @Column({
    type: 'enum',
    enum: OrigemOportunidade,
    default: OrigemOportunidade.WEBSITE
  })
  origem: OrigemOportunidade;

  @Column('simple-array', { nullable: true, comment: 'Tags separadas por vírgula' })
  tags: string[];

  @Column({ type: 'date', nullable: true })
  dataFechamentoEsperado: Date;

  @Column({ type: 'date', nullable: true })
  dataFechamentoReal: Date;

  // Relacionamentos
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: User;

  @Column('varchar')
  responsavel_id: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column('int', { nullable: true })
  cliente_id: number;

  // Informações de contato (se não houver cliente cadastrado)
  @Column({ length: 255, nullable: true })
  nomeContato: string;

  @Column({ length: 255, nullable: true })
  emailContato: string;

  @Column({ length: 20, nullable: true })
  telefoneContato: string;

  @Column({ length: 255, nullable: true })
  empresaContato: string;

  // Atividades relacionadas
  @OneToMany(() => Atividade, atividade => atividade.oportunidade, { cascade: true })
  atividades: Atividade[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Campos calculados/virtuais
  valorFormatado?: string;
  diasNoEstagio?: number;
  ultimaAtividade?: Date;
}
