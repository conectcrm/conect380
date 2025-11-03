// types/produtos.ts - Interfaces para o sistema de categorização hierárquica

export interface ConfiguracaoProduto {
  id: string;
  nome: string;
  multiplicador: number;
  descricao: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubcategoriaProduto {
  id: string;
  nome: string;
  descricao?: string;
  precoBase: number;
  unidade: string;
  categoria_id: string;
  configuracoes: ConfiguracaoProduto[];
  camposPersonalizados?: {
    duracao?: boolean;
    usuarios?: boolean;
    modalidade?: boolean;
    recursos?: boolean;
  };
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor?: string;
  ordem?: number;
  subcategorias: SubcategoriaProduto[];
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaces para produtos customizados em propostas
export interface ProdutoPersonalizado {
  id: string;
  categoria_id: string;
  subcategoria_id: string;
  configuracao_id: string;
  nome: string;
  descricao?: string;
  precoUnitario: number;
  quantidade: number;
  desconto?: number;
  // Campos personalizados baseados na subcategoria
  duracao?: string;
  numeroUsuarios?: number;
  modalidade?: 'presencial' | 'online' | 'hibrido';
  recursos?: string[];
  observacoes?: string;
}

// Interface para produtos combo (pré-definidos)
export interface ProdutoCombo {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  itens: Array<{
    categoria_id: string;
    subcategoria_id: string;
    configuracao_id: string;
    quantidade: number;
    observacoes?: string;
  }>;
  desconto?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface unificada para produtos em propostas
export interface ProdutoProposta {
  id: string;
  tipo: 'combo' | 'personalizado';
  nome: string;
  descricao?: string;
  quantidade: number;
  precoUnitario: number;
  desconto?: number;
  valorTotal: number;
  // Para produtos personalizados
  configuracao?: ProdutoPersonalizado;
  // Para produtos combo
  combo?: ProdutoCombo;
}

// Interfaces para API/Database
export interface CriarCategoriaProdutoRequest {
  nome: string;
  descricao: string;
  icone: string;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
}

export interface CriarSubcategoriaProdutoRequest {
  nome: string;
  descricao?: string;
  precoBase: number;
  unidade: string;
  categoria_id: string;
  camposPersonalizados?: {
    duracao?: boolean;
    usuarios?: boolean;
    modalidade?: boolean;
    recursos?: boolean;
  };
}

export interface CriarConfiguracaoProdutoRequest {
  nome: string;
  multiplicador: number;
  descricao: string;
  subcategoria_id: string;
}

export interface AtualizarCategoriaProdutoRequest extends Partial<CriarCategoriaProdutoRequest> {
  id: string;
}

export interface AtualizarSubcategoriaProdutoRequest extends Partial<CriarSubcategoriaProdutoRequest> {
  id: string;
}

export interface AtualizarConfiguracaoProdutoRequest extends Partial<CriarConfiguracaoProdutoRequest> {
  id: string;
}

// Interface para resposta da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Tipos para filtros e busca
export interface FiltrosCategorias {
  ativo?: boolean;
  busca?: string;
  ordenacao?: 'nome' | 'created_at' | 'ordem';
  direcao?: 'asc' | 'desc';
}

export interface FiltrosSubcategorias extends FiltrosCategorias {
  categoria_id?: string;
}

export interface FiltrosConfiguracoes extends FiltrosCategorias {
  subcategoria_id?: string;
}

// Tipos para estatísticas
export interface EstatisticasCategorias {
  totalCategorias: number;
  totalSubcategorias: number;
  totalConfiguracoes: number;
  categoriaMaisUsada?: string;
  precoMedio: number;
}
