# Plano de Execucao - Ciclo de Vida de Oportunidades (Pipeline CRM) - 2026-03

## 1. Objetivo

Entregar a evolucao do ciclo de vida das oportunidades sem regressao operacional, alinhando o Conect360 ao padrao dos CRMs de mercado:

1. Separar status de ciclo de vida da progressao de estagios comerciais.
2. Evitar exclusao irreversivel acidental (soft delete + restauracao).
3. Permitir operacao clara entre abertas, fechadas, arquivadas e excluidas.
4. Garantir consistencia em Pipeline, Dashboard V2, Analytics, Leads e Propostas.

## 2. Regra de ouro (nao pular etapas)

1. Nenhuma etapa pode iniciar sem concluir os criterios de saida da etapa anterior.
2. Mudancas de schema e contrato de API devem ser protegidas por feature flag.
3. Qualquer ajuste de regra no Pipeline exige validacao de Dashboard V2 e Analytics no mesmo ciclo.
4. Nao habilitar exclusao definitiva sem entregar lixeira e restauracao.

## 3. Escopo

### Em escopo

1. Ciclo de vida: `open`, `won`, `lost`, `archived`, `deleted`.
2. Soft delete, restauracao e exclusao definitiva controlada.
3. Reabertura de oportunidade fechada (com auditoria e permissao).
4. Filtros e visoes operacionais no Pipeline.
5. Ajustes de metricas/consultas no Dashboard V2 e Analytics.
6. Ajustes de integracao interna (Leads e Propostas).

### Fora de escopo (neste ciclo)

1. Reestruturacao completa de funis customizaveis por tenant.
2. Motor de automacao complexo de lifecycle (workflow designer).
3. Integracoes externas de CRM de terceiros.

## 4. Sequencia obrigatoria de execucao

## Fase 0 - Contrato funcional e governanca (Gate 0)

### Tarefas

- [ ] Definir matriz oficial de estados e transicoes permitidas.
- [ ] Definir papeis/permissoes para: arquivar, restaurar, reabrir, excluir definitivo.
- [ ] Definir comportamento padrao por visao:
  - Pipeline operacional: abertas.
  - Visao de fechadas: won/lost.
  - Visao de arquivadas.
  - Lixeira.
- [ ] Definir janela de retencao para itens em lixeira (ex.: 30/60/90 dias).
- [ ] Aprovar nomenclatura de API e campos de banco.

### Criterios de saida (Gate 0)

- [ ] Documento funcional validado por Produto + Comercial + Financeiro.
- [ ] Mapa de transicao aprovado.
- [ ] Matriz de permissao aprovada.

## Fase 1 - Banco e backend base (Gate 1)

### Tarefas de dados

- [ ] Criar migration para campos de ciclo de vida em `oportunidades`:
  - `lifecycle_status` (default `open`)
  - `archived_at`, `archived_by`
  - `deleted_at`, `deleted_by`
  - `reopened_at`, `reopened_by`
- [ ] Criar indices para consultas operacionais e dashboard.
- [ ] Criar backfill dos registros legados sem downtime.

### Tarefas de backend

- [ ] Ajustar listagem padrao para excluir `deleted` e respeitar filtros de lifecycle.
- [ ] Implementar endpoints:
  - `POST /oportunidades/:id/arquivar`
  - `POST /oportunidades/:id/restaurar`
  - `POST /oportunidades/:id/reabrir`
  - `DELETE /oportunidades/:id` (soft delete)
  - `DELETE /oportunidades/:id/permanente` (hard delete, restrito)
- [ ] Ajustar validacoes de transicao de estagio em conjunto com lifecycle.
- [ ] Registrar auditoria em todas as mudancas de lifecycle.
- [ ] Publicar feature flag por tenant para ativacao gradual.

### Testes obrigatorios

- [ ] Unitarios de regras de transicao lifecycle + estagio.
- [ ] Integracao/E2E de soft delete, restore e hard delete.
- [ ] Testes de permissao por endpoint de lifecycle.

