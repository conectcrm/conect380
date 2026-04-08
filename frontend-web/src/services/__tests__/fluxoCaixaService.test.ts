import fluxoCaixaService from '../fluxoCaixaService';
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

describe('fluxoCaixaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve obter resumo de fluxo de caixa com filtros', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          periodoInicio: '2026-04-01',
          periodoFim: '2026-04-30',
          agrupamento: 'dia',
          totais: {
            entradasRealizadas: 1000,
            saidasRealizadas: 500,
            entradasPrevistas: 400,
            saidasPrevistas: 300,
            saldoLiquidoRealizado: 500,
            saldoLiquidoPrevisto: 600,
          },
          serie: [],
        },
      },
    });

    const result = await fluxoCaixaService.obterResumo({
      dataInicio: '2026-04-01',
      dataFim: '2026-04-30',
      agrupamento: 'dia',
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/financeiro/fluxo-caixa/resumo?dataInicio=2026-04-01&dataFim=2026-04-30&agrupamento=dia',
    );
    expect(result.totais.saldoLiquidoPrevisto).toBe(600);
  });

  it('deve obter projecao de fluxo de caixa com janela', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: {
          baseEm: '2026-04-07',
          ate: '2026-04-13',
          dias: 7,
          totalEntradasPrevistas: 500,
          totalSaidasPrevistas: 200,
          saldoProjetado: 300,
          itens: [
            {
              data: '2026-04-07',
              entradasPrevistas: 0,
              saidasPrevistas: 0,
              saldoProjetadoAcumulado: 0,
            },
          ],
        },
      },
    });

    const result = await fluxoCaixaService.obterProjecao({ janelaDias: 7 });

    expect(apiMock.get).toHaveBeenCalledWith('/financeiro/fluxo-caixa/projecao?janelaDias=7');
    expect(result.saldoProjetado).toBe(300);
    expect(result.itens).toHaveLength(1);
  });
});
