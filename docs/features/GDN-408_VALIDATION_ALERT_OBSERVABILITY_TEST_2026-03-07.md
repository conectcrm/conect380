# GDN-408 - Validation alert observability test

## Data
- 2026-03-07

## Objetivo
- Verificar disparo de alertas de observabilidade com severidade e roteamento esperados para operacao Guardian.

## Implementacao
- Script de validacao publicado:
  - `scripts/test-guardian-alert-observability.ps1`
- Check CI publicado:
  - `scripts/ci/guardian-alert-observability-check.ps1`

## Regras de alerta validadas
- `guardian_health_unavailable` -> severidade `P0`, routing `N1,N2,N3`
- `guardian_partial_cycle` -> severidade `P2`, routing `N1,N2`
- `guardian_latency_high` -> severidade `P2`, routing `N1,N2`
- `guardian_payment_failure_indicator_high` -> severidade `P1`, routing `N1,N2`
- `guardian_billing_audit_errors` -> severidade `P1`, routing `N1,N2,N3`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-alert-observability-check.ps1`
- Resultado: PASS
