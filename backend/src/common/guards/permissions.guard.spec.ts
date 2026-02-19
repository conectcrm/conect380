import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../permissions/permissions.constants';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const createContext = (user?: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const createGuard = (permissions?: Permission[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(permissions),
    } as unknown as Reflector;

    return new PermissionsGuard(reflector);
  };

  it('permite acesso quando nao ha metadata de permissao', () => {
    const guard = createGuard(undefined);
    const context = createContext({ role: 'vendedor' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando papel padrao possui permissao requerida', () => {
    const guard = createGuard([Permission.USERS_CREATE]);
    const context = createContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite acesso quando permissao explicita existe no usuario', () => {
    const guard = createGuard([Permission.PLANOS_MANAGE]);
    const context = createContext({ role: 'vendedor', permissoes: [Permission.PLANOS_MANAGE] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('suporta alias legado de permissao', () => {
    const guard = createGuard([Permission.USERS_CREATE]);
    const context = createContext({ role: 'vendedor', permissoes: ['USERS_CREATE'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('nega acesso quando permissao requerida nao esta presente', () => {
    const guard = createGuard([Permission.ADMIN_EMPRESAS_MANAGE]);
    const context = createContext({ role: 'gerente' });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('permite acesso para superadmin em permissao de governanca', () => {
    const guard = createGuard([Permission.ADMIN_EMPRESAS_MANAGE]);
    const context = createContext({ role: 'superadmin' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
