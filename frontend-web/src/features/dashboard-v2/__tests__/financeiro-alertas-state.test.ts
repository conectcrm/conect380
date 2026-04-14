import {
  aplicarAtualizacaoAlertaOperacional,
  contarAlertasOperacionais,
  priorizarAlertasOperacionais,
} from '../financeiro-alertas-state';
import { AlertaOperacionalFinanceiro } from '../../../types/financeiro';

const makeAlerta = (
  overrides: Partial<AlertaOperacionalFinanceiro> = {},
): AlertaOperacionalFinanceiro => ({
  id: 'alt-1',
  tipo: 'conta_vencida',
  severidade: 'warning',
  status: 'ativo',
  titulo: 'Conta vencida',
  descricao: 'Conta CP-001 esta vencida',
  referencia: 'conta:cp-1:vencida',
  payload: {},
  auditoria: [],
  createdAt: '2026-02-27T10:00:00.000Z',
  updatedAt: '2026-02-27T10:00:00.000Z',
  ...overrides,
});

describe('financeiro-alertas-state', () => {
  it('deve priorizar alertas por severidade e data removendo resolvidos', () => {
    const alertas = [
      makeAlerta({
        id: 'alt-critical-antigo',
        severidade: 'critical',
        createdAt: '2026-02-26T10:00:00.000Z',
      }),
      makeAlerta({
        id: 'alt-warning-novo',
        severidade: 'warning',
        createdAt: '2026-02-28T10:00:00.000Z',
      }),
      makeAlerta({
        id: 'alt-critical-novo',
        severidade: 'critical',
        createdAt: '2026-02-28T09:00:00.000Z',
      }),
      makeAlerta({
        id: 'alt-info-resolvido',
        severidade: 'info',
        status: 'resolvido',
      }),
    ];

    const resultado = priorizarAlertasOperacionais(alertas);

    expect(resultado.map((item) => item.id)).toEqual([
      'alt-critical-novo',
      'alt-critical-antigo',
      'alt-warning-novo',
    ]);
  });

  it('deve contar alertas ativos por severidade', () => {
    const alertasPriorizados = [
      makeAlerta({ id: '1', severidade: 'critical' }),
      makeAlerta({ id: '2', severidade: 'critical' }),
      makeAlerta({ id: '3', severidade: 'warning' }),
      makeAlerta({ id: '4', severidade: 'info' }),
    ];

    expect(contarAlertasOperacionais(alertasPriorizados)).toEqual({
      total: 4,
      critical: 2,
      warning: 1,
      info: 1,
    });
  });

  it('deve aplicar atualizacao de alerta sem recarregar lista inteira', () => {
    const origem = [
      makeAlerta({ id: 'alt-1', status: 'ativo' }),
      makeAlerta({ id: 'alt-2', status: 'ativo' }),
    ];
    const atualizado = makeAlerta({
      id: 'alt-1',
      status: 'acknowledged',
      acknowledgedPor: 'user-10',
      acknowledgedEm: '2026-02-28T14:00:00.000Z',
    });

    const resultado = aplicarAtualizacaoAlertaOperacional(origem, atualizado);

    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual(
      expect.objectContaining({
        id: 'alt-1',
        status: 'acknowledged',
        acknowledgedPor: 'user-10',
      }),
    );
    expect(resultado[1]).toEqual(expect.objectContaining({ id: 'alt-2', status: 'ativo' }));
  });
});
