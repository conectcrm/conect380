import { BillingSelfServiceService } from './billing-self-service.service';

type QueryBuilderMock = {
  select: jest.Mock;
  addSelect: jest.Mock;
  setParameter: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getRawOne: jest.Mock;
};

const createQueryBuilderMock = (rawResult: unknown): QueryBuilderMock => {
  const qb = {
    select: jest.fn(),
    addSelect: jest.fn(),
    setParameter: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue(rawResult),
  } as QueryBuilderMock;

  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.setParameter.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);

  return qb;
};

describe('BillingSelfServiceService', () => {
  const assinaturasService = {
    buscarPorEmpresa: jest.fn(),
    verificarLimites: jest.fn(),
    obterPoliticaTenant: jest.fn(),
  };
  const planosService = {
    listarTodos: jest.fn(),
  };
  const faturaRepository = {
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const pagamentoRepository = {
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  let service: BillingSelfServiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = 'mercado_pago';

    service = new BillingSelfServiceService(
      assinaturasService as any,
      planosService as any,
      faturaRepository as any,
      pagamentoRepository as any,
    );
  });

  it('deve retornar overview consolidado com capacidades e resumo financeiro', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValue({
      id: 'assinatura-1',
      billingPolicy: { allowCheckout: true },
    });
    assinaturasService.verificarLimites.mockResolvedValue({
      limiteUsuarios: 10,
      usuariosAtivos: 3,
    });
    assinaturasService.obterPoliticaTenant.mockResolvedValue({
      isPlatformOwner: false,
      billingExempt: false,
      monitorOnlyLimits: false,
      allowCheckout: true,
      allowPlanMutation: true,
      enforceLifecycleTransitions: true,
    });
    planosService.listarTodos.mockResolvedValue([{ id: 'starter' }]);

    faturaRepository.createQueryBuilder
      .mockReturnValueOnce(
        createQueryBuilderMock({ totalFaturas: '2', valorFaturadoTotal: '300.5' }),
      )
      .mockReturnValueOnce(createQueryBuilderMock({ valorEmAberto: '80' }));
    pagamentoRepository.createQueryBuilder.mockReturnValueOnce(
      createQueryBuilderMock({
        totalPagamentos: '1',
        valorRecebidoTotal: '220.5',
        ultimoPagamentoEm: '2026-03-26T00:00:00.000Z',
      }),
    );

    const result = await service.getOverview('empresa-1');

    expect(result.assinatura).toBeTruthy();
    expect(result.planos).toHaveLength(1);
    expect(result.limites).toBeTruthy();
    expect(result.capabilities.checkoutEnabled).toBe(true);
    expect(result.capabilities.enabledGatewayProviders).toEqual(['mercado_pago']);
    expect(result.resumoFinanceiro.totalFaturas).toBe(2);
    expect(result.resumoFinanceiro.valorFaturadoTotal).toBe(300.5);
    expect(result.resumoFinanceiro.valorEmAberto).toBe(80);
    expect(result.resumoFinanceiro.totalPagamentos).toBe(1);
  });

  it('deve limitar historico em 100 registros e mapear payload de faturas/pagamentos', async () => {
    faturaRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 12,
          numero: 'FAT-2026-0012',
          status: 'pendente',
          valorTotal: '150.50',
          valorPago: '50.25',
          dataEmissao: '2026-03-20',
          dataVencimento: '2026-03-30',
          createdAt: '2026-03-20T10:00:00.000Z',
        },
      ],
      1,
    ]);
    pagamentoRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 99,
          transacaoId: 'txn-1',
          status: 'aprovado',
          tipo: 'pagamento',
          valor: '50.25',
          valorLiquido: '49.00',
          metodoPagamento: 'pix',
          gateway: 'mercado_pago',
          dataAprovacao: '2026-03-20T10:10:00.000Z',
          createdAt: '2026-03-20T10:05:00.000Z',
        },
      ],
      1,
    ]);

    const result = await service.getHistory('empresa-1', '999');

    expect(faturaRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { empresaId: 'empresa-1' },
        take: 100,
        skip: 0,
      }),
    );
    expect(pagamentoRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { empresaId: 'empresa-1' },
        take: 100,
        skip: 0,
      }),
    );
    expect(result.limit).toBe(100);
    expect(result.page).toBe(1);
    expect(result.totalFaturas).toBe(1);
    expect(result.totalPagamentos).toBe(1);
    expect(result.faturas[0].valorRestante).toBe(100.25);
    expect(result.pagamentos[0].valor).toBe(50.25);
  });

  it('deve aplicar filtros por tipo, status, pagina e intervalo de datas', async () => {
    faturaRepository.findAndCount.mockResolvedValue([[], 0]);
    pagamentoRepository.findAndCount.mockResolvedValue([[], 0]);

    const result = await service.getHistory('empresa-1', {
      tipo: 'pagamentos',
      status: 'aprovado',
      page: '2',
      limit: '10',
      dataInicio: '2026-03-01',
      dataFim: '2026-03-31',
    });

    expect(faturaRepository.findAndCount).not.toHaveBeenCalled();
    expect(pagamentoRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 10,
      }),
    );
    expect(result.tipo).toBe('pagamentos');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.status).toBe('aprovado');
    expect(result.hasNextFaturas).toBe(false);
    expect(result.hasNextPagamentos).toBe(false);
  });
});
