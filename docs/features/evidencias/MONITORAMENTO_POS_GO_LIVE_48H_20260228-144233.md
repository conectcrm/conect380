# Relatorio de monitoramento pos-go-live (48h) - Fluxo Vendas -> Financeiro

- RunId: 20260228-144233
- Inicio: 2026-02-28 14:42:33
- Fim: 2026-02-28 14:42:43
- BaseUrl: http://localhost:3001
- Intervalo (s): 10
- Duracao alvo (h): 48
- Ciclos executados: 2
- Coleta metricas: sim
- Coleta alertas: nao
- EmpresaId: -
- Arquivo de timeline: docs\features\evidencias\MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.csv

## Resumo tecnico

- Falhas de health check: 0
- Falhas de metrics: 0
- Maior idade do ultimo ciclo monitor (s): 104
- Maior taxa de falha no delta (%): -
- Maior quantidade de alertas criticos ativos: -
- Total de anomalias detectadas: 2

## Anomalias

| Timestamp UTC | Codigo | Detalhe |
| --- | --- | --- |
| 2026-02-28T17:42:33Z | MONITOR_STALE_CYCLE | Ultimo ciclo do monitor com idade 94s (limite 80s). |
| 2026-02-28T17:42:43Z | MONITOR_STALE_CYCLE | Ultimo ciclo do monitor com idade 104s (limite 80s). |

## Conclusao automatica

Foram detectadas anomalias. Avaliar triagem usando runbook AP304 e decidir GO/NO-GO operacional.
