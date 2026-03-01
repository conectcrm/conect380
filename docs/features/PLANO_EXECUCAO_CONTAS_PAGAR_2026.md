# Plano de Execucao - Contas a Pagar (2026)

## 1. Objetivo

Entregar um fluxo funcional de contas a pagar ponta a ponta no Conect360, cobrindo:

1. Cadastro e gestao de obrigacoes.
2. Pagamento com rastreabilidade.
3. Workflow de aprovacao financeira.
4. Conciliacao bancaria.
5. Integracao com compras internas (cotacao -> pedido -> conta a pagar).

## 2. Escopo

### Em escopo

1. Modulo financeiro (`backend/src/modules/financeiro` e telas em `frontend-web/src/pages/gestao/financeiro`).
2. Integracao com cotacao/pedido (`backend/src/cotacao` e `frontend-web/src/components/modals/ModalDetalhesCotacao.tsx`).
3. Controle de permissao por papel (financeiro/comercial/admin).
4. Trilhas de auditoria minima e testes automatizados.

### Fora de escopo (neste ciclo)

1. Motor fiscal completo (retencoes complexas e apuracao tributaria completa).
2. ERP contabil externo em tempo real (sera via exportacao/importacao no primeiro momento).
3. Multi-banco com failover automatico.

## 3. Estado atual (baseline)

1. Ja existe API de contas a pagar:
   - `GET /contas-pagar`
   - `GET /contas-pagar/resumo`
   - `POST /contas-pagar`
   - `PUT /contas-pagar/:id`
   - `POST /contas-pagar/:id/registrar-pagamento`
2. Ja existe API de fornecedores:
   - `GET /fornecedores`
   - `GET /fornecedores/ativos`
   - `POST /fornecedores`
   - `PATCH /fornecedores/:id/desativar`
3. Ja existe fluxo de compras internas:
   - `POST /cotacao/:id/converter-pedido`
   - `POST /cotacao/:id/gerar-conta-pagar`
4. Gap importante:
   - Entidades de conta bancaria ainda vazias:
     - `backend/src/modules/financeiro/entities/conta-bancaria.entity.ts`
     - `backend/src/modules/financeiro/entities/pagamento-conta.entity.ts`
   - UI ainda usa `contasBancariasMock` no modal de conta a pagar.
5. Rota de conciliacao existe, mas tela ainda esta em `ModuleUnderConstruction`.

## 4. Macro cronograma (4 sprints / 8 semanas)

1. Sprint 1 (semanas 1-2): Base bancaria real + fim de mock.
2. Sprint 2 (semanas 3-4): Workflow de aprovacao financeira.
3. Sprint 3 (semanas 5-6): Conciliacao bancaria operacional.
4. Sprint 4 (semanas 7-8): Integracao externa + fechamento contabil.

## 5. Backlog por epic (formato pronto para Jira/Azure Boards)

## EPIC AP-01 - Base financeira operacional (Sprint 1)

### AP-001 - Modelar contas bancarias no backend

- Tipo: Story
- Estimativa: 5 pontos
- Objetivo: criar entidade e CRUD de contas bancarias por empresa.
- Backend:
  - Implementar entity `ContaBancaria` com `empresa_id`, status, saldo, tipo conta.
  - Criar migration e indices.
  - Criar controller/service com guardas de permissao.
- Frontend:
  - Nao aplicavel.
- Criterios de aceite:
  - CRUD funcionando em ambiente local.
  - Isolamento por empresa validado.
  - Cobertura minima de testes de service/controller.

### AP-002 - Substituir mock de conta bancaria no modal de conta a pagar

- Tipo: Story
- Estimativa: 3 pontos
- Objetivo: trocar `contasBancariasMock` por dados reais da API.
- Backend:
  - Expor endpoint listagem de contas bancarias ativas.
- Frontend:
  - Atualizar `ModalContaPagarNovo.tsx` para consumir API.
  - Tratar estado loading/erro sem bloquear criacao manual quando permitido.
- Criterios de aceite:
  - Nao existe lista mock em producao.
  - Usuario seleciona conta bancaria real no cadastro e no pagamento.

