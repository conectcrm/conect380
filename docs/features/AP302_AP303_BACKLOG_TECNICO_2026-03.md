# AP-302/AP-303 - Backlog tecnico refinado (2026-03)

## 1. Objetivo

Quebrar AP-302 e AP-303 em stories tecnicas prontas para planejamento de sprint.

Referencias:

1. Plano principal: `docs/features/PLANO_EXECUCAO_CONTAS_PAGAR_2026.md`
2. Minuta de requisitos: `docs/features/AP302_AP303_MINUTA_REQUISITOS_2026-03.md`

## 2. AP-302 - Exportacao contabil/fiscal

### AP302-01 - Contrato de exportacao e filtros

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - DTO de filtros (`periodo`, `centroCusto`, `status`, `fornecedor`, `contaBancaria`, `formato`).
  - Endpoint `GET /contas-pagar/exportacao` (stream/download) com permissao financeira.
- Criterios de aceite:
  - Filtros validados no backend.
  - Resposta bloqueia acesso sem escopo da empresa.
- Status atual:
  - Implementacao iniciada no backend com endpoint `GET /contas-pagar/exportacao`.
  - DTO de filtros e serializacao inicial `csv/xlsx` entregues para validacao tecnica.
  - Contrato de consumo frontend adicionado no service financeiro.
  - Evidencias: `backend/src/modules/financeiro/controllers/conta-pagar.controller.ts`, `backend/src/modules/financeiro/services/conta-pagar.service.ts`, `backend/src/modules/financeiro/dto/conta-pagar.dto.ts`, `frontend-web/src/services/contasPagarService.ts`, `frontend-web/src/services/__tests__/contasPagarService.test.ts`.

### AP302-02 - Geracao de arquivo CSV/XLSX

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Service para montar dataset e serializar `csv` e `xlsx`.
  - Normalizacao de datas/valores e ordenacao deterministica.
- Criterios de aceite:
  - Arquivo gerado em ambos formatos com mesmo total de linhas.
  - Colunas obrigatorias presentes conforme contrato.
- Status atual:
  - Service de exportacao implementado com serializacao `csv` e `xlsx`, normalizacao de valores e ordenacao deterministica.
  - Endpoint de exportacao entrega `Content-Type` e `Content-Disposition` conforme formato solicitado.
  - Cobertura automatizada valida ambos os formatos e consistencia dos registros exportados.
  - Evidencias: `backend/src/modules/financeiro/services/conta-pagar.service.ts`, `backend/src/modules/financeiro/controllers/conta-pagar.controller.ts`, `backend/src/modules/financeiro/services/conta-pagar.service.spec.ts`, `backend/test/financeiro/contas-pagar.e2e-spec.ts`.

### AP302-03 - Historico e auditoria de exportacoes

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - Tabela de historico de exportacoes (usuario, filtros, formato, status, criado em).
  - Persistencia de tentativas com erro/sucesso.
- Criterios de aceite:
  - Cada download gera registro auditavel.
  - Falhas ficam rastreaveis com motivo.
- Status atual:
  - Trilha de auditoria implementada em backend com persistencia de sucesso/falha por exportacao.
  - Endpoint de consulta de historico entregue em `GET /contas-pagar/exportacao/historico`.
  - Contrato frontend de leitura do historico publicado para uso na UI.
  - Evidencias: `backend/src/modules/financeiro/entities/conta-pagar-exportacao.entity.ts`, `backend/src/migrations/1802886000000-CreateContasPagarExportacoes.ts`, `backend/src/modules/financeiro/services/conta-pagar.service.ts`, `backend/src/modules/financeiro/controllers/conta-pagar.controller.ts`, `frontend-web/src/services/contasPagarService.ts`.

### AP302-04 - UI de exportacao financeira

- Tipo: Story
- Estimativa: 5 pontos
- Frontend:
  - Acao de exportar na tela de contas a pagar com modal de filtros.
  - Feedback de loading/erro e download.
- Criterios de aceite:
  - Usuario financeiro consegue exportar com filtros.
  - Mensagens de erro sao claras e acionaveis.
- Status atual:
  - Modal de exportacao integrado na tela `Contas a Pagar` com filtros e download real.
  - UI conecta no endpoint backend de exportacao e exibe feedback de sucesso/erro.
  - Evidencias: `frontend-web/src/pages/gestao/financeiro/ContasPagarPage.tsx`, `frontend-web/src/services/contasPagarService.ts`.

