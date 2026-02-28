# AP-301 - Contrato Tecnico do Webhook de Pagamentos (Fase 1)

## 1. Objetivo

Definir o contrato de recebimento de eventos de pagamento externo com:

1. validacao de assinatura;
2. idempotencia por evento;
3. atualizacao consistente de transacao/pagamento;
4. resposta HTTP previsivel para retries do provedor.

## 2. Endpoint proposto (backend)

- Metodo: `POST`
- Rota: `/pagamentos/gateways/webhooks/:gateway/:empresaId`
- Auth: `@Public()` (sem JWT), com validacao de assinatura obrigatoria.
- Guardas:
  - sem `JwtAuthGuard`;
  - validar empresa/gateway pela propria rota e configuracao ativa do gateway;
  - manter isolamento por `empresaId`.

## 3. Headers de entrada

- `Content-Type: application/json` (obrigatorio)
- `x-signature` (obrigatorio)
- `x-request-id` (opcional, recomendado)
- `x-idempotency-key` (opcional; usar quando o provedor disponibilizar)
- `x-event-id` (opcional; usar quando o provedor disponibilizar)
- `x-event-timestamp` (opcional; se existir, usar para janela anti-replay)

Observacao:
- o formato exato de assinatura varia por provedor; a validacao sera encapsulada por adapter do gateway.

## 4. Payload de entrada (raw do provedor)

O endpoint recebe payload raw do provedor. A normalizacao interna deve gerar o seguinte objeto canonico:

```json
{
  "eventId": "evt_123",
  "eventType": "payment.updated",
  "eventTimestamp": "2026-03-03T12:35:00Z",
  "gateway": "mercado_pago",
  "empresaId": "uuid",
  "referenciaGateway": "pay_abc_123",
  "statusExterno": "approved",
  "statusMapeado": "aprovado",
  "metodo": "pix",
  "valorBruto": 1250.5,
  "taxa": 12.5,
  "valorLiquido": 1238.0,
  "payloadRaw": {}
}
```

Campos minimos para processar evento:

1. `referenciaGateway`
2. `statusExterno` (ou status equivalente do provedor)
3. `eventId` (ou chave idempotente equivalente; se nao existir, gerar hash deterministico)

## 5. Validacao de assinatura

1. Buscar configuracao ativa em `configuracoes_gateway_pagamento` por:
   - `empresa_id = :empresaId`
   - `gateway = :gateway`
   - `status = ativo`
2. Usar `webhook_secret` da configuracao para validar assinatura.
3. Se assinatura invalida:
   - retornar `401 Unauthorized`;
   - nao persistir transacao/pagamento;
   - registrar log de seguranca sem dados sensiveis.

## 6. Idempotencia

Chave idempotente (ordem de prioridade):

1. `x-idempotency-key`
2. `x-event-id`
3. `eventId` do payload normalizado
4. hash SHA-256 de `gateway + empresaId + referenciaGateway + statusExterno + eventTimestamp`

Regra:

1. Se chave ja processada com sucesso, retornar `200` com `duplicate=true`.
2. Se chave em processamento, retornar `202` com `accepted=true`.
3. Se chave nova, registrar recebimento e processar.

Persistencia sugerida para fase 1:

- Nova tabela `webhooks_gateway_eventos`:
  - `id` (uuid)
  - `empresa_id` (uuid)
  - `gateway` (enum/string)
  - `idempotency_key` (varchar, unique por empresa+gateway)
  - `event_id` (varchar, nullable)
  - `status` (`recebido|processando|processado|falha`)
  - `tentativas` (int)
  - `payload_raw` (jsonb)
  - `erro` (text, nullable)
  - `processado_em` (timestamp, nullable)
  - `created_at`, `updated_at`

## 7. Mapeamento de status externo -> interno

Destino: `GatewayTransacaoStatus` (`pendente|processando|aprovado|recusado|cancelado|erro`).

Mapeamento inicial:

1. `approved|paid|succeeded` -> `aprovado`
2. `pending|in_process|processing` -> `processando`
3. `rejected|declined|failed|denied` -> `recusado`
4. `cancelled|canceled|refunded|chargeback` -> `cancelado`
5. `error|invalid` -> `erro`
6. desconhecido -> `pendente` + log de warning

## 8. Regras de processamento

1. Localizar transacao em `transacoes_gateway_pagamento` por:
   - `empresa_id`
   - `referencia_gateway`
2. Se nao existir transacao:
   - criar transacao com `tipoOperacao=webhook`, `origem=webhook`;
   - persistir payload raw em `payloadResposta`.
3. Se existir:
   - atualizar `status`, `processadoEm`, `payloadResposta`, `mensagemErro` (quando aplicavel);
   - manter historico no evento de webhook (idempotencia/auditoria).
4. Para `statusMapeado=aprovado`:
   - atualizar pagamento relacionado sem duplicar baixa (checagem de estado atual).

## 9. Contrato de resposta HTTP

Respostas esperadas:

1. `200 OK`
   - evento processado ou duplicado com sucesso.
2. `202 Accepted`
   - evento aceito para processamento assincrono.
3. `400 Bad Request`
   - payload sem campos minimos para normalizacao.
4. `401 Unauthorized`
   - assinatura invalida.
5. `404 Not Found`
   - configuracao ativa de gateway nao encontrada para `empresaId/gateway`.
6. `500 Internal Server Error`
   - falha inesperada nao tratada.

Corpo padrao de resposta:

```json
{
  "success": true,
  "accepted": true,
  "duplicate": false,
  "eventId": "evt_123",
  "idempotencyKey": "key_abc"
}
```

## 10. Estrategia de retry

1. Provedor externo faz retry em respostas nao-2xx.
2. Internamente, processar de forma assincrona com ate 5 tentativas:
   - 5s, 15s, 30s, 60s, 120s.
3. Apos esgotar tentativas:
   - marcar evento como `falha`;
   - registrar log estruturado;
   - manter rastreabilidade para reprocessamento manual.

## 11. Logs e observabilidade

Campos minimos de log:

1. `empresaId`
2. `gateway`
3. `eventId`
4. `idempotencyKey`
5. `referenciaGateway`
6. `statusMapeado`
7. `resultado` (`processado|duplicado|falha`)

Nao logar:

1. segredos (`webhook_secret`, tokens);
2. payload sensivel completo sem mascaramento.

## 12. Criterios de aceite tecnicos do AP-301 (fase 1)

1. Retorno duplicado do mesmo evento nao gera baixa duplicada.
2. Assinatura invalida retorna `401`.
3. Evento valido atualiza transacao/pagamento com rastreabilidade.
4. Logs e trilha de idempotencia permitem auditoria de ponta a ponta.

## 13. Escopo da implementacao imediata

1. Entregar endpoint de webhook publico no modulo `pagamentos`.
2. Entregar validacao de assinatura por gateway.
3. Entregar persistencia de eventos para idempotencia.
4. Entregar testes:
   - assinatura valida/invalida;
   - duplicate event;
   - evento novo com atualizacao de status.
