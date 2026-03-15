# GDN-211 - Validation MFA and session tests

## Data
- 2026-03-07

## Objetivo
- Validar comportamento de MFA no guardian e hardening de sessao administrativa.

## Implementacao
- Novo teste E2E de fluxo MFA:
  - `backend/test/guardian/guardian-mfa-session.e2e-spec.ts`
  - valida:
    - login de `superadmin` exige `MFA_REQUIRED`
    - `mfa/verify` emite tokens
    - claim `mfa_verified=true` no access token
    - refresh preserva `mfa_verified=true`
- Reforco de validacao de idle timeout (service):
  - `backend/src/modules/auth/auth.service.refresh.spec.ts`
  - inclui cenario com `lastActivityAt` vindo como string (comportamento real de driver SQL)
  - valida retorno `SESSION_IDLE_TIMEOUT` para sessao administrativa inativa.

## Validacao executada
- `npm --prefix backend run test:e2e -- guardian/guardian-mfa-session.e2e-spec.ts`
- `npm --prefix backend test -- --runInBand modules/auth/auth.service.refresh.spec.ts`

