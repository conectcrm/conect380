# Guardian Release Handoff - Next Steps

## Data
- 2026-03-07

## Status atual
- Programa Guardian fechado no autopilot (`programCompleted=true`).
- Dry-run consolidado de readiness: PASS.

## Proximo passo operacional (real mode)
1. Definir variaveis de ambiente:
   - `GUARDIAN_RELEASE_BASE_URL`
   - `GUARDIAN_RELEASE_TOKEN` ou `GUARDIAN_RELEASE_EMAIL` + `GUARDIAN_RELEASE_SENHA`
   - opcional: `GUARDIAN_RELEASE_TARGET_EMPRESA_ID`
2. Executar:
   - `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-production-readiness-real-check.ps1`
3. Confirmar relatorio `PASS` em `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_REAL_<timestamp>.md`.

## Comando direto (sem variaveis)
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-production-readiness-real-check.ps1 -BaseUrl https://api.seu-dominio -Token <jwt_superadmin> -TargetEmpresaId <empresa_uuid>`

## Evidencia dry-run consolidada
- `docs/features/evidencias/GUARDIAN_PRODUCTION_READINESS_CHECK_20260307-080218.md`
