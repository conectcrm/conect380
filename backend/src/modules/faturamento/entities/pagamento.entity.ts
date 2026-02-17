import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Fatura } from './fatura.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum StatusPagamento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
  ESTORNADO = 'estornado',
}

export enum TipoPagamento {
  PAGAMENTO = 'pagamento',
  ESTORNO = 'estorno',
  AJUSTE = 'ajuste',
  DESCONTO = 'desconto',
}

@Entity('pagamentos')
export class Pagamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', name: 'empresa_id' })
  @Index('idx_pagamentos_empresa_id')
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column()
  faturaId: number;

  @ManyToOne(() => Fatura, (fatura) => fatura.pagamentos)
  @JoinColumn({ name: 'faturaId' })
  fatura: Fatura;

  @Column({ unique: true })
  transacaoId: string;

  @Column({
    type: 'enum',
    enum: TipoPagamento,
    default: TipoPagamento.PAGAMENTO,
  })
  tipo: TipoPagamento;

  @Column({
    type: 'enum',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE,
  })
  status: StatusPagamento;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxa: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorLiquido: number;

  @Column({ type: 'text' })
  metodoPagamento: string; // pix, cartao_credito, boleto, etc.

  @Column({ type: 'text', nullable: true })
  gateway: string; // stripe, mercadopago, pagseguro

  @Column({ type: 'text', nullable: true })
  gatewayTransacaoId: string;

  @Column({ type: 'text', nullable: true })
  gatewayStatusRaw: string;

  @Column({ type: 'json', nullable: true })
  dadosCompletos: {
    cardBrand?: string;
    cardLast4?: string;
    installments?: number;
    authorizationCode?: string;
    pixQrCode?: string;
    boletoBarcode?: string;
    webhookData?: any;
  };

  @Column({ type: 'timestamp', nullable: true })
  dataProcessamento: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataAprovacao: Date;

  @Column({ type: 'text', nullable: true })
  motivoRejeicao: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn()
  createdAt: Date;

  // Métodos auxiliares
  isAprovado(): boolean {
    return this.status === StatusPagamento.APROVADO;
  }

  isPendente(): boolean {
    return this.status === StatusPagamento.PENDENTE;
  }

  isRejeitado(): boolean {
    return this.status === StatusPagamento.REJEITADO;
  }

  calcularValorLiquido(): number {
    return this.valor - this.taxa;
  }

  getTempoProcessamento(): number | null {
    if (!this.dataProcessamento || !this.createdAt) return null;
    const diffTime = this.dataProcessamento.getTime() - this.createdAt.getTime();
    return Math.ceil(diffTime / (1000 * 60)); // em minutos
  }
}
