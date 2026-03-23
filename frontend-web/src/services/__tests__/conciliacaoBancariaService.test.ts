import api from '../api';
import conciliacaoBancariaService from '../conciliacaoBancariaService';

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

describe('conciliacaoBancariaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar importacoes com filtros e normalizar totais numericos', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'imp-1',
            contaBancariaId: 'cb-1',
            nomeArquivo: 'extrato.csv',
            tipoArquivo: 'csv',
            totalLancamentos: 10,
            totalEntradas: '1200.50',
            totalSaidas: '450.35',
            createdAt: '2026-02-27T10:00:00.000Z',
          },
        ],
      },
    });

    const resultado = await conciliacaoBancariaService.listarImportacoes({
      contaBancariaId: 'cb-1',
      limite: 15,
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/conciliacao-bancaria/importacoes?contaBancariaId=cb-1&limite=15',
    );
    expect(resultado[0].totalEntradas).toBe(1200.5);
    expect(resultado[0].totalSaidas).toBe(450.35);
  });

  it('deve enviar multipart/form-data ao importar extrato', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          importacao: {
            id: 'imp-2',
            contaBancariaId: 'cb-1',
            nomeArquivo: 'extrato.ofx',
            tipoArquivo: 'ofx',
            totalLancamentos: 2,
            totalEntradas: '150.55',
            totalSaidas: '45.10',
            createdAt: '2026-02-27T11:00:00.000Z',
          },
          resumo: {
            totalLancamentos: 2,
            totalEntradas: 150.55,
            totalSaidas: 45.1,
          },
          erros: [],
          itensPreview: [
            {
              id: 'item-1',
              importacaoId: 'imp-2',
              dataLancamento: '2026-02-02',
              descricao: 'Tarifa',
              tipo: 'debito',
              valor: '45.10',
              conciliado: false,
              createdAt: '2026-02-27T11:00:00.000Z',
            },
          ],
        },
      },
    });

    const arquivo = new File(['conteudo-ofx'], 'extrato.ofx', { type: 'application/x-ofx' });
    const resultado = await conciliacaoBancariaService.importarExtrato('cb-1', arquivo);

    expect(apiMock.post).toHaveBeenCalledWith(
      '/conciliacao-bancaria/importacoes',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const formData = apiMock.post.mock.calls[0][1] as FormData;
    expect(formData.get('contaBancariaId')).toBe('cb-1');
    expect(formData.get('arquivo')).toBe(arquivo);
    expect(resultado.importacao.totalEntradas).toBe(150.55);
    expect(resultado.itensPreview[0].valor).toBe(45.1);
  });

  it('deve listar itens de uma importacao respeitando limite e filtro de conciliado', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'item-2',
            importacaoId: 'imp-3',
            dataLancamento: '2026-02-03',
            descricao: 'Pagamento fornecedor',
            tipo: 'debito',
            valor: '99.99',
            conciliado: false,
            createdAt: '2026-02-27T12:00:00.000Z',
          },
        ],
      },
    });

    const resultado = await conciliacaoBancariaService.listarItensImportacao('imp-3', 50, false);

    expect(apiMock.get).toHaveBeenCalledWith(
      '/conciliacao-bancaria/importacoes/imp-3/itens?limite=50&conciliado=false',
    );
    expect(resultado[0].valor).toBe(99.99);
    expect(resultado[0].auditoriaConciliacao).toEqual([]);
  });

  it('deve executar matching automatico e normalizar score', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          importacaoId: 'imp-4',
          totalItensAnalisados: 3,
          totalConciliados: 2,
          totalPendentes: 1,
          itensConciliados: [
            {
              itemId: 'item-4',
              contaPagarId: 'cp-4',
              score: '98.5',
              criterios: ['valor_exato', 'mesma_data'],
            },
          ],
        },
      },
    });

    const resultado = await conciliacaoBancariaService.executarMatchingAutomatico('imp-4', 5);

    expect(apiMock.post).toHaveBeenCalledWith(
      '/conciliacao-bancaria/importacoes/imp-4/matching-automatico',
      { toleranciaDias: 5 },
    );
    expect(resultado.itensConciliados[0].score).toBe(98.5);
  });

  it('deve listar candidatos de conciliacao com campos numericos normalizados', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'cp-50',
            numero: 'CP-202602-0050',
            descricao: 'Pagamento mensal',
            valorTotal: '450.00',
            valorPago: '450.00',
            score: '87.25',
            criterios: ['valor_exato'],
          },
        ],
      },
    });

    const resultado = await conciliacaoBancariaService.listarCandidatosConciliacao('item-50', 12);

    expect(apiMock.get).toHaveBeenCalledWith('/conciliacao-bancaria/itens/item-50/candidatos?limite=12');
    expect(resultado[0].valorTotal).toBe(450);
    expect(resultado[0].score).toBe(87.25);
  });

  it('deve conciliar e desconciliar item manualmente', async () => {
    apiMock.post
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'item-88',
            importacaoId: 'imp-88',
            dataLancamento: '2026-02-27',
            descricao: 'Pagamento fornecedor',
            tipo: 'debito',
            valor: '120.00',
            conciliado: true,
            contaPagarId: 'cp-88',
            auditoriaConciliacao: [{ acao: 'conciliacao_manual' }],
            createdAt: '2026-02-27T12:00:00.000Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'item-88',
            importacaoId: 'imp-88',
            dataLancamento: '2026-02-27',
            descricao: 'Pagamento fornecedor',
            tipo: 'debito',
            valor: '120.00',
            conciliado: false,
            auditoriaConciliacao: [{ acao: 'desconciliacao_manual' }],
            createdAt: '2026-02-27T12:00:00.000Z',
          },
        },
      });

    const conciliado = await conciliacaoBancariaService.conciliarItem('item-88', 'cp-88', 'Ajuste');

    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      '/conciliacao-bancaria/itens/item-88/conciliar',
      { contaPagarId: 'cp-88', observacao: 'Ajuste' },
    );
    expect(conciliado.conciliado).toBe(true);
    expect(conciliado.valor).toBe(120);

    const desconciliado = await conciliacaoBancariaService.desconciliarItem('item-88', 'Revisao');

    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      '/conciliacao-bancaria/itens/item-88/desconciliar',
      { observacao: 'Revisao' },
    );
    expect(desconciliado.conciliado).toBe(false);
  });
});
