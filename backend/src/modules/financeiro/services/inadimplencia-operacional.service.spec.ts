import { InadimplenciaOperacionalService } from './inadimplencia-operacional.service';
import { StatusFatura } from '../../faturamento/entities/fatura.entity';

describe('InadimplenciaOperacionalService', () => {
  const empresaConfigRepository = {
    findOne: jest.fn(),
  };

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
  };

  const faturaRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  };

  let currentStatus: any = null;
  const statusRepository = {
    findOne: jest.fn(async ({ where }: any) => {
      if (where?.id && currentStatus?.id === where.id) {
        return currentStatus;
      }
      if (
        where?.empresaId &&
        where?.clienteId &&
        currentStatus?.empresaId === where.empresaId &&
        currentStatus?.clienteId === where.clienteId
      ) {
        return currentStatus;
      }
      return null;
    }),
    create: jest.fn((payload) => ({ ...payload })),
    save: jest.fn(async (payload) => {
      currentStatus = {
        id: payload.id || 'status-1',
        cliente: payload.cliente || null,
        createdAt: payload.createdAt || new Date('2026-04-10T12:00:00.000Z'),
        updatedAt: new Date('2026-04-10T12:00:00.000Z'),
        ...payload,
      };
      return currentStatus;
    }),
    find: jest.fn(async () => []),
    createQueryBuilder: jest.fn(),
  };

  const savedEvents: any[] = [];
  const eventoRepository = {
    create: jest.fn((payload) => ({ id: `evt-${savedEvents.length + 1}`, ...payload })),
    save: jest.fn(async (payload) => {
      savedEvents.push(payload);
      return payload;
    }),
    find: jest.fn(async () => savedEvents),
  };

  const createService = () =>
    new InadimplenciaOperacionalService(
      empresaConfigRepository as any,
      faturaRepository as any,
      statusRepository as any,
      eventoRepository as any,
    );

  const makeFatura = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      status: StatusFatura.VENCIDA,
      valorTotal: 100,
      valorPago: 0,
      dataVencimento: new Date('2026-04-01T00:00:00.000Z'),
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    currentStatus = null;
    savedEvents.length = 0;
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: 'empresa-1',
      inadimplenciaAutomacaoAtiva: true,
      inadimplenciaDiasAviso: 3,
      inadimplenciaDiasAcao: 10,
      inadimplenciaAcao: 'bloquear_operacao',
      inadimplenciaModoExecucao: 'automatico',
      inadimplenciaEscopo: 'cliente',
      inadimplenciaDesbloqueioAutomaticoNaBaixa: true,
    });
    queryBuilder.getRawMany.mockResolvedValue([]);
    statusRepository.find.mockResolvedValue([]);
  });

  it('marca cliente como bloqueado automatico quando ultrapassa o limite de acao', async () => {
    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 10,
        valorTotal: 250,
        valorPago: 0,
        dataVencimento: new Date('2026-03-20T00:00:00.000Z'),
      }),
    ]);

    const service = createService();
    const result = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-1',
      trigger: 'scheduler',
    });

    expect(result.statusOperacional).toBe('bloqueado_automatico');
    expect(result.saldoVencido).toBe(250);
    expect(result.quantidadeTitulosVencidos).toBe(1);
    expect(savedEvents[0].tipoEvento).toBe('bloqueio_automatico');
  });

  it('mantem em risco quando a politica esta em modo manual com sugestao', async () => {
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: 'empresa-1',
      inadimplenciaAutomacaoAtiva: true,
      inadimplenciaDiasAviso: 3,
      inadimplenciaDiasAcao: 5,
      inadimplenciaAcao: 'bloquear_operacao',
      inadimplenciaModoExecucao: 'manual_com_sugestao',
      inadimplenciaEscopo: 'cliente',
      inadimplenciaDesbloqueioAutomaticoNaBaixa: true,
    });
    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 11,
        valorTotal: 180,
        valorPago: 0,
        dataVencimento: new Date('2026-03-25T00:00:00.000Z'),
      }),
    ]);

    const service = createService();
    const result = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-2',
      trigger: 'scheduler',
    });

    expect(result.statusOperacional).toBe('em_risco');
    expect(savedEvents[0].tipoEvento).toBe('marcacao_risco');
  });

  it('permite bloqueio manual e preserva o estado na reavaliacao', async () => {
    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 12,
        valorTotal: 310,
        dataVencimento: new Date('2026-03-18T00:00:00.000Z'),
      }),
    ]);

    const service = createService();
    const bloqueado = await service.bloquearManual(
      'empresa-1',
      'cliente-1',
      'user-manual',
      'Bloqueio solicitado pelo financeiro.',
    );
    const reavaliado = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-manual',
      trigger: 'baixa_manual',
    });

    expect(bloqueado.statusOperacional).toBe('bloqueado_manual');
    expect(reavaliado.statusOperacional).toBe('bloqueado_manual');
    expect(savedEvents.some((item) => item.tipoEvento === 'bloqueio_manual')).toBe(true);
  });

  it('retorna ativo quando nao existem titulos vencidos em aberto', async () => {
    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 13,
        status: StatusFatura.PENDENTE,
        valorTotal: 200,
        valorPago: 200,
        dataVencimento: new Date('2099-04-20T00:00:00.000Z'),
      }),
    ]);

    const service = createService();
    const result = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-3',
      trigger: 'consulta',
    });

    expect(result.statusOperacional).toBe('ativo');
    expect(result.saldoVencido).toBe(0);
  });

  it('mantem bloqueio automatico sem desbloqueio automatico na baixa', async () => {
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: 'empresa-1',
      inadimplenciaAutomacaoAtiva: true,
      inadimplenciaDiasAviso: 3,
      inadimplenciaDiasAcao: 10,
      inadimplenciaAcao: 'bloquear_operacao',
      inadimplenciaModoExecucao: 'automatico',
      inadimplenciaEscopo: 'cliente',
      inadimplenciaDesbloqueioAutomaticoNaBaixa: false,
    });
    currentStatus = {
      id: 'status-1',
      empresaId: 'empresa-1',
      clienteId: 'cliente-1',
      statusOperacional: 'bloqueado_automatico',
      origemStatus: 'automacao',
      bloqueioManual: false,
      saldoVencido: 120,
      diasMaiorAtraso: 12,
      quantidadeTitulosVencidos: 1,
      metadata: null,
      cliente: null,
    };
    queryBuilder.getMany.mockResolvedValue([]);

    const service = createService();
    const result = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-4',
      trigger: 'baixa_manual',
    });

    expect(result.statusOperacional).toBe('bloqueado_automatico');
  });

  it('nao marca risco nem bloqueio automatico quando a automacao esta desativada', async () => {
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: 'empresa-1',
      inadimplenciaAutomacaoAtiva: false,
      inadimplenciaDiasAviso: 3,
      inadimplenciaDiasAcao: 10,
      inadimplenciaAcao: 'bloquear_operacao',
      inadimplenciaModoExecucao: 'automatico',
      inadimplenciaEscopo: 'cliente',
      inadimplenciaDesbloqueioAutomaticoNaBaixa: true,
    });
    queryBuilder.getMany.mockResolvedValue([
      makeFatura({
        id: 14,
        valorTotal: 500,
        dataVencimento: new Date('2026-03-01T00:00:00.000Z'),
      }),
    ]);

    const service = createService();
    const result = await service.avaliarCliente('empresa-1', 'cliente-1', {
      actorId: 'user-5',
      trigger: 'consulta',
    });

    expect(result.statusOperacional).toBe('ativo');
    expect(result.saldoVencido).toBe(500);
  });

  it('reavalia clientes com titulos vencidos e status operacional existente', async () => {
    queryBuilder.getRawMany.mockResolvedValue([{ clienteId: 'cliente-1' }]);
    statusRepository.find.mockResolvedValue([{ clienteId: 'cliente-2' }]);
    queryBuilder.getMany
      .mockResolvedValueOnce([
        makeFatura({
          id: 15,
          valorTotal: 120,
          dataVencimento: new Date('2026-03-15T00:00:00.000Z'),
        }),
      ])
      .mockResolvedValueOnce([]);

    const service = createService();
    const result = await service.reavaliarEmpresa('empresa-1', {
      actorId: 'job',
      trigger: 'scheduler',
    });

    expect(result.clientesAvaliados).toBe(2);
    expect(result.bloqueados).toBe(1);
    expect(result.ativos).toBe(1);
  });
});
