# GDN-206 / GDN-212 - Endurecimento da superficie admin no app cliente

## Data
- 2026-03-09

## Objetivo
- Reduzir superficie legada de backoffice dentro do `frontend-web`.
- Impedir regressao de exposicao de rotas/endpoints administrativos no cliente.

## Mudancas aplicadas
- Remocao de componentes e paginas legadas de administracao no app cliente:
  - `frontend-web/src/features/admin/**`
  - `frontend-web/src/pages/GestaoModulosPage.tsx`
  - `frontend-web/src/services/adminEmpresasService.ts`
  - `frontend-web/src/services/adminModulosService.ts`
  - `frontend-web/src/services/systemBrandingAdminService.ts`
  - `frontend-web/src/components/Billing/Admin/**`
- Reforco de CI em `.github/workflows/ci.yml`:
  - `Frontend - E2E Billing Critical (Playwright)` passou a considerar qualquer alteracao em `frontend-web/src/**`.
  - Novo job `Frontend - Guardian Exposure Scan` incluido no `Status Final do CI`.
- Reforco do script `scripts/ci/guardian-exposure-scan.ps1`:
  - scan de **source** (`frontend-web/src`, excluindo `__tests__`) para strings proibidas de admin legado.
  - scan de **bundle** (`frontend-web/build/static/js`) para exposicao de namespace guardian/admin.

## Validacoes executadas
- `npm --prefix frontend-web run type-check`: PASS
- `CI=true npm --prefix frontend-web test -- --runInBand src/config/__tests__/menuConfig.permissions.test.ts`: PASS (30 testes)
- `CI=true npm --prefix frontend-web test -- --runInBand src/pages/billing/__tests__/BillingPage.routing.test.tsx`: PASS (6 testes)
- `npm --prefix frontend-web run build`: PASS
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-exposure-scan.ps1 -SkipBuild`: PASS

## Validacao CI
- Workflow: `CI - Testes e Build`
- Run: `22853496747`
- Resultado: PASS (incluindo `Frontend - Guardian Exposure Scan`, `Frontend - E2E Billing Critical (Playwright)` e `Status Final do CI`).

## Gate
- Sprint 5 (seguranca/observabilidade) - item de hardening de superficie admin no cliente: PASS.
