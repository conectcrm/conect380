# GDN-506 - Validation daily smoke suite in production

## Data
- 2026-03-07

## Objetivo
- Validar diariamente o fluxo essencial de operacao Guardian com foco em login, leitura operacional e fluxo de bloqueio/reativacao de assinatura.

## Implementacao
- Harness de validacao diaria publicado:
  - `scripts/test-guardian-daily-smoke-production.ps1`
- Check CI publicado:
  - `scripts/ci/guardian-daily-smoke-production-check.ps1`
- Fluxos cobertos:
  - smoke base Guardian (health, overview, companies, billing, audit)
  - fluxo de billing `suspend/reactivate` (simulado em dry-run e executavel em modo real)

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-daily-smoke-production-check.ps1`
- Resultado: PASS
