import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

type AuditItem = {
  id: string;
  detalhes?: string;
};

describe('Admin BFF - AppModule Integration (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-admin-bff-appmodule-${Date.now()}`;

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';

  const users = {
    admin: {
      id: randomUUID(),
      email: `e2e.admin.bff.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
      nome: 'Admin BFF AppModule',
    },
    superadmin: {
      id: randomUUID(),
      email: `e2e.admin.bff.superadmin.${Date.now()}@conectcrm.local`,
      role: 'superadmin',
      nome: 'Superadmin BFF AppModule',
    },
    gerente: {
      id: randomUUID(),
      email: `e2e.admin.bff.gerente.${Date.now()}@conectcrm.local`,
      role: 'gerente',
      nome: 'Gerente BFF AppModule',
    },
    vendedor: {
      id: randomUUID(),
      email: `e2e.admin.bff.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
      nome: 'Vendedor BFF AppModule',
    },
  };

  const tokens = {
    admin: '',
    superadmin: '',
    gerente: '',
    vendedor: '',
  };

  let breakGlassRequestId = '';

  const parseDetails = (detalhes?: string): Record<string, unknown> | null => {
    if (!detalhes || typeof detalhes !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(detalhes);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  };

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD })
      .expect(201);

    return response.body?.data?.access_token as string;
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
      CREATE TABLE IF NOT EXISTS user_activities (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        usuario_id uuid NOT NULL,
        empresa_id uuid NOT NULL,
        tipo character varying(32) NOT NULL DEFAULT 'LOGIN',
        descricao character varying(255) NOT NULL,
        detalhes text,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_user_activities_admin_bff_appmodule PRIMARY KEY (id)
      )
    `);
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
        CONSTRAINT pk_user_access_change_requests_admin_bff_appmodule PRIMARY KEY (id)
      )
    `);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_break_glass_accesses (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        empresa_id uuid NOT NULL,
        target_user_id uuid NOT NULL,
        requested_by_user_id uuid NOT NULL,
        approved_by_user_id uuid,
        revoked_by_user_id uuid,
        status character varying(32) NOT NULL DEFAULT 'REQUESTED',
        scope_permissions text[] NOT NULL DEFAULT ARRAY[]::text[],
        duration_minutes integer NOT NULL,
        request_reason text NOT NULL,
        approval_reason text,
        revocation_reason text,
        requested_at timestamp NOT NULL DEFAULT now(),
        approved_at timestamp,
        starts_at timestamp,
        expires_at timestamp,
        revoked_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_admin_break_glass_accesses_admin_bff_appmodule PRIMARY KEY (id)
      )
    `);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        empresa_id uuid NOT NULL,
        user_id uuid NOT NULL,
        type character varying(50) NOT NULL DEFAULT 'SISTEMA',
        title character varying(255) NOT NULL,
        message text NOT NULL,
        read boolean NOT NULL DEFAULT false,
        data jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        read_at timestamp,
        CONSTRAINT pk_notifications_admin_bff_appmodule PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Admin BFF AppModule',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Admin BFF',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id as string;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const insertUser = async (id: string, nome: string, email: string, role: string) => {
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

    await insertUser(users.admin.id, users.admin.nome, users.admin.email, users.admin.role);
    await insertUser(
      users.superadmin.id,
      users.superadmin.nome,
      users.superadmin.email,
      users.superadmin.role,
    );
    await insertUser(users.gerente.id, users.gerente.nome, users.gerente.email, users.gerente.role);
    await insertUser(
      users.vendedor.id,
      users.vendedor.nome,
      users.vendedor.email,
      users.vendedor.role,
    );

    tokens.admin = await login(users.admin.email);
    tokens.superadmin = await login(users.superadmin.email);
    tokens.gerente = await login(users.gerente.email);
    tokens.vendedor = await login(users.vendedor.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna overview consolidado para perfil administrativo', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/bff/overview')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    expect(response.body?.success).toBe(true);
    expect(response.body?.data?.empresa_id).toBe(empresaId);
    expect(typeof response.body?.data?.pending_access_requests).toBe('number');
    expect(typeof response.body?.data?.admin_security_alerts).toBe('number');
  });

  it('bloqueia acesso ao overview para perfil nao administrativo', async () => {
    await request(app.getHttpServer())
      .get('/admin/bff/overview')
      .set('Authorization', `Bearer ${tokens.vendedor}`)
      .expect(403);
  });

  it('registra evento admin_bff_audit na trilha administrativa', async () => {
    await request(app.getHttpServer())
      .get('/admin/bff/overview')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    let foundAudit = false;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get('/admin/bff/audit/activities?limit=100&admin_only=true')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const items = Array.isArray(response.body?.data) ? (response.body.data as AuditItem[]) : [];
      foundAudit = items.some((item) => {
        const details = parseDetails(item.detalhes);
        return (
          details?.categoria === 'admin_bff_audit' &&
          details?.evento === 'gateway_request' &&
          details?.route === '/admin/bff/overview'
        );
      });

      if (foundAudit) {
        break;
      }

      await sleep(200);
    }

    expect(foundAudit).toBe(true);
  });

  it('bloqueia acesso de gerente ao endpoint de empresas sem elevacao emergencial', async () => {
    await request(app.getHttpServer())
      .get('/admin/bff/companies?page=1&limit=10')
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .expect(403);
  });

  it('aplica break-glass aprovado e remove acesso apos expiracao automatica', async () => {
    const requestResponse = await request(app.getHttpServer())
      .post('/admin/bff/break-glass/requests')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        target_user_id: users.gerente.id,
        permissions: ['admin.empresas.manage'],
        duration_minutes: 20,
        reason: 'Cobertura emergencial para governanca de empresas',
      })
      .expect(201);

    breakGlassRequestId = requestResponse.body?.data?.id as string;
    expect(requestResponse.body?.data?.status).toBe('REQUESTED');

    const approveResponse = await request(app.getHttpServer())
      .post(`/admin/bff/break-glass/requests/${breakGlassRequestId}/approve`)
      .set('Authorization', `Bearer ${tokens.superadmin}`)
      .send({
        reason: 'Aprovacao emergencial em janela controlada',
      })
      .expect(201);

    expect(approveResponse.body?.data?.status).toBe('APPROVED');

    await request(app.getHttpServer())
      .get('/admin/bff/companies?page=1&limit=10')
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .expect(200);

    await dataSource.query(
      `
        UPDATE admin_break_glass_accesses
        SET expires_at = TIMESTAMP '2000-01-01 00:00:00'
        WHERE id = $1
      `,
      [breakGlassRequestId],
    );

    const activeAfterExpiryResponse = await request(app.getHttpServer())
      .get(`/admin/bff/break-glass/active?limit=20&target_user_id=${users.gerente.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const activeAfterExpiry = Array.isArray(activeAfterExpiryResponse.body?.data)
      ? activeAfterExpiryResponse.body.data
      : [];
    expect(activeAfterExpiry.some((entry: { id?: string }) => entry?.id === breakGlassRequestId)).toBe(
      false,
    );

    await request(app.getHttpServer())
      .get('/admin/bff/companies?page=1&limit=10')
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .expect(403);
  });
});
