// Importar e re-exportar enums do arquivo enums.ts
import {
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  LifecycleViewOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  TipoAtividade,
  MotivoPerda,
} from './enums';
export {
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  LifecycleViewOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  TipoAtividade,
  MotivoPerda,
};

export interface Oportunidade {
  id: number;
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  tags: string[];
  dataFechamentoEsperado?: Date | string | null;
  dataFechamentoReal?: Date | string | null;

  // Responsável
  responsavel: {
    id: string;
    nome: string;
    email: string;
    avatar?: string;
  };

  // Cliente (opcional)
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    empresa?: string;
  };

  // Informações de contato direto (quando não há cliente)
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  observacoes?: string;
  criadoEm?: Date | string;
  atualizadoEm?: Date | string;

  // Atividades
  atividades: Atividade[];

  // Metadados
  createdAt: Date;
  updatedAt: Date;

  // Campos calculados
  valorFormatado: string;
  diasNoEstagio: number;
  ultimaAtividade?: Date;
  tempoNoEstagio: string;
  probabilidadeVisual: 'baixa' | 'media' | 'alta';

  // Novos campos: Motivo de Perda, SLA e Auto-Probability
  motivoPerda?: MotivoPerda;
  motivoPerdaDetalhes?: string;
  concorrenteNome?: string;
  dataRevisao?: Date | string;
  dataUltimaMudancaEstagio?: Date | string;
  diasNoEstagioAtual?: number;
  precisaAtencao?: boolean;
  lifecycle_status?: LifecycleStatusOportunidade;
  archived_at?: Date | string | null;
  archived_by?: string | null;
  deleted_at?: Date | string | null;
  deleted_by?: string | null;
  reopened_at?: Date | string | null;
  reopened_by?: string | null;
  is_stale?: boolean;
  stale_days?: number;
  last_interaction_at?: Date | string | null;
  stale_since?: Date | string | null;
  next_action_at?: Date | string | null;
  next_action_type?: TipoAtividade | string | null;
  next_action_description?: string | null;
  next_action_status?: 'overdue' | 'due_soon' | 'future' | null;
  next_action_days_delta?: number | null;
  engagement_signal?: 'hot' | 'watch' | 'normal';
  proposta_principal_id?: string | null;
  propostaPrincipal?: {
    id: string;
    numero: string;
    titulo?: string;
    status: string;
    sugerePerda?: boolean;
  };
}

export interface Atividade {
  id: string | number;
  tipo: TipoAtividade;
  descricao: string;
  status?: 'pending' | 'completed' | string;
  resultadoConclusao?: string | null;
  concluidoEm?: Date | string | null;
  concluidoPorId?: string | null;
  dataAtividade: Date;
  oportunidadeId: string | number;
  responsavelId?: string;
  criadoPor: {
    id: string;
    nome: string;
    avatar?: string;
  };
  responsavel?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  concluidoPor?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  createdAt: Date;
}

export interface FiltrosOportunidade {
  busca: string;
  estagio: EstagioOportunidade | '';
  prioridade: PrioridadeOportunidade | '';
  origem: OrigemOportunidade | '';
  responsavel: string;
  valorMin: number;
  valorMax: number;
  dataInicio?: Date;
  dataFim?: Date;
  tags: string[];
  ordenacao: 'titulo' | 'valor' | 'probabilidade' | 'createdAt' | 'updatedAt';
  direcao: 'asc' | 'desc';
  lifecycle_status?: LifecycleStatusOportunidade | '';
  lifecycle_view?: LifecycleViewOportunidade | '';
  include_deleted?: boolean;
}

export interface EstatisticasOportunidades {
  totalOportunidades: number;
  valorTotalPipeline: number;
  valorGanho: number;
  taxaConversao: number;
  valorMedio: number;
  distribuicaoPorEstagio: Record<string, { quantidade: number; valor: number }>;
}

export interface NovaOportunidade {
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  tags?: string[]; // ✅ Opcional - não enviar array vazio
  dataFechamentoEsperado?: Date | string | null;
  responsavel_id: string; // ✅ Corrigido - alinhado com backend (snake_case)
  cliente_id?: string; // ✅ Corrigido - alinhado com backend (snake_case)
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  observacoes?: string;
}

export interface AtualizarOportunidade extends Partial<NovaOportunidade> {
  id: number;
}

export interface NovaAtividade {
  tipo: TipoAtividade;
  descricao: string;
  dataAtividade?: Date;
  oportunidadeId: number;
  responsavelId?: string;
}

export interface OportunidadeHistoricoEstagioItem {
  id: string;
  fromStage: EstagioOportunidade | null;
  toStage: EstagioOportunidade;
  changedAt: string;
  source: string;
  changedBy?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
}

