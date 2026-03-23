import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Guardian backend bypass hardening (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-guardian-bypass-${Date.now()}`;

  const adminUser = {
    id: '13fbc464-a4a8-43f4-8e16-a8aa7ca0f4e4',
    email: `e2e.guardian.bypass.admin.${Date.now()}@conectcrm.local`,
    nome: 'Admin Guardian Bypass',
    role: 'admin',
  };

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';
  let adminAccessToken = '';

  const tamperJwtRole = (token: string, role: string): string => {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return token;
    }

    const payloadJson = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(payloadJson);
    parsed.role = role;
    const tamperedPayload = Buffer.from(JSON.stringify(parsed)).toString('base64url');
    return `${header}.${tamperedPayload}.${signature}`;
  };

  const loginAndResolveAccessToken = async (email: string): Promise<string> => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD })
      .expect(201);

    if (loginResponse.body?.success === true && loginResponse.body?.data?.access_token) {
      return String(loginResponse.body.data.access_token);
    }

    if (loginResponse.body?.action === 'MFA_REQUIRED') {
      const challengeId = loginResponse.body?.data?.challengeId;
      const devCode = loginResponse.body?.data?.devCode;
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .send({ challengeId, codigo: devCode })
        .expect(201);
      return String(verifyResponse.body?.data?.access_token || '');
    }

    throw new Error('Nao foi possivel autenticar no fluxo e2e de guardian bypass');
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
      CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        token_hash character varying(128) NOT NULL UNIQUE,
        user_id uuid NOT NULL,
        empresa_id uuid NULL,
        expires_at timestamp NOT NULL,
        revoked_at timestamp NULL,
        revoke_reason character varying(80) NULL,
        replaced_by_token_hash character varying(128) NULL,
        requested_ip character varying(45) NULL,
        user_agent text NULL,
        mfa_verified boolean NOT NULL DEFAULT false,
        last_activity_at timestamp NOT NULL DEFAULT now(),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_auth_refresh_tokens_guardian_bypass PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Guardian Bypass',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua Guardian Bypass',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = String(empresa?.[0]?.id || '');

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo, deve_trocar_senha)
        VALUES ($1, $2, $3, $4, $5, $6, true, false)
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          senha = EXCLUDED.senha,
          empresa_id = EXCLUDED.empresa_id,
          role = EXCLUDED.role,
          ativo = true,
          deve_trocar_senha = false
      `,
      [adminUser.id, adminUser.nome, adminUser.email, senhaHash, empresaId, adminUser.role],
    );

    adminAccessToken = await loginAndResolveAccessToken(adminUser.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('nega acesso a guardian/bff mesmo com headers forjados pelo frontend', async () => {
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-test-role', 'superadmin')
      .set('x-test-permissions', 'users.read,admin.empresas.manage')
      .set('x-client-source', 'frontend-tampered')
      .expect(401);
  });

  it('nega acesso a guardian/empresas mesmo com body tentando escalar role', async () => {
    await request(app.getHttpServer())
      .post('/guardian/empresas')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        role: 'superadmin',
        permissions: ['admin.empresas.manage', 'users.read'],
        nome: 'Empresa maliciosa',
      })
      .expect(401);
  });

  it('nega token adulterado com role superadmin no payload JWT', async () => {
    const forgedToken = tamperJwtRole(adminAccessToken, 'superadmin');
    await request(app.getHttpServer())
      .get('/guardian/bff/overview')
      .set('Authorization', `Bearer ${forgedToken}`)
      .expect(401);
  });
});
