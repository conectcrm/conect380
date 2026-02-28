import api from '../api';
import alertasOperacionaisFinanceiroService from '../alertasOperacionaisFinanceiroService';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

describe('alertasOperacionaisFinanceiroService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar alertas com filtros e normalizar auditoria/payload', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'alt-1',
            tipo: 'conta_vencida',
            severidade: 'critical',
            status: 'ativo',
            titulo: 'Conta vencida',
            payload: null,
            auditoria: null,
            createdAt: '2026-02-27T10:00:00.000Z',
            updatedAt: '2026-02-27T10:00:00.000Z',
          },
        ],
      },
    });

    const resultado = await alertasOperacionaisFinanceiroService.listar({
      status: 'ativo',
      severidade: 'critical',
      limite: 20,
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/financeiro/alertas-operacionais?status=ativo&severidade=critical&limite=20',
    );
    expect(resultado).toEqual([
      expect.objectContaining({
        id: 'alt-1',
        payload: {},
        auditoria: [],
      }),
    ]);
  });

  it('deve reconhecer e resolver alerta operacional', async () => {
    apiMock.post
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'alt-2',
            tipo: 'conta_vence_em_3_dias',
            severidade: 'warning',
            status: 'acknowledged',
            titulo: 'Conta proxima do vencimento',
            payload: {},
            auditoria: [{ acao: 'ack' }],
            createdAt: '2026-02-27T10:00:00.000Z',
            updatedAt: '2026-02-27T10:01:00.000Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'alt-2',
            tipo: 'conta_vence_em_3_dias',
            severidade: 'warning',
            status: 'resolvido',
            titulo: 'Conta proxima do vencimento',
            payload: {},
            auditoria: [{ acao: 'resolver' }],
            createdAt: '2026-02-27T10:00:00.000Z',
            updatedAt: '2026-02-27T10:02:00.000Z',
          },
        },
      });

    const ack = await alertasOperacionaisFinanceiroService.ack('alt-2', {
      observacao: 'Recebido',
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      '/financeiro/alertas-operacionais/alt-2/ack',
      { observacao: 'Recebido' },
    );
    expect(ack.status).toBe('acknowledged');

    const resolvido = await alertasOperacionaisFinanceiroService.resolver('alt-2', {
      observacao: 'Resolvido',
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      '/financeiro/alertas-operacionais/alt-2/resolver',
      { observacao: 'Resolvido' },
    );
    expect(resolvido.status).toBe('resolvido');
  });

  it('deve solicitar recalculo dos alertas operacionais', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          gerados: 5,
          resolvidos: 2,
          ativos: 7,
        },
      },
    });

    const resultado = await alertasOperacionaisFinanceiroService.recalcular();

    expect(apiMock.post).toHaveBeenCalledWith('/financeiro/alertas-operacionais/recalcular');
    expect(resultado).toEqual({
      gerados: 5,
      resolvidos: 2,
      ativos: 7,
    });
  });

  it('deve reprocessar alerta operacional e normalizar payload/auditoria', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          sucesso: true,
          mensagem: 'Reprocessamento executado com sucesso',
          alerta: {
            id: 'alt-3',
            tipo: 'status_sincronizacao_divergente',
            severidade: 'critical',
            status: 'resolvido',
            titulo: 'Divergencia de status',
            payload: null,
            auditoria: null,
            createdAt: '2026-02-28T10:00:00.000Z',
            updatedAt: '2026-02-28T10:10:00.000Z',
          },
          detalhes: {
            faturaId: 123,
          },
        },
      },
    });

    const resultado = await alertasOperacionaisFinanceiroService.reprocessar('alt-3', {
      observacao: 'Retry manual',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/financeiro/alertas-operacionais/alt-3/reprocessar', {
      observacao: 'Retry manual',
    });
    expect(resultado.sucesso).toBe(true);
    expect(resultado.alerta.payload).toEqual({});
    expect(resultado.alerta.auditoria).toEqual([]);
    expect(resultado.detalhes).toEqual({ faturaId: 123 });
  });
});
