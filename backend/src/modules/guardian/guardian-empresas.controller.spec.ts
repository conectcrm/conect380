import 'reflect-metadata';
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
});
