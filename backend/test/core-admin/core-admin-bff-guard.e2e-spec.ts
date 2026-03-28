import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { CoreAdminBffController } from '../../src/modules/core-admin/core-admin-bff.controller';
import { CoreAdminBffService } from '../../src/modules/core-admin/services/core-admin-bff.service';
import { CoreAdminMfaGuard } from '../../src/modules/core-admin/guards/core-admin-mfa.guard';
import { CoreAdminBffAuditInterceptor } from '../../src/modules/core-admin/interceptors/core-admin-bff-audit.interceptor';
import { CoreAdminCriticalAuditInterceptor } from '../../src/modules/core-admin/interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminCriticalAuditService } from '../../src/modules/core-admin/services/core-admin-critical-audit.service';
import { CoreAdminCapabilitiesService } from '../../src/modules/core-admin/services/core-admin-capabilities.service';
import { CoreAdminPolicySnapshotService } from '../../src/modules/core-admin/services/core-admin-policy-snapshot.service';
import { CoreAdminRuntimeAlertService } from '../../src/modules/core-admin/services/core-admin-runtime-alert.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { EmpresaGuard } from '../../src/common/guards/empresa.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { UserActivitiesService } from '../../src/modules/users/services/user-activities.service';
import { AssinaturasService } from '../../src/modules/planos/assinaturas.service';
import { AssinaturaDueDateSchedulerService } from '../../src/modules/planos/assinatura-due-date-scheduler.service';

const mockAdminBffService = {
  getOverview: jest.fn().mockResolvedValue({
    users: { total: 0, ativos: 0, inativos: 0 },
    pending_access_requests: 0,
    admin_security_alerts: 0,
  }),
  listUsers: jest.fn().mockResolvedValue({
    items: [],
    total: 0,
    pagina: 1,
    limite: 20,
  }),
  listAccessChangeRequests: jest.fn().mockResolvedValue([]),
  approveAccessChangeRequest: jest.fn().mockResolvedValue({ request: {}, applied_user: null }),
  rejectAccessChangeRequest: jest.fn().mockResolvedValue({}),
  listBreakGlassRequests: jest.fn().mockResolvedValue([]),
  requestBreakGlassAccess: jest.fn().mockResolvedValue({ id: 'bg-1', status: 'REQUESTED' }),
  approveBreakGlassRequest: jest.fn().mockResolvedValue({ id: 'bg-1', status: 'APPROVED' }),
  rejectBreakGlassRequest: jest.fn().mockResolvedValue({ id: 'bg-1', status: 'REJECTED' }),
  listActiveBreakGlassAccesses: jest.fn().mockResolvedValue([]),
  revokeBreakGlassAccess: jest.fn().mockResolvedValue({ id: 'bg-1', status: 'REVOKED' }),
  generateAccessReviewReport: jest.fn().mockResolvedValue({}),
  recertifyAccess: jest.fn().mockResolvedValue({}),
  listCompanies: jest.fn().mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  }),
  listAuditActivities: jest.fn().mockResolvedValue([]),
};

const mockUserActivitiesService = {
  registrarAtividade: jest.fn().mockResolvedValue({ id: 'activity-1' }),
};

const mockCoreAdminCriticalAuditService = {
  record: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  }),
  listForExport: jest.fn().mockResolvedValue([]),
};

const mockCoreAdminCapabilitiesService = {
  getCapabilities: jest.fn().mockReturnValue({
    allowBreakGlassRequestCreation: true,
    allowManualBillingDueDateCycle: true,
    allowPlanDeletion: false,
    allowDirectAccessRecertification: true,
    allowCompanyModuleManagement: true,
  }),
  getRuntimeContext: jest.fn().mockReturnValue({
    environment: 'test',
    policySource: 'environment',
    releaseVersion: null,
    adminMfaRequired: false,
    legacyTransitionMode: 'core_admin_only',
    capabilities: {
      allowBreakGlassRequestCreation: true,
      allowManualBillingDueDateCycle: true,
      allowPlanDeletion: false,
      allowDirectAccessRecertification: true,
      allowCompanyModuleManagement: true,
    },
  }),
  assertBreakGlassRequestCreationAllowed: jest.fn(),
  assertManualBillingDueDateCycleAllowed: jest.fn(),
  assertPlanDeletionAllowed: jest.fn(),
  assertDirectAccessRecertificationAllowed: jest.fn(),
  assertCompanyModuleManagementAllowed: jest.fn(),
};

const mockCoreAdminPolicySnapshotService = {
  list: jest.fn().mockResolvedValue([]),
};

const mockCoreAdminRuntimeAlertService = {
  syncRuntimePolicy: jest.fn().mockResolvedValue(undefined),
};

const mockAssinaturasService = {
  buscarPorEmpresa: jest.fn().mockResolvedValue(null),
  suspender: jest.fn(),
  reativar: jest.fn(),
};

