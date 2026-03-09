# GDN-106 - Jobs de vencimento de assinatura (2026-03-07)

## Objetivo

Aplicar transicoes automaticas de status de assinatura por vencimento de cobranca.

## Implementacao

1. Scheduler de vencimento:
   - arquivo: `backend/src/modules/planos/assinatura-due-date-scheduler.service.ts`
   - ciclo periodico com `setInterval` (sem dependencia de `@nestjs/schedule`);
   - configuracoes por env:
     - `ASSINATURA_DUE_DATE_JOBS_ENABLED`
     - `ASSINATURA_DUE_DATE_JOBS_INTERVAL_MS`
     - `ASSINATURA_DUE_DATE_JOBS_BATCH`
     - `ASSINATURA_PAST_DUE_SUSPEND_AFTER_DAYS`

2. Regra de transicao automatica:
   - assinatura `active` vencida (`proximoVencimento < hoje`) -> `past_due`
   - assinatura `past_due` com atraso >= grace days -> `suspended`
   - transicoes executadas via `AssinaturasService` (`marcarPastDue` / `suspender`), respeitando state machine.

3. Reconciliacao antes do job de vencimento:
   - no inicio de cada ciclo, o scheduler executa:
     - `MercadoPagoService.reconcileRecentPayments(...)`
   - objetivo: alinhar eventos do provedor antes de aplicar bloqueios por atraso.

4. Operacao manual:
   - endpoint:
     - `POST /assinaturas/jobs/vencimento/executar`
   - permite forcar um ciclo sob demanda.

5. Registro no modulo:
   - `PlanosModule` atualizado para registrar `AssinaturaDueDateSchedulerService`.

## Evidencias de teste

Arquivo:
- `backend/src/modules/planos/assinatura-due-date-scheduler.service.spec.ts`

Cenarios cobertos:
1. assinatura ativa vencida e movida para `past_due`;
2. assinatura `past_due` suspensa apos carencia;
3. assinatura ainda dentro do prazo sem alteracao.
