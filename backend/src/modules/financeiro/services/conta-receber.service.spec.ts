import { ContaReceberService } from './conta-receber.service';
import { StatusFatura } from '../../faturamento/entities/fatura.entity';

describe('ContaReceberService', () => {
  const createService = () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const faturaRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };

    const pagamentoService = {
      registrarPagamentoManual: jest.fn(),
    };

    const faturamentoService = {
      enviarFaturaPorEmail: jest.fn(),
    };

    const service = new ContaReceberService(
      faturaRepository as any,
      pagamentoService as any,
      faturamentoService as any,
    );

    return {
      service,
      faturaRepository,
      queryBuilder,
      pagamentoService,
      faturamentoService,
    };
  };

  const makeFatura = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      numero: 'FT-001',
      descricao: 'Fatura de servico',
      clienteId: '9f98f8ad-7b4b-4a0a-b0fa-1843c4a6f001',
      cliente: {
        nome: 'Cliente A',
        email: 'cliente-a@teste.com',
      },
      status: StatusFatura.PENDENTE,
      valorTotal: 1000,
      valorPago: 0,
      dataEmissao: new Date('2026-03-01T00:00:00.000Z'),
      dataVencimento: new Date('2099-03-10T00:00:00.000Z'),
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      ativo: true,
      ...overrides,
    }) as any;

  it('deve listar contas a receber com paginacao e mapeamento de status', async () => {
    const { service, queryBuilder } = createService();

    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 10,
        numero: 'FT-010',
        status: StatusFatura.PAGA,
        valorTotal: 1000,
        valorPago: 1000,
      }),
      makeFatura({
        id: 11,
        numero: 'FT-011',
        status: StatusFatura.PENDENTE,
        valorTotal: 500,
        valorPago: 0,
      }),
    ]);

    const result = await service.findAll('empresa-1', {
      page: 1,
      pageSize: 1,
      sortBy: 'numero',
      sortOrder: 'ASC',
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].numero).toBe('FT-010');
    expect(result.data[0].status).toBe('recebida');
  });

  it('deve derivar status vencida para fatura aberta com vencimento passado', async () => {
    const { service, queryBuilder } = createService();

    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        numero: 'FT-VENC',
        status: StatusFatura.ENVIADA,
        valorTotal: 750,
        valorPago: 100,
        dataVencimento: new Date('2024-01-10T00:00:00.000Z'),
      }),
    ]);

    const result = await service.findAll('empresa-1', {
      status: 'vencida',
    });

    expect(result.total).toBe(1);
    expect(result.data[0].status).toBe('vencida');
    expect(result.data[0].diasAtraso).toBeGreaterThan(0);
  });

  it('deve calcular resumo com aging por faixa de atraso', async () => {
    const { service, queryBuilder } = createService();

    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        numero: 'FT-A-VENCER',
        status: StatusFatura.PENDENTE,
        valorTotal: 100,
        valorPago: 0,
        dataVencimento: new Date('2099-01-01T00:00:00.000Z'),
      }),
      makeFatura({
        numero: 'FT-1-30',
        status: StatusFatura.VENCIDA,
        valorTotal: 200,
        valorPago: 0,
        dataVencimento: new Date('2026-03-25T00:00:00.000Z'),
      }),
      makeFatura({
        numero: 'FT-31-60',
        status: StatusFatura.VENCIDA,
        valorTotal: 300,
        valorPago: 0,
        dataVencimento: new Date('2026-02-15T00:00:00.000Z'),
      }),
      makeFatura({
        numero: 'FT-61+',
        status: StatusFatura.VENCIDA,
        valorTotal: 400,
        valorPago: 0,
        dataVencimento: new Date('2025-12-15T00:00:00.000Z'),
      }),
      makeFatura({
        numero: 'FT-CANCELADA',
        status: StatusFatura.CANCELADA,
        valorTotal: 900,
        valorPago: 0,
      }),
    ]);

    const resumo = await service.obterResumo('empresa-1');

    expect(resumo.totalTitulos).toBe(5);
    expect(resumo.quantidadeVencidas).toBe(3);
    expect(resumo.quantidadeCanceladas).toBe(1);
    expect(resumo.valorVencido).toBe(900);
    expect(resumo.aging.aVencer).toBe(100);
    expect(resumo.aging.vencido1a30).toBe(200);
    expect(resumo.aging.vencido31a60).toBe(300);
    expect(resumo.aging.vencido61mais).toBe(400);
  });

  it('deve aplicar filtros base na query de faturas', async () => {
    const { service, queryBuilder } = createService();
    queryBuilder.getMany.mockResolvedValue([]);

    await service.findAll('empresa-xyz', {
      clienteId: '9f98f8ad-7b4b-4a0a-b0fa-1843c4a6f001',
      dataVencimentoInicio: '2026-01-01',
      dataVencimentoFim: '2026-01-31',
      valorMin: 10,
      valorMax: 1000,
      busca: 'cliente',
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('fatura.ativo = :ativo', { ativo: true });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('fatura.empresa_id = :empresaId', {
      empresaId: 'empresa-xyz',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('fatura.clienteId = :clienteId', {
      clienteId: '9f98f8ad-7b4b-4a0a-b0fa-1843c4a6f001',
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('fatura.dataVencimento', 'ASC');
    expect(queryBuilder.getMany).toHaveBeenCalled();
  });

  it('deve registrar recebimento parcial com correlation/origem e retornar conta atualizada', async () => {
    const { service, faturaRepository, pagamentoService } = createService();

    const faturaEmAberto = makeFatura({
      id: 77,
      status: StatusFatura.PENDENTE,
      valorTotal: 1000,
      valorPago: 100,
    });

    const faturaAtualizada = makeFatura({
      id: 77,
      status: StatusFatura.PARCIALMENTE_PAGA,
      valorTotal: 1000,
      valorPago: 350,
    });

    faturaRepository.findOne
      .mockResolvedValueOnce(faturaEmAberto)
      .mockResolvedValueOnce(faturaAtualizada);

    pagamentoService.registrarPagamentoManual.mockResolvedValue({
      id: 55,
      status: 'aprovado',
      valor: 250,
      metodoPagamento: 'pix',
      gatewayTransacaoId: 'MANUAL_123',
      dataAprovacao: new Date('2026-04-07T10:00:00.000Z'),
    });

    const resultado = await service.registrarRecebimento(
      77,
      {
        valor: 250,
        metodoPagamento: 'pix',
        observacoes: 'Recebimento parcial teste',
      },
      'empresa-1',
      'user-1',
    );

    expect(pagamentoService.registrarPagamentoManual).toHaveBeenCalledWith(
      expect.objectContaining({
        faturaId: 77,
        valor: 250,
        metodoPagamento: 'pix',
        origemId: expect.stringContaining('financeiro.contas-receber.registrar-recebimento:user-1'),
      }),
      'empresa-1',
    );

    expect(resultado.pagamento.id).toBe(55);
    expect(resultado.contaReceber.valorPago).toBe(350);
    expect(resultado.correlationId).toContain('conta-receber:77:recebimento:');
  });

  it('deve bloquear reenviar cobranca para titulo recebido', async () => {
    const { service, faturaRepository, faturamentoService } = createService();

    faturaRepository.findOne.mockResolvedValue(
      makeFatura({
        id: 90,
        status: StatusFatura.PAGA,
        valorTotal: 500,
        valorPago: 500,
      }),
    );

    await expect(
      service.reenviarCobranca(
        90,
        {
          email: 'cliente@teste.com',
        },
        'empresa-1',
        'user-1',
      ),
    ).rejects.toThrow(/nao e necessario reenviar cobranca/i);

    expect(faturamentoService.enviarFaturaPorEmail).not.toHaveBeenCalled();
  });
});
