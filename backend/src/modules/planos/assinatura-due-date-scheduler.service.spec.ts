import { AssinaturaDueDateSchedulerService } from './assinatura-due-date-scheduler.service';

jest.mock('../../common/tenant/tenant-context', () => ({
  runWithTenant: jest.fn(async (_empresaId: string, callback: () => Promise<unknown>) => callback()),
}));

describe('AssinaturaDueDateSchedulerService', () => {
  const assinaturaRepository = {
    manager: {
      query: jest.fn(),
    },
  };

  const assinaturasService = {
    marcarPastDue: jest.fn(),
    suspender: jest.fn(),
  };

  const mercadoPagoService = {
    reconcileRecentPayments: jest.fn(),
  };

  let service: AssinaturaDueDateSchedulerService;
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...envBackup,
      NODE_ENV: 'test',
      ASSINATURA_PAST_DUE_SUSPEND_AFTER_DAYS: '3',
    };

    mercadoPagoService.reconcileRecentPayments.mockResolvedValue({
      processed: 2,
      errors: 0,
    });

    service = new AssinaturaDueDateSchedulerService(
      assinaturaRepository as any,
      assinaturasService as any,
      mercadoPagoService as any,
    );
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('marca assinatura ativa vencida como past_due', async () => {
    assinaturaRepository.manager.query.mockResolvedValueOnce([
      {
        id: 'sub-1',
        empresaId: '11111111-1111-1111-1111-111111111111',
        status: 'active',
        proximoVencimento: '2026-01-10',
      },
    ]);
    assinaturasService.marcarPastDue.mockResolvedValue({});

    const summary = await service.runDueDateStatusCycle();

    expect(mercadoPagoService.reconcileRecentPayments).toHaveBeenCalled();
    expect(assinaturasService.marcarPastDue).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(summary).toEqual(
      expect.objectContaining({
        checked: 1,
        pastDueApplied: 1,
        suspendedApplied: 0,
        errors: 0,
      }),
    );
  });

  it('suspende assinatura past_due apos prazo de carencia', async () => {
    assinaturaRepository.manager.query.mockResolvedValueOnce([
      {
        id: 'sub-2',
        empresaId: '22222222-2222-2222-2222-222222222222',
        status: 'past_due',
        proximoVencimento: '2026-01-01',
      },
    ]);
    assinaturasService.suspender.mockResolvedValue({});

    const summary = await service.runDueDateStatusCycle();

    expect(assinaturasService.suspender).toHaveBeenCalledWith(
      '22222222-2222-2222-2222-222222222222',
    );
    expect(summary).toEqual(
      expect.objectContaining({
        checked: 1,
        pastDueApplied: 0,
        suspendedApplied: 1,
        errors: 0,
      }),
    );
  });

  it('nao altera assinatura ainda dentro do vencimento', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    assinaturaRepository.manager.query.mockResolvedValueOnce([
      {
        id: 'sub-3',
        empresaId: '33333333-3333-3333-3333-333333333333',
        status: 'active',
        proximoVencimento: tomorrow.toISOString().slice(0, 10),
      },
    ]);

    const summary = await service.runDueDateStatusCycle();

    expect(assinaturasService.marcarPastDue).not.toHaveBeenCalled();
    expect(assinaturasService.suspender).not.toHaveBeenCalled();
    expect(summary).toEqual(
      expect.objectContaining({
        checked: 1,
        pastDueApplied: 0,
        suspendedApplied: 0,
        skipped: 1,
        errors: 0,
      }),
    );
  });

  it('mantem transicoes de vencimento mesmo com falha na reconciliacao do provedor', async () => {
    mercadoPagoService.reconcileRecentPayments.mockRejectedValueOnce(
      new Error('provider_temporarily_unavailable'),
    );
    assinaturaRepository.manager.query.mockResolvedValueOnce([
      {
        id: 'sub-4',
        empresaId: '44444444-4444-4444-4444-444444444444',
        status: 'active',
        proximoVencimento: '2026-01-01',
      },
    ]);
    assinaturasService.marcarPastDue.mockResolvedValue({});

    const summary = await service.runDueDateStatusCycle();

    expect(assinaturasService.marcarPastDue).toHaveBeenCalledWith(
      '44444444-4444-4444-4444-444444444444',
    );
    expect(summary).toEqual(
      expect.objectContaining({
        checked: 1,
        pastDueApplied: 1,
        errors: 1,
      }),
    );
  });
});
