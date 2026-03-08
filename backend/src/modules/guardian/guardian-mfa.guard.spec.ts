import { UnauthorizedException } from '@nestjs/common';
import { GuardianMfaGuard } from './guardian-mfa.guard';

describe('GuardianMfaGuard', () => {
  const guard = new GuardianMfaGuard();

  const createContext = (user: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('permite acesso quando o usuario possui mfa_verified=true', () => {
    const context = createContext({ id: 'user-1', mfa_verified: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando o usuario possui alias mfaVerified=true', () => {
    const context = createContext({ id: 'user-1', mfaVerified: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia acesso sem MFA validado', () => {
    const context = createContext({ id: 'user-1', mfa_verified: false });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});

