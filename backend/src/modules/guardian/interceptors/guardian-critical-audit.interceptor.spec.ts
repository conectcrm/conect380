import { lastValueFrom, of, throwError } from 'rxjs';
import { GuardianCriticalAuditInterceptor } from './guardian-critical-audit.interceptor';

describe('GuardianCriticalAuditInterceptor', () => {
  const guardianCriticalAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const interceptor = new GuardianCriticalAuditInterceptor(guardianCriticalAuditService as any);

  const createContext = (options?: {
    method?: string;
    url?: string;
    statusCode?: number;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    user?: Record<string, unknown>;
    headers?: Record<string, unknown>;
  }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method: options?.method || 'POST',
          originalUrl: options?.url || '/guardian/empresas/empresa-1/plano',
          ip: '203.0.113.7',
          params: options?.params || { id: 'empresa-1' },
          query: options?.query || {},
          body: options?.body || { plano: 'pro' },
          headers: options?.headers || { 'user-agent': 'jest-agent' },
          user: options?.user || {
            id: 'user-1',
            role: 'superadmin',
            email: 'root@conect360.local',
            empresa_id: '5f85af6f-10bc-4bc2-b502-4fcd218b7b4c',
          },
        }),
        getResponse: () => ({
          statusCode: options?.statusCode ?? 200,
        }),
      }),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignora metodos nao criticos (GET)', async () => {
    const context = createContext({ method: 'GET' });
    const next = {
      handle: () => of({ success: true }),
    };

    await expect(lastValueFrom(interceptor.intercept(context, next as any))).resolves.toEqual({
      success: true,
    });
    expect(guardianCriticalAuditService.record).not.toHaveBeenCalled();
  });

  it('registra auditoria de sucesso para metodo critico', async () => {
    const context = createContext({ method: 'PATCH', statusCode: 202 });
    const next = {
      handle: () => of({ success: true, data: { id: 'empresa-1' } }),
    };

    await expect(lastValueFrom(interceptor.intercept(context, next as any))).resolves.toEqual({
      success: true,
      data: { id: 'empresa-1' },
    });
    expect(guardianCriticalAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        targetType: 'empresa',
        targetId: 'empresa-1',
        httpMethod: 'PATCH',
        route: '/guardian/empresas/empresa-1/plano',
        statusCode: 202,
        outcome: 'success',
      }),
    );
  });

  it('registra auditoria de erro e propaga excecao', async () => {
    const context = createContext({ method: 'POST', statusCode: 500 });
    const expectedError = { status: 403, message: 'forbidden' };
    const next = {
      handle: () => throwError(() => expectedError),
    };

    await expect(lastValueFrom(interceptor.intercept(context, next as any))).rejects.toEqual(
      expectedError,
    );
    expect(guardianCriticalAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'error',
        statusCode: 403,
        errorMessage: 'forbidden',
      }),
    );
  });

  it('classifica catalogo de planos como alvo plan_catalog', async () => {
    const context = createContext({
      method: 'PUT',
      url: '/guardian/planos/plan-1',
      params: { id: 'plan-1' },
      body: { nome: 'Plano Novo' },
    });
    const next = {
      handle: () => of({ success: true }),
    };

    await expect(lastValueFrom(interceptor.intercept(context, next as any))).resolves.toEqual({
      success: true,
    });
    expect(guardianCriticalAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'plan_catalog',
        targetId: 'plan-1',
      }),
    );
  });
});
