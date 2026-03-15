# GDN-104 - Idempotencia de webhook (2026-03-07)

## Objetivo

Garantir que eventos duplicados do provedor de pagamento nao produzam efeitos duplicados no ciclo de assinatura.

## Implementacao

1. Idempotencia no intake Mercado Pago:
   - no processamento de `payment`, cada evento gera chave:
     - `<paymentId>:<status>:<action>`
   - chave registrada em `billing_events` com:
     - `aggregate_type = mercadopago.payment.webhook`
     - `event_type = received`
   - evento com chave ja registrada e tratado como duplicado e ignorado.

2. Blindagem no banco:
   - migration `1808103000000-EnforceMercadoPagoWebhookIdempotency.ts`
   - cria indice unico parcial:
     - `UQ_billing_events_mp_payment_received`
     - evita corrida concorrente de retries no mesmo evento.

3. Resiliencia de payload:
   - parser aceita `type` ou `topic`.
   - extrai id de pagamento de `data.id`, `id` ou URL `resource`.

## Evidencias de teste

Arquivo:
- `backend/src/modules/mercado-pago/mercado-pago.service.spec.ts`

Cenarios cobertos:
1. evento de pagamento duplicado nao reaplica efeito;
2. `resource` em formato URL e resolvido corretamente para id de pagamento.
