# GDN-507 - Daily financial consistency validation

- RunId: 20260307-212523
- Inicio: 2026-03-07 21:25:23
- Fim: 2026-03-07 21:25:25
- DuracaoSegundos: 1.76
- BaseUrl: http://192.168.200.44:3000
- DryRun: false
- Status: PASS
- MonitorCsv: docs/features/evidencias/GDN507_FINANCIAL_MONITOR_20260307-212523.csv
- MonitorSummary: docs/features/evidencias/GDN507_FINANCIAL_MONITOR_20260307-212523.md

## Checks de consistencia
- [PASS] subscriptions_total igual a soma dos status :: subscriptions_total=0 status_sum=0
- [PASS] payment_failure_indicators consistente com past_due+suspended :: payment_failure_indicators=0 expected=0
- [PASS] daily_transition_total cobre soma de suspend/reactivate :: daily_transition_total=0 detailed_count=0

## Evidencia do monitor

```text
===============================================
 GDN-402 - Monitor billing/platform Guardian
===============================================
RunId: 20260307-212524
BaseUrl: http://192.168.200.44:3000
DryRun: False
DurationHours: 24
IntervalSeconds: 1

[GDN-402] Ciclo 1: result=PARTIAL subscriptions=0 payment_failure_indicators=0 avg_latency_ms=3.3

[GDN-402] CSV salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-212523.csv
[GDN-402] Resumo salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN507_FINANCIAL_MONITOR_20260307-212523.md
```

## Resultado
- Consistencia financeira diaria validada com sucesso.
