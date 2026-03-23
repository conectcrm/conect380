# Relatorio de regressao - Fluxo Vendas -> Financeiro

- RunId: 20260228-142033
- Inicio: 2026-02-28 14:20:33
- Fim: 2026-02-28 14:21:34
- Total: 6
- PASS: 6
- FAIL: 0

| ID | Suite | Resultado | Duracao (s) | ExitCode |
| --- | --- | --- | ---: | ---: |
| REG-001 | E2E vendas/faturamento/webhook gateway | PASS | 16.18 | 0 |
| REG-002 | E2E financeiro contas a pagar/exportacao | PASS | 12.11 | 0 |
| REG-003 | Unit webhook gateway | PASS | 8.07 | 0 |
| REG-004 | Unit monitor/alertas financeiros | PASS | 9.07 | 0 |
| REG-005 | E2E conciliacao bancaria | PASS | 12.12 | 0 |
| REG-006 | Frontend contratos/estado financeiro | PASS | 3.04 | 0 |

## Comandos executados

- REG-001: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./propostas/faturamento-pagamentos-gateway.e2e-spec.ts
- REG-002: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./financeiro/contas-pagar.e2e-spec.ts
- REG-003: cd C:\Projetos\conect360\backend && npm run test -- gateway-webhook.service.spec.ts gateway-webhook.controller.spec.ts --runInBand
- REG-004: cd C:\Projetos\conect360\backend && npm run test -- alerta-operacional-financeiro.service.spec.ts alerta-operacional-financeiro.controller.spec.ts alerta-operacional-financeiro-monitor.service.spec.ts --runInBand
- REG-005: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./financeiro/conciliacao-bancaria.e2e-spec.ts
- REG-006: cd C:\Projetos\conect360\frontend-web && npm test -- --watch=false --runInBand src/services/__tests__/contasPagarService.test.ts src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts src/features/dashboard-v2/__tests__/financeiro-alertas-state.test.ts src/features/dashboard-v2/__tests__/financeiro-alertas-reprocessamento.test.ts

## Resultado

Regressao automatizada concluida sem falhas.
