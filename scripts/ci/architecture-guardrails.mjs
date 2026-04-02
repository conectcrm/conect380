#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

function parseArgs(argv) {
  const options = {
    all: false,
    base: null,
    head: null,
    files: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--all') {
      options.all = true;
      continue;
    }

    if (arg === '--base') {
      options.base = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === '--head') {
      options.head = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === '--files') {
      const raw = argv[index + 1] || '';
      options.files = raw
        .split(',')
        .map((item) => normalizePath(item))
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (!arg.startsWith('-')) {
      const fileTokens = arg
        .split(',')
        .map((item) => normalizePath(item))
        .filter(Boolean);
      options.files.push(...fileTokens);
    }
  }

  return options;
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(`Architecture Guardrails

Usage:
  node scripts/ci/architecture-guardrails.mjs [--base <sha>] [--head <sha>]
  node scripts/ci/architecture-guardrails.mjs --all
  node scripts/ci/architecture-guardrails.mjs --files <path1,path2,...>

Rules:
  ARCH001 - Controller nao acessa infraestrutura/ORM diretamente
  ARCH002 - Service nao depende de Controller
  ARCH003 - Frontend fora de src/services nao chama API diretamente
  ARCH004 - Frontend nao decide status de pagamento/fatura
`);
}

function normalizePath(filePath) {
  return String(filePath || '').trim().replace(/\\/g, '/');
}

