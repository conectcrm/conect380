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

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 50 })
  categoria: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  custoUnitario: number;

  @Column({ type: 'varchar', length: 50, default: 'produto' })
  tipoItem: string;

  @Column({ type: 'varchar', length: 50, default: 'unico' })
  frequencia: string;

  @Column({ type: 'varchar', length: 50, default: 'unidade' })
  unidadeMedida: string;

  @Column({ type: 'varchar', length: 20, default: 'ativo' })
  status: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255, default: 'Interno' })
  fornecedor: string;

  // Campos de estoque
  @Column({ type: 'int', default: 0 })
  estoqueAtual: number;

  @Column({ type: 'int', default: 0 })
  estoqueMinimo: number;

  @Column({ type: 'int', default: 0 })
  estoqueMaximo: number;

  // Campos de vendas
  @Column({ type: 'int', default: 0 })
  vendasMes: number;

  @Column({ type: 'int', default: 0 })
  vendasTotal: number;

  // Tags como JSON
  @Column({ type: 'json', nullable: true })
  tags?: string[];

  // Variações como JSON
  @Column({ type: 'json', nullable: true })
  variacoes?: string[];

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
