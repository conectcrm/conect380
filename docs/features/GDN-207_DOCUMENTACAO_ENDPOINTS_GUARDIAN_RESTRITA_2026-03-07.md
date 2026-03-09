# GDN-207 - Restricao da documentacao de endpoints Guardian

## Data
- 2026-03-07

## Objetivo
- Garantir que endpoints `guardian/*` nao aparecam na documentacao publica e que a documentacao guardian seja controlada.

## Mudancas implementadas
- `backend/src/main.ts`
  - Swagger publico (`/api-docs`) agora exclui automaticamente rotas `guardian/*`.
  - Adicionada publicacao opcional de docs guardian em rota dedicada (`/guardian-docs`) somente quando:
    - `GUARDIAN_DOCS_ENABLED=true`
    - `GUARDIAN_DOCS_USER` e `GUARDIAN_DOCS_PASSWORD` definidos
  - Protecao de `guardian-docs` com Basic Auth.
  - Suporte a path customizado via `GUARDIAN_DOCS_PATH`.
- `backend/src/app.module.ts`
  - Middleware de assinatura exclui:
    - `/api-docs`
    - `/guardian-docs`
    - `/guardian-docs-json`
- `backend/src/modules/common/assinatura.middleware.ts`
  - `skipRoutes` atualizado para incluir os caminhos de documentacao acima.

## Comportamento esperado
- Documentacao publica:
  - continua em `/api-docs`
  - nao exibe rotas `guardian/*`
- Documentacao guardian:
  - nao e publicada por padrao
  - quando habilitada por env vars, exige autenticacao Basic Auth

## Validacao executada
- Testes:
  - `npm --prefix backend run test -- src/modules/common/assinatura.middleware.spec.ts src/modules/guardian/guardian.controller.spec.ts src/modules/guardian/guardian-empresas.controller.spec.ts src/modules/guardian/guardian-bff.controller.spec.ts`
- Build:
  - `npm --prefix backend run build`

