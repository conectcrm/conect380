#!/usr/bin/env node

import { spawn } from 'node:child_process';

const steps = [
  {
    name: 'Release flags (GO Core)',
    cmd: 'npm',
    args: ['run', 'validate:release:vendas:core'],
  },
  {
    name: 'Backend build',
    cmd: 'npm',
    args: ['--prefix', 'backend', 'run', 'build'],
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
    name: 'Frontend E2E pipeline UI',
    cmd: 'npm',
    args: ['run', 'test:e2e:pipeline-ui'],
  },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log(`\n[preflight-sales-go-core] STEP: ${step.name}`);
    // eslint-disable-next-line no-console
    console.log(`[preflight-sales-go-core] CMD: ${step.cmd} ${step.args.join(' ')}`);

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

async function main() {
  const startedAt = Date.now();

  for (const step of steps) {
    // eslint-disable-next-line no-await-in-loop
    await runStep(step);
  }

  const durationMs = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(`\n[preflight-sales-go-core] PASS em ${(durationMs / 1000).toFixed(1)}s`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`\n[preflight-sales-go-core] FAIL: ${error.message}`);
  process.exit(1);
});
