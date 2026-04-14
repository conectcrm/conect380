# AP-301 - Resultado execucao assistida webhook

- Data/hora: 2026-02-28 11:09:33
- Endpoint: http://localhost:3001/pagamentos/gateways/webhooks/mercado_pago/250cc3ac-617b-4d8b-be6e-b14901e4edde
- Gateway: mercado_pago
- EmpresaId: 250cc3ac-617b-4d8b-be6e-b14901e4edde
- RunId: 20260228110932

| Cenario | Resultado | HTTP esperado | HTTP recebido | duplicate esperado | duplicate recebido | eventId | referenciaGateway |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | PASS | 200 | 200 | False | False | ap301-20260228110932-c1 | GW-TXN-1771286584944 |
| C2 | PASS | 200 | 200 | True | True | ap301-20260228110932-c1 | GW-TXN-1771286584944 |
| C3 | PASS | 401 | 401 | - | - | ap301-20260228110932-c3 | GW-TXN-1771286584944-invalid-signature |
| C4 | PASS | 200 | 200 | False | False | ap301-20260228110932-c4 | GW-TXN-1771012054958 |
| C5 | PASS | 500 | 500 | - | - | ap301-20260228110932-c5 |  |

## Payloads/Respostas

### C1 - Evento valido aprovado

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260228110932-c1","idempotencyKey":"ap301-20260228110932-c1"}
```

### C2 - Evento duplicado

```json
{"success":true,"accepted":true,"duplicate":true,"eventId":"ap301-20260228110932-c1","idempotencyKey":"ap301-20260228110932-c1"}
```

### C3 - Assinatura invalida

```json
{"message":"Assinatura invalida","error":"Unauthorized","statusCode":401}
```

### C4 - Evento de rejeicao

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260228110932-c4","idempotencyKey":"ap301-20260228110932-c4"}
```

### C5 - Falha controlada (payload sem referencia)

```json
{"message":"Payload sem referencia de transacao","error":"Internal Server Error","statusCode":500}
```

## Evidencias SQL automaticas

### webhooks_gateway_eventos

```text
                  id                  |   gateway    |     idempotency_key     |        event_id         |   status   |  referencia_gateway  |                erro                 |      processado_em      |         created_at         
--------------------------------------+--------------+-------------------------+-------------------------+------------+----------------------+-------------------------------------+-------------------------+----------------------------
 6b160584-0c3c-4cac-9d02-a8b744d909c2 | mercado_pago | ap301-20260228110932-c5 | ap301-20260228110932-c5 | falha      |                      | Payload sem referencia de transacao |                         | 2026-02-28 14:09:32.768767
 5714f898-e424-49a6-b237-a9675d3ed17b | mercado_pago | ap301-20260228110932-c4 | ap301-20260228110932-c4 | processado | GW-TXN-1771012054958 |                                     | 2026-02-28 11:09:32.715 | 2026-02-28 14:09:32.699701
 ba7ac0d5-aec4-4454-942e-1f36437af291 | mercado_pago | ap301-20260228110932-c1 | ap301-20260228110932-c1 | processado | GW-TXN-1771286584944 |                                     | 2026-02-28 11:09:32.546 | 2026-02-28 14:09:32.485352
(3 rows)

```

### transacoes_gateway_pagamento

```text
                  id                  |  referencia_gateway  |  status  | tipo_operacao | origem  |      processado_em      |         updated_at         
--------------------------------------+----------------------+----------+---------------+---------+-------------------------+----------------------------
 5f5d38d2-0b7e-439f-abe8-25e46519e357 | GW-TXN-1771012054958 | recusado | webhook       | webhook | 2026-02-28 11:09:32.705 | 2026-02-28 14:09:32.706228
 dae1f8c4-adf7-4ada-9e37-c28865b82335 | GW-TXN-1771286584944 | aprovado | webhook       | webhook | 2026-02-28 11:09:32.495 | 2026-02-28 14:09:32.496762
(2 rows)

```

### pagamentos

```text
 id |              empresa_id              |  status   |   gateway    |   tipo    | valor  
----+--------------------------------------+-----------+--------------+-----------+--------
  1 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | aprovado  | mercado_pago | pagamento | 150.00
  2 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | rejeitado | mercado_pago | pagamento | 200.00
(2 rows)

```

### faturas_relacionadas

```text
 id |              empresa_id              |              numero               |  status  
----+--------------------------------------+-----------------------------------+----------
  1 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | HML-CODEXA-AP301-A-20260228140925 | paga
  2 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | HML-CODEXA-AP301-R-20260228140925 | pendente
(2 rows)

```

