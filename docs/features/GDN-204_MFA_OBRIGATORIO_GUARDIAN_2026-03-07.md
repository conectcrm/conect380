# GDN-204 - MFA obrigatorio no namespace Guardian

## Data
- 2026-03-07

## Objetivo
- Bloquear acesso ao `guardian/*` sem segunda etapa de autenticacao validada.

## Mudancas implementadas
- Guard dedicado:
  - `GuardianMfaGuard` criado em `backend/src/modules/guardian/guardian-mfa.guard.ts`
  - Bloqueia com `401` + `code: GUARDIAN_MFA_REQUIRED` quando `req.user.mfa_verified` nao estiver `true`.
- Guard aplicado no namespace guardian:
  - `GuardianController`
  - `GuardianEmpresasController`
  - `GuardianBffController`
- Sessao de autenticacao passou a persistir status de MFA:
  - `auth_refresh_tokens.mfa_verified` (entity + migration)
  - migration: `1808104000000-AddMfaVerifiedToAuthRefreshTokens.ts`
- Fluxo de token:
  - Login com `context = mfa_verify` grava `mfa_verified=true` na sessao.
  - Rotacao de refresh token preserva o estado `mfa_verified`.
  - JWT emitido passa a carregar claim `mfa_verified`.
  - `JwtStrategy` injeta `mfa_verified` no `req.user`.
- Hardening para superadmin:
  - `AuthService.shouldRequireAdminMfa` força MFA para `SUPERADMIN`.

## Validacao executada
- Testes:
  - `guardian-mfa.guard.spec.ts`
  - `guardian.controller.spec.ts`
  - `guardian-empresas.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
  - `assinatura.middleware.spec.ts`
- Build backend:
  - `npm --prefix backend run build`

