# Relatorio de monitoramento pos-go-live (48h) - Fluxo Vendas -> Financeiro

- RunId: 20260407-212604
- Inicio: 2026-04-07 21:26:04
- Fim: 2026-04-07 21:26:16
- BaseUrl: http://localhost:3001
- Intervalo (s): 10
- Intervalo esperado do monitor (s): 300
- Duracao alvo (h): 48
- Ciclos executados: 2
- Coleta metricas: sim
- Coleta alertas: nao
- EmpresaId: -
- Arquivo de timeline: docs\features\evidencias\MONITORAMENTO_POS_GO_LIVE_48H_20260407-212604.csv

## Resumo tecnico

- Falhas de health check: 0
- Falhas de metrics: 0
- Maior idade do ultimo ciclo monitor (s): 265
- Maior taxa de falha no delta (%): -
- Maior quantidade de alertas criticos ativos: -
- Total de anomalias detectadas: 2

## Anomalias

| Timestamp UTC | Codigo | Detalhe |
| --- | --- | --- |
| 2026-04-08T00:26:04Z | MONITOR_COMPANIES_FAILURE | Empresas com falha no ultimo ciclo: 88. |
| 2026-04-08T00:26:16Z | MONITOR_COMPANIES_FAILURE | Empresas com falha no ultimo ciclo: 88. |

## Conclusao automatica

Foram detectadas anomalias. Avaliar triagem usando runbook AP304 e decidir GO/NO-GO operacional.
