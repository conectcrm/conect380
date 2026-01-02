import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { User } from '../../users/user.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { ItemFatura } from './item-fatura.entity';
import { Pagamento } from './pagamento.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

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
@Index(['clienteId', 'status'])
@Index(['dataVencimento', 'status'])
@Index(['numero'], { unique: true })
export class Fatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ unique: true })
  numero: string;

  @Column({ nullable: true })
  contratoId: number;

  @ManyToOne(() => Contrato, { eager: false })
  @JoinColumn({ name: 'contratoId' })
  contrato: Contrato;

  // ✅ CORREÇÃO: Usar UUID nativo para clienteId
  @Column('uuid')
  @Index()
  clienteId: string;

  // ✅ CORREÇÃO: Restaurar relacionamento TypeORM nativo
  @ManyToOne(() => Cliente, { eager: false })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column('uuid')
  usuarioResponsavelId: string;

  @ManyToOne(() => User, { eager: false })
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
  @Index()
  status: StatusFatura;

  @Column({
    type: 'enum',
    enum: FormaPagamento,
    nullable: true,
  })
  formaPagamentoPreferida: FormaPagamento;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valorTotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorPago: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorDesconto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorJuros: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorMulta: number;

  @Column({ type: 'date' })
  @Index()
  dataEmissao: Date;

  @Column({ type: 'date' })
  @Index()
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
    migrationInfo?: {
      originalClienteId?: number;
      migratedAt?: string;
      migratedBy?: string;
    };
  };

  // ✅ CORREÇÃO: Relacionamento explícito com cascade controlado
  @OneToMany(() => ItemFatura, (item) => item.fatura, {
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete',
  })
  itens: ItemFatura[];

  @OneToMany(() => Pagamento, (pagamento) => pagamento.fatura, {
    cascade: ['insert', 'update'],
  })
  pagamentos: Pagamento[];

  @Column({ type: 'boolean', default: true })
  @Index()
  ativo: boolean;

  // ✅ CORREÇÃO: Campos de auditoria expandidos
  @Column('uuid', { nullable: true })
  criadoPor: string;

  @Column('uuid', { nullable: true })
  atualizadoPor: string;

  @CreateDateColumn()
  @Index()
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

  // ✅ MÉTODO PARA VALIDAÇÃO DE INTEGRIDADE
  validateIntegrity(): string[] {
    const errors: string[] = [];

    if (!this.clienteId) {
      errors.push('Cliente é obrigatório');
    }

    if (!this.usuarioResponsavelId) {
      errors.push('Usuário responsável é obrigatório');
    }

    if (Number(this.valorTotal) <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    if (Number(this.valorPago) < 0) {
      errors.push('Valor pago não pode ser negativo');
    }

    if (Number(this.valorPago) > Number(this.valorTotal)) {
      errors.push('Valor pago não pode ser maior que o total');
    }

    if (new Date(this.dataVencimento) < new Date(this.dataEmissao)) {
      errors.push('Data de vencimento deve ser posterior à data de emissão');
    }

    return errors;
  }

  // ✅ MÉTODO PARA APLICAR REGRAS DE NEGÓCIO
  applyBusinessRules(): void {
    // Auto-atualizar status baseado em pagamento
    const totalPago = Number(this.valorPago);
    const totalFatura = Number(this.valorTotal);

    if (totalPago >= totalFatura && this.status !== StatusFatura.CANCELADA) {
      this.status = StatusFatura.PAGA;
      if (!this.dataPagamento) {
        this.dataPagamento = new Date();
      }
    } else if (totalPago > 0 && totalPago < totalFatura) {
      this.status = StatusFatura.PARCIALMENTE_PAGA;
    } else if (this.isVencida() && this.status === StatusFatura.PENDENTE) {
      this.status = StatusFatura.VENCIDA;
    }
  }
}
