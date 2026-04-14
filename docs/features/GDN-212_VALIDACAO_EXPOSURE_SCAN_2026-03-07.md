# GDN-212 - Validation exposure scan tests

## Data
- 2026-03-07

## Objetivo
- Garantir que bundle do app cliente nao exponha rotas/endpoints `guardian/*` nem trilhas admin removidas.

## Implementacao
- Scanner dedicado criado:
  - `scripts/ci/guardian-exposure-scan.ps1`
- Comportamento:
  - opcionalmente executa build do frontend
  - varre `frontend-web/build/static/js/*.js`
  - falha se encontrar padroes sensiveis como:
    - `/guardian/`, `/api/guardian`, `/guardian/bff`, `/guardian/empresas`
    - `/admin/empresas`, `/admin/system-branding`, `/admin/sistema`, `/admin/branding`
    - `/nuclei/administracao`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-exposure-scan.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-exposure-scan.ps1 -SkipBuild`

