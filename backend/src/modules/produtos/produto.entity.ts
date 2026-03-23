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
import { CategoriaProduto } from '../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../categorias-produtos/entities/configuracao-produto.entity';

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

  @Column({ type: 'uuid', name: 'categoria_id', nullable: true })
  categoriaId?: string | null;

  @ManyToOne(() => CategoriaProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoriaRelacionada?: CategoriaProduto | null;

  @Column({ type: 'uuid', name: 'subcategoria_id', nullable: true })
  subcategoriaId?: string | null;

  @ManyToOne(() => SubcategoriaProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategoria_id' })
  subcategoria?: SubcategoriaProduto | null;

  @Column({ type: 'uuid', name: 'configuracao_id', nullable: true })
  configuracaoId?: string | null;

  @ManyToOne(() => ConfiguracaoProduto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'configuracao_id' })
  configuracao?: ConfiguracaoProduto | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column({
    type: 'decimal',
    name: 'custoUnitario',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  custoUnitario?: number | null;

  @Column({
    type: 'varchar',
    name: 'tipoItem',
    length: 100,
    nullable: true,
  })
  tipoItem: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  frequencia: string;

  @Column({
    type: 'varchar',
    name: 'unidadeMedida',
    length: 100,
    nullable: true,
  })
  unidadeMedida: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fornecedor: string;

  @Column({ type: 'int', name: 'estoque', default: 0, nullable: true })
  estoqueAtual: number;

  @Column({
    type: 'int',
    name: 'estoqueMinimo',
    nullable: true,
  })
  estoqueMinimo: number;

  @Column({
    type: 'int',
    name: 'estoqueMaximo',
    nullable: true,
  })
  estoqueMaximo: number;

  @Column({ type: 'int', name: 'vendasMes', nullable: true })
  vendasMes: number;

  @Column({
    type: 'int',
    name: 'vendasTotal',
    nullable: true,
  })
  vendasTotal: number;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  variacoes?: string[];

  @Column({ type: 'varchar', name: 'tipoLicenciamento', length: 100, nullable: true })
  tipoLicenciamento?: string;

  @Column({ type: 'varchar', name: 'periodicidadeLicenca', length: 100, nullable: true })
  periodicidadeLicenca?: string;

  @Column({ type: 'boolean', name: 'renovacaoAutomatica', default: false, nullable: true })
  renovacaoAutomatica?: boolean;

  @Column({ type: 'int', name: 'quantidadeLicencas', nullable: true })
  quantidadeLicencas?: number;

  @Column({ type: 'boolean', name: 'ativo', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  // Compatibilidade de resposta com clientes legados/testes.
  empresa_id?: string;
}
