import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { EmpresaGuard } from '../../src/common/guards/empresa.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AdminBffAuditInterceptor } from '../../src/modules/admin/interceptors/admin-bff-audit.interceptor';
import { AdminBffService } from '../../src/modules/admin/services/admin-bff.service';
import { AdminEmpresasService } from '../../src/modules/admin/services/admin-empresas.service';
import { UserActivitiesService } from '../../src/modules/users/services/user-activities.service';
import { GuardianBffController } from '../../src/modules/guardian/guardian-bff.controller';
import { GuardianEmpresasController } from '../../src/modules/guardian/guardian-empresas.controller';
import { GuardianMfaGuard } from '../../src/modules/guardian/guardian-mfa.guard';
import { GuardianCriticalAuditService } from '../../src/modules/guardian/services/guardian-critical-audit.service';
import { GuardianCriticalAuditInterceptor } from '../../src/modules/guardian/interceptors/guardian-critical-audit.interceptor';
import { GuardianCapabilitiesService } from '../../src/modules/guardian/services/guardian-capabilities.service';
import { GuardianPolicySnapshotService } from '../../src/modules/guardian/services/guardian-policy-snapshot.service';
import { GuardianRuntimeAlertService } from '../../src/modules/guardian/services/guardian-runtime-alert.service';
import { AssinaturasService } from '../../src/modules/planos/assinaturas.service';
import { AssinaturaDueDateSchedulerService } from '../../src/modules/planos/assinatura-due-date-scheduler.service';

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

describe('Guardian permission action matrix (E2E)', () => {
  let app: INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const moduleRef = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        controllers: [GuardianBffController, GuardianEmpresasController],
        providers: [
          { provide: AdminBffService, useValue: mockAdminBffService },
          { provide: AdminEmpresasService, useValue: mockAdminEmpresasService },
          { provide: AssinaturasService, useValue: mockAssinaturasService },
          {
            provide: AssinaturaDueDateSchedulerService,
            useValue: mockAssinaturaDueDateSchedulerService,
          },
          { provide: UserActivitiesService, useValue: mockUserActivitiesService },
          { provide: GuardianCriticalAuditService, useValue: mockGuardianCriticalAuditService },
          { provide: GuardianCapabilitiesService, useValue: mockGuardianCapabilitiesService },
          { provide: GuardianPolicySnapshotService, useValue: mockGuardianPolicySnapshotService },
          { provide: GuardianRuntimeAlertService, useValue: mockGuardianRuntimeAlertService },
          RolesGuard,
          PermissionsGuard,
          EmpresaGuard,
          GuardianMfaGuard,
          AdminBffAuditInterceptor,
          GuardianCriticalAuditInterceptor,
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
      .patch(`/guardian/bff/billing/subscriptions/${EMPRESA_ID}/suspend`)
      .set('x-test-role', 'admin')
      .set('x-test-permissions', 'planos.manage,users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('bloqueia billing para superadmin sem permissao planos.manage', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/billing/subscriptions')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('permite billing para superadmin com planos.manage', async () => {
    await request(app.getHttpServer())
      .patch(`/guardian/bff/billing/subscriptions/${EMPRESA_ID}/reactivate`)
      .send({ reason: 'recuperacao operacional apos validacao guardian' })
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read,planos.manage')
      .set('x-test-mfa-verified', 'true')
      .expect(200);
  });

  it('bloqueia auditoria critica sem users.read', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/audit/critical')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'planos.manage')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('permite auditoria critica com users.read', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/audit/critical')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(200);
  });
});
