import tesourariaService from '../tesourariaService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe('tesourariaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve obter posicao de tesouraria com filtros', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          referenciaEm: '2026-04-07',
          janelaDias: 30,
          totalContas: 2,
          saldoAtualConsolidado: 1500,
          entradasPrevistasConsolidadas: 300,
          saidasProgramadasConsolidadas: 200,
          saldoProjetadoConsolidado: 1600,
          itens: [],
        },
      },
    });

    const result = await tesourariaService.obterPosicao({
      incluirInativas: false,
      janelaDias: 30,
    });

    expect(apiMock.get).toHaveBeenCalledWith('/tesouraria/posicao?incluirInativas=false&janelaDias=30');
    expect(result.saldoProjetadoConsolidado).toBe(1600);
  });

  it('deve listar movimentacoes de tesouraria com filtros', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          data: [
            {
              id: 'mov-1',
              status: 'pendente',
              valor: 200,
              contaOrigemId: 'conta-1',
              contaOrigemNome: 'Operacional',
              contaDestinoId: 'conta-2',
              contaDestinoNome: 'Reserva',
              correlationId: 'corr-1',
              auditoria: null,
              createdAt: '2026-04-07T10:00:00.000Z',
              updatedAt: '2026-04-07T10:00:00.000Z',
            },
          ],
          total: 1,
          limite: 20,
        },
      },
    });

    const result = await tesourariaService.listarMovimentacoes({
      status: 'pendente',
      limite: 20,
    });

    expect(apiMock.get).toHaveBeenCalledWith('/tesouraria/transferencias?status=pendente&limite=20');
    expect(result.total).toBe(1);
    expect(result.data[0].auditoria).toEqual([]);
  });

  it('deve criar transferencia interna', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          movimentacao: {
            id: 'mov-2',
            status: 'pendente',
            valor: 300,
            contaOrigemId: 'conta-1',
            contaOrigemNome: 'Operacional',
            contaDestinoId: 'conta-2',
            contaDestinoNome: 'Reserva',
            correlationId: 'corr-2',
            auditoria: [],
            createdAt: '2026-04-07T11:00:00.000Z',
            updatedAt: '2026-04-07T11:00:00.000Z',
          },
        },
      },
    });

    const result = await tesourariaService.criarTransferencia({
      contaOrigemId: 'conta-1',
      contaDestinoId: 'conta-2',
      valor: 300,
      descricao: 'Aporte interno',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/tesouraria/transferencias', {
      contaOrigemId: 'conta-1',
      contaDestinoId: 'conta-2',
      valor: 300,
      descricao: 'Aporte interno',
    });
    expect(result.movimentacao.status).toBe('pendente');
  });

  it('deve aprovar transferencia interna', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          movimentacao: {
            id: 'mov-3',
            status: 'aprovada',
            valor: 300,
            contaOrigemId: 'conta-1',
            contaOrigemNome: 'Operacional',
            contaDestinoId: 'conta-2',
            contaDestinoNome: 'Reserva',
            correlationId: 'corr-3',
            auditoria: [],
            createdAt: '2026-04-07T11:00:00.000Z',
            updatedAt: '2026-04-07T11:05:00.000Z',
          },
          saldoContaOrigem: 700,
          saldoContaDestino: 1300,
        },
      },
    });

    const result = await tesourariaService.aprovarTransferencia('mov-3', {
      observacao: 'Aprovacao gestor',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/tesouraria/transferencias/mov-3/aprovar', {
      observacao: 'Aprovacao gestor',
    });
    expect(result.movimentacao.status).toBe('aprovada');
    expect(result.saldoContaOrigem).toBe(700);
  });

  it('deve cancelar transferencia pendente', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          movimentacao: {
            id: 'mov-4',
            status: 'cancelada',
            valor: 100,
            contaOrigemId: 'conta-1',
            contaOrigemNome: 'Operacional',
            contaDestinoId: 'conta-2',
            contaDestinoNome: 'Reserva',
            correlationId: 'corr-4',
            auditoria: [],
            createdAt: '2026-04-07T12:00:00.000Z',
            updatedAt: '2026-04-07T12:05:00.000Z',
          },
        },
      },
    });

    const result = await tesourariaService.cancelarTransferencia('mov-4', {
      observacao: 'Cancelamento manual',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/tesouraria/transferencias/mov-4/cancelar', {
      observacao: 'Cancelamento manual',
    });
    expect(result.movimentacao.status).toBe('cancelada');
  });
});
