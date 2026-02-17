import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Atividade } from './atividade.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

export enum EstagioOportunidade {
  LEADS = 'leads',
  QUALIFICACAO = 'qualification',
  PROPOSTA = 'proposal',
  NEGOCIACAO = 'negotiation',
  FECHAMENTO = 'closing',
  GANHO = 'won',
  PERDIDO = 'lost',
}

export enum PrioridadeOportunidade {
  BAIXA = 'low',
  MEDIA = 'medium',
  ALTA = 'high',
}

export enum OrigemOportunidade {
  WEBSITE = 'website',
  INDICACAO = 'indicacao',
  TELEFONE = 'telefone',
  EMAIL = 'email',
  REDES_SOCIAIS = 'redes_sociais',
  EVENTO = 'evento',
  PARCEIRO = 'parceiro',
  CAMPANHA = 'campanha',
}

@Entity('oportunidades')
export class Oportunidade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  empresa_id: string;

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
    default: EstagioOportunidade.LEADS,
  })
  estagio: EstagioOportunidade;

  @Column({
    type: 'enum',
    enum: PrioridadeOportunidade,
    default: PrioridadeOportunidade.MEDIA,
  })
  prioridade: PrioridadeOportunidade;

  @Column({
    type: 'enum',
    enum: OrigemOportunidade,
    default: OrigemOportunidade.WEBSITE,
  })
  origem: OrigemOportunidade;

  @Column({ type: 'simple-array', nullable: true, comment: 'Tags separadas por virgula' })
  tags: string[];

  @Column({ type: 'date', name: 'dataFechamentoEsperado', nullable: true })
  dataFechamentoEsperado: Date;

  @Column({ type: 'date', name: 'dataFechamentoReal', nullable: true })
  dataFechamentoReal: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: User;

  @Column('uuid', { name: 'responsavel_id' })
  responsavel_id: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column('uuid', { nullable: true })
  cliente_id: string;

  @Column({ type: 'varchar', name: 'nomeContato', length: 255, nullable: true })
  nomeContato: string;

  @Column({ type: 'varchar', name: 'emailContato', length: 255, nullable: true })
  emailContato: string;

  @Column({ type: 'varchar', name: 'telefoneContato', length: 20, nullable: true })
  telefoneContato: string;

  @Column({ type: 'varchar', name: 'empresaContato', length: 255, nullable: true })
  empresaContato: string;

  @OneToMany(() => Atividade, (atividade) => atividade.oportunidade)
  atividades: Atividade[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  valorFormatado?: string;
}
