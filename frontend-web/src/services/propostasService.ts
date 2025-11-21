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
    tipo: string;
    ativo: boolean;
  };
  produtos: ProdutoSelecionado[];
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
  valor?: number;
  formaPagamento: 'avista' | 'boleto' | 'cartao' | 'pix' | 'recorrente';
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF: boolean;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'expirada';
  dataVencimento?: string;
  criadaEm?: string;
  atualizadaEm?: string;
}

export interface PropostaCreate {
  clienteId: string;
  produtos: {
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    desconto: number;
  }[];
  descontoGlobal: number;
  impostos: number;
  formaPagamento: string;
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF: boolean;
}

export interface PropostaFilters {
  status?: string;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface PropostaEstatisticas {
  totalPropostas: number;
  propostasEnviadas: number;
  propostasAprovadas: number;
  valorTotalPropostas: number;
  taxaConversao: number;
  valorMedioPropostas: number;
}

class PropostasService {
  private baseURL = '/propostas';
  private readonly CACHE_TTL = 30 * 1000; // 30 segundos
  private readonly MIN_REQUEST_INTERVAL = 500; // 0.5s entre chamadas
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_BASE_DELAY = 500;
  private readonly MAX_BACKOFF_DELAY = 4_000;
  private lastRequestTimestamp = 0;
  private requestsCache = new Map<string, { timestamp: number; data: Proposta[] }>();
  private pendingRequests = new Map<string, Promise<Proposta[]>>();

  // Produtos mock como fallback
  private produtosMock: ProdutoProposta[] = [
    {
      id: 'mock-1',
      nome: 'Sistema ERP',
      categoria: 'Software',
      preco: 2500.00,
      unidade: 'licença',
      disponivel: true
    },
    {
      id: 'mock-2',
      nome: 'Consultoria em TI',
      categoria: 'Serviços',
      preco: 5000.00,
      unidade: 'hora',
      disponivel: true
    },
    {
      id: 'mock-3',
      nome: 'Suporte Técnico',
      categoria: 'Serviços',
      preco: 150.00,
      unidade: 'hora',
      disponivel: true
    }
  ];

