import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { EmpresaGuard } from '../../src/common/guards/empresa.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { UserActivitiesService } from '../../src/modules/users/services/user-activities.service';
import { AssinaturasService } from '../../src/modules/planos/assinaturas.service';
import { AssinaturaDueDateSchedulerService } from '../../src/modules/planos/assinatura-due-date-scheduler.service';
import { CoreAdminBffController } from '../../src/modules/core-admin/core-admin-bff.controller';
import { CoreAdminEmpresasController } from '../../src/modules/core-admin/core-admin-empresas.controller';
import { CoreAdminMfaGuard } from '../../src/modules/core-admin/guards/core-admin-mfa.guard';
import { CoreAdminCriticalAuditInterceptor } from '../../src/modules/core-admin/interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminBffAuditInterceptor } from '../../src/modules/core-admin/interceptors/core-admin-bff-audit.interceptor';
import { CoreAdminBffService } from '../../src/modules/core-admin/services/core-admin-bff.service';
import { CoreAdminEmpresasService } from '../../src/modules/core-admin/services/core-admin-empresas.service';
import { CoreAdminCriticalAuditService } from '../../src/modules/core-admin/services/core-admin-critical-audit.service';
import { CoreAdminCapabilitiesService } from '../../src/modules/core-admin/services/core-admin-capabilities.service';
import { CoreAdminPolicySnapshotService } from '../../src/modules/core-admin/services/core-admin-policy-snapshot.service';
import { CoreAdminRuntimeAlertService } from '../../src/modules/core-admin/services/core-admin-runtime-alert.service';

const EMPRESA_ID = '216dcd4e-a4b1-4aab-a2e1-7fb537a0f6f2';

const mockAdminBffService = {
  listCompanies: jest.fn().mockResolvedValue({
    data: [
      {
        id: EMPRESA_ID,
        nome: 'Empresa Matrix',
        status: 'active',
        plano: 'starter',
        ativo: true,
      },
    ],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  }),
};

const mockAdminEmpresasService = {
  listarTodas: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
};

const mockAssinaturasService = {
  buscarPorEmpresa: jest.fn().mockResolvedValue(null),
  suspender: jest.fn().mockResolvedValue({ id: 'assinatura-1', status: 'suspended' }),
  reativar: jest.fn().mockResolvedValue({ id: 'assinatura-1', status: 'active' }),
};

const mockAssinaturaDueDateSchedulerService = {
  runDueDateStatusCycle: jest.fn().mockResolvedValue({
    processed: 0,
    activated: 0,
    overdue: 0,
    suspended: 0,
  }),
};

const mockUserActivitiesService = {
  registrarAtividade: jest.fn().mockResolvedValue({ id: 'activity-1' }),
};

const mockGuardianCriticalAuditService = {
  record: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } }),
  listForExport: jest.fn().mockResolvedValue([]),
};

const mockGuardianCapabilitiesService = {
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
    legacyTransitionMode: 'guardian_only',
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

const mockGuardianPolicySnapshotService = {
  list: jest.fn().mockResolvedValue([]),
};

const mockGuardianRuntimeAlertService = {
  syncRuntimePolicy: jest.fn().mockResolvedValue(undefined),
};

describe('Core Admin permission action matrix (E2E)', () => {
  let app: INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const moduleRef = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        controllers: [CoreAdminBffController, CoreAdminEmpresasController],
        providers: [
          { provide: CoreAdminBffService, useValue: mockAdminBffService },
          { provide: CoreAdminEmpresasService, useValue: mockAdminEmpresasService },
          { provide: AssinaturasService, useValue: mockAssinaturasService },
          {
            provide: AssinaturaDueDateSchedulerService,
            useValue: mockAssinaturaDueDateSchedulerService,
          },
          { provide: UserActivitiesService, useValue: mockUserActivitiesService },
          { provide: CoreAdminCriticalAuditService, useValue: mockGuardianCriticalAuditService },
          { provide: CoreAdminCapabilitiesService, useValue: mockGuardianCapabilitiesService },
          { provide: CoreAdminPolicySnapshotService, useValue: mockGuardianPolicySnapshotService },
          { provide: CoreAdminRuntimeAlertService, useValue: mockGuardianRuntimeAlertService },
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
            const mfaHeader = req.headers['x-test-mfa-verified'];

            if (roleHeader) {
              const role = String(roleHeader).trim().toLowerCase();
              const permissions = String(permissionHeader || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
              const mfaVerified = String(mfaHeader || '').trim().toLowerCase() === 'true';

              req.user = {
                id: 'user-matrix',
                nome: 'Guardian Matrix',
                email: 'guardian.matrix@conect360.local',
                role,
                roles: [role],
                permissoes: permissions,
                permissions,
                empresa_id: EMPRESA_ID,
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

  it('bloqueia billing quando role nao e superadmin', async () => {
    await request(app.getHttpServer())
      .patch(`/core-admin/bff/billing/subscriptions/${EMPRESA_ID}/suspend`)
      .set('x-test-role', 'admin')
      .set('x-test-permissions', 'planos.manage,users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('bloqueia billing para superadmin sem permissao planos.manage', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/billing/subscriptions')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('permite billing para superadmin com planos.manage', async () => {
    await request(app.getHttpServer())
      .patch(`/core-admin/bff/billing/subscriptions/${EMPRESA_ID}/reactivate`)
      .send({ reason: 'recuperacao operacional apos validacao core-admin' })
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read,planos.manage')
      .set('x-test-mfa-verified', 'true')
      .expect(200);
  });

  it('bloqueia auditoria critica sem users.read', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/audit/critical')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'planos.manage')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('permite auditoria critica com users.read', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/bff/audit/critical')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(200);
  });
});
