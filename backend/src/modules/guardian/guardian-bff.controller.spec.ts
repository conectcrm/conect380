import 'reflect-metadata';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { GuardianBffController } from './guardian-bff.controller';

describe('GuardianBffController (metadata)', () => {
  it('usa namespace guardian para bff administrativo', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, GuardianBffController);
    expect(controllerPath).toBe('guardian/bff');
  });

  it('mantem baseline de roles e permissao de leitura', () => {
    const roles = Reflect.getMetadata('roles', GuardianBffController);
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, GuardianBffController);

    expect(roles).toEqual([UserRole.SUPERADMIN]);
    expect(permissions).toEqual([Permission.USERS_READ]);
  });

  it('declara guards e auditoria no namespace guardian', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, GuardianBffController);
    const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, GuardianBffController);
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.length).toBe(5);
    expect(Array.isArray(interceptors)).toBe(true);
    expect(interceptors.length).toBe(2);
  });

  it('mantem rotas criticas com role estrita de superadmin', () => {
    const approveRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.approveAccessChangeRequest,
    );
    const rejectRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.rejectAccessChangeRequest,
    );
    const approveBreakGlassRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.approveBreakGlassRequest,
    );
    const rejectBreakGlassRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.rejectBreakGlassRequest,
    );
    const revokeRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.revokeBreakGlassAccess,
    );
    const suspendBillingRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.suspendBillingSubscription,
    );
    const reactivateBillingRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.reactivateBillingSubscription,
    );
    const dueDateCycleRoles = Reflect.getMetadata(
      'roles',
      GuardianBffController.prototype.runBillingDueDateCycle,
    );

    expect(approveRoles).toEqual([UserRole.SUPERADMIN]);
    expect(rejectRoles).toEqual([UserRole.SUPERADMIN]);
    expect(approveBreakGlassRoles).toEqual([UserRole.SUPERADMIN]);
    expect(rejectBreakGlassRoles).toEqual([UserRole.SUPERADMIN]);
    expect(revokeRoles).toEqual([UserRole.SUPERADMIN]);
    expect(suspendBillingRoles).toEqual([UserRole.SUPERADMIN]);
    expect(reactivateBillingRoles).toEqual([UserRole.SUPERADMIN]);
    expect(dueDateCycleRoles).toEqual([UserRole.SUPERADMIN]);
  });

  it('explicita permissao de planos nas rotas de billing', () => {
    const billingReadPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianBffController.prototype.listBillingSubscriptions,
    );
    const billingSuspendPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianBffController.prototype.suspendBillingSubscription,
    );
    const billingReactivatePermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianBffController.prototype.reactivateBillingSubscription,
    );
    const billingDueDateCyclePermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GuardianBffController.prototype.runBillingDueDateCycle,
    );

    expect(billingReadPermissions).toEqual([Permission.PLANOS_MANAGE]);
    expect(billingSuspendPermissions).toEqual([Permission.PLANOS_MANAGE]);
    expect(billingReactivatePermissions).toEqual([Permission.PLANOS_MANAGE]);
    expect(billingDueDateCyclePermissions).toEqual([Permission.PLANOS_MANAGE]);
  });
});
