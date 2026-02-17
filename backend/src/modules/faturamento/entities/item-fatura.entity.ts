import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Fatura } from './fatura.entity';

@Entity('itens_fatura')
export class ItemFatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  faturaId: number;

  @ManyToOne(() => Fatura, (fatura) => fatura.itens)
  @JoinColumn({ name: 'faturaId' })
  fatura: Fatura;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorTotal: number;

  @Column({ type: 'text', nullable: true })
  unidade: string;

  @Column({ type: 'text', nullable: true })
  codigoProduto: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentualDesconto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorDesconto: number;

  // Métodos auxiliares
  calcularValorTotal(): number {
    const subtotal = this.quantidade * this.valorUnitario;
    return subtotal - this.valorDesconto;
  }

  calcularValorDesconto(): number {
    if (this.percentualDesconto > 0) {
      const subtotal = this.quantidade * this.valorUnitario;
      return subtotal * (this.percentualDesconto / 100);
    }
    return this.valorDesconto || 0;
  }

  @BeforeInsert()
  @BeforeUpdate()
  private recomputarValorTotal() {
    // Evitar sobrescrever se campos não definidos ainda
    if (this.quantidade == null || this.valorUnitario == null) return;
    const quantidadeNum = Number(this.quantidade);
    const valorUnitNum = Number(this.valorUnitario);
    const subtotal = quantidadeNum * valorUnitNum;
    const descontoValor = Number(this.valorDesconto) || 0;
    const descontoPerc = Number(this.percentualDesconto) || 0;
    const descontoPercValor = descontoPerc > 0 ? (subtotal * descontoPerc) / 100 : 0;
    const total = subtotal - descontoValor - descontoPercValor;
    // Garantir duas casas decimais
    this.valorTotal = Number(total.toFixed(2));
  }
}
