# GDN-403 - Execute contingency and rollback drill

## Data
- 2026-03-07

## Objetivo
- Simular incidente operacional Guardian e executar drill de rollback para modo seguro conforme runbook.

## Implementacao
- Script de drill publicado:
  - `scripts/test-guardian-contingency-rollback-drill.ps1`
- Check de validacao em CI publicado:
  - `scripts/ci/guardian-contingency-rollback-drill-check.ps1`

## Fluxo do drill
1. Validar runbook de incidente com secoes de mitigacao/rollback.
2. Validar baseline de transicao legado (cenario de risco controlado).
3. Simular incidente operacional.
4. Executar rollback para modo mitigado.
5. Aplicar fallback final para modo seguro.
6. Gerar snapshot de monitoramento pos-rollback.

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-contingency-rollback-drill-check.ps1`
- Resultado: PASS

## Evidencias
- Relatorio do drill gerado em `docs/features/evidencias/GDN403_DRILL_DRYRUN_<runId>.md`.
