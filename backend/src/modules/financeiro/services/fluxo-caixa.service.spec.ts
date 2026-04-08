import { FluxoCaixaService } from './fluxo-caixa.service';
import { StatusFatura } from '../../faturamento/entities/fatura.entity';

describe('FluxoCaixaService', () => {
  const createService = () => {
    const faturaRepository = {
      find: jest.fn(),
    };

    const contaPagarRepository = {
      find: jest.fn(),
    };

    const service = new FluxoCaixaService(faturaRepository as any, contaPagarRepository as any);

    return {
      service,
      faturaRepository,
      contaPagarRepository,
    };
  };

  const makeFatura = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 1,
      empresaId: 'empresa-1',
      ativo: true,
      numero: 'FT-001',
      descricao: 'Fatura',
      status: StatusFatura.PENDENTE,
      valorTotal: 1000,
      valorPago: 0,
      dataVencimento: new Date('2026-04-10T00:00:00.000Z'),
      dataPagamento: null,
      ...overrides,
    }) as any;

  const makeContaPagar = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'cp-1',
      empresaId: 'empresa-1',
      status: 'pendente',
      valor: 300,
      valorTotal: 300,
      valorPago: 0,
      dataVencimento: new Date('2026-04-11T00:00:00.000Z'),
      dataPagamento: null,
      ...overrides,
    }) as any;

  it('deve calcular resumo do fluxo de caixa com entradas e saidas realizadas e previstas', async () => {
    const { service, faturaRepository, contaPagarRepository } = createService();

    faturaRepository.find.mockResolvedValue([
      makeFatura({
        id: 10,
        status: StatusFatura.PAGA,
        valorTotal: 800,
        valorPago: 800,
        dataVencimento: new Date('2026-04-05T00:00:00.000Z'),
        dataPagamento: new Date('2026-04-06T00:00:00.000Z'),
      }),
      makeFatura({
        id: 11,
        status: StatusFatura.PENDENTE,
        valorTotal: 1000,
        valorPago: 0,
        dataVencimento: new Date('2026-04-10T00:00:00.000Z'),
      }),
      makeFatura({
        id: 12,
        status: StatusFatura.PARCIALMENTE_PAGA,
        valorTotal: 600,
        valorPago: 200,
        dataVencimento: new Date('2026-04-12T00:00:00.000Z'),
      }),
    ]);

    contaPagarRepository.find.mockResolvedValue([
      makeContaPagar({
        id: 'cp-10',
        status: 'paga',
        valorTotal: 400,
        valorPago: 400,
        dataPagamento: new Date('2026-04-08T00:00:00.000Z'),
      }),
      makeContaPagar({
        id: 'cp-11',
        status: 'pendente',
        valorTotal: 300,
        valorPago: 0,
        dataVencimento: new Date('2026-04-11T00:00:00.000Z'),
      }),
    ]);

    const resumo = await service.obterResumo('empresa-1', {
      dataInicio: '2026-04-01',
      dataFim: '2026-04-30',
      agrupamento: 'dia',
    });

    expect(faturaRepository.find).toHaveBeenCalledWith({ where: { empresaId: 'empresa-1', ativo: true } });
    expect(contaPagarRepository.find).toHaveBeenCalledWith({ where: { empresaId: 'empresa-1' } });

    expect(resumo.totais.entradasRealizadas).toBe(800);
    expect(resumo.totais.saidasRealizadas).toBe(400);
    expect(resumo.totais.entradasPrevistas).toBe(1400);
    expect(resumo.totais.saidasPrevistas).toBe(300);
    expect(resumo.totais.saldoLiquidoRealizado).toBe(400);
    expect(resumo.totais.saldoLiquidoPrevisto).toBe(1500);
    expect(resumo.serie).toHaveLength(30);
  });

  it('deve projetar fluxo diario para janela futura', async () => {
    const { service, faturaRepository, contaPagarRepository } = createService();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const addDays = (base: Date, days: number) => {
      const next = new Date(base);
      next.setDate(next.getDate() + days);
      return next;
    };

    faturaRepository.find.mockResolvedValue([
      makeFatura({
        id: 20,
        status: StatusFatura.PENDENTE,
        valorTotal: 500,
        valorPago: 0,
        dataVencimento: addDays(hoje, 1),
      }),
    ]);

    contaPagarRepository.find.mockResolvedValue([
      makeContaPagar({
        id: 'cp-20',
        status: 'pendente',
        valorTotal: 200,
        valorPago: 0,
        dataVencimento: addDays(hoje, 2),
      }),
    ]);

    const projecao = await service.obterProjecao('empresa-1', { janelaDias: 7 });

    expect(projecao.dias).toBe(7);
    expect(projecao.itens).toHaveLength(7);
    expect(projecao.totalEntradasPrevistas).toBe(500);
    expect(projecao.totalSaidasPrevistas).toBe(200);
    expect(projecao.saldoProjetado).toBe(300);
    expect(projecao.itens[projecao.itens.length - 1].saldoProjetadoAcumulado).toBe(300);
  });
});
