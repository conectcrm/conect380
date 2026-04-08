import api from './api';
import {
  FiltrosFluxoCaixa,
  ProjecaoFluxoCaixa,
  ResumoFluxoCaixa,
} from '../types/financeiro';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const buildQuery = (filtros?: FiltrosFluxoCaixa): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();

  if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
  if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
  if (filtros.agrupamento) params.append('agrupamento', filtros.agrupamento);
  if (typeof filtros.janelaDias === 'number' && Number.isFinite(filtros.janelaDias)) {
    params.append('janelaDias', String(filtros.janelaDias));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const fluxoCaixaService = {
  async obterResumo(filtros?: FiltrosFluxoCaixa): Promise<ResumoFluxoCaixa> {
    const response = await api.get(`/financeiro/fluxo-caixa/resumo${buildQuery(filtros)}`);
    return unwrap<ResumoFluxoCaixa>(response.data);
  },

  async obterProjecao(filtros?: FiltrosFluxoCaixa): Promise<ProjecaoFluxoCaixa> {
    const response = await api.get(`/financeiro/fluxo-caixa/projecao${buildQuery(filtros)}`);
    return unwrap<ProjecaoFluxoCaixa>(response.data);
  },
};

export default fluxoCaixaService;
