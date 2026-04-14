# GDN-407 - Webhook replay recovery validation

- RunId: 20260308-164916
- Inicio: 2026-03-08 16:49:16
- Fim: 2026-03-08 16:49:26
- DuracaoSegundos: 9.17
- DryRun: false
- Status: PASS

## Escopo de validacao
- idempotencia de webhook duplicado
- reconciliacao de pagamentos por lote/replay
- consistencia de transicoes de assinatura em recuperacao

## Evidencias de execucao

### Comando
npm --prefix backend run test -- modules/mercado-pago/mercado-pago.service.spec.ts modules/planos/assinatura-due-date-scheduler.service.spec.ts

### Saida resumida
> conect-crm-backend@1.0.0 test
> jest modules/mercado-pago/mercado-pago.service.spec.ts modules/planos/assinatura-due-date-scheduler.service.spec.ts

[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mProcessando webhook: payment - updated[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mWebhook pagamento 123456: approved - updated[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mProcessando webhook: payment - updated[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mWebhook duplicado ignorado payment=123456 status=approved action=updated[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mProcessando webhook: payment - updated[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mWebhook pagamento 999001: approved - updated[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mProcessando webhook: payment - updated[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mWebhook pagamento pay-dup-1: approved - updated[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mPagamento aprovado: pay-dup-1[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mâœ… Assinatura 44444444-4444-4444-4444-444444444444 ativada com sucesso[39m
[32m[Nest] 38880  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[MercadoPagoService] [39m[32mProcessando webhook: payment - updated[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mWebhook duplicado ignorado payment=pay-dup-1 status=approved action=updated[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mAccess Token do Mercado Pago nÃ£o configurado[39m
[33m[Nest] 38880  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[MercadoPagoService] [39m[33mReconciliacao falhou para payment pay-offline: gateway_unavailable[39m
[32m[Nest] 11096  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[AssinaturaDueDateSchedulerService] [39m[32mCiclo vencimento assinatura concluido checked=1 past_due=1 suspended=0 skipped=0 errors=0 reconcile_processed=2 reconcile_errors=0[39m
[32m[Nest] 11096  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[AssinaturaDueDateSchedulerService] [39m[32mCiclo vencimento assinatura concluido checked=1 past_due=0 suspended=1 skipped=0 errors=0 reconcile_processed=2 reconcile_errors=0[39m
[32m[Nest] 11096  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[AssinaturaDueDateSchedulerService] [39m[32mCiclo vencimento assinatura concluido checked=1 past_due=0 suspended=0 skipped=1 errors=0 reconcile_processed=2 reconcile_errors=0[39m
[33m[Nest] 11096  - [39m08/03/2026, 16:49:25 [33m   WARN[39m [38;5;3m[AssinaturaDueDateSchedulerService] [39m[33mReconciliacao pre-job falhou (continuando ciclo): provider_temporarily_unavailable[39m
[32m[Nest] 11096  - [39m08/03/2026, 16:49:25 [32m    LOG[39m [38;5;3m[AssinaturaDueDateSchedulerService] [39m[32mCiclo vencimento assinatura concluido checked=1 past_due=1 suspended=0 skipped=0 errors=1 reconcile_processed=0 reconcile_errors=0[39m
PASS src/modules/mercado-pago/mercado-pago.service.spec.ts (7.291 s)
PASS src/modules/planos/assinatura-due-date-scheduler.service.spec.ts (7.308 s)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        8.025 s
Ran all test suites matching /modules\\mercado-pago\\mercado-pago.service.spec.ts|modules\\planos\\assinatura-due-date-scheduler.service.spec.ts/i.

## Resultado
- Validacao de replay/recovery concluida com sucesso.
