# Relatorio de Homologacao Integrada - Fluxo Vendas -> Financeiro (Template)

## 1. Metadados

- Data:
- Ambiente:
- BaseUrl:
- EmpresaId:
- Responsavel execucao:
- Responsavel aprovacao:

## 2. Parametros utilizados

- Gateway:
- ReferenciaGatewayAprovado:
- ReferenciaGatewayRejeitado:
- Coleta SQL automatica: (sim/nao)
- Script orquestrador:
  - `scripts/test-homologacao-fluxo-vendas-financeiro.ps1`
- Relatorio consolidado gerado:

## 3. Resultado por etapa

| Etapa | Status (PASS/FAIL/SKIPPED) | Evidencia |
| --- | --- | --- |
| HOMO-001 AP-301 webhook homologacao assistida |  |  |
| HOMO-002 Regressao integrada Vendas -> Financeiro |  |  |

## 4. Evidencias AP-301

- [ ] Request/response C1..C5 anexados
- [ ] `webhooks_gateway_eventos` anexado
- [ ] `transacoes_gateway_pagamento` anexado
- [ ] `pagamentos` anexado
- [ ] `faturas` anexado (quando aplicavel)

## 5. Evidencias de regressao integrada

- [ ] Relatorio de regressao anexado
- [ ] Suites E2E vendas/faturamento PASS
- [ ] Suites E2E financeiro/conciliacao PASS
- [ ] Suites unitarias webhook/alertas PASS
- [ ] Suites frontend de contrato/estado PASS

## 6. Bugs e desvios

| ID | Severidade | Etapa | Descricao | Status |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 7. Conclusao

- Homologacao integrada aprovada:
- Risco residual identificado:
- Recomendacao final (GO/NO-GO):
