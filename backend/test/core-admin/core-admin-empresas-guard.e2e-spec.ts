import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { CoreAdminEmpresasController } from '../../src/modules/core-admin/core-admin-empresas.controller';
import { CoreAdminEmpresasService } from '../../src/modules/core-admin/services/core-admin-empresas.service';
import { CoreAdminCapabilitiesService } from '../../src/modules/core-admin/services/core-admin-capabilities.service';
import { CoreAdminMfaGuard } from '../../src/modules/core-admin/guards/core-admin-mfa.guard';
import { CoreAdminCriticalAuditInterceptor } from '../../src/modules/core-admin/interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminCriticalAuditService } from '../../src/modules/core-admin/services/core-admin-critical-audit.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

const mockAdminService = {
  listarTodas: jest
    .fn()
    .mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
  buscarPorId: jest.fn(),
};

const mockCoreAdminCapabilitiesService = {
  assertCompanyModuleManagementAllowed: jest.fn(),
};

const mockCoreAdminCriticalAuditService = {
  record: jest.fn().mockResolvedValue(undefined),
};

describe('CoreAdminEmpresasController - Guards (E2E)', () => {
  let app: INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const moduleRef = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        controllers: [CoreAdminEmpresasController],
        providers: [
          { provide: CoreAdminEmpresasService, useValue: mockAdminService },
          { provide: CoreAdminCapabilitiesService, useValue: mockCoreAdminCapabilitiesService },
          { provide: CoreAdminCriticalAuditService, useValue: mockCoreAdminCriticalAuditService },
          RolesGuard,
          PermissionsGuard,
          CoreAdminMfaGuard,
          CoreAdminCriticalAuditInterceptor,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            const role = req.headers['x-test-role'];
            const permissionHeader = req.headers['x-test-permissions'];
            const mfaHeader = req.headers['x-test-mfa-verified'];
            if (role) {
              const normalizedRole = String(role).trim().toLowerCase();
              const permissions = String(permissionHeader || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
              const mfaVerified = String(mfaHeader || 'true').trim().toLowerCase() === 'true';
              req.user = {
                role: normalizedRole,
                roles: [normalizedRole],
                permissoes: permissions,
                permissions,
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

  it('nega acesso quando role e admin (somente superadmin pode operar contexto global)', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/empresas')
      .set('x-test-role', 'admin')
      .set('x-test-permissions', 'admin.empresas.manage')
      .expect(403);
  });

  it('permite acesso quando role e superadmin com permissao admin.empresas.manage', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/empresas')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'admin.empresas.manage')
      .expect(200);
  });

  it('nega acesso quando usuario nao possui role', async () => {
    await request(app.getHttpServer()).get('/core-admin/empresas').expect(403);
  });

  it('nega acesso quando role nao e admin', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/empresas')
      .set('x-test-role', 'manager')
      .set('x-test-permissions', 'admin.empresas.manage')
      .expect(403);
  });

  it('nega acesso para superadmin sem permissao admin.empresas.manage', async () => {
    await request(app.getHttpServer())
      .get('/core-admin/empresas')
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read')
      .expect(403);
  });
});
