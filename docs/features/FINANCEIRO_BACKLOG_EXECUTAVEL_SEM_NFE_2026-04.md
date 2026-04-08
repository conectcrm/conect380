# Financeiro - Backlog Executavel Sem NFe (2026-04)

## 1. Objetivo

Fechar o modulo Financeiro em fluxo operacional completo sem incluir emissao fiscal oficial (NFe/NFSe), com foco em:

1. Contas a receber.
2. Fluxo de caixa.
3. Tesouraria operacional.
4. Hardening de permissao, auditoria e regressao.

## 2. Premissas de escopo

1. NFe/NFSe permanece fora do escopo desta execucao.
2. `fiscalDocumentsEnabled` permanece `false` em frontend e backend.
3. O fluxo alvo e operacional diario sem dependencia de modulo fiscal oficial.

Referencias:

1. Plano sem NFe: `docs/features/FINANCEIRO_SEM_NFE_PLANO_REMOCAO_2026-04.md`
2. Rotas entregues no frontend:
   - `frontend-web/src/App.tsx` (`/financeiro/contas-receber`)
   - `frontend-web/src/App.tsx` (`/financeiro/fluxo-caixa`)
   - `frontend-web/src/App.tsx` (`/financeiro/tesouraria`)
3. Escopo atual do backend financeiro: `backend/src/modules/financeiro/financeiro.module.ts`

## 3. Baseline tecnico atual

### Ja entregue (base pronta)

1. Faturamento, pagamentos, links de cobranca e estorno.
2. Contas a pagar.
3. Fornecedores.
4. Contas bancarias.
5. Centro de custos.
6. Conciliacao bancaria.
7. Alertas operacionais financeiros.

### Gaps para fechamento do fluxo completo

1. Monitoramento assistido de 48h pos-GO.

### Status de execucao em 2026-04-07

Stories concluida(s):

- FIN-411
- FIN-412
- FIN-413
- FIN-414
- FIN-415 (unitarios/contratos executados)
- FIN-421
- FIN-422
- FIN-423
- FIN-424
- FIN-425 (unitarios/contratos executados)
- FIN-431
- FIN-432
- FIN-433
- FIN-434
- FIN-435 (unitarios/contratos executados)
- FIN-441 (matriz de permissao validada em E2E)
- FIN-442 (regressao integrada Vendas -> Financeiro + preflight core/full)
- FIN-443 (runbook operacional sem NFe)
- FIN-444 (checklist final de liberacao e evidencia GO/NO-GO)

Stories pendentes para fechamento final:

- Nenhuma story pendente no escopo sem NFe.

## 4. Macro cronograma (5 a 6 semanas)

1. Sprint 1: FIN-410 (Contas a Receber).
2. Sprint 2: FIN-420 (Fluxo de Caixa).
3. Sprint 3: FIN-430 (Tesouraria).
4. Sprint 4: FIN-440 (Hardening + Go-live).

## 5. Backlog por epic

## EPIC FIN-410 - Contas a Receber (Sprint 1)

### FIN-411 - Contrato de API de recebiveis

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Criar modulo `contas-receber` (controller/service/dto/entity ou view-model) com escopo por `empresa_id`.
  - Endpoints minimos:
    - `GET /contas-receber` (filtros por status, cliente, vencimento, faixa de valor).
    - `GET /contas-receber/resumo` (aberto, recebido, vencido, aging basico).
  - Normalizar status operacional (`pendente`, `parcial`, `recebida`, `vencida`, `cancelada`).
- Criterios de aceite:
  - Listagem e resumo funcionam sem dependencia de emissao fiscal.
  - Isolamento multi-tenant validado.

### FIN-412 - Tela operacional de contas a receber

- Tipo: Story
- Estimativa: 5 pontos
- Frontend:
  - Substituir `ModuleUnderConstruction` de `/financeiro/contas-receber`.
  - Entregar grid com filtros, ordenacao, cards de resumo e acao de abrir detalhe.
  - Integrar com service dedicado (`frontend-web/src/services`).
- Criterios de aceite:
  - Time financeiro consegue navegar e filtrar recebiveis sem fallback manual.
  - Experiencia responsiva desktop/mobile (comportamento minimo).

### FIN-413 - Acoes operacionais de recebimento e cobranca

- Tipo: Story
- Estimativa: 8 pontos
- Backend/Frontend:
  - Acao de registrar recebimento parcial/integral com trilha de auditoria.
  - Acao de reenviar cobranca (email/link) para titulos elegiveis.
  - Regras de bloqueio para titulos cancelados/ja quitados.
