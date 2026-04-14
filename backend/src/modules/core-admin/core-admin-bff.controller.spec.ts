import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { CoreAdminBffController } from './core-admin-bff.controller';

describe('CoreAdminBffController (metadata)', () => {
  it('usa namespace core-admin para bff administrativo', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, CoreAdminBffController);
    expect(controllerPath).toBe('core-admin/bff');
  });

  it('mantem baseline de superadmin com permissao users.read', () => {
    const roles = Reflect.getMetadata('roles', CoreAdminBffController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CoreAdminBffController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.USERS_READ]);
  });

  it('declara guards de autenticacao/autorizacao com contexto de empresa', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CoreAdminBffController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(5);
  });

  it('declara interceptors de auditoria administrativa e critica', () => {
    const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, CoreAdminBffController);
    expect(Array.isArray(interceptors)).toBe(true);
    expect(interceptors.length).toBe(2);
  });
});

describe('CoreAdminBffController (capabilities)', () => {
  it('bloqueia execucao manual do ciclo de vencimento quando capacidade esta desabilitada', async () => {
    const controller = new CoreAdminBffController(
      {} as never,
      {} as never,
      {
        runDueDateStatusCycle: jest.fn(),
      } as never,
      {
        assertManualBillingDueDateCycleAllowed: jest.fn(() => {
          throw new ForbiddenException('ciclo manual desabilitado');
        }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(controller.runBillingDueDateCycle()).rejects.toThrow('ciclo manual desabilitado');
  });
});
