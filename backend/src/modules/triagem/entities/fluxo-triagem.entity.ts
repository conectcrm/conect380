import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { SessaoTriagem } from './sessao-triagem.entity';

export type TipoFluxo = 'menu_opcoes' | 'arvore_decisao' | 'keyword_match' | 'condicional';
export type TipoEtapa = 'mensagem_menu' | 'pergunta_aberta' | 'validacao' | 'acao' | 'condicional';
export type TipoAcao =
  | 'criar_ticket'
  | 'transferir_humano'
  | 'enviar_mensagem'
  | 'coletar_info'
  | 'finalizar';

export interface OpcaoMenu {
  numero: number;
  texto: string;
  icone?: string;
  proximaEtapa?: string;
  acao?: TipoAcao;
  nucleoId?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  tags?: string[];
}

export interface Etapa {
  id: string;
  tipo: TipoEtapa;
  mensagem: string;
  opcoes?: OpcaoMenu[];
  nucleosMenu?: string[]; // 🎯 IDs dos núcleos para menu dinâmico
  timeout?: number; // segundos
  acaoTimeout?: TipoAcao;
  mensagemTimeout?: string;
  validacao?: {
    tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'numero' | 'texto';
    obrigatorio?: boolean;
    mensagemErro?: string;
  };
  condicao?: {
    variavel: string;
    operador: '==' | '!=' | '>' | '<' | 'contains' | 'startsWith';
    valor: any;
    proximaEtapaTrue: string;
    proximaEtapaFalse: string;
  };
}

export interface EstruturaFluxo {
  etapaInicial: string;
  versao: string;
  etapas: Record<string, Etapa>;
  variaveis?: Record<
    string,
    {
      tipo: 'texto' | 'numero' | 'telefone' | 'email' | 'cpf' | 'cnpj';
      obrigatorio?: boolean;
      valorPadrao?: any;
    }
  >;
}

export interface VersaoFluxo {
  numero: number;
  estrutura: EstruturaFluxo;
  timestamp: Date;
  autor: string;
  descricao?: string;
  publicada: boolean;
}

