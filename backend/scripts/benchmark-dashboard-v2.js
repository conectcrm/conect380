#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const autocannon = require('autocannon');

function parseArgs(argv) {
  const output = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith('--')) continue;
    const sepIdx = raw.indexOf('=');
    if (sepIdx === -1) {
      const key = raw.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        output[key] = next;
        i += 1;
      } else {
        output[key] = 'true';
      }
      continue;
    }
    const key = raw.slice(2, sepIdx);
    const value = raw.slice(sepIdx + 1);
    output[key] = value;
  }
  return output;
}

function npmConfigValue(key) {
  return process.env[`npm_config_${key}`] || '';
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signHs256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${content}.${signature}`;
}

function resolveToken({ token, jwtSecret, userId, empresaId }) {
  if (token) return token;
  if (!jwtSecret || !userId || !empresaId) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    id: userId,
    empresa_id: empresaId,
    email: 'dashboard.v2.benchmark@local',
    role: 'super_admin',
    permissoes: ['dashboard_read'],
    iat: now,
    exp: now + 60 * 60,
  };

  return signHs256(payload, jwtSecret);
}

function runAutocannon({ url, durationSec, connections, rate, headers }) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        method: 'GET',
        headers,
        connections,
        duration: durationSec,
        overallRate: rate,
        renderProgressBar: false,
        renderLatencyTable: false,
        renderResultsTable: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    instance.on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchTimed(url, headers) {
  const startedAt = performance.now();
  const response = await fetch(url, { method: 'GET', headers });
  const durationMs = Number((performance.now() - startedAt).toFixed(2));
  return {
    status: response.status,
    ok: response.ok,
    durationMs,
  };
}

function resolveP95Ms(autocannonResult) {
  const latency = autocannonResult?.latency || {};
  if (typeof latency.p95 === 'number') return latency.p95;
  if (typeof latency.p97_5 === 'number') return latency.p97_5;
  if (typeof latency.p99 === 'number') return latency.p99;
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();
  const defaultEnd = toDateKey(now);
  const defaultStartDate = new Date(now);
  defaultStartDate.setUTCDate(defaultStartDate.getUTCDate() - 30);
  const defaultStart = toDateKey(defaultStartDate);

  const rootDir = path.resolve(__dirname, '..', '..');
  const outputPath =
    args.output ||
    process.env.DASHBOARD_V2_BENCHMARK_OUTPUT ||
    path.join(
      rootDir,
      'docs',
      'archive',
      'cleanup-2026-02-20',
      'dashboard-v2-autocannon-report.json',
    );

  const config = {
    baseUrl:
      args.baseUrl ||
      npmConfigValue('baseurl') ||
      process.env.DASHBOARD_V2_BENCHMARK_BASE_URL ||
      'http://localhost:3001',
    empresaId:
      args.empresaId ||
      npmConfigValue('empresaid') ||
      process.env.DASHBOARD_V2_BENCHMARK_EMPRESA_ID ||
      '',
    userId:
      args.userId || npmConfigValue('userid') || process.env.DASHBOARD_V2_BENCHMARK_USER_ID || '',
    token: args.token || npmConfigValue('token') || process.env.DASHBOARD_V2_BENCHMARK_TOKEN || '',
    jwtSecret:
      args.jwtSecret ||
      npmConfigValue('jwtsecret') ||
      process.env.DASHBOARD_V2_BENCHMARK_JWT_SECRET ||
      process.env.JWT_SECRET ||
      '',
    periodStart:
      args.periodStart ||
      npmConfigValue('periodstart') ||
      process.env.DASHBOARD_V2_BENCHMARK_PERIOD_START ||
      defaultStart,
    periodEnd:
      args.periodEnd ||
      npmConfigValue('periodend') ||
      process.env.DASHBOARD_V2_BENCHMARK_PERIOD_END ||
      defaultEnd,
    durationSec: Number(
      args.durationSec ||
        npmConfigValue('durationsec') ||
        process.env.DASHBOARD_V2_BENCHMARK_DURATION_SEC ||
        15,
    ),
    connections: Number(
      args.connections ||
        npmConfigValue('connections') ||
        process.env.DASHBOARD_V2_BENCHMARK_CONNECTIONS ||
        2,
    ),
    rate: Number(args.rate || npmConfigValue('rate') || process.env.DASHBOARD_V2_BENCHMARK_RATE || 1),
    warmupWaitMs: Number(
      args.warmupWaitMs ||
        npmConfigValue('warmupwaitms') ||
        process.env.DASHBOARD_V2_BENCHMARK_WARMUP_WAIT_MS ||
        350,
    ),
    rateLimitCooldownMs: Number(
      args.rateLimitCooldownMs ||
        npmConfigValue('ratelimitcooldownms') ||
        process.env.DASHBOARD_V2_BENCHMARK_RATE_LIMIT_COOLDOWN_MS ||
        65_000,
    ),
    maxRateLimitRetries: Number(
      args.maxRateLimitRetries ||
        npmConfigValue('maxratelimitretries') ||
        process.env.DASHBOARD_V2_BENCHMARK_MAX_RATE_LIMIT_RETRIES ||
        1,
    ),
    forwardedFor:
      args.forwardedFor ||
      npmConfigValue('forwardedfor') ||
      process.env.DASHBOARD_V2_BENCHMARK_FORWARDED_FOR ||
      `10.255.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
  };

  if (!config.empresaId) {
    throw new Error(
      'empresaId ausente. Defina --empresaId=<uuid> ou DASHBOARD_V2_BENCHMARK_EMPRESA_ID.',
    );
  }

  const token = resolveToken({
    token: config.token,
    jwtSecret: config.jwtSecret,
    userId: config.userId,
    empresaId: config.empresaId,
  });

  if (!token) {
    throw new Error(
      [
        'Token JWT ausente.',
        'Forneca --token=<jwt> (ou DASHBOARD_V2_BENCHMARK_TOKEN),',
        'ou informe --jwtSecret + --userId para assinatura local.',
      ].join(' '),
    );
  }

  const endpoints = [
    { name: 'overview', path: '/dashboard/v2/overview' },
    { name: 'trends', path: '/dashboard/v2/trends' },
    { name: 'funnel', path: '/dashboard/v2/funnel' },
    { name: 'pipeline-summary', path: '/dashboard/v2/pipeline-summary' },
    { name: 'insights', path: '/dashboard/v2/insights' },
  ];

  const headers = {
    authorization: `Bearer ${token}`,
    'x-empresa-id': config.empresaId,
    'x-forwarded-for': config.forwardedFor,
    accept: 'application/json',
  };

  const endpointReports = [];

  console.log(
    `[benchmark] inicio | baseUrl=${config.baseUrl} empresaId=${config.empresaId} periodo=${config.periodStart}..${config.periodEnd}`,
  );

  for (const endpoint of endpoints) {
    let attempt = 0;
    let benchmarkResult = null;

    while (attempt <= config.maxRateLimitRetries) {
      const timezoneKey = `bench-${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${endpoint.name}`;
      const urlObj = new URL(endpoint.path, config.baseUrl);
      urlObj.searchParams.set('periodStart', config.periodStart);
      urlObj.searchParams.set('periodEnd', config.periodEnd);
      urlObj.searchParams.set('timezone', timezoneKey);
      const url = urlObj.toString();

      console.log(`[benchmark] ${endpoint.name} | cold/warm + autocannon (tentativa ${attempt + 1})`);

      const cold = await fetchTimed(url, headers);
      if (config.warmupWaitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, config.warmupWaitMs));
      }
      const warm = await fetchTimed(url, headers);

      const autocannonResult = await runAutocannon({
        url,
        durationSec: config.durationSec,
        connections: config.connections,
        rate: config.rate,
        headers,
      });

      const hasRateLimit =
        cold.status === 429 || warm.status === 429 || Number(autocannonResult.non2xx || 0) > 0;

      benchmarkResult = {
        endpoint: endpoint.name,
        path: endpoint.path,
        url,
        attempts: attempt + 1,
        coldRequest: cold,
        warmRequest: warm,
        autocannon: {
          latency: autocannonResult.latency,
          requests: autocannonResult.requests,
          throughput: autocannonResult.throughput,
          errors: autocannonResult.errors,
          timeouts: autocannonResult.timeouts,
          non2xx: autocannonResult.non2xx,
          statusCodes: {
            '1xx': autocannonResult['1xx'],
            '2xx': autocannonResult['2xx'],
            '3xx': autocannonResult['3xx'],
            '4xx': autocannonResult['4xx'],
            '5xx': autocannonResult['5xx'],
          },
        },
      };

      if (hasRateLimit && attempt < config.maxRateLimitRetries) {
        console.warn(
          `[benchmark] ${endpoint.name} recebeu non2xx (cold=${cold.status}, warm=${warm.status}, autocannon=${autocannonResult.non2xx}). Aguardando ${config.rateLimitCooldownMs}ms para nova tentativa...`,
        );
        await new Promise((resolve) => setTimeout(resolve, config.rateLimitCooldownMs));
        attempt += 1;
        continue;
      }

      break;
    }

    if (benchmarkResult) {
      endpointReports.push(benchmarkResult);
    }
  }

  const maxColdMs = endpointReports.reduce(
    (acc, item) => Math.max(acc, Number(item.coldRequest.durationMs || 0)),
    0,
  );
  const maxP95CacheHitMs = endpointReports.reduce((acc, item) => {
    const p95 = resolveP95Ms(item.autocannon);
    return Math.max(acc, Number(p95 || 0));
  }, 0);
  const totalNon2xx = endpointReports.reduce(
    (acc, item) => acc + Number(item.autocannon.non2xx || 0),
    0,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    config: {
      ...config,
      tokenSource: config.token ? 'provided' : 'signed-with-jwt-secret',
      outputPath,
    },
    gates: {
      cacheHitP95TargetMs: 400,
      coldTargetMs: 1200,
      maxP95CacheHitMs: Number(maxP95CacheHitMs.toFixed(2)),
      maxColdMs: Number(maxColdMs.toFixed(2)),
      totalNon2xx,
      cacheHitP95Pass: maxP95CacheHitMs > 0 && maxP95CacheHitMs < 400,
      coldPass: maxColdMs > 0 && maxColdMs < 1200,
      noHttpErrorPass: totalNon2xx === 0,
    },
    endpoints: endpointReports,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`[benchmark] relatorio salvo em ${outputPath}`);
  console.log(
    `[benchmark] gates | p95=${report.gates.maxP95CacheHitMs}ms cold=${report.gates.maxColdMs}ms non2xx=${report.gates.totalNon2xx}`,
  );
  process.exitCode =
    report.gates.cacheHitP95Pass && report.gates.coldPass && report.gates.noHttpErrorPass ? 0 : 2;
}

main().catch((error) => {
  console.error('[benchmark] erro:', error?.message || error);
  process.exitCode = 1;
});
