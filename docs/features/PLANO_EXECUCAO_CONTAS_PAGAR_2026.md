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

### AP-203 - Dashboard de conciliacao

- Tipo: Story
- Estimativa: 3 pontos
- Objetivo: visao de pendencias e taxa de conciliacao.
- Criterios de aceite:
  - Indicadores de conciliado, pendente, divergente.

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

