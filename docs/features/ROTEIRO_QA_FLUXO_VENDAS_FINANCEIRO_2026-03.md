# Roteiro QA Integrado - Fluxo Vendas -> Financeiro (2026-03)

## 1. Objetivo

Validar ponta a ponta o fluxo integrado entre Vendas e Financeiro, com foco em sincronizacao de status, idempotencia de webhook, rastreabilidade e ausencia de regressao.

## 2. Escopo

1. Contrato/proposta gerando faturamento.
2. Processamento de pagamento via gateway e webhook.
3. Sincronizacao de status em pagamento/fatura.
4. Trilhas de auditoria (webhook e logs operacionais).
5. Regressao das rotas financeiras relacionadas (contas a pagar, conciliacao e alertas).

## 3. Pre-condicoes

1. Backend e frontend atualizados.
2. Migracoes aplicadas para:
   - `webhooks_gateway_eventos`
   - `contas_pagar_exportacoes`
   - `alertas_operacionais_financeiro`
3. Ambiente com gateway sandbox configurado para empresa de teste.
4. Usuario com perfil financeiro e usuario com perfil de vendas disponiveis.

## 4. Cenarios obrigatorios

| ID | Cenario | Resultado esperado |
| --- | --- | --- |
| VF-001 | Assinatura/fechamento comercial gera faturamento/pagamento vinculavel | Registro criado com referencia de origem consistente |
| VF-002 | Webhook `approved` valida assinatura e sincroniza status | `pagamentos.status=aprovado` e `faturas.status=paga` quando aplicavel |
| VF-003 | Reenvio do mesmo webhook (idempotencia) | Resposta com `duplicate=true`, sem baixa duplicada |
| VF-004 | Webhook `rejected` | `pagamentos.status=rejeitado` com `motivoRejeicao` preenchido |
| VF-005 | Webhook com assinatura invalida | `401` sem atualizar pagamento/fatura |
| VF-006 | Falha controlada de processamento de webhook | Evento em `webhooks_gateway_eventos.status=falha` com mensagem de erro |
| VF-007 | Regressao financeira (contas a pagar/exportacao/conciliacao/alertas) | Suites automatizadas sem regressao |

## 5. Evidencias obrigatorias

1. Request/response HTTP dos cenarios VF-002..VF-006.
2. Logs com `empresaId`, `eventId` ou `idempotencyKey`.
3. Evidencias SQL de:
   - `webhooks_gateway_eventos`
   - `transacoes_gateway_pagamento`
   - `pagamentos`
   - `faturas` (quando aplicavel)
4. Relatorio consolidado com PASS/FAIL por cenario.

## 6. Execucao assistida

1. Homologacao AP-301:
   - Script: `scripts/test-ap301-webhook-homologacao.ps1`
   - Guia: `docs/features/AP301_HOMOLOGACAO_ASSISTIDA_WEBHOOK_2026-03.md`
2. Regressao integrada automatizada:
   - Script: `scripts/test-fluxo-vendas-financeiro-regressao.ps1`
3. Orquestracao integrada (AP-301 + regressao + consolidacao):
   - Script: `scripts/test-homologacao-fluxo-vendas-financeiro.ps1`
   - Template de saida: `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_2026-03_TEMPLATE.md`

## 7. Criterio de saida (go/no-go)

1. VF-002, VF-003, VF-004 e VF-005 em PASS.
2. Nenhuma duplicidade de baixa no VF-003.
3. Suites de regressao integradas sem falha.
4. Sem bug critico/alto aberto para o fluxo integrado.
