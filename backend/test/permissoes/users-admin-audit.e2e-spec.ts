import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

type ActivityItem = {
  id: string;
  tipo: string;
  descricao: string;
  detalhes?: string;
};

type AdminAuditDetails = {
  categoria?: string;
  evento?: string;
  target_user_id?: string;
  actor?: {
    id?: string;
    nome?: string | null;
    email?: string | null;
  } | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changed_fields?: string[];
};

describe('Users Admin Audit Trail (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-users-admin-audit-${Date.now()}`;

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';

  const users = {
    admin: {
      id: randomUUID(),
      email: `e2e.audit.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
      nome: 'Admin Auditoria E2E',
    },
  };

  const tokens = {
    admin: '',
  };

  const parseAuditDetails = (detalhes?: string): AdminAuditDetails | null => {
    if (!detalhes || typeof detalhes !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(detalhes);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as AdminAuditDetails;
    } catch {
      return null;
    }
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
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_activities_tipo_enum') THEN
          CREATE TYPE user_activities_tipo_enum AS ENUM (
            'LOGIN',
            'LOGOUT',
            'CRIACAO',
            'EDICAO',
            'EXCLUSAO',
            'ALTERACAO_STATUS',
            'RESET_SENHA'
          );
        END IF;
      END
      $$;
    `);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        usuario_id uuid NOT NULL,
        empresa_id uuid NOT NULL,
        tipo user_activities_tipo_enum NOT NULL DEFAULT 'LOGIN',
        descricao character varying(255) NOT NULL,
        detalhes text,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_user_activities_e2e PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Auditoria Admin',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Auditoria Admin',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id as string;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
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
      [users.admin.id, users.admin.nome, users.admin.email, senhaHash, empresaId, users.admin.role],
    );

    tokens.admin = await login(users.admin.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra before/after em create/update/reset/status e permite filtros de auditoria', async () => {
    const createdEmail = `e2e.audit.user.${Date.now()}@conectcrm.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        nome: 'Usuario Auditoria E2E',
        email: createdEmail,
        senha: TEST_PASSWORD,
        role: 'vendedor',
        permissoes: ['crm.leads.read'],
      })
      .expect(201);

    const targetUserId = createResponse.body?.data?.id as string;
    expect(targetUserId).toBeTruthy();

    await request(app.getHttpServer())
      .put(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        nome: 'Usuario Auditoria Atualizado E2E',
        role: 'suporte',
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/users/${targetUserId}/reset-senha`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({})
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ ativo: false })
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get(`/users/atividades?usuario_id=${users.admin.id}&limit=100`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const activities = (listResponse.body ?? []) as ActivityItem[];
    expect(Array.isArray(activities)).toBe(true);

    const auditEntries = activities
      .map((activity) => ({
        activity,
        details: parseAuditDetails(activity.detalhes),
      }))
      .filter(
        (entry) =>
          entry.details?.categoria === 'admin_user_audit' &&
          entry.details?.target_user_id === targetUserId,
      );

    expect(auditEntries.length).toBeGreaterThanOrEqual(4);

    const eventMap = new Map<string, { activity: ActivityItem; details: AdminAuditDetails }>();
    for (const entry of auditEntries) {
      if (entry.details?.evento) {
        eventMap.set(entry.details.evento, entry as { activity: ActivityItem; details: AdminAuditDetails });
      }
    }

    const createdAudit = eventMap.get('user_create');
    expect(createdAudit).toBeDefined();
    expect(createdAudit?.details?.actor?.id).toBe(users.admin.id);
    expect(createdAudit?.details?.before).toBeNull();
    expect(createdAudit?.details?.after?.email).toBe(createdEmail);
    expect(createdAudit?.details?.changed_fields).toContain('email');

    const updatedAudit = eventMap.get('user_update');
    expect(updatedAudit).toBeDefined();
    expect(updatedAudit?.details?.actor?.id).toBe(users.admin.id);
    expect(updatedAudit?.details?.before?.nome).toBe('Usuario Auditoria E2E');
    expect(updatedAudit?.details?.after?.nome).toBe('Usuario Auditoria Atualizado E2E');
    expect(updatedAudit?.details?.changed_fields).toEqual(expect.arrayContaining(['nome', 'role']));

    const resetAudit = eventMap.get('user_password_reset');
    expect(resetAudit).toBeDefined();
    expect(resetAudit?.details?.actor?.id).toBe(users.admin.id);
    expect(resetAudit?.details?.changed_fields).toContain('deve_trocar_senha');

    const statusAudit = eventMap.get('user_status_change');
    expect(statusAudit).toBeDefined();
    expect(statusAudit?.details?.actor?.id).toBe(users.admin.id);
    expect(statusAudit?.details?.before?.ativo).toBe(true);
    expect(statusAudit?.details?.after?.ativo).toBe(false);
    expect(statusAudit?.details?.changed_fields).toContain('ativo');

    const resetFilterResponse = await request(app.getHttpServer())
      .get(`/users/atividades?usuario_id=${users.admin.id}&tipo=RESET_SENHA&limit=50`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const resetActivities = (resetFilterResponse.body ?? []) as ActivityItem[];
    const resetAuditForTarget = resetActivities.some((item) => {
      const details = parseAuditDetails(item.detalhes);
      return (
        details?.categoria === 'admin_user_audit' &&
        details?.evento === 'user_password_reset' &&
        details?.target_user_id === targetUserId
      );
    });
    expect(resetAuditForTarget).toBe(true);

    const dataInicio = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const dataFim = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const dateFilterResponse = await request(app.getHttpServer())
      .get(
        `/users/atividades?usuario_id=${users.admin.id}&data_inicio=${encodeURIComponent(
          dataInicio,
        )}&data_fim=${encodeURIComponent(dataFim)}&limit=100`,
      )
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const dateFiltered = (dateFilterResponse.body ?? []) as ActivityItem[];
    expect(dateFiltered.length).toBeGreaterThan(0);
  });
});
