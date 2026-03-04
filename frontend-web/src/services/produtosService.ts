import { api } from './api';
import { normalizeOptionalMojibakeText } from '../utils/textEncoding';

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
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
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
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
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
    // Validação básica dos campos obrigatórios
    if (!formData.nome || formData.nome.trim() === '') {
      throw new Error('Nome é obrigatório');
    }
    if (!formData.categoria || formData.categoria.trim() === '') {
      throw new Error('Categoria é obrigatória');
    }
    if (!formData.precoUnitario && !formData.preco) {
      throw new Error('Preço é obrigatório');
    }

    const preco = formData.precoUnitario || formData.preco;
    if (isNaN(preco) || preco < 0) {
      throw new Error('Preço deve ser um número válido maior ou igual a zero');
    }

    const transformed = {
      nome: formData.nome.trim(),
      categoria: formData.categoria.trim(),
      preco: Number(preco),
      custoUnitario: formData.custoUnitario ? Number(formData.custoUnitario) : undefined,
      tipoItem: formData.tipoItem || 'produto',
      frequencia: formData.frequencia || 'unico',
      unidadeMedida: formData.unidadeMedida || 'unidade',
      status:
        formData.status === true
          ? 'ativo'
          : formData.status === false
            ? 'inativo'
            : formData.status || 'ativo',
      descricao: formData.descricao?.trim() || undefined,
      sku: formData.sku?.trim() || undefined,
      fornecedor: formData.fornecedor?.trim() || undefined,
      estoqueAtual: formData.estoque
        ? Number(formData.estoque)
        : formData.estoqueAtual
          ? Number(formData.estoqueAtual)
          : undefined,
      estoqueMinimo: formData.estoqueMinimo ? Number(formData.estoqueMinimo) : undefined,
      estoqueMaximo: formData.estoqueMaximo ? Number(formData.estoqueMaximo) : undefined,
      tags: Array.isArray(formData.tags) ? formData.tags : undefined,
      variacoes: Array.isArray(formData.variacoes) ? formData.variacoes : undefined,
      tipoLicenciamento: formData.tipoLicenciamento?.trim() || undefined,
      periodicidadeLicenca: formData.periodicidadeLicenca?.trim() || undefined,
      renovacaoAutomatica:
        formData.renovacaoAutomatica === undefined
          ? undefined
          : Boolean(formData.renovacaoAutomatica),
      quantidadeLicencas:
        formData.quantidadeLicencas === undefined || formData.quantidadeLicencas === null
          ? undefined
          : Number(formData.quantidadeLicencas),
    };

    return transformed;
  }

  // Transformar dados da API para o formato legado do frontend
  transformApiToLegacy(produto: Produto): any {
    const nome = normalizeOptionalMojibakeText(produto.nome) || '';
    const categoria = normalizeOptionalMojibakeText(produto.categoria) || '';
    const fornecedor = normalizeOptionalMojibakeText(produto.fornecedor) || '';
    const sku = normalizeOptionalMojibakeText(produto.sku) || '';
    const descricao = normalizeOptionalMojibakeText(produto.descricao) || '';
    const tipoLicenciamento = normalizeOptionalMojibakeText(produto.tipoLicenciamento);
    const periodicidadeLicenca = normalizeOptionalMojibakeText(produto.periodicidadeLicenca);

    return {
      id: produto.id,
      nome,
      tipoItem: (produto.tipoItem || 'produto') as
        | 'produto'
        | 'servico'
        | 'licenca'
        | 'modulo'
        | 'plano'
        | 'aplicativo',
      categoria,
      preco: produto.preco,
      custoUnitario: produto.custoUnitario,
      frequencia: (produto.frequencia || 'unico') as 'unico' | 'mensal' | 'anual',
      unidadeMedida: (produto.unidadeMedida || 'unidade') as
        | 'unidade'
        | 'saca'
        | 'hectare'
        | 'pacote'
        | 'licenca',
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
      fornecedor,
      sku,
      descricao,
      tipoLicenciamento,
      periodicidadeLicenca,
      renovacaoAutomatica: produto.renovacaoAutomatica,
      quantidadeLicencas: produto.quantidadeLicencas,
      criadoEm: produto.criadoEm,
      atualizadoEm: produto.atualizadoEm,
    };
  }
}

export const produtosService = new ProdutosService();
