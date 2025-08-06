import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum StatusFluxo {
  PROPOSTA_ACEITA = 'proposta_aceita',
  CONTRATO_GERADO = 'contrato_gerado',
  CONTRATO_ENVIADO = 'contrato_enviado',
  CONTRATO_ASSINADO = 'contrato_assinado',
  FATURA_GERADA = 'fatura_gerada',
  PAGAMENTO_PROCESSADO = 'pagamento_processado',
  WORKFLOW_CONCLUIDO = 'workflow_concluido',
  ERRO_PROCESSAMENTO = 'erro_processamento',
  PAUSADO = 'pausado',
  CANCELADO = 'cancelado'
}

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
  WORKFLOW_CANCELADO = 'workflow_cancelado'
}

@Entity('fluxos_automatizados')
export class FluxoAutomatizado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 50 })
  numeroFluxo: string;

  @Column({ type: 'uuid' })
  propostaId: string;

  @Column({ type: 'uuid', nullable: true })
  contratoId?: string;

  @Column({ type: 'uuid', nullable: true })
  faturaId?: string;

  @Column({
    type: 'enum',
    enum: StatusFluxo,
    default: StatusFluxo.PROPOSTA_ACEITA
  })
  status: StatusFluxo;

  @Column({ type: 'int', default: 1 })
  etapaAtual: number;

  @Column({ type: 'int', default: 6 })
  totalEtapas: number;

  @Column({ type: 'datetime', nullable: true })
  dataInicio: Date;

  @Column({ type: 'datetime', nullable: true })
  dataConclusao: Date;

  @Column({ type: 'datetime', nullable: true })
  dataProximaAcao: Date;

  @Column({ type: 'int', default: 0 })
  tentativasProcessamento: number;

  @Column({ type: 'int', default: 3 })
  maxTentativas: number;

  @Column({ type: 'json', nullable: true })
  configuracoes: {
    enviarEmailsAutomaticos?: boolean;
    gerarContratoAutomatico?: boolean;
    criarFaturaAutomatica?: boolean;
    cobrarRecorrentemente?: boolean;
    intervaloDias?: number;
    templateContrato?: string;
    templateEmail?: string;
    observacoes?: string;
  };

  @Column({ type: 'json', nullable: true })
  metadados: {
    clienteId?: string;
    vendedorId?: string;
    valorTotalProposta?: number;
    moeda?: string;
    prazoEntrega?: number;
    condicoesEspeciais?: string[];
    tagsPersonalizadas?: string[];
  };

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'text', nullable: true })
  ultimoErro: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  proximaEtapa(): void {
    if (this.etapaAtual < this.totalEtapas) {
      this.etapaAtual++;
    }
  }

  voltarEtapa(): void {
    if (this.etapaAtual > 1) {
      this.etapaAtual--;
    }
  }

  calcularProgresso(): number {
    return Math.round((this.etapaAtual / this.totalEtapas) * 100);
  }

  podeProcessar(): boolean {
    return this.status !== StatusFluxo.WORKFLOW_CONCLUIDO &&
      this.status !== StatusFluxo.CANCELADO &&
      this.status !== StatusFluxo.PAUSADO &&
      this.tentativasProcessamento < this.maxTentativas;
  }

  isWorkflowCompleto(): boolean {
    return this.status === StatusFluxo.WORKFLOW_CONCLUIDO;
  }

  temErro(): boolean {
    return this.status === StatusFluxo.ERRO_PROCESSAMENTO;
  }

  incrementarTentativa(): void {
    this.tentativasProcessamento++;
  }

  resetarTentativas(): void {
    this.tentativasProcessamento = 0;
  }

  definirProximaAcao(minutos: number = 60): void {
    this.dataProximaAcao = new Date(Date.now() + minutos * 60 * 1000);
  }

  marcarConcluido(): void {
    this.status = StatusFluxo.WORKFLOW_CONCLUIDO;
    this.etapaAtual = this.totalEtapas;
    this.dataConclusao = new Date();
    this.dataProximaAcao = null;
  }

  marcarErro(erro: string): void {
    this.status = StatusFluxo.ERRO_PROCESSAMENTO;
    this.ultimoErro = erro;
    this.incrementarTentativa();

    if (this.tentativasProcessamento >= this.maxTentativas) {
      this.definirProximaAcao(24 * 60); // 24 horas
    } else {
      this.definirProximaAcao(Math.pow(2, this.tentativasProcessamento) * 10); // Backoff exponencial
    }
  }

  pausar(motivo?: string): void {
    this.status = StatusFluxo.PAUSADO;
    if (motivo) {
      this.observacoes = (this.observacoes || '') + `\n[${new Date().toISOString()}] Pausado: ${motivo}`;
    }
  }

  retomar(): void {
    if (this.status === StatusFluxo.PAUSADO) {
      // Volta para o status anterior ao pausar
      this.status = this.obterStatusAnteriorAoPausar();
      this.definirProximaAcao(5); // 5 minutos
    }
  }

  cancelar(motivo?: string): void {
    this.status = StatusFluxo.CANCELADO;
    this.dataConclusao = new Date();
    if (motivo) {
      this.observacoes = (this.observacoes || '') + `\n[${new Date().toISOString()}] Cancelado: ${motivo}`;
    }
  }

  private obterStatusAnteriorAoPausar(): StatusFluxo {
    // Lógica para determinar o status baseado na etapa atual
    switch (this.etapaAtual) {
      case 1: return StatusFluxo.PROPOSTA_ACEITA;
      case 2: return StatusFluxo.CONTRATO_GERADO;
      case 3: return StatusFluxo.CONTRATO_ENVIADO;
      case 4: return StatusFluxo.CONTRATO_ASSINADO;
      case 5: return StatusFluxo.FATURA_GERADA;
      case 6: return StatusFluxo.PAGAMENTO_PROCESSADO;
      default: return StatusFluxo.PROPOSTA_ACEITA;
    }
  }
}
