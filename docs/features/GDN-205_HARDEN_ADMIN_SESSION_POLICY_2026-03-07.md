# GDN-205 - Harden admin session policy

## Data
- 2026-03-07

## Objetivo
- Aplicar timeout de inatividade para sessoes administrativas, com revogacao explicita e resposta padronizada.

## Mudancas implementadas
- Persistencia de atividade da sessao:
  - `auth_refresh_tokens.last_activity_at` (entity + migration)
  - migration: `1808105000000-AddLastActivityAtToAuthRefreshTokens.ts`
- Emissao de sessao:
  - `AuthService.issueRefreshToken` grava `lastActivityAt = now`.
- Refresh com hardening:
  - `AuthService.refreshToken` aplica politica de idle timeout para papeis administrativos.
  - Janela configuravel por `AUTH_ADMIN_IDLE_TIMEOUT_MINUTES` (com limites min/max ja aplicados no service).
  - Quando excede a janela:
    - revoga sessao com `revokeReason = idle_timeout`
    - registra evento `securityLogger.adminSessionLogout(..., 'idle_timeout')`
    - retorna `401` com payload:
      - `code: SESSION_IDLE_TIMEOUT`
      - `message: Sua sessao expirou por inatividade. Faca login novamente.`
- Rotacao de refresh dentro da janela permanece normal.

## Validacao executada
- Teste novo:
  - `backend/src/modules/auth/auth.service.refresh.spec.ts`
  - cenarios:
    - revogacao por inatividade para role admin
    - refresh permitido dentro da janela
- Testes de regressao:
  - `guardian-mfa.guard.spec.ts`
  - `guardian.controller.spec.ts`
  - `guardian-empresas.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
  - `assinatura.middleware.spec.ts`
- Build backend:
  - `npm --prefix backend run build`

