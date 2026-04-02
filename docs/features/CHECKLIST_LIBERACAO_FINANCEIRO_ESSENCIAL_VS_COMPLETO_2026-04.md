# Checklist de Liberacao - Financeiro Essencial vs Completo (2026-04)

## 1. Objetivo

Padronizar o rollout do modulo financeiro em dois niveis:

- **Financeiro Essencial**: faturamento, contas a pagar, conciliacao, centros de custo, fornecedores, contas bancarias e aprovacoes.
- **Financeiro Completo**: inclui fiscal oficial e boleto, mantendo o mesmo baseline tecnico de seguranca e multi-tenant.

## 2. Escopo funcional atual

- Rotas ativas no pacote essencial:
  - `/financeiro/faturamento`
  - `/financeiro/contas-pagar`
  - `/financeiro/fornecedores`
  - `/financeiro/contas-bancarias`
  - `/financeiro/aprovacoes`
  - `/financeiro/conciliacao`
  - `/financeiro/centro-custos`
- Rotas ainda em construcao (fora do pacote essencial):
  - `/financeiro/contas-receber`
  - `/financeiro/fluxo-caixa`
  - `/financeiro/tesouraria`

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

## 5. Observacoes de seguranca aplicadas no backend

- Verificacao de faturas vencidas agora filtra por `empresaId`.
- Ordenacao de listagem de faturas agora usa whitelist de colunas permitidas.
- Geracao de link de pagamento agora sanitiza base URLs (protocolos invalidos e hosts locais/privados fora de mock).
