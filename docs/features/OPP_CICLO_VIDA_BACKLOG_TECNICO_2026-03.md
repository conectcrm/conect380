# OPP - Backlog tecnico ciclo de vida de oportunidades (2026-03)

## 1. Objetivo

Quebrar o plano de ciclo de vida de oportunidades em itens tecnicos executaveis com IDs rastreaveis e sequenciamento obrigatorio.

Referencia principal:

1. `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`

## 2. Epics e stories

## EPIC OPP-01 - Governanca e contrato funcional

### OPP-001 - Matriz de lifecycle e transicoes aprovadas

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Matriz oficial de estados `open/won/lost/archived/deleted`.
  - Matriz de transicoes permitidas por perfil.
  - Documento de politica operacional aprovado por Produto e Operacoes.
- Criterios de aceite:
  - Regras publicadas e aprovadas.
  - Sem ambiguidades de transicao.

### OPP-002 - Feature flag por tenant e estrategia de rollout

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Feature flag de lifecycle por tenant.
  - Estrategia de ativacao gradual e rollback.
- Criterios de aceite:
  - Tenant piloto habilita/desabilita sem redeploy.
  - Rollback documentado e testado.

## EPIC OPP-02 - Backend lifecycle e seguranca de dados

### OPP-101 - Migration de lifecycle e backfill

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - Novos campos em `oportunidades` para lifecycle e auditoria.
  - Indices para consultas de pipeline e dashboard.
  - Script de backfill para registros legados.
- Criterios de aceite:
  - Migration aplicavel sem downtime.
  - Backfill validado em homologacao.

### OPP-102 - Soft delete restore e hard delete controlado

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - `DELETE /oportunidades/:id` com soft delete.
  - `POST /oportunidades/:id/restaurar`.
  - `DELETE /oportunidades/:id/permanente` com permissao restrita.
- Criterios de aceite:
  - Oportunidade removida do fluxo padrao sem perda imediata de historico.
  - Restauracao funcional dentro da janela definida.

### OPP-103 - Reabertura de oportunidade fechada com auditoria

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Endpoint de reabertura de `won/lost`.
  - Registro de autor motivo e timestamp na auditoria.
- Criterios de aceite:
  - Reabertura respeita permissao.
  - Historico de estagio e lifecycle permanece consistente.

### OPP-104 - Listagem pipeline e metricas lifecycle-aware

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Ajuste de `findAll` `getPipelineData` `getMetricas`.
  - Filtros por lifecycle com default operacional seguro.
- Criterios de aceite:
  - APIs retornam apenas registros esperados por visao.
  - Sem regressao dos contratos atuais para tenant legado.

### OPP-105 - Testes backend de regressao do lifecycle

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Testes unitarios de regras.
  - Testes de integracao e e2e de soft delete restore reabrir.
- Criterios de aceite:
  - Pipeline de testes verde.
  - Cenarios criticos cobertos.

## EPIC OPP-03 - Pipeline e UX operacional

### OPP-201 - Filtros e visoes por lifecycle no Pipeline

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Filtros rapidos `abertas fechadas arquivadas lixeira`.
  - Consistencia de contadores e chips.
- Criterios de aceite:
  - Pipeline operacional mostra abertas por padrao.
  - Usuario alterna visoes sem inconsistencias.

### OPP-202 - Acoes de lifecycle em card e modais

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - Acoes: ganhar perder reabrir arquivar restaurar excluir.
  - Confirmacoes e mensagens de erro claras.
- Criterios de aceite:
  - Acoes refletem imediatamente na UI.
  - Erros de permissao e transicao sao acionaveis.

### OPP-203 - Contratos frontend de tipos e services

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Atualizacao de `types/oportunidades`.
  - Atualizacao de `oportunidadesService` para novos endpoints.
  - Testes de contrato dos services.
- Criterios de aceite:
  - Sem quebra de tipagem em build.
  - Chamadas API aderentes ao novo contrato.

### OPP-204 - QA funcional do Pipeline sem regressao

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Roteiro de QA ponta a ponta do novo fluxo.
  - Validacao de regressao nas visoes existentes.
- Criterios de aceite:
  - Roteiro executado com evidencias.
  - Sem bloqueadores abertos.

## EPIC OPP-04 - Dashboard Analytics integracoes e rollout

### OPP-301 - Dashboard V2 alinhado ao lifecycle

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - Ajuste das consultas de `oportunidades_ativas`.
  - Ajuste de funil e pipeline summary para novo modelo.
- Criterios de aceite:
  - Numeros do Dashboard V2 consistentes com Pipeline.
  - Sem divergencia critica em homologacao.

