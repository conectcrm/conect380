# GDN-307 - Validation e2e admin operation suite

## Data
- 2026-03-07

## Objetivo
- Validar cenarios ponta a ponta de operacao admin Guardian em CI.

## Suite validada
- `backend/test/guardian/guardian-admin-operations-suite.e2e-spec.ts`

## Cobertura de cenario
- Listagem operacional Guardian BFF.
- Operacoes de empresa (suspensao/reativacao/plano).
- Operacoes de billing Guardian.

## Validacao executada
- `npm --prefix backend run test:e2e -- guardian/guardian-admin-operations-suite.e2e-spec.ts`
- Resultado: PASS
