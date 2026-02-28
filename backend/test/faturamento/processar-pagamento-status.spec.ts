import { PagamentoService } from '../../src/modules/faturamento/services/pagamento.service';
import { StatusFatura } from '../../src/modules/faturamento/entities/fatura.entity';
import { StatusPagamento, TipoPagamento } from '../../src/modules/faturamento/entities/pagamento.entity';

describe('PagamentoService - processarPagamento / status da fatura', () => {
  let service: PagamentoService;

  const mockPagamentoRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockFaturaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockFaturamentoService = {
    sincronizarStatusPropostaPorFaturaId: jest.fn().mockResolvedValue(undefined),
  };

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PagamentoService(
      mockPagamentoRepository as any,
      mockFaturaRepository as any,
      mockFaturamentoService as any,
      mockDataSource as any,
    );
  });

  it('marca fatura como paga quando valores decimais vem como string do banco', async () => {
    const empresaId = 'empresa-1';
    const pagamentoId = 321;
    const faturaId = 123;
    const gatewayTransacaoId = 'gw-trx-123';

    const pagamentoPendente: any = {
      id: pagamentoId,
      empresaId,
      faturaId,
      transacaoId: 'trx-123',
      gatewayTransacaoId,
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.PENDENTE,
      valor: 3200,
      valorLiquido: 3200,
      fatura: { id: faturaId },
    };

    mockPagamentoRepository.findOne.mockResolvedValueOnce(pagamentoPendente);
    mockPagamentoRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    // Simula retorno do TypeORM/Postgres para decimal como string.
    mockFaturaRepository.findOne.mockResolvedValueOnce({
      id: faturaId,
      empresaId,
      numero: 'FT2026000001',
      status: StatusFatura.PENDENTE,
      valorTotal: '3200.00',
      valorPago: '0.00',
      dataPagamento: null,
      pagamentos: [
        {
          id: pagamentoId,
          status: StatusPagamento.APROVADO,
          valor: '3200.00',
          isAprovado: () => true,
        },
      ],
    });

    mockFaturaRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    const result = await service.processarPagamento(
      {
        gatewayTransacaoId,
        novoStatus: StatusPagamento.APROVADO,
      },
      empresaId,
    );

    expect(result.status).toBe(StatusPagamento.APROVADO);
    expect(mockFaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: faturaId,
        status: StatusFatura.PAGA,
        valorPago: 3200,
        metadados: expect.objectContaining({
          recebivel: expect.objectContaining({
            status: 'baixado',
          }),
        }),
      }),
    );
  });

  it('mantem fatura parcialmente paga somando apenas pagamentos aprovados', async () => {
    const empresaId = 'empresa-1';
    const faturaId = 456;
    const gatewayTransacaoId = 'gw-trx-456';

    mockPagamentoRepository.findOne.mockResolvedValueOnce({
      id: 654,
      empresaId,
      faturaId,
      transacaoId: 'trx-456',
      gatewayTransacaoId,
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.PENDENTE,
      valor: 50.2,
      valorLiquido: 50.2,
      fatura: { id: faturaId },
    });
    mockPagamentoRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    mockFaturaRepository.findOne.mockResolvedValueOnce({
      id: faturaId,
      empresaId,
      numero: 'FT2026000002',
      status: StatusFatura.PENDENTE,
      valorTotal: '200.30',
      valorPago: '0.00',
      pagamentos: [
        { id: 1, status: StatusPagamento.APROVADO, valor: '100.10', isAprovado: () => true },
        { id: 2, status: StatusPagamento.APROVADO, valor: '50.20', isAprovado: () => true },
        { id: 3, status: StatusPagamento.REJEITADO, valor: '999.99', isAprovado: () => false },
      ],
    });
    mockFaturaRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    await service.processarPagamento(
      { gatewayTransacaoId, novoStatus: StatusPagamento.APROVADO },
      empresaId,
    );

    expect(mockFaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: faturaId,
        status: StatusFatura.PARCIALMENTE_PAGA,
        valorPago: 150.3,
      }),
    );
  });

  it('arredonda soma decimal (0.1 + 0.2) e marca fatura como paga', async () => {
    const empresaId = 'empresa-1';
    const faturaId = 789;
    const gatewayTransacaoId = 'gw-trx-789';

    mockPagamentoRepository.findOne.mockResolvedValueOnce({
      id: 987,
      empresaId,
      faturaId,
      transacaoId: 'trx-789',
      gatewayTransacaoId,
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.PENDENTE,
      valor: 0.2,
      valorLiquido: 0.2,
      fatura: { id: faturaId },
    });
    mockPagamentoRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    mockFaturaRepository.findOne.mockResolvedValueOnce({
      id: faturaId,
      empresaId,
      numero: 'FT2026000003',
      status: StatusFatura.PENDENTE,
      valorTotal: '0.30',
      valorPago: '0.00',
      pagamentos: [
        { id: 10, status: StatusPagamento.APROVADO, valor: '0.10', isAprovado: () => true },
        { id: 11, status: StatusPagamento.APROVADO, valor: '0.20', isAprovado: () => true },
      ],
    });
    mockFaturaRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    await service.processarPagamento(
      { gatewayTransacaoId, novoStatus: StatusPagamento.APROVADO },
      empresaId,
    );

    expect(mockFaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: faturaId,
        status: StatusFatura.PAGA,
        valorPago: 0.3,
      }),
    );
  });

  it('recalcula fatura para pendente quando pagamento aprovado muda para rejeitado', async () => {
    const empresaId = 'empresa-1';
    const faturaId = 999;
    const pagamentoId = 1234;
    const gatewayTransacaoId = 'gw-trx-999';

    mockPagamentoRepository.findOne.mockResolvedValueOnce({
      id: pagamentoId,
      empresaId,
      faturaId,
      transacaoId: 'trx-999',
      gatewayTransacaoId,
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.APROVADO,
      valor: 120,
      valorLiquido: 120,
      dataAprovacao: new Date('2026-02-01T10:00:00.000Z'),
      fatura: { id: faturaId },
    });
    mockPagamentoRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    mockFaturaRepository.findOne.mockResolvedValueOnce({
      id: faturaId,
      empresaId,
      numero: 'FT2026000004',
      status: StatusFatura.PAGA,
      valorTotal: '120.00',
      valorPago: '120.00',
      dataPagamento: new Date('2026-02-01T10:01:00.000Z'),
      pagamentos: [
        {
          id: pagamentoId,
          status: StatusPagamento.REJEITADO,
          valor: '120.00',
          isAprovado: () => false,
        },
      ],
    });
    mockFaturaRepository.save.mockImplementation(async (payload: any) => ({ ...payload }));

    const result = await service.processarPagamento(
      {
        gatewayTransacaoId,
        novoStatus: StatusPagamento.REJEITADO,
        motivoRejeicao: 'chargeback',
      },
      empresaId,
    );

    expect(result.status).toBe(StatusPagamento.REJEITADO);
    expect(result.dataAprovacao).toBeNull();
    expect(mockFaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: faturaId,
        status: StatusFatura.PENDENTE,
        valorPago: 0,
        metadados: expect.objectContaining({
          recebivel: expect.objectContaining({
            status: 'aberto',
          }),
        }),
      }),
    );
  });
});
