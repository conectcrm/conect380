# GDN-210 - Validation backend bypass tests

## Data
- 2026-03-07

## Objetivo
- Validar que o backend nega acesso ao guardian mesmo com tampering no cliente.

## Implementacao
- Novo teste E2E com `AppModule` real:
  - `backend/test/guardian/guardian-backend-bypass.e2e-spec.ts`
- Cenarios cobertos:
  - token valido de `admin` tentando forjar `x-test-role=superadmin` e permissoes no header
  - token valido de `admin` tentando escalar role/permissoes no body de rota guardian
  - JWT adulterado no payload (`role=superadmin`) sem nova assinatura valida
- Resultado esperado:
  - backend continua negando acesso (`401`/`403`) independentemente de manipulacao no frontend.

## Validacao executada
- `npm --prefix backend run test:e2e -- guardian/guardian-backend-bypass.e2e-spec.ts`

