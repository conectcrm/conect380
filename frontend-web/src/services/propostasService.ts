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

export interface Proposta {
  id?: string;
  numero?: string;
  cliente: Cliente;
  produtos: ProdutoSelecionado[];
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
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

  // Listar propostas com filtros
  async findAll(filters?: PropostaFilters): Promise<Proposta[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
      throw error;
    }
  }

  // Buscar proposta por ID
  async findById(id: string): Promise<Proposta> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      throw error;
    }
  }

  // Criar nova proposta
  async create(data: PropostaCreate): Promise<Proposta> {
    try {
      const response = await api.post(this.baseURL, data);
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
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      throw error;
    }
  }

  // Atualizar status da proposta
  async updateStatus(id: string, status: Proposta['status']): Promise<Proposta> {
    try {
      const response = await api.patch(`${this.baseURL}/${id}/status`, { status });
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
}

export const propostasService = new PropostasService();
