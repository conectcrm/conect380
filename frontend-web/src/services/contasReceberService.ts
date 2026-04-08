import api from './api';
import {
  ContaReceber,
  FiltrosContasReceber,
  ListaContasReceber,
  ReenviarCobrancaContaReceberPayload,
  RegistrarRecebimentoContaReceberPayload,
  ResultadoReenviarCobrancaContaReceber,
  ResultadoRegistrarRecebimentoContaReceber,
  ResumoContasReceber,
} from '../types/financeiro';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const isListaContasReceber = (payload: unknown): payload is ListaContasReceber => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    Array.isArray(candidate.data) &&
    typeof candidate.total === 'number' &&
    typeof candidate.page === 'number' &&
    typeof candidate.pageSize === 'number'
  );
};

const unwrapListaContasReceber = (payload: unknown): ListaContasReceber => {
  if (isListaContasReceber(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    const nested = (payload as { data: unknown }).data;
    if (isListaContasReceber(nested)) {
      return nested;
    }
  }

  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
  };
};

const buildQuery = (filtros?: FiltrosContasReceber): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();

  if (filtros.busca?.trim()) params.append('busca', filtros.busca.trim());
  if (filtros.clienteId) params.append('clienteId', filtros.clienteId);
  if (filtros.dataVencimentoInicio) params.append('dataVencimentoInicio', filtros.dataVencimentoInicio);
  if (filtros.dataVencimentoFim) params.append('dataVencimentoFim', filtros.dataVencimentoFim);
  if (typeof filtros.valorMin === 'number' && Number.isFinite(filtros.valorMin)) {
    params.append('valorMin', String(filtros.valorMin));
  }
  if (typeof filtros.valorMax === 'number' && Number.isFinite(filtros.valorMax)) {
    params.append('valorMax', String(filtros.valorMax));
  }
  if (typeof filtros.page === 'number' && Number.isFinite(filtros.page)) {
    params.append('page', String(filtros.page));
  }
  if (typeof filtros.pageSize === 'number' && Number.isFinite(filtros.pageSize)) {
    params.append('pageSize', String(filtros.pageSize));
  }
  if (filtros.sortBy) params.append('sortBy', filtros.sortBy);
  if (filtros.sortOrder) params.append('sortOrder', filtros.sortOrder);

  filtros.status?.forEach((item) => params.append('status', item));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const contasReceberService = {
  async listar(filtros?: FiltrosContasReceber): Promise<ListaContasReceber> {
    const response = await api.get(`/contas-receber${buildQuery(filtros)}`);
    return unwrapListaContasReceber(response.data);
  },

  async obterResumo(filtros?: FiltrosContasReceber): Promise<ResumoContasReceber> {
    const response = await api.get(`/contas-receber/resumo${buildQuery(filtros)}`);
    return unwrap<ResumoContasReceber>(response.data);
  },

  async buscarPorId(id: string): Promise<ContaReceber | null> {
    const response = await api.get(`/contas-receber${buildQuery({ busca: id, page: 1, pageSize: 1 })}`);
    const payload = unwrapListaContasReceber(response.data);
    return Array.isArray(payload?.data) && payload.data.length > 0 ? payload.data[0] : null;
  },

  async registrarRecebimento(
    contaReceberId: number,
    payload: RegistrarRecebimentoContaReceberPayload,
  ): Promise<ResultadoRegistrarRecebimentoContaReceber> {
    const response = await api.post(`/contas-receber/${contaReceberId}/registrar-recebimento`, payload);
    return unwrap<ResultadoRegistrarRecebimentoContaReceber>(response.data);
  },

  async reenviarCobranca(
    contaReceberId: number,
    payload?: ReenviarCobrancaContaReceberPayload,
  ): Promise<ResultadoReenviarCobrancaContaReceber> {
    const response = await api.post(`/contas-receber/${contaReceberId}/reenviar-cobranca`, payload || {});
    return unwrap<ResultadoReenviarCobrancaContaReceber>(response.data);
  },
};

export default contasReceberService;
