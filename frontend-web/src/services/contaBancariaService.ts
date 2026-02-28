import api from './api';
import { ContaBancaria } from '../types/financeiro';

export type FiltrosContaBancaria = {
  ativo?: boolean;
  busca?: string;
};

export interface NovaContaBancaria {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta?: 'corrente' | 'poupanca';
  saldo?: number;
  chavePix?: string;
  ativo?: boolean;
}

export type AtualizarContaBancaria = Partial<NovaContaBancaria>;

type ContaBancariaApi = {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta?: 'corrente' | 'poupanca';
  saldo?: number | string;
  chavePix?: string;
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

const normalizeContaBancaria = (item: ContaBancariaApi): ContaBancaria => ({
  id: item.id,
  nome: item.nome,
  banco: item.banco,
  agencia: item.agencia,
  conta: item.conta,
  tipoConta: item.tipoConta || 'corrente',
  saldo: Number(item.saldo || 0),
  chavePix: item.chavePix || undefined,
  ativo: item.ativo ?? true,
  criadoEm: item.criadoEm || item.createdAt || '',
  atualizadoEm: item.atualizadoEm || item.updatedAt || '',
});

const sanitizePayload = (
  dados: NovaContaBancaria | AtualizarContaBancaria,
): Record<string, unknown> => {
  const payload = { ...dados } as Record<string, unknown>;
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
      delete payload[key];
    }
  });
  return payload;
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
    const payload = unwrap<ContaBancariaApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeContaBancaria) : [];
  },

  async listarAtivas(): Promise<ContaBancaria[]> {
    const response = await api.get('/contas-bancarias/ativas');
    const payload = unwrap<ContaBancariaApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeContaBancaria) : [];
  },

  async buscarPorId(id: string): Promise<ContaBancaria> {
    const response = await api.get(`/contas-bancarias/${id}`);
    const payload = unwrap<ContaBancariaApi>(response.data);
    return normalizeContaBancaria(payload);
  },

  async criar(dados: NovaContaBancaria): Promise<ContaBancaria> {
    const response = await api.post('/contas-bancarias', sanitizePayload(dados));
    const payload = unwrap<ContaBancariaApi>(response.data);
    return normalizeContaBancaria(payload);
  },

  async atualizar(id: string, dados: AtualizarContaBancaria): Promise<ContaBancaria> {
    const response = await api.put(`/contas-bancarias/${id}`, sanitizePayload(dados));
    const payload = unwrap<ContaBancariaApi>(response.data);
    return normalizeContaBancaria(payload);
  },

  async desativar(id: string): Promise<ContaBancaria> {
    const response = await api.patch(`/contas-bancarias/${id}/desativar`);
    const payload = unwrap<{ contaBancaria?: ContaBancariaApi } | ContaBancariaApi>(response.data);
    const contaBancaria =
      typeof payload === 'object' && payload && 'contaBancaria' in payload
        ? payload.contaBancaria
        : (payload as ContaBancariaApi);
    return normalizeContaBancaria(contaBancaria as ContaBancariaApi);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/contas-bancarias/${id}`);
  },
};

export default contaBancariaService;
