# Relatorio de monitoramento pos-go-live (48h) - Fluxo Vendas -> Financeiro

- RunId: 20260305-085356
- Inicio: 2026-03-05 08:53:56
- Fim: 2026-03-05 08:54:06
- BaseUrl: http://localhost:3001
- Intervalo (s): 10
- Intervalo esperado do monitor (s): 300
- Duracao alvo (h): 48
- Ciclos executados: 2
- Coleta metricas: sim
- Coleta alertas: sim
- EmpresaId: 250cc3ac-617b-4d8b-be6e-b14901e4edde
- Arquivo de timeline: docs\features\evidencias\MONITORAMENTO_POS_GO_LIVE_48H_20260305-085356.csv

## Resumo tecnico

- Falhas de health check: 0
- Falhas de metrics: 0
- Maior idade do ultimo ciclo monitor (s): 74
- Maior taxa de falha no delta (%): -
- Maior quantidade de alertas criticos ativos: 1
- Total de anomalias detectadas: 2

## Anomalias

| Timestamp UTC | Codigo | Detalhe |
| --- | --- | --- |
| 2026-03-05T11:53:56Z | ALERTAS_CRITICAL_OPEN | Alertas criticos ativos na fila: 1. |
| 2026-03-05T11:54:06Z | ALERTAS_CRITICAL_OPEN | Alertas criticos ativos na fila: 1. |

## Conclusao automatica

Foram detectadas anomalias. Avaliar triagem usando runbook AP304 e decidir GO/NO-GO operacional.
