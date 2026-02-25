#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';

const steps = [
  {
    name: 'Release flags (GO Full)',
    cmd: 'npm',
    args: ['run', 'validate:release:vendas:full'],
  },
  {
    name: 'Backend build',
    cmd: 'npm',
    args: ['--prefix', 'backend', 'run', 'build'],
  },
  {
    name: 'Frontend build',
    cmd: 'npm',
    args: ['--prefix', 'frontend-web', 'run', 'build'],
  },
  {
    name: 'Backend E2E multi-tenancy',
    cmd: 'npm',
    args: ['--prefix', 'backend', 'run', 'test:e2e', '--', 'test/multi-tenancy.e2e-spec.ts'],
  },
  {
    name: 'Backend E2E vendas',
    cmd: 'npm',
    args: ['--prefix', 'backend', 'run', 'test:e2e:vendas'],
  },
  {
    name: 'Backend E2E vendas permissoes',
    cmd: 'npm',
    args: ['--prefix', 'backend', 'run', 'test:e2e:vendas:permissoes'],
  },
  {
    name: 'Frontend E2E pipeline UI',
    cmd: 'npm',
    args: ['run', 'test:e2e:pipeline-ui'],
    requiresFrontendServer: true,
  },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log(`\n[preflight-sales-go-full] STEP: ${step.name}`);
    // eslint-disable-next-line no-console
    console.log(`[preflight-sales-go-full] CMD: ${step.cmd} ${step.args.join(' ')}`);

    const child = spawn(step.cmd, step.args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Falha no passo "${step.name}" (exit code=${code ?? 'null'})`));
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isFrontendAvailable() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok || response.status < 500;
  } catch (error) {
    return false;
  }
}

async function ensureFrontendServer() {
  if (await isFrontendAvailable()) {
    // eslint-disable-next-line no-console
    console.log('[preflight-sales-go-full] Frontend ja disponivel em http://localhost:3000');
    return { child: null, startedByScript: false };
  }

  // eslint-disable-next-line no-console
  console.log('[preflight-sales-go-full] Subindo frontend local para os testes de UI...');
  const child = spawn('npm', ['--prefix', 'frontend-web', 'run', 'start:docker'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PORT: '3000',
      BROWSER: 'none',
      CI: 'true',
    },
  });

  const timeoutMs = 120000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Frontend encerrou antes de ficar disponivel (exit code=${child.exitCode})`);
    }

    // eslint-disable-next-line no-await-in-loop
    if (await isFrontendAvailable()) {
      // eslint-disable-next-line no-console
      console.log('[preflight-sales-go-full] Frontend pronto em http://localhost:3000');
      return { child, startedByScript: true };
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(2000);
  }

  throw new Error('Timeout aguardando frontend em http://localhost:3000');
}

function stopFrontendServer(frontendRuntime) {
  return new Promise((resolve) => {
    if (!frontendRuntime?.startedByScript || !frontendRuntime.child?.pid) {
      resolve();
      return;
    }

    const { child } = frontendRuntime;
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
      return;
    }

    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
      resolve();
    }, 3000);
    child.once('close', () => resolve());
  });
}

async function main() {
  const startedAt = Date.now();
  let frontendRuntime = null;

  try {
    for (const step of steps) {
      if (step.requiresFrontendServer) {
        // eslint-disable-next-line no-await-in-loop
        frontendRuntime = await ensureFrontendServer();
      }

      // eslint-disable-next-line no-await-in-loop
      await runStep(step);
    }
  } finally {
    await stopFrontendServer(frontendRuntime);
  }

  const durationMs = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(`\n[preflight-sales-go-full] PASS em ${(durationMs / 1000).toFixed(1)}s`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`\n[preflight-sales-go-full] FAIL: ${error.message}`);
  process.exit(1);
});
