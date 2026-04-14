# GDN-110 - Validacao evento duplicado (2026-03-07)

## Escopo validado

1. Reenvio de webhook com mesma chave de idempotencia nao reaplica efeito financeiro.
2. Estado de assinatura nao sofre dupla transicao no replay.

## Evidencia automatizada

Arquivo:
- `backend/src/modules/mercado-pago/mercado-pago.service.spec.ts`

Cenario:
- `ativa assinatura no primeiro webhook e nao reaplica efeito no duplicado`.

Comando:
- `npm --prefix backend run test -- src/modules/mercado-pago/mercado-pago.service.spec.ts --runInBand`

Resultado:
- PASS (evento duplicado sem dupla aplicacao)