### AP-003 - Validacao de conta bancaria no fluxo de pagamento

- Tipo: Story
- Estimativa: 5 pontos
- Objetivo: garantir consistencia de `contaBancariaId` no registro de pagamento.
- Backend:
  - Validar se conta bancaria pertence a empresa.
  - Bloquear registro com conta inativa/inexistente.
  - Registrar erro de validacao claro.
- Frontend:
  - Exibir mensagem amigavel de erro da API.
- Criterios de aceite:
  - Pagamento com conta invalida retorna 400.
  - Pagamento com conta valida conclui normalmente.

### AP-004 - Hardening de testes do modulo financeiro

- Tipo: Story
- Estimativa: 3 pontos
- Objetivo: fechar cobertura minima para nao regredir no rollout.
- Backend:
  - Testes para create/update/payment com conta bancaria real.
  - Testes de permissao por papel.
- Frontend:
  - Testes de contrato dos services (`contasPagarService`).
- Criterios de aceite:
  - Pipeline verde com novos casos.
  - Cenarios criticos cobertos.

## EPIC AP-02 - Workflow de aprovacao financeira (Sprint 2)

### AP-101 - Habilitar estados de aprovacao em contas a pagar

- Tipo: Story
- Estimativa: 5 pontos
- Objetivo: ativar o uso real de `necessitaAprovacao`, `aprovadoPor`, `dataAprovacao`.
- Backend:
  - Endpoints: `POST /contas-pagar/:id/aprovar` e `POST /contas-pagar/:id/reprovar`.
  - Regras de transicao de status.
- Criterios de aceite:
  - Conta com aprovacao pendente nao pode ser paga.
  - Aprovacao registra usuario e timestamp.

### AP-102 - Regra de alcada por empresa

- Tipo: Story
- Estimativa: 8 pontos
- Objetivo: exigir aprovacao por valor configuravel.
- Backend:
  - Configurar thresholds por empresa.
  - Marcar automaticamente `necessitaAprovacao=true` conforme valor.
- Frontend:
  - Exibir badge "Aguardando aprovacao".
- Criterios de aceite:
  - Valores abaixo da alcada seguem fluxo direto.
  - Valores acima exigem aprovacao.

### AP-103 - Fila de aprovacoes financeiras

- Tipo: Story
- Estimativa: 5 pontos
- Objetivo: tela/lista para aprovadores decidirem em lote.
- Frontend:
  - Nova tela de pendencias financeiras.
- Backend:
  - Endpoint de listagem de pendencias por aprovador.
- Criterios de aceite:
  - Aprovador visualiza somente itens permitidos.
  - Aprovacao em lote operacional.

## EPIC AP-03 - Conciliacao bancaria (Sprint 3)

### AP-201 - Importacao de extrato (OFX/CSV)

- Tipo: Story
- Estimativa: 8 pontos
- Objetivo: receber extrato e persistir movimentos para conciliacao.
- Backend:
  - Parser OFX/CSV e normalizacao de lancamentos.
  - Entidades para extrato e itens importados.
- Frontend:
  - Upload com feedback de erros.
- Criterios de aceite:
  - Arquivos validos importam com resumo.
  - Arquivos invalidos retornam erro detalhado.

### AP-202 - Matching automatico e reconciliacao manual

- Tipo: Story
- Estimativa: 8 pontos
- Objetivo: conciliar pagamentos registrados com itens do extrato.
- Backend:
  - Motor simples de matching por valor/data/referencia.
- Frontend:
  - Tela para confirmar, desfazer e ajustar match.
- Criterios de aceite:
  - Taxa minima de matching automatico acordada com negocio.
  - Toda acao manual gera trilha de auditoria.

### AP-203 - Dashboard financeiro por perfil (modelo V2)

- Tipo: Story
- Estimativa: 3 pontos
- Objetivo: entregar dashboard do perfil financeiro no mesmo modelo V2 usado por gestor/administrador.
- Frontend:
  - Implementar dashboard financeiro com componentes base do V2 (`KpiTrendCard`, `GoalProgressCard`, `InsightsPanel`).
  - Exibir indicadores financeiros reais (faturamento, recebimento, atrasos, aprovacoes, posicao de caixa e conciliacao).
  - Retirar o dashboard legado de rota principal para o perfil financeiro.
