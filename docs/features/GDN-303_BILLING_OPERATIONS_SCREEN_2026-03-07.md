# GDN-303 - Implement billing operations screen

## Data
- 2026-03-07

## Objetivo
- Entregar tela de operacoes de cobranca no `guardian-web` com status de assinatura por empresa e acoes de suspensao/reativacao.

## Implementacao
- Backend guardian:
  - `GET /guardian/bff/billing/subscriptions` para listar empresas com assinatura associada.
  - `PATCH /guardian/bff/billing/subscriptions/:empresaId/suspend` para suspender assinatura.
  - `PATCH /guardian/bff/billing/subscriptions/:empresaId/reactivate` para reativar assinatura.
  - Regras de permissao explicitas com `Permission.PLANOS_MANAGE` e role `SUPERADMIN` nas acoes mutaveis.
- Frontend guardian:
  - Nova pagina `guardian-web/src/pages/BillingGovernancePage.tsx`.
  - Nova rota `governance/billing` em `guardian-web/src/App.tsx`.
  - Novo item de menu em `guardian-web/src/layout/GuardianLayout.tsx`.
  - Filtros de busca/status e acoes operacionais de suspender/reativar.

## Validacao executada
- `npm --prefix backend run build`
- `npm --prefix backend run test -- modules/guardian/guardian-bff.controller.spec.ts modules/guardian/interceptors/guardian-critical-audit.interceptor.spec.ts`
- `npm --prefix guardian-web run type-check`
- `npm --prefix guardian-web run build`
