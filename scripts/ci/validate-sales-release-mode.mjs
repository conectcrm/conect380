#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_PROVIDERS = new Set(['stripe', 'mercado_pago', 'pagseguro']);

function parseArgs(argv) {
  const args = {
    mode: '',
    frontendEnv: 'frontend-web/.env.example',
    backendEnv: 'backend/.env.production.example',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--mode') {
      args.mode = String(argv[i + 1] || '').trim().toLowerCase();
      i += 1;
      continue;
    }
    if (token === '--frontend-env') {
      args.frontendEnv = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (token === '--backend-env') {
      args.backendEnv = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
  }

  return args;
}

function parseEnvContent(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = (match[2] || '').trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }

    map.set(key, value);
  }

  return map;
}

function readEnvFile(filePath) {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      filePath: resolvedPath,
      map: new Map(),
      exists: false,
    };
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  return {
    filePath: resolvedPath,
    map: parseEnvContent(content),
    exists: true,
  };
}

function getValue(name, envFile) {
  if (Object.prototype.hasOwnProperty.call(process.env, name)) {
    return {
      value: process.env[name] ?? '',
      source: 'process.env',
    };
  }

  if (envFile.map.has(name)) {
    return {
      value: envFile.map.get(name) ?? '',
      source: envFile.filePath,
    };
  }

  return {
    value: undefined,
    source: 'missing',
  };
}

function parseBoolean(varName, entry, errors) {
  if (entry.value === undefined) {
    errors.push(`${varName}: variavel ausente (fonte: ${entry.source})`);
    return null;
  }

  const normalized = String(entry.value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  errors.push(`${varName}: valor invalido "${entry.value}". Use true ou false.`);
  return null;
}

function parseProviders(varName, entry, errors) {
  if (entry.value === undefined) {
    errors.push(`${varName}: variavel ausente (fonte: ${entry.source})`);
    return [];
  }

  const providers = String(entry.value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const duplicates = providers.filter((provider, index) => providers.indexOf(provider) !== index);
  if (duplicates.length > 0) {
    errors.push(`${varName}: providers duplicados (${Array.from(new Set(duplicates)).join(', ')})`);
  }

  const invalid = providers.filter((provider) => !ALLOWED_PROVIDERS.has(provider));
  if (invalid.length > 0) {
    errors.push(
      `${varName}: providers invalidos (${invalid.join(', ')}). Permitidos: ${Array.from(ALLOWED_PROVIDERS).join(', ')}`,
    );
  }

  return providers;
}

function setEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

function printValue(label, entry) {
  const value = entry.value === undefined ? '<missing>' : String(entry.value);
  // eslint-disable-next-line no-console
  console.log(`- ${label}: ${value} (${entry.source})`);
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode;

  if (mode !== 'core' && mode !== 'full') {
    // eslint-disable-next-line no-console
    console.error(
      '[sales-release-guardrails] Uso: node scripts/ci/validate-sales-release-mode.mjs --mode <core|full> [--frontend-env <path>] [--backend-env <path>]',
    );
    process.exit(1);
  }

  const frontendEnv = readEnvFile(args.frontendEnv);
  const backendEnv = readEnvFile(args.backendEnv);
  const errors = [];

  if (!frontendEnv.exists) {
    errors.push(`Arquivo frontend nao encontrado: ${frontendEnv.filePath}`);
  }
  if (!backendEnv.exists) {
    errors.push(`Arquivo backend nao encontrado: ${backendEnv.filePath}`);
  }

  const feMvpMode = getValue('REACT_APP_MVP_MODE', frontendEnv);
  const feAllowUnimplemented = getValue(
    'REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED',
    frontendEnv,
  );
  const feProviders = getValue('REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS', frontendEnv);

  const beAllowUnimplemented = getValue('PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED', backendEnv);
  const beProviders = getValue('PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS', backendEnv);

  // eslint-disable-next-line no-console
  console.log(`[sales-release-guardrails] mode=${mode}`);
  printValue('REACT_APP_MVP_MODE', feMvpMode);
  printValue('REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED', feAllowUnimplemented);
  printValue('REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS', feProviders);
  printValue('PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED', beAllowUnimplemented);
  printValue('PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS', beProviders);

  const mvpMode = parseBoolean('REACT_APP_MVP_MODE', feMvpMode, errors);
  const feAllow = parseBoolean(
    'REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED',
    feAllowUnimplemented,
    errors,
  );
  const beAllow = parseBoolean(
    'PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED',
    beAllowUnimplemented,
    errors,
  );

  const feProvidersList = parseProviders(
    'REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS',
    feProviders,
    errors,
  );
  const beProvidersList = parseProviders('PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS', beProviders, errors);

  if (mode === 'core') {
    if (mvpMode !== null && mvpMode !== true) {
      errors.push('GO Core exige REACT_APP_MVP_MODE=true.');
    }
    if (feAllow !== null && feAllow !== false) {
      errors.push('GO Core exige REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false.');
    }
    if (beAllow !== null && beAllow !== false) {
      errors.push('GO Core exige PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false.');
    }
    if (feProvidersList.length > 0) {
      errors.push('GO Core exige REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS vazio.');
    }
    if (beProvidersList.length > 0) {
      errors.push('GO Core exige PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS vazio.');
    }
  }

  if (mode === 'full') {
    if (mvpMode !== null && mvpMode !== false) {
      errors.push('GO Full exige REACT_APP_MVP_MODE=false.');
    }
    if (feAllow !== null && feAllow !== false) {
      errors.push('GO Full exige REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false.');
    }
    if (beAllow !== null && beAllow !== false) {
      errors.push('GO Full exige PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false.');
    }
    if (feProvidersList.length === 0) {
      errors.push('GO Full exige REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS com ao menos 1 provider.');
    }
    if (beProvidersList.length === 0) {
      errors.push('GO Full exige PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS com ao menos 1 provider.');
    }

    const feSet = new Set(feProvidersList);
    const beSet = new Set(beProvidersList);
    if (feSet.size > 0 && beSet.size > 0 && !setEquals(feSet, beSet)) {
      errors.push(
        `GO Full exige lista de providers alinhada entre frontend e backend. FE=[${Array.from(feSet).join(', ')}] BE=[${Array.from(beSet).join(', ')}]`,
      );
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[sales-release-guardrails] FAIL');
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('[sales-release-guardrails] PASS');
}

run();
