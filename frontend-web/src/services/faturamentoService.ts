import { api } from './api';

// Enums
export enum StatusFatura {
  PENDENTE = 'pendente',
  ENVIADA = 'enviada',
  PAGA = 'paga',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  PARCIALMENTE_PAGA = 'parcialmente_paga',
}

export enum TipoFatura {
  UNICA = 'unica',
  RECORRENTE = 'recorrente',
  PARCELA = 'parcela',
  ADICIONAL = 'adicional',
}

export enum FormaPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  DINHEIRO = 'dinheiro',
}

export enum StatusPagamento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
  ESTORNADO = 'estornado',
}

// Interfaces
export interface ItemFatura {
  id?: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  unidade?: string;
  codigoProduto?: string;
  percentualDesconto?: number;
  valorDesconto?: number;
  valorTotal: number;
}

export interface Fatura {
  id: number;
  numero: string;
  contratoId: string;
  contrato?: any;
  clienteId: number;
  cliente?: any;
  usuarioResponsavelId: string;
  usuarioResponsavel?: any;
  tipo: TipoFatura;
  status: StatusFatura;
  dataEmissao: string;
  dataVencimento: string;
  valorBruto: number;
  valorDesconto: number;
  valorLiquido: number;
  valorImpostos: number;
  valorTotal: number;
  // Pode vir do backend; usado nos aggregates quando disponível
  valorPago?: number;
  percentualDesconto?: number;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  linkPagamento?: string;
  arquivoUrl?: string;
  notasFiscais?: string[];
  itens: ItemFatura[];
  pagamentos?: Pagamento[];
  diasVencimento?: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovaFatura {
  contratoId: string;
  clienteId: string; // UUID string
  usuarioResponsavelId: string;
  tipo: TipoFatura;
  dataVencimento: string;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  percentualDesconto?: number;
  valorDesconto?: number;
  itens: Omit<ItemFatura, 'id' | 'valorTotal'>[];
}

export interface AtualizarFatura extends Partial<NovaFatura> {
  status?: StatusFatura;
}

export interface Pagamento {
  id: number;
  faturaId: number;
  valor: number;
  dataPagamento: string;
  formaPagamento: FormaPagamento;
  status: StatusPagamento;
  transacaoId?: string;
  comprovante?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoPagamento {
  faturaId: number;
  valor: number;
  dataPagamento: string;
  formaPagamento: FormaPagamento;
  transacaoId?: string;
  comprovante?: string;
  observacoes?: string;
}

export interface FiltrosFatura {
  busca?: string;
  status?: StatusFatura;
  tipo?: TipoFatura;
  clienteId?: number;
  dataInicial?: string;
  dataFinal?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  usuarioResponsavelId?: number;
  formaPagamento?: FormaPagamento;
  vencidas?: boolean;
  page?: number;
  limit?: number;
  // Novos parâmetros opcionais compatíveis com backend
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  q?: string;
}

export interface PlanoCobranca {
  id: number;
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'mensal' | 'anual' | 'unico' | 'personalizado';
  status: 'ativo' | 'inativo' | 'arquivado';
  clienteId?: number;
  contratoId?: number;
  diasVencimento: number;
  formaPagamento: FormaPagamento;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoPlanoCobranca {
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'mensal' | 'anual' | 'unico' | 'personalizado';
  clienteId?: number;
  contratoId?: number;
  diasVencimento: number;
  formaPagamento: FormaPagamento;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

// Tipos compartilhados
export type Aggregates = { valorTotal?: number; valorRecebido?: number; valorEmAberto?: number };

export type FaturasPaginadasResponse = {
  data: Fatura[];
  total: number;
  page: number;
  pageSize: number;
  aggregates?: Aggregates;
};

// Serviço
export const faturamentoService = {
  // ==================== FATURAS ====================

  // Novo tipo de resposta paginada com agregados
  async listarFaturasPaginadas(filtros?: FiltrosFatura): Promise<FaturasPaginadasResponse> {
    try {
      const params = new URLSearchParams();

      if (filtros) {
        // Mapeia chaves do frontend para o backend
        const mapping: Record<string, string> = {
          busca: 'q',
          page: 'page',
          limit: 'pageSize',
          pageSize: 'pageSize',
          sortBy: 'sortBy',
          sortOrder: 'sortOrder',
          status: 'status',
          tipo: 'tipo',
          clienteId: 'clienteId',
          dataInicial: 'dataInicio',
          dataFinal: 'dataFim',
          formaPagamento: 'formaPagamento',
          vencidas: 'vencidas',
          q: 'q',
        };

        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const mapped = mapping[key] ?? key;
            params.append(mapped, String(value));
          }
        });
      }

      // Consumir apenas o endpoint padronizado com metadados dentro de data
      const response = await api.get(`/faturamento/faturas/paginadas?${params.toString()}`);
      const d = response.data;

      if (d?.data && Array.isArray(d?.data?.items)) {
        const items = d.data.items as Fatura[];
        const total = Number(d.data.total ?? items.length) || 0;
        const page = Number(d.data.page ?? filtros?.page ?? 1) || 1;
        const pageSize =
          Number(d.data.pageSize ?? filtros?.pageSize ?? filtros?.limit ?? items.length) ||
          items.length;
        const aggregates: Aggregates = d.data.aggregates ?? {
          valorTotal: 0,
          valorRecebido: 0,
          valorEmAberto: 0,
        };
        return { data: items, total, page, pageSize, aggregates };
      }

      throw new Error('Formato de resposta inesperado do endpoint /faturamento/faturas/paginadas');
    } catch (error) {
      console.error('Erro ao listar faturas:', error);
      throw error;
    }
  },