### Criterios de saida (Gate 1)

- [ ] API com contrato estavel e testes verdes.
- [ ] Migration aplicada em homologacao com backfill validado.
- [ ] Feature flag operante.

## Fase 2 - Pipeline e UX operacional (Gate 2)

### Tarefas de frontend (Pipeline + modais)

- [ ] Atualizar filtros rapidos no Pipeline:
  - abertas, fechadas, arquivadas, lixeira.
- [ ] Ajustar cards/modais com acoes:
  - marcar ganho/perda, reabrir, arquivar, restaurar, excluir.
- [ ] Garantir mensagens de erro claras para transicao invalida.
- [ ] Manter DnD coerente com regras de estagio/lifecycle.
- [ ] Atualizar contadores e chips de filtro de forma consistente.

### Tarefas de contrato frontend

- [ ] Atualizar tipos em `frontend-web/src/types/oportunidades` para lifecycle.
- [ ] Ajustar service `oportunidadesService` para novos endpoints/params.
- [ ] Garantir fallback seguro para tenants sem flag ativa.

### QA obrigatorio

- [ ] Roteiro funcional:
  - criar -> mover estagio -> ganhar/perder -> reabrir -> arquivar -> restaurar -> excluir.
- [ ] Regressao de Pipeline nas visoes kanban/lista/calendario/grafico.

### Criterios de saida (Gate 2)

- [ ] UX aprovada em homologacao.
- [ ] Nenhuma operacao critica sem confirmacao/auditoria.
- [ ] Regressao de Pipeline sem bloqueadores.

## Fase 3 - Dashboards, Analytics e integracoes (Gate 3)

### Tarefas de Dashboard V2 e Analytics

- [ ] Revisar consultas de oportunidades ativas para excluir `archived/deleted`.
- [ ] Revisar funil e conversao com classificacao por lifecycle.
- [ ] Revisar receita prevista e contagens por status.
- [ ] Atualizar snapshots/agregacoes para novo modelo.

### Tarefas de integracao interna

- [ ] Leads: garantir criacao de oportunidade com lifecycle `open`.
- [ ] Propostas: garantir compatibilidade em fluxos legados de criacao/vinculo.
- [ ] Ajustar relatarios/exportacoes que usam estagio como unica fonte de verdade.

### Testes obrigatorios

- [ ] Testes de consistencia entre Pipeline x Dashboard V2 x Analytics.
- [ ] Validacao de historico de atividades apos arquivar/restaurar.
- [ ] Regressao de integracao Leads/Propostas.

### Criterios de saida (Gate 3)

- [ ] Numeros consistentes entre modulos.
- [ ] Sem divergencia critica de metricas em homologacao.
- [ ] Integracoes internas validadas ponta a ponta.

## Fase 4 - Rollout controlado e operacao assistida (Gate 4)

### Tarefas de rollout

- [ ] Ativar feature flag para tenants piloto.
- [ ] Monitorar logs/erros/metricas por 48h.
- [ ] Executar checklist de rollback (flag off) validado.
- [ ] Expandir rollout por lote apos estabilidade.

### Tarefas operacionais

- [ ] Publicar runbook de suporte com cenarios de restauracao/reabertura.
- [ ] Treinar equipe de operacao/comercial no novo fluxo.
- [ ] Comunicar mudancas de comportamento para usuarios finais.

### Criterios de saida (Gate 4)

- [ ] Piloto estavel sem incidentes P1/P2.
- [ ] Rollout completo com monitoramento ativo.
- [ ] Go-live formal aprovado.

## 5. Backlog tecnico por modulo

## Backend - Oportunidades

