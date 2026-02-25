# Dashboard V2 Benchmark - Secrets Checklist

Checklist operacional para ativar o workflow:

`/.github/workflows/dashboard-v2-benchmark.yml`

## Secrets obrigatorios

| Secret | Staging | Production | Obrigatorio |
|---|---|---|---|
| `DASHBOARD_V2_BENCHMARK_BASE_URL` | URL da API staging (`https://...`) | URL da API prod (`https://...`) | Sim |
| `DASHBOARD_V2_BENCHMARK_EMPRESA_ID` | Tenant tecnico de benchmark (UUID) | Tenant tecnico de benchmark (UUID) | Sim |
| `DASHBOARD_V2_BENCHMARK_TOKEN` | JWT com permissao `dashboard_read` do tenant | JWT com permissao `dashboard_read` do tenant | Sim |

## Secrets opcionais (observabilidade)

| Secret | Staging | Production | Obrigatorio |
|---|---|---|---|
| `DASHBOARD_V2_BENCHMARK_PUSHGATEWAY_URL` | URL do Pushgateway staging | URL do Pushgateway prod | Nao |
| `DASHBOARD_V2_BENCHMARK_PUSHGATEWAY_BASIC_AUTH` | `usuario:senha` basico | `usuario:senha` basico | Nao |
| `DASHBOARD_V2_BENCHMARK_ENV_LABEL` | `staging` | `prod` | Nao |

## Requisitos de seguranca

- Nao usar token de usuario humano; usar usuario tecnico dedicado por ambiente.
- Token deve ter somente o escopo minimo necessario para leitura do dashboard.
- Rotacionar token periodicamente (recomendado: 30 dias).
- Nunca commitar valores reais em arquivos versionados.

## Passo a passo de ativacao

1. Criar usuario tecnico por ambiente (staging/prod).
2. Gerar JWT do usuario tecnico e registrar no secret `DASHBOARD_V2_BENCHMARK_TOKEN`.
3. Definir `BASE_URL` e `EMPRESA_ID` corretos por ambiente.
4. Executar workflow manual (`workflow_dispatch`) com `duration_sec=10`.
5. Validar artifact `dashboard-v2-autocannon-<timestamp>.json`.
6. Confirmar gates no summary:
   - `cacheHitP95Pass=true`
   - `coldPass=true`
   - `noHttpErrorPass=true`
7. Habilitar monitoramento de alertas do grupo `dashboard_v2_benchmark`.

## Validacao rapida local (antes de ativar cron)

No diretório `backend`:

```bash
npm run benchmark:dashboard-v2 --empresaId=<TENANT_UUID> --token=<JWT> --baseUrl=<API_URL> --durationSec=5
```

Se passar localmente e no workflow manual, manter o agendamento diario ativo.
