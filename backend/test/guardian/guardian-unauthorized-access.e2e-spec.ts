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

const mockAdminBffService = {
  getOverview: jest.fn().mockResolvedValue({
    users: { total: 0, ativos: 0, inativos: 0 },
    pending_access_requests: 0,
    admin_security_alerts: 0,
  }),
};

const mockAdminEmpresasService = {
  listarTodas: jest.fn().mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  }),
};

const mockUserActivitiesService = {
  registrarAtividade: jest.fn().mockResolvedValue({ id: 'activity-1' }),
};

const mockGuardianCriticalAuditService = {
  record: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  }),
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

describe('Guardian routes - unauthorized access (E2E)', () => {
  let app: INestApplication;
  const previousAuthAdminMfaRequired = process.env.AUTH_ADMIN_MFA_REQUIRED;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'true';

    const moduleRef = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        controllers: [GuardianBffController, GuardianEmpresasController],
        providers: [
          { provide: AdminBffService, useValue: mockAdminBffService },
          { provide: AdminEmpresasService, useValue: mockAdminEmpresasService },
          { provide: UserActivitiesService, useValue: mockUserActivitiesService },
          { provide: GuardianCriticalAuditService, useValue: mockGuardianCriticalAuditService },
          { provide: GuardianCapabilitiesService, useValue: mockGuardianCapabilitiesService },
          { provide: GuardianPolicySnapshotService, useValue: mockGuardianPolicySnapshotService },
          { provide: GuardianRuntimeAlertService, useValue: mockGuardianRuntimeAlertService },
          { provide: AssinaturasService, useValue: mockAssinaturasService },
          {
            provide: AssinaturaDueDateSchedulerService,
            useValue: mockAssinaturaDueDateSchedulerService,
          },
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
            const withoutEmpresaHeader = req.headers['x-test-without-empresa'];

            if (roleHeader) {
              const role = String(roleHeader).trim().toLowerCase();
              const permissions = String(permissionHeader || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
              const mfaVerified = String(mfaHeader || '').trim().toLowerCase() === 'true';
              const withoutEmpresa = String(withoutEmpresaHeader || '').trim().toLowerCase() === 'true';

              req.user = {
                id: 'user-guardian-test',
                nome: 'Guardian Teste',
                email: 'guardian.test@conect360.local',
                role,
                roles: [role],
                permissoes: permissions,
                permissions,
                empresa_id: withoutEmpresa ? undefined : 'empresa-test-guardian',
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

    if (previousAuthAdminMfaRequired === undefined) {
      delete process.env.AUTH_ADMIN_MFA_REQUIRED;
    } else {
      process.env.AUTH_ADMIN_MFA_REQUIRED = previousAuthAdminMfaRequired;
    }
  });

  it('bloqueia guardian/empresas para role vendedor mesmo com permissao', async () => {
    await request(app.getHttpServer())
      .get('/guardian/empresas')
      .set('x-test-role', 'vendedor')
      .set('x-test-permissions', 'admin.empresas.manage')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('bloqueia guardian/bff/overview para role admin (nao superadmin)', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('x-test-role', 'admin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('bloqueia guardian/bff/overview sem permissao users.read', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.update')
      .set('x-test-mfa-verified', 'true')
      .expect(403);
  });

  it('bloqueia guardian/bff/overview sem MFA validado', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'false')
      .expect(401);
  });

  it('permite guardian/bff/overview para superadmin com permissao e MFA', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .set('x-test-mfa-verified', 'true')
      .expect(200);
  });
});
