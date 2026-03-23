import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

describe('Users Security Alerts (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-users-security-alerts-${Date.now()}`;
  const previousEnv = {
    lockoutEnabled: process.env.AUTH_LOGIN_LOCKOUT_ENABLED,
    maxAttempts: process.env.AUTH_LOCKOUT_MAX_ATTEMPTS,
    durationMinutes: process.env.AUTH_LOCKOUT_DURATION_MINUTES,
  };

  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let empresaId = '';

  const users = {
    adminActor: {
      id: randomUUID(),
      email: `e2e.alert.actor.${Date.now()}@conectcrm.local`,
      role: 'admin',
      nome: 'Admin Ator E2E',
    },
    adminObserver: {
      id: randomUUID(),
      email: `e2e.alert.observer.${Date.now()}@conectcrm.local`,
      role: 'admin',
      nome: 'Admin Observador E2E',
    },
    vendedorTarget: {
      id: randomUUID(),
      email: `e2e.alert.target.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
      nome: 'Usuario Alvo E2E',
    },
  };

  const tokens = {
    adminActor: '',
    adminObserver: '',
  };

  const login = async (email: string, senha: string = TEST_PASSWORD): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha })
      .expect(201);

    return response.body.data.access_token as string;
  };

  const findAlertNotification = (
    notifications: NotificationItem[],
    event: string,
    targetUserId: string,
  ): NotificationItem | undefined => {
    return notifications.find((notification) => {
      const data = notification.data ?? {};
      const category = data.category as string | undefined;
      const alertEvent = data.event as string | undefined;
      const targetUser =
        data.target_user && typeof data.target_user === 'object'
          ? (data.target_user as Record<string, unknown>)
          : null;

      return (
        category === 'admin_security_alert' &&
        alertEvent === event &&
        targetUser?.id === targetUserId
      );
    });
  };

  beforeAll(async () => {
    process.env.AUTH_LOGIN_LOCKOUT_ENABLED = 'true';
    process.env.AUTH_LOCKOUT_MAX_ATTEMPTS = '3';
    process.env.AUTH_LOCKOUT_DURATION_MINUTES = '1';

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);
    authService = app.get(AuthService);

    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS auth_login_attempts (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        identity character varying(255) NOT NULL,
        failed_attempts integer NOT NULL DEFAULT 0,
        consecutive_lockouts integer NOT NULL DEFAULT 0,
        first_failed_at timestamp NULL,
        last_failed_at timestamp NULL,
        locked_until timestamp NULL,
        last_ip character varying(45) NULL,
        last_user_agent text NULL,
        user_id uuid NULL,
        empresa_id uuid NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_auth_login_attempts_identity_e2e UNIQUE (identity),
        CONSTRAINT pk_auth_login_attempts_e2e PRIMARY KEY (id)
      )
    `);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Alerts',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Alerts',
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

    await insertUser(
      users.adminActor.id,
      users.adminActor.nome,
      users.adminActor.email,
      users.adminActor.role,
    );
    await insertUser(
      users.adminObserver.id,
      users.adminObserver.nome,
      users.adminObserver.email,
      users.adminObserver.role,
    );
    await insertUser(
      users.vendedorTarget.id,
      users.vendedorTarget.nome,
      users.vendedorTarget.email,
      users.vendedorTarget.role,
    );

    tokens.adminActor = await login(users.adminActor.email);
    tokens.adminObserver = await login(users.adminObserver.email);
  });

  afterAll(async () => {
    process.env.AUTH_LOGIN_LOCKOUT_ENABLED = previousEnv.lockoutEnabled;
    process.env.AUTH_LOCKOUT_MAX_ATTEMPTS = previousEnv.maxAttempts;
    process.env.AUTH_LOCKOUT_DURATION_MINUTES = previousEnv.durationMinutes;
    await app.close();
  });

  it('emite alerta de elevacao de privilegio com severidade e canal definidos', async () => {
    await request(app.getHttpServer())
      .put(`/users/${users.vendedorTarget.id}`)
      .set('Authorization', `Bearer ${tokens.adminActor}`)
      .send({
        role: 'gerente',
      })
      .expect(200);

    const notificationsResponse = await request(app.getHttpServer())
      .get('/notifications?onlyUnread=true')
      .set('Authorization', `Bearer ${tokens.adminObserver}`)
      .expect(200);

    const notifications = notificationsResponse.body as NotificationItem[];
    const alert = findAlertNotification(notifications, 'privilege_escalation', users.vendedorTarget.id);
    expect(alert).toBeDefined();
    expect(alert?.data?.severity).toBe('high');
    expect(alert?.data?.channel).toBe('in_app_notification');
  });

  it('emite alerta de falha de autenticacao ao bloquear conta administrativa', async () => {
    const wrongPassword = 'senha-incorreta';
    const metadata = {
      ip: '203.0.113.10',
      userAgent: 'e2e-lockout-agent',
    };

    for (let i = 0; i < 3; i += 1) {
      const result = await authService.validateUser(
        users.adminActor.email,
        wrongPassword,
        metadata,
      );
      expect(result).toBeNull();
    }

    const notificationsResponse = await request(app.getHttpServer())
      .get('/notifications?onlyUnread=true')
      .set('Authorization', `Bearer ${tokens.adminObserver}`)
      .expect(200);

    const notifications = notificationsResponse.body as NotificationItem[];
    const alert = findAlertNotification(notifications, 'auth_login_lockout', users.adminActor.id);
    expect(alert).toBeDefined();
    expect(['high', 'critical']).toContain(alert?.data?.severity as string);
    expect(alert?.data?.channel).toBe('in_app_notification');
  });
});
