# AP-304 - Backlog tecnico de fechamento Vendas -> Financeiro (2026-03)

## 1. Objetivo

Consolidar as implementacoes finais para fechamento operacional do fluxo integrado entre Vendas e Financeiro, reduzindo gaps de sincronizacao, estorno/cancelamento e governanca.

## 2. Escopo

1. Sincronizacao bidirecional de status entre modulos.
2. Fluxo integrado de cancelamento/estorno.
3. Auditoria cross-modulo com rastreabilidade unica.
4. Fila de excecoes operacionais para divergencias.
5. Governanca operacional (SLA, runbook, ownership e alertas).

## 3. Stories propostas

### AP304-01 - Sincronizacao bidirecional de status Vendas/Financeiro

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Normalizar matriz de status entre contrato/proposta/fatura/pagamento.
  - Publicar evento interno de atualizacao de status com idempotencia.
  - Garantir reconciliacao eventual para registros divergentes.
- Frontend:
  - Exibir status consolidado unico nas telas de vendas e financeiro.
- Criterios de aceite:
  - Status de pagamento aprovado/refusado/cancelado reflete no modulo de vendas sem ajuste manual.
  - Divergencias sao corrigidas pelo processo de reconciliacao.

### AP304-02 - Cancelamento e estorno integrados

- Tipo: Story
- Estimativa: 8 pontos
- Backend:
  - Endpoints para solicitar cancelamento e estorno com trilha de auditoria.
  - Regras de transicao para reabertura/reclassificacao de titulos.
  - Protecao de idempotencia para repeticao de notificacoes do gateway.
- Frontend:
  - Acao operacional de cancelamento/estorno em contexto de pagamento/fatura.
  - Feedback de estado (solicitado, processando, concluido, falha).
- Criterios de aceite:
  - Cancelamento/estorno atualiza financeiro e vendas de forma consistente.
  - Reenvio de webhook de estorno nao causa duplicidade de ajuste.

### AP304-03 - Auditoria cross-modulo por correlacao

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Introduzir `correlationId` e `origemId` no fluxo fim a fim.
  - Persistir trilha de eventos em pontos criticos (contrato, faturamento, pagamento, webhook, conciliacao).
  - Expor endpoint de consulta de trilha por correlacao.
- Criterios de aceite:
  - Operacao consegue rastrear um caso completo com unica chave de correlacao.
  - Logs e banco exibem historico consistente por empresa.

### AP304-04 - Fila de excecoes operacionais

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Detectar e registrar excecoes de sincronizacao (status divergente, referencia invalida, falha de estorno).
  - Endpoint de listagem e acao de reprocessamento.
- Frontend:
  - Painel de excecoes com prioridade e acao de reprocessar.
- Criterios de aceite:
  - Casos divergentes aparecem na fila em ate 5 minutos.
  - Reprocessamento manual resolve ou sinaliza erro acionavel.

### AP304-05 - Governanca operacional e runbook

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Definicao de SLA por tipo de incidente.
  - Runbook operacional de resposta (falha webhook, divergencia status, falha estorno).
  - Matriz RACI (responsavel/aprovador/comunicacao).
- Criterios de aceite:
  - Operacao possui dono e SLA para cada tipo de falha.
  - Processo de escalacao documentado e aprovado.

### AP304-06 - Testes de regressao integrados expandidos

- Tipo: Story
- Estimativa: 3 pontos
- Backend/Frontend:
  - Expandir suites com cenarios de estorno/cancelamento e divergencia de status.
  - Incorporar script de regressao integrada no checklist de release.
- Criterios de aceite:
  - Pipeline verde com cobertura dos novos cenarios criticos.
  - Relatorio automatizado anexado no gate de homologacao.

## 4. Sequenciamento recomendado

1. AP304-01 -> AP304-02 -> AP304-03 -> AP304-04 -> AP304-05 -> AP304-06

## 5. Dependencias abertas

1. Definicao de politica de estorno/cancelamento com Financeiro.
2. Definicao de impacto comercial da matriz final de status.
3. Validacao de SLA e ownership com Operacoes/Produto.

## 6. Evidencia tecnica atual

1. Roteiro de QA integrado publicado:
   - `docs/features/ROTEIRO_QA_FLUXO_VENDAS_FINANCEIRO_2026-03.md`
2. Regressao automatizada integrada disponivel:
   - `scripts/test-fluxo-vendas-financeiro-regressao.ps1`
3. Execucao de regressao completa registrada:
   - `docs/features/RELATORIO_REGRESSAO_FLUXO_VENDAS_FINANCEIRO_COMPLETO_2026-02-28.md` (6/6 PASS)
4. Execucao parcial AP304-01/AP304-02 aplicada no backend:
   - normalizacao adicional de transicoes para rollback financeiro em `backend/src/modules/propostas/propostas.service.ts`;
   - sincronizacao de cancelamento de fatura para status comercial em `backend/src/modules/faturamento/services/faturamento.service.ts`;
   - cobertura E2E expandida (cancelamento de fatura e estorno manual) em `backend/test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts`;
   - validacao reexecutada em `npm run test:e2e:vendas` (21/21 PASS).
