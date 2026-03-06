import { OportunidadesController } from './oportunidades.controller';

describe('OportunidadesController (stale)', () => {
  const oportunidadesService = {
    getStalePolicy: jest.fn(),
    setStalePolicy: jest.fn(),
    listarOportunidadesParadas: jest.fn(),
    processarAutoArquivamentoStale: jest.fn(),
  };

  const propostasService = {} as any;
  const controller = new OportunidadesController(
    oportunidadesService as any,
    propostasService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encaminha getStalePolicy para o service com empresaId', async () => {
    const expected = {
      enabled: true,
      thresholdDays: 30,
      source: 'tenant',
      autoArchiveEnabled: false,
      autoArchiveAfterDays: 60,
      autoArchiveSource: 'default',
    };
    oportunidadesService.getStalePolicy.mockResolvedValue(expected);

    const result = await controller.getStalePolicy('empresa-1');

    expect(oportunidadesService.getStalePolicy).toHaveBeenCalledWith('empresa-1');
    expect(result).toEqual(expected);
  });

  it('encaminha setStalePolicy com payload e updatedBy do usuario logado', async () => {
    const body = {
      enabled: true,
      thresholdDays: 21,
      autoArchiveEnabled: true,
      autoArchiveAfterDays: 45,
    };
    const req = { user: { id: 'user-123' } };

    await controller.setStalePolicy('empresa-2', body as any, req as any);

    expect(oportunidadesService.setStalePolicy).toHaveBeenCalledWith({
      empresaId: 'empresa-2',
      enabled: true,
      thresholdDays: 21,
      autoArchiveEnabled: true,
      autoArchiveAfterDays: 45,
      updatedBy: 'user-123',
    });
  });

  it('setStalePolicy usa updatedBy null quando req.user nao estiver presente', async () => {
    const body = {
      enabled: false,
      thresholdDays: 30,
      autoArchiveEnabled: false,
      autoArchiveAfterDays: 60,
    };

    await controller.setStalePolicy('empresa-3', body as any, {} as any);

    expect(oportunidadesService.setStalePolicy).toHaveBeenCalledWith({
      empresaId: 'empresa-3',
      enabled: false,
      thresholdDays: 30,
      autoArchiveEnabled: false,
      autoArchiveAfterDays: 60,
      updatedBy: null,
    });
  });

  it('listStaleDeals converte threshold_days e limit validos para numero', async () => {
    await controller.listStaleDeals('empresa-4', {
      threshold_days: '40',
      limit: '150',
    } as any);

    expect(oportunidadesService.listarOportunidadesParadas).toHaveBeenCalledWith('empresa-4', {
      thresholdDays: 40,
      limit: 150,
    });
  });

  it('listStaleDeals ignora threshold_days e limit invalidos', async () => {
    await controller.listStaleDeals('empresa-5', {
      threshold_days: 'abc',
      limit: 'NaN',
    } as any);

    expect(oportunidadesService.listarOportunidadesParadas).toHaveBeenCalledWith('empresa-5', {
      thresholdDays: undefined,
      limit: undefined,
    });
  });

  it('runAutoArchiveStale ativa dryRun para flag textual positiva', async () => {
    await controller.runAutoArchiveStale('empresa-6', 'sim');

    expect(oportunidadesService.processarAutoArquivamentoStale).toHaveBeenCalledWith('empresa-6', {
      dryRun: true,
      trigger: 'manual',
    });
  });

  it('runAutoArchiveStale desativa dryRun quando parametro nao informado', async () => {
    await controller.runAutoArchiveStale('empresa-7');

    expect(oportunidadesService.processarAutoArquivamentoStale).toHaveBeenCalledWith('empresa-7', {
      dryRun: false,
      trigger: 'manual',
    });
  });
});
