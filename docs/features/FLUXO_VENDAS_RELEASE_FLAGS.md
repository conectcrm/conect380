# Matriz de Release e Feature Flags - Fluxo de Vendas

## Objetivo

Documento operacional para habilitacao de rotas e flags do Fluxo de Vendas por ambiente, alinhando frontend e backend.

Escopo:

- Leads
- Pipeline/Oportunidades
- Propostas/Portal
- Contratos
- Faturamento/Pagamentos
- Gateways de pagamento

## Modos de release

## Decisao operacional atual

- Modo alvo atual desta linha: **GO Core Vendas**
- Motivo: liberar fluxo comercial principal com menor risco operacional, mantendo contratos/faturamento/gateways fora do escopo inicial.
- Criterio para migrar para GO Full: guardrails de flags em full + E2E vendas full + janela de deploy dedicada com providers definidos.

### GO Core Vendas (recomendado)

Inclui:

- Leads
- Pipeline/Oportunidades
- Propostas
- Portal de propostas (token persistido)

Fora do escopo:

- Contratos (UI bloqueada por MVP mode, se aplicavel)
- Faturamento/Billing
- Gateways de pagamento

### GO Full Vendas

Inclui:

- Tudo do GO Core
- Contratos
- Faturamento/Pagamentos
- Gateways (somente providers explicitamente habilitados)

## Frontend (gates por MVP)

Arquivo principal:

- `frontend-web/src/config/mvpScope.ts`

Flag:

- `REACT_APP_MVP_MODE=true`

Comportamento atual relevante:

- Rotas de `financeiro`, `faturamento`, `billing` e `contratos` ficam bloqueadas por `ModuleUnderConstruction` quando MVP mode esta ativo.
- Rotas comerciais core (ex.: `leads`, `pipeline`, `propostas`) permanecem habilitadas no MVP.

Rotas bloqueadas no MVP (exemplos):

- `/billing`
- `/assinaturas`
- `/faturamento`
- `/financeiro`
- `/contratos`

### Gate visual de gateway no faturamento (frontend)

Arquivos:

- `frontend-web/src/config/pagamentosGatewayFlags.ts`
- `frontend-web/src/pages/faturamento/FaturamentoPage.tsx`

Variaveis (frontend):

- `REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS`
- `REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED`

Regras:

- `REACT_APP_MVP_MODE=true` => bloqueia UI de gateway e link de pagamento
- lista vazia + sem bypass => bloqueia acoes "Pagar Online" / "Gerar Link" com mensagem contextual
- `ALLOW_UNIMPLEMENTED=true` => libera UI (uso apenas em dev/homolog)

## Backend (gates por ambiente)

### Gateways de pagamento (default deny em producao)

Arquivos:

- `backend/src/modules/pagamentos/services/gateway-provider-support.util.ts`
- `backend/src/modules/pagamentos/services/configuracao-gateway.service.ts`
- `backend/src/modules/pagamentos/services/pagamentos.service.ts`

Variaveis:

- `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS`
- `PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED`

Regras:

- `NODE_ENV=production` + lista vazia => bloqueia providers (`501 Not Implemented`)
- `NODE_ENV=test` + lista vazia => liberado para compatibilidade de testes
- `PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=true` => libera todos (usar so em dev/homolog)

Valores aceitos em `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS`:

- `stripe`
- `mercado_pago`
- `pagseguro`

Exemplo (homolog com Stripe e Mercado Pago habilitados):

```bash
PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=stripe,mercado_pago
PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false
```

## Matriz de habilitacao por ambiente

| Ambiente | `REACT_APP_MVP_MODE` | Contratos/Faturamento UI | Gateways frontend | Gateways backend | Uso recomendado |
|---|---:|---|---|---|---|
| Local dev (core) | `true` | Bloqueados | Bloqueado | Bypass opcional | Desenvolvimento GO Core |
| Local dev (full) | `false` | Habilitados | `ALLOW_UNIMPLEMENTED=true` ou lista | `ALLOW_UNIMPLEMENTED=true` ou lista | Desenvolvimento GO Full |
| Homolog (core) | `true` | Bloqueados | Bloqueado | Lista vazia (bloqueado) | Validacao GO Core |
| Homolog (full) | `false` | Habilitados | Lista explicita | Lista explicita | Validacao GO Full |
| Producao (core) | `true` | Bloqueados | Bloqueado | Lista vazia (bloqueado) | Release GO Core |
| Producao (full) | `false` | Habilitados | Lista explicita | Lista explicita | Release GO Full |

## Checklist de rollout (resumo)

1. Definir `GO Core` ou `GO Full`.
2. Ajustar `REACT_APP_MVP_MODE` no frontend.
3. Configurar `REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS` no frontend (somente se GO Full).
4. Configurar `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS` no backend (somente se GO Full).
5. Validar endpoints de gateway retornando `501` quando provider nao estiver habilitado.
6. Validar E2E do fluxo correspondente ao modo de release.

## Validacao automatizada das flags

Script:

- `scripts/ci/validate-sales-release-mode.mjs`

Comando baseline (GO Core seguro por padrao dos exemplos):

```bash
npm run validate:release:vendas:core
```

Preflight completo GO Core (guardrail + build + E2E criticos):

```bash
npm run preflight:go-live:vendas:core
```

Comando para validar GO Full com arquivos reais de deploy:

```bash
node scripts/ci/validate-sales-release-mode.mjs \
  --mode full \
  --frontend-env frontend-web/.env \
  --backend-env backend/.env.production
```

Regras verificadas automaticamente:

1. Core: `REACT_APP_MVP_MODE=true`, bypass `ALLOW_UNIMPLEMENTED=false`, listas de providers vazias.
2. Full: `REACT_APP_MVP_MODE=false`, bypass `ALLOW_UNIMPLEMENTED=false`, listas de providers preenchidas.
3. Full: listas de providers frontend e backend alinhadas.
4. Providers aceitos apenas: `stripe`, `mercado_pago`, `pagseguro`.
