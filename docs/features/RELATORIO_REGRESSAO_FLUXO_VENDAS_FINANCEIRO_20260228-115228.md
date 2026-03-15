# Relatorio de regressao - Fluxo Vendas -> Financeiro

- RunId: 20260228-115228
- Inicio: 2026-02-28 11:52:28
- Fim: 2026-02-28 11:53:30
- Total: 5
- PASS: 5
- FAIL: 0

| ID | Suite | Resultado | Duracao (s) | ExitCode |
| --- | --- | --- | ---: | ---: |
| REG-001 | E2E vendas/faturamento/webhook gateway | PASS | 15.17 | 0 |
| REG-002 | E2E financeiro contas a pagar/exportacao | PASS | 12.09 | 0 |
| REG-003 | Unit webhook gateway | PASS | 14.13 | 0 |
| REG-004 | Unit monitor/alertas financeiros | PASS | 9.08 | 0 |
| REG-005 | E2E conciliacao bancaria | PASS | 12.14 | 0 |

## Comandos executados

- REG-001: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./propostas/faturamento-pagamentos-gateway.e2e-spec.ts
- REG-002: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./financeiro/contas-pagar.e2e-spec.ts
- REG-003: cd C:\Projetos\conect360\backend && npm run test -- gateway-webhook.service.spec.ts gateway-webhook.controller.spec.ts --runInBand
- REG-004: cd C:\Projetos\conect360\backend && npm run test -- alerta-operacional-financeiro.service.spec.ts alerta-operacional-financeiro.controller.spec.ts alerta-operacional-financeiro-monitor.service.spec.ts --runInBand
- REG-005: cd C:\Projetos\conect360\backend && npm run test:e2e -- ./financeiro/conciliacao-bancaria.e2e-spec.ts

## Resultado

Regressao automatizada concluida sem falhas.
