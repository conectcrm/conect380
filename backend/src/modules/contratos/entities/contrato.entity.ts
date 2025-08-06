import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Proposta } from '../../propostas/proposta.entity';
import { User } from '../../users/user.entity';
import { AssinaturaContrato } from './assinatura-contrato.entity';

export enum StatusContrato {
  AGUARDANDO_ASSINATURA = 'aguardando_assinatura',
  ASSINADO = 'assinado',
  CANCELADO = 'cancelado',
  EXPIRADO = 'expirado'
}

export enum TipoContrato {
  SERVICO = 'servico',
  PRODUTO = 'produto',
  MISTO = 'misto',
  MANUTENCAO = 'manutencao'
}

@Entity('contratos')
export class Contrato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: string;

  @Column()
  propostaId: number;

  @ManyToOne(() => Proposta, { eager: true })
  @JoinColumn({ name: 'propostaId' })
  proposta: Proposta;

  @Column()
  clienteId: number;

  @Column()
  usuarioResponsavelId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioResponsavelId' })
  usuarioResponsavel: User;

  @Column({
    type: 'enum',
    enum: TipoContrato,
    default: TipoContrato.SERVICO
  })
  tipo: TipoContrato;

  @Column({
    type: 'enum',
    enum: StatusContrato,
    default: StatusContrato.AGUARDANDO_ASSINATURA
  })
  status: StatusContrato;

  @Column({ type: 'text' })
  objeto: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorTotal: number;

  @Column({ type: 'date' })
  dataInicio: Date;

  @Column({ type: 'date' })
  dataFim: Date;

  @Column({ type: 'date', nullable: true })
  dataAssinatura: Date;

  @Column({ type: 'date' })
  dataVencimento: Date;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'text', nullable: true })
  clausulasEspeciais: string;

  @Column({ type: 'json', nullable: true })
  condicoesPagamento: {
    parcelas: number;
    formaPagamento: string;
    diaVencimento: number;
    valorParcela: number;
  };

  @Column({ type: 'text', nullable: true })
  caminhoArquivoPDF: string;

  @Column({ type: 'text', nullable: true })
  hashDocumento: string;

  @OneToMany(() => AssinaturaContrato, assinatura => assinatura.contrato)
  assinaturas: AssinaturaContrato[];

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  isAssinado(): boolean {
    return this.status === StatusContrato.ASSINADO;
  }

  isVencido(): boolean {
    return new Date() > this.dataVencimento && this.status === StatusContrato.AGUARDANDO_ASSINATURA;
  }

  getTempoRestanteAssinatura(): number {
    if (this.status !== StatusContrato.AGUARDANDO_ASSINATURA) return 0;
    const agora = new Date();
    const vencimento = new Date(this.dataVencimento);
    return Math.max(0, Math.ceil((vencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
