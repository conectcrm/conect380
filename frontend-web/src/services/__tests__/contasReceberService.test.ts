import contasReceberService from '../contasReceberService';
import api from '../api';

describe('contasReceberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar contas a receber com querystring de filtros', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          data: [{ id: 1, numero: 'FAT-001' }],
          total: 1,
          page: 1,
          pageSize: 20,
        },
      },
    });

    const result = await contasReceberService.listar({
      busca: ' mensalidade ',
      clienteId: 'cliente-1',
      dataVencimentoInicio: '2026-04-01',
      dataVencimentoFim: '2026-04-30',
      valorMin: 100,
      valorMax: 5000,
      status: ['pendente', 'vencida'],
      page: 2,
      pageSize: 10,
      sortBy: 'valorEmAberto',
      sortOrder: 'DESC',
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/contas-receber?busca=mensalidade&clienteId=cliente-1&dataVencimentoInicio=2026-04-01&dataVencimentoFim=2026-04-30&valorMin=100&valorMax=5000&page=2&pageSize=10&sortBy=valorEmAberto&sortOrder=DESC&status=pendente&status=vencida',
    );

    expect(result).toEqual({
      data: [{ id: 1, numero: 'FAT-001' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('deve obter resumo de contas a receber', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          totalTitulos: 12,
          valorTotal: 15000,
          valorRecebido: 6000,
          valorEmAberto: 9000,
          valorVencido: 1800,
          quantidadePendentes: 5,
          quantidadeParciais: 2,
          quantidadeRecebidas: 4,
          quantidadeVencidas: 1,
          quantidadeCanceladas: 0,
          aging: {
            aVencer: 6000,
            vencido1a30: 1200,
            vencido31a60: 500,
            vencido61mais: 1300,
          },
        },
      },
    });

    const result = await contasReceberService.obterResumo({ status: ['pendente'] });

    expect(apiMock.get).toHaveBeenCalledWith('/contas-receber/resumo?status=pendente');
    expect(result.valorEmAberto).toBe(9000);
    expect(result.aging.vencido61mais).toBe(1300);
  });

  it('deve aceitar payload sem encapsulamento', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      },
    });

    const result = await contasReceberService.listar();

    expect(apiMock.get).toHaveBeenCalledWith('/contas-receber');
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('deve buscar por id via fallback de busca e retornar null quando nao encontrar', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 1,
        },
      },
    });

    const result = await contasReceberService.buscarPorId('123');

    expect(apiMock.get).toHaveBeenCalledWith('/contas-receber?busca=123&page=1&pageSize=1');
    expect(result).toBeNull();
  });

  it('deve registrar recebimento manual em conta a receber', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          correlationId: 'corr-1',
          origemId: 'origem-1',
          pagamento: { id: 1, status: 'aprovado', valor: 150 },
          contaReceber: { id: 10, valorEmAberto: 350 },
        },
      },
    });

    const result = await contasReceberService.registrarRecebimento(10, {
      valor: 150,
      metodoPagamento: 'pix',
      observacoes: 'teste',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-receber/10/registrar-recebimento', {
      valor: 150,
      metodoPagamento: 'pix',
      observacoes: 'teste',
    });
    expect(result.pagamento.valor).toBe(150);
    expect(result.contaReceber.id).toBe(10);
  });

  it('deve reenviar cobranca de conta a receber', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          correlationId: 'corr-2',
          origemId: 'origem-2',
          enviado: true,
          simulado: false,
          contaReceber: { id: 99 },
        },
      },
    });

    const result = await contasReceberService.reenviarCobranca(99, {
      email: 'cliente@teste.com',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-receber/99/reenviar-cobranca', {
      email: 'cliente@teste.com',
    });
    expect(result.enviado).toBe(true);
    expect(result.contaReceber.id).toBe(99);
  });
});

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
