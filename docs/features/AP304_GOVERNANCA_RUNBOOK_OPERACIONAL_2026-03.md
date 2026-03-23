# AP304-05 - Governanca operacional e runbook (2026-03)

## 1. Objetivo

Definir padrao operacional para incidentes do fluxo Vendas -> Financeiro, com SLA, ownership, escalacao e procedimentos de resposta.

## 2. Escopo de incidentes

1. Falha de webhook de pagamento (nao processado, assinatura invalida, erro interno).
2. Divergencia de status entre proposta/fatura/pagamento.
3. Falha de estorno/cancelamento com impacto financeiro.

## 3. SLA operacional por severidade

| Severidade | Exemplo | Tempo para reconhecimento (ACK) | Tempo alvo para mitigacao | Tempo alvo para resolucao |
| --- | --- | --- | --- | --- |
| SEV-1 | Falha generalizada de webhook com impacto em faturamento ativo | 15 min | 1 h | 4 h |
| SEV-2 | Divergencia recorrente de status em lote ou estorno falho com impacto parcial | 30 min | 4 h | 1 dia util |
| SEV-3 | Falha pontual sem impacto imediato de caixa | 4 h | 1 dia util | 3 dias uteis |

## 4. Matriz RACI

| Atividade | Backend | Frontend | QA | Produto | Financeiro/Operacoes |
| --- | --- | --- | --- | --- | --- |
| Triage tecnico inicial | R | C | C | I | I |
| Contencao temporaria (workaround) | R | C | C | I | A |
| Correcao definitiva | R | R | C | C | I |
| Validacao em homologacao | C | C | R | I | A |
| Comunicacao de incidente e status | C | I | I | A | R |
| Encerramento e post-mortem | R | C | C | A | R |

Legenda: `R` = Responsible, `A` = Accountable, `C` = Consulted, `I` = Informed.

## 5. Runbook por tipo de incidente

### 5.1 Falha de webhook de pagamento

1. Confirmar aumento de erros em `gateway-webhook` e identificar `empresaId`/`gatewayTransacaoId`.
2. Validar assinatura, payload recebido e idempotencia no evento.
3. Reprocessar evento:
   - via rotina tecnica de reenvio em ambiente seguro;
   - ou via fluxo operacional de alerta/reprocessamento quando aplicavel.
4. Verificar sincronizacao final em `pagamentos`, `faturas` e status comercial da proposta.
5. Registrar evidencias (logs, SQL e correlationId) no relatorio de homologacao/incidente.

### 5.2 Divergencia de status proposta x financeiro

1. Identificar alertas `status_sincronizacao_divergente`.
2. Consultar trilha de correlacao por `correlationId` (`GET /faturamento/auditoria/correlacao/:correlationId`).
3. Executar `reprocessar` no alerta operacional.
4. Confirmar transicao final de status em proposta, fatura e pagamento.
5. Se persistir falha, abrir bug com evidencias e classificar severidade conforme impacto.

### 5.3 Falha de estorno/cancelamento

1. Identificar alertas `estorno_falha` e validar `pagamentoId` afetado.
2. Verificar pre-condicao de elegibilidade do estorno no pagamento/fatura.
3. Reprocessar alerta de estorno e confirmar criacao de registro de estorno.
4. Confirmar rollback de status comercial/financeiro apos estorno.
5. Comunicar Financeiro/Operacoes quando houver impacto de conciliacao ou fechamento.

## 6. Escalacao

1. Se `SEV-1` sem mitigacao em 1 hora: escalar para Tech Lead + Produto + Operacoes.
2. Se `SEV-2` sem mitigacao em 4 horas: escalar para Tech Lead + Produto.
3. Todo incidente com impacto financeiro confirmado deve ter post-mortem em ate 2 dias uteis.

## 7. Evidencias minimas obrigatorias

1. CorrelationId do caso.
2. Resultado do reprocessamento (sucesso/falha + mensagem).
3. Snapshot de status final em proposta/fatura/pagamento.
4. Registro de comunicacao para Financeiro/Operacoes.

## 8. Status

Documento base publicado em 2026-02-28 para validacao com Produto e Financeiro/Operacoes.
