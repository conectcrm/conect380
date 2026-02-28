import {
  AlertaOperacionalFinanceiro,
  ReprocessarAlertaOperacionalFinanceiroPayload,
  TipoAlertaOperacionalFinanceiro,
} from '../../types/financeiro';

export const REPROCESSAMENTO_CANCELADO = '__reprocessamento_cancelado__';

const toPositiveInt = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
};

const toOptionalString = (value: unknown): string | undefined => {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
};

const readPayloadString = (
  payload: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = toOptionalString(payload[key]);
    if (value) return value;
  }
  return undefined;
};

const tiposReprocessaveis = new Set<TipoAlertaOperacionalFinanceiro>([
  'status_sincronizacao_divergente',
  'referencia_integracao_invalida',
  'estorno_falha',
]);

export const isAlertaReprocessavel = (tipo: TipoAlertaOperacionalFinanceiro): boolean =>
  tiposReprocessaveis.has(tipo);

export const montarPayloadReprocessamento = (
  alerta: AlertaOperacionalFinanceiro,
  solicitarEntrada: (mensagem: string) => string | null = (mensagem) => window.prompt(mensagem),
): ReprocessarAlertaOperacionalFinanceiroPayload | null => {
  const payload = alerta.payload || {};
  const observacao = 'Reprocessado pelo painel financeiro';

  if (alerta.tipo === 'status_sincronizacao_divergente') {
    return { observacao };
  }

  if (alerta.tipo === 'estorno_falha') {
    let pagamentoId = toPositiveInt(payload.pagamentoId);
    if (!pagamentoId) {
      const input = solicitarEntrada('Informe o ID do pagamento para reprocessar o estorno:');
      if (input === null) return null;
      pagamentoId = toPositiveInt(input);
    }

    if (!pagamentoId) {
      throw new Error('Informe um pagamentoId numerico valido para reprocessar o estorno.');
    }

    return { observacao, pagamentoId };
  }

  if (alerta.tipo === 'referencia_integracao_invalida') {
    let gatewayTransacaoId = readPayloadString(payload, [
      'gatewayTransacaoId',
      'referenciaGateway',
      'transacaoId',
    ]);

    if (!gatewayTransacaoId) {
      const input = solicitarEntrada(
        'Informe o gatewayTransacaoId para reprocessar a referencia de integracao:',
      );
      if (input === null) return null;
      gatewayTransacaoId = toOptionalString(input);
    }

    if (!gatewayTransacaoId) {
      throw new Error(
        'gatewayTransacaoId obrigatorio para reprocessar alerta de referencia de integracao.',
      );
    }

    return {
      observacao,
      gatewayTransacaoId,
      novoStatus:
        readPayloadString(payload, ['novoStatus', 'statusMapeado', 'status']) || 'rejeitado',
      motivoRejeicao: readPayloadString(payload, ['motivoRejeicao', 'motivo']),
    };
  }

  throw new Error(`Tipo de alerta ${alerta.tipo} nao suporta reprocessamento manual.`);
};
