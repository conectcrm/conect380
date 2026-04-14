# Relatorio QA - AP-301 Webhook Pagamentos (Template)

## 1. Metadados da execucao

- Data da execucao:
- Ambiente:
- Gateway:
- EmpresaId:
- Responsavel execucao:
- Responsavel validacao final:

## 2. Parametros utilizados

- BaseUrl:
- ReferenciaGateway (aprovado):
- ReferenciaGateway (rejeitado):
- Script assistido utilizado: `scripts/test-ap301-webhook-homologacao.ps1`
- Evidencia gerada em arquivo:

## 3. Resultado por cenario (C1..C5)

| Cenario | Status (PASS/FAIL/BLOCKED) | HTTP recebido | duplicate recebido | Evidencia |
| --- | --- | --- | --- | --- |
| C1 - Evento valido aprovado |  |  |  |  |
| C2 - Evento duplicado |  |  |  |  |
| C3 - Assinatura invalida |  |  |  |  |
| C4 - Evento de rejeicao |  |  |  |  |
| C5 - Falha controlada |  |  |  |  |

## 4. Evidencias SQL (obrigatorias)

- [ ] `webhooks_gateway_eventos` anexado
- [ ] `transacoes_gateway_pagamento` anexado
- [ ] `pagamentos` anexado
- [ ] `faturas` anexado (quando aplicavel)

## 5. Logs operacionais

- [ ] Logs com `eventId` anexados
- [ ] Logs com `idempotencyKey` anexados
- [ ] Logs com `empresaId` e `gateway` anexados

## 6. Bugs e desvios encontrados

| ID bug | Severidade | Cenario | Descricao | Status |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 7. Conclusao AP-301 (14.2.3)

- Todos os cenarios C1..C5 aprovados:
- Sem duplicidade de baixa no C2:
- Trilha de auditoria completa (sucesso/falha):
- Recomendacao final (GO/NO-GO):
