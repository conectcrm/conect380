# GDN-111 - Validacao fallback de indisponibilidade do gateway (2026-03-07)

## Escopo validado

1. Falha temporaria no provedor durante reconciliacao nao corrompe estado local.
2. Job de vencimento continua aplicando regras de cobranca mesmo com erro de reconciliacao externa.
3. Reconciliacao manual retorna erro controlado sem mutacao indevida.

## Evidencia automatizada

Arquivos:
- `backend/src/modules/mercado-pago/mercado-pago.service.spec.ts`
- `backend/src/modules/planos/assinatura-due-date-scheduler.service.spec.ts`

Cenarios:
1. `retorna erro de reconciliacao sem alterar estado local quando provedor esta indisponivel`.
2. `mantem transicoes de vencimento mesmo com falha na reconciliacao do provedor`.

Comando:
- `npm --prefix backend run test -- src/modules/mercado-pago/mercado-pago.service.spec.ts src/modules/planos/assinatura-due-date-scheduler.service.spec.ts --runInBand`

Resultado:
- PASS (fallback validado)