- Criterios de aceite:
  - Perfil financeiro acessa dashboard no padrao V2.
  - Dashboard legado nao e mais utilizado na rota principal do financeiro.
  - Carregamento parcial de dados e mensagens de fallback operacionais.

## EPIC AP-04 - Integracao externa e fechamento contabil (Sprint 4)

### AP-301 - Integracao de pagamento externo (fase 1)

- Tipo: Story
- Estimativa: 8 pontos
- Objetivo: receber retorno de pagamento externo e atualizar conta.
- Backend:
  - Endpoint/webhook de retorno.
  - Idempotencia e validacao de assinatura.
- Criterios de aceite:
  - Retorno duplicado nao cria baixa duplicada.
  - Status da conta sincroniza corretamente.

### AP-302 - Exportacao contabil/fiscal

- Tipo: Story
- Estimativa: 5 pontos
- Objetivo: exportar movimentos para contabil/fiscal.
- Entregas:
  - Layout CSV/Excel padrao.
  - Filtro por periodo, centro de custo, status.
- Criterios de aceite:
  - Arquivos exportados validos para ingestao externa.

### AP-303 - Alertas operacionais

- Tipo: Story
- Estimativa: 3 pontos
- Objetivo: alertar vencimentos, falha de conciliacao e falha de integracao externa.
- Criterios de aceite:
  - Alertas visiveis no painel e logs de observabilidade.

## 6. Sprint 1 detalhada (tarefas tecnicas)

## Semana 1

1. Criar entidades e migration de conta bancaria.
2. Criar `ContaBancariaController` e `ContaBancariaService`.
3. Integrar modulo no `FinanceiroModule`.
4. Implementar endpoint `GET /contas-bancarias/ativas`.

## Semana 2

1. Substituir `contasBancariasMock` no modal.
2. Integrar listagem de contas bancarias no fluxo de pagamento.
3. Validar `contaBancariaId` no create e no `registrarPagamento`.
4. Adicionar testes:
   - service financeiro
   - controller financeiro
   - service frontend de contas a pagar
5. QA funcional com casos:
   - Criar conta sem conta bancaria
   - Criar conta com conta bancaria
   - Registrar pagamento valido/invalido

## 7. Dependencias e riscos

1. Dependencia de definicao de regras de alcada por negocio (Sprint 2).
2. Dependencia de formato de extrato aceito (OFX/CSV) para Sprint 3.
3. Risco de divergencia de dados legados em `contas_pagar`.
4. Risco de permissao cruzada comercial x financeiro no fluxo de cotacao.

## 8. Mitigacoes

1. Feature flag para aprovacao financeira e conciliacao.
2. Rollout progressivo por empresa.
3. Backfill controlado para dados legados.
4. Testes de regressao focados em:
   - cotacao -> pedido -> conta a pagar
   - pagamento parcial/integral
   - exclusao/desativacao de fornecedor com dependencia

## 9. KPIs de sucesso

1. % contas pagas com conta bancaria valida >= 95%.
2. Reducao de erros de pagamento manual >= 50%.
3. Tempo medio para baixa de conta reduzido em >= 30%.
4. Taxa de conciliacao automatica inicial >= 60% (meta incremental).

## 10. Definition of Done (DoD) por story

1. Codigo revisado e testado.
2. Testes automatizados passando.
3. Guardas/permissoes aplicadas.
4. Logs de auditoria para acoes criticas.
5. Documentacao tecnica atualizada.
6. Cenarios de erro e fallback validados.

## 11. Ordem recomendada de implementacao de codigo

1. Backend financeiro base.
2. Frontend contas a pagar.
3. Integracao cotacao/pedido.
4. Conciliacao.
5. Integracao externa e exportacao contabil.

## 12. Checklist de inicio imediato (proxima execucao)

1. Aprovar este plano com negocio (financeiro/comercial).
2. Abrir EPIC AP-01 com stories AP-001..AP-004.
3. Definir capacidade do time para Sprint 1 (pontos).
4. Iniciar AP-001 e AP-002 em paralelo.

