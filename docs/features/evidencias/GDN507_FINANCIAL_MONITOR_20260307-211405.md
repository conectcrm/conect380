# GDN-402 - Monitoramento diario billing e plataforma Guardian

- RunId: 20260307-211405
- Inicio: 2026-03-07 21:14:05
- Fim: 2026-03-07 21:14:06
- BaseUrl: http://localhost:3001
- DryRun: false
- IntervalSeconds: 1
- DurationHours: 24
- MaxCycles: 1
- Ciclos: 1 (PASS=0, PARTIAL=1)
- CSV: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-211405.csv

## Indicadores principais

- Payment failure indicators (past_due + suspended): inicio=0 fim=0
- Latencia media Guardian (overview+billing+audit): 7.17ms
- Billing audit errors (max no periodo): 0
- Subscriptions total (ultimo ciclo): 0
- Status ativos (ultimo ciclo): 0
- Status past_due (ultimo ciclo): 0
- Status suspended (ultimo ciclo): 0
- Transitions day total (ultimo ciclo): 0

## Anomalias

- Ciclos parciais detectados: 1

## Falhas de requisicao

- auth [POST] status=201 erro=Login sem token reconhecido (access_token/accessToken/token). Use -Token manual quando houver MFA.
- guardian-overview [GET] status=401 erro=O servidor remoto retornou um erro: (401) Não Autorizado.
- guardian-billing-subscriptions [GET] status=401 erro=O servidor remoto retornou um erro: (401) Não Autorizado.
- guardian-audit-critical-billing [GET] status=401 erro=O servidor remoto retornou um erro: (401) Não Autorizado.
