import { DashboardV2AggregationService } from './dashboard-v2-aggregation.service';

describe('DashboardV2AggregationService', () => {
  let service: DashboardV2AggregationService;
  let getCountMock: jest.Mock;
  let oportunidadeQueryMock: jest.Mock;

  beforeEach(() => {
    getCountMock = jest.fn();
    oportunidadeQueryMock = jest.fn();

    const revenueRepositoryMock = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: getCountMock,
      })),
    };

    const oportunidadeRepositoryMock = {
      query: oportunidadeQueryMock,
    };

    service = new DashboardV2AggregationService(
      oportunidadeRepositoryMock as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      revenueRepositoryMock as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('interpreta periodStart e periodEnd no formato YYYY-MM-DD sem deslocar dia por timezone', () => {
    const range = service.resolveDateRange({
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
    });

    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(2);
    expect(range.start.getDate()).toBe(1);

    expect(range.end.getFullYear()).toBe(2026);
    expect(range.end.getMonth()).toBe(2);
    expect(range.end.getDate()).toBe(31);
  });

  it('forca recompute quando quantidade de dias agregados e menor que o esperado', async () => {
    getCountMock.mockResolvedValue(3);
    const recomputeSpy = jest
      .spyOn(service as any, 'recomputeRangeMetrics')
      .mockResolvedValue(undefined);

    await service.ensureMetricsForRange('empresa-1', {
      start: new Date(2026, 2, 1),
      end: new Date(2026, 2, 4),
    });

    expect(recomputeSpy).toHaveBeenCalledTimes(1);
  });

  it('nao recomputa quando o total de dias agregados esta completo', async () => {
    getCountMock.mockResolvedValue(4);
    const recomputeSpy = jest
      .spyOn(service as any, 'recomputeRangeMetrics')
      .mockResolvedValue(undefined);

    await service.ensureMetricsForRange('empresa-1', {
      start: new Date(2026, 2, 1),
      end: new Date(2026, 2, 4),
    });

    expect(recomputeSpy).not.toHaveBeenCalled();
  });

  it('resolve coluna responsavelId quando schema nao usa responsavel_id', async () => {
    oportunidadeQueryMock.mockResolvedValue([{ column_name: 'responsavelId' }]);

    const column = await (service as any).getOportunidadeResponsavelColumnSql();

    expect(column).toBe('o."responsavelId"');
  });

  it('resolve coluna usuario_id em schemas legados', async () => {
    oportunidadeQueryMock.mockResolvedValue([{ column_name: 'usuario_id' }]);

    const column = await (service as any).getOportunidadeResponsavelColumnSql();

    expect(column).toBe('o."usuario_id"');
  });

  it('retorna fallback seguro quando nenhuma coluna de vendedor existe', async () => {
    oportunidadeQueryMock.mockResolvedValue([]);

    const column = await (service as any).getOportunidadeResponsavelColumnSql();

    expect(column).toBe('NULL::text');
  });

  it('usa coluna lifecycle_status quando disponivel', async () => {
    oportunidadeQueryMock.mockResolvedValue([{ column_name: 'lifecycle_status' }]);

    const expr = await (service as any).getOportunidadeLifecycleStatusExpr('o');

    expect(expr).toContain('lifecycle_status');
    expect(expr).toContain("'archived'");
  });

  it('faz fallback de lifecycle a partir do estagio quando coluna nao existe', async () => {
    oportunidadeQueryMock.mockResolvedValue([]);

    const expr = await (service as any).getOportunidadeLifecycleStatusExpr('o');

    expect(expr).toContain('o.estagio');
    expect(expr).toContain("'won'");
    expect(expr).toContain("'lost'");
  });

  it('gera insight critico quando recebimento esta abaixo da meta', () => {
    const insights = service.buildFinanceiroInsights({
      valorFaturado: 1000,
      valorRecebido: 500,
      totalFaturas: 10,
      totalAtrasado: 0,
      pendenciasAprovacao: 0,
      saldoTotal: 5000,
      totalImportacoes: 2,
      alertasAtivos: 0,
      alertasCriticos: 0,
    });

    expect(insights.some((item) => item.id === 'financeiro-recebimento-abaixo-meta')).toBe(true);
  });

  it('gera insight de atraso quando existem contas vencidas', () => {
    const insights = service.buildFinanceiroInsights({
      valorFaturado: 1000,
      valorRecebido: 900,
      totalFaturas: 5,
      totalAtrasado: 250,
      pendenciasAprovacao: 0,
      saldoTotal: 3000,
      totalImportacoes: 1,
      alertasAtivos: 0,
      alertasCriticos: 0,
    });

    expect(insights.some((item) => item.id === 'financeiro-contas-atrasadas')).toBe(true);
  });

  it('permite ajustar o threshold de recebimento por variavel de ambiente', () => {
    const previousThreshold = process.env.DASHBOARD_V2_FINANCEIRO_RECEBIMENTO_ALERT_THRESHOLD;
    process.env.DASHBOARD_V2_FINANCEIRO_RECEBIMENTO_ALERT_THRESHOLD = '60';

    try {
      const insights = service.buildFinanceiroInsights({
        valorFaturado: 1000,
        valorRecebido: 650,
        totalFaturas: 5,
        totalAtrasado: 0,
        pendenciasAprovacao: 0,
        saldoTotal: 2000,
        totalImportacoes: 0,
        alertasAtivos: 0,
        alertasCriticos: 0,
      });

      expect(
        insights.some((item) => item.id === 'financeiro-recebimento-abaixo-meta'),
      ).toBe(false);
      expect(insights.some((item) => item.id === 'financeiro-recebimento-em-linha')).toBe(true);
    } finally {
      if (previousThreshold === undefined) {
        delete process.env.DASHBOARD_V2_FINANCEIRO_RECEBIMENTO_ALERT_THRESHOLD;
      } else {
        process.env.DASHBOARD_V2_FINANCEIRO_RECEBIMENTO_ALERT_THRESHOLD = previousThreshold;
      }
    }
  });

  it('respeita limite configuravel para quantidade de insights financeiros', () => {
    const previousLimit = process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT;
    process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT = '2';

    try {
      const insights = service.buildFinanceiroInsights({
        valorFaturado: 1000,
        valorRecebido: 400,
        totalFaturas: 8,
        totalAtrasado: 300,
        pendenciasAprovacao: 2,
        saldoTotal: 100,
        totalImportacoes: 3,
        alertasAtivos: 2,
        alertasCriticos: 1,
      });

      expect(insights.length).toBe(2);
    } finally {
      if (previousLimit === undefined) {
        delete process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT;
      } else {
        process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT = previousLimit;
      }
    }
  });

  it('prioriza alertas mais criticos quando o limite de insights e reduzido', () => {
    const previousLimit = process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT;
    process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT = '2';

    try {
      const insights = service.buildFinanceiroInsights({
        valorFaturado: 1000,
        valorRecebido: 900,
        totalFaturas: 6,
        totalAtrasado: 0,
        pendenciasAprovacao: 1,
        saldoTotal: 5000,
        totalImportacoes: 0,
        alertasAtivos: 2,
        alertasCriticos: 1,
      });

      expect(insights).toHaveLength(2);
      expect(insights.some((item) => item.id === 'financeiro-alertas-criticos')).toBe(true);
      expect(insights.some((item) => item.id === 'financeiro-fila-aprovacao')).toBe(true);
      expect(insights.some((item) => item.id === 'financeiro-sem-atrasos')).toBe(false);
    } finally {
      if (previousLimit === undefined) {
        delete process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT;
      } else {
        process.env.DASHBOARD_V2_FINANCEIRO_INSIGHTS_LIMIT = previousLimit;
      }
    }
  });
});