  // Mantém compatibilidade: retorna apenas o array de faturas
  async listarFaturas(filtros?: FiltrosFatura): Promise<Fatura[]> {
    const res = await this.listarFaturasPaginadas(filtros);
    return res.data;
  },

  async obterFatura(id: number): Promise<Fatura> {
    try {
      const response = await api.get(`/faturamento/faturas/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao obter fatura:', error);
      throw error;
    }
  },

  async criarFatura(dadosFatura: NovaFatura): Promise<Fatura> {
    let backendData: any;
    try {
      console.log('💰 [FRONTEND] Dados originais da fatura:', JSON.stringify(dadosFatura, null, 2));

      // Transform data to match backend DTO structure
      backendData = {
        clienteId: dadosFatura.clienteId,
        usuarioResponsavelId: String(dadosFatura.usuarioResponsavelId), // Ensure it's a string for UUID validation
        tipo: dadosFatura.tipo,
        descricao: dadosFatura.observacoes || `Fatura ${dadosFatura.tipo}`, // Backend requires descricao field
        dataVencimento: dadosFatura.dataVencimento,
        observacoes: dadosFatura.observacoes,
        valorDesconto: dadosFatura.valorDesconto || 0,
        itens: dadosFatura.itens.map((item) => ({
          descricao: item.descricao,
          quantidade: Math.max(item.quantidade, 0.01),
          valorUnitario: Math.max(item.valorUnitario, 0.01),
          unidade: item.unidade || 'un',
          codigoProduto: item.codigoProduto || '',
          percentualDesconto: item.percentualDesconto || 0,
          valorDesconto: item.valorDesconto || 0,
        })),
      };

      // Only include contratoId if it's a valid number
      if (
        dadosFatura.contratoId &&
        dadosFatura.contratoId !== '' &&
        !isNaN(Number(dadosFatura.contratoId))
      ) {
        backendData.contratoId = Number(dadosFatura.contratoId);
      }

      // Only include formaPagamentoPreferida if provided
      if (dadosFatura.formaPagamento) {
        backendData.formaPagamentoPreferida = dadosFatura.formaPagamento;
      }

      console.log(
        '💰 [FRONTEND] Dados transformados para backend:',
        JSON.stringify(backendData, null, 2),
      );

      const response = await api.post('/faturamento/faturas', backendData);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Erro detalhado ao criar fatura:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        originalData: dadosFatura,
        transformedData: backendData,
        fullError: error,
      });

      // Log específico da resposta do backend
      if (error.response?.data) {
        console.error('🔍 [BACKEND RESPONSE]:', JSON.stringify(error.response.data, null, 2));
      }

      throw error;
    }
  },

  async atualizarFatura(id: number, dadosFatura: AtualizarFatura): Promise<Fatura> {
    try {
      const response = await api.put(`/faturamento/faturas/${id}`, dadosFatura);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      throw error;
    }
  },

  async excluirFatura(id: number): Promise<void> {
    try {
      await api.delete(`/faturamento/faturas/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      throw error;
    }
  },

  async gerarFaturaAutomatica(contratoId: number): Promise<Fatura> {
    try {
      // Ajuste para a rota real mapeada no backend
      const response = await api.post('/faturamento/faturas/automatica', { contratoId });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao gerar fatura automática:', error);
      throw error;
    }
  },

  async enviarFaturaPorEmail(id: number, email?: string): Promise<void> {
    try {
      await api.post(`/faturamento/faturas/${id}/enviar-email`, { email });
    } catch (error) {
      console.error('Erro ao enviar fatura por email:', error);
      throw error;
    }
  },

  async gerarLinkPagamento(id: number): Promise<string> {
    try {
      const response = await api.post(`/faturamento/faturas/${id}/link-pagamento`);
      return response.data.data?.linkPagamento || response.data.linkPagamento;
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      throw error;
    }
  },

  async baixarPDF(id: number): Promise<Blob> {
    try {
      const response = await api.get(`/faturamento/faturas/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao baixar PDF da fatura:', error);
      throw error;
    }
  },

  // ==================== PAGAMENTOS ====================

  async listarPagamentos(faturaId?: number): Promise<Pagamento[]> {
    try {
      const url = faturaId
        ? `/faturamento/pagamentos?faturaId=${faturaId}`
        : '/faturamento/pagamentos';
      const response = await api.get(url);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      throw error;
    }
  },

  async criarPagamento(dadosPagamento: NovoPagamento): Promise<Pagamento> {
    try {
      const response = await api.post('/faturamento/pagamentos', dadosPagamento);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  },

  async processarPagamento(id: number, dadosProcessamento: any): Promise<Pagamento> {
    try {
      // O endpoint não usa o ID, mas sim o gatewayTransacaoId no body
      const response = await api.post(`/faturamento/pagamentos/processar`, dadosProcessamento);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  },

  // ==================== PLANOS DE COBRANÇA ====================

  async listarPlanosCobranca(): Promise<PlanoCobranca[]> {
    try {
      const response = await api.get('/faturamento/planos-cobranca');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao listar planos de cobrança:', error);
      throw error;
    }
  },

  async criarPlanoCobranca(dadosPlano: NovoPlanoCobranca): Promise<PlanoCobranca> {
    try {
      const response = await api.post('/faturamento/planos-cobranca', dadosPlano);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao criar plano de cobrança:', error);
      throw error;
    }
  },

  // ==================== RELATÓRIOS ====================

  async obterEstatisticas(periodo?: { inicio: string; fim: string }) {
    try {
      const params = periodo ? `?inicio=${periodo.inicio}&fim=${periodo.fim}` : '';
      const response = await api.get(`/faturamento/relatorios/estatisticas${params}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  async obterFaturasVencidas(): Promise<Fatura[]> {
    try {
      const response = await api.get('/faturamento/relatorios/vencidas');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao obter faturas vencidas:', error);
      throw error;
    }
  },

  // ==================== UTILITÁRIOS ====================

  formatarNumeroFatura(numero: string): string {
    return numero.padStart(6, '0');
  },

  formatarStatusFatura(status: StatusFatura): string {
    const statusMap = {
      [StatusFatura.PENDENTE]: 'Pendente',
      [StatusFatura.ENVIADA]: 'Enviada',
      [StatusFatura.PAGA]: 'Paga',
      [StatusFatura.VENCIDA]: 'Vencida',
      [StatusFatura.CANCELADA]: 'Cancelada',
      [StatusFatura.PARCIALMENTE_PAGA]: 'Parcialmente Paga',
    };
    return statusMap[status] || status;
  },

  formatarTipoFatura(tipo: TipoFatura): string {
    const tipoMap = {
      [TipoFatura.UNICA]: 'Única',
      [TipoFatura.RECORRENTE]: 'Recorrente',
      [TipoFatura.PARCELA]: 'Parcela',
      [TipoFatura.ADICIONAL]: 'Adicional',
    };
    return tipoMap[tipo] || tipo;
  },

  formatarFormaPagamento(forma: FormaPagamento): string {
    const formaMap = {
      [FormaPagamento.PIX]: 'PIX',
      [FormaPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
      [FormaPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
      [FormaPagamento.BOLETO]: 'Boleto',
      [FormaPagamento.TRANSFERENCIA]: 'Transferência',
      [FormaPagamento.DINHEIRO]: 'Dinheiro',
    };
    return formaMap[forma] || forma;
  },

  calcularValorTotal(itens: ItemFatura[]): number {
    return itens.reduce((total, item) => {
      const subtotal = item.quantidade * item.valorUnitario;
      const desconto = item.valorDesconto || (subtotal * (item.percentualDesconto || 0)) / 100;
      return total + (subtotal - desconto);
    }, 0);
  },

  verificarVencimento(dataVencimento: string): boolean {
    return new Date(dataVencimento) < new Date();
  },
};

export default faturamentoService;
