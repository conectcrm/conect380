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

  @Column({ type: 'decimal', name: 'custoUnitario', precision: 10, scale: 2, default: 0 })
  custoUnitario: number;

  @Column({ type: 'varchar', name: 'tipoItem', length: 100 })
  tipoItem: string;

  @Column({ type: 'varchar', length: 100 })
  frequencia: string;

  @Column({ type: 'varchar', name: 'unidadeMedida', length: 100 })
  unidadeMedida: string;

  @Column({ type: 'varchar', length: 100 })
  status: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  fornecedor: string;

  @Column({ type: 'int', name: 'estoqueAtual', default: 0 })
  estoqueAtual: number;

  @Column({ type: 'int', name: 'estoqueMinimo', default: 0 })
  estoqueMinimo: number;

  @Column({ type: 'int', name: 'estoqueMaximo', default: 0 })
  estoqueMaximo: number;

  @Column({ type: 'int', name: 'vendasMes', default: 0 })
  vendasMes: number;

  @Column({ type: 'int', name: 'vendasTotal', default: 0 })
  vendasTotal: number;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  variacoes?: string[];

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizadoEm' })
  atualizadoEm: Date;

  // Compatibilidade de resposta com clientes legados/testes.
  empresa_id?: string;
  ativo?: boolean;
}
