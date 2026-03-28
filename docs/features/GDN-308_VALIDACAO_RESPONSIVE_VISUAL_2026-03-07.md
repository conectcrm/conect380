# GDN-308 - Validation responsive and visual checks

## Data
- 2026-03-07

## Objetivo
- Validar responsividade e baseline visual do painel administrativo canonico (`core-admin`).

## Implementacao de validacao
- Suite Playwright dedicada:
  - `e2e/core-admin-responsive-visual.spec.ts`
- Script CI de execucao:
  - `scripts/ci/guardian-responsive-visual-check.ps1`

## Rotas cobertas
- `/core-admin`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-responsive-visual-check.ps1`
- Resultado: PASS
