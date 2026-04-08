# Checklist de Liberacao - Financeiro Essencial vs Completo (2026-04)

## 1. Objetivo

Padronizar o rollout do modulo financeiro em dois niveis:

- **Financeiro Essencial**: faturamento, contas a pagar, contas a receber, fluxo de caixa, tesouraria, conciliacao, centros de custo, fornecedores, contas bancarias e aprovacoes.
- **Financeiro Completo**: inclui fiscal oficial e boleto, mantendo o mesmo baseline tecnico de seguranca e multi-tenant.

## 2. Escopo funcional atual

- Rotas ativas no pacote essencial:
  - `/financeiro/faturamento`
  - `/financeiro/contas-pagar`
  - `/financeiro/contas-receber`
  - `/financeiro/fluxo-caixa`
  - `/financeiro/tesouraria`
  - `/financeiro/fornecedores`
  - `/financeiro/contas-bancarias`
  - `/financeiro/aprovacoes`
  - `/financeiro/conciliacao`
  - `/financeiro/centro-custos`
- Fora do escopo desta fase:
  - emissao fiscal oficial NFe/NFSe
  - preflight fiscal oficial

## 3. Matriz de flags por ambiente

- **Core/MVP (vendas com compras)**:
  - `REACT_APP_MVP_MODE=true`
  - `FINANCEIRO_MVP_MODE=true`
  - `REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=` (vazio)
  - `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=` (vazio)
  - `REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false`
  - `PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false`
- **Full (financeiro liberado)**:
  - `REACT_APP_MVP_MODE=false`
  - `FINANCEIRO_MVP_MODE=false`
  - `REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED=true`
  - `REACT_APP_FINANCEIRO_BOLETO_ENABLED=true`
  - `FINANCEIRO_FISCAL_DOCS_ENABLED=true`
  - `FINANCEIRO_BOLETO_ENABLED=true`
  - `REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=mercado_pago`
  - `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=mercado_pago`

## 4. Gate tecnico minimo de liberacao

Executar antes de GO/NO-GO:

1. `npm run validate:release:vendas:core`
2. `npm run validate:release:vendas:full`
3. `npm --prefix backend test -- --runInBand src/modules/financeiro`
4. `npm --prefix backend test -- --runInBand src/modules/pagamentos src/modules/planos src/modules/propostas/propostas.mvp-scope.spec.ts src/modules/faturamento/financeiro-feature-flags.spec.ts`
5. `npm --prefix frontend-web test -- --runInBand src/config/__tests__/financeiroFeatureFlags.test.ts src/config/__tests__/mvpScope.test.ts src/components/pagamento/__tests__/GatewayPagamento.featureFlags.test.tsx`
6. `npm run test:e2e:billing:critical`
7. `npm --prefix backend run test -- conta-receber.service.spec.ts conta-receber.controller.spec.ts fluxo-caixa.service.spec.ts fluxo-caixa.controller.spec.ts tesouraria.service.spec.ts tesouraria.controller.spec.ts alerta-operacional-financeiro.service.spec.ts --runInBand`
8. `$env:CI='true'; npm --prefix frontend-web run test -- --runInBand --runTestsByPath src/services/__tests__/contasReceberService.test.ts src/services/__tests__/fluxoCaixaService.test.ts src/services/__tests__/tesourariaService.test.ts src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts`

## 5. Observacoes de seguranca aplicadas no backend

- Verificacao de faturas vencidas agora filtra por `empresaId`.
- Ordenacao de listagem de faturas agora usa whitelist de colunas permitidas.
- Geracao de link de pagamento agora sanitiza base URLs (protocolos invalidos e hosts locais/privados fora de mock).
- Transferencias internas de tesouraria com validacao de saldo, idempotencia por `correlationId` e trilha de auditoria (`criacao`, `aprovacao`, `cancelamento`).
- Reprocessamento de alertas com tipo `saldo_caixa_critico` integrado ao painel de alertas operacionais financeiros.

## 6. Execucao Mais Recente (2026-04-07)

- `npm run preflight:go-live:vendas:core` -> **PASS**
- `npm run preflight:go-live:vendas:full` -> **PASS**
- `npm --prefix backend run test:e2e:vendas` -> **PASS**
- `npm --prefix backend run test:e2e:vendas:permissoes` -> **PASS**

## 7. GO/NO-GO Enxuto - MVP Financeiro Essencial (2026-04-08)

Status desta avaliacao: **GO Condicional**.

### 7.1 Criterios obrigatorios (check rapido)

1. Escopo funcional essencial completo (sem NFe/NFSe): **OK**
2. Rotas essenciais ativas no frontend: **OK**
3. Menu e nucleo com links para contas a receber, fluxo de caixa e tesouraria: **OK**
4. Migrations financeiras novas aplicadas no ambiente alvo: **PENDENTE POR AMBIENTE**
5. Gate tecnico de release (`validate` + `preflight` core/full): **OK**
6. Suites backend/frontend do fluxo financeiro novo (contas receber/caixa/tesouraria): **OK**
7. Monitoramento pos-GO sem anomalias criticas: **PENDENTE TRIAGEM**

### 7.2 Criterios de decisao operacional

Decisao **GO** somente quando:

1. Migrations pendentes estiverem aplicadas no ambiente de operacao.
2. Endpoint `/tesouraria/transferencias` responder sem erro estrutural (sem falha de tabela ausente).
3. Monitoramento pos-GO estiver sem anomalia aberta sem plano de acao.

Decisao **NO-GO** quando:

1. Houver erro estrutural de banco (schema/migration ausente) em rotas criticas.
2. Houver anomalia recorrente de monitoramento sem dono e prazo de mitigacao.
3. Ambiente estiver em `REACT_APP_MVP_MODE=true` e expectativa for usar fluxo financeiro completo.

### 7.3 Acoes imediatas para virar GO pleno

1. Executar `npm --prefix backend run migration:run` em cada ambiente de deploy.
2. Executar smoke autenticado:
   - `GET /contas-receber`
   - `GET /financeiro/fluxo-caixa/resumo`
   - `GET /tesouraria/posicao`
   - `GET /tesouraria/transferencias?limite=20`
3. Triar anomalias do monitoramento (`MONITOR_COMPANIES_FAILURE`) e registrar decisao final GO/NO-GO.
4. Executar monitoramento estendido: `npm run monitor:go-live:vendas-financeiro:48h`.

### 7.4 Observacao de modo de operacao

1. Em `REACT_APP_MVP_MODE=true`, o frontend bloqueia rotas de `/financeiro` por regra de escopo MVP comercial.
2. Para usar o MVP Financeiro Essencial, operar em modo `full` (`REACT_APP_MVP_MODE=false` e `FINANCEIRO_MVP_MODE=false`).
