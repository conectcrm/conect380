import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Users Dual Approval Workflow (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-users-dual-approval-${Date.now()}`;

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';

  const users = {
    adminRequester: {
      id: randomUUID(),
      email: `e2e.dual.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
    },
    superadminApprover: {
      id: randomUUID(),
      email: `e2e.dual.superadmin.${Date.now()}@conectcrm.local`,
      role: 'superadmin',
    },
    gerenteRequester: {
      id: randomUUID(),
      email: `e2e.dual.gerente.${Date.now()}@conectcrm.local`,
      role: 'gerente',
    },
    vendedorTarget: {
      id: randomUUID(),
      email: `e2e.dual.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
    },
  };

  const tokens = {
    adminRequester: '',
    superadminApprover: '',
    gerenteRequester: '',
  };

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD })
      .expect(201);

    return response.body.data.access_token as string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_access_change_requests (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        empresa_id uuid NOT NULL,
        action character varying(32) NOT NULL,
        status character varying(32) NOT NULL DEFAULT 'REQUESTED',
        requested_by_user_id uuid,
        target_user_id uuid,
        request_payload jsonb NOT NULL,
        request_reason text,
        decided_by_user_id uuid,
        decision_reason text,
        decided_at timestamp,
        applied_user_id uuid,
        applied_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_user_access_change_requests_e2e PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Dupla Aprovacao',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Dupla Aprovacao',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id as string;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const insertUser = async (id: string, email: string, role: string, nome: string) => {
      await dataSource.query(
        `
          INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            senha = EXCLUDED.senha,
            empresa_id = EXCLUDED.empresa_id,
            role = EXCLUDED.role,
            ativo = true
        `,
        [id, nome, email, senhaHash, empresaId, role],
      );
    };

    await insertUser(
      users.adminRequester.id,
      users.adminRequester.email,
      users.adminRequester.role,
      'Admin Requester',
    );
    await insertUser(
      users.superadminApprover.id,
      users.superadminApprover.email,
      users.superadminApprover.role,
      'Superadmin Approver',
    );
    await insertUser(
      users.gerenteRequester.id,
      users.gerenteRequester.email,
      users.gerenteRequester.role,
      'Gerente Requester',
    );
    await insertUser(
      users.vendedorTarget.id,
      users.vendedorTarget.email,
      users.vendedorTarget.role,
      'Vendedor Target',
    );

    tokens.adminRequester = await login(users.adminRequester.email);
    tokens.superadminApprover = await login(users.superadminApprover.email);
    tokens.gerenteRequester = await login(users.gerenteRequester.email);

    await request(app.getHttpServer())
      .put('/empresas/config')
      .set('Authorization', `Bearer ${tokens.superadminApprover}`)
      .send({
        aprovacaoNovoUsuario: true,
      })
      .expect(200);

    const configResponse = await request(app.getHttpServer())
      .get('/empresas/config')
      .set('Authorization', `Bearer ${tokens.superadminApprover}`)
      .expect(200);

    const aprovacaoNovoUsuario =
      configResponse.body?.data?.aprovacaoNovoUsuario ?? configResponse.body?.aprovacaoNovoUsuario;
    expect(Boolean(aprovacaoNovoUsuario)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria usuario sensivel em modo pendente quando politica exige dupla aprovacao', async () => {
    const pendingEmail = `e2e.pending.user.${Date.now()}@conectcrm.local`;

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokens.adminRequester}`)
      .send({
        nome: 'Usuario Pendente E2E',
        email: pendingEmail,
        senha: TEST_PASSWORD,
        role: 'vendedor',
        permissoes: ['crm.leads.read'],
      })
      .expect(201);

    expect(response.body?.success).toBe(true);
    expect(response.body?.data?.status).toBe('REQUESTED');
    expect(response.body?.data?.action).toBe('USER_CREATE');
    expect(response.body?.message).toContain('pendente');
    expect(response.body?.data?.request_payload?.senha).toBe('[REDACTED]');

    const target = await dataSource.query(
      `SELECT id FROM users WHERE empresa_id = $1 AND email = $2 LIMIT 1`,
      [empresaId, pendingEmail],
    );
    expect(target).toHaveLength(0);
  });

  it('lista pendencias de acesso para governanca', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/access-change-requests?status=REQUESTED&limit=20')
      .set('Authorization', `Bearer ${tokens.gerenteRequester}`)
      .expect(200);

    expect(response.body?.success).toBe(true);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].status).toBe('REQUESTED');
  });

  it('bloqueia autoaprovacao da mesma solicitacao', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokens.adminRequester}`)
      .send({
        nome: 'Usuario Auto Aprovacao Bloqueada',
        email: `e2e.auto.approve.blocked.${Date.now()}@conectcrm.local`,
        senha: TEST_PASSWORD,
        role: 'vendedor',
      })
      .expect(201);

    const requestId = createResponse.body?.data?.id as string;
    expect(requestId).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/users/access-change-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${tokens.adminRequester}`)
      .send({ reason: 'Tentativa de autoaprovacao' })
      .expect(403);
  });

  it('aprova solicitacao pendente com segundo aprovador e aplica criacao', async () => {
    const approvedEmail = `e2e.approved.user.${Date.now()}@conectcrm.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokens.adminRequester}`)
      .send({
        nome: 'Usuario Aprovado E2E',
        email: approvedEmail,
        senha: TEST_PASSWORD,
        role: 'vendedor',
      })
      .expect(201);

    const requestId = createResponse.body?.data?.id as string;
    expect(requestId).toBeTruthy();

    const approveResponse = await request(app.getHttpServer())
      .post(`/users/access-change-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${tokens.superadminApprover}`)
      .send({ reason: 'Aprovacao operacional' })
      .expect(201);

    expect(approveResponse.body?.success).toBe(true);
    expect(approveResponse.body?.data?.request?.status).toBe('APPROVED');
    expect(approveResponse.body?.data?.applied_user?.email).toBe(approvedEmail);

    const target = await dataSource.query(
      `SELECT id, email FROM users WHERE empresa_id = $1 AND email = $2 LIMIT 1`,
      [empresaId, approvedEmail],
    );
    expect(target).toHaveLength(1);
  });

  it('rejeita solicitacao sensivel de update sem aplicar alteracao', async () => {
    const before = await dataSource.query(
      `SELECT role FROM users WHERE id = $1 AND empresa_id = $2 LIMIT 1`,
      [users.vendedorTarget.id, empresaId],
    );
    expect(before[0]?.role).toBe('vendedor');

    const updateResponse = await request(app.getHttpServer())
      .put(`/users/${users.vendedorTarget.id}`)
      .set('Authorization', `Bearer ${tokens.gerenteRequester}`)
      .send({
        role: 'suporte',
      })
      .expect(200);

    const requestId = updateResponse.body?.data?.id as string;
    expect(requestId).toBeTruthy();
    expect(updateResponse.body?.data?.status).toBe('REQUESTED');
    expect(updateResponse.body?.data?.action).toBe('USER_UPDATE');

    const rejectResponse = await request(app.getHttpServer())
      .post(`/users/access-change-requests/${requestId}/reject`)
      .set('Authorization', `Bearer ${tokens.superadminApprover}`)
      .send({ reason: 'Mudanca rejeitada na homologacao' })
      .expect(201);

    expect(rejectResponse.body?.success).toBe(true);
    expect(rejectResponse.body?.data?.status).toBe('REJECTED');

    const after = await dataSource.query(
      `SELECT role FROM users WHERE id = $1 AND empresa_id = $2 LIMIT 1`,
      [users.vendedorTarget.id, empresaId],
    );
    expect(after[0]?.role).toBe('vendedor');
  });
});
