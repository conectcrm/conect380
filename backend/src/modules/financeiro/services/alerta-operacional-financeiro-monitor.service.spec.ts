import { AlertaOperacionalFinanceiroMonitorService } from './alerta-operacional-financeiro-monitor.service';

describe('AlertaOperacionalFinanceiroMonitorService', () => {
  const createService = () => {
    const empresaRepository = {
      find: jest.fn(),
    };
    const alertaOperacionalService = {
      recalcularAlertas: jest.fn(),
    };

    const service = new AlertaOperacionalFinanceiroMonitorService(
      empresaRepository as any,
      alertaOperacionalService as any,
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
      empresaRepository,
      alertaOperacionalService,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve recalcular alertas para todas as empresas ativas e consolidar resumo', async () => {
    const { service, logger, empresaRepository, alertaOperacionalService } = createService();
    empresaRepository.find.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }]);
    alertaOperacionalService.recalcularAlertas
      .mockResolvedValueOnce({ gerados: 2, resolvidos: 1, ativos: 4 })
      .mockResolvedValueOnce({ gerados: 1, resolvidos: 0, ativos: 2 });

    await (service as any).executarCiclo();

    expect(empresaRepository.find).toHaveBeenCalledWith({
      where: { ativo: true },
      select: { id: true },
    });
    expect(alertaOperacionalService.recalcularAlertas).toHaveBeenNthCalledWith(
      1,
      'emp-1',
      'sistema:auto_recalculo_alertas_financeiro',
    );
    expect(alertaOperacionalService.recalcularAlertas).toHaveBeenNthCalledWith(
      2,
      'emp-2',
      'sistema:auto_recalculo_alertas_financeiro',
    );

    const payload = JSON.parse(String(logger.log.mock.calls[0][0]));
    expect(payload).toEqual(
      expect.objectContaining({
        event: 'financeiro.alertas_operacionais.monitor.ciclo',
        empresasProcessadas: 2,
        totalGerados: 3,
        totalResolvidos: 1,
        totalAtivos: 6,
      }),
    );
  });

  it('deve continuar processamento quando uma empresa falha', async () => {
    const { service, logger, empresaRepository, alertaOperacionalService } = createService();
    empresaRepository.find.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }]);
    alertaOperacionalService.recalcularAlertas
      .mockRejectedValueOnce(new Error('falha tenant 1'))
      .mockResolvedValueOnce({ gerados: 1, resolvidos: 1, ativos: 3 });

    await (service as any).executarCiclo();

    expect(alertaOperacionalService.recalcularAlertas).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao recalcular alertas financeiros (empresaId=emp-1)'),
    );

    const payload = JSON.parse(String(logger.log.mock.calls[0][0]));
    expect(payload).toEqual(
      expect.objectContaining({
        event: 'financeiro.alertas_operacionais.monitor.ciclo',
        empresasProcessadas: 1,
        totalGerados: 1,
        totalResolvidos: 1,
        totalAtivos: 3,
      }),
    );
  });

  it('deve evitar execucao concorrente de ciclos', async () => {
    const { service, logger } = createService();
    (service as any).isRunning = true;

    await (service as any).executarCiclo();

    expect(logger.warn).toHaveBeenCalledWith(
      'Ciclo automatico de alertas financeiros ignorado (execucao em andamento)',
    );
  });
});
