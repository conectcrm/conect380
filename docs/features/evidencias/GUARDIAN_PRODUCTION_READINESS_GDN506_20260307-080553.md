# GDN-506 - Daily smoke suite in production

- RunId: 20260307-080553
- Inicio: 2026-03-07 08:05:53
- Fim: 2026-03-07 08:05:54
- DuracaoSegundos: 0.85
- BaseUrl: http://localhost:3001
- DryRun: false
- Status: FAIL

## Etapas
- [FAIL] pilot_smoke_suite :: exitCode=1 failCount=5 report=docs/features/evidencias/GDN506_DAILY_SMOKE_PILOT_20260307-080553.md
- [FAIL] billing_suspend_reactivate_flow :: Falha ao listar assinaturas: status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.

## Observacoes
- Smoke base Guardian nao concluiu sem falhas.
- Falha ao listar assinaturas no Guardian.

## Evidencia do smoke base

```text
Resumo: PASS=2 FAIL=5 SKIPPED=0 TOTAL=7
Relatorio salvo em: C:\Projetos\conect360\docs\features\evidencias\GDN506_DAILY_SMOKE_PILOT_20260307-080553.md
```

## Resultado
- Suite diaria de smoke com falhas. Revisar etapas acima.
