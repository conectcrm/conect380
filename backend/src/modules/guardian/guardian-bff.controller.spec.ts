import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
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

describe('GuardianBffController (capabilities)', () => {
  const createController = () => {
    const adminBffService = {
      requestBreakGlassAccess: jest.fn(),
      recertifyAccess: jest.fn(),
    };
    const assinaturasService = {};
    const assinaturaDueDateSchedulerService = {
      runDueDateStatusCycle: jest.fn(),
    };
    const guardianCapabilitiesService = {
      getCapabilities: jest.fn(() => ({
        allowBreakGlassRequestCreation: false,
        allowManualBillingDueDateCycle: false,
        allowPlanDeletion: false,
        allowDirectAccessRecertification: false,
        allowCompanyModuleManagement: false,
      })),
      getRuntimeContext: jest.fn(() => ({
        environment: 'development',
        policySource: 'environment',
        releaseVersion: 'dev-local',
        adminMfaRequired: false,
        legacyTransitionMode: 'guardian_only',
        capabilities: {
          allowBreakGlassRequestCreation: false,
          allowManualBillingDueDateCycle: false,
          allowPlanDeletion: false,
          allowDirectAccessRecertification: false,
          allowCompanyModuleManagement: false,
        },
      })),
      assertBreakGlassRequestCreationAllowed: jest.fn(),
      assertManualBillingDueDateCycleAllowed: jest.fn(),
      assertPlanDeletionAllowed: jest.fn(),
      assertDirectAccessRecertificationAllowed: jest.fn(),
      assertCompanyModuleManagementAllowed: jest.fn(),
    };
    const guardianCriticalAuditService = {};
    const guardianPolicySnapshotService = {
      list: jest.fn(async () => []),
    };
    const guardianRuntimeAlertService = {
      syncRuntimePolicy: jest.fn(async () => undefined),
    };

    return {
      controller: new GuardianBffController(
        adminBffService as never,
        assinaturasService as never,
        assinaturaDueDateSchedulerService as never,
        guardianCapabilitiesService as never,
        guardianCriticalAuditService as never,
        guardianPolicySnapshotService as never,
        guardianRuntimeAlertService as never,
      ),
      adminBffService,
      assinaturaDueDateSchedulerService,
      guardianCapabilitiesService,
      guardianPolicySnapshotService,
      guardianRuntimeAlertService,
    };
  };

  it('expoe capacidades do guardian para o frontend', () => {
    const { controller, guardianCapabilitiesService } = createController();

    expect(controller.getCapabilities()).toEqual({
      success: true,
      data: guardianCapabilitiesService.getCapabilities(),
    });
  });

  it('expoe contexto runtime do guardian para leitura operacional', async () => {
    const { controller, guardianCapabilitiesService, guardianRuntimeAlertService } = createController();

    await expect(controller.getRuntimeContext()).resolves.toEqual({
      success: true,
      data: guardianCapabilitiesService.getRuntimeContext(),
    });
    expect(guardianRuntimeAlertService.syncRuntimePolicy).toHaveBeenCalledTimes(1);
  });

  it('expoe historico runtime do guardian para leitura operacional', async () => {
    const { controller, guardianPolicySnapshotService, guardianRuntimeAlertService } = createController();
    guardianPolicySnapshotService.list.mockResolvedValue([{ id: 1 }]);

    await expect(controller.getRuntimeHistory('5')).resolves.toEqual({
      success: true,
      data: [{ id: 1 }],
    });
    expect(guardianRuntimeAlertService.syncRuntimePolicy).toHaveBeenCalledTimes(1);
    expect(guardianPolicySnapshotService.list).toHaveBeenCalledWith(5);
  });

  it('bloqueia solicitacao de break-glass quando a capacidade esta desabilitada', async () => {
    const { controller, adminBffService, guardianCapabilitiesService } = createController();
    guardianCapabilitiesService.assertBreakGlassRequestCreationAllowed.mockImplementation(() => {
      throw new ForbiddenException('break-glass desabilitado');
    });

    await expect(
      controller.requestBreakGlassAccess({ id: 'actor-id' } as never, {
        target_user_id: 'target-id',
        permissions: ['users.read'],
        reason: 'incidente critico',
      }),
    ).rejects.toThrow('break-glass desabilitado');

    expect(adminBffService.requestBreakGlassAccess).not.toHaveBeenCalled();
  });

  it('bloqueia recertificacao direta quando a capacidade esta desabilitada', async () => {
    const { controller, adminBffService, guardianCapabilitiesService } = createController();
    guardianCapabilitiesService.assertDirectAccessRecertificationAllowed.mockImplementation(() => {
      throw new ForbiddenException('recertificacao desabilitada');
    });

    await expect(
      controller.recertifyAccess({ id: 'actor-id' } as never, {
        target_user_id: 'target-id',
        approved: true,
      }),
    ).rejects.toThrow('recertificacao desabilitada');

    expect(adminBffService.recertifyAccess).not.toHaveBeenCalled();
  });

  it('bloqueia execucao manual do ciclo de vencimento quando a capacidade esta desabilitada', async () => {
    const { controller, assinaturaDueDateSchedulerService, guardianCapabilitiesService } =
      createController();
    guardianCapabilitiesService.assertManualBillingDueDateCycleAllowed.mockImplementation(() => {
      throw new ForbiddenException('ciclo manual desabilitado');
    });

    await expect(controller.runBillingDueDateCycle()).rejects.toThrow('ciclo manual desabilitado');

    expect(assinaturaDueDateSchedulerService.runDueDateStatusCycle).not.toHaveBeenCalled();
  });
});
