import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const createContext = (user?: any): ExecutionContext => ({
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

  it('permite acesso quando não há metadata de roles', () => {
    const guard = createGuard(undefined);
    const context = createContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando usuário possui o papel exigido', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ role: 'superadmin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('suporta usuários com múltiplos papéis (array)', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ role: ['admin', 'superadmin'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('lança ForbiddenException quando usuário não possui role', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('lança ForbiddenException quando role não coincide', () => {
    const guard = createGuard(['superadmin']);
    const context = createContext({ role: 'admin' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
