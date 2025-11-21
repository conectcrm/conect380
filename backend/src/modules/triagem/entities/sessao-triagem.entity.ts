import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { FluxoTriagem } from './fluxo-triagem.entity';
import { NucleoAtendimento } from './nucleo-atendimento.entity';
import { Ticket } from '../../atendimento/entities/ticket.entity';

export type StatusSessao =
  | 'em_andamento'
  | 'concluido'
  | 'abandonado'
  | 'transferido'
  | 'erro'
  | 'expirado';

export type ResultadoSessao =
  | 'ticket_criado'
  | 'transferido_humano'
  | 'abandonado'
  | 'erro'
  | 'timeout';

export interface HistoricoEtapa {
  etapa: string;
  resposta: string;
  timestamp: string;
  tempoRespostaSegundos?: number;
}

@Entity('sessoes_triagem')
export class SessaoTriagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'fluxo_id', type: 'uuid' })
  fluxoId: string;

  @ManyToOne(() => FluxoTriagem, (fluxo) => fluxo.sessoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fluxo_id' })
  fluxo: FluxoTriagem;

  // ===================================================================
  // Identificação do Usuário
  // ===================================================================
  @Column({ type: 'varchar', length: 20, name: 'contato_telefone' })
  contatoTelefone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contato_nome' })
  contatoNome: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contato_email' })
  contatoEmail: string;

  @Column({ type: 'varchar', length: 50, default: 'whatsapp' })
  canal: string;

  // ===================================================================
  // Relacionamentos
  // ===================================================================
  @Column({ type: 'uuid', nullable: true, name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'uuid', nullable: true, name: 'atendente_id' })
  atendenteId: string;

  @Column({ type: 'uuid', nullable: true, name: 'nucleo_destino_id' })
  nucleoDestinoId: string;

  @ManyToOne(() => NucleoAtendimento, { nullable: true })
  @JoinColumn({ name: 'nucleo_destino_id' })
  nucleoDestino: NucleoAtendimento;

  // ===================================================================
  // Estado da Sessão
  // ===================================================================
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'etapa_atual' })
  etapaAtual: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'etapa_anterior' })
  etapaAnterior: string;

  @Column({ type: 'jsonb', default: {} })
  contexto: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  historico: HistoricoEtapa[];

  // ===================================================================
  // Status
  // ===================================================================
  @Column({
    type: 'varchar',
    length: 50,
    default: 'em_andamento',
  })
  status: StatusSessao;

  // ===================================================================
  // Métricas
  // ===================================================================
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'iniciado_em' })
  iniciadoEm: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'concluido_em' })
  concluidoEm: Date;

  @Column({ type: 'integer', nullable: true, name: 'tempo_total_segundos' })
  tempoTotalSegundos: number;

  @Column({ type: 'integer', default: 0, name: 'total_mensagens_enviadas' })
  totalMensagensEnviadas: number;

  @Column({ type: 'integer', default: 0, name: 'total_mensagens_recebidas' })
  totalMensagensRecebidas: number;

  // ===================================================================
  // Resultado
  // ===================================================================
  @Column({ type: 'varchar', length: 50, nullable: true })
  resultado: ResultadoSessao;

  @Column({ type: 'integer', nullable: true, name: 'satisfacao_nota' })
  satisfacaoNota: number;

  @Column({ type: 'text', nullable: true, name: 'satisfacao_comentario' })
  satisfacaoComentario: string;

  // ===================================================================
  // Metadata
  // ===================================================================
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dispositivo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  navegador: string;

  // ===================================================================
  // Auditoria
  // ===================================================================
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ===================================================================
  // Métodos Auxiliares
  // ===================================================================

  /**
   * Adicionar etapa ao histórico
   */
  adicionarAoHistorico(etapa: string, resposta: string, tempoResposta?: number): void {
    this.historico.push({
      etapa,
      resposta,
      timestamp: new Date().toISOString(),
      tempoRespostaSegundos: tempoResposta,
    });
    this.totalMensagensRecebidas++;
  }

  /**
   * Avançar para próxima etapa
   */
  avancarParaEtapa(proximaEtapa: string): void {
    this.etapaAnterior = this.etapaAtual;
    this.etapaAtual = proximaEtapa;
  }

  /**
   * Voltar para etapa anterior
   */
  voltarEtapa(): boolean {
    if (!this.etapaAnterior) return false;

    this.etapaAtual = this.etapaAnterior;
    this.etapaAnterior = null;
    return true;
  }

  /**
   * Salvar variável no contexto
   */
  salvarNoContexto(chave: string, valor: any): void {
    this.contexto[chave] = valor;
  }

  /**
   * Obter variável do contexto
   */
  obterDoContexto(chave: string): any {
    return this.contexto[chave];
  }

  /**
   * Concluir sessão
   */
  concluir(resultado: ResultadoSessao): void {
    this.status = 'concluido';
    this.resultado = resultado;
    this.concluidoEm = new Date();
    this.calcularTempoTotal();
  }

  /**
   * Abandonar sessão
   */
  abandonar(): void {
    this.status = 'abandonado';
    this.resultado = 'abandonado';
    this.concluidoEm = new Date();
    this.calcularTempoTotal();
  }

  /**
   * Marcar como transferido
   */
  transferir(atendenteId?: string, nucleoId?: string): void {
    this.status = 'transferido';
    this.resultado = 'transferido_humano';
    this.atendenteId = atendenteId;
    this.nucleoDestinoId = nucleoId;
    this.concluidoEm = new Date();
    this.calcularTempoTotal();
  }

  /**
   * Calcular tempo total da sessão
   */
  private calcularTempoTotal(): void {
    if (this.concluidoEm && this.iniciadoEm) {
      this.tempoTotalSegundos = Math.floor(
        (this.concluidoEm.getTime() - this.iniciadoEm.getTime()) / 1000,
      );
    }
  }

  /**
   * Verificar se sessão está ativa
   */
  estaAtiva(): boolean {
    return this.status === 'em_andamento';
  }

  /**
   * Verificar se sessão está expirada (mais de 30 minutos sem atividade)
   */
  estaExpirada(minutosTimeout: number = 30): boolean {
    if (!this.estaAtiva()) return false;

    const agora = new Date().getTime();
    const ultimaAtualizacao = this.updatedAt.getTime();
    const diferencaMinutos = (agora - ultimaAtualizacao) / 1000 / 60;

    return diferencaMinutos > minutosTimeout;
  }
}
