# GDN-501 - Go live preflight check

- RunId: 20260308-164914
- Inicio: 2026-03-08 16:49:14
- Fim: 2026-03-08 16:49:30
- PASS: 7
- FAIL: 0
- OverallStatus: PASS

| ID | Check | Status |
| --- | --- | --- |
| PREFLIGHT-001 | Legacy transition flags | PASS |
| PREFLIGHT-002 | Incident runbook integrity | PASS |
| PREFLIGHT-003 | Billing/platform monitor | PASS |
| PREFLIGHT-004 | Light peak load | PASS |
| PREFLIGHT-005 | Webhook replay recovery | PASS |
| PREFLIGHT-006 | Alert observability | PASS |
| PREFLIGHT-007 | Support runbook execution | PASS |

## Detalhes

### PREFLIGHT-001 - Legacy transition flags

Guardian transition flags validadas com sucesso.
 - Mode: legacy
 - CanaryPercent: 0
 - Resultado: todo tráfego legado /admin/* permanece ativo.

### PREFLIGHT-002 - Incident runbook integrity

[GDN-404] Runbook Guardian validado com sucesso.
 - Arquivo: docs/runbooks/PLANO_GUARDIAN_INCIDENT_RESPONSE_PILOTO.md

### PREFLIGHT-003 - Billing/platform monitor

[GDN-402] Executando monitor billing/platform em dry-run...

===============================================
 GDN-402 - Monitor billing/platform Guardian
===============================================
RunId: 20260308-164915
BaseUrl: http://localhost:3001
DryRun: True
DurationHours: 24
IntervalSeconds: 1

[GDN-402] Ciclo 1: result=PASS subscriptions=0 payment_failure_indicators=0 avg_latency_ms=0

[GDN-402] CSV salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN402_MONITOR_DRYRUN_20260308-164915.csv
[GDN-402] Resumo salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN402_MONITOR_DRYRUN_20260308-164915.md
[GDN-402] Validacao de monitor billing/platform concluida com sucesso.
 - CSV: docs/features/evidencias/GDN402_MONITOR_DRYRUN_20260308-164915.csv
 - Resumo: docs/features/evidencias/GDN402_MONITOR_DRYRUN_20260308-164915.md

### PREFLIGHT-004 - Light peak load

[GDN-406] Executando light peak load em dry-run...

===============================================
 GDN-406 - Light peak load validation
===============================================
RunId: 20260308-164916
BaseUrl: http://localhost:3001
DryRun: True
Iterations: 3
IntervalMs: 1

[GDN-406] CSV salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN406_LIGHT_LOAD_DRYRUN_20260308-164916.csv
[GDN-406] Resumo salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN406_LIGHT_LOAD_DRYRUN_20260308-164916.md
[GDN-406] Validacao de carga leve concluida com sucesso.
 - CSV: docs/features/evidencias/GDN406_LIGHT_LOAD_DRYRUN_20260308-164916.csv
 - Resumo: docs/features/evidencias/GDN406_LIGHT_LOAD_DRYRUN_20260308-164916.md

### PREFLIGHT-005 - Webhook replay recovery

[GDN-407] Executando validacao de webhook replay/recovery...
[GDN-407] Executando: npm --prefix backend run test -- modules/mercado-pago/mercado-pago.service.spec.ts modules/planos/assinatura-due-date-scheduler.service.spec.ts
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN407_WEBHOOK_REPLAY_RECOVERY_CHECK_20260308-164916.md
[GDN-407] Validacao de webhook replay/recovery concluida com sucesso.
 - Relatorio: docs/features/evidencias/GDN407_WEBHOOK_REPLAY_RECOVERY_CHECK_20260308-164916.md

### PREFLIGHT-006 - Alert observability

[GDN-408] Executando validacao de alert observability...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN408_ALERT_OBSERVABILITY_CHECK_20260308-164926.md
[GDN-408] Validacao de alert observability concluida com sucesso.
 - Relatorio: docs/features/evidencias/GDN408_ALERT_OBSERVABILITY_CHECK_20260308-164926.md

### PREFLIGHT-007 - Support runbook execution

[GDN-409] Executando teste de execucao do runbook por suporte...
[GDN-409] Executando RUNBOOK-001: Incident runbook integrity check
[GDN-409] Executando RUNBOOK-002: Billing/platform monitor operational check
[GDN-409] Executando RUNBOOK-003: Contingency and rollback drill check
[GDN-409] Executando RUNBOOK-004: Support training pack check
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN409_SUPPORT_RUNBOOK_EXECUTION_CHECK_20260308-164926.md
[GDN-409] Execucao do runbook por suporte validada com sucesso.
 - Relatorio: docs/features/evidencias/GDN409_SUPPORT_RUNBOOK_EXECUTION_CHECK_20260308-164926.md

