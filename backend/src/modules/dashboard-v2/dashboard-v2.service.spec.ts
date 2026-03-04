import { BadRequestException } from '@nestjs/common';
import { DashboardV2Service } from './dashboard-v2.service';

describe('DashboardV2Service', () => {
  const featureFlagService = {
    resolve: jest.fn(),
  };

  const cacheService = {
    buildKey: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  const aggregationService = {
    resolveDateRange: jest.fn(),
    periodKey: jest.fn(),
    ensureMetricsForRange: jest.fn(),
    getOverview: jest.fn(),
  };

  const validationService = {
    compareOverview: jest.fn(),
  };

  let service: DashboardV2Service;

  beforeEach(() => {
    jest.clearAllMocks();

    featureFlagService.resolve.mockResolvedValue({
      enabled: true,
      source: 'enabled',
      rolloutPercentage: 0,
    });

    const range = {
      start: new Date('2026-03-01T00:00:00.000Z'),
      end: new Date('2026-03-31T23:59:59.999Z'),
    };

    aggregationService.resolveDateRange.mockReturnValue(range);
    aggregationService.periodKey.mockReturnValue('2026-03-01_2026-03-31');
    aggregationService.getOverview.mockResolvedValue({
      receitaFechada: 1000,
      receitaPrevista: 2000,
      ticketMedio: 500,
      cicloMedioDias: 10,
      oportunidadesAtivas: 4,
    });

    cacheService.buildKey.mockReturnValue('dashboard-key');
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);

    service = new DashboardV2Service(
      featureFlagService as any,
      cacheService as any,
      aggregationService as any,
      validationService as any,
    );
  });

  it('bloqueia filtro pipelineId com erro de validacao', async () => {
    await expect(
      service.getOverview('empresa-1', {
        pipelineId: 'pipeline-legacy',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(aggregationService.ensureMetricsForRange).not.toHaveBeenCalled();
    expect(aggregationService.getOverview).not.toHaveBeenCalled();
  });

  it('nao força agregacao diaria quando filtra por vendedor', async () => {
    await service.getOverview('empresa-1', {
      vendedorId: '0f22f2af-8f72-406f-b66b-b5340c17ff07',
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
    } as any);

    expect(aggregationService.ensureMetricsForRange).not.toHaveBeenCalled();
    expect(aggregationService.getOverview).toHaveBeenCalledWith(
      'empresa-1',
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
      expect.objectContaining({
        vendedorId: '0f22f2af-8f72-406f-b66b-b5340c17ff07',
      }),
    );
  });

  it('mantem agregacao diaria para consulta sem filtros', async () => {
    await service.getOverview('empresa-1', {
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
    } as any);

    expect(aggregationService.ensureMetricsForRange).toHaveBeenCalledWith(
      'empresa-1',
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
    );
  });
});
