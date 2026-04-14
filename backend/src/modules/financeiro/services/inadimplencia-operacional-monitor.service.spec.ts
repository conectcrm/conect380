import { InadimplenciaOperacionalMonitorService } from './inadimplencia-operacional-monitor.service';

describe('InadimplenciaOperacionalMonitorService', () => {
  const empresaConfigRepository = {
    find: jest.fn(),
  };
  const inadimplenciaOperacionalService = {
    reavaliarEmpresa: jest.fn(),
  };

  const createService = () =>
    new InadimplenciaOperacionalMonitorService(
      empresaConfigRepository as any,
      inadimplenciaOperacionalService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    empresaConfigRepository.find.mockResolvedValue([
      { empresaId: 'empresa-1' },
      { empresaId: 'empresa-2' },
    ]);
    inadimplenciaOperacionalService.reavaliarEmpresa
      .mockResolvedValueOnce({
        clientesAvaliados: 3,
        bloqueados: 1,
        emRisco: 1,
        ativos: 1,
      })
      .mockResolvedValueOnce({
        clientesAvaliados: 2,
        bloqueados: 0,
        emRisco: 1,
        ativos: 1,
      });
  });

  it('processa empresas com politica ativa e consolida totais', async () => {
    const service = createService();

    const result = await service.executarCiclo();

    expect(empresaConfigRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { inadimplenciaAutomacaoAtiva: true },
      }),
    );
    expect(inadimplenciaOperacionalService.reavaliarEmpresa).toHaveBeenCalledTimes(2);
    expect(result.empresasProcessadas).toBe(2);
    expect(result.clientesAvaliados).toBe(5);
    expect(result.bloqueados).toBe(1);
    expect(result.emRisco).toBe(2);
    expect(result.ativos).toBe(2);
  });

  it('contabiliza falha por empresa sem interromper o ciclo', async () => {
    inadimplenciaOperacionalService.reavaliarEmpresa
      .mockReset()
      .mockResolvedValueOnce({
        clientesAvaliados: 1,
        bloqueados: 0,
        emRisco: 0,
        ativos: 1,
      })
      .mockRejectedValueOnce(new Error('falha simulada'));

    const service = createService();

    const result = await service.executarCiclo();

    expect(result.empresasProcessadas).toBe(1);
    expect(result.empresasComFalha).toBe(1);
    expect(result.clientesAvaliados).toBe(1);
  });

  it('permite reprocessar uma empresa sob demanda', async () => {
    inadimplenciaOperacionalService.reavaliarEmpresa.mockReset().mockResolvedValueOnce({
      empresaId: 'empresa-manual',
      clientesAvaliados: 4,
      bloqueados: 1,
      emRisco: 2,
      ativos: 1,
      falhas: 0,
    });

    const service = createService();

    const result = await service.executarEmpresa('empresa-manual', 'user-1');

    expect(inadimplenciaOperacionalService.reavaliarEmpresa).toHaveBeenCalledWith(
      'empresa-manual',
      expect.objectContaining({
        actorId: 'user-1',
        trigger: 'reavaliacao_manual',
      }),
    );
    expect(result.clientesAvaliados).toBe(4);
    expect(result.bloqueados).toBe(1);
  });
});
