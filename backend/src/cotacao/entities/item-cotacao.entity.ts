import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cotacao } from './cotacao.entity';

@Entity('itens_cotacao')
@Index(['cotacaoId'])
@Index(['ordem'])
export class ItemCotacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cotacao_id' })
  cotacaoId: string;

  @ManyToOne(() => Cotacao, (cotacao) => cotacao.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cotacao_id' })
  cotacao: Cotacao;

  @Column({ type: 'int', default: 1 })
  ordem: number;

  @Column({ length: 500 })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number;

  @Column({ length: 20 })
  unidade: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  valorUnitario: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorTotal: number;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  // Campos adicionais
  @Column({ length: 100, nullable: true })
  codigo: string;

  @Column({ length: 200, nullable: true })
  categoria: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  desconto: number; // percentual

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorDesconto: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  aliquotaImposto: number; // percentual

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorImposto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  valorLiquido: number;

  @Column({ type: 'int', nullable: true })
  prazoEntregaDias: number;

  @Column({ type: 'json', nullable: true })
  especificacoes: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadados: Record<string, any>;

  // Campos de controle
  @CreateDateColumn({ name: 'data_criacao' })
  dataCriacao: Date;

  @UpdateDateColumn({ name: 'data_atualizacao' })
  dataAtualizacao: Date;

  @Column({ name: 'criado_por' })
  criadoPor: string;

  @Column({ name: 'atualizado_por' })
  atualizadoPor: string;

  // Campos de integração
  @Column({ length: 100, nullable: true, name: 'id_produto_externo' })
  idProdutoExterno: string;

  @Column({ length: 100, nullable: true, name: 'sku' })
  sku: string;

  @Column({ length: 100, nullable: true, name: 'ncm' })
  ncm: string;

  // Método para calcular valor total
  calcularValorTotal(): number {
    const valorComDesconto = this.valorUnitario * (1 - (this.desconto || 0) / 100);
    const valorBruto = this.quantidade * valorComDesconto;
    const valorComImposto = valorBruto * (1 + (this.aliquotaImposto || 0) / 100);
    return valorComImposto;
  }

  // Método para atualizar valores calculados
  atualizarValores(): void {
    this.valorDesconto = (this.valorUnitario * this.quantidade * (this.desconto || 0)) / 100;
    this.valorImposto =
      ((this.valorUnitario * this.quantidade - this.valorDesconto) * (this.aliquotaImposto || 0)) /
      100;
    this.valorTotal = this.calcularValorTotal();
    this.valorLiquido = this.valorTotal - this.valorImposto;
  }
}
