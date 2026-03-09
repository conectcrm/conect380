# GDN-309 - Validation permission action matrix

## Data
- 2026-03-07

## Objetivo
- Validar matriz de permissoes por acao critica no Guardian.

## Suite validada
- `backend/test/guardian/guardian-permission-action-matrix.e2e-spec.ts`

## Cobertura de cenario
- Acao critica autorizada para role/permissao correta.
- Bloqueio de acao quando role/permissao nao atende politica.
- Integridade das respostas de erro de autorizacao.

## Validacao executada
- `npm --prefix backend run test:e2e -- guardian/guardian-permission-action-matrix.e2e-spec.ts`
- Resultado: PASS
