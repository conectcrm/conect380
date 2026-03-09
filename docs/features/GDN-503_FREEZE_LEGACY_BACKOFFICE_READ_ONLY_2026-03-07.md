# GDN-503 - Freeze legacy backoffice to read only

## Data
- 2026-03-07

## Objetivo
- Congelar o backoffice legado (`/admin/*`) em modo somente leitura para eliminar operacoes de escrita fora do namespace Guardian.

## Implementacao
- `LegacyAdminTransitionGuard` atualizado para respeitar a flag:
  - `GUARDIAN_LEGACY_READ_ONLY`
- Quando ativo:
  - permite apenas `GET`, `HEAD`, `OPTIONS` no legado
  - bloqueia `POST`, `PUT`, `PATCH`, `DELETE` com `LEGACY_ADMIN_READ_ONLY`
  - adiciona header `x-guardian-legacy-read-only: true` nas respostas permitidas
- Variavel adicionada em `backend/.env.example`:
  - `GUARDIAN_LEGACY_READ_ONLY=false`
- Testes do guard ampliados em:
  - `backend/src/modules/admin/guards/legacy-admin-transition.guard.spec.ts`
- Harness de validacao publicado:
  - `scripts/test-guardian-legacy-read-only-freeze.ps1`
- Check CI publicado:
  - `scripts/ci/guardian-legacy-read-only-freeze-check.ps1`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-legacy-read-only-freeze-check.ps1`
- Resultado: PASS
