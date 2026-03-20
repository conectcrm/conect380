import api from './api';
import { CentroCusto } from '../types/financeiro';

export type FiltrosCentroCusto = {
  ativo?: boolean;
  busca?: string;
};

export interface NovoCentroCusto {
  codigo: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export type AtualizarCentroCusto = Partial<NovoCentroCusto>;

type CentroCustoApi = {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  createdAt?: string;
  updatedAt?: string;
};

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const normalizeCentroCusto = (item: CentroCustoApi): CentroCusto => ({
  id: item.id,
  codigo: item.codigo,
  nome: item.nome,
  descricao: item.descricao || undefined,
  ativo: item.ativo ?? true,
  criadoEm: item.criadoEm || item.createdAt || '',
  atualizadoEm: item.atualizadoEm || item.updatedAt || '',
});

const sanitizePayload = (
  dados: NovoCentroCusto | AtualizarCentroCusto,
): Record<string, unknown> => {
  const payload = { ...dados } as Record<string, unknown>;
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
      delete payload[key];
    }
  });
  return payload;
};

const buildQuery = (filtros?: FiltrosCentroCusto): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
  if (filtros.busca?.trim()) params.append('busca', filtros.busca.trim());

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const centroCustoService = {
  async listar(filtros?: FiltrosCentroCusto): Promise<CentroCusto[]> {
    const response = await api.get(`/centros-custo${buildQuery(filtros)}`);
    const payload = unwrap<CentroCustoApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeCentroCusto) : [];
  },

  async listarAtivos(): Promise<CentroCusto[]> {
    const response = await api.get('/centros-custo/ativos');
    const payload = unwrap<CentroCustoApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeCentroCusto) : [];
  },

  async buscarPorId(id: string): Promise<CentroCusto> {
    const response = await api.get(`/centros-custo/${id}`);
    const payload = unwrap<CentroCustoApi>(response.data);
    return normalizeCentroCusto(payload);
  },

  async criar(dados: NovoCentroCusto): Promise<CentroCusto> {
    const response = await api.post('/centros-custo', sanitizePayload(dados));
    const payload = unwrap<CentroCustoApi>(response.data);
    return normalizeCentroCusto(payload);
  },

  async atualizar(id: string, dados: AtualizarCentroCusto): Promise<CentroCusto> {
    const response = await api.put(`/centros-custo/${id}`, sanitizePayload(dados));
    const payload = unwrap<CentroCustoApi>(response.data);
    return normalizeCentroCusto(payload);
  },

  async desativar(id: string): Promise<CentroCusto> {
    const response = await api.patch(`/centros-custo/${id}/desativar`);
    const payload = unwrap<{ centroCusto?: CentroCustoApi } | CentroCustoApi>(response.data);
    const centroCusto =
      typeof payload === 'object' && payload && 'centroCusto' in payload
        ? payload.centroCusto
        : (payload as CentroCustoApi);
    return normalizeCentroCusto(centroCusto as CentroCustoApi);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/centros-custo/${id}`);
  },
};

export default centroCustoService;
