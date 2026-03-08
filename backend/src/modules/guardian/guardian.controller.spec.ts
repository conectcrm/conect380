import 'reflect-metadata';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { GuardianController } from './guardian.controller';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';

describe('GuardianController (metadata)', () => {
  it('usa namespace dedicado guardian', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, GuardianController);
    expect(controllerPath).toBe('guardian');
  });

  it('exige role superadmin e permissao admin.empresas.manage', () => {
    const roles = Reflect.getMetadata('roles', GuardianController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, GuardianController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.ADMIN_EMPRESAS_MANAGE]);
  });

  it('declara guards de autenticacao e autorizacao no namespace', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, GuardianController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(4);
  });
});
