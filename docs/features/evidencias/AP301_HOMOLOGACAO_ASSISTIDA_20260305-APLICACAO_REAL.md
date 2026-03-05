# AP-301 - Resultado execucao assistida webhook

- Data/hora: 2026-03-05 08:23:08
- Endpoint: http://localhost:3001/pagamentos/gateways/webhooks/mercado_pago/250cc3ac-617b-4d8b-be6e-b14901e4edde
- Gateway: mercado_pago
- EmpresaId: 250cc3ac-617b-4d8b-be6e-b14901e4edde
- RunId: 20260305082306

| Cenario | Resultado | HTTP esperado | HTTP recebido | duplicate esperado | duplicate recebido | eventId | referenciaGateway |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | PASS | 200 | 200 | False | False | ap301-20260305082306-c1 | GW-TXN-1771286584944 |
| C2 | PASS | 200 | 200 | True | True | ap301-20260305082306-c1 | GW-TXN-1771286584944 |
| C3 | PASS | 401 | 401 | - | - | ap301-20260305082306-c3 | GW-TXN-1771286584944-invalid-signature |
| C4 | PASS | 200 | 200 | False | False | ap301-20260305082306-c4 | GW-TXN-1771012054958 |
| C5 | PASS | 500 | 500 | - | - | ap301-20260305082306-c5 |  |

## Payloads/Respostas

### C1 - Evento valido aprovado

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260305082306-c1","idempotencyKey":"ap301-20260305082306-c1","correlationId":"ap301-20260305082306-c1","origemId":"ap301-20260305082306-c1"}
```

### C2 - Evento duplicado

```json
{"success":true,"accepted":true,"duplicate":true,"eventId":"ap301-20260305082306-c1","idempotencyKey":"ap301-20260305082306-c1","correlationId":"ap301-20260305082306-c1","origemId":"ap301-20260305082306-c1"}
```

### C3 - Assinatura invalida

```json
{"message":"Assinatura invalida","error":"Unauthorized","statusCode":401}
```

### C4 - Evento de rejeicao

```json
{"success":true,"accepted":true,"duplicate":false,"eventId":"ap301-20260305082306-c4","idempotencyKey":"ap301-20260305082306-c4","correlationId":"ap301-20260305082306-c4","origemId":"ap301-20260305082306-c4"}
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
 230fff33-e0c4-42d9-aa6e-59c9dc7b08ae | mercado_pago | ap301-20260305082306-c5 | ap301-20260305082306-c5 | falha      |                      | Payload sem referencia de transacao |                         | 2026-03-05 11:23:07.439737
 dda9a0c0-7335-4a10-9f76-15cf4afe407e | mercado_pago | ap301-20260305082306-c4 | ap301-20260305082306-c4 | processado | GW-TXN-1771012054958 |                                     | 2026-03-05 08:23:07.389 | 2026-03-05 11:23:07.364632
 ba0c6379-ccf7-4d09-90bf-7bd5e64845d3 | mercado_pago | ap301-20260305082306-c1 | ap301-20260305082306-c1 | processado | GW-TXN-1771286584944 |                                     | 2026-03-05 08:23:07.197 | 2026-03-05 11:23:07.08754
(3 rows)

```

### transacoes_gateway_pagamento

```text
                  id                  |  referencia_gateway  |  status  | tipo_operacao | origem  |     processado_em      |         updated_at         
--------------------------------------+----------------------+----------+---------------+---------+------------------------+----------------------------
 5f5d38d2-0b7e-439f-abe8-25e46519e357 | GW-TXN-1771012054958 | recusado | webhook       | webhook | 2026-03-05 08:23:07.37 | 2026-03-05 11:23:07.372925
 dae1f8c4-adf7-4ada-9e37-c28865b82335 | GW-TXN-1771286584944 | aprovado | webhook       | webhook | 2026-03-05 08:23:07.1  | 2026-03-05 11:23:07.104139
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
  1 | 250cc3ac-617b-4d8b-be6e-b14901e4edde | HML-CODEXA-AP301-A-20260228140925 | paga
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
(12 rows)

```

