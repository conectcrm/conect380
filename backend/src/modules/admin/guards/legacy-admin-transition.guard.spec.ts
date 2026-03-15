import { GoneException, MethodNotAllowedException } from '@nestjs/common';
import { LegacyAdminTransitionGuard } from './legacy-admin-transition.guard';

describe('LegacyAdminTransitionGuard', () => {
  const originalMode = process.env.GUARDIAN_LEGACY_TRANSITION_MODE;
  const originalCanary = process.env.GUARDIAN_LEGACY_CANARY_PERCENT;
  const originalReadOnly = process.env.GUARDIAN_LEGACY_READ_ONLY;

  const createContext = (options?: {
    userId?: string;
    empresaId?: string;
    key?: string;
    route?: string;
    ip?: string;
    method?: string;
  }) => {
    const headers: Record<string, unknown> = {};
    if (options?.key) {
      headers['x-guardian-transition-key'] = options.key;
    }

    const setHeader = jest.fn();
    const request = {
      user: {
        id: options?.userId,
        empresa_id: options?.empresaId,
      },
      headers,
      method: options?.method || 'GET',
      ip: options?.ip || '203.0.113.9',
      originalUrl: options?.route || '/admin/bff/overview',
      url: options?.route || '/admin/bff/overview',
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ setHeader }),
      }),
    } as any;

    return { context, setHeader };
  };

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.GUARDIAN_LEGACY_TRANSITION_MODE;
    } else {
      process.env.GUARDIAN_LEGACY_TRANSITION_MODE = originalMode;
    }

    if (originalCanary === undefined) {
      delete process.env.GUARDIAN_LEGACY_CANARY_PERCENT;
    } else {
      process.env.GUARDIAN_LEGACY_CANARY_PERCENT = originalCanary;
    }

    if (originalReadOnly === undefined) {
      delete process.env.GUARDIAN_LEGACY_READ_ONLY;
    } else {
      process.env.GUARDIAN_LEGACY_READ_ONLY = originalReadOnly;
    }
  });

  it('permite rotas admin no modo legacy', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'legacy';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard = new LegacyAdminTransitionGuard();
    const { context, setHeader } = createContext({ userId: 'user-1' });

    expect(guard.canActivate(context)).toBe(true);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('permite rotas no modo dual e sinaliza header de transicao', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'dual';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard = new LegacyAdminTransitionGuard();
    const { context, setHeader } = createContext({ userId: 'user-2' });

    expect(guard.canActivate(context)).toBe(true);
    expect(setHeader).toHaveBeenCalledWith('x-guardian-transition-mode', 'dual');
  });

  it('bloqueia rotas admin no modo guardian_only', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'guardian_only';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({ userId: 'user-3' });

    expect(() => guard.canActivate(context)).toThrow(GoneException);
  });

  it('usa guardian_only como padrao quando variavel de modo nao estiver definida', () => {
    delete process.env.GUARDIAN_LEGACY_TRANSITION_MODE;
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    delete process.env.GUARDIAN_LEGACY_READ_ONLY;

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({ userId: 'user-default-guardian' });

    expect(() => guard.canActivate(context)).toThrow(GoneException);
  });

  it('aplica rollout canary conforme percentual configurado', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'canary';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '100';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard100 = new LegacyAdminTransitionGuard();
    const { context: context100 } = createContext({ key: 'tenant-canary-100' });
    expect(() => guard100.canActivate(context100)).toThrow(GoneException);

    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'canary';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard0 = new LegacyAdminTransitionGuard();
    const { context: context0 } = createContext({ key: 'tenant-canary-0' });
    expect(guard0.canActivate(context0)).toBe(true);
  });

  it('bloqueia operacoes de escrita no legado quando read-only ativo', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'legacy';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'true';

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({
      userId: 'user-write-1',
      method: 'POST',
      route: '/admin/empresas',
    });

    expect(() => guard.canActivate(context)).toThrow(MethodNotAllowedException);
  });

  it('permite leitura no legado quando read-only ativo e sinaliza header', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'legacy';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'true';

    const guard = new LegacyAdminTransitionGuard();
    const { context, setHeader } = createContext({
      userId: 'user-read-1',
      method: 'GET',
      route: '/admin/empresas',
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(setHeader).toHaveBeenCalledWith('x-guardian-legacy-read-only', 'true');
  });

  it('bloqueia escrita em canary quando request permanece no legado e read-only ativo', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'canary';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'true';

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({
      key: 'tenant-read-only-canary',
      method: 'PATCH',
      route: '/admin/empresas/empresa-1/suspender',
    });

    expect(() => guard.canActivate(context)).toThrow(MethodNotAllowedException);
  });

  it('bloqueia patch de plano legado no modo dual mesmo com legado habilitado', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'dual';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({
      userId: 'user-dual-plano',
      method: 'PATCH',
      route: '/admin/empresas/empresa-1/plano',
    });

    expect(() => guard.canActivate(context)).toThrow(GoneException);
  });

  it('bloqueia patch de plano legado no modo canary mesmo quando request ficaria no legado', () => {
    process.env.GUARDIAN_LEGACY_TRANSITION_MODE = 'canary';
    process.env.GUARDIAN_LEGACY_CANARY_PERCENT = '0';
    process.env.GUARDIAN_LEGACY_READ_ONLY = 'false';

    const guard = new LegacyAdminTransitionGuard();
    const { context } = createContext({
      key: 'tenant-canary-keep-legacy',
      method: 'PATCH',
      route: '/admin/empresas/empresa-1/plano',
    });

    expect(() => guard.canActivate(context)).toThrow(GoneException);
  });
});