- [ ] Ajustar entidade `backend/src/modules/oportunidades/oportunidade.entity.ts`.
- [ ] Ajustar DTOs e validacoes em `backend/src/modules/oportunidades/dto`.
- [ ] Ajustar regras em `backend/src/modules/oportunidades/oportunidades.service.ts`.
- [ ] Expor endpoints em `backend/src/modules/oportunidades/oportunidades.controller.ts`.
- [ ] Criar/atualizar testes em `backend/src/modules/oportunidades/*.spec.ts`.

## Frontend - Pipeline

- [ ] Ajustar `frontend-web/src/pages/PipelinePage.tsx`.
- [ ] Ajustar modais:
  - `frontend-web/src/components/oportunidades/ModalDetalhesOportunidade.tsx`
  - `frontend-web/src/components/oportunidades/ModalMudancaEstagio.tsx`
  - `frontend-web/src/components/oportunidades/ModalOportunidadeRefatorado.tsx`
- [ ] Ajustar `frontend-web/src/services/oportunidadesService.ts`.
- [ ] Ajustar tipos em `frontend-web/src/types/oportunidades`.

## Dashboard/Analytics

- [ ] Ajustar `backend/src/modules/dashboard-v2/services/dashboard-v2-aggregation.service.ts`.
- [ ] Ajustar `backend/src/modules/analytics/analytics.service.ts`.
- [ ] Validar consumo em `frontend-web/src/features/dashboard-v2`.

## Integracoes internas

- [ ] Revisar `backend/src/modules/leads/leads.service.ts`.
- [ ] Revisar `backend/src/modules/propostas/propostas.service.ts`.

## 6. Controle de qualidade (checklist de nao regressao)

- [ ] Nao ha exclusao fisica no fluxo padrao.
- [ ] Restauracao funciona para itens em lixeira.
- [ ] Reabertura respeita permissao e registra auditoria.
- [ ] Pipeline operacional nao mistura arquivadas/deletadas por padrao.
- [ ] Dashboard V2 e Analytics mantem consistencia com Pipeline.
- [ ] Exportacoes e relatorios permanecem validos.
- [ ] Testes automatizados novos e existentes verdes.

## 7. Definicao de pronto por fase

1. Pronto Fase 1: schema + API + testes + flag.
2. Pronto Fase 2: UX Pipeline validada + regressao de tela.
3. Pronto Fase 3: metricas consistentes + integracoes internas validadas.
4. Pronto Fase 4: rollout gradual concluido + runbook publicado.

## 8. Riscos e mitigacoes

1. Risco: divergencia de metricas apos mudar criterio de ativo.
   Mitigacao:
   - comparativo paralelo por periodo;
   - validacao com dataset fechado.
2. Risco: quebra em tenants legados.
   Mitigacao:
   - feature flag;
   - fallback por contrato anterior.
3. Risco: uso incorreto de exclusao definitiva.
   Mitigacao:
   - permissao restrita;
   - dupla confirmacao;
   - auditoria obrigatoria.

## 9. Ordem executiva recomendada (resumo)

1. Fase 0 -> alinhamento.
2. Fase 1 -> backend base.
3. Fase 2 -> Pipeline UX.
4. Fase 3 -> Dashboard/Analytics/Integracoes.
5. Fase 4 -> rollout assistido.

Sem concluir o gate atual, nao avancar para o proximo.

## 10. Status executivo da execucao (2026-03-06)

1. Status formal dos gates:
   - ainda pendente (checklists de fase nao encerrados oficialmente).
2. Avancos tecnicos consolidados:
   - Sprint 5 (OPP-305) com implementacao e validacao automatizada registradas;
   - Sprint 4 com runbook, smoke operacional e monitoramento 48h automatizado publicados para pre-piloto;
   - validacao tecnica autenticada local reforcada em 2026-03-06 (OPP-304 smoke/monitor PASS e OPP-305 smoke PASS sem `401`);
   - janela de monitoramento OPP-304 de 48h iniciada em background no ambiente local.