## 13. Status de execucao (atualizado em 2026-02-28)

### EPIC AP-01 - Base financeira operacional

1. AP-001 - Modelar contas bancarias no backend: CONCLUIDO
   - CRUD de contas bancarias disponivel em `contas-bancarias`.
   - Endpoints de listagem, listagem de ativas, update, desativacao e exclusao operacionais.
   - Cobertura de permissoes em controller + cobertura de regras criticas no service.
2. AP-002 - Substituir mock de conta bancaria no modal de conta a pagar: CONCLUIDO
   - `ModalContaPagarNovo.tsx` integrado com API real.
   - Mensagem de orientacao exibida quando nao houver contas bancarias cadastradas.
   - Tela de cadastro de contas bancarias entregue em `/financeiro/contas-bancarias`.
3. AP-003 - Validacao de conta bancaria no fluxo de pagamento: CONCLUIDO
   - Validacao no backend para create/update/registrar pagamento por `empresaId` e `ativo=true`.
   - Cobertura de testes para cenario valido e invalido (retorno 400 em conta invalida).
4. AP-004 - Hardening de testes do modulo financeiro: CONCLUIDO (escopo Sprint 1)
   - Backend: testes unitarios para `ContaPagarService` e `ContaBancariaService`.
   - Frontend: testes de contrato para `contasPagarService`.

### Pendencia operacional de Sprint 1

1. Encerrada em 2026-02-28 via execucao assistida + autoaprovacao formal no modelo de responsavel unico.
   - Evidencia: `docs/features/RELATORIO_QA_CONTAS_PAGAR_SPRINT1_2026-03.md`.

### EPIC AP-02 - Workflow de aprovacao financeira

1. AP-101 - Habilitar estados de aprovacao em contas a pagar: CONCLUIDO
   - Endpoints adicionados:
     - `POST /contas-pagar/:id/aprovar`
     - `POST /contas-pagar/:id/reprovar`
   - Regra aplicada: conta com `necessitaAprovacao=true` e sem `dataAprovacao` nao pode registrar pagamento.
   - Auditoria aplicada: `aprovadoPor`, `dataAprovacao` e `atualizadoPor`.
   - Frontend atualizado com acoes de aprovar/reprovar e bloqueio visual/funcional de pagamento enquanto pendente.
2. AP-102 - Regra de alcada por empresa: CONCLUIDO
   - Campo de configuracao entregue em `empresa_configuracoes.alcada_aprovacao_financeira` (via `GET/PUT /empresas/config`).
   - Regra automatica aplicada no backend: contas com valor total igual/acima da alcada passam a exigir aprovacao.
   - Fluxo mantido para valores abaixo da alcada, sem obrigatoriedade de aprovacao.
   - Frontend atualizado para permitir cadastro da alcada na tela de configuracoes da empresa.
3. AP-103 - Fila de aprovacoes financeiras: CONCLUIDO
   - Endpoint de listagem das pendencias entregue:
     - `GET /contas-pagar/aprovacoes/pendentes`
   - Endpoint de decisao em lote entregue:
     - `POST /contas-pagar/aprovacoes/lote`
   - Frontend entregue em `/financeiro/aprovacoes` com aprovacao/reprovacao individual e em lote.
   - Cobertura de testes adicionada para service/controller e contrato do `contasPagarService`.

### EPIC AP-03 - Conciliacao bancaria

1. AP-201 - Importacao de extrato (OFX/CSV): CONCLUIDO
   - Backend entregue com parser de OFX/CSV, persistencia de importacoes e itens de extrato.
   - Endpoints entregues:
     - `POST /conciliacao-bancaria/importacoes`
     - `GET /conciliacao-bancaria/importacoes`
     - `GET /conciliacao-bancaria/importacoes/:id/itens`
   - Migration adicionada para tabelas:
     - `extratos_bancarios_importacoes`
     - `extratos_bancarios_itens`
   - Frontend entregue em `/financeiro/conciliacao` com upload, resumo de importacao, historico e visualizacao de lancamentos.
   - Testes adicionados:
     - Backend: service/controller da conciliacao bancaria.
     - Frontend: contrato de `conciliacaoBancariaService`.
     - E2E: cobertura de listagem/importacao em ambiente real de app para prevenir regressao de metadata TypeORM (`backend/test/financeiro/conciliacao-bancaria.e2e-spec.ts`, comando `npm run test:e2e:conciliacao-bancaria`).
