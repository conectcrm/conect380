# GDN-507 - Daily financial consistency validation

- RunId: 20260307-211739
- Inicio: 2026-03-07 21:17:39
- Fim: 2026-03-07 21:17:42
- DuracaoSegundos: 2.58
- BaseUrl: http://localhost:3001
- DryRun: false
- Status: PASS
- MonitorCsv: docs/features/evidencias/GDN507_FINANCIAL_MONITOR_20260307-211739.csv
- MonitorSummary: docs/features/evidencias/GDN507_FINANCIAL_MONITOR_20260307-211739.md

## Checks de consistencia
- [PASS] subscriptions_total igual a soma dos status :: subscriptions_total=8 status_sum=8
- [PASS] payment_failure_indicators consistente com past_due+suspended :: payment_failure_indicators=0 expected=0
- [PASS] daily_transition_total cobre soma de suspend/reactivate :: daily_transition_total=0 detailed_count=0

## Evidencia do monitor

```text
===============================================
 GDN-402 - Monitor billing/platform Guardian
===============================================
RunId: 20260307-211740
BaseUrl: http://localhost:3001
DryRun: False
DurationHours: 24
IntervalSeconds: 1

[GDN-402] Ciclo 1: result=PASS subscriptions=8 payment_failure_indicators=0 avg_latency_ms=42.57

[GDN-402] CSV salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-211739.csv
[GDN-402] Resumo salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-211739.md
```

## Resultado
- Consistencia financeira diaria validada com sucesso.
