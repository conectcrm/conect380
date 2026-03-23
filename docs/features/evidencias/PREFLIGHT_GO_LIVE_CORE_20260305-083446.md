# Evidencia - Preflight GO Core (2026-03-05 08:34:46)

## Contexto

- Falha anterior no preflight:
  - `e2e/pipeline-stage-validation.spec.ts`
  - Cenario `backend retorna 400` nao encontrava `data-testid="modal-mudanca-estagio-error"`.
- Causa raiz:
  - teste interceptava `PATCH /oportunidades/1`;
  - frontend usa `PATCH /oportunidades/1/estagio`.

## Ajuste aplicado

- Arquivo alterado:
  - `e2e/pipeline-stage-validation.spec.ts`
- Mudancas:
  - regex do handler de erro para `\/oportunidades\/1\/estagio$`;
  - rota de sucesso para `**/oportunidades/1/estagio`.

## Validacoes executadas

1. `npm run test:e2e -- e2e/pipeline-stage-validation.spec.ts --project=chromium --reporter=list`
   - Resultado: PASS (2/2)
2. `npm run preflight:go-live:vendas:core`
   - Resultado: PASS (pipeline UI 4/4, backend e2e e builds ok)

## Resultado

- Gate tecnico `preflight:go-live:vendas:core`: APROVADO.
