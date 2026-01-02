# Reprocessamento de DLQs (Atendimento)

Endpoint:
- `POST /api/atendimento/filas/dlq/reprocessar`

Payload:
```json
{
  "fila": "webhooks-in" | "messages-out" | "notifications",
  "limit": 20
}
```
- `limit` opcional (padrão 50, máximo 200).

Comportamento:
- Reenfileira itens das filas DLQ para suas filas principais.
- Marca `dlqAttempt` no payload reprocessado (+1 por reprocessamento).
- Remove o job reprocessado da DLQ.
- Loga resumo: reprocessados, ignorados sem jobName/payload.

Job names utilizados:
- `webhooks-in`: fallback `process-whatsapp-webhook` se não houver `jobName` no payload.
- `messages-out`: fallback `wa-send-text` se não houver `jobName` no payload.
- `notifications`: **sem fallback**; requer `jobName` no payload do job na DLQ.

Observações:
- O produtor de DLQ (`queue-metrics.service.ts`) grava `jobName`, `queue` e `data` para permitir reprocessar.
- Se `notifications` não salvar `jobName`, o job será ignorado para evitar reenfileirar errado.
- Use com cautela em produção; reprocessar falhas repetidas pode gerar loops se a causa raiz persistir.
