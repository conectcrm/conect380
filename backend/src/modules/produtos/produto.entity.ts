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

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column({
    type: 'decimal',
    name: 'custoUnitario',
    precision: 10,
    scale: 2,
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  custoUnitario: number;

  @Column({
    type: 'varchar',
    name: 'tipoItem',
    length: 100,
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  tipoItem: string;

  @Column({ type: 'varchar', length: 100, nullable: true, select: false, insert: false, update: false })
  frequencia: string;

  @Column({
    type: 'varchar',
    name: 'unidadeMedida',
    length: 100,
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  unidadeMedida: string;

  @Column({ type: 'varchar', length: 100, nullable: true, select: false, insert: false, update: false })
  status: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false, insert: false, update: false })
  fornecedor: string;

  @Column({ type: 'int', name: 'estoque', default: 0, nullable: true })
  estoqueAtual: number;

  @Column({
    type: 'int',
    name: 'estoqueMinimo',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  estoqueMinimo: number;

  @Column({
    type: 'int',
    name: 'estoqueMaximo',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  estoqueMaximo: number;

  @Column({ type: 'int', name: 'vendasMes', nullable: true, select: false, insert: false, update: false })
  vendasMes: number;

  @Column({
    type: 'int',
    name: 'vendasTotal',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  vendasTotal: number;

  @Column({ type: 'json', nullable: true, select: false, insert: false, update: false })
  tags?: string[];

  @Column({ type: 'json', nullable: true, select: false, insert: false, update: false })
  variacoes?: string[];

  @Column({ type: 'boolean', name: 'ativo', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  // Compatibilidade de resposta com clientes legados/testes.
  empresa_id?: string;
}
