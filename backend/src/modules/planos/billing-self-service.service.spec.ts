import { BillingSelfServiceService } from './billing-self-service.service';

type SummaryQueryBuilderMock = {
  select: jest.Mock;
  addSelect: jest.Mock;
  setParameter: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getRawOne: jest.Mock;
};

type InvoicesHistoryQueryBuilderMock = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getManyAndCount: jest.Mock;
};

const createSummaryQueryBuilderMock = (rawResult: unknown): SummaryQueryBuilderMock => {
  const qb = {
    select: jest.fn(),
    addSelect: jest.fn(),
    setParameter: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue(rawResult),
  } as SummaryQueryBuilderMock;

  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.setParameter.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);

  return qb;
};

const createInvoicesHistoryQueryBuilderMock = (
  rows: unknown[] = [],
  total = 0,
): InvoicesHistoryQueryBuilderMock => {
  const qb = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
  } as InvoicesHistoryQueryBuilderMock;

  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);

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
    createQueryBuilder: jest.fn(),
  };
  const pagamentoRepository = {
    createQueryBuilder: jest.fn(),
  };
  const billingEventRepository = {
    query: jest.fn(),
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
      billingEventRepository as any,
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
        createSummaryQueryBuilderMock({ totalFaturas: '2', valorFaturadoTotal: '300.5' }),
      )
      .mockReturnValueOnce(createSummaryQueryBuilderMock({ valorEmAberto: '80' }));
    pagamentoRepository.createQueryBuilder.mockReturnValueOnce(
      createSummaryQueryBuilderMock({
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

  it('deve limitar historico em 100 registros e mapear pagamentos de assinatura via billing_events', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValue({ id: 'assinatura-1' });
    faturaRepository.createQueryBuilder.mockReturnValueOnce(
      createInvoicesHistoryQueryBuilderMock(
        [
          {
            id: 12,
            numero: 'SUB-2026-0012',
            status: 'pendente',
            valorTotal: '150.50',
            valorPago: '50.25',
            dataEmissao: '2026-03-20',
            dataVencimento: '2026-03-30',
            createdAt: '2026-03-20T10:00:00.000Z',
          },
        ],
        1,
      ),
    );
    billingEventRepository.query
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([
        {
          id: 99,
          payment_id: 'txn-1',
          payment_status: 'approved',
          payment_action: 'updated',
          occurred_at: '2026-03-20T10:10:00.000Z',
          created_at: '2026-03-20T10:05:00.000Z',
        },
      ]);

    const result = await service.getHistory('empresa-1', '999');

    expect(faturaRepository.createQueryBuilder).toHaveBeenCalledWith('fatura');
    expect(billingEventRepository.query).toHaveBeenCalledTimes(2);
    expect(result.limit).toBe(100);
    expect(result.page).toBe(1);
    expect(result.totalFaturas).toBe(1);
    expect(result.totalPagamentos).toBe(1);
    expect(result.faturas[0].valorRestante).toBe(100.25);
    expect(result.pagamentos[0].transacaoId).toBe('txn-1');
    expect(result.pagamentos[0].status).toBe('aprovado');
  });

  it('deve aplicar filtros por tipo, status, pagina e intervalo de datas no historico de assinatura', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValue({ id: 'assinatura-1' });
    billingEventRepository.query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

    const result = await service.getHistory('empresa-1', {
      tipo: 'pagamentos',
      status: 'aprovado',
      page: '2',
      limit: '10',
      dataInicio: '2026-03-01',
      dataFim: '2026-03-31',
    });

    expect(faturaRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(billingEventRepository.query).toHaveBeenCalledTimes(2);
    const [countSql, countParams] = billingEventRepository.query.mock.calls[0];
    expect(countSql).toContain('paymentStatus');
    expect(countParams).toEqual(expect.arrayContaining(['approved']));
    expect(result.tipo).toBe('pagamentos');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.status).toBe('aprovado');
    expect(result.hasNextFaturas).toBe(false);
    expect(result.hasNextPagamentos).toBe(false);
  });
});