2. AP-202 - Matching automatico e conciliacao manual: CONCLUIDO
   - Backend entregue com motor inicial de matching por valor/data/referencia:
     - `POST /conciliacao-bancaria/importacoes/:id/matching-automatico`
   - Backend entregue com reconciliacao manual operacional:
     - `GET /conciliacao-bancaria/itens/:id/candidatos`
     - `POST /conciliacao-bancaria/itens/:id/conciliar`
     - `POST /conciliacao-bancaria/itens/:id/desconciliar`
   - Trilha de auditoria de conciliacao adicionada em `extratos_bancarios_itens`:
     - `auditoria_conciliacao`, `data_conciliacao`, `conciliado_por`, `conciliacao_origem`, `motivo_conciliacao`.
   - Frontend atualizado em `/financeiro/conciliacao`:
     - acao de matching automatico;
     - conciliacao manual com candidatos e ajuste de vinculo;
     - desfazer conciliacao e visualizacao do vinculo conta extrato -> conta a pagar.
   - Testes adicionados/atualizados:
     - Backend: `conciliacao-bancaria.service.spec.ts` e `conciliacao-bancaria.controller.spec.ts`.
     - Frontend: `conciliacaoBancariaService.test.ts`.
3. AP-203 - Dashboard financeiro por perfil (modelo V2): CONCLUIDO
   - Dashboard do perfil financeiro migrado para o padrao V2, reutilizando componentes visuais e de insight.
   - Indicadores financeiros consolidados com dados reais de faturamento, contas a pagar, aprovacoes, contas bancarias e conciliacao.
   - Roteamento atualizado para remover o dashboard legado da rota principal do perfil financeiro.

### Proximo foco recomendado

1. Executar monitoramento pos-go-live de 48h para Sprint 1 (cadastro/pagamento/filtros/permissoes).
   - Status atual: preparado em 2026-02-28 com script de coleta e consolidacao (`scripts/monitor-pos-go-live-vendas-financeiro.ps1`) e guia operacional (`docs/features/MONITORAMENTO_POS_GO_LIVE_48H_VENDAS_FINANCEIRO_2026-03.md`).
2. Executar monitoramento pos-go-live de 48h para AP-301/AP304 (webhook, sincronizacao e fila de excecoes).
   - Status atual: preparado em 2026-02-28; pendente apenas execucao da janela real de 48h e publicacao do relatorio final.
3. Acompanhar backlog incremental AP-302/AP-303 conforme pauta aprovada.
4. Fechar fluxo Vendas -> Financeiro com registro final de operacao (GO tecnico e GO de negocio).

## 14. Checklist executavel (responsavel e data)

### 14.1 QA funcional ponta a ponta (Sprint 1 encerrado)

- [x] Publicar roteiro oficial de QA com cenarios obrigatorios (cadastro, pagamento valido/invalido, filtros e permissoes).
  - Responsavel sugerido: QA + Produto
  - Prazo: 2026-03-02
  - Evidencia de conclusao: roteiro versionado em docs + casos vinculados (`docs/features/ROTEIRO_QA_CONTAS_PAGAR_SPRINT1_2026-03.md`).
- [x] Executar bateria completa de testes manuais em homologacao.
  - Responsavel sugerido: QA
  - Prazo: 2026-03-03
  - Evidencia de conclusao: relatorio de execucao com aprovado/reprovado por cenario (`docs/features/RELATORIO_QA_CONTAS_PAGAR_SPRINT1_2026-03.md`).
  - Status atual: concluido em 2026-02-28 via execucao assistida + autoaprovacao formal do responsavel unico, com 11/11 cenarios em PASS.
