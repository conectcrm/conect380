# Regras Criticas do Financeiro

## Objetivo

Ser a fonte unica para regras de negocio criticas do financeiro, com rastreabilidade para codigo e testes.

## Como atualizar

1. Inclua novas regras com um ID estavel (`FIN-RXXX`).
2. Aponte arquivo(s) de implementacao onde a regra realmente vive.
3. Aponte teste(s) que provam a regra.
4. Em todo PR de negocio, referencie os IDs impactados.

## Mapa regra -> implementacao -> testes

| ID | Regra de negocio | Implementacao (fonte de verdade) | Testes que cobrem |
| --- | --- | --- | --- |
| `FIN-R001` | Toda operacao financeira deve respeitar isolamento por empresa (`empresa_id`) | `backend/src/modules/faturamento/services/faturamento.service.ts`; `backend/src/modules/faturamento/services/pagamento.service.ts`; `backend/src/modules/pagamentos/services/configuracao-gateway.service.ts` | `backend/test/multi-tenancy.e2e-spec.ts`; `backend/test/permissoes/perfis-acesso-vendas.e2e-spec.ts` |
| `FIN-R002` | Status de proposta deve sincronizar com eventos de faturamento/pagamento/estorno | `backend/src/modules/faturamento/services/faturamento.service.ts` (`sincronizarStatusPropostaPorFaturaId`); `backend/src/modules/faturamento/services/pagamento.service.ts` | `backend/test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts`; `backend/test/propostas/contratos-fluxo.e2e-spec.ts` |
| `FIN-R003` | Webhook de gateway so e aceito com assinatura valida e idempotencia por evento | `backend/src/modules/pagamentos/services/gateway-webhook.service.ts`; tabela `webhooks_gateway_eventos` | `backend/src/modules/pagamentos/services/gateway-webhook.service.spec.ts`; `backend/test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts` |
| `FIN-R004` | Providers de gateway respeitam feature gate por ambiente (`PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS`) | `backend/src/modules/pagamentos/services/gateway-provider-support.util.ts`; `backend/src/modules/pagamentos/services/configuracao-gateway.service.ts`; `backend/src/modules/pagamentos/services/pagamentos.service.ts` | `backend/src/modules/pagamentos/services/gateway-provider-support.util.spec.ts`; `backend/test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts` (cenarios `501`) |
| `FIN-R005` | Conta a pagar acima da alcada exige aprovacao antes de pagamento | `backend/src/modules/financeiro/services/conta-pagar.service.ts` | `backend/src/modules/financeiro/services/conta-pagar.service.spec.ts`; `backend/test/permissoes/perfis-acesso-vendas.e2e-spec.ts` |
| `FIN-R006` | Conciliacao bancaria manual exige conta paga e consistente com conta bancaria | `backend/src/modules/financeiro/services/conciliacao-bancaria.service.ts` | `backend/src/modules/financeiro/services/conciliacao-bancaria.service.spec.ts`; `backend/test/financeiro/conciliacao-bancaria.e2e-spec.ts` |
| `FIN-R007` | Rotas de leitura/escrita financeira respeitam matriz de permissoes por perfil | Guards/decorators e controllers dos modulos `faturamento`, `pagamentos` e `financeiro` | `backend/test/permissoes/perfis-acesso-vendas.e2e-spec.ts` |

## Suite minima de regressao para PR financeiro

```bash
npm --prefix backend run test:e2e -- test/multi-tenancy.e2e-spec.ts
npm --prefix backend run test:e2e -- test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts
npm --prefix backend run test:e2e:vendas:permissoes
```

Quando houver impacto amplo de release:

```bash
npm run preflight:go-live:vendas:core
npm run preflight:go-live:vendas:full
```
