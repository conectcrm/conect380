import {
  isAlertaReprocessavel,
  montarPayloadReprocessamento,
} from '../financeiro-alertas-reprocessamento';
import { AlertaOperacionalFinanceiro } from '../../../types/financeiro';

const makeAlerta = (
  overrides: Partial<AlertaOperacionalFinanceiro> = {},
): AlertaOperacionalFinanceiro => ({
  id: 'alt-1',
  tipo: 'status_sincronizacao_divergente',
  severidade: 'critical',
  status: 'ativo',
  titulo: 'Divergencia detectada',
  payload: {},
  auditoria: [],
  createdAt: '2026-02-28T12:00:00.000Z',
  updatedAt: '2026-02-28T12:00:00.000Z',
  ...overrides,
});

describe('financeiro-alertas-reprocessamento', () => {
  it('deve identificar tipos reprocessaveis', () => {
    expect(isAlertaReprocessavel('status_sincronizacao_divergente')).toBe(true);
    expect(isAlertaReprocessavel('estorno_falha')).toBe(true);
    expect(isAlertaReprocessavel('referencia_integracao_invalida')).toBe(true);
    expect(isAlertaReprocessavel('conta_vencida')).toBe(false);
  });

  it('deve montar payload para sincronizacao divergente sem solicitar input', () => {
    const solicitarEntrada = jest.fn();
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'status_sincronizacao_divergente',
      }),
      solicitarEntrada,
    );

    expect(payload).toEqual({
      observacao: 'Reprocessado pelo painel financeiro',
    });
    expect(solicitarEntrada).not.toHaveBeenCalled();
  });

  it('deve usar pagamentoId do payload no estorno falho', () => {
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'estorno_falha',
        payload: {
          pagamentoId: 88,
        },
      }),
    );

    expect(payload).toEqual({
      observacao: 'Reprocessado pelo painel financeiro',
      pagamentoId: 88,
    });
  });

  it('deve solicitar pagamentoId quando nao vier no payload', () => {
    const solicitarEntrada = jest.fn().mockReturnValue('42');
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'estorno_falha',
        payload: {},
      }),
      solicitarEntrada,
    );

    expect(solicitarEntrada).toHaveBeenCalled();
    expect(payload).toEqual({
      observacao: 'Reprocessado pelo painel financeiro',
      pagamentoId: 42,
    });
  });

  it('deve retornar null quando usuario cancelar o prompt de estorno', () => {
    const solicitarEntrada = jest.fn().mockReturnValue(null);
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'estorno_falha',
        payload: {},
      }),
      solicitarEntrada,
    );

    expect(payload).toBeNull();
  });

  it('deve falhar em estorno quando pagamentoId for invalido', () => {
    const solicitarEntrada = jest.fn().mockReturnValue('abc');
    expect(() =>
      montarPayloadReprocessamento(
        makeAlerta({
          tipo: 'estorno_falha',
          payload: {},
        }),
        solicitarEntrada,
      ),
    ).toThrow('pagamentoId numerico valido');
  });

  it('deve usar referencia do payload para integracao invalida', () => {
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'referencia_integracao_invalida',
        payload: {
          gatewayTransacaoId: 'gw-123',
          statusMapeado: 'approved',
          motivoRejeicao: 'x',
        },
      }),
    );

    expect(payload).toEqual({
      observacao: 'Reprocessado pelo painel financeiro',
      gatewayTransacaoId: 'gw-123',
      novoStatus: 'approved',
      motivoRejeicao: 'x',
    });
  });

  it('deve solicitar gatewayTransacaoId quando nao vier no payload', () => {
    const solicitarEntrada = jest.fn().mockReturnValue(' gw-999 ');
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'referencia_integracao_invalida',
        payload: {},
      }),
      solicitarEntrada,
    );

    expect(solicitarEntrada).toHaveBeenCalled();
    expect(payload).toEqual({
      observacao: 'Reprocessado pelo painel financeiro',
      gatewayTransacaoId: 'gw-999',
      novoStatus: 'rejeitado',
      motivoRejeicao: undefined,
    });
  });

  it('deve retornar null quando usuario cancelar prompt de integracao', () => {
    const solicitarEntrada = jest.fn().mockReturnValue(null);
    const payload = montarPayloadReprocessamento(
      makeAlerta({
        tipo: 'referencia_integracao_invalida',
        payload: {},
      }),
      solicitarEntrada,
    );

    expect(payload).toBeNull();
  });

  it('deve falhar para tipo sem suporte a reprocessamento', () => {
    expect(() =>
      montarPayloadReprocessamento(
        makeAlerta({
          tipo: 'conta_vencida',
        }),
      ),
    ).toThrow('nao suporta reprocessamento manual');
  });
});
