# GDN-008 - Mesa de cenarios de negocio (2026-03-07)

## Objetivo

Executar validacao de mesa com 10 cenarios obrigatorios para o ciclo comercial.

## Cenarios e resultado esperado

| ID | Cenario | Resultado esperado |
|---|---|---|
| C01 | Novo cliente inicia trial | Estado `trial` com limite do plano selecionado |
| C02 | Trial converte com pagamento | `trial` -> `active` |
| C03 | Fatura vence sem pagamento | `active` -> `past_due` |
| C04 | Cliente paga durante grace | `past_due` -> `active` |
| C05 | Cliente nao paga apos grace | `past_due` -> `suspended` |
| C06 | Reativacao apos quitacao | `suspended` -> `active` |
| C07 | Upgrade no meio do ciclo | upgrade imediato + prorrata positiva |
| C08 | Downgrade no meio do ciclo | downgrade no proximo ciclo sem estorno automatico |
| C09 | Cancelamento solicitado | estado final `canceled` no fim do ciclo |
| C10 | Cancelamento por risco/fraude | cancelamento imediato + bloqueio |

## Resultado da mesa (analise de regra)

| ID | Status |
|---|---|
| C01 | OK |
| C02 | OK |
| C03 | OK |
| C04 | OK |
| C05 | OK |
| C06 | OK |
| C07 | OK |
| C08 | OK |
| C09 | OK |
| C10 | OK |

## Observacoes

1. Validacao de mesa nao substitui teste de integracao com gateway.
2. Cenarios aprovados para virar casos de teste E2E em Sprint 1/2.
