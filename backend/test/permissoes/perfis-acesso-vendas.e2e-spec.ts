import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';

describe('Permissoes por Perfil - Vendas (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-permissoes-vendas-${Date.now()}`;
  const UNKNOWN_UUID = '00000000-0000-4000-8000-000000009999';
  type Perfil = 'admin' | 'gerente' | 'vendedor' | 'suporte' | 'financeiro';
  type HttpMethod = 'post' | 'put' | 'patch' | 'delete';
  const perfis: Perfil[] = ['admin', 'gerente', 'vendedor', 'suporte', 'financeiro'];

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId: string;
  let propostaBaseId = '';
  let writeSequence = 0;

  const users: Record<Perfil, { id: string; email: string; role: Perfil }> = {
    admin: {
      id: randomUUID(),
      email: `e2e.vendas.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
    },
    gerente: {
      id: randomUUID(),
      email: `e2e.vendas.gerente.${Date.now()}@conectcrm.local`,
      role: 'gerente',
    },
    vendedor: {
      id: randomUUID(),
      email: `e2e.vendas.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
    },
    suporte: {
      id: randomUUID(),
      email: `e2e.vendas.suporte.${Date.now()}@conectcrm.local`,
      role: 'suporte',
    },
    financeiro: {
      id: randomUUID(),
      email: `e2e.vendas.financeiro.${Date.now()}@conectcrm.local`,
      role: 'financeiro',
    },
  };

  const tokens: Record<Perfil, string> = {
    admin: '',
    gerente: '',
    vendedor: '',
    suporte: '',
    financeiro: '',
  };
  const authHttpResponseTimeoutMs = Number(
    process.env.E2E_SALES_AUTH_HTTP_RESPONSE_TIMEOUT_MS || 12_000,
  );
  const authHttpDeadlineMs = Number(process.env.E2E_SALES_AUTH_HTTP_DEADLINE_MS || 20_000);
  const authServiceTimeoutMs = Number(process.env.E2E_SALES_AUTH_SERVICE_TIMEOUT_MS || 12_000);
  const appCloseTimeoutMs = Number(process.env.E2E_SALES_APP_CLOSE_TIMEOUT_MS || 60_000);

  const getAs = (token: string, route: string) =>
    request(app.getHttpServer()).get(route).set('Authorization', `Bearer ${token}`);

  const requestAs = (
    token: string,
    method: HttpMethod,
    route: string,
    payload?: Record<string, unknown>,
  ) => {
    const req = request(app.getHttpServer())[method](route).set('Authorization', `Bearer ${token}`);
    return payload === undefined ? req : req.send(payload);
  };

  const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string,
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout em ${label} (${timeoutMs}ms)`)), timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  };

  const extractAccessToken = (response: request.Response | Record<string, any>): string | null => {
    const body = (response as any)?.body ?? response;
    return body?.data?.access_token ?? body?.access_token ?? null;
  };

  const isTransientAuthHttpError = (error: any): boolean => {
    const message = String(error?.message || '');
    return Boolean(error?.timeout) || /timeout|etimedout|socket hang up|econnaborted/i.test(message);
  };

  const getAuthMetadata = () => ({
    ip: '127.0.0.1',
    userAgent: `e2e-permissoes-vendas/${EMPRESA_SLUG}`,
  });

  const emitirTokenDiretoPorSessao = async (email: string): Promise<string> => {
    const usersDb = await dataSource.query(
      `
        SELECT id, email, empresa_id, role
        FROM users
        WHERE lower(email) = lower($1)
        LIMIT 1
      `,
      [email],
    );

    const user = usersDb?.[0];
    if (!user?.id || !user?.empresa_id) {
      throw new Error(`Usuario nao encontrado para fallback de token: ${email}`);
    }

    const sessionId = randomUUID();
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const metadata = getAuthMetadata();

    await dataSource.query(
      `
        INSERT INTO auth_refresh_tokens (
          id,
          token_hash,
          user_id,
          empresa_id,
          expires_at,
          revoked_at,
          revoke_reason,
          replaced_by_token_hash,
          requested_ip,
          user_agent,
          mfa_verified,
          last_activity_at,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4,
          NOW() + interval '30 day',
          NULL, NULL, NULL,
          $5, $6,
          false,
          NOW(),
          NOW(),
          NOW()
        )
      `,
      [sessionId, tokenHash, user.id, user.empresa_id, metadata.ip, metadata.userAgent],
    );

    const jwtService = app.get(JwtService);
    return jwtService.sign({
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role,
      sid: sessionId,
      mfa_verified: false,
    });
  };

  const fazerLoginViaServico = async (email: string): Promise<string> => {
    const authService = app.get(AuthService);
    const metadata = getAuthMetadata();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    try {
      const user = await withTimeout(
        authService.validateUser(normalizedEmail, TEST_PASSWORD, metadata),
        authServiceTimeoutMs,
        'authService.validateUser',
      );
      if (!user) {
        throw new Error(`Falha no login via AuthService para ${email}: credenciais invalidas`);
      }

      const loginResponse = await withTimeout(
        authService.login(user as any, metadata),
        authServiceTimeoutMs,
        'authService.login',
      );
      const tokenDireto = extractAccessToken(loginResponse as Record<string, any>);
      if (tokenDireto) {
        return tokenDireto;
      }

      if ((loginResponse as any)?.action !== 'MFA_REQUIRED') {
        throw new Error(`Token nao retornado no login via AuthService para ${email}`);
      }

      const challengeId = String((loginResponse as any)?.data?.challengeId || '').trim();
      if (!challengeId) {
        throw new Error(`Challenge MFA nao retornado no login via AuthService para ${email}`);
      }

      let codigoMfa = String((loginResponse as any)?.data?.devCode || '').trim();
      if (!codigoMfa) {
        const resendResponse = await withTimeout(
          authService.reenviarCodigoMfaLogin(challengeId, metadata),
          authServiceTimeoutMs,
          'authService.reenviarCodigoMfaLogin',
        );
        codigoMfa = String((resendResponse as any)?.data?.devCode || '').trim();
      }

      if (!codigoMfa) {
        throw new Error(
          `MFA requerido para ${email}, mas devCode nao foi retornado no fallback de AuthService`,
        );
      }

      const verifyResponse = await withTimeout(
        authService.verificarCodigoMfaLogin(challengeId, codigoMfa, metadata),
        authServiceTimeoutMs,
        'authService.verificarCodigoMfaLogin',
      );
      const tokenMfa = extractAccessToken(verifyResponse as Record<string, any>);
      if (!tokenMfa) {
        throw new Error(`Token nao retornado apos MFA no fallback de AuthService para ${email}`);
      }

      return tokenMfa;
    } catch {
      return emitirTokenDiretoPorSessao(normalizedEmail);
    }
  };

  const login = async (email: string): Promise<string> => {
    let response: request.Response;

    try {
      response = await request(app.getHttpServer())
        .post('/auth/login')
        .timeout({
          response: authHttpResponseTimeoutMs,
          deadline: authHttpDeadlineMs,
        })
        .send({ email, senha: TEST_PASSWORD });
    } catch (error: any) {
      if (isTransientAuthHttpError(error)) {
        return fazerLoginViaServico(email);
      }
      throw error;
    }

    if (![200, 201].includes(response.status)) {
      if (response.status >= 500) {
        return fazerLoginViaServico(email);
      }
      throw new Error(`Falha no login para ${email}: status ${response.status}`);
    }

    const tokenDireto = extractAccessToken(response);
    if (tokenDireto) {
      return tokenDireto;
    }

    if (response.body?.action !== 'MFA_REQUIRED') {
      return fazerLoginViaServico(email);
    }

    const challengeId = String(response.body?.data?.challengeId || '').trim();
    if (!challengeId) {
      return fazerLoginViaServico(email);
    }

    let codigoMfa = String(response.body?.data?.devCode || '').trim();

    if (!codigoMfa) {
      let resendResponse: request.Response;
      try {
        resendResponse = await request(app.getHttpServer())
          .post('/auth/mfa/resend')
          .timeout({
            response: authHttpResponseTimeoutMs,
            deadline: authHttpDeadlineMs,
          })
          .send({ challengeId });
      } catch (error: any) {
        if (isTransientAuthHttpError(error)) {
          return fazerLoginViaServico(email);
        }
        throw error;
      }

      if (![200, 201].includes(resendResponse.status)) {
        if (resendResponse.status >= 500) {
          return fazerLoginViaServico(email);
        }
        throw new Error(
          `MFA requerido para ${email}, mas nao foi possivel reenviar codigo (status ${resendResponse.status})`,
        );
      }

      codigoMfa = String(resendResponse.body?.data?.devCode || '').trim();
    }

    if (!codigoMfa) {
      return fazerLoginViaServico(email);
    }

    let verifyResponse: request.Response;
    try {
      verifyResponse = await request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .timeout({
          response: authHttpResponseTimeoutMs,
          deadline: authHttpDeadlineMs,
        })
        .send({
          challengeId,
          codigo: codigoMfa,
        });
    } catch (error: any) {
      if (isTransientAuthHttpError(error)) {
        return fazerLoginViaServico(email);
      }
      throw error;
    }

    if (![200, 201].includes(verifyResponse.status)) {
      if (verifyResponse.status >= 500) {
        return fazerLoginViaServico(email);
      }
      throw new Error(`Falha ao validar MFA para ${email}: status ${verifyResponse.status}`);
    }

    const tokenMfa = extractAccessToken(verifyResponse);
    if (!tokenMfa) {
      return fazerLoginViaServico(email);
    }

    return tokenMfa;
  };

  const assertReadAccess = async (
    route: string,
    allowedPerfis: Perfil[],
    allowedStatuses: number[] = [200],
  ) => {
    const allowedSet = new Set(allowedPerfis);

    for (const perfil of perfis) {
      const response = await getAs(tokens[perfil], route);
      if (allowedSet.has(perfil)) {
        expect(allowedStatuses).toContain(response.status);
      } else {
        expect(response.status).toBe(403);
      }
    }
  };

  const assertWriteAccess = async (
    method: HttpMethod,
    route: string,
    allowedPerfis: Perfil[],
    options?: {
      allowedStatuses?: number[];
      payload?: Record<string, unknown>;
      payloadFactory?: (perfil: Perfil) => Record<string, unknown> | undefined;
    },
  ) => {
    const allowedSet = new Set(allowedPerfis);
    const allowedStatuses = options?.allowedStatuses ?? [200, 201, 204, 400, 404, 409, 422, 501];

    for (const perfil of perfis) {
      const payload = options?.payloadFactory
        ? options.payloadFactory(perfil)
        : options?.payload;
      const response = await requestAs(tokens[perfil], method, route, payload);

      if (allowedSet.has(perfil)) {
        expect(allowedStatuses).toContain(response.status);
      } else {
        expect(response.status).toBe(403);
      }
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Permissoes Vendas',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Permissoes Vendas',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id;

    // Evita bloqueio de autenticacao por politica de assinatura durante E2E local.
    const hasConfiguracoesColumn = await dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'empresas'
          AND column_name = 'configuracoes'
        LIMIT 1
      `,
    );
    if (Array.isArray(hasConfiguracoesColumn) && hasConfiguracoesColumn.length > 0) {
      await dataSource.query(
        `
          UPDATE empresas
          SET configuracoes = (
            COALESCE(configuracoes::jsonb, '{}'::jsonb)
            || '{"isPlatformOwner": true, "billingExempt": true, "billingMonitorOnly": true, "fullModuleAccess": true}'::jsonb
          )::json
          WHERE id = $1
        `,
        [empresaId],
      );
    }

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    for (const perfil of perfis) {
      const user = users[perfil];
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
        [user.id, `Usuario ${user.role}`, user.email, senhaHash, empresaId, user.role],
      );
    }

    tokens.admin = await login(users.admin.email);
    tokens.gerente = await login(users.gerente.email);
    tokens.vendedor = await login(users.vendedor.email);
    tokens.suporte = await login(users.suporte.email);
    tokens.financeiro = await login(users.financeiro.email);

    const propostaBaseResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokens.gerente}`)
      .send({
        titulo: `Proposta Base Vendas E2E ${Date.now()}`,
        cliente: 'Cliente Base Vendas E2E',
        valor: 1000,
      })
      .expect(201);

    propostaBaseId = propostaBaseResponse.body?.proposta?.id;
    if (!propostaBaseId) {
      throw new Error('Nao foi possivel criar proposta base para testes de permissao de vendas');
    }
  });

  afterAll(async () => {
    const closeApp = app?.close?.bind(app);
    if (closeApp) {
      await Promise.race([
        closeApp(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ao encerrar app (${appCloseTimeoutMs}ms)`)), appCloseTimeoutMs),
        ),
      ]).catch(() => undefined);
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy().catch(() => undefined);
    }
  });

  describe('matriz read - vendas', () => {
    const cenarios = [
      {
        nome: 'crm leads',
        route: '/leads',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte'],
      },
      {
        nome: 'crm oportunidades',
        route: '/oportunidades',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
      },
      {
        nome: 'comercial propostas',
        route: '/propostas',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'financeiro'],
      },
      {
        nome: 'comercial contratos',
        route: '/contratos',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'financeiro'],
      },
      {
        nome: 'financeiro faturamento',
        route: '/faturamento/faturas',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro pagamentos configuracoes',
        route: '/pagamentos/gateways/configuracoes',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro pagamentos transacoes',
        route: '/pagamentos/gateways/transacoes',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro fornecedores',
        route: '/fornecedores',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro contas a pagar',
        route: '/contas-pagar',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro contas bancarias',
        route: '/contas-bancarias',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro conciliacao bancaria',
        route: '/conciliacao-bancaria/importacoes',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro alertas operacionais',
        route: '/financeiro/alertas-operacionais',
        allowedPerfis: ['admin', 'financeiro'],
      },
    ] as const;

    for (const cenario of cenarios) {
      it(`${cenario.nome}: permite ${cenario.allowedPerfis.join(', ')} e bloqueia os demais`, async () => {
        await assertReadAccess(cenario.route, [...cenario.allowedPerfis]);
      });
    }
  });

  describe('matriz write - vendas', () => {
    it('comercial.propostas.create', async () => {
      await assertWriteAccess('post', '/propostas', ['admin', 'gerente', 'vendedor'], {
        allowedStatuses: [200, 201],
        payloadFactory: (perfil: Perfil) => {
          writeSequence += 1;
          return {
            titulo: `Proposta Vendas ${perfil} ${writeSequence}`,
            cliente: `Cliente Vendas ${writeSequence}`,
            valor: 1500,
          };
        },
      });
    });

    it('comercial.propostas.update-status', async () => {
      await assertWriteAccess(
        'put',
        `/propostas/${propostaBaseId}/status`,
        ['admin', 'gerente', 'vendedor'],
        {
          allowedStatuses: [200, 400],
          payload: { status: 'enviada' },
        },
      );
    });

    it('comercial.propostas.delete', async () => {
      await assertWriteAccess('delete', `/propostas/${UNKNOWN_UUID}`, ['admin', 'gerente'], {
        allowedStatuses: [200, 404],
      });
    });

    it('financeiro.faturamento.create', async () => {
      await assertWriteAccess('post', '/faturamento/faturas', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.faturamento.update', async () => {
      await assertWriteAccess('put', '/faturamento/faturas/999999', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.faturamento.delete', async () => {
      await assertWriteAccess('delete', '/faturamento/faturas/999999', ['admin', 'financeiro']);
    });

    it('financeiro.pagamentos.configuracoes.create', async () => {
      await assertWriteAccess(
        'post',
        '/pagamentos/gateways/configuracoes',
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.pagamentos.configuracoes.patch', async () => {
      await assertWriteAccess(
        'patch',
        `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.pagamentos.configuracoes.delete', async () => {
      await assertWriteAccess(
        'delete',
        `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
      );
    });

    it('financeiro.pagamentos.transacoes.patch', async () => {
      await assertWriteAccess(
        'patch',
        `/pagamentos/gateways/transacoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.fornecedores.create', async () => {
      await assertWriteAccess('post', '/fornecedores', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.fornecedores.update', async () => {
      await assertWriteAccess('put', `/fornecedores/${UNKNOWN_UUID}`, ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.fornecedores.delete', async () => {
      await assertWriteAccess('delete', `/fornecedores/${UNKNOWN_UUID}`, ['admin', 'financeiro']);
    });

    it('financeiro.contas-pagar.create', async () => {
      await assertWriteAccess('post', '/contas-pagar', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.contas-pagar.registrar-pagamento', async () => {
      await assertWriteAccess(
        'post',
        `/contas-pagar/${UNKNOWN_UUID}/registrar-pagamento`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.contas-pagar.aprovar', async () => {
      await assertWriteAccess('post', `/contas-pagar/${UNKNOWN_UUID}/aprovar`, ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.contas-pagar.aprovacoes.lote', async () => {
      await assertWriteAccess('post', '/contas-pagar/aprovacoes/lote', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.contas-bancarias.create', async () => {
      await assertWriteAccess('post', '/contas-bancarias', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.conciliacao.importar', async () => {
      await assertWriteAccess('post', '/conciliacao-bancaria/importacoes', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.alertas.recalcular', async () => {
      await assertWriteAccess(
        'post',
        '/financeiro/alertas-operacionais/recalcular',
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.alertas.ack', async () => {
      await assertWriteAccess(
        'post',
        `/financeiro/alertas-operacionais/${UNKNOWN_UUID}/ack`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });
  });
});
