# GDN-003 - Politica de upgrade, downgrade e prorrata (2026-03-07)

## Objetivo

Definir regra financeira unica para mudancas de plano sem ambiguidade operacional.

## Regras v1

1. Upgrade: efeito imediato.
2. Downgrade: efeito no proximo ciclo de cobranca.
3. Nao ha estorno automatico em downgrade no meio do ciclo.
4. Cancelamento segue regra de fim de ciclo (exceto fraude/compliance).

## Formula de prorrata (mensal)

```
prorrata = (valor_plano_novo - valor_plano_atual) * (dias_restantes / dias_do_ciclo)
```

## Formula de prorrata (anual)

```
prorrata = (valor_anual_novo - valor_anual_atual) * (dias_restantes / 365)
```

## Regras de cobranca

1. Se `prorrata > 0`, gerar cobranca adicional imediata.
2. Se `prorrata <= 0`, nao gerar credito automatico; registrar ajuste para proximo ciclo quando aplicavel.
3. Arredondamento financeiro: 2 casas decimais.
4. Valor minimo de cobranca: BRL 1.00.

## Eventos obrigatorios no ledger

1. `plan_changed`
2. `proration_calculated`
3. `charge_created`
4. `charge_paid` ou `charge_failed`

## Auditoria obrigatoria

1. Plano anterior e novo.
2. Valor anterior e novo.
3. Formula aplicada e dias considerados.
4. Usuario/servico que executou a troca.
