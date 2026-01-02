import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AdminEmpresasController } from '../../src/modules/admin/controllers/admin-empresas.controller';
import { AdminEmpresasService } from '../../src/modules/admin/services/admin-empresas.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

const mockAdminService = {
  listarTodas: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
  buscarPorId: jest.fn(),
};

describe('AdminEmpresasController – Guards (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminEmpresasController],
      providers: [
        { provide: AdminEmpresasService, useValue: mockAdminService },
        RolesGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          const role = req.headers['x-test-role'];
          if (role) {
            req.user = { role };
          }
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite acesso quando cabeçalho indica superadmin', async () => {
    await request(app.getHttpServer())
      .get('/admin/empresas')
      .set('x-test-role', 'superadmin')
      .expect(200);
  });

  it('nega acesso quando usuário não possui role', async () => {
    await request(app.getHttpServer())
      .get('/admin/empresas')
      .expect(403);
  });

  it('nega acesso quando role não é superadmin', async () => {
    await request(app.getHttpServer())
      .get('/admin/empresas')
      .set('x-test-role', 'admin')
      .expect(403);
  });
});
