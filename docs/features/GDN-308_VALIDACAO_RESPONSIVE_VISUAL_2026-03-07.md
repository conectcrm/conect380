# GDN-308 - Validation responsive and visual checks

## Data
- 2026-03-07

## Objetivo
- Validar responsividade e baseline visual das telas chave do Guardian.

## Implementacao de validacao
- Suite Playwright dedicada:
  - `e2e/guardian-responsive-visual.spec.ts`
- Script CI de execucao:
  - `scripts/ci/guardian-responsive-visual-check.ps1`

## Rotas cobertas
- `/`
- `/governance/users`
- `/governance/companies`
- `/governance/billing`
- `/governance/audit`
- `/governance/system`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-responsive-visual-check.ps1`
- Resultado: PASS
