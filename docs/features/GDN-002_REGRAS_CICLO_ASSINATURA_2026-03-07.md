# GDN-002 - Regras de ciclo comercial de assinatura (2026-03-07)

## Objetivo

Definir regras unicas para trial, cobranca, bloqueio, cancelamento e reativacao.

## Estados oficiais

1. `trial`
2. `active`
3. `past_due`
4. `suspended`
5. `canceled`

## Regras por estado

| Estado | Definicao | Acesso ao produto |
|---|---|---|
| `trial` | Conta em periodo de avaliacao | Liberado conforme plano trial |
| `active` | Conta adimplente | Liberado conforme plano contratado |
| `past_due` | Fatura vencida e nao paga | Liberado com restricoes e avisos |
| `suspended` | Conta bloqueada por inadimplencia ou risco | Bloqueado, sem operacoes de escrita |
| `canceled` | Assinatura encerrada | Bloqueado; somente consulta limitada |

## Regras de prazo v1

1. Trial padrao operacional: 7 dias.
2. Trial de campanha (self-service): 30 dias, controlado por flag comercial.
3. Grace period apos vencimento: 3 dias em `past_due`.
4. Sem pagamento apos grace: transita para `suspended`.

## Transicoes permitidas

| De | Para | Gatilho |
|---|---|---|
| `trial` | `active` | Primeira cobranca aprovada |
| `trial` | `canceled` | Encerramento sem conversao |
| `active` | `past_due` | Vencimento sem pagamento |
| `past_due` | `active` | Pagamento confirmado |
| `past_due` | `suspended` | Expirou grace period |
| `suspended` | `active` | Quitacao total confirmada |
| `active` | `canceled` | Cancelamento solicitado |
| `suspended` | `canceled` | Encerramento administrativo |

## Regras operacionais obrigatorias

1. Entitlement e bloqueio aplicados no backend.
2. Mudanca de estado apenas por evento auditavel (pagamento, job, acao admin).
3. Toda mudanca registra `actor`, `motivo`, `timestamp`, `correlationId`.

## Politica de cancelamento e reativacao

1. Cancelamento padrao: efetivo no fim do ciclo.
2. Cancelamento por risco/fraude: imediato.
3. Reativacao: apenas com pagamento compensado e auditoria.