5. Execucao parcial AP304-03 aplicada no backend:
   - propagacao de `correlationId`/`origemId` no fluxo webhook -> pagamento -> fatura -> proposta em `backend/src/modules/pagamentos/services/gateway-webhook.service.ts`, `backend/src/modules/faturamento/services/pagamento.service.ts`, `backend/src/modules/faturamento/services/faturamento.service.ts` e `backend/src/modules/propostas/propostas.service.ts`;
   - endpoint operacional de consulta por correlacao em `GET /faturamento/auditoria/correlacao/:correlationId` (`backend/src/modules/faturamento/faturamento.controller.ts`);
   - cobertura E2E da consulta de trilha por correlacao em `backend/test/propostas/faturamento-pagamentos-gateway.e2e-spec.ts`;
   - validacao reexecutada em `npm run test:e2e:vendas` (22/22 PASS).
6. Execucao parcial AP304-04 aplicada no backend/frontend:
   - fila de excecoes expandida com tipos dedicados: `status_sincronizacao_divergente`, `referencia_integracao_invalida`, `estorno_falha` (`backend/src/modules/financeiro/entities/alerta-operacional-financeiro.entity.ts`);
   - migration para enum de tipos de alerta: `backend/src/migrations/1802890000000-AddAp304TiposAlertaOperacionalFinanceiro.ts`;
   - endpoint de reprocessamento operacional em `POST /financeiro/alertas-operacionais/:id/reprocessar` (`backend/src/modules/financeiro/controllers/alerta-operacional-financeiro.controller.ts`);
   - logica de reprocessamento por tipo (sincronizacao de status, retry de estorno, retry manual de referencia de integracao) em `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.ts`;
   - deteccao automatica de excecoes no fluxo integrado:
     - divergencia de sincronizacao em `backend/src/modules/faturamento/services/faturamento.service.ts`;
     - estorno falho em `backend/src/modules/faturamento/services/pagamento.service.ts`;
     - referencia invalida no webhook em `backend/src/modules/pagamentos/services/gateway-webhook.service.ts`;
   - cobertura de testes atualizada:
     - unitario alertas/reprocessamento: `npm run test -- alerta-operacional-financeiro.service.spec.ts alerta-operacional-financeiro.controller.spec.ts --runInBand` (15/15 PASS);
     - unitario webhook: `npm run test -- gateway-webhook.service.spec.ts gateway-webhook.controller.spec.ts --runInBand` (10/10 PASS);
     - unitario pagamento: `npx jest --runInBand --rootDir . test/faturamento/processar-pagamento-status.spec.ts` (4/4 PASS);
     - regressao E2E vendas: `npm run test:e2e:vendas` (22/22 PASS);
     - frontend contrato alertas: `$env:CI='true'; npm test -- --runInBand --watch=false src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts` (4/4 PASS);
     - frontend estado dashboard V2: `$env:CI='true'; npm test -- --runInBand --watch=false src/features/dashboard-v2/__tests__/financeiro-alertas-state.test.ts` (3/3 PASS).
   - frontend atualizado com acao de reprocessar no painel de alertas do dashboard financeiro V2:
     - extensao de tipos e contrato do service para `reprocessar` em `frontend-web/src/types/financeiro/index.ts` e `frontend-web/src/services/alertasOperacionaisFinanceiroService.ts`;
     - acao contextual `Reprocessar` para excecoes AP304 (`status_sincronizacao_divergente`, `estorno_falha`, `referencia_integracao_invalida`) em `frontend-web/src/features/dashboard-v2/FinanceiroDashboardV2.tsx`.
7. Execucao inicial AP304-05 (governanca operacional) publicada:
   - documento base de SLA, runbook, RACI e escalacao em `docs/features/AP304_GOVERNANCA_RUNBOOK_OPERACIONAL_2026-03.md`;
   - status: aprovado em 2026-02-28 no modelo de responsavel unico.
8. Execucao AP304-06 (regressao integrada expandida):
   - regra de reprocessamento do dashboard financeiro V2 extraida para modulo testavel em `frontend-web/src/features/dashboard-v2/financeiro-alertas-reprocessamento.ts`;
   - cobertura dedicada adicionada em `frontend-web/src/features/dashboard-v2/__tests__/financeiro-alertas-reprocessamento.test.ts` (10/10 PASS);
   - script integrado de regressao atualizado para incluir a nova suite em `scripts/test-fluxo-vendas-financeiro-regressao.ps1`;
   - regressao completa reexecutada com script integrado (RUN `20260228-132827`, `PASS 6/6`) e relatorio publicado em `docs/features/RELATORIO_REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260228-132827.md`;
   - nova rodada consolidada de homologacao integrada (RUN `20260228-133245`) com `HOMO-001` PASS + `HOMO-002` PASS e evidencias em `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`;
   - relatorio formal para sign-off QA/negocio publicado em `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`.
9. Pacote de aprovacao e governanca de fechamento publicado:
   - pauta de aprovacao AP-302/AP-303 em `docs/features/PAUTA_APROVACAO_AP302_AP303_2026-03.md`;
   - checklist de sign-off integrado em `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`;
   - sanitizacao de segredo em relatorios e mascaramento de `WebhookSecret` no orquestrador em `scripts/test-homologacao-fluxo-vendas-financeiro.ps1`.
