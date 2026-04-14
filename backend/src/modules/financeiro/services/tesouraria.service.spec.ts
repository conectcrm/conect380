import { BadRequestException } from '@nestjs/common';
import { StatusFatura } from '../../faturamento/entities/fatura.entity';
import {
  MovimentacaoTesouraria,
  MovimentacaoTesourariaStatus,
} from '../entities/movimentacao-tesouraria.entity';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import { TesourariaService } from './tesouraria.service';

describe('TesourariaService', () => {
  const createService = () => {
    const contaBancariaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const contaPagarRepository = {
      find: jest.fn(),
    };

    const faturaRepository = {
      find: jest.fn(),
    };

    const movimentacaoRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    const service = new TesourariaService(
      contaBancariaRepository as any,
      contaPagarRepository as any,
      faturaRepository as any,
      movimentacaoRepository as any,
    );

    return {
      service,
      contaBancariaRepository,
      contaPagarRepository,
      faturaRepository,
      movimentacaoRepository,
    };
  };

  const addDays = (base: Date, days: number) => {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  };

  const makeContaBancaria = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'conta-1',
      empresaId: 'empresa-1',
      nome: 'Conta Principal',
      banco: 'Banco 1',
      agencia: '0001',
      conta: '12345-6',
      tipoConta: 'corrente',
      saldo: 1000,
      ativo: true,
      ...overrides,
    }) as any;

  const makeContaPagar = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'cp-1',
      empresaId: 'empresa-1',
      contaBancariaId: 'conta-1',
      status: 'pendente',
      valor: 200,
      valorTotal: 200,
      valorPago: 0,
      dataVencimento: new Date(),
      ...overrides,
    }) as any;

  const makeFatura = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      empresaId: 'empresa-1',
      ativo: true,
      status: StatusFatura.PENDENTE,
      valorTotal: 300,
      valorPago: 0,
      dataVencimento: new Date(),
      ...overrides,
    }) as any;

  const makeMovimentacao = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'mov-1',
      empresaId: 'empresa-1',
      contaOrigemId: 'conta-1',
      contaDestinoId: 'conta-2',
      status: MovimentacaoTesourariaStatus.PENDENTE,
      valor: 150,
      descricao: 'Transferencia interna',
      correlationId: 'corr-1',
      origemId: 'frontend.tesouraria',
      auditoria: [],
      contaOrigem: makeContaBancaria({ id: 'conta-1', nome: 'Conta Operacional' }),
      contaDestino: makeContaBancaria({ id: 'conta-2', nome: 'Conta Reserva' }),
      createdAt: new Date('2026-04-07T13:00:00.000Z'),
      updatedAt: new Date('2026-04-07T13:00:00.000Z'),
      ...overrides,
    }) as any;

  it('deve consolidar posicao de tesouraria por conta e total geral', async () => {
    const { service, contaBancariaRepository, contaPagarRepository, faturaRepository } = createService();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    contaBancariaRepository.find.mockResolvedValue([
      makeContaBancaria({ id: 'conta-1', saldo: 1000 }),
      makeContaBancaria({ id: 'conta-2', nome: 'Reserva', saldo: 500 }),
    ]);

    contaPagarRepository.find.mockResolvedValue([
      makeContaPagar({ id: 'cp-1', contaBancariaId: 'conta-1', valorTotal: 200, dataVencimento: addDays(hoje, 2) }),
      makeContaPagar({
        id: 'cp-2',
        contaBancariaId: 'conta-2',
        status: 'paga',
        valorTotal: 100,
        dataVencimento: addDays(hoje, 1),
      }),
      makeContaPagar({ id: 'cp-3', contaBancariaId: 'conta-1', valorTotal: 900, dataVencimento: addDays(hoje, 45) }),
    ]);

    faturaRepository.find.mockResolvedValue([
      makeFatura({ id: 10, valorTotal: 300, dataVencimento: addDays(hoje, 5) }),
      makeFatura({
        id: 11,
        status: StatusFatura.PAGA,
        valorTotal: 150,
        valorPago: 150,
        dataVencimento: addDays(hoje, 3),
      }),
    ]);

    const result = await service.obterPosicao('empresa-1', { janelaDias: 30 });

    expect(result.totalContas).toBe(2);
    expect(result.saldoAtualConsolidado).toBe(1500);
    expect(result.saidasProgramadasConsolidadas).toBe(200);
    expect(result.entradasPrevistasConsolidadas).toBe(300);
    expect(result.saldoProjetadoConsolidado).toBe(1600);

    const conta1 = result.itens.find((item) => item.contaBancariaId === 'conta-1');
    expect(conta1?.saldoProjetado).toBe(800);
  });

  it('deve respeitar filtro de contas inativas', async () => {
    const { service, contaBancariaRepository, contaPagarRepository, faturaRepository } = createService();

    contaBancariaRepository.find.mockResolvedValue([
      makeContaBancaria({ id: 'conta-1', ativo: true }),
      makeContaBancaria({ id: 'conta-2', ativo: false }),
    ]);
    contaPagarRepository.find.mockResolvedValue([]);
    faturaRepository.find.mockResolvedValue([]);

    await service.obterPosicao('empresa-1', { incluirInativas: true });

    expect(contaBancariaRepository.find).toHaveBeenCalledWith({
      where: {
        empresaId: 'empresa-1',
      },
    });
  });

  it('deve criar transferencia pendente e registrar auditoria inicial', async () => {
    const { service, contaBancariaRepository, movimentacaoRepository } = createService();

    movimentacaoRepository.findOne.mockResolvedValue(null);
    contaBancariaRepository.findOne
      .mockResolvedValueOnce(makeContaBancaria({ id: 'conta-1', nome: 'Origem' }))
      .mockResolvedValueOnce(makeContaBancaria({ id: 'conta-2', nome: 'Destino' }));
    movimentacaoRepository.create.mockImplementation((payload: any) => makeMovimentacao(payload));
    movimentacaoRepository.save.mockImplementation(async (payload: any) => payload);

    const resultado = await service.criarTransferencia(
      'empresa-1',
      {
        contaOrigemId: 'conta-1',
        contaDestinoId: 'conta-2',
        valor: 120,
        descricao: 'Ajuste de caixa',
      },
      'user-1',
    );

    expect(movimentacaoRepository.create).toHaveBeenCalled();
    expect(resultado.movimentacao.status).toBe(MovimentacaoTesourariaStatus.PENDENTE);
    expect(resultado.movimentacao.valor).toBe(120);
    expect(resultado.movimentacao.auditoria).toEqual(
      expect.arrayContaining([expect.objectContaining({ acao: 'criacao', usuarioId: 'user-1' })]),
    );
  });

  it('deve ser idempotente na criacao quando correlationId ja existir', async () => {
    const { service, movimentacaoRepository } = createService();

    movimentacaoRepository.findOne.mockResolvedValue(makeMovimentacao({ id: 'mov-existente' }));

    const resultado = await service.criarTransferencia(
      'empresa-1',
      {
        contaOrigemId: 'conta-1',
        contaDestinoId: 'conta-2',
        valor: 120,
        correlationId: 'corr-fixa',
      },
      'user-1',
    );

    expect(resultado.movimentacao.id).toBe('mov-existente');
    expect(resultado.movimentacao.correlationId).toBe('corr-1');
  });

  it('deve aprovar transferencia pendente alterando saldo das contas', async () => {
    const { service, movimentacaoRepository } = createService();

    const movimentacao = makeMovimentacao({
      id: 'mov-approve',
      contaOrigemId: 'conta-1',
      contaDestinoId: 'conta-2',
      valor: 200,
      status: MovimentacaoTesourariaStatus.PENDENTE,
      auditoria: [],
    });
    const contaOrigem = makeContaBancaria({ id: 'conta-1', saldo: 900, nome: 'Origem' });
    const contaDestino = makeContaBancaria({ id: 'conta-2', saldo: 100, nome: 'Destino' });

    const contaRepositoryTx = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 'conta-1') return contaOrigem;
        if (where.id === 'conta-2') return contaDestino;
        return null;
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const movimentacaoRepositoryTx = {
      findOne: jest.fn().mockResolvedValue(movimentacao),
      save: jest.fn().mockImplementation(async (payload: any) => payload),
    };

    movimentacaoRepository.manager.transaction.mockImplementation(async (callback: any) => {
      const manager = {
        getRepository: (entity: unknown) => {
          if (entity === MovimentacaoTesouraria) return movimentacaoRepositoryTx;
          if (entity === ContaBancaria) return contaRepositoryTx;
          return null;
        },
      };
      return callback(manager);
    });

    const resultado = await service.aprovarTransferencia(
      'mov-approve',
      'empresa-1',
      { observacao: 'Aprovacao gestor' },
      'gestor-1',
    );

    expect(contaRepositoryTx.save).toHaveBeenCalledTimes(1);
    expect(resultado.saldoContaOrigem).toBe(700);
    expect(resultado.saldoContaDestino).toBe(300);
    expect(resultado.movimentacao.status).toBe(MovimentacaoTesourariaStatus.APROVADA);
    expect(resultado.movimentacao.auditoria).toEqual(
      expect.arrayContaining([expect.objectContaining({ acao: 'aprovacao', usuarioId: 'gestor-1' })]),
    );
  });

  it('deve bloquear aprovacao quando saldo da origem for insuficiente', async () => {
    const { service, movimentacaoRepository } = createService();

    const movimentacao = makeMovimentacao({
      id: 'mov-sem-saldo',
      contaOrigemId: 'conta-1',
      contaDestinoId: 'conta-2',
      valor: 500,
      status: MovimentacaoTesourariaStatus.PENDENTE,
      auditoria: [],
    });
    const contaOrigem = makeContaBancaria({ id: 'conta-1', saldo: 100, nome: 'Origem' });
    const contaDestino = makeContaBancaria({ id: 'conta-2', saldo: 200, nome: 'Destino' });

    const contaRepositoryTx = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 'conta-1') return contaOrigem;
        if (where.id === 'conta-2') return contaDestino;
        return null;
      }),
      save: jest.fn(),
    };

    const movimentacaoRepositoryTx = {
      findOne: jest.fn().mockResolvedValue(movimentacao),
      save: jest.fn(),
    };

    movimentacaoRepository.manager.transaction.mockImplementation(async (callback: any) => {
      const manager = {
        getRepository: (entity: unknown) => {
          if (entity === MovimentacaoTesouraria) return movimentacaoRepositoryTx;
          if (entity === ContaBancaria) return contaRepositoryTx;
          return null;
        },
      };
      return callback(manager);
    });

    await expect(
      service.aprovarTransferencia('mov-sem-saldo', 'empresa-1', {}, 'gestor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve bloquear cancelamento de movimentacao aprovada', async () => {
    const { service, movimentacaoRepository } = createService();

    movimentacaoRepository.findOne.mockResolvedValue(
      makeMovimentacao({
        id: 'mov-cancel',
        status: MovimentacaoTesourariaStatus.APROVADA,
      }),
    );

    await expect(
      service.cancelarTransferencia('mov-cancel', 'empresa-1', { observacao: 'Cancelar' }, 'gestor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
