# GDN-504 - Decommission legacy by controlled phases

## Data
- 2026-03-07

## Objetivo
- Desativar o legado `/admin/*` em fases controladas e retirar dependencias de infraestrutura com seguranca operacional.

## Implementacao
- Checklist de fases publicado:
  - `docs/features/GDN-504_DECOMMISSION_PHASES_CHECKLIST_2026-03-07.md`
- Orquestrador de decommission publicado:
  - `scripts/test-guardian-legacy-decommission-phases.ps1`
- Check CI publicado:
  - `scripts/ci/guardian-legacy-decommission-phases-check.ps1`
- Fases automatizadas no orquestrador:
  - `phase1_read_only_freeze`
  - `phase2_canary_cutover_100`
  - `phase3_guardian_only`
  - `phase4_legacy_route_protection_tests`
  - `phase5_retire_legacy_infra_checks`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-legacy-decommission-phases-check.ps1`
- Resultado: PASS
