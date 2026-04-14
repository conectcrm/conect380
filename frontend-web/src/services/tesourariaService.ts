import api from './api';
import {
  AprovarTransferenciaTesourariaPayload,
  CancelarTransferenciaTesourariaPayload,
  CriarTransferenciaTesourariaPayload,
  FiltrosMovimentacoesTesouraria,
  FiltrosTesouraria,
  ListaMovimentacoesTesouraria,
  MovimentacaoTesouraria,
  PosicaoTesouraria,
  ResultadoAprovacaoTransferenciaTesouraria,
  ResultadoCancelamentoTransferenciaTesouraria,
  ResultadoCriacaoTransferenciaTesouraria,
} from '../types/financeiro';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const normalizeMovimentacao = (item: MovimentacaoTesouraria): MovimentacaoTesouraria => ({
  ...item,
  auditoria: Array.isArray(item.auditoria) ? item.auditoria : [],
});

const normalizeResultadoCriacao = (
  result: ResultadoCriacaoTransferenciaTesouraria,
): ResultadoCriacaoTransferenciaTesouraria => ({
  ...result,
  movimentacao: normalizeMovimentacao(result.movimentacao),
});

const normalizeResultadoAprovacao = (
  result: ResultadoAprovacaoTransferenciaTesouraria,
): ResultadoAprovacaoTransferenciaTesouraria => ({
  ...result,
  movimentacao: normalizeMovimentacao(result.movimentacao),
});

const normalizeResultadoCancelamento = (
  result: ResultadoCancelamentoTransferenciaTesouraria,
): ResultadoCancelamentoTransferenciaTesouraria => ({
  ...result,
  movimentacao: normalizeMovimentacao(result.movimentacao),
});

const buildPosicaoQuery = (filtros?: FiltrosTesouraria): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();

  if (typeof filtros.incluirInativas === 'boolean') {
    params.append('incluirInativas', String(filtros.incluirInativas));
  }
  if (typeof filtros.janelaDias === 'number' && Number.isFinite(filtros.janelaDias)) {
    params.append('janelaDias', String(filtros.janelaDias));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

const buildMovimentacoesQuery = (filtros?: FiltrosMovimentacoesTesouraria): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.status) params.append('status', filtros.status);
  if (typeof filtros.limite === 'number' && Number.isFinite(filtros.limite)) {
    params.append('limite', String(filtros.limite));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const tesourariaService = {
  async obterPosicao(filtros?: FiltrosTesouraria): Promise<PosicaoTesouraria> {
    const response = await api.get(`/tesouraria/posicao${buildPosicaoQuery(filtros)}`);
    return unwrap<PosicaoTesouraria>(response.data);
  },

  async listarMovimentacoes(filtros?: FiltrosMovimentacoesTesouraria): Promise<ListaMovimentacoesTesouraria> {
    const response = await api.get(`/tesouraria/transferencias${buildMovimentacoesQuery(filtros)}`);
    const payload = unwrap<ListaMovimentacoesTesouraria>(response.data);
    const data = Array.isArray(payload?.data) ? payload.data.map(normalizeMovimentacao) : [];
    return {
      ...toObject(payload),
      data,
      total: Number((payload as any)?.total || 0),
      limite: Number((payload as any)?.limite || 20),
    } as ListaMovimentacoesTesouraria;
  },

  async criarTransferencia(
    payload: CriarTransferenciaTesourariaPayload,
  ): Promise<ResultadoCriacaoTransferenciaTesouraria> {
    const response = await api.post('/tesouraria/transferencias', payload);
    const data = unwrap<ResultadoCriacaoTransferenciaTesouraria>(response.data);
    return normalizeResultadoCriacao(data);
  },

  async aprovarTransferencia(
    id: string,
    payload?: AprovarTransferenciaTesourariaPayload,
  ): Promise<ResultadoAprovacaoTransferenciaTesouraria> {
    const response = await api.post(`/tesouraria/transferencias/${id}/aprovar`, {
      ...payload,
    });
    const data = unwrap<ResultadoAprovacaoTransferenciaTesouraria>(response.data);
    return normalizeResultadoAprovacao(data);
  },

  async cancelarTransferencia(
    id: string,
    payload?: CancelarTransferenciaTesourariaPayload,
  ): Promise<ResultadoCancelamentoTransferenciaTesouraria> {
    const response = await api.post(`/tesouraria/transferencias/${id}/cancelar`, {
      ...payload,
    });
    const data = unwrap<ResultadoCancelamentoTransferenciaTesouraria>(response.data);
    return normalizeResultadoCancelamento(data);
  },
};

export default tesourariaService;
