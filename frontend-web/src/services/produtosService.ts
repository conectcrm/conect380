import { api } from './api';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  custoUnitario: number;
  tipoItem: string;
  frequencia: string;
  unidadeMedida: string;
  status: string;
  descricao?: string;
  sku: string;
  fornecedor: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  vendasMes: number;
  vendasTotal: number;
  tags?: string[];
  variacoes?: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateProdutoData {
  nome: string;
  categoria: string;
  preco: number;
  custoUnitario?: number;
  tipoItem?: string;
  frequencia?: string;
  unidadeMedida?: string;
  status?: string;
  descricao?: string;
  sku?: string;
  fornecedor?: string;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  tags?: string[];
  variacoes?: string[];
}

export interface UpdateProdutoData extends Partial<CreateProdutoData> {}

export interface ProdutoEstatisticas {
  totalProdutos: number;
  produtosAtivos: number;
  vendasMes: number;
  valorTotal: number;
  estoquesBaixos: number;
}

class ProdutosService {
  // Buscar todos os produtos
  async findAll(filters?: { categoria?: string; status?: string }): Promise<Produto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.categoria) params.append('categoria', filters.categoria);
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`/produtos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  // Buscar produto por ID
  async findById(id: string): Promise<Produto> {
    try {
      const response = await api.get(`/produtos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  }

  // Criar novo produto
  async create(data: CreateProdutoData): Promise<Produto> {
    try {
      const response = await api.post('/produtos', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  // Atualizar produto
  async update(id: string, data: UpdateProdutoData): Promise<Produto> {
    try {
      const response = await api.put(`/produtos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  // Excluir produto
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/produtos/${id}`);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  }

  // Buscar estatísticas
  async getEstatisticas(): Promise<ProdutoEstatisticas> {
    try {
      const response = await api.get('/produtos/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Transformar dados do formulário para API
  transformFormToApi(formData: any): CreateProdutoData {
    return {
      nome: formData.nome,
      categoria: formData.categoria,
      preco: formData.precoUnitario || formData.preco,
      custoUnitario: formData.custoUnitario,
      tipoItem: formData.tipoItem,
      frequencia: formData.frequencia,
      unidadeMedida: formData.unidadeMedida,
      status: formData.status === true ? 'ativo' : formData.status === false ? 'inativo' : formData.status,
      descricao: formData.descricao,
      sku: formData.sku,
      fornecedor: formData.fornecedor,
      estoqueAtual: formData.estoque || formData.estoqueAtual,
      estoqueMinimo: formData.estoqueMinimo,
      estoqueMaximo: formData.estoqueMaximo,
      tags: formData.tags,
      variacoes: formData.variacoes,
    };
  }

  // Transformar dados da API para o formato legado do frontend
  transformApiToLegacy(produto: Produto): any {
    return {
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      custoUnitario: produto.custoUnitario,
      estoque: {
        atual: produto.estoqueAtual,
        minimo: produto.estoqueMinimo,
        maximo: produto.estoqueMaximo,
      },
      status: produto.status as 'ativo' | 'inativo' | 'descontinuado',
      vendas: {
        mes: produto.vendasMes,
        total: produto.vendasTotal,
      },
      fornecedor: produto.fornecedor,
      sku: produto.sku,
      descricao: produto.descricao,
      criadoEm: produto.criadoEm,
      atualizadoEm: produto.atualizadoEm,
    };
  }
}

export const produtosService = new ProdutosService();
