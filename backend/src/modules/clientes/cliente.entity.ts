import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
// import { Contato } from './contato.entity';

export enum StatusCliente {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  CLIENTE = 'cliente',
  INATIVO = 'inativo',
}

export enum TipoCliente {
  PESSOA_FISICA = 'pessoa_fisica',
  PESSOA_JURIDICA = 'pessoa_juridica',
}

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'enum', enum: TipoCliente })
  tipo: TipoCliente;

  @Column({ length: 20, nullable: true })
  documento: string; // CPF ou CNPJ

  @Column({ type: 'enum', enum: StatusCliente, default: StatusCliente.LEAD })
  status: StatusCliente;

  @Column({ type: 'text', nullable: true })
  endereco: string;

  @Column({ length: 100, nullable: true })
  cidade: string;

  @Column({ length: 2, nullable: true })
  estado: string;

  @Column({ length: 10, nullable: true })
  cep: string;

  @Column({ length: 100, nullable: true })
  empresa: string;

  @Column({ length: 100, nullable: true })
  cargo: string;

  @Column({ length: 100, nullable: true })
  origem: string; // Como conheceu a empresa

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa_rel: Empresa;

  @Column('uuid', { nullable: true })
  responsavel_id: string; // Vendedor responsável

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_estimado: number;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_contato: Date;

  @Column({ type: 'timestamp', nullable: true })
  proximo_contato: Date;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresaRel: Empresa;

  /**
   * Relacionamento OneToMany: Um Cliente pode ter vários Contatos
   * Contatos são os funcionários/pessoas vinculadas à empresa (cliente)
   *
   * NOTA: Comentado temporariamente para resolver referência circular
   */
  // @OneToMany(() => Contato, (contato) => contato.cliente, {
  //   cascade: true, // Salva contatos automaticamente ao salvar cliente
  // })
  // contatos: Contato[];
}
