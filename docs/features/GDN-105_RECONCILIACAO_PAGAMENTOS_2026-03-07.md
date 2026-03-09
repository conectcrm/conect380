# GDN-105 - Reconciliacao de pagamentos (2026-03-07)

## Objetivo

Garantir reconciliacao eventual entre eventos do provedor e estado local de cobranca de assinatura.

## Implementacao

1. Reconciliacao por pagamento:
   - metodo: `MercadoPagoService.reconcilePaymentById(paymentId)`
   - consulta o pagamento no provedor;
   - resolve `empresaId` e `assinaturaId` via `external_reference`;
   - mapeia status do provedor para status canonico de assinatura:
     - `approved` -> `active`
     - `rejected|canceled` -> `past_due`
     - `refunded|chargeback` -> `suspended`
   - valida transicao via state machine antes de persistir.

2. Reconciliacao em lote:
   - metodo: `MercadoPagoService.reconcileRecentPayments({ lookbackHours, limit })`
   - busca candidatos em `billing_events` (`mercadopago.payment.webhook` + `received`);
   - executa reconciliacao por `paymentId` com resumo de resultado (`updated/aligned/skipped/error`).

3. Webhook duplicado com tentativa de alinhamento:
   - quando o evento for detectado como duplicado (`GDN-104`), o service executa reconciliacao de assinatura a partir do pagamento do provedor.

4. Trilha de auditoria:
   - cada tentativa de reconciliacao com `empresaId` conhecido gera evento em `billing_events`:
     - `aggregate_type = mercadopago.payment.reconciliation`
     - `event_type = updated|aligned|skipped|error`
     - `source = mercadopago.reconcile`

5. Endpoints operacionais:
   - `POST /mercadopago/reconciliation/payments/:id`
   - `POST /mercadopago/reconciliation/payments` (batch)

## Evidencias de teste

Arquivo:
- `backend/src/modules/mercado-pago/mercado-pago.service.spec.ts`

Cenarios cobertos:
1. reconciliacao muda assinatura de `active` para `past_due` quando pagamento e rejeitado;
2. transicao invalida e mantida como `skipped`;
3. reconciliacao em lote processa candidatos unicos vindos de `billing_events`.
