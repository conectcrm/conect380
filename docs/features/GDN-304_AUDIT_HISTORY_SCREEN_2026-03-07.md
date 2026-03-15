# GDN-304 - Implement audit history screen

## Data
- 2026-03-07

## Objetivo
- Expor trilha critica de auditoria guardian com filtros e exportacao para uso operacional do superadmin.

## Implementacao
- Backend guardian:
  - Servico `GuardianCriticalAuditService` expandido com consulta paginada/filtrada e exportacao.
  - Endpoints adicionados em `guardian-bff`:
    - `GET /guardian/bff/audit/critical`
    - `GET /guardian/bff/audit/critical/export?format=json|csv`
  - Classificacao de alvo de auditoria expandida no interceptor para `billing_subscription` e `critical_audit`.
- Frontend guardian:
  - `guardian-web/src/pages/AuditGovernancePage.tsx` migrada para consumir trilha critica.
  - Filtros server-side por outcome, metodo, tipo alvo, rota e periodo.
  - Exportacao CSV/JSON com download direto do navegador.

## Validacao executada
- `npm --prefix backend run build`
- `npm --prefix backend run test -- modules/guardian/guardian-bff.controller.spec.ts modules/guardian/interceptors/guardian-critical-audit.interceptor.spec.ts`
- `npm --prefix guardian-web run type-check`
- `npm --prefix guardian-web run build`
