# Guardian Real Execution Blocker

## Data
- 2026-03-07

## Resumo
- Credencial de superadmin validada (`/auth/login` retornando `201`) nos ambientes testados.
- Execucao consolidada em modo real bloqueada porque as rotas do namespace Guardian nao estao publicadas (`404`).

## Evidencias
- Readiness real consolidado:
  - `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_REAL_20260307-081436.md`
- Discovery de endpoints Guardian:
  - `docs/features/evidencias/GUARDIAN_ENDPOINT_DISCOVERY_20260307-081639.md`

## Impacto
- `GDN-506` falha no real mode por ausencia de endpoints:
  - `/guardian/bff/overview`
  - `/guardian/bff/companies`
  - `/guardian/bff/billing/subscriptions`
  - `/guardian/bff/audit/critical`

## Proximas acoes
1. Publicar backend com `GuardianModule` ativo no ambiente alvo.
2. Validar rota apos deploy:
   - `GET <base>/guardian/bff/overview` ou `GET <base>/api/guardian/bff/overview`
3. Reexecutar:
   - `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-production-readiness-real-check.ps1 -BaseUrl <base_url> -Email <superadmin_email> -Senha <superadmin_senha> -TargetEmpresaId <empresa_uuid>`
