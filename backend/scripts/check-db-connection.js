#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

const envProductionPath = path.resolve(process.cwd(), '.env.production');
if (fs.existsSync(envProductionPath)) {
  dotenv.config({ path: envProductionPath });
} else {
  dotenv.config();
}

const readVar = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

const parseBoolean = (value, fallback = false) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
};

const sslEnabled = parseBoolean(readVar('DATABASE_SSL', 'DB_SSL'), false);
const sslConfig = sslEnabled ? { rejectUnauthorized: false } : false;

const connectionString = readVar('DATABASE_URL');
const pgConfig = connectionString
  ? {
      connectionString,
      ssl: sslConfig,
    }
  : {
      host: readVar('DATABASE_HOST', 'DB_HOST', 'PGHOST'),
      port: Number(readVar('DATABASE_PORT', 'DB_PORT', 'PGPORT') || 5432),
      user: readVar('DATABASE_USERNAME', 'DB_USERNAME', 'PGUSER'),
      password: readVar('DATABASE_PASSWORD', 'DB_PASSWORD', 'PGPASSWORD'),
      database: readVar('DATABASE_NAME', 'DB_DATABASE', 'PGDATABASE'),
      ssl: sslConfig,
      statement_timeout: 10000,
      query_timeout: 10000,
      connectionTimeoutMillis: 10000,
    };

const hasHostModeConfig = Boolean(
  pgConfig.host && pgConfig.user && pgConfig.password && pgConfig.database,
);

if (!connectionString && !hasHostModeConfig) {
  console.error(
    '[FAIL] Configuracao de banco incompleta. Defina DATABASE_URL ou DATABASE_HOST/PORT/USERNAME/PASSWORD/NAME.',
  );
  process.exit(1);
}

async function run() {
  const client = new Client(pgConfig);

  try {
    await client.connect();
    await client.query('SELECT 1');
    console.log('[OK] Conexao com banco validada.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FAIL] Falha na conexao com banco: ${message}`);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch {
      // noop
    }
  }
}

void run();

