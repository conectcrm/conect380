import api from './api';

function unwrapEnvelope<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success === false) {
      throw new Error(payload.message || 'Erro na resposta da API de faturamento');
    }
    if ('data' in payload) {
      return payload.data as T;
    }
  }

  return payload as T;
}

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
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    q?: string;
  }): Promise<{
    faturas: FaturaResponse[];
    total: number;
    page: number;
    pageSize: number;
    aggregates?: { valorTotal?: number; valorRecebido?: number; valorEmAberto?: number };
  }> {
    const params = new URLSearchParams();

    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.clienteId) params.append('clienteId', filtros.clienteId);
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('pageSize', filtros.limit.toString());
    if (filtros?.pageSize) params.append('pageSize', filtros.pageSize.toString());
    if (filtros?.sortBy) params.append('sortBy', filtros.sortBy);
    if (filtros?.sortOrder) params.append('sortOrder', filtros.sortOrder);
    if (filtros?.q) params.append('q', filtros.q);

    // Consumir apenas o endpoint padronizado com metadados em data
    const response = await api.get(`/faturamento/faturas/paginadas?${params.toString()}`);
    const d = response.data;

    if (d?.data && Array.isArray(d?.data?.items)) {
      return {
        faturas: d.data.items,
        total: Number(d.data.total ?? d.data.items?.length ?? 0) || 0,
        page: Number(d.data.page ?? 1) || 1,
        pageSize: Number(d.data.pageSize ?? d.data.items?.length ?? 0) || 0,
        aggregates: d.data.aggregates,
      };
    }

    throw new Error('Formato de resposta inesperado do endpoint /faturamento/faturas/paginadas');
  }

  async buscarFaturaPorId(id: string): Promise<FaturaResponse> {
    const response = await api.get(`/faturamento/faturas/${id}`);
    return unwrapEnvelope<FaturaResponse>(response.data);
  }

  async criarFatura(dados: FaturaRequest): Promise<FaturaResponse> {
    const response = await api.post('/faturamento/faturas', dados);
    return unwrapEnvelope<FaturaResponse>(response.data);
  }

  async atualizarFatura(id: string, dados: Partial<FaturaRequest>): Promise<FaturaResponse> {
    const response = await api.put(`/faturamento/faturas/${id}`, dados);
    return unwrapEnvelope<FaturaResponse>(response.data);
  }

  async deletarFatura(id: string): Promise<void> {
    await api.delete(`/faturamento/faturas/${id}`);
  }

  async gerarFaturaAutomatica(contratoId: string): Promise<FaturaResponse> {
    // Ajuste para a rota real mapeada
    const response = await api.post('/faturamento/faturas/automatica', { contratoId });
    return unwrapEnvelope<FaturaResponse>(response.data);
  }

  async enviarFaturaPorEmail(
    faturaId: string,
    payload?: string | { email?: string; templateId?: string; assunto?: string; conteudo?: string },
  ): Promise<{
    enviado: boolean;
    simulado: boolean;
    motivo?: string;
    detalhes?: string;
    message?: string;
  }> {
    const body = typeof payload === 'string' ? { email: payload } : payload || {};
    const response = await api.post(`/faturamento/faturas/${faturaId}/enviar-email`, body);
    const responsePayload = response?.data ?? {};
    const data = responsePayload?.data ?? responsePayload ?? {};
    const enviado = typeof data?.enviado === 'boolean' ? data.enviado : true;
    const simulado = Boolean(data?.simulado);
    const motivo =
      typeof data?.motivo === 'string' && data.motivo.trim().length > 0 ? data.motivo : undefined;
    const detalhes =
      typeof data?.detalhes === 'string' && data.detalhes.trim().length > 0
        ? data.detalhes
        : undefined;
    const message =
      typeof responsePayload?.message === 'string' && responsePayload.message.trim().length > 0
        ? responsePayload.message
        : undefined;

    if (!enviado) {
      throw new Error(message || 'Falha ao enviar fatura por email.');
    }

    return { enviado, simulado, motivo, detalhes, message };
  }

  async baixarPDFFatura(faturaId: string): Promise<Blob> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Pagamentos
  async listarPagamentos(faturaId?: string): Promise<PagamentoResponse[]> {
    const url = faturaId
      ? `/faturamento/pagamentos?faturaId=${faturaId}`
      : '/faturamento/pagamentos';

    const response = await api.get(url);
    return unwrapEnvelope<PagamentoResponse[]>(response.data);
  }

  async registrarPagamento(dados: PagamentoRequest): Promise<PagamentoResponse> {
    const response = await api.post('/faturamento/pagamentos', dados);
    return unwrapEnvelope<PagamentoResponse>(response.data);
  }

  async atualizarPagamento(
    id: string,
    dados: Partial<PagamentoRequest>,
  ): Promise<PagamentoResponse> {
    const response = await api.put(`/faturamento/pagamentos/${id}`, dados);
    return unwrapEnvelope<PagamentoResponse>(response.data);
  }

  // Relatórios
  async obterResumoFaturamento(periodo?: { dataInicio: string; dataFim: string }): Promise<{
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

    const { faturas, aggregates } = await this.listarFaturas({
      dataInicio: periodo?.dataInicio,
      dataFim: periodo?.dataFim,
      page: 1,
      pageSize: 1000,
    });

    const totalFaturas = faturas.length;
    const valorTotalFaturado = Number(aggregates?.valorTotal ?? 0);
    const valorTotalPago = Number(aggregates?.valorRecebido ?? 0);
    const faturasPendentes = faturas.filter((f) =>
      ['pendente', 'enviada', 'parcialmente_paga'].includes(String(f.status || '').toLowerCase()),
    ).length;
    const faturasVencidas = faturas.filter(
      (f) => String(f.status || '').toLowerCase() === 'vencida',
    ).length;
    const taxaRecebimento =
      valorTotalFaturado > 0 ? (valorTotalPago / valorTotalFaturado) * 100 : 0;

    return {
      totalFaturas,
      valorTotalFaturado,
      valorTotalPago,
      faturasPendentes,
      faturasVencidas,
      taxaRecebimento,
    };
  }

  async obterAnalyticsFaturamento(periodo?: { dataInicio: string; dataFim: string }): Promise<{
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

    const { faturas } = await this.listarFaturas({
      dataInicio: periodo?.dataInicio,
      dataFim: periodo?.dataFim,
      page: 1,
      pageSize: 1000,
    });

    const byMonth = new Map<string, { valor: number; quantidade: number }>();
    const byStatus = new Map<string, number>();
    const byCliente = new Map<string, { clienteNome: string; valorTotal: number; quantidadeFaturas: number }>();

    for (const f of faturas) {
      const dataBase = new Date((f.dataEmissao || f.dataVencimento) as string);
      const mes = Number.isNaN(dataBase.getTime())
        ? 'desconhecido'
        : `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, '0')}`;

      const currentMonth = byMonth.get(mes) || { valor: 0, quantidade: 0 };
      currentMonth.valor += Number(f.valorTotal || 0);
      currentMonth.quantidade += 1;
      byMonth.set(mes, currentMonth);

      const status = String(f.status || 'desconhecido');
      byStatus.set(status, (byStatus.get(status) || 0) + 1);

      const clienteId = String(f.cliente?.id || f.clienteId || 'desconhecido');
      const clienteNome = f.cliente?.nome || `Cliente ${clienteId}`;
      const currentCliente = byCliente.get(clienteId) || {
        clienteNome,
        valorTotal: 0,
        quantidadeFaturas: 0,
      };
      currentCliente.valorTotal += Number(f.valorTotal || 0);
      currentCliente.quantidadeFaturas += 1;
      byCliente.set(clienteId, currentCliente);
    }

    return {
      faturamentoPorMes: Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, dados]) => ({ mes, valor: dados.valor, quantidade: dados.quantidade })),
      statusDistribution: Array.from(byStatus.entries()).map(([status, quantidade]) => ({
        status,
        quantidade,
        percentual: faturas.length > 0 ? (quantidade / faturas.length) * 100 : 0,
      })),
      topClientes: Array.from(byCliente.entries())
        .map(([clienteId, dados]) => ({
          clienteId,
          clienteNome: dados.clienteNome,
          valorTotal: dados.valorTotal,
          quantidadeFaturas: dados.quantidadeFaturas,
        }))
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 10),
    };
  }
}

export const faturamentoAPI = new FaturamentoAPIService();