### OPP-302 - Analytics comercial lifecycle-aware

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Ajuste de queries de previsao e metricas por status.
  - Validacao com dataset comparativo antes/depois.
- Criterios de aceite:
  - Relatorio de consistencia aprovado.
  - Sem quebra dos endpoints analiticos.

### OPP-303 - Compatibilidade de Leads e Propostas

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Conversao de lead criando oportunidade `open`.
  - Fluxos legados de proposta compativeis com lifecycle.
- Criterios de aceite:
  - Conversao e vinculacao seguem operantes.
  - Sem regressao nos fluxos existentes.

### OPP-304 - Rollout assistido e runbook operacional

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Piloto controlado com monitoramento por tenant.
  - Runbook de suporte e plano de rollback.
- Criterios de aceite:
  - Piloto 48h sem incidente critico.
  - Go live aprovado formalmente.

### OPP-305 - Regra de stale deals e automacao opcional

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Marcacao de oportunidades paradas por inatividade.
  - Opcional de arquivamento automatico por politica.
- Criterios de aceite:
  - Regras configuraveis por tenant.
  - Operacao consegue auditar itens auto-arquivados.

## 3. Sub-tarefas tecnicas por story

## OPP-001

- OPP-001-T1: Consolidar matriz de estado e transicao em documento canonico.
- OPP-001-T2: Aprovar permissao por papel e fluxo de excepcao.

## OPP-002

- OPP-002-T1: Implementar feature flag por tenant no backend.
- OPP-002-T2: Expor leitura da flag para frontend e observabilidade.

## OPP-101

- OPP-101-T1: Criar migration de colunas e indices de lifecycle.
- OPP-101-T2: Criar script de backfill e validacao de volume.

## OPP-102

- OPP-102-T1: Implementar soft delete restore e hard delete nos services/controllers.
- OPP-102-T2: Aplicar permissao restrita e auditoria obrigatoria nas acoes.

## OPP-103

- OPP-103-T1: Implementar endpoint de reabertura com validacoes.
- OPP-103-T2: Registrar evento de reabertura no historico e testes.

## OPP-104

- OPP-104-T1: Ajustar listagem pipeline metricas para lifecycle.
- OPP-104-T2: Garantir compatibilidade com tenants legados.

## OPP-105

- OPP-105-T1: Criar testes unitarios de regra de lifecycle.
- OPP-105-T2: Criar testes e2e de fluxo completo de ciclo de vida.

## OPP-201

- OPP-201-T1: Implementar filtros rapidos por lifecycle no Pipeline.
- OPP-201-T2: Ajustar contadores chips e estados visuais por visao.

## OPP-202

- OPP-202-T1: Implementar acoes lifecycle em cards e modal de detalhes.
- OPP-202-T2: Padronizar confirmacoes mensagens de erro e bloqueios de permissao.

## OPP-203

- OPP-203-T1: Atualizar tipos e adaptadores de oportunidade no frontend.
- OPP-203-T2: Atualizar service e testes de contrato de API.

## OPP-204

- OPP-204-T1: Executar roteiro de QA funcional com evidencias.
- OPP-204-T2: Corrigir regressao encontrada e revalidar.

## OPP-301

- OPP-301-T1: Ajustar agregacoes e snapshots do Dashboard V2.
- OPP-301-T2: Validar consistencia com dados do Pipeline operacional.

## OPP-302

- OPP-302-T1: Ajustar queries de analytics para lifecycle.
- OPP-302-T2: Rodar comparativo com massa de validacao e aprovar resultado.

## OPP-303

- OPP-303-T1: Ajustar fluxo de conversao de lead para lifecycle `open`.
- OPP-303-T2: Ajustar fluxo legado de propostas e testes de regressao.

## OPP-304

- OPP-304-T1: Executar piloto por tenant com monitoramento 48h.
- OPP-304-T2: Publicar runbook de suporte e plano de rollback.

## OPP-305

- OPP-305-T1: Implementar criterio de oportunidade parada.
- OPP-305-T2: Implementar politica opcional de arquivamento automatico.

## 4. Sequenciamento obrigatorio

1. OPP-001 -> OPP-002
2. OPP-101 -> OPP-102 -> OPP-103 -> OPP-104 -> OPP-105
3. OPP-201 -> OPP-202 -> OPP-203 -> OPP-204
4. OPP-301 -> OPP-302 -> OPP-303 -> OPP-304
5. OPP-305 apenas apos estabilizacao de go live

Regra:

1. Nao iniciar bloco seguinte sem aceite formal do bloco atual.
