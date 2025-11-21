import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { User } from '../../users/user.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { ItemFatura } from './item-fatura.entity';
import { Pagamento } from './pagamento.entity';

export enum StatusFatura {
  PENDENTE = 'pendente',
  ENVIADA = 'enviada',
  PAGA = 'paga',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  PARCIALMENTE_PAGA = 'parcialmente_paga',
}

export enum TipoFatura {
  UNICA = 'unica',
  RECORRENTE = 'recorrente',
  PARCELA = 'parcela',
  ADICIONAL = 'adicional',
}

export enum FormaPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  DINHEIRO = 'dinheiro',
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

  // ✅ CORREÇÃO: Usar UUID nativo para clienteId
  @Column('uuid')
  clienteId: string;

  // ✅ CORREÇÃO: Restaurar relacionamento TypeORM nativo
  @ManyToOne(() => Cliente, { eager: false })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  usuarioResponsavelId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioResponsavelId' })
  usuarioResponsavel: User;

  @Column({
    type: 'enum',
    enum: TipoFatura,
    default: TipoFatura.UNICA,
  })
  tipo: TipoFatura;

  @Column({
    type: 'enum',
    enum: StatusFatura,
    default: StatusFatura.PENDENTE,
  })
  status: StatusFatura;

  @Column({
    type: 'enum',
    enum: FormaPagamento,
    nullable: true,
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

  // Removido cascade para garantir criação explícita dos itens (cálculo de valorTotal controlado)
  @OneToMany(() => ItemFatura, (item) => item.fatura)
  itens: ItemFatura[];

  @OneToMany(() => Pagamento, (pagamento) => pagamento.fatura)
  pagamentos: Pagamento[];

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ✅ MÉTODOS AUXILIARES SEGUROS
  isPaga(): boolean {
    return this.status === StatusFatura.PAGA;
  }

  isVencida(): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(this.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento < hoje && this.status === StatusFatura.PENDENTE;
  }

  getValorRestante(): number {
    return Math.max(0, Number(this.valorTotal) - Number(this.valorPago));
  }

  getValorComJurosMulta(): number {
    return (
      Number(this.valorTotal) +
      Number(this.valorJuros) +
      Number(this.valorMulta) -
      Number(this.valorDesconto)
    );
  }

  getDiasAtraso(): number {
    if (!this.isVencida()) return 0;
    const hoje = new Date();
    const diffTime = hoje.getTime() - new Date(this.dataVencimento).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPercentualPago(): number {
    const total = Number(this.valorTotal);
    const pago = Number(this.valorPago);
    return total > 0 ? (pago / total) * 100 : 0;
  }
}
