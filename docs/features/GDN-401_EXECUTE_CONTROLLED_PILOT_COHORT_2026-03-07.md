# GDN-401 - Execute controlled pilot cohort

## Data
- 2026-03-07

## Objetivo
- Preparar e executar trilha controlada de piloto Guardian por coorte, com criterios de monitoramento, rollback e decisao GO/NO-GO.

## Implementacao
- Roteiro operacional de piloto publicado:
  - `docs/features/GDN-401_ROTEIRO_PILOTO_CONTROLADO_GUARDIAN_2026-03-07.md`
- Checklist de monitoramento 48h publicado:
  - `docs/features/GDN-401_CHECKLIST_PILOTO_48H_GUARDIAN_2026-03-07.md`
- Arquivo de coorte piloto versionado:
  - `docs/features/GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv`
- Script de smoke para rodada tecnica do piloto:
  - `scripts/test-guardian-piloto-cohort.ps1`
- Check de prontidao de piloto em CI:
  - `scripts/ci/guardian-pilot-cohort-readiness-check.ps1`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-pilot-cohort-readiness-check.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/test-guardian-piloto-cohort.ps1 -DryRun`
- Resultado: PASS (readiness + dry-run tecnico)

## Observacao operacional
- A execucao com contas reais depende de preenchimento da coorte com `empresa_id` e owners oficiais antes da janela de 48h.
