import { UnauthorizedException } from '@nestjs/common';
import { GuardianMfaGuard } from './guardian-mfa.guard';

describe('GuardianMfaGuard', () => {
  const createContext = (user: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  const originalAuthAdminMfaRequired = process.env.AUTH_ADMIN_MFA_REQUIRED;

  afterEach(() => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = originalAuthAdminMfaRequired;
  });

  it('permite acesso quando o usuario possui mfa_verified=true', () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'true';
    const guard = new GuardianMfaGuard();
    const context = createContext({ id: 'user-1', mfa_verified: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando o usuario possui alias mfaVerified=true', () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'true';
    const guard = new GuardianMfaGuard();
    const context = createContext({ id: 'user-1', mfaVerified: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia acesso sem MFA validado', () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'true';
    const guard = new GuardianMfaGuard();
    const context = createContext({ id: 'user-1', mfa_verified: false });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('permite acesso quando MFA administrativo global esta desabilitado', () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'false';
    const guard = new GuardianMfaGuard();
    const context = createContext({ id: 'user-1', mfa_verified: false });
    expect(guard.canActivate(context)).toBe(true);
  });
});