export interface OportunidadeAtividadeResumo {
  range: {
    periodStart: string;
    periodEnd: string;
  };
  totalAtividades: number;
  porTipo: Array<{
    tipo: TipoAtividade;
    quantidade: number;
  }>;
  porVendedor: Array<{
    vendedorId: string;
    nome: string;
    avatarUrl?: string | null;
    quantidade: number;
    oportunidadesAtivas: number;
    ultimaAtividadeEm: string | null;
  }>;
  recentes: Array<{
    id: number;
    tipo: TipoAtividade;
    descricao: string;
    dataAtividade: string | null;
    oportunidadeId: number;
    oportunidadeTitulo?: string;
    vendedor?: {
      id: string;
      nome: string;
      avatarUrl?: string | null;
    };
  }>;
}

export type OportunidadeAtividadesPainelStatusFilter =
  | 'all'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'due_today'
  | 'due_week';

export interface OportunidadeAtividadesPainelItem {
  id: string;
  tipo: TipoAtividade;
  descricao: string;
  status: 'pending' | 'completed';
  resultadoConclusao?: string | null;
  dataAtividade: string | null;
  createdAt: string | null;
  concluidoEm?: string | null;
  flags: {
    overdue: boolean;
    dueToday: boolean;
    dueWeek: boolean;
    daysDelta: number | null;
  };
  oportunidade: {
    id: string;
    titulo: string;
    estagio: EstagioOportunidade;
    lifecycleStatus: LifecycleStatusOportunidade;
    valor: number;
    probabilidade: number;
  };
  criadoPor?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
  responsavel?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
  concluidoPor?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
}

export interface OportunidadeAtividadesPainelResult {
  generatedAt: string;
  range: {
    periodStart: string;
    periodEnd: string;
  };
  filters: {
    vendedorId?: string;
    onlyMine: boolean;
    status: OportunidadeAtividadesPainelStatusFilter;
    tipo?: TipoAtividade;
    busca?: string;
    includeClosed: boolean;
    includeArchived: boolean;
  };
  resumo: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueToday: number;
    dueWeek: number;
  };
  items: OportunidadeAtividadesPainelItem[];
}

export interface OportunidadeVendedorEnvolvido {
  id: string;
  vendedorId: string;
  nome: string;
  email?: string | null;
  avatarUrl?: string | null;
  papel: string;
  createdAt?: string | null;
}

export interface LifecycleFeatureFlagDecision {
  enabled: boolean;
  source: 'disabled' | 'enabled' | 'rollout';
  rolloutPercentage: number;
}

export interface SalesFeatureFlagDecisionItem {
  flagKey: string;
  enabled: boolean;
  source: 'tenant' | 'default';
}

export interface SalesFeatureFlagsDecision {
  pipelineDraftWithoutPlaceholder: SalesFeatureFlagDecisionItem;
  opportunityPreliminaryItems: SalesFeatureFlagDecisionItem;
  strictPropostaTransitions: SalesFeatureFlagDecisionItem;
  discountPolicyPerTenant: SalesFeatureFlagDecisionItem;
}

export interface UpdateSalesFeatureFlagsPayload {
  pipelineDraftWithoutPlaceholder?: boolean;
  opportunityPreliminaryItems?: boolean;
  strictPropostaTransitions?: boolean;
  discountPolicyPerTenant?: boolean;
}

export interface StalePolicyDecision {
  enabled: boolean;
  thresholdDays: number;
  source: 'tenant' | 'default';
  autoArchiveEnabled: boolean;
  autoArchiveAfterDays: number;
  autoArchiveSource: 'tenant' | 'default';
}

export interface EngagementPolicyDecision {
  hotMinProbability: number;
  hotMinProbabilitySource: 'tenant' | 'default';
  hotCloseWindowDays: number;
  hotCloseWindowSource: 'tenant' | 'default';
  nextActionDueSoonDays: number;
  nextActionDueSoonSource: 'tenant' | 'default';
}

export interface UpdateEngagementPolicyPayload {
  hotMinProbability?: number;
  hotCloseWindowDays?: number;
  nextActionDueSoonDays?: number;
}

export interface StaleDealsResult {
  enabled: boolean;
  thresholdDays: number;
  totalCandidates: number;
  totalStale: number;
  generatedAt: string;
  stale: Oportunidade[];
}

// Configurações do Pipeline
export interface ConfiguracaoPipeline {
  estagios: EstagioConfig[];
  cores: Record<EstagioOportunidade, string>;
  automacoes: AutomacaoPipeline[];
}

export interface EstagioConfig {
  estagio: EstagioOportunidade;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  probabilidadePadrao: number;
  tempoMedioEstagio: number;
  ativo: boolean;
}

export interface AutomacaoPipeline {
  id: string;
  nome: string;
  gatilho: 'mudanca_estagio' | 'tempo_estagio' | 'valor_atingido';
  condicoes: any[];
  acoes: any[];
  ativo: boolean;
}

// Views e relatórios
export type VisualizacaoOportunidades = 'kanban' | 'lista' | 'calendario' | 'grafico';

export interface DadosKanban {
  estagios: EstagioKanban[];
  totalValor: number;
  totalOportunidades: number;
}

export interface EstagioKanban {
  estagio: EstagioOportunidade;
  nome: string;
  cor: string;
  oportunidades: Oportunidade[];
  valor: number;
  quantidade: number;
}