- [x] Consolidar bugs, aplicar correcoes e revalidar cenarios criticos.
  - Responsavel sugerido: Backend + Frontend + QA
  - Prazo: 2026-03-05
  - Evidencia de conclusao: todos os bugs criticos/altos resolvidos e retestados.
  - Status atual: concluido em 2026-02-28 sem bugs criticos/altos pendentes no ciclo Sprint 1 (registro em `docs/features/RELATORIO_QA_CONTAS_PAGAR_SPRINT1_2026-03.md`).

### 14.2 AP-301 - Integracao de pagamento externo (fase 1)

- [x] Definir contrato tecnico do webhook (payload, assinatura, codigos de retorno e estrategia de retry).
  - Responsavel sugerido: Backend
  - Prazo: 2026-03-03
  - Evidencia de conclusao: especificacao publicada e revisada (`docs/features/AP301_CONTRATO_WEBHOOK_PAGAMENTOS_2026-03.md`).
- [x] Implementar endpoint/webhook com idempotencia e validacao de assinatura.
  - Responsavel sugerido: Backend
  - Prazo: 2026-03-06
  - Evidencia de conclusao: endpoint funcional + testes unitarios cobrindo retorno duplicado (`backend/src/modules/pagamentos/controllers/gateway-webhook.controller.ts`, `backend/src/modules/pagamentos/services/gateway-webhook.service.ts`, `backend/src/modules/pagamentos/services/gateway-webhook.service.spec.ts`).
- [x] Validar sincronizacao de status da conta e trilha de auditoria no fluxo completo.
  - Responsavel sugerido: Backend + QA
  - Prazo: 2026-03-09
  - Evidencia de conclusao: cenarios de homologacao aprovados com logs de auditoria.
  - Status atual: concluido em 2026-02-28 com homologacao assistida + regressao integrada (`RUN 20260228-133245`) e autoaprovacao formal por responsavel unico, com evidencias em `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260228-133245.md`, `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md` e `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`.

### 14.3 Planejamento AP-302 e AP-303

- [x] Levantar requisitos com financeiro/contabil para layout de exportacao e regras de alertas.
  - Responsavel sugerido: Produto + Financeiro
  - Prazo: 2026-03-04
  - Evidencia de conclusao: minuta de requisitos validada pelas areas.
  - Status atual: concluido em 2026-02-28 por autoaprovacao formal do responsavel unico com base na minuta e pauta registradas em `docs/features/AP302_AP303_MINUTA_REQUISITOS_2026-03.md` e `docs/features/PAUTA_APROVACAO_AP302_AP303_2026-03.md`.
- [x] Quebrar AP-302 e AP-303 em stories tecnicas com criterios de aceite e estimativa.
  - Responsavel sugerido: Produto + Tech Lead
  - Prazo: 2026-03-05
  - Evidencia de conclusao: backlog refinado (stories prontas para desenvolvimento).
  - Status atual: concluido tecnicamente e aprovado em 2026-02-28 no modelo de responsavel unico (backlog tecnico refinado e publicado em `docs/features/AP302_AP303_BACKLOG_TECNICO_2026-03.md`; AP302-01 a AP302-05 e AP303-01 a AP303-05 implementados e cobertos por testes; regressao automatizada confirmada com backend `14/14 PASS`, e2e financeiro `5/5 PASS` e frontend `17/17 PASS`).
- [x] Aprovar sequenciamento no planejamento da proxima sprint.
  - Responsavel sugerido: Produto + Tech Lead + Financeiro
  - Prazo: 2026-03-06
  - Evidencia de conclusao: sprint planejada com capacidade e ordem de execucao definidas.
  - Status atual: concluido em 2026-02-28 com decisoes D1..D5 registradas em `docs/features/PAUTA_APROVACAO_AP302_AP303_2026-03.md` (modelo de responsavel unico).

### 14.4 Fechamento do fluxo Vendas -> Financeiro (cross-modulo)

- [x] Publicar roteiro integrado de QA para fluxo Vendas -> Financeiro.
  - Responsavel sugerido: QA + Produto + Tech Lead
  - Prazo: 2026-03-02
  - Evidencia de conclusao: roteiro versionado com cenarios de contrato/faturamento/webhook/financeiro (`docs/features/ROTEIRO_QA_FLUXO_VENDAS_FINANCEIRO_2026-03.md`).
  - Status atual: concluido em 2026-02-28 com roteiro publicado e referenciado no plano.
