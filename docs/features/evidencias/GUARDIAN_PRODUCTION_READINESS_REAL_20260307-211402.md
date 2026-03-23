# Guardian production readiness execution

- RunId: 20260307-211403
- BaseUrl: http://localhost:3001
- Mode: real
- Inicio: 2026-03-07 21:14:03
- Fim: 2026-03-07 21:15:27
- DuracaoSegundos: 84.3
- Status: FAIL

## Steps
- [FAIL] GDN506_daily_smoke :: exitCode=1
- [PASS] GDN507_daily_financial_consistency :: exitCode=0
- [PASS] GDN508_critical_audit_checks :: exitCode=0
- [PASS] GDN509_rollback_simulation :: exitCode=0
- [PASS] GDN511_final_acceptance_entitlement :: exitCode=0
- [PASS] GDN512_final_acceptance_guardian_isolation :: exitCode=0
- [PASS] GDN513_final_acceptance_webhook_reliability :: exitCode=0
- [PASS] GDN514_final_acceptance_e2e_critical_suite :: exitCode=0
- [PASS] GDN515_final_acceptance_runbook_readiness :: exitCode=0
- [PASS] GDN516_final_acceptance_legacy_decommission :: exitCode=0

## Evidencias

### GDN506_daily_smoke
```text
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GUARDIAN_PRODUCTION_READINESS_GDN506_20260307-211403.md
```

### GDN507_daily_financial_consistency
```text
[GDN-507] Executando monitor financeiro diario...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GUARDIAN_PRODUCTION_READINESS_GDN507_20260307-211403.md
```

### GDN508_critical_audit_checks
```text
[GDN-508] Executando validacao de alertas/auditoria critica...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GUARDIAN_PRODUCTION_READINESS_GDN508_20260307-211403.md
```

### GDN509_rollback_simulation
```text
[GDN-509] Executando simulacao documentada de rollback...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GUARDIAN_PRODUCTION_READINESS_GDN509_20260307-211403.md
```

### GDN511_final_acceptance_entitlement
```text
[GDN-511] Executando aceite final de entitlement backend...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN511_ENTITLEMENT_ACCEPTANCE_CHECK_20260307-211409.md
[GDN-511] Aceite final de entitlement backend validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN511_ENTITLEMENT_ACCEPTANCE_CHECK_20260307-211409.md
```

### GDN512_final_acceptance_guardian_isolation
```text
[GDN-512] Executando aceite final de isolamento Guardian...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN512_GUARDIAN_ISOLATION_ACCEPTANCE_CHECK_20260307-211421.md
[GDN-512] Aceite final de isolamento Guardian validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN512_GUARDIAN_ISOLATION_ACCEPTANCE_CHECK_20260307-211421.md
```

### GDN513_final_acceptance_webhook_reliability
```text
[GDN-513] Executando aceite final de confiabilidade de webhook...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN513_WEBHOOK_RELIABILITY_ACCEPTANCE_CHECK_20260307-211432.md
[GDN-513] Aceite final de confiabilidade de webhook validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN513_WEBHOOK_RELIABILITY_ACCEPTANCE_CHECK_20260307-211432.md
```

### GDN514_final_acceptance_e2e_critical_suite
```text
[GDN-514] Executando aceite final da suite critica de release...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN514_E2E_CRITICAL_ACCEPTANCE_CHECK_20260307-211445.md
[GDN-514] Aceite final da suite critica validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN514_E2E_CRITICAL_ACCEPTANCE_CHECK_20260307-211445.md
```

### GDN515_final_acceptance_runbook_readiness
```text
[GDN-515] Executando aceite final de prontidao de runbook...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN515_RUNBOOK_READINESS_ACCEPTANCE_CHECK_20260307-211505.md
[GDN-515] Aceite final de prontidao de runbook validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN515_RUNBOOK_READINESS_ACCEPTANCE_CHECK_20260307-211505.md
```

### GDN516_final_acceptance_legacy_decommission
```text
[GDN-516] Executando aceite final de descomissionamento legado...
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN516_LEGACY_DECOMMISSION_ACCEPTANCE_CHECK_20260307-211510.md
[GDN-516] Aceite final de descomissionamento legado validado com sucesso.
 - Relatorio: docs/features/evidencias/GDN516_LEGACY_DECOMMISSION_ACCEPTANCE_CHECK_20260307-211510.md
```

## Resultado
- Readiness consolidado com falhas. Revisar steps e relatorios individuais.
