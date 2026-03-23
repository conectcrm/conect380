# GDN-102 - Maquina de estados de assinatura (2026-03-07)

## Objetivo

Implementar a maquina de estados canonica de assinatura no backend, com transicoes controladas e compatibilidade com status legados.

## Estados canonicos suportados

1. `trial`
2. `active`
3. `past_due`
4. `suspended`
5. `canceled`

## Compatibilidade legada

- Mapeamento legado -> canonico:
  - `pendente` -> `trial`
  - `ativa` -> `active`
  - `suspensa` -> `suspended`
  - `cancelada` -> `canceled`
- O backend aceita status legados em leitura/filtro e persiste novos registros com status canonicos.

## Entregas tecnicas

1. `AssinaturaEmpresa` atualizado para enum unificado (canonico + legado) e utilitarios de normalizacao.
2. Novo modulo `subscription-state-machine` com:
   - matriz de transicoes permitidas;
   - regra de acesso por status (`trial`, `active`, `past_due`).
3. `AssinaturasService` refatorado para:
   - validar transicoes antes de persistir;
   - registrar log de transicao em `observacoes`;
   - suportar transicoes de `cancelar`, `suspender`, `reativar`, `marcarPastDue`, `registrarPagamentoConfirmado`.
4. `AssinaturaMiddleware` atualizado para validar acesso com status canonico.
5. `MercadoPagoService` atualizado para:
   - normalizar status atual;
   - aplicar transicao valida para `active` e `suspended`;
   - manter comportamento idempotente.
6. Migration `1808102000000-UpdateSubscriptionStateMachineStatuses.ts`:
   - adiciona valores canonicos no enum do Postgres;
   - converte dados legados para canonicos;
   - recria `billing_subscriptions` com mapeamento correto incluindo `past_due`.
7. Teste unitario inicial da maquina de estados:
   - `backend/src/modules/planos/subscription-state-machine.spec.ts`

## Validacao executada

- Tentativa de teste local falhou por dependencias nao instaladas no ambiente (`jest` indisponivel).
- Tentativa de build local falhou pelo mesmo motivo (`rimraf` indisponivel).
- `npx tsc -p backend/tsconfig.json --noEmit` executado e manteve erros de baseline do ambiente para type definitions ausentes.

## Riscos e proximos itens

1. Executar `npm install` no backend para habilitar validacao automatizada completa.
2. Avancar `GDN-103` (checkout/webhook) usando os metodos canonicos do `AssinaturasService`.
3. Em `GDN-106`, usar `marcarPastDue` e `suspender` nos jobs de vencimento.
