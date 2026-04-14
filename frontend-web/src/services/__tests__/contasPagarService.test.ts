import contasPagarService from '../contasPagarService';
import api from '../api';
import {
  CategoriaContaPagar,
  FormaPagamento,
  PrioridadePagamento,
  StatusContaPagar,
} from '../../types/financeiro';

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

describe('contasPagarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar contas com querystring de filtros e payload encapsulado', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [{ id: 'cp-1' }],
      },
    });

    const result = await contasPagarService.listar({
      termo: ' licenca ',
      dataInicio: '2026-02-01',
      dataFim: '2026-02-28',
      fornecedorId: 'forn-1',
      status: [StatusContaPagar.PAGO],
      categoria: [CategoriaContaPagar.FORNECEDORES],
      prioridade: [PrioridadePagamento.ALTA],
      formaPagamento: [FormaPagamento.PIX],
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/contas-pagar?termo=licenca&dataInicio=2026-02-01&dataFim=2026-02-28&fornecedorId=forn-1&status=pago&categoria=fornecedores&prioridade=alta&formaPagamento=pix',
    );
    expect(result).toEqual([{ id: 'cp-1' }]);
  });

  it('deve serializar anexos e tags ao criar conta', async () => {
    const anexo = new File(['pdf'], 'boleto.pdf', { type: 'application/pdf' });
    apiMock.post.mockResolvedValue({
      data: {
        data: { id: 'cp-2' },
      },
    });

    await contasPagarService.criar({
      fornecedorId: 'forn-1',
      descricao: 'Pagamento de software',
      dataEmissao: '2026-02-10',
      dataVencimento: '2026-02-20',
      valorOriginal: 550,
      categoria: CategoriaContaPagar.TECNOLOGIA,
      tags: ['infra', 'recorrente'],
      anexos: [anexo],
    });

    expect(apiMock.post).toHaveBeenCalledWith(
      '/contas-pagar',
      expect.objectContaining({
        fornecedorId: 'forn-1',
        descricao: 'Pagamento de software',
        valorOriginal: 550,
        categoria: 'tecnologia',
        tags: ['infra', 'recorrente'],
        anexos: [
          {
            nome: 'boleto.pdf',
            tipo: 'application/pdf',
            tamanho: 3,
          },
        ],
      }),
    );
  });

  it('deve remover campos indefinidos ao atualizar conta', async () => {
    apiMock.put.mockResolvedValue({
      data: {
        data: { id: 'cp-3', descricao: 'Atualizada' },
      },
    });

    await contasPagarService.atualizar('cp-3', {
      descricao: 'Atualizada',
      anexos: [],
      tags: undefined,
    } as any);

    expect(apiMock.put).toHaveBeenCalledWith('/contas-pagar/cp-3', {
      descricao: 'Atualizada',
    });
  });

  it('deve mapear comprovante para comprovantePagamento no registro de pagamento', async () => {
    const comprovante = new File(['img'], 'comprovante.png', { type: 'image/png' });
    apiMock.post.mockResolvedValue({
      data: {
        data: { id: 'cp-4', status: 'pago' },
      },
    });

    const result = await contasPagarService.registrarPagamento('cp-4', {
      contaId: 'cp-4',
      valorPago: 120,
      tipoPagamento: FormaPagamento.PIX,
      comprovante,
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-pagar/cp-4/registrar-pagamento', {
      valorPago: 120,
      tipoPagamento: 'pix',
      comprovantePagamento: 'comprovante.png',
    });
    expect(result).toEqual({ id: 'cp-4', status: 'pago' });
  });

  it('deve excluir conta a pagar', async () => {
    apiMock.delete.mockResolvedValue({ data: {} });

    await contasPagarService.excluir('cp-5');

    expect(apiMock.delete).toHaveBeenCalledWith('/contas-pagar/cp-5');
  });

  it('deve aprovar conta a pagar com observacoes opcionais', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: { id: 'cp-6', necessitaAprovacao: true, aprovadoPor: 'user-1' },
      },
    });

    const result = await contasPagarService.aprovar('cp-6', {
      observacoes: 'Aprovacao financeira concluida',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-pagar/cp-6/aprovar', {
      observacoes: 'Aprovacao financeira concluida',
    });
    expect(result).toEqual({ id: 'cp-6', necessitaAprovacao: true, aprovadoPor: 'user-1' });
  });

  it('deve reprovar conta a pagar com justificativa obrigatoria', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: { id: 'cp-7', status: 'cancelado' },
      },
    });

    const result = await contasPagarService.reprovar('cp-7', {
      justificativa: 'Documento fiscal inconsistente',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-pagar/cp-7/reprovar', {
      justificativa: 'Documento fiscal inconsistente',
    });
    expect(result).toEqual({ id: 'cp-7', status: 'cancelado' });
  });

  it('deve listar pendencias de aprovacao financeira', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [{ id: 'cp-8', necessitaAprovacao: true }],
      },
    });

    const result = await contasPagarService.listarPendenciasAprovacao({
      termo: 'pendente',
      status: [StatusContaPagar.EM_ABERTO],
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/contas-pagar/aprovacoes/pendentes?termo=pendente&status=em_aberto',
    );
    expect(result).toEqual([{ id: 'cp-8', necessitaAprovacao: true }]);
  });

  it('deve solicitar exportacao com filtros e responseType blob', async () => {
    const blob = new Blob(['conteudo-csv'], { type: 'text/csv' });
    apiMock.get.mockResolvedValue({
      data: blob,
    });

    const resultado = await contasPagarService.exportar({
      formato: 'csv',
      fornecedorId: 'forn-1',
      contaBancariaId: 'conta-1',
      centroCustoId: 'cc-1',
      dataVencimentoInicio: '2026-02-01',
      dataVencimentoFim: '2026-02-28',
      dataEmissaoInicio: '2026-01-01',
      dataEmissaoFim: '2026-02-10',
      status: [StatusContaPagar.PAGO],
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/contas-pagar/exportacao?formato=csv&fornecedorId=forn-1&contaBancariaId=conta-1&centroCustoId=cc-1&dataVencimentoInicio=2026-02-01&dataVencimentoFim=2026-02-28&dataEmissaoInicio=2026-01-01&dataEmissaoFim=2026-02-10&status=pago',
      { responseType: 'blob' },
    );
    expect(resultado).toBe(blob);
  });

  it('deve listar historico de exportacoes com filtros', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'exp-1',
            formato: 'csv',
            status: 'sucesso',
            totalRegistros: 12,
          },
        ],
      },
    });

    const resultado = await contasPagarService.listarHistoricoExportacoes({
      formato: 'csv',
      status: 'sucesso',
      limite: 25,
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      '/contas-pagar/exportacao/historico?formato=csv&status=sucesso&limite=25',
    );
    expect(resultado).toEqual([
      {
        id: 'exp-1',
        formato: 'csv',
        status: 'sucesso',
        totalRegistros: 12,
      },
    ]);
  });

  it('deve processar aprovacao em lote', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        data: {
          total: 2,
          sucesso: 1,
          falha: 1,
          itens: [],
        },
      },
    });

    const result = await contasPagarService.aprovarLote({
      contaIds: ['cp-1', 'cp-2'],
      acao: 'aprovar',
      observacoes: 'Aprovacao em lote',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/contas-pagar/aprovacoes/lote', {
      contaIds: ['cp-1', 'cp-2'],
      acao: 'aprovar',
      observacoes: 'Aprovacao em lote',
    });
    expect(result).toEqual({
      total: 2,
      sucesso: 1,
      falha: 1,
      itens: [],
    });
  });
});
