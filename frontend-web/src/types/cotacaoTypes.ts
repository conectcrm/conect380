export interface Cotacao {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    cnpjCpf?: string;
  };
  titulo: string;
  descricao?: string;
  status: StatusCotacao;
  prioridade: PrioridadeCotacao;
  prazoResposta?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  dataCriacao: string;
  dataUltimaAtualizacao: string;
  valorTotal: number;
  valorDesconto?: number;
  percentualDesconto?: number;
  observacoes?: string;
  condicoesPagamento?: string;
  prazoEntrega?: string;
  localEntrega?: string;
  validadeOrcamento?: number; // dias
  responsavelId: string;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  aprovadorId?: string;
  aprovador?: {
    id: string;
    nome: string;
    email: string;
  };
  dataAprovacao?: string;
  statusAprovacao?: 'aprovado' | 'reprovado';
  justificativaAprovacao?: string;
  itens: ItemCotacao[];
  anexos?: AnexoCotacao[];
  historico?: HistoricoCotacao[];
  tags?: string[];
  origem: OrigemCotacao;
  empresaId: string;
}

export interface ItemCotacao {
  id: string;
  produtoId?: string;
  produto?: {
    id: string;
    nome: string;
    categoria: string;
  };
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
  ordem: number;
}

export interface AnexoCotacao {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface HistoricoCotacao {
  id: string;
  acao: string;
  descricao: string;
  usuarioId: string;
  usuario: string;
  timestamp: string;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
}

export enum StatusCotacao {
  RASCUNHO = 'rascunho',
  ENVIADA = 'enviada',
  EM_ANALISE = 'em_analise',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
  VENCIDA = 'vencida',
  CONVERTIDA = 'convertida',
  CANCELADA = 'cancelada',
  PENDENTE = 'pendente', // Alias para EM_ANALISE
}

export enum PrioridadeCotacao {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum OrigemCotacao {
  MANUAL = 'manual',
  WEBSITE = 'website',
  EMAIL = 'email',
  TELEFONE = 'telefone',
  WHATSAPP = 'whatsapp',
  INDICACAO = 'indicacao',
  API = 'api',
  IMPORTACAO = 'importacao',
}

// Tipos alternativos (para compatibilidade)
export type StatusCotacaoType =
  | 'rascunho'
  | 'enviada'
  | 'em_analise'
  | 'aprovada'
  | 'rejeitada'
  | 'vencida'
  | 'convertida'
  | 'cancelada'
  | 'pendente';

export type PrioridadeCotacaoType = 'baixa' | 'media' | 'alta' | 'urgente';

export interface CriarCotacaoRequest {
  fornecedorId: string;
  titulo: string;
  descricao?: string;
  prioridade: PrioridadeCotacao;
  prazoResposta?: string;
  observacoes?: string;
  condicoesPagamento?: string;
  prazoEntrega?: string;
  localEntrega?: string;
  validadeOrcamento?: number;
  aprovadorId?: string;
  itens: Omit<ItemCotacao, 'id' | 'valorTotal'>[];
  tags?: string[];
  origem: OrigemCotacao;
}

export interface AtualizarCotacaoRequest {
  titulo?: string;
  descricao?: string;
  status?: StatusCotacao;
  prioridade?: PrioridadeCotacao;
  prazoResposta?: string;
  valorDesconto?: number;
  percentualDesconto?: number;
  observacoes?: string;
  condicoesPagamento?: string;
  prazoEntrega?: string;
  localEntrega?: string;
  validadeOrcamento?: number;
  aprovadorId?: string;
  itens?: Omit<ItemCotacao, 'id' | 'valorTotal'>[];
  tags?: string[];
}

export interface FiltroCotacao {
  busca?: string;
  status?: StatusCotacao[];
  prioridade?: PrioridadeCotacao[];
  clienteId?: string;
  responsavelId?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  origem?: OrigemCotacao[];
  tags?: string[];
}

export interface CotacaoListResponse {
  items: Cotacao[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    total: number;
    totalValue: number;
    byStatus: Array<{ status: StatusCotacao; quantidade: number }>;
    byPriority: Array<{ prioridade: PrioridadeCotacao; quantidade: number }>;
  };
}

export interface AprovarCotacaoRequest {
  justificativa?: string;
}

export interface ReprovarCotacaoRequest {
  justificativa: string;
}