- Criterios de aceite:
  - Recebimento atualiza status e saldo remanescente corretamente.
  - Reenvio de cobranca nao gera duplicidade indevida de baixa.

### FIN-414 - Aging e inadimplencia operacional

- Tipo: Story
- Estimativa: 3 pontos
- Backend/Frontend:
  - Entregar buckets de aging (a vencer, 1-30, 31-60, 61+).
  - Exibir indicadores de inadimplencia e ordenar por risco.
- Criterios de aceite:
  - Aging consistente entre resumo e grid.
  - Indicadores atualizam com os mesmos filtros aplicados.

### FIN-415 - Testes e regressao da sprint 1

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - Unitarios service/controller de contas a receber.
  - E2E dedicado do fluxo basico de recebimento.
- Frontend:
  - Testes de contrato do service + estado principal da tela.
- Criterios de aceite:
  - Pipeline da sprint verde.
  - Sem regressao dos fluxos de faturamento e pagamentos existentes.

## EPIC FIN-420 - Fluxo de Caixa (Sprint 2)

### FIN-421 - Motor de consolidacao de caixa

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Consolidar entradas (faturas/pagamentos/recebiveis) e saidas (contas a pagar) por periodo.
  - Endpoint `GET /financeiro/fluxo-caixa/resumo` com realizado por dia/semana/mes.
- Criterios de aceite:
  - Totais batem com bases de faturamento e contas a pagar.
  - Filtro temporal consistente.

### FIN-422 - Projecao de caixa (previsto x realizado)

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Endpoint de projecao (`GET /financeiro/fluxo-caixa/projecao`) para janela futura.
  - Regras de previsao com base em vencimentos pendentes.
- Criterios de aceite:
  - Projecao reproduzivel com os mesmos parametros.
  - Diferencas entre previsto e realizado destacadas na resposta.

### FIN-423 - Tela de fluxo de caixa

- Tipo: Story
- Estimativa: 5 pontos
- Frontend:
  - Substituir `ModuleUnderConstruction` de `/financeiro/fluxo-caixa`.
  - Cards de saldo inicial/final, entradas, saidas, previsto vs realizado.
  - Tabela temporal com drilldown minimo.
- Criterios de aceite:
  - Usuario financeiro enxerga posicao de caixa atual e tendencia.
  - Filtros de periodo sincronizam cards e tabela.

### FIN-424 - Alertas de saldo critico

- Tipo: Story
- Estimativa: 3 pontos
- Backend/Frontend:
  - Definir threshold por empresa e sinalizar risco de caixa.
  - Integrar com painel de alertas operacionais financeiros.
- Criterios de aceite:
  - Alertas aparecem com severidade adequada.
  - Reprocessamento de alerta segue trilha operacional existente.

### FIN-425 - Testes e regressao da sprint 2

- Tipo: Story
- Estimativa: 3 pontos
- Criterios de aceite:
  - Unitarios + contratos + e2e de fluxo de caixa executados.
  - Sem regressao em contas a receber e contas a pagar.

## EPIC FIN-430 - Tesouraria operacional (Sprint 3)

### FIN-431 - Posicao por conta bancaria

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - Endpoint `GET /tesouraria/posicao` com saldo por conta, banco e consolidado.
  - Estrategia de consistencia com conciliacao bancaria.
- Criterios de aceite:
  - Saldos por conta e total consolidado consistentes.
  - Dados isolados por empresa.

### FIN-432 - Movimentacoes internas e transferencias

- Tipo: Story
- Estimativa: 8 pontos
- Backend/Frontend:
  - Registrar transferencia entre contas internas.
  - Validar saldo suficiente, idempotencia e auditoria.
- Criterios de aceite:
  - Transferencia altera origem/destino com rastreabilidade unica.
  - Operacao invalida retorna erro acionavel sem efeito colateral.

### FIN-433 - Tela de tesouraria

- Tipo: Story
- Estimativa: 5 pontos
- Frontend:
  - Substituir `ModuleUnderConstruction` de `/financeiro/tesouraria`.
  - Exibir saldos, extrato interno e transferencias recentes.
- Criterios de aceite:
  - Operador executa transferencia sem uso de planilha externa.
  - Feedback de sucesso/erro e estado de processamento.

### FIN-434 - Auditoria e trilha operacional de tesouraria

