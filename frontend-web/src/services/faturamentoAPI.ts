import api from './api';

export interface FaturaRequest {
  contratoId: string;
  clienteId: string;
  usuarioResponsavelId: string;
  tipo: 'entrada' | 'parcela' | 'recorrente' | 'avulsa';
  descricao: string;
  dataVencimento: string;
  formaPagamentoPreferida?: string;
  itens: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorDesconto?: number;
  }>;
}

export interface FaturaResponse {
  id: string;
  numero: string;
  contratoId: string;
  clienteId: string;
  usuarioResponsavelId: string;
  tipo: string;
  status: string;
  valorTotal: number;
  valorPago: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  descricao: string;
  formaPagamentoPreferida?: string;
  itens: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorDesconto: number;
    valorTotal: number;
  }>;
  cliente?: {
    id: string;
    nome: string;
    email: string;
    documento: string;
  };
}

export interface PagamentoRequest {
  faturaId: string;
  valor: number;
  metodo: string;
  gateway: string;
  transacaoId: string;
  taxa?: number;
  observacoes?: string;
}

export interface PagamentoResponse {
  id: string;
  faturaId: string;
  valor: number;
  valorLiquido: number;
  metodo: string;
  gateway: string;
  transacaoId: string;
  status: string;
  dataProcessamento: string;
  taxa: number;
  observacoes?: string;
}

class FaturamentoAPIService {
  // Faturas
  async listarFaturas(filtros?: {
    status?: string;
    clienteId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }): Promise<{ faturas: FaturaResponse[]; total: number }> {
    const params = new URLSearchParams();

    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.clienteId) params.append('clienteId', filtros.clienteId);
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await api.get(`/faturamento/faturas?${params.toString()}`);
    return response.data;
  }

  async buscarFaturaPorId(id: string): Promise<FaturaResponse> {
    const response = await api.get(`/faturamento/faturas/${id}`);
    return response.data;
  }

  async criarFatura(dados: FaturaRequest): Promise<FaturaResponse> {
    const response = await api.post('/faturamento/faturas', dados);
    return response.data;
  }

  async atualizarFatura(id: string, dados: Partial<FaturaRequest>): Promise<FaturaResponse> {
    const response = await api.put(`/faturamento/faturas/${id}`, dados);
    return response.data;
  }

  async deletarFatura(id: string): Promise<void> {
    await api.delete(`/faturamento/faturas/${id}`);
  }

  async gerarFaturaAutomatica(contratoId: string): Promise<FaturaResponse> {
    const response = await api.post('/faturamento/gerar-automatica', { contratoId });
    return response.data;
  }

  async enviarFaturaPorEmail(faturaId: string, email?: string): Promise<void> {
    await api.post(`/faturamento/faturas/${faturaId}/enviar-email`, { email });
  }

  async baixarPDFFatura(faturaId: string): Promise<Blob> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Pagamentos
  async listarPagamentos(faturaId?: string): Promise<PagamentoResponse[]> {
    const url = faturaId
      ? `/faturamento/pagamentos?faturaId=${faturaId}`
      : '/faturamento/pagamentos';

    const response = await api.get(url);
    return response.data;
  }

  async registrarPagamento(dados: PagamentoRequest): Promise<PagamentoResponse> {
    const response = await api.post('/faturamento/pagamentos', dados);
    return response.data;
  }

  async atualizarPagamento(id: string, dados: Partial<PagamentoRequest>): Promise<PagamentoResponse> {
    const response = await api.put(`/faturamento/pagamentos/${id}`, dados);
    return response.data;
  }

  // Relatórios
  async obterResumoFaturamento(periodo?: {
    dataInicio: string;
    dataFim: string;
  }): Promise<{
    totalFaturas: number;
    valorTotalFaturado: number;
    valorTotalPago: number;
    faturasPendentes: number;
    faturasVencidas: number;
    taxaRecebimento: number;
  }> {
    const params = new URLSearchParams();
    if (periodo?.dataInicio) params.append('dataInicio', periodo.dataInicio);
    if (periodo?.dataFim) params.append('dataFim', periodo.dataFim);

    const response = await api.get(`/faturamento/resumo?${params.toString()}`);
    return response.data;
  }

  async obterAnalyticsFaturamento(periodo?: {
    dataInicio: string;
    dataFim: string;
  }): Promise<{
    faturamentoPorMes: Array<{
      mes: string;
      valor: number;
      quantidade: number;
    }>;
    statusDistribution: Array<{
      status: string;
      quantidade: number;
      percentual: number;
    }>;
    topClientes: Array<{
      clienteId: string;
      clienteNome: string;
      valorTotal: number;
      quantidadeFaturas: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (periodo?.dataInicio) params.append('dataInicio', periodo.dataInicio);
    if (periodo?.dataFim) params.append('dataFim', periodo.dataFim);

    const response = await api.get(`/faturamento/analytics?${params.toString()}`);
    return response.data;
  }
}

export const faturamentoAPI = new FaturamentoAPIService();
