import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { GuardianEmpresasController } from './guardian-empresas.controller';

describe('GuardianEmpresasController (metadata)', () => {
  it('usa namespace guardian para empresas', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, GuardianEmpresasController);
    expect(controllerPath).toBe('guardian/empresas');
  });

  it('mantem controle de acesso administrativo', () => {
    const roles = Reflect.getMetadata('roles', GuardianEmpresasController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, GuardianEmpresasController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.ADMIN_EMPRESAS_MANAGE]);
  });

  it('declara guards de autenticacao e autorizacao', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, GuardianEmpresasController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(4);
  });

  it('declara interceptor de auditoria critica para operacoes sensiveis', () => {
    const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, GuardianEmpresasController);
    expect(Array.isArray(interceptors)).toBe(true);
    expect(interceptors.length).toBe(1);
  });

  it('exige permissao de planos nos endpoints de gestao de plano', () => {
    const historyPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianEmpresasController.prototype.historicoPlanos,
    );
    const changePlanPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianEmpresasController.prototype.mudarPlano,
    );

    expect(historyPermissions).toEqual([Permission.PLANOS_MANAGE]);
    expect(changePlanPermissions).toEqual([Permission.PLANOS_MANAGE]);
  });

  it('exige permissao de reset de senha no endpoint cross-tenant de usuarios', () => {
    const resetPasswordPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianEmpresasController.prototype.resetarSenhaUsuario,
    );

    expect(resetPasswordPermissions).toEqual([
      Permission.ADMIN_EMPRESAS_MANAGE,
      Permission.USERS_RESET_PASSWORD,
    ]);
  });
});

describe('GuardianEmpresasController (capabilities)', () => {
  const createController = () => {
    const adminEmpresasService = {
      ativarModulo: jest.fn(),
      atualizarModulo: jest.fn(),
      desativarModulo: jest.fn(),
    };
    const guardianCapabilitiesService = {
      assertCompanyModuleManagementAllowed: jest.fn(() => {
        throw new ForbiddenException('gestao de modulos desabilitada');
      }),
    };

    return {
      controller: new GuardianEmpresasController(
        adminEmpresasService as never,
        guardianCapabilitiesService as never,
      ),
      adminEmpresasService,
    };
  };

  it('bloqueia ativacao de modulo quando a capacidade esta desabilitada', async () => {
    const { controller, adminEmpresasService } = createController();

    await expect(controller.ativarModulo('empresa-id', {} as never)).rejects.toThrow(
      'gestao de modulos desabilitada',
    );
    expect(adminEmpresasService.ativarModulo).not.toHaveBeenCalled();
  });

  it('bloqueia atualizacao de modulo quando a capacidade esta desabilitada', async () => {
    const { controller, adminEmpresasService } = createController();

    await expect(
      controller.atualizarModulo('empresa-id', 'usuarios', {} as never),
    ).rejects.toThrow('gestao de modulos desabilitada');
    expect(adminEmpresasService.atualizarModulo).not.toHaveBeenCalled();
  });

  it('bloqueia desativacao de modulo quando a capacidade esta desabilitada', async () => {
    const { controller, adminEmpresasService } = createController();

    await expect(controller.desativarModulo('empresa-id', 'usuarios')).rejects.toThrow(
      'gestao de modulos desabilitada',
    );
    expect(adminEmpresasService.desativarModulo).not.toHaveBeenCalled();
  });
});
