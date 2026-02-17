import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const createContext = (user?: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const createGuard = (roles?: string[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;

    return new RolesGuard(reflector);
  };

  it('permite acesso quando nao ha metadata de roles', () => {
    const guard = createGuard(undefined);
    const context = createContext({ roles: ['admin'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando usuario possui o papel exigido', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ roles: ['superadmin'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('suporta usuarios com multiplos papeis (array)', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ roles: ['admin', 'superadmin'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('suporta usuario com papel unico em role', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ role: 'superadmin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('nega acesso (false) quando usuario nao possui roles', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({});

    expect(guard.canActivate(context)).toBe(false);
  });

  it('nega acesso (false) quando request nao possui usuario', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('nega acesso (false) quando role nao coincide', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ roles: ['admin'] });

    expect(guard.canActivate(context)).toBe(false);
  });
});
