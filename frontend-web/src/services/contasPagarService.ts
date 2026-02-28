import api from './api';
import {
  AprovarLoteContasPagar,
  AprovarContaPagar,
  AtualizarContaPagar,
  ContaPagar,
  FiltrosExportacaoContasPagar,
  FiltrosHistoricoExportacaoContasPagar,
  FiltrosContasPagar,
  HistoricoExportacaoContaPagar,
  NovaContaPagar,
  RegistrarPagamento,
  ReprovarContaPagar,
  ResultadoAprovacaoLote,
  ResumoFinanceiro,
} from '../types/financeiro';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const buildQuery = (filtros?: FiltrosContasPagar): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();

  if (filtros.termo?.trim()) params.append('termo', filtros.termo.trim());
  if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
  if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
  if (filtros.fornecedorId) params.append('fornecedorId', filtros.fornecedorId);

  filtros.status?.forEach((item) => params.append('status', item));
  filtros.categoria?.forEach((item) => params.append('categoria', item));
  filtros.prioridade?.forEach((item) => params.append('prioridade', item));
  filtros.formaPagamento?.forEach((item) => params.append('formaPagamento', item));

  const query = params.toString();
  return query ? `?${query}` : '';
};

const buildExportQuery = (filtros?: FiltrosExportacaoContasPagar): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();

  if (filtros.formato) params.append('formato', filtros.formato);
  if (filtros.fornecedorId) params.append('fornecedorId', filtros.fornecedorId);
  if (filtros.contaBancariaId) params.append('contaBancariaId', filtros.contaBancariaId);
  if (filtros.centroCustoId) params.append('centroCustoId', filtros.centroCustoId);
  if (filtros.dataVencimentoInicio) params.append('dataVencimentoInicio', filtros.dataVencimentoInicio);
  if (filtros.dataVencimentoFim) params.append('dataVencimentoFim', filtros.dataVencimentoFim);
  if (filtros.dataEmissaoInicio) params.append('dataEmissaoInicio', filtros.dataEmissaoInicio);
  if (filtros.dataEmissaoFim) params.append('dataEmissaoFim', filtros.dataEmissaoFim);

  filtros.status?.forEach((item) => params.append('status', item));

  const query = params.toString();
  return query ? `?${query}` : '';
};

const buildHistoricoExportacaoQuery = (
  filtros?: FiltrosHistoricoExportacaoContasPagar,
): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.formato) params.append('formato', filtros.formato);
  if (filtros.status) params.append('status', filtros.status);
  if (typeof filtros.limite === 'number') params.append('limite', String(filtros.limite));

  const query = params.toString();
  return query ? `?${query}` : '';
};

const pruneUndefined = <T extends Record<string, unknown>>(payload: T): T => {
  const next = { ...payload } as Record<string, unknown>;
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) {
      delete next[key];
    }
  });
  return next as T;
};

const serializeContaPagarPayload = (
  dados: NovaContaPagar | Partial<AtualizarContaPagar>,
): Record<string, unknown> => {
  const {
    anexos,
    // `id` e `numeroParcelas` podem existir no tipo, mas o backend ignora/nao usa nesta fase
    id,
    ...rest
  } = dados as (NovaContaPagar & Partial<AtualizarContaPagar>);

  const anexosSerializados = Array.isArray(anexos)
    ? anexos.map((arquivo) => ({
        nome: arquivo.name,
        tipo: arquivo.type || 'application/octet-stream',
        tamanho: arquivo.size,
      }))
    : undefined;

  return pruneUndefined({
    ...rest,
    anexos: anexosSerializados && anexosSerializados.length > 0 ? anexosSerializados : undefined,
    tags: Array.isArray(rest.tags) ? rest.tags : undefined,
  });
};

const serializePagamentoPayload = (dados: Partial<RegistrarPagamento>): Record<string, unknown> => {
  const { contaId, comprovante, ...rest } = dados;
  return pruneUndefined({
    ...(rest as Record<string, unknown>),
    comprovantePagamento: comprovante?.name,
  });
};

export const contasPagarService = {
  async listar(filtros?: FiltrosContasPagar): Promise<ContaPagar[]> {
    const response = await api.get(`/contas-pagar${buildQuery(filtros)}`);
    return unwrap<ContaPagar[]>(response.data);
  },

  async obterResumo(filtros?: FiltrosContasPagar): Promise<ResumoFinanceiro> {
    const response = await api.get(`/contas-pagar/resumo${buildQuery(filtros)}`);
    return unwrap<ResumoFinanceiro>(response.data);
  },

  async buscarPorId(id: string): Promise<ContaPagar> {
    const response = await api.get(`/contas-pagar/${id}`);
    return unwrap<ContaPagar>(response.data);
  },

  async criar(dados: NovaContaPagar): Promise<ContaPagar> {
    const response = await api.post('/contas-pagar', serializeContaPagarPayload(dados));
    return unwrap<ContaPagar>(response.data);
  },

  async atualizar(id: string, dados: Partial<AtualizarContaPagar> | NovaContaPagar): Promise<ContaPagar> {
    const response = await api.put(`/contas-pagar/${id}`, serializeContaPagarPayload(dados));
    return unwrap<ContaPagar>(response.data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/contas-pagar/${id}`);
  },

  async registrarPagamento(id: string, dados: Partial<RegistrarPagamento>): Promise<ContaPagar> {
    const response = await api.post(`/contas-pagar/${id}/registrar-pagamento`, serializePagamentoPayload(dados));
    return unwrap<ContaPagar>(response.data);
  },

  async aprovar(id: string, dados?: AprovarContaPagar): Promise<ContaPagar> {
    const response = await api.post(`/contas-pagar/${id}/aprovar`, pruneUndefined({ ...dados }));
    return unwrap<ContaPagar>(response.data);
  },

  async listarPendenciasAprovacao(filtros?: FiltrosContasPagar): Promise<ContaPagar[]> {
    const response = await api.get(`/contas-pagar/aprovacoes/pendentes${buildQuery(filtros)}`);
    return unwrap<ContaPagar[]>(response.data);
  },

  async exportar(filtros?: FiltrosExportacaoContasPagar): Promise<Blob> {
    const response = await api.get(`/contas-pagar/exportacao${buildExportQuery(filtros)}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async listarHistoricoExportacoes(
    filtros?: FiltrosHistoricoExportacaoContasPagar,
  ): Promise<HistoricoExportacaoContaPagar[]> {
    const response = await api.get(
      `/contas-pagar/exportacao/historico${buildHistoricoExportacaoQuery(filtros)}`,
    );
    return unwrap<HistoricoExportacaoContaPagar[]>(response.data);
  },

  async aprovarLote(dados: AprovarLoteContasPagar): Promise<ResultadoAprovacaoLote> {
    const response = await api.post('/contas-pagar/aprovacoes/lote', pruneUndefined({ ...dados }));
    return unwrap<ResultadoAprovacaoLote>(response.data);
  },

  async reprovar(id: string, dados: ReprovarContaPagar): Promise<ContaPagar> {
    const response = await api.post(`/contas-pagar/${id}/reprovar`, pruneUndefined({ ...dados }));
    return unwrap<ContaPagar>(response.data);
  },
};

export default contasPagarService;
