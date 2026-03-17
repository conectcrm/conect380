import { INestApplication, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

type CreateE2EAppOptions = {
  validationPipe?: boolean;
  validationPipeOptions?: ValidationPipeOptions;
};

const LOCK_DIR = path.resolve(__dirname, '..', '.tmp', 'e2e-bootstrap.lock');
const LOCK_META_FILE = path.join(LOCK_DIR, 'owner.json');
const LOCK_POLL_MS = 100;
const LOCK_TIMEOUT_MS = 60_000;
const LOCK_STALE_AFTER_MS = LOCK_TIMEOUT_MS;
const LOCK_HEARTBEAT_MS = 2_000;

function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
}

function shouldUseBootstrapLock(): boolean {
  if (!isTestEnv()) return false;
  return process.env.E2E_BOOTSTRAP_LOCK_IN_TEST !== 'false';
}

function shouldEnableNestLoggerInTest(): boolean {
  return process.env.NEST_LOGS_IN_TEST === 'true';
}

function shouldEnableE2EBootstrapTrace(): boolean {
  return process.env.E2E_BOOTSTRAP_TRACE === 'true';
}

function shouldTraceLifecycleHooks(): boolean {
  return process.env.E2E_BOOTSTRAP_TRACE_HOOKS === 'true';
}

function shouldRunLegacyDbCompatibilityAdjustments(): boolean {
  return process.env.E2E_DB_COMPAT_LEGACY_SCHEMA === 'true';
}

function traceBootstrap(message: string): void {
  if (!shouldEnableE2EBootstrapTrace()) return;
  // eslint-disable-next-line no-console
  console.info(`[E2E Bootstrap] ${message}`);
}

function toTokenLabel(token: unknown): string {
  if (typeof token === 'string' && token.length > 0) return token;
  if (typeof token === 'symbol') return token.toString();
  if (typeof token === 'function' && token.name) return token.name;
  try {
    return JSON.stringify(token);
  } catch {
    return String(token);
  }
}

function wrapLifecycleHook(
  instance: Record<string, any>,
  hookName: 'onModuleInit' | 'onApplicationBootstrap',
  moduleToken: unknown,
  providerToken: unknown,
): void {
  const originalHook = instance[hookName];
  if (typeof originalHook !== 'function') return;

  if ((originalHook as any).__e2eBootstrapWrapped === true) {
    return;
  }

  const moduleLabel = toTokenLabel(moduleToken);
  const providerLabel = toTokenLabel(providerToken);

  const wrappedHook = async (...args: unknown[]) => {
    traceBootstrap(`hook:${hookName}:start module=${moduleLabel} provider=${providerLabel}`);
    try {
      const result = await originalHook.apply(instance, args);
      traceBootstrap(`hook:${hookName}:done module=${moduleLabel} provider=${providerLabel}`);
      return result;
    } catch (error: any) {
      traceBootstrap(
        `hook:${hookName}:error module=${moduleLabel} provider=${providerLabel} error=${
          error?.message || String(error)
        }`,
      );
      throw error;
    }
  };

  (wrappedHook as any).__e2eBootstrapWrapped = true;
  instance[hookName] = wrappedHook;
}