const mockAssinaturaDueDateSchedulerService = {
  runDueDateStatusCycle: jest.fn().mockResolvedValue({
    processed: 0,
    activated: 0,
    overdue: 0,
    suspended: 0,
  }),
};

describe('CoreAdminBffController - Guards and Policy (E2E)', () => {
  let app: INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const moduleRef = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        controllers: [CoreAdminBffController],
        providers: [
          { provide: CoreAdminBffService, useValue: mockAdminBffService },
          { provide: UserActivitiesService, useValue: mockUserActivitiesService },
          { provide: CoreAdminCriticalAuditService, useValue: mockCoreAdminCriticalAuditService },
          { provide: CoreAdminCapabilitiesService, useValue: mockCoreAdminCapabilitiesService },
          { provide: CoreAdminPolicySnapshotService, useValue: mockCoreAdminPolicySnapshotService },
          { provide: CoreAdminRuntimeAlertService, useValue: mockCoreAdminRuntimeAlertService },
          { provide: AssinaturasService, useValue: mockAssinaturasService },
          {
            provide: AssinaturaDueDateSchedulerService,
            useValue: mockAssinaturaDueDateSchedulerService,
          },
          RolesGuard,
          PermissionsGuard,
          EmpresaGuard,
          CoreAdminMfaGuard,
          CoreAdminBffAuditInterceptor,
          CoreAdminCriticalAuditInterceptor,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            const roleHeader = req.headers['x-test-role'];
            const permissionHeader = req.headers['x-test-permissions'];
            const withoutEmpresaHeader = req.headers['x-test-without-empresa'];
            const mfaHeader = req.headers['x-test-mfa-verified'];

            if (roleHeader) {
              const role = String(roleHeader).trim().toLowerCase();
              const permissions = String(permissionHeader || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

              const withoutEmpresa = String(withoutEmpresaHeader || '').toLowerCase() === 'true';
              const mfaVerified = String(mfaHeader || 'true').toLowerCase() === 'true';
              req.user = {
                id: 'user-admin-test',
                nome: 'Admin Teste',
                email: 'admin.test@conect360.local',
                role,
                roles: [role],
                permissoes: permissions,
                permissions,
                empresa_id: withoutEmpresa ? undefined : 'empresa-test-1',
                mfa_verified: mfaVerified,
              };
            }

            return true;
          },
        })
        .compile(),
    );

    app = await createE2EApp(moduleRef, { validationPipe: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite overview para superadmin com permissao users.read', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .expect(200);
  });

  it('nega overview quando falta permissao users.read', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.update')
      .expect(403);
  });

  it('nega overview para perfil nao administrativo', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/overview')
      .set('x-test-role', 'vendedor')
      .set('x-test-permissions', 'users.read')
      .expect(403);
  });

  it('nega quando usuario autenticado nao possui empresa_id', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/overview')
      .set('x-test-role', 'admin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-without-empresa', 'true')
      .expect(400);
  });

  it('permite aprovar solicitacao para superadmin com users.update', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';

    await request(app.getHttpServer())
      .post(`/core-admin/bff/access-change-requests/${requestId}/approve`)
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.update')
      .send({ reason: 'Aprovacao operacional' })
      .expect(201);
  });

  it('nega aprovacao para gerente mesmo com users.update', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';

    await request(app.getHttpServer())
      .post(`/core-admin/bff/access-change-requests/${requestId}/approve`)
      .set('x-test-role', 'gerente')
      .set('x-test-permissions', 'users.update')
      .send({ reason: 'Tentativa sem role valida para esta rota' })
      .expect(403);
  });

  it('registra auditoria admin_bff_audit para chamada com sucesso', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .expect(200);

    expect(mockUserActivitiesService.registrarAtividade).toHaveBeenCalled();
    const lastCall = mockUserActivitiesService.registrarAtividade.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    expect(lastCall?.[2]).toBe('EDICAO');
    expect(String(lastCall?.[3] || '')).toContain('Gateway core-admin');
    expect(String(lastCall?.[4] || '')).toContain('admin_bff_audit');
  });

  it('permite criar solicitacao break-glass para superadmin com users.update', async () => {
    await request(app.getHttpServer())
      .post('/core-admin/bff/break-glass/requests')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.update,users.read')
      .send({
        target_user_id: '11111111-1111-4111-8111-111111111111',
        permissions: ['users.update'],
        reason: 'Cobertura emergencial',
      })
      .expect(201);
  });

  it('bloqueia aprovacao de break-glass para gerente', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';

    await request(app.getHttpServer())
      .post(`/core-admin/bff/break-glass/requests/${requestId}/approve`)
      .set('x-test-role', 'gerente')
      .set('x-test-permissions', 'users.update,users.read')
      .send({ reason: 'Tentativa sem role valida' })
      .expect(403);
  });
});
