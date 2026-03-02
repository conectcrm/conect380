import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

type AccessReviewSummaryEntry = {
  role: string;
  total: number;
  ativos: number;
  inativos: number;
};

type AccessReviewUser = {
  id: string;
  email: string;
  role: string;
  ativo: boolean;
};

type AccessReviewDetails = {
  categoria?: string;
  evento?: string;
  decision?: string;
  action_taken?: string;
  target_user_id?: string;
  changed_fields?: string[];
};

describe('Users Access Review Recertification (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-users-access-review-${Date.now()}`;

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';

  const users = {
    admin: {
      id: randomUUID(),
      email: `e2e.access.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
      nome: 'Admin Revisao Acesso',
    },
    vendedor: {
      id: randomUUID(),
      email: `e2e.access.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
      nome: 'Vendedor Revisao Acesso',
    },
    suporteInativo: {
      id: randomUUID(),
      email: `e2e.access.suporte.${Date.now()}@conectcrm.local`,
      role: 'suporte',
      nome: 'Suporte Inativo Revisao',
    },
  };

  const tokens = {
    admin: '',
  };

  const parseDetails = (detalhes?: string): AccessReviewDetails | null => {
    if (!detalhes || typeof detalhes !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(detalhes);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as AccessReviewDetails;
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
        CONSTRAINT pk_user_activities_access_review_e2e PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Revisao de Acesso',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Revisao de Acesso',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id as string;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const insertUser = async (id: string, nome: string, email: string, role: string, ativo: boolean) => {
      await dataSource.query(
        `
          INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            senha = EXCLUDED.senha,
            empresa_id = EXCLUDED.empresa_id,
            role = EXCLUDED.role,
            ativo = EXCLUDED.ativo
        `,
        [id, nome, email, senhaHash, empresaId, role, ativo],
      );
    };

    await insertUser(users.admin.id, users.admin.nome, users.admin.email, users.admin.role, true);
    await insertUser(users.vendedor.id, users.vendedor.nome, users.vendedor.email, users.vendedor.role, true);
    await insertUser(
      users.suporteInativo.id,
      users.suporteInativo.nome,
      users.suporteInativo.email,
      users.suporteInativo.role,
      false,
    );

    tokens.admin = await login(users.admin.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('gera relatorio de revisao de acessos por empresa/perfil com filtros', async () => {
    const reportResponse = await request(app.getHttpServer())
      .get('/users/access-review/report?limit=100')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    expect(reportResponse.body?.success).toBe(true);
    expect(reportResponse.body?.data?.empresa_id).toBe(empresaId);

    const summary = reportResponse.body?.data?.summary;
    expect(summary?.total_users).toBeGreaterThanOrEqual(3);
    expect(summary?.active_users).toBeGreaterThanOrEqual(2);

    const byProfile = (summary?.by_profile ?? []) as AccessReviewSummaryEntry[];
    const vendedorSummary = byProfile.find((item) => item.role === 'vendedor');
    const suporteSummary = byProfile.find((item) => item.role === 'suporte');
    expect(vendedorSummary?.total).toBeGreaterThanOrEqual(1);
    expect(suporteSummary?.inativos).toBeGreaterThanOrEqual(1);

    const filteredResponse = await request(app.getHttpServer())
      .get('/users/access-review/report?role=vendedor&include_inactive=false&limit=100')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const filteredUsers = (filteredResponse.body?.data?.users ?? []) as AccessReviewUser[];
    expect(filteredUsers.length).toBeGreaterThanOrEqual(1);
    expect(filteredUsers.every((item) => item.role === 'vendedor')).toBe(true);
    expect(filteredUsers.every((item) => item.ativo === true)).toBe(true);
  });

  it('registra recertificacao de acesso e desativa usuario quando reprovado', async () => {
    const recertifyResponse = await request(app.getHttpServer())
      .post('/users/access-review/recertify')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        target_user_id: users.vendedor.id,
        approved: false,
        reason: 'Recertificacao trimestral: acesso nao mais necessario',
      })
      .expect(201);

    expect(recertifyResponse.body?.success).toBe(true);
    expect(recertifyResponse.body?.data?.decision).toBe('rejected');
    expect(recertifyResponse.body?.data?.action_taken).toBe('deactivated');
    expect(recertifyResponse.body?.data?.target_user?.id).toBe(users.vendedor.id);
    expect(recertifyResponse.body?.data?.target_user?.ativo).toBe(false);

    const persistedUser = await dataSource.query(
      `SELECT ativo FROM users WHERE id = $1 AND empresa_id = $2 LIMIT 1`,
      [users.vendedor.id, empresaId],
    );
    expect(Boolean(persistedUser[0]?.ativo)).toBe(false);

    const activitiesResponse = await request(app.getHttpServer())
      .get(`/users/atividades?usuario_id=${users.admin.id}&tipo=EDICAO&limit=100`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const activities = (activitiesResponse.body ?? []) as Array<{ detalhes?: string }>;
    const recertificationEntry = activities
      .map((activity) => parseDetails(activity.detalhes))
      .find(
        (details) =>
          details?.categoria === 'admin_access_review' &&
          details?.evento === 'access_recertification' &&
          details?.target_user_id === users.vendedor.id,
      );

    expect(recertificationEntry).toBeDefined();
    expect(recertificationEntry?.decision).toBe('rejected');
    expect(recertificationEntry?.action_taken).toBe('deactivated');
    expect(recertificationEntry?.changed_fields ?? []).toContain('ativo');
  });
});
