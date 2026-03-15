# GDN-506 - Daily smoke suite in production

- RunId: 20260307-081023
- Inicio: 2026-03-07 08:10:23
- Fim: 2026-03-07 08:10:24
- DuracaoSegundos: 1.32
- BaseUrl: http://localhost:3001
- DryRun: false
- Status: FAIL

## Etapas
- [FAIL] pilot_smoke_suite :: base=http://localhost:3001/api exitCode=1 failCount=7 report=docs/features/evidencias/GDN506_DAILY_SMOKE_PILOT_20260307-081023_1.md
- [FAIL] billing_suspend_reactivate_flow :: Falha ao listar assinaturas: status=404 base=http://localhost:3001/api erro=O servidor remoto retornou um erro: (404) Não Localizado.

## Observacoes
- Smoke base Guardian nao concluiu sem falhas.
- Falha ao listar assinaturas no Guardian.

## Evidencia do smoke base

```text
Resumo: PASS=0 FAIL=7 SKIPPED=0 TOTAL=7
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN506_DAILY_SMOKE_PILOT_20260307-081023_1.md
```

## Resultado
- Suite diaria de smoke com falhas. Revisar etapas acima.
