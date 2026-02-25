import { INestApplication, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';

type CreateE2EAppOptions = {
  validationPipe?: boolean;
  validationPipeOptions?: ValidationPipeOptions;
};

const LOCK_DIR = path.resolve(__dirname, '..', '.tmp', 'e2e-bootstrap.lock');
const LOCK_POLL_MS = 100;
const LOCK_TIMEOUT_MS = 60_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireBootstrapLock(): Promise<boolean> {
  if (!shouldUseBootstrapLock()) return false;

  fs.mkdirSync(path.dirname(LOCK_DIR), { recursive: true });
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOCK_TIMEOUT_MS) {
    try {
      fs.mkdirSync(LOCK_DIR);
      return true;
    } catch (error: any) {
      if (error?.code !== 'EEXIST') {
        throw error;
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

export async function withE2EBootstrapLock<T>(fn: () => Promise<T>): Promise<T> {
  const locked = await acquireBootstrapLock();
  try {
    return await fn();
  } finally {
    releaseBootstrapLock(locked);
  }
}

export async function createE2EApp(
  moduleFixture: TestingModule,
  options: CreateE2EAppOptions = {},
): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication({
    logger: shouldEnableNestLoggerInTest() ? undefined : false,
  });

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
    await app.init();
  });

  return app;
}