### AP302-05 - Testes e regressao

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - testes unitarios/integracao do service e controller.
- Frontend:
  - teste de contrato do service de exportacao.
- Criterios de aceite:
  - Pipeline verde sem regressao das rotas financeiras existentes.
- Status atual:
  - Cobertura unitária/contrato atualizada para exportacao e historico.
  - Suite e2e de contas a pagar validada com cenarios de exportacao e auditoria por empresa.
  - Evidencias: `backend/src/modules/financeiro/services/conta-pagar.service.spec.ts`, `backend/src/modules/financeiro/controllers/conta-pagar.controller.spec.ts`, `frontend-web/src/services/__tests__/contasPagarService.test.ts`, `backend/test/financeiro/contas-pagar.e2e-spec.ts`.

## 3. AP-303 - Alertas operacionais

### AP303-01 - Modelo de alerta operacional

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Entidade `alertas_operacionais_financeiro` + migration.
  - Campos: tipo, severidade, referencia, status, payload, timestamps, auditoria.
- Criterios de aceite:
  - Estrutura suporta estados `ativo`, `acknowledged`, `resolvido`.
  - Indices para consulta por empresa/status/severidade.
- Status atual:
  - Entidade `alertas_operacionais_financeiro` implementada com enums de tipo/severidade/status, payload e trilha de auditoria.
  - Migration de criacao publicada com indices por `empresa/status`, `empresa/severidade` e `empresa/created_at`.
  - Evidencias: `backend/src/modules/financeiro/entities/alerta-operacional-financeiro.entity.ts`, `backend/src/migrations/1802887000000-CreateAlertasOperacionaisFinanceiro.ts`.

### AP303-02 - Motor de geracao de alertas

- Tipo: Story
- Estimativa: 8 pontos
- Backend:
  - Regras iniciais:
    - contas vencendo/vencidas;
    - conciliacao pendente critica;
    - webhook de pagamento com falha.
  - Job periodico com deduplicacao por referencia.
- Criterios de aceite:
  - Alertas criticos sao gerados sem duplicidade indevida.
  - Reexecucao do job e idempotente.
- Status atual:
  - Recalculo de alertas implementado com deduplicacao por `tipo + referencia` e resolucao automatica de alertas ausentes.
  - Regras entregues: contas vencendo em ate 3 dias, contas vencidas, conciliacao pendente critica, webhook com falha e exportacao contabil com falha.
  - Endpoint operacional de reprocessamento publicado em `POST /financeiro/alertas-operacionais/recalcular`.
  - Job periodico interno entregue com `setInterval` por empresa ativa e protecao contra overlap (`FINANCEIRO_ALERTAS_AUTO_RECALCULO_ENABLED`, `FINANCEIRO_ALERTAS_AUTO_RECALCULO_INTERVAL_MS`).
  - Evidencias: `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.ts`, `backend/src/modules/financeiro/controllers/alerta-operacional-financeiro.controller.ts`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro-monitor.service.ts`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.spec.ts`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro-monitor.service.spec.ts`.

### AP303-03 - API de consulta e acknowledgement

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - `GET /financeiro/alertas-operacionais`
  - `POST /financeiro/alertas-operacionais/:id/ack`
  - `POST /financeiro/alertas-operacionais/:id/resolver`
- Criterios de aceite:
  - API respeita permissao financeira e isolamento de empresa.
  - Toda mudanca de estado grava auditoria.
- Status atual:
  - Endpoints `GET /financeiro/alertas-operacionais`, `POST /:id/ack` e `POST /:id/resolver` implementados com guardas e escopo de permissao financeira.
  - Mudancas de estado registram auditoria e metadados de usuario/data no backend.
  - Evidencias: `backend/src/modules/financeiro/controllers/alerta-operacional-financeiro.controller.ts`, `backend/src/modules/financeiro/dto/alerta-operacional-financeiro.dto.ts`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.ts`, `backend/src/modules/financeiro/controllers/alerta-operacional-financeiro.controller.spec.ts`.

### AP303-04 - Painel de alertas no dashboard financeiro V2

- Tipo: Story
- Estimativa: 5 pontos
- Frontend:
  - Bloco de alertas com contadores por severidade e lista priorizada.
  - Acoes de acknowledgement/resolucao no proprio painel.
