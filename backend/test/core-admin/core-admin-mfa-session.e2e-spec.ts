import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Guardian MFA and session hardening (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-guardian-mfa-session-${Date.now()}`;
  const superadminUser = {
    id: 'c8a213df-6680-4e9f-a39e-8b89f1f5f4e0',
    email: `e2e.guardian.mfa.superadmin.${Date.now()}@conectcrm.local`,
    nome: 'Superadmin MFA Session',
    role: 'superadmin',
  };
  const previousAuthAdminMfaRequired = process.env.AUTH_ADMIN_MFA_REQUIRED;
  const previousAuthMfaDevFallback = process.env.AUTH_MFA_DEV_FALLBACK_ENABLED;

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId = '';

  const decodeJwtPayload = (token: string): Record<string, unknown> => {
    const [, payload] = token.split('.');
    if (!payload) {
      return {};
    }
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  };

  beforeAll(async () => {
    process.env.AUTH_ADMIN_MFA_REQUIRED = 'true';
    process.env.AUTH_MFA_DEV_FALLBACK_ENABLED = 'true';

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS mfa_login_challenges (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        empresa_id uuid NULL,
        user_id uuid NOT NULL,
        code_hash character varying(128) NOT NULL,
        expires_at timestamp NOT NULL,
        used_at timestamp NULL,
        failed_attempts integer NOT NULL DEFAULT 0,
        max_attempts integer NOT NULL DEFAULT 5,
        requested_ip character varying(45) NULL,
        user_agent text NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT pk_mfa_login_challenges_guardian_mfa_session PRIMARY KEY (id)
      )
    `);
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
        CONSTRAINT pk_auth_refresh_tokens_guardian_mfa_session PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Guardian MFA Session',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua Guardian MFA',
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
      [superadminUser.id, superadminUser.nome, superadminUser.email, senhaHash, empresaId, superadminUser.role],
    );
  });

  afterAll(async () => {
    await app.close();

    if (previousAuthAdminMfaRequired === undefined) {
      delete process.env.AUTH_ADMIN_MFA_REQUIRED;
    } else {
      process.env.AUTH_ADMIN_MFA_REQUIRED = previousAuthAdminMfaRequired;
    }

    if (previousAuthMfaDevFallback === undefined) {
      delete process.env.AUTH_MFA_DEV_FALLBACK_ENABLED;
    } else {
      process.env.AUTH_MFA_DEV_FALLBACK_ENABLED = previousAuthMfaDevFallback;
    }
  });

  it('exige MFA no login de superadmin e preserva mfa_verified no refresh', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: superadminUser.email, senha: TEST_PASSWORD })
      .expect(201);

    expect(loginResponse.body?.success).toBe(false);
    expect(loginResponse.body?.action).toBe('MFA_REQUIRED');
    expect(loginResponse.body?.data?.challengeId).toBeTruthy();
    expect(loginResponse.body?.data?.devCode).toBeTruthy();

    const verifyResponse = await request(app.getHttpServer())
      .post('/auth/mfa/verify')
      .send({
        challengeId: loginResponse.body.data.challengeId,
        codigo: loginResponse.body.data.devCode,
      })
      .expect(201);

    const accessToken = String(verifyResponse.body?.data?.access_token || '');
    const refreshToken = String(verifyResponse.body?.data?.refresh_token || '');
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const accessPayload = decodeJwtPayload(accessToken);
    expect(accessPayload.mfa_verified).toBe(true);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    const refreshedAccessToken = String(refreshResponse.body?.data?.access_token || '');
    expect(refreshedAccessToken).toBeTruthy();
    expect(decodeJwtPayload(refreshedAccessToken).mfa_verified).toBe(true);
  });
});
