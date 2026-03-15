# GDN-305 - Configure feature flags for legacy transition

## Data
- 2026-03-07

## Objetivo
- Habilitar transicao faseada do backoffice legado (`/admin/*`) para o namespace Guardian (`/guardian/*`) com controle por feature flags.

## Implementacao
- Guard de transicao legado criado em `backend/src/modules/admin/guards/legacy-admin-transition.guard.ts`.
- Modos suportados:
  - `legacy`: mantem trafego no legado.
  - `dual`: mantem legado ativo com sinalizacao de transicao.
  - `canary`: bloqueia percentual configurado no legado e direciona para Guardian.
  - `guardian_only`: bloqueia todo `/admin/*`.
- Controllers legados protegidos com guard:
  - `backend/src/modules/admin/controllers/admin-bff.controller.ts`
  - `backend/src/modules/admin/controllers/admin-empresas.controller.ts`
- Flags adicionadas em `backend/.env.example`:
  - `GUARDIAN_LEGACY_TRANSITION_MODE`
  - `GUARDIAN_LEGACY_CANARY_PERCENT`
- Check de validacao de flags publicado:
  - `scripts/ci/guardian-transition-flags-check.ps1`

## Validacao executada
- `npm --prefix backend run test -- modules/admin/guards/legacy-admin-transition.guard.spec.ts`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-transition-flags-check.ps1`
- `npm --prefix backend run build`
