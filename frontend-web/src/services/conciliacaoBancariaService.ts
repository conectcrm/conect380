import api from './api';
import {
  ContaPagarCandidataConciliacao,
  FiltrosImportacoesExtrato,
  ImportacaoExtrato,
  ItemImportacaoExtrato,
  ResultadoMatchingAutomaticoExtrato,
  ResultadoImportacaoExtrato,
} from '../types/financeiro';

type ImportacaoExtratoApi = Omit<ImportacaoExtrato, 'totalEntradas' | 'totalSaidas'> & {
  totalEntradas: number | string;
  totalSaidas: number | string;
};

type ItemImportacaoExtratoApi = Omit<ItemImportacaoExtrato, 'valor' | 'saldoPosLancamento'> & {
  valor: number | string;
  saldoPosLancamento?: number | string;
};

type ContaPagarCandidataConciliacaoApi = Omit<
  ContaPagarCandidataConciliacao,
  'valorTotal' | 'valorPago' | 'score'
> & {
  valorTotal: number | string;
  valorPago: number | string;
  score: number | string;
};

type ResultadoImportacaoExtratoApi = Omit<ResultadoImportacaoExtrato, 'importacao' | 'itensPreview'> & {
  importacao: ImportacaoExtratoApi;
  itensPreview: ItemImportacaoExtratoApi[];
};

type ResultadoMatchingAutomaticoExtratoApi = Omit<
  ResultadoMatchingAutomaticoExtrato,
  'itensConciliados'
> & {
  itensConciliados: Array<{
    itemId: string;
    contaPagarId: string;
    score: number | string;
    criterios: string[];
  }>;
};

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeImportacao = (item: ImportacaoExtratoApi): ImportacaoExtrato => ({
  ...item,
  totalEntradas: toNumber(item.totalEntradas),
  totalSaidas: toNumber(item.totalSaidas),
});

const normalizeItem = (item: ItemImportacaoExtratoApi): ItemImportacaoExtrato => ({
  ...item,
  valor: toNumber(item.valor),
  saldoPosLancamento:
    item.saldoPosLancamento !== undefined && item.saldoPosLancamento !== null
      ? toNumber(item.saldoPosLancamento)
      : undefined,
  auditoriaConciliacao: Array.isArray(item.auditoriaConciliacao) ? item.auditoriaConciliacao : [],
});

const normalizeCandidato = (
  candidato: ContaPagarCandidataConciliacaoApi,
): ContaPagarCandidataConciliacao => ({
  ...candidato,
  valorTotal: toNumber(candidato.valorTotal),
  valorPago: toNumber(candidato.valorPago),
  score: toNumber(candidato.score),
  criterios: Array.isArray(candidato.criterios) ? candidato.criterios : [],
});

const buildQuery = (filtros?: FiltrosImportacoesExtrato): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.contaBancariaId) params.append('contaBancariaId', filtros.contaBancariaId);
  if (filtros.limite) params.append('limite', String(filtros.limite));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const conciliacaoBancariaService = {
  async listarImportacoes(filtros?: FiltrosImportacoesExtrato): Promise<ImportacaoExtrato[]> {
    const response = await api.get(`/conciliacao-bancaria/importacoes${buildQuery(filtros)}`);
    const payload = unwrap<ImportacaoExtratoApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeImportacao) : [];
  },

  async listarItensImportacao(
    importacaoId: string,
    limite?: number,
    conciliado?: boolean,
  ): Promise<ItemImportacaoExtrato[]> {
    const params = new URLSearchParams();
    if (limite) params.append('limite', String(limite));
    if (typeof conciliado === 'boolean') params.append('conciliado', String(conciliado));
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/conciliacao-bancaria/importacoes/${importacaoId}/itens${query}`);
    const payload = unwrap<ItemImportacaoExtratoApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeItem) : [];
  },

  async importarExtrato(
    contaBancariaId: string,
    arquivo: File,
  ): Promise<ResultadoImportacaoExtrato> {
    const formData = new FormData();
    formData.append('contaBancariaId', contaBancariaId);
    formData.append('arquivo', arquivo);

    const response = await api.post('/conciliacao-bancaria/importacoes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = unwrap<ResultadoImportacaoExtratoApi>(response.data);
    return {
      ...payload,
      importacao: normalizeImportacao(payload.importacao),
      itensPreview: Array.isArray(payload.itensPreview)
        ? payload.itensPreview.map(normalizeItem)
        : [],
    };
  },

  async executarMatchingAutomatico(
    importacaoId: string,
    toleranciaDias = 3,
  ): Promise<ResultadoMatchingAutomaticoExtrato> {
    const response = await api.post(
      `/conciliacao-bancaria/importacoes/${importacaoId}/matching-automatico`,
      { toleranciaDias },
    );

    const payload = unwrap<ResultadoMatchingAutomaticoExtratoApi>(response.data);
    return {
      ...payload,
      itensConciliados: Array.isArray(payload.itensConciliados)
        ? payload.itensConciliados.map((item) => ({
            ...item,
            score: toNumber(item.score),
            criterios: Array.isArray(item.criterios) ? item.criterios : [],
          }))
        : [],
    };
  },

  async listarCandidatosConciliacao(
    itemId: string,
    limite = 10,
  ): Promise<ContaPagarCandidataConciliacao[]> {
    const response = await api.get(`/conciliacao-bancaria/itens/${itemId}/candidatos?limite=${limite}`);
    const payload = unwrap<ContaPagarCandidataConciliacaoApi[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeCandidato) : [];
  },

  async conciliarItem(
    itemId: string,
    contaPagarId: string,
    observacao?: string,
  ): Promise<ItemImportacaoExtrato> {
    const response = await api.post(`/conciliacao-bancaria/itens/${itemId}/conciliar`, {
      contaPagarId,
      observacao,
    });
    const payload = unwrap<ItemImportacaoExtratoApi>(response.data);
    return normalizeItem(payload);
  },

  async desconciliarItem(itemId: string, observacao?: string): Promise<ItemImportacaoExtrato> {
    const response = await api.post(`/conciliacao-bancaria/itens/${itemId}/desconciliar`, {
      observacao,
    });
    const payload = unwrap<ItemImportacaoExtratoApi>(response.data);
    return normalizeItem(payload);
  },
};

export default conciliacaoBancariaService;
