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
import { FluxoAutomatizado } from './fluxo-automatizado.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum TipoEvento {
  PROPOSTA_ACEITA = 'proposta_aceita',
  CONTRATO_CRIADO = 'contrato_criado',
  CONTRATO_ENVIADO = 'contrato_enviado',
  CONTRATO_ASSINADO = 'contrato_assinado',
  FATURA_CRIADA = 'fatura_criada',
  PAGAMENTO_RECEBIDO = 'pagamento_recebido',
  ERRO_OCORRIDO = 'erro_ocorrido',
  WORKFLOW_PAUSADO = 'workflow_pausado',
  WORKFLOW_RETOMADO = 'workflow_retomado',
  WORKFLOW_CANCELADO = 'workflow_cancelado',
}

export enum StatusEvento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  CONCLUIDO = 'concluido',
  ERRO = 'erro',
  CANCELADO = 'cancelado',
}

@Entity('eventos_fluxo')
@Index(['fluxoId', 'createdAt'])
@Index(['status', 'dataProcessamento'])
export class EventoFluxo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => FluxoAutomatizado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fluxo_id' })
  fluxo: FluxoAutomatizado;

  @Column({ type: 'uuid' })
  fluxoId: string;

  @Column({
    type: 'enum',
    enum: TipoEvento,
  })
  tipoEvento: TipoEvento;

  @Column({
    type: 'enum',
    enum: StatusEvento,
    default: StatusEvento.PENDENTE,
  })
  status: StatusEvento;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'json', nullable: true })
  dadosEvento: {
    entityId?: string;
    entityType?: string;
    dadosAntes?: any;
    dadosDepois?: any;
    parametrosExecucao?: any;
    configuracoes?: any;
  };

  @Column({ type: 'timestamp', nullable: true })
  dataProcessamento: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataAgendamento: Date;

  @Column({ type: 'int', default: 0 })
  tentativas: number;

  @Column({ type: 'int', default: 3 })
  maxTentativas: number;

  @Column({ type: 'text', nullable: true })
  ultimoErro: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processadoPor: string; // ID do serviço/usuário que processou

  @Column({ type: 'int', nullable: true })
  tempoProcessamento: number; // em millisegundos

  @Column({ type: 'json', nullable: true })
  resultadoProcessamento: {
    sucesso?: boolean;
    dadosRetorno?: any;
    mensagem?: string;
    codigoErro?: string;
    detalhesErro?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  marcarComoProcessando(processadoPor?: string): void {
    this.status = StatusEvento.PROCESSANDO;
    this.dataProcessamento = new Date();
    this.processadoPor = processadoPor;
  }

  marcarComoConcluido(resultado?: any): void {
    this.status = StatusEvento.CONCLUIDO;
    this.tempoProcessamento = this.calcularTempoProcessamento();

    if (resultado) {
      this.resultadoProcessamento = {
        sucesso: true,
        dadosRetorno: resultado,
        mensagem: 'Evento processado com sucesso',
      };
    }
  }

  marcarComoErro(erro: string, detalhes?: any): void {
    this.status = StatusEvento.ERRO;
    this.ultimoErro = erro;
    this.tentativas++;
    this.tempoProcessamento = this.calcularTempoProcessamento();

    this.resultadoProcessamento = {
      sucesso: false,
      mensagem: erro,
      codigoErro: detalhes?.codigo || 'ERRO_GENERICO',
      detalhesErro: detalhes,
    };
  }

  marcarComoCancelado(motivo?: string): void {
    this.status = StatusEvento.CANCELADO;

    this.resultadoProcessamento = {
      sucesso: false,
      mensagem: motivo || 'Evento cancelado',
      codigoErro: 'CANCELADO',
    };
  }

  podeProcessar(): boolean {
    return (
      (this.status === StatusEvento.PENDENTE || this.status === StatusEvento.ERRO) &&
      this.tentativas < this.maxTentativas &&
      (!this.dataAgendamento || this.dataAgendamento <= new Date())
    );
  }

  deveReprocessar(): boolean {
    return this.status === StatusEvento.ERRO && this.tentativas < this.maxTentativas;
  }

  calcularProximaTentativa(): Date {
    // Backoff exponencial: 1min, 2min, 4min, 8min...
    const minutosEspera = Math.pow(2, this.tentativas);
    return new Date(Date.now() + minutosEspera * 60 * 1000);
  }

  private calcularTempoProcessamento(): number {
    if (!this.dataProcessamento) return 0;
    return Date.now() - this.dataProcessamento.getTime();
  }

  resetarTentativas(): void {
    this.tentativas = 0;
    this.ultimoErro = null;
    this.status = StatusEvento.PENDENTE;
  }

  agendar(dataAgendamento: Date): void {
    this.dataAgendamento = dataAgendamento;
    this.status = StatusEvento.PENDENTE;
  }

  isVencido(): boolean {
    if (!this.dataAgendamento) return false;
    return this.dataAgendamento < new Date() && this.status === StatusEvento.PENDENTE;
  }

  getTempoEsperaTotal(): number {
    if (!this.createdAt || !this.dataProcessamento) return 0;
    return this.dataProcessamento.getTime() - this.createdAt.getTime();
  }

  getStatusHumano(): string {
    const statusMap = {
      [StatusEvento.PENDENTE]: 'Aguardando processamento',
      [StatusEvento.PROCESSANDO]: 'Processando...',
      [StatusEvento.CONCLUIDO]: 'Concluído com sucesso',
      [StatusEvento.ERRO]: `Erro (tentativa ${this.tentativas}/${this.maxTentativas})`,
      [StatusEvento.CANCELADO]: 'Cancelado',
    };

    return statusMap[this.status] || this.status;
  }
}
