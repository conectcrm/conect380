import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AlertaOperacionalFinanceiroSeveridade,
  AlertaOperacionalFinanceiroStatus,
  AlertaOperacionalFinanceiroTipo,
} from '../entities/alerta-operacional-financeiro.entity';
import { AlertaOperacionalFinanceiroService } from './alerta-operacional-financeiro.service';

describe('AlertaOperacionalFinanceiroService', () => {
  const parseLogPayloads = (logger: { log: jest.Mock }): Array<Record<string, unknown>> =>
    logger.log.mock.calls
      .map(([message]) => {
        if (typeof message !== 'string') return null;
        try {
          return JSON.parse(message) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((item): item is Record<string, unknown> => !!item);

  const makeQueryBuilder = <T>(options?: { many?: T[]; count?: number }) => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(options?.many || []),
      getCount: jest.fn().mockResolvedValue(options?.count || 0),
    };
    return qb;
  };

  const createService = () => {
    const alertaQueryBuilder = makeQueryBuilder();
    const alertaRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (payload) => payload),
      create: jest.fn((payload) => payload),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => alertaQueryBuilder),
    };
    const contaPagarRepository = {
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };
    const extratoItemRepository = {
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };
    const webhookEventoRepository = {
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };
    const exportacaoRepository = {
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };

    const service = new AlertaOperacionalFinanceiroService(
      alertaRepository as any,
      contaPagarRepository as any,
      extratoItemRepository as any,
      webhookEventoRepository as any,
      exportacaoRepository as any,
    );
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    (service as any).logger = logger;

    return {
      service,
      logger,
      alertaRepository,
      contaPagarRepository,
      extratoItemRepository,
      webhookEventoRepository,
      exportacaoRepository,
    };
  };

  const makeAlerta = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'alerta-1',
      empresaId: 'emp-1',
      tipo: AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA,
      severidade: AlertaOperacionalFinanceiroSeveridade.WARNING,
      status: AlertaOperacionalFinanceiroStatus.ATIVO,
      titulo: 'Conta vencida',
      descricao: 'Conta CP-001 esta vencida',
      referencia: 'cp-1',
      payload: { contaId: 'cp-1' },
      auditoria: [],
      acknowledgedPor: undefined,
      acknowledgedEm: undefined,
      resolvidoPor: undefined,
      resolvidoEm: undefined,
      createdAt: new Date('2026-02-27T12:00:00.000Z'),
      updatedAt: new Date('2026-02-27T12:00:00.000Z'),
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar alertas com filtros e limite', async () => {
    const { service, alertaRepository } = createService();
    const queryBuilder = makeQueryBuilder({ many: [makeAlerta()] });
    alertaRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const resultado = await service.listar('emp-1', {
      status: AlertaOperacionalFinanceiroStatus.ATIVO,
      severidade: AlertaOperacionalFinanceiroSeveridade.WARNING,
      tipo: AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA,
      limite: 25,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toEqual(
      expect.objectContaining({
        id: 'alerta-1',
        status: 'ativo',
      }),
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('alerta.empresaId = :empresaId', {
      empresaId: 'emp-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('alerta.status = :status', {
      status: 'ativo',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('alerta.severidade = :severidade', {
      severidade: 'warning',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('alerta.tipo = :tipo', {
      tipo: 'conta_vencida',
    });
    expect(queryBuilder.limit).toHaveBeenCalledWith(25);
  });

  it('deve reconhecer alerta ativo e registrar auditoria', async () => {
    const { service, alertaRepository, logger } = createService();
    alertaRepository.findOne.mockResolvedValue(makeAlerta());

    const resultado = await service.ack(
      'alerta-1',
      'emp-1',
      'user-1',
      { observacao: 'recebido pelo financeiro' } as any,
    );

    expect(resultado.status).toBe('acknowledged');
    expect(resultado.acknowledgedPor).toBe('user-1');
    expect(alertaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'acknowledged',
        acknowledgedPor: 'user-1',
      }),
    );
    expect((alertaRepository.save.mock.calls[0][0].auditoria || []).length).toBe(1);

    const logPayloads = parseLogPayloads(logger);
    expect(logPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.transicao',
          acao: 'ack',
          empresaId: 'emp-1',
          tipo: 'conta_vencida',
          referencia: 'cp-1',
        }),
      ]),
    );
  });

  it('deve bloquear ack de alerta resolvido', async () => {
    const { service, alertaRepository } = createService();
    alertaRepository.findOne.mockResolvedValue(
      makeAlerta({
        status: AlertaOperacionalFinanceiroStatus.RESOLVIDO,
      }),
    );

    await expect(
      service.ack('alerta-1', 'emp-1', 'user-1', {} as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve resolver alerta e registrar auditoria', async () => {
    const { service, alertaRepository, logger } = createService();
    alertaRepository.findOne.mockResolvedValue(makeAlerta());

    const resultado = await service.resolver(
      'alerta-1',
      'emp-1',
      'user-2',
      { observacao: 'problema corrigido' } as any,
    );

    expect(resultado.status).toBe('resolvido');
    expect(resultado.resolvidoPor).toBe('user-2');
    expect(alertaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolvido',
        resolvidoPor: 'user-2',
      }),
    );

    const logPayloads = parseLogPayloads(logger);
    expect(logPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.transicao',
          acao: 'resolver',
          empresaId: 'emp-1',
          tipo: 'conta_vencida',
          referencia: 'cp-1',
        }),
      ]),
    );
  });

  it('deve retornar not found quando alerta nao existir', async () => {
    const { service, alertaRepository } = createService();
    alertaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.resolver('alerta-x', 'emp-1', 'user-1', {} as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve recalcular alertas operacionais sem duplicar referencias existentes', async () => {
    const {
      service,
      logger,
      alertaRepository,
      contaPagarRepository,
      extratoItemRepository,
      webhookEventoRepository,
      exportacaoRepository,
    } = createService();

    contaPagarRepository.createQueryBuilder
      .mockReturnValueOnce(
        makeQueryBuilder({
          many: [
            {
              id: 'cp-1',
              numero: 'CP-001',
              dataVencimento: new Date('2026-03-02T00:00:00.000Z'),
              valorTotal: 1200.55,
            },
          ],
        }) as any,
      )
      .mockReturnValueOnce(
        makeQueryBuilder({
          many: [
            {
              id: 'cp-2',
              numero: 'CP-002',
              dataVencimento: new Date('2026-02-20T00:00:00.000Z'),
              valorTotal: 500.1,
            },
          ],
        }) as any,
      );

    extratoItemRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 3 }) as any,
    );
    webhookEventoRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 2 }) as any,
    );
    exportacaoRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 1 }) as any,
    );

    alertaRepository.findOne.mockResolvedValue(null);
    alertaRepository.count.mockResolvedValue(5);

    const resultado = await service.recalcularAlertas('emp-1', 'user-1');

    expect(resultado).toEqual({
      gerados: 5,
      resolvidos: 0,
      ativos: 5,
    });
    expect(alertaRepository.create).toHaveBeenCalledTimes(5);
    expect(alertaRepository.save).toHaveBeenCalledTimes(5);
    expect(alertaRepository.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: 'emp-1',
        }),
      }),
    );

    const logPayloads = parseLogPayloads(logger);
    expect(logPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.recalculo.inicio',
          empresaId: 'emp-1',
          usuarioId: 'user-1',
        }),
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.recalculo.fim',
          empresaId: 'emp-1',
          usuarioId: 'user-1',
          gerados: 5,
          resolvidos: 0,
          ativos: 5,
        }),
      ]),
    );
    expect(logPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.geracao',
          empresaId: 'emp-1',
          tipo: 'conta_vence_em_3_dias',
          referencia: 'conta:cp-1:vence_3_dias',
        }),
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.geracao',
          empresaId: 'emp-1',
          tipo: 'conta_vencida',
          referencia: 'conta:cp-2:vencida',
        }),
      ]),
    );
  });

  it('deve auto resolver alertas sem referencia ativa e manter rastreabilidade no log', async () => {
    const {
      service,
      logger,
      alertaRepository,
      contaPagarRepository,
      extratoItemRepository,
      webhookEventoRepository,
      exportacaoRepository,
    } = createService();

    contaPagarRepository.createQueryBuilder
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any)
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any);
    extratoItemRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 0 }) as any,
    );
    webhookEventoRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 0 }) as any,
    );
    exportacaoRepository.createQueryBuilder.mockReturnValue(
      makeQueryBuilder({ count: 0 }) as any,
    );

    alertaRepository.createQueryBuilder
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any)
      .mockReturnValueOnce(
        makeQueryBuilder({
          many: [
            makeAlerta({
              id: 'alerta-antigo-1',
              tipo: AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA,
              referencia: 'conta:cp-antiga:vencida',
              status: AlertaOperacionalFinanceiroStatus.ATIVO,
            }),
          ],
        }) as any,
      )
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any)
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any)
      .mockReturnValueOnce(makeQueryBuilder({ many: [] }) as any);

    alertaRepository.count.mockResolvedValue(0);

    const resultado = await service.recalcularAlertas('emp-1', 'user-9');

    expect(resultado).toEqual({
      gerados: 0,
      resolvidos: 1,
      ativos: 0,
    });
    expect(alertaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alerta-antigo-1',
        status: 'resolvido',
      }),
    );

    const logPayloads = parseLogPayloads(logger);
    expect(logPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'financeiro.alertas_operacionais.transicao',
          acao: 'auto_resolver',
          empresaId: 'emp-1',
          tipo: 'conta_vencida',
          referencia: 'conta:cp-antiga:vencida',
          statusNovo: 'resolvido',
        }),
      ]),
    );
  });
});
