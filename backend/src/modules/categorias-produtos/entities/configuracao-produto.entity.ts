import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { SubcategoriaProduto } from './subcategoria-produto.entity';

@Entity('configuracoes_produtos')
export class ConfiguracaoProduto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'subcategoria_id' })
  subcategoriaId: string;

  @ManyToOne(() => SubcategoriaProduto, (subcategoria) => subcategoria.configuracoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subcategoria_id' })
  subcategoria: SubcategoriaProduto;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  multiplicador: number;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