function instrumentLifecycleHooks(app: INestApplication): void {
  if (!shouldTraceLifecycleHooks()) return;

  try {
    const container = (app as any)?.container;
    const modules: Map<unknown, any> | undefined = container?.getModules?.();
    if (!modules || typeof modules.forEach !== 'function') return;

    modules.forEach((moduleRef, moduleToken) => {
      const providers: Map<unknown, any> | undefined = moduleRef?.providers;
      if (!providers || typeof providers.forEach !== 'function') return;

      providers.forEach((wrapper, providerToken) => {
        const instance = wrapper?.instance;
        if (!instance || typeof instance !== 'object') return;
        wrapLifecycleHook(instance, 'onModuleInit', moduleToken, providerToken);
        wrapLifecycleHook(instance, 'onApplicationBootstrap', moduleToken, providerToken);
      });
    });
  } catch (error: any) {
    traceBootstrap(`hook:instrumentation:error ${error?.message || String(error)}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBestEffortTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
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

async function acquireBootstrapLock(): Promise<boolean> {
  if (!shouldUseBootstrapLock()) return false;

  fs.mkdirSync(path.dirname(LOCK_DIR), { recursive: true });
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOCK_TIMEOUT_MS) {
    try {
      fs.mkdirSync(LOCK_DIR);
      try {
        fs.writeFileSync(
          LOCK_META_FILE,
          JSON.stringify({
            pid: process.pid,
            acquiredAt: new Date().toISOString(),
          }),
          'utf8',
        );
      } catch {
        // Best effort.
      }
      return true;
    } catch (error: any) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }

      try {
        const stats = fs.statSync(LOCK_DIR);
        const lockAgeMs = Date.now() - stats.mtimeMs;
        if (lockAgeMs >= LOCK_STALE_AFTER_MS) {
          fs.rmSync(LOCK_DIR, { recursive: true, force: true });
          continue;
        }

        let lockOwnerPid: number | null = null;
        if (fs.existsSync(LOCK_META_FILE)) {
          const rawMeta = fs.readFileSync(LOCK_META_FILE, 'utf8');
          const parsedMeta = JSON.parse(rawMeta) as { pid?: unknown };
          const parsedPid = Number(parsedMeta?.pid);
          if (Number.isInteger(parsedPid) && parsedPid > 0) {
            lockOwnerPid = parsedPid;
          }
        }

        const ownerAlive =
          lockOwnerPid !== null
            ? (() => {
                try {
                  process.kill(lockOwnerPid, 0);
                  return true;
                } catch (killError: any) {
                  // EPERM => processo existe, mas sem permissao de sinal.
                  return killError?.code === 'EPERM';
                }
              })()
            : false;

        if (lockOwnerPid !== null && !ownerAlive) {
          fs.rmSync(LOCK_DIR, { recursive: true, force: true });
          continue;
        }

        if (lockOwnerPid === null) {
          // Ja validamos staleness por idade acima.
        }
      } catch {
        // Se nao conseguir ler/remover lock stale, segue aguardando proxima janela.
      }

      await sleep(LOCK_POLL_MS);
    }
  }

  throw new Error(
    `Timeout ao aguardar lock de bootstrap E2E (${LOCK_TIMEOUT_MS}ms): ${LOCK_DIR}`,
  );
}

function releaseBootstrapLock(locked: boolean): void {
  if (!locked) return;
  try {
    fs.rmSync(LOCK_DIR, { recursive: true, force: true });
  } catch {
    // Best effort para testes.
  }
}

function startBootstrapHeartbeat(locked: boolean): NodeJS.Timeout | null {
  if (!locked) return null;

  const heartbeat = setInterval(() => {
    try {
      const now = new Date();
      fs.mkdirSync(LOCK_DIR, { recursive: true });
      fs.writeFileSync(
        LOCK_META_FILE,
        JSON.stringify({
          pid: process.pid,
          acquiredAt: now.toISOString(),
          heartbeatAt: now.toISOString(),
        }),
        'utf8',
      );
      fs.utimesSync(LOCK_DIR, now, now);
    } catch {
      // Best effort.
    }
  }, LOCK_HEARTBEAT_MS);

  heartbeat.unref();
  return heartbeat;
}

function stopBootstrapHeartbeat(heartbeat: NodeJS.Timeout | null): void {
  if (!heartbeat) return;
  clearInterval(heartbeat);
}

export async function withE2EBootstrapLock<T>(fn: () => Promise<T>): Promise<T> {
  const locked = await acquireBootstrapLock();
  const heartbeat = startBootstrapHeartbeat(locked);
  try {
    return await fn();
  } finally {
    stopBootstrapHeartbeat(heartbeat);
    releaseBootstrapLock(locked);
  }
}

export async function createE2EApp(
  moduleFixture: TestingModule,
  options: CreateE2EAppOptions = {},
): Promise<INestApplication> {
  traceBootstrap('createNestApplication:start');
  const app = moduleFixture.createNestApplication({
    logger: shouldEnableNestLoggerInTest() ? undefined : false,
  });
  traceBootstrap('createNestApplication:done');
  instrumentLifecycleHooks(app);

  if (options.validationPipe !== false) {
    app.useGlobalPipes(
      new ValidationPipe(
        options.validationPipeOptions ?? {
          whitelist: true,
          transform: true,
        },
      ),
    );
  }

  await withE2EBootstrapLock(async () => {
    traceBootstrap('app.init:start');
    await app.init();
    traceBootstrap('app.init:done');
    traceBootstrap('db-compat:start');
    await ensureE2EDatabaseCompatibility(app);
    traceBootstrap('db-compat:done');
  });

  return app;
}

async function ensureE2EDatabaseCompatibility(app: INestApplication): Promise<void> {
  if (!isTestEnv()) return;
  if (!shouldRunLegacyDbCompatibilityAdjustments()) {
    traceBootstrap('db-compat:skip disabled');
    return;
  }

  let queryRunner: ReturnType<DataSource['createQueryRunner']> | null = null;
  const connectTimeoutMs = Number(process.env.E2E_DB_COMPAT_CONNECT_TIMEOUT_MS || 5000);
  const queryTimeoutMs = Number(process.env.E2E_DB_COMPAT_QUERY_TIMEOUT_MS || 5000);
  const releaseTimeoutMs = Number(process.env.E2E_DB_COMPAT_RELEASE_TIMEOUT_MS || 3000);

  try {
    const dataSource = app.get(DataSource, { strict: false });
    if (!dataSource?.isInitialized) return;

    queryRunner = dataSource.createQueryRunner();
    await withBestEffortTimeout(
      queryRunner.connect(),
      connectTimeoutMs,
      'ensureE2EDatabaseCompatibility.connect',
    );

    await withBestEffortTimeout(
      queryRunner.query(`SET lock_timeout = '1500ms'`),
      queryTimeoutMs,
      'ensureE2EDatabaseCompatibility.set-lock-timeout',
    );
    await withBestEffortTimeout(
      queryRunner.query(`SET statement_timeout = '10000ms'`),
      queryTimeoutMs,
      'ensureE2EDatabaseCompatibility.set-statement-timeout',
    );

    // Compatibilidade com schema legado para fluxo MFA em suites E2E.
    await withBestEffortTimeout(queryRunner.query(`
      ALTER TABLE "empresas"
      ADD COLUMN IF NOT EXISTS "data_expiracao" TIMESTAMP
    `), queryTimeoutMs, 'ensureE2EDatabaseCompatibility.alter-empresas-data-expiracao');

    // Compatibilidade com schema legado de propostas nas suites de vendas E2E.
    await withBestEffortTimeout(queryRunner.query(`
      ALTER TABLE "propostas"
      ADD COLUMN IF NOT EXISTS "oportunidade_id" UUID
    `), queryTimeoutMs, 'ensureE2EDatabaseCompatibility.alter-propostas-oportunidade-id');

    // Compatibilidade da Fase 2 do pipeline: itens preliminares da oportunidade.
    await withBestEffortTimeout(queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "oportunidade_itens_preliminares" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "oportunidade_id" character varying(64) NOT NULL,
        "produto_id" uuid NULL,
        "catalog_item_id" uuid NULL,
        "nome_snapshot" character varying(255) NOT NULL,
        "sku_snapshot" character varying(100) NULL,
        "descricao_snapshot" text NULL,
        "preco_unitario_estimado" numeric(12,2) NOT NULL DEFAULT 0,
        "quantidade_estimada" numeric(12,3) NOT NULL DEFAULT 1,
        "desconto_percentual" numeric(5,2) NOT NULL DEFAULT 0,
        "subtotal_estimado" numeric(14,2) NOT NULL DEFAULT 0,
        "origem" character varying(30) NOT NULL DEFAULT 'manual',
        "ordem" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_oportunidade_itens_preliminares" PRIMARY KEY ("id")
      )
    `), queryTimeoutMs, 'ensureE2EDatabaseCompatibility.create-oportunidade-itens-preliminares');
  } catch (error: any) {
    traceBootstrap(
      `db-compat:skip error=${error?.message || String(error)}`,
    );
    // Best effort: nao bloquear bootstrap de testes por ajuste de compatibilidade.
  } finally {
    if (queryRunner) {
      try {
        await withBestEffortTimeout(
          queryRunner.release(),
          releaseTimeoutMs,
          'ensureE2EDatabaseCompatibility.release',
        );
      } catch {
        // Best effort.
      }
    }
  }
}