- [x] Publicar script de regressao automatizada do fluxo integrado.
  - Responsavel sugerido: Backend + Frontend
  - Prazo: 2026-03-02
  - Evidencia de conclusao: script executavel para rodar suites criticas e gerar relatorio (`scripts/test-fluxo-vendas-financeiro-regressao.ps1`).
  - Status atual: concluido em 2026-02-28 com execucao completa registrada (`docs/features/RELATORIO_REGRESSAO_FLUXO_VENDAS_FINANCEIRO_COMPLETO_2026-02-28.md`, 6/6 PASS).
- [x] Publicar checklist de sign-off para fechamento formal QA/Produto/Financeiro.
  - Responsavel sugerido: Tech Lead + QA
  - Prazo: 2026-03-02
  - Evidencia de conclusao: checklist versionado com criterios de GO/NO-GO e evidencias obrigatorias (`docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`).
  - Status atual: concluido em 2026-02-28 com checklist publicado.
- [x] Executar rodada de homologacao integrada em ambiente sandbox/real e anexar evidencias.
  - Responsavel sugerido: QA + Backend
  - Prazo: 2026-03-06
  - Evidencia de conclusao: relatorio consolidado com PASS/FAIL por cenario e anexos de log/SQL.
  - Status atual: concluido em 2026-02-28 com `HOMO-001` PASS + `HOMO-002` PASS (`RUN 20260228-133245`) e autoaprovacao formal do responsavel unico; evidencias em `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`, `docs/features/evidencias/REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`, `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260228-133245.md`, `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md` e `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`.
- [x] Consolidar backlog de melhorias finais do fluxo integrado (cancelamento/estorno, sincronizacao bidirecional de status e governanca operacional).
  - Responsavel sugerido: Produto + Tech Lead + Financeiro
  - Prazo: 2026-03-07
  - Evidencia de conclusao: stories priorizadas para sprint seguinte e criterios de aceite aprovados.
  - Status atual: concluido em 2026-02-28 com backlog AP304 consolidado, execucao tecnica registrada e autoaprovacao formal por responsavel unico; evidencias em `docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md`, `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md` e `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`.

### 14.5 Monitoramento pos-go-live (48h)

- [x] Publicar guia operacional e automacao da janela de monitoramento.
  - Responsavel sugerido: Backend + Tech Lead
  - Prazo: 2026-03-01
  - Evidencia de conclusao: script e guia publicados (`scripts/monitor-pos-go-live-vendas-financeiro.ps1`, `docs/features/MONITORAMENTO_POS_GO_LIVE_48H_VENDAS_FINANCEIRO_2026-03.md`).
  - Status atual: concluido em 2026-02-28.
- [ ] Executar janela real de monitoramento por 48h apos go-live.
  - Responsavel sugerido: Operacoes + Tech Lead
  - Prazo: primeiro ciclo apos publicacao em producao
  - Evidencia de conclusao: relatorio de monitoramento gerado em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_<runId>.md`.
  - Status atual: dry-run tecnico concluido em 2026-02-28 (`RunId 20260228-144233`) com evidencias em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.md` e `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.csv`; aguardando execucao da janela real de 48h em ambiente de go-live.
- [ ] Registrar decisao final de operacao (GO tecnico/negocio) apos janela de 48h.
  - Responsavel sugerido: Responsavel unico do projeto
  - Prazo: D+2 do go-live monitorado
  - Evidencia de conclusao: atualizacao do checklist de sign-off com data e resultado final.
  - Status atual: preparado para fechamento apos janela real de 48h.

## 15. Referencia canonica de padroes de tela/modal (Layout V2)

- Os requisitos oficiais de largura de tela, responsividade e padrao de modais foram consolidados em:
  - `docs/features/ARQUITETURA_PADRONIZACAO_TELAS.md`
- Checklist de validacao visual/QA:
  - `docs/features/CHECKLIST_PADRONIZACAO_TELAS.md`
