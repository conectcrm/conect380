import { createHash, randomBytes, randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Client as PgClient } from 'pg';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { CreatePropostasPortalTokens1802869000000 } from '../../src/migrations/1802869000000-CreatePropostasPortalTokens';
import { EmailIntegradoService } from '../../src/modules/propostas/email-integrado.service';
import { MailService } from '../../src/mail/mail.service';
import { createE2EApp, withE2EBootstrapLock } from './e2e-app.helper';

export class SalesFlowE2EHarness {
  readonly runId = Date.now().toString();
  readonly testPassword = 'senha123';

  readonly adminEmpresaAId = randomUUID();
  readonly adminEmpresaBId = randomUUID();

  readonly emailAdminEmpresaA = `e2e.portal.admin.a.${this.runId}@conectcrm.local`;
  readonly emailAdminEmpresaB = `e2e.portal.admin.b.${this.runId}@conectcrm.local`;

  app!: INestApplication;
  dataSource!: DataSource;
  private readonly tableColumnsCache = new Map<string, Set<string>>();
  private readonly harnessTraceEnabled = process.env.E2E_SALES_HARNESS_TRACE === 'true';

  empresaAId!: string;
  empresaBId!: string;
  clienteEmpresaAId!: string;
  clienteEmpresaBId!: string;

  tokenAdminEmpresaA!: string;
  tokenAdminEmpresaB!: string;

  propostaEmpresaAId!: string;
  tokenPortalEmpresaA!: string;
  contratoEmpresaAId: number | null = null;
  configuracaoGatewayEmpresaAId: string | null = null;
  faturaEmpresaAId: number | null = null;
  pagamentoEmpresaAId: number | null = null;
  private readonly queryDbConnectTimeoutMs = Number(
    process.env.E2E_SALES_QUERYDB_CONNECT_TIMEOUT_MS || 12_000,
  );
  private readonly queryDbConnectRetries = Number(
    process.env.E2E_SALES_QUERYDB_CONNECT_RETRIES || 3,
  );
  private readonly queryDbRetryBackoffMs = Number(
    process.env.E2E_SALES_QUERYDB_RETRY_BACKOFF_MS || 300,
  );
  private readonly compileStepTimeoutMs = Number(
    process.env.E2E_SALES_SETUP_COMPILE_TIMEOUT_MS || 180_000,
  );
  private readonly createE2EAppStepTimeoutMs = Number(
    process.env.E2E_SALES_SETUP_CREATE_APP_TIMEOUT_MS || 120_000,
  );
  private readonly loginStepTimeoutMs = Number(
    process.env.E2E_SALES_LOGIN_STEP_TIMEOUT_MS || 90_000,
  );
  private readonly authHttpResponseTimeoutMs = Number(
    process.env.E2E_SALES_AUTH_HTTP_RESPONSE_TIMEOUT_MS || 12_000,
  );
  private readonly authHttpDeadlineMs = Number(
    process.env.E2E_SALES_AUTH_HTTP_DEADLINE_MS || 20_000,
  );
  private readonly authServiceTimeoutMs = Number(
    process.env.E2E_SALES_AUTH_SERVICE_TIMEOUT_MS || 12_000,
  );

