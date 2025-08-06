import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { User } from '../../users/user.entity';
import { ItemFatura } from './item-fatura.entity';
import { Pagamento } from './pagamento.entity';

export enum StatusFatura {
  PENDENTE = 'pendente',
  ENVIADA = 'enviada',
  PAGA = 'paga',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  PARCIALMENTE_PAGA = 'parcialmente_paga'
}

export enum TipoFatura {
  UNICA = 'unica',
  RECORRENTE = 'recorrente',
  PARCELA = 'parcela',
  ADICIONAL = 'adicional'
}

export enum FormaPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  DINHEIRO = 'dinheiro'
}

@Entity('faturas')
export class Fatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: string;

  @Column()
  contratoId: number;

  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'contratoId' })
  contrato: Contrato;

  @Column()
  clienteId: number;

  @Column()
  usuarioResponsavelId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioResponsavelId' })
  usuarioResponsavel: User;

  @Column({
    type: 'enum',
    enum: TipoFatura,
    default: TipoFatura.UNICA
  })
  tipo: TipoFatura;

  @Column({
    type: 'enum',
    enum: StatusFatura,
    default: StatusFatura.PENDENTE
  })
  status: StatusFatura;

  @Column({
    type: 'enum',
    enum: FormaPagamento,
    nullable: true
  })
  formaPagamentoPreferida: FormaPagamento;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorPago: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorDesconto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorJuros: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorMulta: number;

  @Column({ type: 'date' })
  dataEmissao: Date;

  @Column({ type: 'date' })
  dataVencimento: Date;

  @Column({ type: 'date', nullable: true })
  dataPagamento: Date;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'text', nullable: true })
  linkPagamento: string;

  @Column({ type: 'text', nullable: true })
  qrCodePix: string;

  @Column({ type: 'text', nullable: true })
  codigoBoleto: string;

  @Column({ type: 'json', nullable: true })
  metadados: {
    gateway?: string;
    transactionId?: string;
    paymentMethod?: string;
    installments?: number;
  };

  @OneToMany(() => ItemFatura, item => item.fatura, { cascade: true })
  itens: ItemFatura[];

  @OneToMany(() => Pagamento, pagamento => pagamento.fatura)
  pagamentos: Pagamento[];

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  isPaga(): boolean {
    return this.status === StatusFatura.PAGA;
  }

  isVencida(): boolean {
    const hoje = new Date();
    return this.dataVencimento < hoje && this.status === StatusFatura.PENDENTE;
  }

  getValorRestante(): number {
    return Math.max(0, this.valorTotal - this.valorPago);
  }

  getValorComJurosMulta(): number {
    return this.valorTotal + this.valorJuros + this.valorMulta - this.valorDesconto;
  }

  getDiasAtraso(): number {
    if (!this.isVencida()) return 0;
    const hoje = new Date();
    const diffTime = hoje.getTime() - this.dataVencimento.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPercentualPago(): number {
    return this.valorTotal > 0 ? (this.valorPago / this.valorTotal) * 100 : 0;
  }
}
