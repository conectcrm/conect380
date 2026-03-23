import { AlertaOperacionalFinanceiro } from '../../types/financeiro';

export type ContadoresAlertasOperacionais = {
  total: number;
  critical: number;
  warning: number;
  info: number;
};

const severidadePeso: Record<AlertaOperacionalFinanceiro['severidade'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export const priorizarAlertasOperacionais = (
  alertas: AlertaOperacionalFinanceiro[],
): AlertaOperacionalFinanceiro[] =>
  [...alertas]
    .filter((item) => item.status !== 'resolvido')
    .sort((a, b) => {
      const pesoA = severidadePeso[a.severidade];
      const pesoB = severidadePeso[b.severidade];
      if (pesoA !== pesoB) return pesoA - pesoB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

export const contarAlertasOperacionais = (
  alertasPriorizados: AlertaOperacionalFinanceiro[],
): ContadoresAlertasOperacionais =>
  alertasPriorizados.reduce(
    (acc, alerta) => {
      acc.total += 1;
      acc[alerta.severidade] += 1;
      return acc;
    },
    { total: 0, critical: 0, warning: 0, info: 0 },
  );

export const aplicarAtualizacaoAlertaOperacional = (
  alertas: AlertaOperacionalFinanceiro[],
  alertaAtualizado: AlertaOperacionalFinanceiro,
): AlertaOperacionalFinanceiro[] =>
  alertas.map((item) => (item.id === alertaAtualizado.id ? alertaAtualizado : item));
