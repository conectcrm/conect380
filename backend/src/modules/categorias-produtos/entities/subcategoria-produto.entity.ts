import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { CategoriaProduto } from './categoria-produto.entity';
import { ConfiguracaoProduto } from './configuracao-produto.entity';

@Entity('subcategorias_produtos')
export class SubcategoriaProduto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'categoria_id' })
  categoriaId: string;

  @ManyToOne(() => CategoriaProduto, (categoria) => categoria.subcategorias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProduto;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'decimal', name: 'preco_base', precision: 10, scale: 2, default: 0 })
  precoBase: number;

  @Column({ type: 'varchar', length: 60, default: 'unidade' })
  unidade: string;

  @Column({ type: 'json', name: 'campos_personalizados', nullable: true })
  camposPersonalizados?: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @OneToMany(() => ConfiguracaoProduto, (configuracao) => configuracao.subcategoria, {
    cascade: false,
  })
  configuracoes: ConfiguracaoProduto[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