function runGitCommand(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getChangedFiles(options) {
  if (options.files.length > 0) {
    return options.files;
  }

  try {
    if (options.all) {
      return runGitCommand('git ls-files')
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);
    }

    if (options.base && options.head) {
      return runGitCommand(`git diff --name-only --diff-filter=ACMR ${options.base} ${options.head}`)
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);
    }

    try {
      return runGitCommand('git diff --name-only --diff-filter=ACMR HEAD^ HEAD')
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);
    } catch (error) {
      return runGitCommand('git diff-tree --no-commit-id --name-only -r --diff-filter=ACMR HEAD')
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[architecture-guardrails] Falha ao obter diff: ${error.message}`);
    process.exit(1);
  }
}

function isRelevantSourceFile(filePath) {
  if (!/\.(ts|tsx)$/i.test(filePath)) return false;
  if (/\.d\.ts$/i.test(filePath)) return false;
  if (/\.spec\.ts$/i.test(filePath)) return false;
  if (/\.test\.ts$/i.test(filePath)) return false;
  if (/\.e2e-spec\.ts$/i.test(filePath)) return false;

  return (
    filePath.startsWith('backend/src/modules/') || filePath.startsWith('frontend-web/src/')
  );
}

function extractImportSources(content) {
  const imports = [];

  const fromRegex = /import[\s\S]*?from\s+['"]([^'"]+)['"]/g;
  for (const match of content.matchAll(fromRegex)) {
    imports.push(match[1]);
  }

  const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of content.matchAll(requireRegex)) {
    imports.push(match[1]);
  }

  return imports;
}

function hasIgnoreRule(content, ruleId) {
  const marker = `architecture-guardrail:ignore ${ruleId}`;
  return content.includes(marker);
}

function shouldCheckFrontendApiBoundary(filePath) {
  if (!filePath.startsWith('frontend-web/src/')) return false;
  if (filePath.startsWith('frontend-web/src/services/')) return false;
  if (filePath.includes('/__tests__/')) return false;
  if (filePath.includes('/tests/')) return false;
  if (filePath.includes('/mocks/')) return false;
  if (filePath.includes('/stories/')) return false;
  if (/setupTests\.(ts|tsx)$/i.test(filePath)) return false;
  return true;
}

function shouldCheckBackendController(filePath) {
  return (
    filePath.startsWith('backend/src/modules/') &&
    filePath.endsWith('.controller.ts') &&
    !filePath.endsWith('.controller.spec.ts')
  );
}

function shouldCheckBackendService(filePath) {
  return (
    filePath.startsWith('backend/src/modules/') &&
    filePath.endsWith('.service.ts') &&
    !filePath.endsWith('.service.spec.ts')
  );
}

function addViolation(violations, filePath, ruleId, message, detail) {
  violations.push({
    filePath,
    ruleId,
    message,
    detail,
  });
}

function runRulesForFile(filePath, content, violations) {
  const imports = extractImportSources(content);

  if (shouldCheckBackendController(filePath) && !hasIgnoreRule(content, 'ARCH001')) {
    for (const source of imports) {
      if (source === 'typeorm' || source === '@nestjs/typeorm') {
        addViolation(
          violations,
          filePath,
          'ARCH001',
          'Controller nao pode importar TypeORM diretamente.',
          `Import detectado: "${source}"`,
        );
      }

      if (source.includes('/entities/') || source.includes('.entity')) {
        addViolation(
          violations,
          filePath,
          'ARCH001',
          'Controller nao deve depender de entity diretamente.',
          `Import detectado: "${source}"`,
        );
      }

      if (source.includes('/repositories/') || source.includes('.repository')) {
        addViolation(
          violations,
          filePath,
          'ARCH001',
          'Controller nao deve depender de repository diretamente.',
          `Import detectado: "${source}"`,
        );
      }
    }

    const forbiddenPatterns = [
      { regex: /createQueryBuilder\s*\(/, message: 'Controller nao pode executar query builder.' },
      { regex: /\bgetRepository\s*\(/, message: 'Controller nao pode obter repository diretamente.' },
      { regex: /@InjectRepository\s*\(/, message: 'Controller nao pode injetar repository direto.' },
      { regex: /\bprocess\.env\./, message: 'Controller nao deve ler configuracao de ambiente diretamente.' },
    ];

    for (const rule of forbiddenPatterns) {
      if (rule.regex.test(content)) {
        addViolation(violations, filePath, 'ARCH001', rule.message, `Trecho: ${rule.regex}`);
      }
    }
  }

  if (shouldCheckBackendService(filePath) && !hasIgnoreRule(content, 'ARCH002')) {
    for (const source of imports) {
      if (source.includes('.controller')) {
        addViolation(
          violations,
          filePath,
          'ARCH002',
          'Service nao pode depender de controller.',
          `Import detectado: "${source}"`,
        );
      }
    }
  }

  if (shouldCheckFrontendApiBoundary(filePath) && !hasIgnoreRule(content, 'ARCH003')) {
    const directApiPattern = /\bfetch\s*\(|\baxios\s*\(|\baxios\.[A-Za-z]+\s*\(/;
    if (directApiPattern.test(content)) {
      addViolation(
        violations,
        filePath,
        'ARCH003',
        'Camada de apresentacao nao pode chamar API diretamente. Use frontend-web/src/services/**.',
        'Padrao detectado: fetch/axios fora da camada de servicos.',
      );
    }
  }

  if (shouldCheckFrontendApiBoundary(filePath) && !hasIgnoreRule(content, 'ARCH004')) {
    const forbiddenBusinessPatterns = [
      {
        regex: /\bfaturamentoService\.marcarFaturaComoPaga\s*\(/,
        message: 'Frontend nao pode baixar/baixar recebivel diretamente.',
      },
      {
        regex: /\bfaturamentoService\.processarPagamento\s*\(/,
        message: 'Frontend nao pode processar pagamento diretamente.',
      },
      {
        regex: /\bnovoStatus\s*:\s*['"]aprovado['"]/i,
        message: 'Frontend nao pode definir status aprovado manualmente.',
      },
    ];

    for (const rule of forbiddenBusinessPatterns) {
      if (rule.regex.test(content)) {
        addViolation(
          violations,
          filePath,
          'ARCH004',
          rule.message,
          `Padrao detectado: ${rule.regex}`,
        );
      }
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const changedFiles = getChangedFiles(options);
  const relevantFiles = changedFiles.filter(isRelevantSourceFile);

  // eslint-disable-next-line no-console
  console.log(`[architecture-guardrails] Arquivos alterados: ${changedFiles.length}`);
  // eslint-disable-next-line no-console
  console.log(`[architecture-guardrails] Arquivos relevantes: ${relevantFiles.length}`);

  if (relevantFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[architecture-guardrails] Nenhum arquivo relevante para validacao.');
    process.exit(0);
  }

  const violations = [];

  for (const filePath of relevantFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    runRulesForFile(filePath, content, violations);
  }

  if (violations.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[architecture-guardrails] PASS - nenhuma violacao encontrada.');
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.log('[architecture-guardrails] FAIL - violacoes encontradas:');
  for (const violation of violations) {
    // eslint-disable-next-line no-console
    console.log(
      ` - [${violation.ruleId}] ${violation.filePath}: ${violation.message} (${violation.detail})`,
    );
  }

  process.exit(1);
}

main();