  // Listar propostas com filtros
  async findAll(filters?: PropostaFilters): Promise<Proposta[]> {
    const cacheKey = this.buildCacheKey(filters);
    const cached = this.requestsCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data.map(proposta => this.cloneProposta(proposta));
    }

    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const requestPromise = this.performFindAllRequest(filters);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const propostas = await requestPromise;
      const normalized = propostas.map(proposta => this.cloneProposta(proposta));
      this.requestsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: normalized,
      });
      return normalized.map(proposta => this.cloneProposta(proposta));
    } catch (error) {
      if (!this.isRateLimitError(error)) {
        console.error('Erro ao buscar propostas:', error);
      }
      throw error;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private buildCacheKey(filters?: PropostaFilters): string {
    if (!filters || Object.keys(filters).length === 0) {
      return '__default__';
    }

    const normalizedEntries = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b));

    if (normalizedEntries.length === 0) {
      return '__default__';
    }

    return JSON.stringify(normalizedEntries);
  }

  private buildQueryString(filters?: PropostaFilters): string {
    if (!filters) {
      return '';
    }

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
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
        ? proposta.produtos.map(produto => ({ ...produto }))
        : [],
    };
  }

  private isRateLimitError(error: unknown): boolean {
    const status = (error as any)?.response?.status;
    return status === 429;
  }

  private async performFindAllRequest(filters?: PropostaFilters, attempt: number = 1): Promise<Proposta[]> {
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
        const backoff = Math.min(this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1), this.MAX_BACKOFF_DELAY);
        await this.delay(backoff);
        return this.performFindAllRequest(filters, attempt + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearCache(): void {
    this.requestsCache.clear();
    this.pendingRequests.clear();
  }

  // Buscar proposta por ID
  async findById(id: string): Promise<Proposta> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);

      // ✅ CORREÇÃO: Backend retorna { success: true, proposta: {...} }
      if (response.data && response.data.proposta) {
        return response.data.proposta;
      } else if (response.data && !response.data.success) {
        return response.data;
      } else {
        console.warn('Estrutura de dados inesperada para proposta:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      throw error;
    }
  }

  // Criar nova proposta
  async create(data: PropostaCreate): Promise<Proposta> {
    try {
      const response = await api.post(this.baseURL, data);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      throw error;
    }
  }

  // Atualizar proposta
  async update(id: string, data: Partial<PropostaCreate>): Promise<Proposta> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error);
      throw error;
    }
  }

  // Excluir proposta
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      this.clearCache();
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      throw error;
    }
  }

  // Atualizar status da proposta
  async updateStatus(id: string, status: Proposta['status']): Promise<Proposta> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/status`, { status });
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status da proposta:', error);
      throw error;
    }
  }

  // Gerar PDF da proposta
  async generatePDF(id: string): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseURL}/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  // Duplicar proposta
  async duplicate(id: string): Promise<Proposta> {
    try {
      const response = await api.post(`${this.baseURL}/${id}/duplicate`);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao duplicar proposta:', error);
      throw error;
    }
  }

  // Enviar proposta por email
  async sendByEmail(id: string, emails: string[]): Promise<void> {
    try {
      await api.post(`${this.baseURL}/${id}/send-email`, { emails });
    } catch (error) {
      console.error('Erro ao enviar proposta por email:', error);
      throw error;
    }
  }

  // Obter estatísticas de propostas
  async getEstatisticas(): Promise<PropostaEstatisticas> {
    try {
      const response = await api.get(`${this.baseURL}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Alias para compatibilidade
  async obterEstatisticas(): Promise<any> {
    try {
      // Implementação que calcula estatísticas das propostas carregadas
      const propostas = await this.findAll();

      const totalPropostas = propostas.length;
      const valorTotalPipeline = propostas.reduce((total, p) => total + (p.total || 0), 0);
      const propostasAprovadas = propostas.filter(p => p.status === 'aprovada').length;
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0;

      // Estatísticas por status
      const estatisticasPorStatus: Record<string, number> = {};
      propostas.forEach(p => {
        estatisticasPorStatus[p.status] = (estatisticasPorStatus[p.status] || 0) + 1;
      });

      // Estatísticas por vendedor (usando mock por enquanto)
      const estatisticasPorVendedor: Record<string, number> = {
        'João Silva': Math.floor(totalPropostas * 0.4),
        'Maria Santos': Math.floor(totalPropostas * 0.35),
        'Pedro Costa': Math.floor(totalPropostas * 0.25)
      };

      return {
        totalPropostas,
        valorTotalPipeline,
        taxaConversao,
        propostasAprovadas,
        estatisticasPorStatus,
        estatisticasPorVendedor
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  }

  // Obter próximo número da proposta
  async getProximoNumero(): Promise<string> {
    try {
      const response = await api.get(`${this.baseURL}/proximo-numero`);
      return response.data.numero;
    } catch (error) {
      console.error('Erro ao buscar próximo número:', error);
      throw error;
    }
  }

  // Buscar propostas por cliente
  async findByCliente(clienteId: string): Promise<Proposta[]> {
    try {
      const response = await api.get(`${this.baseURL}/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar propostas do cliente:', error);
      throw error;
    }
  }

  // Converter proposta em pedido/contrato
  async convertToOrder(id: string): Promise<{ orderId: string }> {
    try {
      const response = await api.post(`${this.baseURL}/${id}/convert-to-order`);
      this.clearCache();
      return response.data;
    } catch (error) {
      console.error('Erro ao converter proposta em pedido:', error);
      throw error;
    }
  }

  // Validar proposta antes de enviar
  validateProposta(proposta: Partial<Proposta>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!proposta.cliente) {
      errors.push('Cliente é obrigatório');
    }

    if (!proposta.produtos || proposta.produtos.length === 0) {
      errors.push('Pelo menos um produto deve ser adicionado');
    }

    if (proposta.produtos) {
      proposta.produtos.forEach((produto, index) => {
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
    }

    if (!proposta.formaPagamento) {
      errors.push('Forma de pagamento é obrigatória');
    }

    if (!proposta.validadeDias || proposta.validadeDias <= 0) {
      errors.push('Validade deve ser maior que zero');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Formatar dados para criação
  formatForCreate(data: any): PropostaCreate {
    return {
      clienteId: data.cliente?.id,
      produtos: data.produtos?.map((produto: any) => ({
        produtoId: produto.id,
        quantidade: produto.quantidade,
        precoUnitario: produto.precoUnitario,
        desconto: produto.desconto || 0
      })) || [],
      descontoGlobal: data.descontoGlobal || 0,
      impostos: data.impostos || 0,
      formaPagamento: data.formaPagamento,
      validadeDias: data.validadeDias,
      observacoes: data.observacoes,
      incluirImpostosPDF: data.incluirImpostosPDF || false
    };
  }

  // Método para obter produtos disponíveis do backend
  async obterProdutos(): Promise<ProdutoProposta[]> {
    try {
      // Tentar importar o serviço de produtos dinamicamente
      const { produtosService } = await import('./produtosService');

      // Buscar produtos do backend
      const produtosAPI = await produtosService.findAll();

      if (produtosAPI && produtosAPI.length > 0) {
        // Converter formato da API para formato da proposta
        const produtosConvertidos = produtosAPI.map((produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          preco: produto.preco,
          unidade: produto.unidadeMedida || 'unidade',
          disponivel: produto.status === 'ativo'
        }));

        return produtosConvertidos;
      }

      // Fallback: tentar localStorage se backend falhar
      const produtosSalvos = localStorage.getItem('fenixcrm_produtos');
      if (produtosSalvos) {
        const produtos = JSON.parse(produtosSalvos);
        const produtosConvertidos = produtos.map((produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          preco: produto.preco || produto.precoUnitario,
          unidade: produto.unidadeMedida || 'unidade',
          disponivel: produto.status === 'ativo' || produto.status === true
        }));
        return [...produtosConvertidos, ...this.produtosMock];
      }

      // Retornar apenas produtos mock se não houver produtos
      return this.produtosMock;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);

      // Fallback para localStorage em caso de erro
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
            disponivel: produto.status === 'ativo' || produto.status === true
          }));
          return [...produtosConvertidos, ...this.produtosMock];
        }
      } catch (localStorageError) {
        console.error('Erro ao acessar localStorage:', localStorageError);
      }

      return this.produtosMock;
    }
  }
}

export const propostasService = new PropostasService();
