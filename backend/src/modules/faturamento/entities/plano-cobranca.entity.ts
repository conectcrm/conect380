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
import { Fatura } from './fatura.entity';

export enum StatusPlanoCobranca {
  ATIVO = 'ativo',
  PAUSADO = 'pausado',
  CANCELADO = 'cancelado',
  EXPIRADO = 'expirado',
}

export enum TipoRecorrencia {
  MENSAL = 'mensal',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
  PERSONALIZADO = 'personalizado',
}

@Entity('planos_cobranca')
export class PlanoCobranca {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  contratoId: number;

  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'contratoId' })
  contrato: Contrato;

  @Column('uuid')
  clienteId: string;

  @Column('uuid')
  usuarioResponsavelId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioResponsavelId' })
  usuarioResponsavel: User;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({
    type: 'enum',
    enum: TipoRecorrencia,
    default: TipoRecorrencia.MENSAL,
  })
  tipoRecorrencia: TipoRecorrencia;

  @Column({ type: 'int', default: 1 })
  intervaloRecorrencia: number; // A cada X meses/dias

  @Column({
    type: 'enum',
    enum: StatusPlanoCobranca,
    default: StatusPlanoCobranca.ATIVO,
  })
  status: StatusPlanoCobranca;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorRecorrente: number;

  @Column({ type: 'int', default: 5 })
  diaVencimento: number; // Dia do mês para vencimento

  @Column({ type: 'date' })
  dataInicio: Date;

  @Column({ type: 'date', nullable: true })
  dataFim: Date;

  @Column({ type: 'date', nullable: true })
  proximaCobranca: Date;

  @Column({ type: 'int', nullable: true })
  limiteCiclos: number; // null = ilimitado

  @Column({ type: 'int', default: 0 })
  ciclosExecutados: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2 })
  jurosAtraso: number; // % ao mês

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  multaAtraso: number; // % sobre valor

  @Column({ type: 'int', default: 5 })
  diasTolerancia: number; // Dias antes de aplicar juros

  @Column({ type: 'boolean', default: true })
  enviarLembrete: boolean;

  @Column({ type: 'int', default: 3 })
  diasAntesLembrete: number;

  @Column({ type: 'json', nullable: true })
  configuracoes: {
    metodoPagamentoPreferido?: string;
    notificacoesEmail?: boolean;
    notificacoesSMS?: boolean;
    tentativasCobranca?: number;
    webhookUrl?: string;
  };

  @OneToMany(() => Fatura, (fatura) => fatura.contrato)
  faturas: Fatura[];

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  isAtivo(): boolean {
    return this.status === StatusPlanoCobranca.ATIVO;
  }

  calcularProximaCobranca(): Date {
    if (!this.proximaCobranca) {
      return this.dataInicio;
    }

    const proxima = new Date(this.proximaCobranca);

    switch (this.tipoRecorrencia) {
      case TipoRecorrencia.MENSAL:
        proxima.setMonth(proxima.getMonth() + this.intervaloRecorrencia);
        break;
      case TipoRecorrencia.TRIMESTRAL:
        proxima.setMonth(proxima.getMonth() + 3 * this.intervaloRecorrencia);
        break;
      case TipoRecorrencia.SEMESTRAL:
        proxima.setMonth(proxima.getMonth() + 6 * this.intervaloRecorrencia);
        break;
      case TipoRecorrencia.ANUAL:
        proxima.setFullYear(proxima.getFullYear() + this.intervaloRecorrencia);
        break;
    }

    // Ajustar para o dia de vencimento configurado
    proxima.setDate(this.diaVencimento);

    return proxima;
  }

  calcularJurosMulta(valorBase: number, diasAtraso: number): { juros: number; multa: number } {
    let juros = 0;
    let multa = 0;

    if (diasAtraso > this.diasTolerancia) {
      // Multa aplicada uma vez
      multa = valorBase * (this.multaAtraso / 100);

      // Juros proporcionais aos dias de atraso
      const mesesAtraso = diasAtraso / 30;
      juros = valorBase * (this.jurosAtraso / 100) * mesesAtraso;
    }

    return { juros, multa };
  }

  podeGerarNovaFatura(): boolean {
    if (!this.isAtivo()) return false;
    if (this.limiteCiclos && this.ciclosExecutados >= this.limiteCiclos) return false;
    if (this.dataFim && new Date() > this.dataFim) return false;

    return true;
  }

  getProgressoCobrancas(): number {
    if (!this.limiteCiclos) return 0; // Plano ilimitado
    return (this.ciclosExecutados / this.limiteCiclos) * 100;
  }
}
