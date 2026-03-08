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
import { AssinaturasService } from '../../src/modules/planos/assinaturas.service';
import { AssinaturaDueDateSchedulerService } from '../../src/modules/planos/assinatura-due-date-scheduler.service';

const EMPRESA_ID = '6cd7d2c4-75f2-4c89-a58b-0afdef4d2c26';

const mockAdminBffService = {
  getOverview: jest.fn().mockResolvedValue({
    users: { total: 10, ativos: 9, inativos: 1 },
    pending_access_requests: 1,
    admin_security_alerts: 0,
  }),
  listCompanies: jest.fn().mockResolvedValue({
    data: [
      {
        id: EMPRESA_ID,
        nome: 'Empresa Operacional',
        status: 'active',
        plano: 'professional',
        ativo: true,
      },
    ],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  }),
  listAuditActivities: jest.fn().mockResolvedValue([]),
};

const mockAdminEmpresasService = {
  listarTodas: jest.fn().mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  }),
  suspender: jest.fn().mockResolvedValue({ message: 'ok' }),
  reativar: jest.fn().mockResolvedValue({ message: 'ok' }),
};

const mockAssinaturasService = {
  buscarPorEmpresa: jest.fn().mockResolvedValue({
    id: 'assinatura-1',
    status: 'active',
    valorMensal: 297,
    proximoVencimento: new Date('2026-04-15T00:00:00.000Z'),
    renovacaoAutomatica: true,
    plano: { id: 'plano-1', nome: 'Professional' },
    criadoEm: new Date('2026-03-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-03-07T00:00:00.000Z'),
  }),
  suspender: jest.fn().mockResolvedValue({
    id: 'assinatura-1',
    status: 'suspended',
  }),
  reativar: jest.fn().mockResolvedValue({
    id: 'assinatura-1',
    status: 'active',
  }),
};

const mockAssinaturaDueDateSchedulerService = {
  runDueDateStatusCycle: jest.fn().mockResolvedValue({
    processed: 3,
    activated: 1,
    overdue: 1,
    suspended: 1,
  }),
};

const mockUserActivitiesService = {
  registrarAtividade: jest.fn().mockResolvedValue({ id: 'activity-1' }),
};

const mockGuardianCriticalAuditService = {
  record: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({
    data: [
      {
        id: 10,
        createdAt: new Date('2026-03-07T00:00:00.000Z'),
        actorUserId: 'user-superadmin',
        actorRole: 'superadmin',
        actorEmail: 'superadmin@conect360.local',
        targetType: 'empresa',
        targetId: EMPRESA_ID,
        httpMethod: 'PATCH',
        route: `/guardian/empresas/${EMPRESA_ID}/suspender`,
        statusCode: 200,
        outcome: 'success',
        requestId: 'req-1',
        errorMessage: null,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  }),
  listForExport: jest.fn().mockResolvedValue([
    {
      id: 10,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      actorUserId: 'user-superadmin',
      actorRole: 'superadmin',
      actorEmail: 'superadmin@conect360.local',
      targetType: 'empresa',
      targetId: EMPRESA_ID,
      httpMethod: 'PATCH',
      route: `/guardian/empresas/${EMPRESA_ID}/suspender`,
      statusCode: 200,
      outcome: 'success',
      requestId: 'req-1',
      errorMessage: null,
    },
  ]),
};

describe('Guardian admin operation suite (E2E)', () => {
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
                id: 'user-superadmin',
                nome: 'Guardian Operator',
                email: 'superadmin@conect360.local',
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

  it('executa operacoes principais de empresas, billing e auditoria no namespace guardian', async () => {
    const commonHeaders = {
      'x-test-role': 'superadmin',
      'x-test-permissions': 'users.read,admin.empresas.manage,planos.manage',
      'x-test-mfa-verified': 'true',
    };

    await request(app.getHttpServer())
      .get('/guardian/bff/companies')
      .set(commonHeaders)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/guardian/empresas/${EMPRESA_ID}/suspender`)
      .set(commonHeaders)
      .send({ motivo: 'inadimplencia recorrente' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/guardian/bff/billing/subscriptions')
      .set(commonHeaders)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/guardian/bff/billing/subscriptions/${EMPRESA_ID}/suspend`)
      .set(commonHeaders)
      .send({ reason: 'ajuste operacional validado no suite guardian' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/guardian/bff/billing/subscriptions/jobs/due-date-cycle')
      .set(commonHeaders)
      .expect(201);

    await request(app.getHttpServer())
      .get('/guardian/bff/audit/critical')
      .set(commonHeaders)
      .expect(200);

    const exportResponse = await request(app.getHttpServer())
      .get('/guardian/bff/audit/critical/export?format=csv')
      .set(commonHeaders)
      .expect(200);

    expect(String(exportResponse.body?.data || '')).toContain('"id"');

    expect(mockAdminEmpresasService.suspender).toHaveBeenCalledWith(EMPRESA_ID, 'inadimplencia recorrente');
    expect(mockAssinaturasService.suspender).toHaveBeenCalledWith(EMPRESA_ID);
    expect(mockAssinaturaDueDateSchedulerService.runDueDateStatusCycle).toHaveBeenCalled();
    expect(mockGuardianCriticalAuditService.list).toHaveBeenCalled();
    expect(mockGuardianCriticalAuditService.listForExport).toHaveBeenCalled();
  });
});
