import { FaturamentoController } from './faturamento.controller';

describe('FaturamentoController', () => {
  const faturamentoServiceMock = {
    buscarFaturasPaginadas: jest.fn(),
    verificarFaturasVencidas: jest.fn(),
    gerarPdfFatura: jest.fn(),
    obterProntidaoCobranca: jest.fn(),
  };
  const pagamentoServiceMock = {
    registrarPagamentoManual: jest.fn(),
  };
  const cobrancaServiceMock = {};

  let controller: FaturamentoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FaturamentoController(
      faturamentoServiceMock as any,
      pagamentoServiceMock as any,
      cobrancaServiceMock as any,
    );
  });

  it('sanitiza sortBy e sortOrder antes de chamar o service', async () => {
    faturamentoServiceMock.buscarFaturasPaginadas.mockResolvedValue({
      faturas: [],
      total: 0,
      resumo: { valorTotal: 0, valorRecebido: 0, valorEmAberto: 0 },
    });

    await controller.buscarFaturas(
      'empresa-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '1',
      '10',
      'createdAt; DROP TABLE faturas;--' as any,
      'DESC;--' as any,
    );

    expect(faturamentoServiceMock.buscarFaturasPaginadas).toHaveBeenCalledWith(
      'empresa-1',
      1,
      10,
      'createdAt',
      'DESC',
      expect.any(Object),
    );
  });

  it('usa vencimento como periodo padrao e normaliza datas de filtro', async () => {
    faturamentoServiceMock.buscarFaturasPaginadas.mockResolvedValue({
      faturas: [],
      total: 0,
      resumo: { valorTotal: 0, valorRecebido: 0, valorEmAberto: 0 },
    });

    await controller.buscarFaturas(
      'empresa-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '2026-04-01T12:30:00.000Z',
      '2026-04-30',
      undefined,
      undefined,
      '1',
      '10',
      'dataVencimento',
      'ASC',
    );

    expect(faturamentoServiceMock.buscarFaturasPaginadas).toHaveBeenCalledWith(
      'empresa-1',
      1,
      10,
      'dataVencimento',
      'ASC',
      expect.objectContaining({
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
        periodoCampo: 'vencimento',
      }),
    );
  });

  it('propaga filtro de origem ao buscar faturas', async () => {
    faturamentoServiceMock.buscarFaturasPaginadas.mockResolvedValue({
      faturas: [],
      total: 0,
      resumo: { valorTotal: 0, valorRecebido: 0, valorEmAberto: 0 },
    });

    await controller.buscarFaturas(
      'empresa-1',
      undefined,
      undefined,
      'faturamento' as any,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '1',
      '10',
      'createdAt',
      'DESC',
    );

    expect(faturamentoServiceMock.buscarFaturasPaginadas).toHaveBeenCalledWith(
      'empresa-1',
      1,
      10,
      'createdAt',
      'DESC',
      expect.objectContaining({
        origem: 'faturamento',
      }),
    );
  });

  it('propaga empresaId ao verificar faturas vencidas', async () => {
    faturamentoServiceMock.verificarFaturasVencidas.mockResolvedValue(undefined);

    await controller.verificarFaturasVencidas('empresa-tenant');

    expect(faturamentoServiceMock.verificarFaturasVencidas).toHaveBeenCalledWith(
      'empresa-tenant',
    );
  });

  it('encaminha registro de pagamento manual para o dominio de pagamentos', async () => {
    const dto = {
      faturaId: 91,
      valor: 1200,
      metodoPagamento: 'pix',
      observacoes: 'Baixa manual validada',
    };

    pagamentoServiceMock.registrarPagamentoManual.mockResolvedValue({
      id: 3001,
      faturaId: dto.faturaId,
      status: 'aprovado',
    });

    const response = await controller.registrarPagamentoManual(dto as any, 'empresa-tenant');

    expect(pagamentoServiceMock.registrarPagamentoManual).toHaveBeenCalledWith(
      dto,
      'empresa-tenant',
    );
    expect(response).toMatchObject({
      status: 201,
      data: expect.objectContaining({
        id: 3001,
        status: 'aprovado',
      }),
    });
  });

  it('gera download de PDF da fatura com headers corretos', async () => {
    const buffer = Buffer.from('pdf-fatura-fake');
    faturamentoServiceMock.gerarPdfFatura.mockResolvedValue({
      buffer,
      filename: 'fatura-ABC-123.pdf',
    });

    const res = {
      set: jest.fn(),
      send: jest.fn(),
    };

    await controller.baixarPdfFatura(99, 'empresa-tenant', res as any);

    expect(faturamentoServiceMock.gerarPdfFatura).toHaveBeenCalledWith(99, 'empresa-tenant');
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="fatura-ABC-123.pdf"',
      'Content-Length': buffer.length,
    });
    expect(res.send).toHaveBeenCalledWith(buffer);
  });

  it('retorna prontidao de cobranca com empresaId do contexto', async () => {
    faturamentoServiceMock.obterProntidaoCobranca.mockResolvedValue({
      statusGeral: 'alerta',
      prontoParaCobrancaOnline: false,
      prontoParaCobrancaPorEmail: true,
      recomendacaoOperacional:
        'Fluxo recomendado: enviar a fatura ao cliente e registrar o recebimento em "Registrar Pgto" apos a confirmacao bancaria.',
      gateway: {
        operacional: false,
        simulado: false,
        status: 'alerta',
        detalhe: 'Gateway online indisponivel. Configure MERCADO_PAGO_ACCESS_TOKEN.',
        bloqueios: [],
        alertas: ['MERCADO_PAGO_ACCESS_TOKEN nao configurado para gerar cobranca online.'],
      },
      email: {
        operacional: true,
        simulado: false,
        status: 'ok',
        detalhe: 'SMTP da empresa configurado para envio real de cobrancas.',
        bloqueios: [],
        alertas: [],
      },
      geradoEm: '2026-04-02T00:00:00.000Z',
    });

    const response = await controller.obterProntidaoCobranca('empresa-tenant');

    expect(faturamentoServiceMock.obterProntidaoCobranca).toHaveBeenCalledWith('empresa-tenant');
    expect(response).toMatchObject({
      status: 200,
      message: 'Prontidao de cobranca recuperada com sucesso',
      data: expect.objectContaining({
        statusGeral: 'alerta',
        prontoParaCobrancaOnline: false,
        prontoParaCobrancaPorEmail: true,
      }),
    });
  });
});
