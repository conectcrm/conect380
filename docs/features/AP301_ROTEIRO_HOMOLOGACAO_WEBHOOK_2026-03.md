# AP-301 - Roteiro de homologacao webhook (2026-03)

## 1. Objetivo

Executar validacao manual controlada do fluxo webhook -> transacao -> pagamento/fatura em ambiente de homologacao.

## 2. Pre-condicoes

1. Configuracao ativa de gateway para a empresa alvo em `configuracoes_gateway_pagamento` com `webhookSecret`.
2. Pagamento existente com `gatewayTransacaoId` conhecido para teste de sincronizacao.
3. Ambiente com migration de `webhooks_gateway_eventos` aplicada.

## 3. Cenarios obrigatorios

### C1 - Evento valido aprovado

1. Enviar evento assinado com status `approved`.
2. Esperado:
   - resposta `200` com `success=true` e `duplicate=false`;
   - registro `processado` em `webhooks_gateway_eventos`;
   - `transacoes_gateway_pagamento.status = aprovado`;
   - `pagamentos.status = aprovado`.

### C2 - Evento duplicado

1. Reenviar o mesmo evento (mesma `idempotencyKey`/`eventId`).
2. Esperado:
   - resposta `200` com `duplicate=true`;
   - nenhuma nova baixa/atualizacao indevida.

### C3 - Assinatura invalida

1. Enviar payload com assinatura incorreta.
2. Esperado:
   - resposta `401`;
   - sem novo registro valido em `transacoes_gateway_pagamento`.

### C4 - Evento de rejeicao

1. Enviar evento assinado com status `rejected`.
2. Esperado:
   - resposta `200`;
   - `pagamentos.status = rejeitado`;
   - `pagamentos.motivoRejeicao` preenchido.

### C5 - Falha controlada de processamento

1. Simular erro interno (ex.: referencia inconsistente que force excecao de regra).
2. Esperado:
   - resposta `500`;
   - `webhooks_gateway_eventos.status = falha`;
   - campo `erro` preenchido.

## 4. Evidencias minimas por cenario

1. Request/response HTTP (headers + body).
2. Trecho de log com `empresaId`, `gateway`, `eventId` ou `idempotencyKey`.
3. Consulta SQL antes/depois nas tabelas:
   - `webhooks_gateway_eventos`
   - `transacoes_gateway_pagamento`
   - `pagamentos`
   - `faturas` (quando aplicavel)

## 5. Consultas SQL de apoio

```sql
-- Eventos recebidos
select id, gateway, idempotency_key, event_id, status, referencia_gateway, erro, processado_em, created_at
from webhooks_gateway_eventos
where empresa_id = :empresaId
order by created_at desc;

-- Transacao de gateway
select id, referencia_gateway, status, tipo_operacao, origem, processado_em, updated_at
from transacoes_gateway_pagamento
where empresa_id = :empresaId and referencia_gateway = :referenciaGateway;

-- Pagamento vinculado
select id, gateway_transacao_id, status, motivo_rejeicao, data_processamento, data_aprovacao, updated_at
from pagamentos
where empresa_id = :empresaId and gateway_transacao_id = :referenciaGateway;
```

## 6. Criterio de aprovacao final (14.2.3)

1. Todos os cenarios C1..C5 aprovados.
2. Sem duplicidade de baixa em C2.
3. Trilha de auditoria completa para sucesso e falha.

## 7. Execucao assistida (opcional)

Para acelerar a rodada de homologacao, utilizar:

- `scripts/test-ap301-webhook-homologacao.ps1`
- Guia: `docs/features/AP301_HOMOLOGACAO_ASSISTIDA_WEBHOOK_2026-03.md`
