# GDN-402 - Monitoramento diario billing e plataforma Guardian

- RunId: 20260307-081438
- Inicio: 2026-03-07 08:14:38
- Fim: 2026-03-07 08:14:38
- BaseUrl: http://localhost:3001
- DryRun: false
- IntervalSeconds: 1
- DurationHours: 24
- MaxCycles: 1
- Ciclos: 1 (PASS=0, PARTIAL=1)
- CSV: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-081437.csv

## Indicadores principais

- Payment failure indicators (past_due + suspended): inicio=0 fim=0
- Latencia media Guardian (overview+billing+audit): 5.41ms
- Billing audit errors (max no periodo): 0
- Subscriptions total (ultimo ciclo): 0
- Status ativos (ultimo ciclo): 0
- Status past_due (ultimo ciclo): 0
- Status suspended (ultimo ciclo): 0
- Transitions day total (ultimo ciclo): 0

## Anomalias

- Ciclos parciais detectados: 1

## Falhas de requisicao

- guardian-overview [GET] status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- guardian-billing-subscriptions [GET] status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- guardian-audit-critical-billing [GET] status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
