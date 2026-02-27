import api from './api';
import { ContaBancaria } from '../types/financeiro';

type FiltrosContaBancaria = {
  ativo?: boolean;
  busca?: string;
};

const buildQuery = (filtros?: FiltrosContaBancaria): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
  if (filtros.busca?.trim()) params.append('busca', filtros.busca.trim());

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const contaBancariaService = {
  async listar(filtros?: FiltrosContaBancaria): Promise<ContaBancaria[]> {
    const response = await api.get(`/contas-bancarias${buildQuery(filtros)}`);
    return response.data;
  },

  async listarAtivas(): Promise<ContaBancaria[]> {
    const response = await api.get('/contas-bancarias/ativas');
    return response.data;
  },
};

export default contaBancariaService;