@Entity('fluxos_triagem')
export class FluxoTriagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ===================================================================
  // Identificação
  // ===================================================================
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 50, default: 'menu_opcoes' })
  tipo: TipoFluxo;

  // ===================================================================
  // Status
  // ===================================================================
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'integer', default: 1 })
  versao: number;

  @Column({ type: 'boolean', default: false })
  publicado: boolean;

  // ===================================================================
  // Triggers/Condições de Ativação
  // ===================================================================
  @Column({ type: 'varchar', array: true, default: '{whatsapp}' })
  canais: string[];

  @Column({ type: 'varchar', array: true, default: '{}', name: 'palavras_gatilho' })
  palavrasGatilho: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'horario_ativo' })
  horarioAtivo: any;

  @Column({ type: 'integer', default: 0 })
  prioridade: number;

  // ===================================================================
  // Estrutura do Fluxo (JSON Tree)
  // ===================================================================
  @Column({ type: 'jsonb' })
  estrutura: EstruturaFluxo;

  // ===================================================================
  // Versionamento e Histórico
  // ===================================================================
  @Column({ type: 'jsonb', default: '[]', name: 'historico_versoes' })
  historicoVersoes: VersaoFluxo[];

  @Column({ type: 'integer', default: 1, name: 'versao_atual' })
  versaoAtual: number;

  // ===================================================================
  // Configurações de Comportamento
  // ===================================================================
  @Column({ type: 'boolean', default: true, name: 'permite_voltar' })
  permiteVoltar: boolean;

  @Column({ type: 'boolean', default: true, name: 'permite_sair' })
  permiteSair: boolean;

  @Column({ type: 'boolean', default: true, name: 'salvar_historico' })
  salvarHistorico: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'tentar_entender_texto_livre',
  })
  tentarEntenderTextoLivre: boolean;

  // ===================================================================
  // Estatísticas
  // ===================================================================
  @Column({ type: 'integer', default: 0, name: 'total_execucoes' })
  totalExecucoes: number;

  @Column({ type: 'integer', default: 0, name: 'total_conclusoes' })
  totalConclusoes: number;

  @Column({ type: 'integer', default: 0, name: 'total_abandonos' })
  totalAbandonos: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'taxa_conclusao',
  })
  taxaConclusao: number;

  @Column({
    type: 'integer',
    default: 0,
    name: 'tempo_medio_conclusao_segundos',
  })
  tempoMedioConclusaoSegundos: number;

  // ===================================================================
  // Relacionamentos
  // ===================================================================
  @OneToMany(() => SessaoTriagem, (sessao) => sessao.fluxo)
  sessoes: SessaoTriagem[];

  // ===================================================================
  // Auditoria
  // ===================================================================
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date;

  // ===================================================================
  // Métodos Auxiliares
  // ===================================================================

  /**
   * Obter primeira etapa do fluxo
   */
  getPrimeiraEtapa(): Etapa | null {
    if (!this.estrutura?.etapaInicial) return null;
    return this.estrutura.etapas[this.estrutura.etapaInicial] || null;
  }

  /**
   * Obter etapa por ID
   */
  getEtapa(etapaId: string): Etapa | null {
    return this.estrutura.etapas[etapaId] || null;
  }

  /**
   * Validar estrutura do fluxo
   */
  validarEstrutura(): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!this.estrutura) {
      erros.push('Estrutura do fluxo não definida');
      return { valido: false, erros };
    }

    if (!this.estrutura.etapaInicial) {
      erros.push('Etapa inicial não definida');
    }

    if (!this.estrutura.etapas || Object.keys(this.estrutura.etapas).length === 0) {
      erros.push('Nenhuma etapa definida no fluxo');
    }

    // Validar se etapa inicial existe
    if (this.estrutura.etapaInicial && !this.estrutura.etapas[this.estrutura.etapaInicial]) {
      erros.push(`Etapa inicial '${this.estrutura.etapaInicial}' não encontrada`);
    }

    // Validar referências de próximas etapas
    for (const [etapaId, etapa] of Object.entries(this.estrutura.etapas)) {
      if (etapa.opcoes) {
        for (const opcao of etapa.opcoes) {
          if (opcao.proximaEtapa && !this.estrutura.etapas[opcao.proximaEtapa]) {
            erros.push(
              `Etapa '${etapaId}': opção ${opcao.numero} referencia etapa inexistente '${opcao.proximaEtapa}'`,
            );
          }
        }
      }
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  }

  /**
   * Publicar fluxo (tornar ativo)
   */
  publicar(): void {
    this.publicado = true;
    this.publishedAt = new Date();
  }

  /**
   * Despublicar fluxo
   */
  despublicar(): void {
    this.publicado = false;
  }

  /**
   * Salvar versão atual no histórico
   */
  salvarVersao(autor: string, descricao?: string): void {
    if (!this.historicoVersoes) {
      this.historicoVersoes = [];
    }

    const novaVersao: VersaoFluxo = {
      numero: this.versaoAtual,
      estrutura: JSON.parse(JSON.stringify(this.estrutura)), // Deep clone
      timestamp: new Date(),
      autor,
      descricao,
      publicada: this.publicado,
    };

    this.historicoVersoes.push(novaVersao);
    this.versaoAtual++;
  }

  /**
   * Restaurar versão anterior
   */
  restaurarVersao(numeroVersao: number): boolean {
    const versao = this.historicoVersoes?.find((v) => v.numero === numeroVersao);

    if (!versao) {
      return false;
    }

    // Salvar versão atual antes de restaurar
    if (this.estrutura) {
      this.salvarVersao('Sistema', `Backup antes de restaurar versão ${numeroVersao}`);
    }

    // Restaurar estrutura
    this.estrutura = JSON.parse(JSON.stringify(versao.estrutura));
    this.versaoAtual++;

    return true;
  }

  /**
   * Obter histórico de versões ordenado (mais recente primeiro)
   */
  getHistoricoOrdenado(): VersaoFluxo[] {
    if (!this.historicoVersoes) {
      return [];
    }
    return [...this.historicoVersoes].sort((a, b) => b.numero - a.numero);
  }

  /**
   * Incrementar estatísticas
   */
  incrementarExecucoes(): void {
    this.totalExecucoes++;
  }

  incrementarConclusoes(): void {
    this.totalConclusoes++;
    this.recalcularTaxaConclusao();
  }

  incrementarAbandonos(): void {
    this.totalAbandonos++;
    this.recalcularTaxaConclusao();
  }

  private recalcularTaxaConclusao(): void {
    if (this.totalExecucoes > 0) {
      this.taxaConclusao = Number(((this.totalConclusoes / this.totalExecucoes) * 100).toFixed(2));
    }
  }
}