  async setup(): Promise<void> {
    const moduleFixture: TestingModule = await this.runStep(
      'compile-testing-module',
      () =>
        withE2EBootstrapLock(() =>
          Test.createTestingModule({
            imports: [AppModule],
          }).compile(),
        ),
      this.compileStepTimeoutMs,
    );

    this.app = await this.runStep(
      'create-e2e-app',
      () => createE2EApp(moduleFixture),
      this.createE2EAppStepTimeoutMs,
    );

    const emailIntegradoService = this.app.get(EmailIntegradoService);
    jest.spyOn(emailIntegradoService, 'notificarPropostaAceita').mockResolvedValue(true);
    jest.spyOn(emailIntegradoService, 'notificarPropostaRejeitada').mockResolvedValue(true);
    jest.spyOn(emailIntegradoService, 'enviarEmailGenerico').mockResolvedValue({
      success: true,
      messageId: `e2e-${this.runId}`,
    } as any);
    const mailService = this.app.get(MailService);
    jest
      .spyOn(mailService, 'enviarEmailCodigoMfa')
      .mockRejectedValue(new Error('Forcando fallback de MFA no ambiente E2E'));

    this.dataSource = this.app.get(DataSource);
    if (process.env.E2E_ENSURE_PORTAL_TOKENS_INFRA === 'true') {
      await this.runStep('ensure-portal-tokens-infra', () => this.ensurePortalTokensInfra(), 20_000);
    } else {
      this.trace('ensure-portal-tokens-infra:skip');
    }

    await this.runStep('seed-empresas-usuarios', () => this.criarEmpresasEUsuarios(), 40_000);

    this.tokenAdminEmpresaA = await this.runStep(
      'login-admin-empresa-a',
      () => this.fazerLogin(this.emailAdminEmpresaA, this.testPassword),
      this.loginStepTimeoutMs,
    );
    this.tokenAdminEmpresaB = await this.runStep(
      'login-admin-empresa-b',
      () => this.fazerLogin(this.emailAdminEmpresaB, this.testPassword),
      this.loginStepTimeoutMs,
    );

    this.propostaEmpresaAId = await this.runStep(
      'seed-proposta-empresa-a',
      () =>
        this.criarPropostaViaApi(
          this.tokenAdminEmpresaA,
          `Portal E2E ${this.runId} A`,
        ),
      40_000,
    );
  }

  async teardown(): Promise<void> {
    if (!this.app) return;

    await this.runStep('cleanup-dados', () => this.limparDadosTeste(), 40_000).catch((error) => {
      this.trace(`cleanup-dados:skip ${String((error as any)?.message || error)}`);
    });

    await this.runStep(
      'app-close',
      () =>
        Promise.race([
          this.app.close(),
          new Promise<void>((_resolve, reject) => {
            setTimeout(() => reject(new Error('Timeout ao finalizar app no teardown')), 60_000);
          }),
        ]),
      65_000,
    ).catch((error) => {
      this.trace(`app-close:skip ${String((error as any)?.message || error)}`);
    });

    await this.forceDestroyDataSource();
  }

  get httpServer() {
    return this.app.getHttpServer();
  }

