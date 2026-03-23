# AP-301 - Resultado execucao assistida webhook

- Data/hora: 2026-03-05 08:50:20
- Endpoint: http://localhost:3001/pagamentos/gateways/webhooks/mercado_pago/250cc3ac-617b-4d8b-be6e-b14901e4edde
- Gateway: mercado_pago
- EmpresaId: 250cc3ac-617b-4d8b-be6e-b14901e4edde
- RunId: 20260305085018

| Cenario | Resultado | HTTP esperado | HTTP recebido | duplicate esperado | duplicate recebido | eventId | referenciaGateway |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | PASS | 200 | 200 | False | False | ap301-20260305085018-c1 | GW-TXN-1771286584944 |
| C2 | PASS | 200 | 200 | True | True | ap301-20260305085018-c1 | GW-TXN-1771286584944 |
| C3 | PASS | 401 | 401 | - | - | ap301-20260305085018-c3 | GW-TXN-1771286584944-invalid-signature |
| C4 | PASS | 200 | 200 | False | False | ap301-20260305085018-c4 | GW-TXN-1771012054958 |
| C5 | PASS | 500 | 500 | - | - | ap301-20260305085018-c5 |  |

## Payloads/Respostas

### C1 - Evento valido aprovado

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260305085018-c1","idempotencyKey":"ap301-20260305085018-c1","correlationId":"ap301-20260305085018-c1","origemId":"ap301-20260305085018-c1"}
```

### C2 - Evento duplicado

```json
{"success":true,"accepted":true,"duplicate":true,"eventId":"ap301-20260305085018-c1","idempotencyKey":"ap301-20260305085018-c1","correlationId":"ap301-20260305085018-c1","origemId":"ap301-20260305085018-c1"}
```

### C3 - Assinatura invalida

```json
{"message":"Assinatura invalida","error":"Unauthorized","statusCode":401}
```

### C4 - Evento de rejeicao

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260305085018-c4","idempotencyKey":"ap301-20260305085018-c4","correlationId":"ap301-20260305085018-c4","origemId":"ap301-20260305085018-c4"}
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
 e60b4dd2-d4ac-4d16-b5e4-f2fa61c17510 | mercado_pago | ap301-20260305085018-c5 | ap301-20260305085018-c5 | falha      |                      | Payload sem referencia de transacao |                         | 2026-03-05 11:50:19.385018
 5e680c27-1b2e-49d2-88f6-1fa52ea4bb4d | mercado_pago | ap301-20260305085018-c4 | ap301-20260305085018-c4 | processado | GW-TXN-1771012054958 |                                     | 2026-03-05 08:50:19.328 | 2026-03-05 11:50:19.305283
 4c9edbbe-4221-4461-b22b-e0c97a8c2ac1 | mercado_pago | ap301-20260305085018-c1 | ap301-20260305085018-c1 | processado | GW-TXN-1771286584944 |                                     | 2026-03-05 08:50:19.147 | 2026-03-05 11:50:19.054345
(3 rows)

```

### transacoes_gateway_pagamento

```text
                  id                  |  referencia_gateway  |  status  | tipo_operacao | origem  |      processado_em      |         updated_at         
--------------------------------------+----------------------+----------+---------------+---------+-------------------------+----------------------------
 5f5d38d2-0b7e-439f-abe8-25e46519e357 | GW-TXN-1771012054958 | recusado | webhook       | webhook | 2026-03-05 08:50:19.309 | 2026-03-05 11:50:19.312785
 dae1f8c4-adf7-4ada-9e37-c28865b82335 | GW-TXN-1771286584944 | aprovado | webhook       | webhook | 2026-03-05 08:50:19.068 | 2026-03-05 11:50:19.071645
(2 rows)

```

### pagamentos

```text
 id |              empresa_id              |  status   |   gateway    |   tipo    |  valor  
----+--------------------------------------+-----------+--------------+-----------+---------
  1 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | aprovado  | mercado_pago | pagamento |  150.00
  2 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | rejeitado | mercado_pago | pagamento |  200.00
  3 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | aprovado  |              | pagamento | 1260.00
(3 rows)

```

### faturas_relacionadas

```text
 id |              empresa_id              |              numero               |  status  
----+--------------------------------------+-----------------------------------+----------
  2 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | HML-CODEXA-AP301-R-20260228140925 | pendente
  4 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000001                      | paga
  5 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000002                      | pendente
  6 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000003                      | pendente
  7 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000004                      | pendente
  8 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000005                      | pendente
  9 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000006                      | pendente
 10 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000007                      | pendente
 11 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000008                      | pendente
 12 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000009                      | pendente
 13 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | FT2026000010                      | pendente
  1 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | HML-CODEXA-AP301-A-20260228140925 | paga
(12 rows)

```

