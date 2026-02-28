# AP303 - Observabilidade do monitor de alertas financeiros (2026-03)

## 1. Objetivo

Definir como monitorar o job automatico de recalculo de alertas operacionais financeiros.

Implementacao tecnica:

- `backend/src/modules/financeiro/services/alerta-operacional-financeiro-monitor.service.ts`
- `backend/src/config/metrics.ts`
- `backend/config/alert-rules.yml`
- `observability/grafana/dashboards/financeiro-alertas-monitor.json`
- Endpoint Prometheus: `GET /metrics`

## 2. Variaveis de ambiente

- `FINANCEIRO_ALERTAS_AUTO_RECALCULO_ENABLED`
  - `true`/omitido: habilitado.
  - `false`: desabilitado.
- `FINANCEIRO_ALERTAS_AUTO_RECALCULO_INTERVAL_MS`
  - Intervalo do ciclo em milissegundos.
  - Default atual: `300000` (5 minutos).

## 3. Metricas publicadas

- `conectcrm_financeiro_alertas_monitor_ciclos_total{status}`
  - Status possiveis:
    - `success`
    - `partial`
    - `skipped_concurrent`
    - `fatal_error`
- `conectcrm_financeiro_alertas_monitor_ultimo_ciclo_timestamp_seconds`
- `conectcrm_financeiro_alertas_monitor_ultimo_ciclo_duracao_segundos`
- `conectcrm_financeiro_alertas_monitor_empresas_processadas_ultimo_ciclo`
- `conectcrm_financeiro_alertas_monitor_empresas_falha_ultimo_ciclo`
- `conectcrm_financeiro_alertas_monitor_totais_ultimo_ciclo{tipo}`
  - `tipo=gerados|resolvidos|ativos`

## 4. Consultas recomendadas (PromQL)

- Ciclos bem-sucedidos por hora:

```promql
sum(increase(conectcrm_financeiro_alertas_monitor_ciclos_total{status="success"}[1h]))
```

- Taxa de ciclos com falha parcial/total (15 min):

```promql
sum(increase(conectcrm_financeiro_alertas_monitor_ciclos_total{status=~"partial|fatal_error"}[15m]))
/
clamp_min(sum(increase(conectcrm_financeiro_alertas_monitor_ciclos_total[15m])), 1)
```

- Idade do ultimo ciclo (segundos):

```promql
time() - conectcrm_financeiro_alertas_monitor_ultimo_ciclo_timestamp_seconds
```

- Duracao do ultimo ciclo:

```promql
conectcrm_financeiro_alertas_monitor_ultimo_ciclo_duracao_segundos
```

- Empresas com falha no ultimo ciclo:

```promql
conectcrm_financeiro_alertas_monitor_empresas_falha_ultimo_ciclo
```

- Totais de alertas no ultimo ciclo:

```promql
conectcrm_financeiro_alertas_monitor_totais_ultimo_ciclo
```

## 5. Alertas operacionais sugeridos

1. `stale_cycle`:
   - Condicao: `time() - ultimo_ciclo_timestamp > 2 * interval`.
2. `high_failure_rate`:
   - Condicao: taxa de `partial|fatal_error` > 20% por 30 min.
3. `fatal_cycle`:
   - Condicao: `increase(...{status="fatal_error"}[10m]) >= 1`.
4. `latency_spike`:
   - Condicao: `ultimo_ciclo_duracao_segundos` acima do baseline acordado.

Obs: as regras Prometheus desta secao foram incorporadas em `backend/config/alert-rules.yml`
no grupo `financeiro_alertas_monitor`.

## 6. Checklist de homologacao

1. Confirmar endpoint `/metrics` expondo todas as metricas novas.
2. Desabilitar/habilitar via env e validar comportamento do monitor.
3. Forcar erro em tenant de teste e validar incremento de `status="partial"` ou `status="fatal_error"`.
4. Validar que ciclos normais incrementam `status="success"`.

## 7. Validacao runtime local (2026-02-28)

1. Prometheus com regras carregadas:
   - `GET http://localhost:9090/-/ready` -> `Prometheus Server is Ready.`
   - `GET http://localhost:9090/api/v1/rules` com grupo `financeiro_alertas_monitor`.
2. Grafana operacional:
   - `GET http://localhost:3002/api/health` -> `ok`.
3. Alertmanager estabilizado:
   - Ajuste em `backend/config/alertmanager-test.yml` para modo local sem `slack_configs` com `api_url` template.
   - `GET http://localhost:9093/-/healthy` -> `OK`.
   - `GET http://localhost:9093/-/ready` -> `OK`.
