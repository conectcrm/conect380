# GDN-109 - Validacao integracao checkout + webhook (2026-03-07)

## Escopo validado

1. Checkout gera `external_reference` no formato canônico (`conectcrm:empresa:<id>:assinatura:<id>`).
2. Checkout aponta `notification_url` para webhook backend.
3. Webhook de pagamento aprovado ativa assinatura.

## Evidencia automatizada

Arquivos:
- `backend/src/modules/planos/assinaturas.controller.spec.ts`
- `backend/src/modules/mercado-pago/mercado-pago.service.spec.ts`

Cenarios:
1. `assinaturas.controller.spec.ts`: cria checkout e valida `externalReference` + `notification_url`.
2. `mercado-pago.service.spec.ts`: fluxo `payment approved` ativa assinatura no backend.

Comando:
- `npm --prefix backend run test -- src/modules/planos/assinaturas.controller.spec.ts src/modules/mercado-pago/mercado-pago.service.spec.ts --runInBand`

Resultado:
- PASS (todos cenarios)
