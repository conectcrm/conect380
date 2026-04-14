import api from './api';
import {
  AlertaOperacionalFinanceiro,
  AtualizarStatusAlertaOperacionalFinanceiro,
  FiltrosAlertasOperacionaisFinanceiro,
  ReprocessarAlertaOperacionalFinanceiroPayload,
  ResultadoRecalculoAlertasOperacionaisFinanceiro,
  ResultadoReprocessamentoAlertaOperacionalFinanceiro,
} from '../types/financeiro';

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const normalizeAlerta = (item: AlertaOperacionalFinanceiro): AlertaOperacionalFinanceiro => ({
  ...item,
  payload: toObject(item.payload),
  auditoria: Array.isArray(item.auditoria) ? item.auditoria : [],
});

const buildQuery = (filtros?: FiltrosAlertasOperacionaisFinanceiro): string => {
  if (!filtros) return '';

  const params = new URLSearchParams();
  if (filtros.status) params.append('status', filtros.status);
  if (filtros.severidade) params.append('severidade', filtros.severidade);
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  if (typeof filtros.limite === 'number') params.append('limite', String(filtros.limite));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const alertasOperacionaisFinanceiroService = {
  async listar(
    filtros?: FiltrosAlertasOperacionaisFinanceiro,
  ): Promise<AlertaOperacionalFinanceiro[]> {
    const response = await api.get(`/financeiro/alertas-operacionais${buildQuery(filtros)}`);
    const payload = unwrap<AlertaOperacionalFinanceiro[]>(response.data);
    return Array.isArray(payload) ? payload.map(normalizeAlerta) : [];
  },

  async ack(
    id: string,
    dados?: AtualizarStatusAlertaOperacionalFinanceiro,
  ): Promise<AlertaOperacionalFinanceiro> {
    const response = await api.post(`/financeiro/alertas-operacionais/${id}/ack`, {
      ...dados,
    });
    const payload = unwrap<AlertaOperacionalFinanceiro>(response.data);
    return normalizeAlerta(payload);
  },

  async resolver(
    id: string,
    dados?: AtualizarStatusAlertaOperacionalFinanceiro,
  ): Promise<AlertaOperacionalFinanceiro> {
    const response = await api.post(`/financeiro/alertas-operacionais/${id}/resolver`, {
      ...dados,
    });
    const payload = unwrap<AlertaOperacionalFinanceiro>(response.data);
    return normalizeAlerta(payload);
  },

  async reprocessar(
    id: string,
    dados?: ReprocessarAlertaOperacionalFinanceiroPayload,
  ): Promise<ResultadoReprocessamentoAlertaOperacionalFinanceiro> {
    const response = await api.post(`/financeiro/alertas-operacionais/${id}/reprocessar`, {
      ...dados,
    });
    const payload = unwrap<ResultadoReprocessamentoAlertaOperacionalFinanceiro>(response.data);

    return {
      ...payload,
      alerta: normalizeAlerta(payload.alerta),
    };
  },

  async recalcular(): Promise<ResultadoRecalculoAlertasOperacionaisFinanceiro> {
    const response = await api.post('/financeiro/alertas-operacionais/recalcular');
    return unwrap<ResultadoRecalculoAlertasOperacionaisFinanceiro>(response.data);
  },
};

export default alertasOperacionaisFinanceiroService;
