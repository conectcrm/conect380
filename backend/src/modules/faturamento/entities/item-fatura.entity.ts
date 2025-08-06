import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Fatura } from './fatura.entity';

@Entity('itens_fatura')
export class ItemFatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  faturaId: number;

  @ManyToOne(() => Fatura, fatura => fatura.itens)
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
}