- Tipo: Story
- Estimativa: 3 pontos
- Backend:
  - Registrar eventos de criacao/aprovacao/cancelamento de movimentacao.
  - Correlation id para rastreio ponta a ponta.
- Criterios de aceite:
  - Toda movimentacao critica auditavel por empresa e usuario.

### FIN-435 - Testes e regressao da sprint 3

- Tipo: Story
- Estimativa: 3 pontos
- Criterios de aceite:
  - Suite de tesouraria verde.
  - Sem regressao de conciliacao, contas bancarias e alertas.

## EPIC FIN-440 - Hardening e Go-live (Sprint 4)

### FIN-441 - Matriz de permissao financeira completa

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - Validar `read/manage` por rota e acao dos novos blocos.
  - Atualizar testes de permissao de menu/rota.
- Criterios de aceite:
  - Nenhum endpoint sensivel acessivel fora de perfil autorizado.

### FIN-442 - Regressao integrada Vendas -> Financeiro

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - Atualizar script integrado de regressao para incluir recebiveis/caixa/tesouraria.
  - Publicar relatorio de execucao com evidencias.
- Criterios de aceite:
  - Todas as suites criticas PASS.

### FIN-443 - Runbook operacional sem NFe

- Tipo: Story
- Estimativa: 2 pontos
- Entregas:
  - Passo a passo diario/semanal/mensal de operacao.
  - Procedimentos de contingencia (gateway indisponivel, divergencia de saldo, reprocessamento).
- Criterios de aceite:
  - Operacao consegue executar fluxo sem apoio tecnico direto.

### FIN-444 - Checklist de liberacao e monitoramento

- Tipo: Story
- Estimativa: 2 pontos
- Entregas:
  - Checklist de GO tecnico e GO negocio.
  - Janela de monitoramento inicial e 48h.
- Criterios de aceite:
  - Decisao GO/NO-GO documentada com evidencias.

## 6. Matriz minima de testes por fase

### Sprint 1 (FIN-410)

1. Backend unitario (contas a receber service/controller): `npm --prefix backend run test -- --runInBand`
2. Backend e2e financeiro critico existente: `npm --prefix backend run test:e2e:contas-pagar`
3. Frontend contrato/services financeiros: `npm --prefix frontend-web run test -- --watch=false --runInBand src/services/__tests__/contasPagarService.test.ts src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts`

### Sprint 2 (FIN-420)

1. Backend unitario fluxo de caixa: `npm --prefix backend run test -- --runInBand`
2. Backend e2e conciliacao: `npm --prefix backend run test:e2e:conciliacao-bancaria`
3. Frontend financeiro dashboard/report tests: `npm --prefix frontend-web run test -- --watch=false --runInBand`

### Sprint 3 (FIN-430)

1. Backend unitario tesouraria: `npm --prefix backend run test -- --runInBand`
2. Regressao e2e vendas-financeiro: `npm --prefix backend run test:e2e:vendas`
3. Frontend suites financeiras da sprint: `npm --prefix frontend-web run test -- --watch=false --runInBand`

### Sprint 4 (FIN-440)

1. Release guards:
   - `npm run validate:release:vendas:core`
   - `npm run validate:release:vendas:full`
2. E2E billing critico: `npm run test:e2e:billing:critical`
3. Preflight:
   - `npm run preflight:go-live:vendas:core`
   - `npm run preflight:go-live:vendas:full`

## 7. Definition of Ready (DoR) para cada story

1. Escopo funcional fechado.
2. Dependencias tecnicas mapeadas.
3. Criterios de aceite escritos.
4. Comando de teste definido.
5. Responsavel e ambiente alvo definidos.

## 8. Definition of Done (DoD) para cada story

1. Codigo revisado.
2. Testes da story executados e PASS.
3. Sem regressao nas suites financeiras criticas.
4. Permissoes e isolamento por empresa validados.
5. Auditoria para acoes criticas.
6. Documentacao atualizada.

## 9. Ordem de execucao recomendada

1. FIN-411 -> FIN-412 -> FIN-413 -> FIN-414 -> FIN-415
2. FIN-421 -> FIN-422 -> FIN-423 -> FIN-424 -> FIN-425
3. FIN-431 -> FIN-432 -> FIN-433 -> FIN-434 -> FIN-435
4. FIN-441 -> FIN-442 -> FIN-443 -> FIN-444

## 10. Proximo passo imediato

1. Executar janela de monitoramento inicial pos-GO (script curto).
2. Executar monitoramento estendido de 48h pos-go-live.
