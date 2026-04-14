# GDN-209 - Validation unauthorized access tests

## Data
- 2026-03-07

## Objetivo
- Validar que usuarios padrao nao conseguem acessar rotas `guardian/*`.

## Implementacao
- Novo teste E2E:
  - `backend/test/guardian/guardian-unauthorized-access.e2e-spec.ts`
- Cobertura principal:
  - bloqueia `guardian/empresas` para `vendedor` mesmo com permissao declarada
  - bloqueia `guardian/bff/overview` para `admin` (somente `superadmin` permitido)
  - bloqueia `guardian/bff/overview` sem `users.read`
  - bloqueia `guardian/bff/overview` sem MFA validado
  - baseline positivo para `superadmin` + `users.read` + MFA

## Validacao executada
- `npm --prefix backend run test:e2e -- guardian/guardian-unauthorized-access.e2e-spec.ts`