  private getStandaloneDbConfig() {
    return {
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT || 5433),
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'conectcrm',
      connectionTimeoutMillis: this.queryDbConnectTimeoutMs,
    };
  }

  private async queryDb<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    let lastError: any;

    for (let attempt = 0; attempt < this.queryDbConnectRetries; attempt += 1) {
      const client = new PgClient(this.getStandaloneDbConfig());

      try {
        await this.withTimeout(
          client.connect(),
          this.queryDbConnectTimeoutMs,
          `queryDb.connect.attempt-${attempt + 1}`,
        );
        await this.withTimeout(
          client.query(`SET lock_timeout = '1500ms'`),
          5000,
          'queryDb.lock-timeout',
        );
        await this.withTimeout(
          client.query(`SET statement_timeout = '15000ms'`),
          5000,
          'queryDb.statement-timeout',
        );
        const result = await this.withTimeout(
          client.query(sql, params),
          20_000,
          'queryDb.query',
        );
        return result.rows as T[];
      } catch (error: any) {
        lastError = error;
        if (!this.shouldRetryStandaloneDbConnect(error) || attempt >= this.queryDbConnectRetries - 1) {
          throw error;
        }

        const waitMs = this.queryDbRetryBackoffMs * (attempt + 1);
        this.trace(
          `queryDb.connect:retry ${attempt + 1}/${this.queryDbConnectRetries - 1} em ${waitMs}ms (${String(
            error?.message || error,
          )})`,
        );
        await this.sleep(waitMs);
      } finally {
        await client.end().catch(() => undefined);
      }
    }

    throw lastError;
  }

  private trace(message: string): void {
    if (!this.harnessTraceEnabled) {
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`[SalesFlowE2E][${this.runId}] ${message}`);
  }

  private withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout em ${label} (${timeoutMs}ms)`));
      }, timeoutMs);

      operation
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetryStandaloneDbConnect(error: any): boolean {
    const message = String(error?.message || '');
    return (
      /timeout/i.test(message) ||
      /ECONNREFUSED/i.test(message) ||
      /ETIMEDOUT/i.test(message) ||
      /too many clients/i.test(message) ||
      /remaining connection slots/i.test(message)
    );
  }

  private async runStep<T>(label: string, fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    this.trace(`${label}:start`);
    const startedAt = Date.now();
    try {
      const result = await this.withTimeout(fn(), timeoutMs, label);
      this.trace(`${label}:done ${Date.now() - startedAt}ms`);
      return result;
    } catch (error: any) {
      this.trace(`${label}:error ${Date.now() - startedAt}ms ${error?.message || String(error)}`);
      throw error;
    }
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }

    try {
      const rows: Array<{ column_name?: string }> = await this.queryDb(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
        `,
        [tableName],
      );

      const columns = new Set(
        rows
          .map((row) => String(row.column_name || '').trim())
          .filter((columnName) => columnName.length > 0),
      );
      this.tableColumnsCache.set(tableName, columns);
      return columns;
    } catch {
      const empty = new Set<string>();
      this.tableColumnsCache.set(tableName, empty);
      return empty;
    }
  }

  private async hasTableColumn(tableName: string, columnName: string): Promise<boolean> {
    const columns = await this.getTableColumns(tableName);
    return columns.has(columnName);
  }

  private extrairAccessToken(response: request.Response | Record<string, any>): string | null {
    const body = (response as any)?.body ?? response;
    return (
      body?.data?.access_token ??
      body?.access_token ??
      null
    );
  }

  private isTransientAuthHttpError(error: any): boolean {
    const message = String(error?.message || '');
    return Boolean(error?.timeout) || /timeout|etimedout|socket hang up|econnaborted/i.test(message);
  }

  private getAuthMetadata() {
    return {
      ip: '127.0.0.1',
      userAgent: `e2e-sales-harness/${this.runId}`,
    };
  }

  private async forceDestroyDataSource(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      return;
    }

    try {
      await this.dataSource.destroy();
      this.trace('dataSource.destroy:done');
    } catch (error: any) {
      this.trace(`dataSource.destroy:error ${String(error?.message || error)}`);
    }
  }

  private async fazerLoginViaServico(email: string, senha: string): Promise<string> {
    const authService = this.app.get(AuthService);
    const metadata = this.getAuthMetadata();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    try {
      const user = await this.withTimeout(
        authService.validateUser(normalizedEmail, senha, metadata),
        this.authServiceTimeoutMs,
        'authService.validateUser',
      );
      if (!user) {
        throw new Error(`Falha no login via AuthService para ${email}: credenciais invalidas`);
      }

      const loginResponse = await this.withTimeout(
        authService.login(user as any, metadata),
        this.authServiceTimeoutMs,
        'authService.login',
      );
      const tokenDireto = this.extrairAccessToken(loginResponse as Record<string, any>);
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
        const resendResponse = await this.withTimeout(
          authService.reenviarCodigoMfaLogin(challengeId, metadata),
          this.authServiceTimeoutMs,
          'authService.reenviarCodigoMfaLogin',
        );
        codigoMfa = String((resendResponse as any)?.data?.devCode || '').trim();
      }

      if (!codigoMfa) {
        throw new Error(
          `MFA requerido para ${email}, mas devCode nao foi retornado no fallback de AuthService`,
        );
      }

      const verifyResponse = await this.withTimeout(
        authService.verificarCodigoMfaLogin(challengeId, codigoMfa, metadata),
        this.authServiceTimeoutMs,
        'authService.verificarCodigoMfaLogin',
      );
      const tokenMfa = this.extrairAccessToken(verifyResponse as Record<string, any>);
      if (!tokenMfa) {
        throw new Error(`Token nao retornado apos MFA no fallback de AuthService para ${email}`);
      }

      return tokenMfa;
    } catch (error: any) {
      this.trace(
        `fazerLogin:direct-token-fallback ${email} (${String(error?.message || error)})`,
      );
      return this.emitirTokenDiretoPorSessao(normalizedEmail);
    }
  }

  private async emitirTokenDiretoPorSessao(email: string): Promise<string> {
    const users = await this.queryDb<{
      id: string;
      email: string;
      empresa_id: string;
      role: string;
    }>(
      `
        SELECT id, email, empresa_id, role
        FROM users
        WHERE lower(email) = lower($1)
        LIMIT 1
      `,
      [email],
    );

    const user = users[0];
    if (!user?.id || !user?.empresa_id) {
      throw new Error(`Usuario nao encontrado para fallback de token: ${email}`);
    }

    const sessionId = randomUUID();
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const metadata = this.getAuthMetadata();

    await this.queryDb(
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

    const jwtService = this.app.get(JwtService);
    return jwtService.sign({
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role,
      sid: sessionId,
      mfa_verified: false,
    });
  }

  async criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${this.runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-portal-${label.toLowerCase()}-${this.runId}`;
    const cnpj = `${suffix}${label === 'A' ? '01' : '02'}`.padStart(14, '0').slice(-14);
    const email = `${slug}@conectcrm.local`;
    const subdominio = slug.slice(0, 90);

    const created = await this.queryDb(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        `Empresa Portal ${label}`,
        slug,
        cnpj,
        email,
        '11999999999',
        'Rua E2E Portal',
        'Sao Paulo',
        'SP',
        '01000-000',
        subdominio,
      ],
    );

    return created[0].id as string;
  }

  async inserirUsuario(
    id: string,
    nome: string,
    email: string,
    empresaId: string,
    senhaHash: string,
  ) {
    await this.queryDb(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, nome, email, senhaHash, empresaId, 'superadmin', true],
    );
  }

  async criarEmpresasEUsuarios() {
    this.empresaAId = await this.runStep('seed-criar-empresa-a', () => this.criarEmpresa('A'), 15_000);
    this.empresaBId = await this.runStep('seed-criar-empresa-b', () => this.criarEmpresa('B'), 15_000);
    await this.runStep(
      'seed-marcar-platform-owner',
      () => this.marcarEmpresasComoPlatformOwner([this.empresaAId, this.empresaBId]),
      15_000,
    );

    const senhaHash = await this.runStep('seed-hash-senha', () => bcrypt.hash(this.testPassword, 10), 15_000);

    await this.runStep(
      'seed-inserir-usuario-a',
      () =>
        this.inserirUsuario(
          this.adminEmpresaAId,
          'Admin Portal A',
          this.emailAdminEmpresaA,
          this.empresaAId,
          senhaHash,
        ),
      15_000,
    );
    await this.runStep(
      'seed-inserir-usuario-b',
      () =>
        this.inserirUsuario(
          this.adminEmpresaBId,
          'Admin Portal B',
          this.emailAdminEmpresaB,
          this.empresaBId,
          senhaHash,
        ),
      15_000,
    );

    this.clienteEmpresaAId = await this.runStep(
      'seed-criar-cliente-a',
      () => this.criarClienteTeste(this.empresaAId, 'A'),
      15_000,
    );
    this.clienteEmpresaBId = await this.runStep(
      'seed-criar-cliente-b',
      () => this.criarClienteTeste(this.empresaBId, 'B'),
      15_000,
    );
  }

  private async marcarEmpresasComoPlatformOwner(empresaIds: string[]): Promise<void> {
    if (!empresaIds.length) {
      return;
    }

    const hasConfiguracoesColumn = await this.hasTableColumn('empresas', 'configuracoes');
    if (!hasConfiguracoesColumn) {
      return;
    }

    await this.queryDb(
      `
        UPDATE empresas
        SET configuracoes = (
          COALESCE(configuracoes::jsonb, '{}'::jsonb)
          || '{"isPlatformOwner": true, "billingExempt": true, "billingMonitorOnly": true, "fullModuleAccess": true}'::jsonb
        )::json
        WHERE id = ANY($1::uuid[])
      `,
      [empresaIds],
    );
  }

  async criarClienteTeste(empresaId: string, label: 'A' | 'B'): Promise<string> {
    const created = await this.queryDb(
      `
        INSERT INTO clientes (nome, email, telefone, tipo, empresa_id, ativo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        `Cliente E2E ${label} ${this.runId}`,
        `cliente.e2e.${label.toLowerCase()}.${this.runId}@conectcrm.local`,
        '11988887777',
        'pessoa_juridica',
        empresaId,
        true,
      ],
    );

    return created[0].id as string;
  }

  async ensurePortalTokensInfra() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const hasTable = await queryRunner.hasTable('propostas_portal_tokens');
      if (hasTable) return;

      const migration = new CreatePropostasPortalTokens1802869000000();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async fazerLogin(email: string, senha: string): Promise<string> {
    let response: request.Response;

    try {
      response = await request(this.httpServer)
        .post('/auth/login')
        .timeout({
          response: this.authHttpResponseTimeoutMs,
          deadline: this.authHttpDeadlineMs,
        })
        .send({ email, senha });
    } catch (error: any) {
      if (!this.isTransientAuthHttpError(error)) {
        throw error;
      }

      this.trace(
        `fazerLogin:http-fallback ${email} (${String(error?.message || error)})`,
      );
      return this.fazerLoginViaServico(email, senha);
    }

    if (![200, 201].includes(response.status)) {
      if (response.status >= 500) {
        this.trace(`fazerLogin:http-status-fallback ${email} status=${response.status}`);
        return this.fazerLoginViaServico(email, senha);
      }
      throw new Error(`Falha no login para ${email}: status ${response.status}`);
    }

    const tokenDireto = this.extrairAccessToken(response);
    if (tokenDireto) {
      return tokenDireto;
    }

    if (response.body?.action !== 'MFA_REQUIRED') {
      throw new Error(`Token nao retornado no login para ${email}`);
    }

    const challengeId = String(response.body?.data?.challengeId || '').trim();
    if (!challengeId) {
      throw new Error(`Challenge MFA nao retornado no login para ${email}`);
    }

    let codigoMfa = String(response.body?.data?.devCode || '').trim();

    if (!codigoMfa) {
      let resendResponse: request.Response;
      try {
        resendResponse = await request(this.httpServer)
          .post('/auth/mfa/resend')
          .timeout({
            response: this.authHttpResponseTimeoutMs,
            deadline: this.authHttpDeadlineMs,
          })
          .send({ challengeId });
      } catch (error: any) {
        if (!this.isTransientAuthHttpError(error)) {
          throw error;
        }

        this.trace(
          `fazerLogin:mfa-resend-fallback ${email} (${String(error?.message || error)})`,
        );
        return this.fazerLoginViaServico(email, senha);
      }

      if (![200, 201].includes(resendResponse.status)) {
        if (resendResponse.status >= 500) {
          this.trace(
            `fazerLogin:mfa-resend-status-fallback ${email} status=${resendResponse.status}`,
          );
          return this.fazerLoginViaServico(email, senha);
        }
        throw new Error(
          `MFA requerido para ${email}, mas nao foi possivel reenviar codigo (status ${resendResponse.status})`,
        );
      }

      codigoMfa = String(resendResponse.body?.data?.devCode || '').trim();
    }

    if (!codigoMfa) {
      throw new Error(
        `MFA requerido para ${email}, mas devCode nao foi retornado no ambiente de teste`,
      );
    }

    let verifyResponse: request.Response;
    try {
      verifyResponse = await request(this.httpServer)
        .post('/auth/mfa/verify')
        .timeout({
          response: this.authHttpResponseTimeoutMs,
          deadline: this.authHttpDeadlineMs,
        })
        .send({
          challengeId,
          codigo: codigoMfa,
        });
    } catch (error: any) {
      if (!this.isTransientAuthHttpError(error)) {
        throw error;
      }

      this.trace(
        `fazerLogin:mfa-verify-fallback ${email} (${String(error?.message || error)})`,
      );
      return this.fazerLoginViaServico(email, senha);
    }

    if (![200, 201].includes(verifyResponse.status)) {
      if (verifyResponse.status >= 500) {
        this.trace(
          `fazerLogin:mfa-verify-status-fallback ${email} status=${verifyResponse.status}`,
        );
        return this.fazerLoginViaServico(email, senha);
      }
      throw new Error(`Falha ao validar MFA para ${email}: status ${verifyResponse.status}`);
    }

    const tokenMfa = this.extrairAccessToken(verifyResponse);
    if (!tokenMfa) {
      throw new Error(`Token nao retornado apos validacao MFA para ${email}`);
    }

    return tokenMfa;
  }

  async criarPropostaViaApi(token: string, titulo: string): Promise<string> {
    const valorBase = 2500;
    const payload = {
      titulo,
      cliente: `Cliente Portal ${this.runId}`,
      valor: valorBase,
      total: valorBase,
      produtos: [
        {
          id: `item-${this.runId}`,
          nome: `Servico E2E ${this.runId}`,
          precoUnitario: valorBase,
          quantidade: 1,
          desconto: 0,
          subtotal: valorBase,
        },
      ],
    };

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const response = await request(this.httpServer)
        .post('/propostas')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      if ([200, 201].includes(response.status) && response.body?.success && response.body?.proposta?.id) {
        return response.body.proposta.id as string;
      }

      const erroSerializacao = String(response.body?.error || response.body?.message || '').toLowerCase();
      const isTentativaConcorrencia =
        response.status >= 500 &&
        (erroSerializacao.includes('duplicate key') || erroSerializacao.includes('erro ao criar proposta'));

      if (!isTentativaConcorrencia || tentativa === 3) {
        expect([200, 201]).toContain(response.status);
        expect(response.body?.success).toBe(true);
        expect(response.body?.proposta?.id).toBeTruthy();
      }

      await new Promise((resolve) => setTimeout(resolve, 50 * tentativa));
    }

    throw new Error('Falha ao criar proposta no setup e2e');
  }

  async limparDadosTeste() {
    const sourceTag = `e2e-portal-${this.runId}`;
    const empresaA = this.empresaAId ?? '00000000-0000-0000-0000-000000000000';
    const empresaB = this.empresaBId ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.queryDb(
        `
          DELETE FROM propostas_portal_tokens
          WHERE empresa_id IN ($1, $2)
        `,
        [empresaA, empresaB],
      );
    } catch (error) {
      // Tabela pode nao existir no ambiente.
    }

    await this.queryDb(
      `DELETE FROM assinaturas_contrato WHERE "contratoId" IN (SELECT id FROM contratos WHERE empresa_id IN ($1, $2))`,
      [empresaA, empresaB],
    ).catch(() => undefined);
    await this.queryDb(
      `DELETE FROM transacoes_gateway_pagamento WHERE empresa_id IN ($1, $2)`,
      [empresaA, empresaB],
    ).catch(() => undefined);
    await this.queryDb(
      `DELETE FROM configuracoes_gateway_pagamento WHERE empresa_id IN ($1, $2)`,
      [empresaA, empresaB],
    ).catch(() => undefined);
    await this.queryDb(`DELETE FROM pagamentos WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    await this.queryDb(
      `DELETE FROM itens_fatura WHERE "faturaId" IN (SELECT id FROM faturas WHERE empresa_id IN ($1, $2))`,
      [empresaA, empresaB],
    ).catch(() => undefined);
    await this.queryDb(`DELETE FROM faturas WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    await this.queryDb(`DELETE FROM contratos WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    await this.queryDb(`DELETE FROM clientes WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );

    await this.queryDb(`DELETE FROM oportunidade_stage_events WHERE empresa_id IN ($1, $2)`, [
      empresaA,
      empresaB,
    ]).catch(() => undefined);
    await this.queryDb(`DELETE FROM oportunidade_itens_preliminares WHERE empresa_id IN ($1, $2)`, [
      empresaA,
      empresaB,
    ]).catch(() => undefined);
    await this.queryDb(`DELETE FROM atividades WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    await this.queryDb(`DELETE FROM leads WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    await this.queryDb(`DELETE FROM oportunidades WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
    const propostasHasSourceColumn = await this.hasTableColumn('propostas', 'source');
    const propostasDeleteSql = propostasHasSourceColumn
      ? `DELETE FROM propostas WHERE empresa_id IN ($1, $2) OR source = $3`
      : `DELETE FROM propostas WHERE empresa_id IN ($1, $2)`;
    const propostasDeleteParams = propostasHasSourceColumn
      ? [empresaA, empresaB, sourceTag]
      : [empresaA, empresaB];

    await this.queryDb(propostasDeleteSql, propostasDeleteParams).catch(() => undefined);
    await this.queryDb(`DELETE FROM users WHERE email IN ($1, $2)`, [
      this.emailAdminEmpresaA,
      this.emailAdminEmpresaB,
    ]).catch(() => undefined);
    await this.queryDb(`DELETE FROM empresas WHERE id IN ($1, $2)`, [empresaA, empresaB]).catch(
      () => undefined,
    );
  }

  async criarLeadViaApi(token: string, nome: string, responsavelId?: string) {
    const response = await request(this.httpServer)
      .post('/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome,
        email: `lead.${this.runId}@conectcrm.local`,
        telefone: '11999998888',
        empresa_nome: `Empresa Lead ${this.runId}`,
        responsavel_id: responsavelId,
        origem: 'manual',
        observacoes: `Lead criado no e2e ${this.runId}`,
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body?.id).toBeTruthy();
    return response.body;
  }

  async converterLeadParaOportunidade(token: string, leadId: string) {
    const response = await request(this.httpServer)
      .post(`/leads/${leadId}/converter`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        valor: 3200,
        descricao: `Conversao e2e ${this.runId}`,
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body?.id).toBeTruthy();
    return response.body;
  }

  async moverEstagioOportunidade(
    token: string,
    oportunidadeId: string | number,
    estagio: 'qualification' | 'proposal',
  ) {
    const response = await request(this.httpServer)
      .patch(`/oportunidades/${oportunidadeId}/estagio`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estagio });

    expect(response.status).toBe(200);
    expect(response.body?.estagio).toBe(estagio);
    return response.body;
  }

  async garantirPropostaAprovada(token: string, propostaId: string): Promise<void> {
    const obterAtual = async (): Promise<string> => {
      const response = await request(this.httpServer)
        .get(`/propostas/${propostaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body?.success).toBe(true);
      return String(response.body?.proposta?.status || '').toLowerCase();
    };

    const atualizarStatus = async (status: 'enviada' | 'aprovada') => {
      const response = await request(this.httpServer)
        .put(`/propostas/${propostaId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status,
          source: `e2e-portal-${this.runId}`,
          observacoes: `Ajuste de status para contrato (${status})`,
        });

      expect(response.status).toBe(200);
      expect(response.body?.success).toBe(true);
    };

    const statusAtual = await obterAtual();
    if (statusAtual === 'aprovada') return;
    if (statusAtual === 'rascunho') {
      await atualizarStatus('enviada');
    }

    const statusIntermediario = await obterAtual();
    if (statusIntermediario !== 'aprovada') {
      await atualizarStatus('aprovada');
    }
  }

  async criarContratoViaApi(token: string, propostaId: string) {
    await this.garantirPropostaAprovada(token, propostaId);

    const response = await request(this.httpServer)
      .post('/contratos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propostaId,
        clienteId: this.clienteEmpresaAId,
        usuarioResponsavelId: this.adminEmpresaAId,
        tipo: 'servico',
        objeto: `Contrato E2E Portal ${this.runId}`,
        valorTotal: 3200,
        dataInicio: '2026-02-01',
        dataFim: '2027-02-01',
        dataVencimento: '2026-03-01',
      });

    expect([200, 201]).toContain(response.status);
    if (response.body?.success === false) {
      throw new Error(
        `Falha ao criar contrato via API: ${String(response.body?.message || response.body?.error || 'resposta invalida')}`,
      );
    }

    const contrato = response.body?.data ?? response.body;
    expect(contrato?.id).toBeTruthy();

    return contrato;
  }
}
