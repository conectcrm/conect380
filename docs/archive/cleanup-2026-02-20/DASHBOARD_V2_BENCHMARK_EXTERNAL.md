# Dashboard V2 - Benchmark Externo (autocannon)

Script oficial para medir performance real via HTTP dos endpoints:

- `/dashboard/v2/overview`
- `/dashboard/v2/trends`
- `/dashboard/v2/funnel`
- `/dashboard/v2/pipeline-summary`
- `/dashboard/v2/insights`

## Comando

No diretório `backend`:

```bash
npm run benchmark:dashboard-v2 --empresaId=<UUID_EMPRESA> --userId=<UUID_USUARIO> --jwtSecret=<JWT_SECRET>
```

Alternativa usando token pronto:

```bash
npm run benchmark:dashboard-v2 --empresaId=<UUID_EMPRESA> --token=<JWT>
```

## Variáveis opcionais

- `--baseUrl` (default: `http://localhost:3001`)
- `--periodStart` (default: hoje - 30 dias)
- `--periodEnd` (default: hoje)
- `--durationSec` (default: `15`)
- `--connections` (default: `2`)
- `--rate` (default: `1`)
- `--rateLimitCooldownMs` (default: `65000`)
- `--maxRateLimitRetries` (default: `1`)
- `--forwardedFor` (default: IP sintético aleatório para isolar bucket de rate-limit)
- `--output` caminho do relatório JSON

## Saída

Arquivo padrão:

`docs/archive/cleanup-2026-02-20/dashboard-v2-autocannon-report.json`

O relatório inclui:

- `coldRequest` (primeira chamada por endpoint)
- `warmRequest` (segunda chamada para mesmo filtro)
- resumo `autocannon` por endpoint (latência, throughput, non2xx)
- avaliação dos gates:
  - `cacheHitP95TargetMs < 400`
  - `coldTargetMs < 1200`

## Observações

- O script injeta `x-empresa-id` em todas as requisições.
- Cada endpoint usa `timezone` único para evitar reaproveitamento indevido de chave de cache entre execuções.
- Se houver `429`, o script aguarda cooldown e tenta novamente automaticamente.

## Automação diária (GitHub Actions)

Workflow criado:

`/.github/workflows/dashboard-v2-benchmark.yml`

Triggers:

- Diário via `cron` (`05:15 UTC`)
- Execução manual (`workflow_dispatch`)

Secrets necessários para rodar:

- `DASHBOARD_V2_BENCHMARK_BASE_URL`
- `DASHBOARD_V2_BENCHMARK_EMPRESA_ID`
- `DASHBOARD_V2_BENCHMARK_TOKEN`

Secrets opcionais (observabilidade):

- `DASHBOARD_V2_BENCHMARK_PUSHGATEWAY_URL`
- `DASHBOARD_V2_BENCHMARK_PUSHGATEWAY_BASIC_AUTH`
- `DASHBOARD_V2_BENCHMARK_ENV_LABEL`

Artefatos publicados pelo workflow:

- `dashboard-v2-autocannon-<timestamp>.json`
- `dashboard-v2-autocannon-latest.json`

Checklist de ativacao por ambiente:

- `docs/archive/cleanup-2026-02-20/DASHBOARD_V2_BENCHMARK_SECRETS_CHECKLIST.md`
