import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { CoreAdminEmpresasController } from './core-admin-empresas.controller';

describe('CoreAdminEmpresasController (metadata)', () => {
  it('usa namespace core-admin para empresas', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, CoreAdminEmpresasController);
    expect(controllerPath).toBe('core-admin/empresas');
  });

  it('mantem baseline de superadmin com permissao admin.empresas.manage', () => {
    const roles = Reflect.getMetadata('roles', CoreAdminEmpresasController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CoreAdminEmpresasController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.ADMIN_EMPRESAS_MANAGE]);
  });

  it('declara guards de autenticacao e autorizacao', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CoreAdminEmpresasController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(4);
  });

  it('declara interceptor de auditoria critica', () => {
    const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, CoreAdminEmpresasController);
    expect(Array.isArray(interceptors)).toBe(true);
    expect(interceptors.length).toBe(1);
  });
});

describe('CoreAdminEmpresasController (capabilities)', () => {
  it('bloqueia ativacao de modulo quando a capacidade esta desabilitada', async () => {
    const coreAdminEmpresasService = {
      ativarModulo: jest.fn(),
    };
    const coreAdminCapabilitiesService = {
      assertCompanyModuleManagementAllowed: jest.fn(() => {
        throw new ForbiddenException('gestao de modulos desabilitada');
      }),
    };
    const controller = new CoreAdminEmpresasController(
      coreAdminEmpresasService as never,
      coreAdminCapabilitiesService as never,
    );

    await expect(controller.ativarModulo('empresa-1', { modulo: 'crm' } as never)).rejects.toThrow(
      'gestao de modulos desabilitada',
    );
    expect(coreAdminEmpresasService.ativarModulo).not.toHaveBeenCalled();
  });
});