- Criterios de aceite:
  - Financeiro visualiza alertas por prioridade.
  - Mudancas de estado refletem no painel sem recarregar pagina inteira.
- Status atual:
  - Bloco de alertas integrado no Dashboard Financeiro V2 com contadores por severidade e lista priorizada.
  - Acoes de `ack`/`resolver` acionadas no proprio painel com atualizacao imediata de estado local (sem reload da pagina).
  - Service frontend de alertas operacionais publicado com contrato de listagem/ack/resolucao/recalculo.
  - Evidencias: `frontend-web/src/features/dashboard-v2/FinanceiroDashboardV2.tsx`, `frontend-web/src/services/alertasOperacionaisFinanceiroService.ts`, `frontend-web/src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts`, `frontend-web/src/types/financeiro/index.ts`.

### AP303-05 - Observabilidade e testes

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - Logs estruturados para geracao e transicao de alertas.
  - Testes unitarios de regras criticas.
- Frontend:
  - Testes de contrato/estado do service de alertas.
- Criterios de aceite:
  - Evidencia de rastreabilidade por `empresaId`, `tipo`, `referencia`.
- Status atual:
  - Backend com logs estruturados de geracao/recalculo/transicao em alertas operacionais, incluindo `empresaId`, `tipo` e `referencia`.
  - Monitor automatico de alertas publicado com metricas Prometheus para ciclo/status/duracao/totais em `/metrics`.
  - Regras de alerta Prometheus para stale/fatal/failure-rate/slow-cycle publicadas em `backend/config/alert-rules.yml`.
  - Dashboard Grafana de observabilidade do monitor financeiro publicado em `observability/grafana/dashboards/financeiro-alertas-monitor.json`.
  - Alertmanager local estabilizado com ajuste da configuracao de teste em `backend/config/alertmanager-test.yml` e healthchecks `/-/healthy` + `/-/ready` operacionais.
  - Cobertura de testes ampliada para validar rastreabilidade e regras criticas (ack/resolver/recalculo/auto-resolucao).
  - Frontend com testes de contrato do service de alertas e testes de estado da logica do painel (priorizacao, contadores e atualizacao local sem reload).
  - Evidencias: `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.ts`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro-monitor.service.ts`, `backend/src/config/metrics.ts`, `backend/config/alert-rules.yml`, `backend/src/modules/financeiro/services/alerta-operacional-financeiro.service.spec.ts`, `frontend-web/src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts`, `frontend-web/src/features/dashboard-v2/financeiro-alertas-state.ts`, `frontend-web/src/features/dashboard-v2/__tests__/financeiro-alertas-state.test.ts`, `observability/grafana/dashboards/financeiro-alertas-monitor.json`, `docs/features/AP303_OBSERVABILIDADE_MONITOR_ALERTAS_2026-03.md`.

## 4. Sequenciamento recomendado

1. AP302-01 -> AP302-02 -> AP302-03 -> AP302-04 -> AP302-05
2. AP303-01 -> AP303-02 -> AP303-03 -> AP303-04 -> AP303-05

## 5. Dependencias de aprovacao (status)

1. Validacao de layout final AP-302 com Contabil: RESOLVIDO em 2026-02-28 (opcao A, sem colunas extras neste ciclo).
2. Definicao de threshold de criticidade AP-303 com Financeiro: RESOLVIDO em 2026-02-28 (janela de 3 dias).
3. Confirmacao da capacidade da sprint para absorver AP-302/AP-303: RESOLVIDO em 2026-02-28 (execucao em paralelo para sustentacao incremental).
4. Registro de aprovacao: `docs/features/PAUTA_APROVACAO_AP302_AP303_2026-03.md` (modelo de responsavel unico).

## 6. Evidencias de regressao automatizada (2026-02-28)

1. Backend AP-302/AP-303:
   - `npm run test -- alerta-operacional-financeiro.service.spec.ts alerta-operacional-financeiro.controller.spec.ts alerta-operacional-financeiro-monitor.service.spec.ts --runInBand` -> 14/14 PASS.
   - `npm run test:e2e -- ./financeiro/contas-pagar.e2e-spec.ts` -> 5/5 PASS (inclui exportacao e historico).
2. Frontend AP-302/AP-303:
   - `npm test -- --watch=false --runInBand src/services/__tests__/contasPagarService.test.ts src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts src/features/dashboard-v2/__tests__/financeiro-alertas-state.test.ts` -> 17/17 PASS.
