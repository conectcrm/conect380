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
});
