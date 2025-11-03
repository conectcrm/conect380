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
  dadosAnteriores?: Record<string, any>;
  dadosNovos?: Record<string, any>;
}

export type StatusCotacao =
  | 'rascunho'
  | 'enviada'
  | 'em_analise'
  | 'aprovada'
  | 'rejeitada'
  | 'vencida'
  | 'convertida'
  | 'cancelada';

export type PrioridadeCotacao = 'baixa' | 'media' | 'alta' | 'urgente';

export type OrigemCotacao = 'manual' | 'website' | 'email' | 'telefone' | 'whatsapp' | 'indicacao';

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
