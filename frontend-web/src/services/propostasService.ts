import { api } from './api';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  documento: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status: 'lead' | 'prospect' | 'cliente' | 'inativo';
}

export interface ProdutoSelecionado {
  id: string;
  nome: string;
  descricao?: string;
  precoUnitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

export interface ProdutoProposta {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade: string;
  disponivel: boolean;
}

export interface Proposta {
  id?: string;
  numero?: string;
  cliente: Cliente;
  vendedor?: {
    id: string;
    nome: string;
    email: string;
  };
  produtos: ProdutoSelecionado[];
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'expirada';
  formaPagamento: string;
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF?: boolean;
  oportunidade?: {
    id: number;
    titulo: string;
    estagio: string;
    valor: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropostaCreate {
  clienteId: string;
  produtos: Array<{
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    desconto: number;
  }>;
  descontoGlobal: number;
  impostos: number;
  formaPagamento: string;
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF?: boolean;
}

export interface PropostaFilters {
  status?: string;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface PropostaEstatisticas {
  totalPropostas: number;
  valorTotalPipeline: number;
  taxaConversao: number;
  propostasAprovadas: number;
  estatisticasPorStatus: Record<string, number>;
  estatisticasPorVendedor: Record<string, number>;
}

class PropostasService {
  private readonly baseURL = '/propostas';
  private requestsCache = new Map<string, Promise<Proposta[]>>();
  private pendingRequests = new Map<string, Promise<Proposta[]>>();
  private lastRequestTimestamp = 0;
  private readonly MIN_REQUEST_INTERVAL = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_BASE_DELAY = 1000;
  private readonly MAX_BACKOFF_DELAY = 5000;

  private produtosMock: ProdutoProposta[] = [
    {
      id: 'mock-1',
      nome: 'Serviço de Consultoria',
      categoria: 'Serviços',
      preco: 150.0,
      unidade: 'hora',
      disponivel: true,
    },
    {
      id: 'mock-2',
      nome: 'Desenvolvimento Web',
      categoria: 'Tecnologia',
      preco: 200.0,
      unidade: 'hora',
      disponivel: true,
    },
    {
      id: 'mock-3',
      nome: 'Design Gráfico',
      categoria: 'Design',
      preco: 100.0,
      unidade: 'hora',
      disponivel: true,
    },
  ];

  private buildDomainError(action: string, error: unknown): Error {
    const responseMessage = (error as any)?.response?.data?.message;
    const normalizedMessage = Array.isArray(responseMessage)
      ? responseMessage.join('. ')
      : responseMessage;
    const fallbackMessage = error instanceof Error ? error.message : undefined;
    return new Error(normalizedMessage || fallbackMessage || `Erro ao ${action}`);
  }

  private buildQueryString(filters?: PropostaFilters): string {
    if (!filters) return '';
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  private parseFindAllResponse(data: any): Proposta[] {
    if (data && data.propostas) {
      return data.propostas;
    }
    if (Array.isArray(data)) {
      return data;
    }
    console.warn('Estrutura de dados inesperada:', data);
    return [];
  }

  private cloneProposta(proposta: Proposta): Proposta {
    return {
      ...proposta,
      cliente: proposta.cliente ? { ...proposta.cliente } : proposta.cliente,
      vendedor: proposta.vendedor ? { ...proposta.vendedor } : undefined,
      produtos: Array.isArray(proposta.produtos)
        ? proposta.produtos.map((produto) => ({ ...produto }))
        : [],
    };
  }

  private isRateLimitError(error: unknown): boolean {
    const status = (error as any)?.response?.status;
    return status === 429;
  }

  private async performFindAllRequest(
    filters?: PropostaFilters,
    attempt: number = 1,
  ): Promise<Proposta[]> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;

    if (elapsed < this.MIN_REQUEST_INTERVAL) {
      await this.delay(this.MIN_REQUEST_INTERVAL - elapsed);
    }

    try {
      const queryString = this.buildQueryString(filters);
      const response = await api.get(`${this.baseURL}${queryString}`);
      this.lastRequestTimestamp = Date.now();
      const parsed = this.parseFindAllResponse(response.data);
      return parsed;
    } catch (error) {
      if (this.isRateLimitError(error) && attempt < this.MAX_RETRIES) {
        const backoff = Math.min(
          this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1),
          this.MAX_BACKOFF_DELAY,
        );
        await this.delay(backoff);
        return this.performFindAllRequest(filters, attempt + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private carregarProdutosDoLocalStorage(): ProdutoProposta[] {
    try {
      const produtosSalvos = localStorage.getItem('fenixcrm_produtos');
      if (produtosSalvos) {
        const produtos = JSON.parse(produtosSalvos);
        const produtosConvertidos = produtos.map((produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          preco: produto.preco || produto.precoUnitario,
          unidade: produto.unidadeMedida || 'unidade',
          disponivel: produto.status === 'ativo' || produto.status === true,
        }));
        return [...produtosConvertidos, ...this.produtosMock];
      }
    } catch (error) {
      console.error('Erro ao carregar produtos do localStorage:', error);
    }
    return this.produtosMock;
  }

  clearCache(): void {
    this.requestsCache.clear();
    this.pendingRequests.clear();
  }

  async findAll(filters?: PropostaFilters): Promise<Proposta[]> {
    const cacheKey = JSON.stringify(filters || {});

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const requestPromise = this.performFindAllRequest(filters);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.requestsCache.set(cacheKey, Promise.resolve(result));
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async findById(id: string): Promise<Proposta> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      if (response.data?.proposta) {
        return response.data.proposta;
      }
      if (response.data?.success === false && response.data?.message) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      throw this.buildDomainError('buscar a proposta', error);
    }
  }

  async create(data: Partial<Proposta>): Promise<Proposta> {
    try {
      const response = await api.post(this.baseURL, data);
      this.clearCache();
      return response.data?.proposta || response.data;
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      throw this.buildDomainError('criar a proposta', error);
    }
  }

  async update(id: string, data: Partial<Proposta>): Promise<Proposta> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data);
      this.clearCache();
      return response.data?.proposta || response.data;
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error);
      throw this.buildDomainError('atualizar a proposta', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await api.delete(`${this.baseURL}/${id}`);
      if (response.data?.success === false && response.data?.message) {
        throw new Error(response.data.message);
      }
      this.clearCache();
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      throw this.buildDomainError('excluir a proposta', error);
    }
  }

  async updateStatus(id: string, status: Proposta['status']): Promise<Proposta> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/status`, { status });
      this.clearCache();
      return response.data?.proposta || response.data;
    } catch (error) {
      console.error('Erro ao atualizar status da proposta:', error);
      throw this.buildDomainError('atualizar o status da proposta', error);
    }
  }

  async getEstatisticas(): Promise<PropostaEstatisticas> {
    try {
      const propostas = await this.findAll();
      const totalPropostas = propostas.length;
      const valorTotalPipeline = propostas.reduce((total, p) => total + (p.total || 0), 0);
      const propostasAprovadas = propostas.filter((p) => p.status === 'aprovada').length;
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0;

      const estatisticasPorStatus: Record<string, number> = {};
      propostas.forEach((p) => {
        estatisticasPorStatus[p.status] = (estatisticasPorStatus[p.status] || 0) + 1;
      });

      const estatisticasPorVendedor: Record<string, number> = {
        'João Silva': Math.floor(totalPropostas * 0.4),
        'Maria Santos': Math.floor(totalPropostas * 0.35),
        'Pedro Costa': Math.floor(totalPropostas * 0.25),
      };

      return {
        totalPropostas,
        valorTotalPipeline,
        taxaConversao,
        propostasAprovadas,
        estatisticasPorStatus,
        estatisticasPorVendedor,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw this.buildDomainError('calcular estatísticas das propostas', error);
    }
  }

  async getProximoNumero(): Promise<string> {
    try {
      const response = await api.get(`${this.baseURL}/proximo-numero`);
      return response.data?.numero;
    } catch (error) {
      console.error('Erro ao buscar próximo número:', error);
      throw this.buildDomainError('obter o próximo número de proposta', error);
    }
  }

  async findByCliente(clienteId: string): Promise<Proposta[]> {
    try {
      const response = await api.get(`${this.baseURL}/cliente/${clienteId}`);
      return Array.isArray(response.data) ? response.data : response.data?.propostas || [];
    } catch (error) {
      console.error('Erro ao buscar propostas do cliente:', error);
      throw this.buildDomainError('buscar propostas por cliente', error);
    }
  }

  async convertToOrder(id: string): Promise<{ orderId: string }> {
    try {
      const response = await api.post(`${this.baseURL}/${id}/convert-to-order`);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao converter proposta em pedido:', error);
      throw this.buildDomainError('converter a proposta em pedido', error);
    }
  }

  validateProposta(proposta: Partial<Proposta>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!proposta.cliente) {
      errors.push('Cliente é obrigatório');
    }

    if (!proposta.produtos || proposta.produtos.length === 0) {
      errors.push('Pelo menos um produto deve ser adicionado');
    }

    proposta.produtos?.forEach((produto, index) => {
      if (!produto.nome?.trim()) {
        errors.push(`Produto ${index + 1}: Nome é obrigatório`);
      }
      if (!produto.precoUnitario || produto.precoUnitario <= 0) {
        errors.push(`Produto ${index + 1}: Preço deve ser maior que zero`);
      }
      if (!produto.quantidade || produto.quantidade <= 0) {
        errors.push(`Produto ${index + 1}: Quantidade deve ser maior que zero`);
      }
    });

    if (!proposta.formaPagamento) {
      errors.push('Forma de pagamento é obrigatória');
    }

    if (!proposta.validadeDias || proposta.validadeDias <= 0) {
      errors.push('Validade deve ser maior que zero');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  formatForCreate(data: any): PropostaCreate {
    return {
      clienteId: data.cliente?.id,
      produtos:
        data.produtos?.map((produto: any) => ({
          produtoId: produto.id,
          quantidade: produto.quantidade,
          precoUnitario: produto.precoUnitario,
          desconto: produto.desconto || 0,
        })) || [],
      descontoGlobal: data.descontoGlobal || 0,
      impostos: data.impostos || 0,
      formaPagamento: data.formaPagamento,
      validadeDias: data.validadeDias,
      observacoes: data.observacoes,
      incluirImpostosPDF: data.incluirImpostosPDF || false,
    };
  }

  async obterProdutos(): Promise<ProdutoProposta[]> {
    try {
      const { produtosService } = await import('./produtosService');
      const produtosAPI = await produtosService.findAll();

      if (Array.isArray(produtosAPI) && produtosAPI.length > 0) {
        return produtosAPI.map((produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          preco: produto.preco,
          unidade: produto.unidadeMedida || 'unidade',
          disponivel: produto.status === 'ativo',
        }));
      }

      return this.carregarProdutosDoLocalStorage();
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return this.carregarProdutosDoLocalStorage();
    }
  }
}

export const propostasService = new PropostasService();
