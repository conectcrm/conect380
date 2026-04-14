import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { CoreAdminPlanosController } from './core-admin-planos.controller';

describe('CoreAdminPlanosController (metadata)', () => {
  it('usa namespace core-admin para catalogo de planos', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, CoreAdminPlanosController);
    expect(controllerPath).toBe('core-admin/planos');
  });

  it('mantem baseline de superadmin com permissao planos.manage', () => {
    const roles = Reflect.getMetadata('roles', CoreAdminPlanosController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CoreAdminPlanosController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.PLANOS_MANAGE]);
  });

  it('declara guards de autenticacao e autorizacao com MFA', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CoreAdminPlanosController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(4);
  });

  it('declara interceptor de auditoria critica para escritas', () => {
    const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, CoreAdminPlanosController);
    expect(Array.isArray(interceptors)).toBe(true);
    expect(interceptors.length).toBe(1);
  });
});

describe('CoreAdminPlanosController (capabilities)', () => {
  it('bloqueia exclusao fisica de plano quando a capacidade esta desabilitada', async () => {
    const planosService = {
      remover: jest.fn(),
    };
    const coreAdminCapabilitiesService = {
      assertPlanDeletionAllowed: jest.fn(() => {
        throw new ForbiddenException('exclusao de plano desabilitada');
      }),
    };
    const controller = new CoreAdminPlanosController(
      planosService as never,
      coreAdminCapabilitiesService as never,
    );

    await expect(controller.remover('plan-id')).rejects.toThrow('exclusao de plano desabilitada');
    expect(planosService.remover).not.toHaveBeenCalled();
  });
});
