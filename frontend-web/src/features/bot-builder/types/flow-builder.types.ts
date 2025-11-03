// Types para o Construtor Visual de Fluxos

import { Node, Edge } from 'reactflow';

// ==================== TIPOS DO BOT (Backend) ====================

export type TipoEtapa =
  | 'inicio'
  | 'mensagem'
  | 'mensagem_menu'
  | 'menu_opcoes'
  | 'coleta_dados'
  | 'pergunta_aberta'
  | 'validacao'
  | 'condicional'
  | 'acao'
  | 'finalizar';

export type TipoAcao =
  | 'proximo_passo'
  | 'transferir_nucleo'
  | 'transferir_departamento'
  | 'transferir_atendente'
  | 'transferir_humano'
  | 'criar_ticket'
  | 'salvar_contexto'
  | 'transferir_para_nucleo'
  | 'finalizar';

export interface OpcaoMenu {
  valor?: string | number;
  numero?: string | number;
  texto: string;
  descricao?: string;
  icone?: string;
  acao?: TipoAcao;
  proximaEtapa?: string;
  proximaEtapaCondicional?: Array<{ se: string; entao: string }>;
  nucleoId?: string;
  nucleoContextKey?: string;
  departamentoId?: string;
  departamentoContextKey?: string;
  atendenteId?: string;
  atendenteContextKey?: string;
  salvarContexto?: Record<string, any>;
  aliases?: string[];
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  tags?: string[];
}

export interface Condicao {
  campo?: string;
  operador?: 'igual' | 'diferente' | 'contem' | 'maior' | 'menor' | 'existe' | 'nao_existe';
  valor?: any;
  proximaEtapa?: string;
  se?: string;
  entao?: string;
}

export interface Etapa {
  id: string;
  tipo: TipoEtapa;
  nome?: string;
  mensagem?: string;
  opcoes?: OpcaoMenu[];
  nucleosMenu?: string[]; // IDs dos núcleos para menu dinâmico
  timeout?: number;
  condicoes?: Condicao[];
  proximaEtapa?: string;
  proximaEtapaCondicional?: Array<{ se: string; entao: string }>;
  variavel?: string;
  aguardarResposta?: boolean;
  salvarContexto?: Record<string, any>;
  mensagemTimeout?: string;
  acaoTimeout?: TipoAcao;
  acaoFinalizar?: {
    tipo: 'criar_ticket' | 'transferir' | 'encerrar';
    nucleoId?: string;
    departamentoId?: string;
    mensagemFinal?: string;
  };
}

export interface EstruturaFluxo {
  etapaInicial: string;
  versao: string;
  etapas: Record<string, Etapa>;
  variaveis?: Record<string, any>;
}

export interface FluxoTriagem {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  tipo: 'whatsapp' | 'telegram' | 'instagram' | 'email' | 'sms';
  canal?: string;
  ativo: boolean;
  publicado: boolean;
  estrutura: EstruturaFluxo;
  estatisticas?: {
    totalExecucoes: number;
    totalConclusoes: number;
    totalAbandonos: number;
    taxaConversao: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ==================== TIPOS DO BUILDER (Frontend) ====================

export type BlockType =
  | 'start'
  | 'message'
  | 'menu'
  | 'question'
  | 'condition'
  | 'action'
  | 'end';

export interface BlockData {
  label: string;
  tipo: TipoEtapa;
  etapa?: Etapa;
  config?: any;
  isValid?: boolean;
}

export interface FlowNode extends Node<BlockData> {
  type: BlockType;
}

export type FlowEdge = Edge & {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export interface FlowBuilderState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
  fluxo: FluxoTriagem | null;
  isDirty: boolean;
}

// ==================== CONFIGURAÇÕES DE BLOCOS ====================

export interface MessageConfig {
  mensagem: string;
  aguardarResposta: boolean;
  timeout?: number;
}

export interface MenuConfig {
  mensagem: string;
  opcoes: OpcaoMenu[];
}

export interface QuestionConfig {
  mensagem: string;
  variavel: string;
  validacao?: 'texto' | 'numero' | 'email' | 'telefone' | 'cpf' | 'cnpj';
  obrigatorio: boolean;
}

export interface ConditionConfig {
  campo: string;
  operador: 'igual' | 'diferente' | 'contem' | 'maior' | 'menor' | 'existe' | 'nao_existe';
  valor?: any;
  proximaEtapaTrue: string;
  proximaEtapaFalse: string;
}

export interface ActionConfig {
  acao: TipoAcao;
  nucleoId?: string;
  departamentoId?: string;
  atendenteId?: string;
  mensagemFinal?: string;
  criarTicket?: boolean;
}

// ==================== UTILITÁRIOS ====================

export interface BlockTemplate {
  id: string;
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultData: Partial<BlockData>;
}

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