3. Pendencias para fechamento do plano:
   - executar piloto real por tenant em homolog/producao com autenticacao valida;
   - concluir janela oficial de 48h em tenant piloto e registrar GO/NO-GO;
   - executar QA manual stale em homolog;
   - concluir aprovacoes funcionais/operacionais dos gates.
4. Referencias de status:
   - `docs/features/OPP_CICLO_VIDA_SPRINT4_2026-03.md`
   - `docs/features/OPP_CICLO_VIDA_SPRINT5_2026-03.md`
   - `docs/features/OPP304_CHECKLIST_PILOTO_48H_CICLO_VIDA_2026-03.md`
   - `docs/features/OPP305_CHECKLIST_QA_PIPELINE_STALE_2026-03.md`
   - `docs/features/evidencias/OPP304_SCHEMA_REFRESH_20260306-101311.md`
   - `docs/features/CHECKLIST_SIGNOFF_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
   - `docs/features/ORDEM_EXECUCAO_GO_LIVE_48H_CICLO_VIDA_OPORTUNIDADES_2026-03.md`

## 11. Checklist executavel de conclusao (2026-03-06)

### 11.1 Gate 4 - Piloto OPP-304 (lifecycle)

- [x] Runbook de rollout assistido publicado.
  - Evidencia: `docs/features/OPP304_ROLLOUT_RUNBOOK_CICLO_VIDA_2026-03.md`
- [x] Smoke lifecycle autenticado local com transicoes concluido em PASS.
  - Evidencia: `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-100852.md`
- [x] Monitor quick autenticado sem falhas concluido em PASS.
  - Evidencia: `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-101435.md`
- [x] Janela de 48h iniciada em background (ambiente local).
  - Evidencia: `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_START_20260306-110421.md`
- [ ] Definir tenant piloto em homolog/producao e canal de incidente.
- [ ] Ativar flag `crm_oportunidades_lifecycle_v1` no tenant piloto.
- [ ] Executar janela real de monitoramento por 48h com autenticacao valida.
- [ ] Preencher GO/NO-GO e anexar evidencias finais no checklist OPP-304.

### 11.2 OPP-305 - Ativacao controlada stale

- [x] Backend e frontend de stale deals concluidos.
  - Evidencia: `docs/features/OPP_CICLO_VIDA_SPRINT5_2026-03.md`
- [x] Validacao automatizada consolidada concluida em PASS.
  - Evidencia: `docs/features/evidencias/OPP305_RELATORIO_QA_STALE_20260306-100919.md`
- [x] Politica e roteiro de ativacao controlada publicados.
  - Evidencias:
    - `docs/features/OPP305_POLITICA_STALE_DEALS_2026-03.md`
    - `docs/features/OPP305_ROTEIRO_ATIVACAO_CONTROLADA_STALE_2026-03.md`
- [x] Executar smoke OPP-305 autenticado em ambiente local sem `401`.
  - Evidencia: `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110229.md`
- [ ] Executar smoke OPP-305 autenticado em homolog/producao sem `401`.
- [ ] Executar QA manual do Pipeline stale em homolog.
- [ ] Rodar fases 1 e 2 do roteiro por tenant piloto e registrar decisao GO/NO-GO.

### 11.3 Encerramento formal do plano

- [ ] Consolidar sign-off em `docs/features/CHECKLIST_SIGNOFF_CICLO_VIDA_OPORTUNIDADES_2026-03.md`.
- [ ] Registrar decisao final de operacao:
  - GO tecnico (`SIM`/`NAO`)
  - GO negocio (`SIM`/`NAO`)
- [ ] Atualizar esta secao de status com a data de encerramento formal dos gates.

## 12. Ordem de execucao para fechamento imediato

1. Executar a ordem oficial:
   - `docs/features/ORDEM_EXECUCAO_GO_LIVE_48H_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Publicar evidencias em:
   - `docs/features/evidencias/`
3. Atualizar checklist de sign-off:
   - `docs/features/CHECKLIST_SIGNOFF_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
4. Revalidar o status do plano neste documento (secao 10).
