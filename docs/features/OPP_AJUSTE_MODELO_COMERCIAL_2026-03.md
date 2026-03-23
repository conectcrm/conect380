# OPP - Plano de Implementacao e Ajuste do Modelo Comercial - 2026-03

## 1. Objetivo

Ajustar o modelo atual de `oportunidades` e `propostas` para chegar a um fluxo comercial mais previsivel, governavel e util para operacao, preservando o que ja funciona hoje e reduzindo ambiguidades no uso diario.

Objetivos especificos:

1. Manter `oportunidade` como entidade de negociacao e pipeline.
2. Manter `proposta` como entidade de composicao comercial final.
3. Eliminar a sensacao de "proposta pronta" quando o rascunho nasce com item generico.
4. Permitir visao preliminar de produtos/solucoes ainda na oportunidade, sem transformar a oportunidade na fonte final de itens.
5. Endurecer regras de avancos comerciais onde hoje o fluxo esta permissivo demais.
6. Tornar politicas comerciais configuraveis por empresa sempre que fizer sentido.

## 2. Diagnostico do modelo atual

### 2.1 Pontos que ja estao corretos

1. O pipeline comercial esta separado do fluxo de proposta.
2. Apenas a `proposta principal` influencia automaticamente o estagio da oportunidade.
3. Proposta sem itens ja e bloqueada para envio, aprovacao e PDF final.
4. Oportunidade perdida exige `motivoPerda`.
5. O fechamento comercial e separado do lifecycle tecnico.

### 2.2 Gaps atuais

1. A oportunidade nao possui estrutura propria para armazenar itens/interesses comerciais preliminares.
2. Ao gerar proposta pelo pipeline, o backend pode criar um item generico com base apenas no valor da oportunidade.
3. O fluxo da proposta ainda permite alguns atalhos excessivos, como `rascunho -> aprovada`.
4. A politica de alcada de desconto esta fixa em codigo.
5. O modelo atual dificulta forecast por produto, familia ou linha de solucao antes da proposta formal.

## 3. Modelo alvo

### 3.1 Oportunidade

`Oportunidade` continua sendo a entidade principal de pipeline e negociacao.

Passa a poder armazenar, de forma opcional:

1. `itens preliminares` ou `interesses comerciais`;
2. familia/linha de produto;
3. quantidade estimada;
4. faixa de valor estimada;
5. observacoes comerciais de escopo.

Importante:

1. esses dados sao preliminares;
2. eles nao substituem os itens finais da proposta;
3. eles servem para forecast, contexto comercial e aceleracao do rascunho.

### 3.2 Proposta

`Proposta` continua sendo a fonte de verdade para:

1. itens finais;
2. quantidade final;
3. preco unitario;
4. desconto;
5. impostos;
6. forma de pagamento;
7. validade;
8. aprovacao comercial;
9. contrato e faturamento subsequentes.

### 3.3 Sincronizacao

1. So a `proposta principal` continua sincronizando a oportunidade.
2. A sincronizacao continua sem rollback automatico.
3. `rejeitada` e `expirada` continuam sugerindo perda, sem marcar `Perdido` automaticamente.

## 4. Decisoes propostas

### 4.1 Decisao principal

Adotar modelo hibrido:

1. oportunidade com `itens preliminares opcionais`;
2. proposta com `itens comerciais finais obrigatorios`.

### 4.2 Geracao de rascunho pelo pipeline

Substituir o comportamento atual por esta regra:

1. se a oportunidade tiver itens preliminares validos, o rascunho nasce com copia desses itens;
2. se a oportunidade nao tiver itens preliminares, o rascunho nasce sem itens;
3. o sistema nao deve criar item generico artificial apenas com base no valor da oportunidade;
4. o frontend deve abrir o rascunho em edicao e destacar claramente que faltam itens comerciais finais.

### 4.3 Regras de avancos da proposta

Manter a matriz atual como base, mas endurecer o fluxo padrao:

1. `rascunho -> enviada` deve ser o caminho padrao para inicio formal da proposta;
2. `rascunho -> aprovada` deve ser bloqueado por padrao;
3. se o negocio precisar manter excecao, ela deve exigir permissao explicita e trilha de auditoria;
4. `aprovada -> contrato_gerado/contrato_assinado/fatura_criada` continua permitido conforme o fluxo operacional;
5. etapas finais continuam exigindo itens comerciais validos.

### 4.4 Politica de alcada

Trocar a regra fixa em codigo por politica configuravel por empresa:

1. limite percentual de desconto;
2. habilitar/desabilitar aprovacao interna;
3. comportamento em caso de excecao;
4. usuarios/perfis autorizados a aprovar acima da alcada.

## 5. Escopo tecnico proposto

### 5.1 Backend - dados

Criar estrutura dedicada para itens preliminares da oportunidade.

Opcao recomendada:

1. tabela `oportunidade_itens_preliminares`;
2. colunas:
   - `id`
   - `empresa_id`
   - `oportunidade_id`
   - `produto_id` ou `catalog_item_id` nullable
   - `nome_snapshot`
   - `descricao_snapshot`
   - `categoria_snapshot`
   - `quantidade_estimada`
   - `valor_unitario_estimado`
   - `desconto_estimado`
   - `subtotal_estimado`
   - `origem`
   - `ordem`
   - `created_at`
   - `updated_at`
3. RLS e indices alinhados ao padrao do modulo.

Motivo da opcao recomendada:

1. melhor para auditoria;
2. melhor para analytics;
3. menor risco de virar um blob JSON opaco;
4. mais facil de validar e evoluir.

### 5.2 Backend - contratos e servicos

1. Expandir DTOs e service de oportunidades para CRUD de itens preliminares.
2. Ajustar `POST /oportunidades/:id/gerar-proposta` para:
   - parar de criar item generico automatico;
   - copiar itens preliminares quando existirem;
   - registrar metadata de origem do rascunho.
3. Endurecer matriz de status em `PropostasService`.
4. Introduzir configuracao de politica comercial por empresa.
5. Preservar sincronizacao por `proposta principal`.

### 5.3 Frontend

1. Exibir resumo de itens preliminares no modal/detalhe da oportunidade.
2. Permitir adicionar/remover itens preliminares ainda no contexto da oportunidade.
3. Ajustar CTA do pipeline para explicar o comportamento do rascunho:
   - "Criar rascunho de proposta"
4. Exibir banner forte no rascunho quando ele estiver sem itens finais.
5. Bloquear e explicar claramente acoes finais quando faltarem itens.
6. Expor configuracao de politica comercial em tela administrativa apropriada.

### 5.4 QA e observabilidade

1. Expandir suites E2E para itens preliminares e geracao de rascunho sem placeholder.
2. Cobrir configuracao de alcada por empresa.
3. Registrar metricas de:
   - rascunho criado com itens preliminares copiados;
   - rascunho criado vazio;
   - envio bloqueado por ausencia de itens;
   - aprovacao bloqueada por alcada.

## 6. Fases recomendadas

### Fase 0 - Alinhamento funcional

Objetivo: fechar decisao de produto antes de mexer em schema.

Entregas:

1. aprovar modelo alvo;
2. aprovar nome final de `itens preliminares` no produto;
3. aprovar politica desejada para `rascunho -> aprovada`;
4. aprovar politica de alcada por empresa.

Criterios de saida:

1. matriz alvo de status validada por Produto/Comercial;
2. definicao de rollout por tenant;
3. sem decisoes abertas sobre origem dos itens.

### Fase 1 - Quick wins sem mudanca de schema

Objetivo: corrigir o comportamento mais confuso com baixo risco.

Escopo:

1. remover criacao automatica de item generico no endpoint de gerar proposta;
2. manter rascunho vazio quando nao houver base comercial;
3. reforcar banner de "adicione itens" na tela de proposta;
4. revisar microcopys de bloqueio e orientacao;
5. adicionar cobertura E2E para o novo comportamento.

Beneficio:

1. elimina a falsa impressao de proposta final pronta;
2. reduz risco operacional imediato.

### Fase 2 - Itens preliminares na oportunidade

Objetivo: dar capacidade comercial a oportunidade sem deslocar a responsabilidade final da proposta.

Escopo:

1. criar tabela/migration de itens preliminares;
2. criar endpoints CRUD;
3. adicionar UI na oportunidade;
4. copiar itens preliminares ao gerar rascunho;
5. registrar origem dos itens copiados.

Criterios de aceite:

1. vendedor consegue registrar interesse preliminar ainda no pipeline;
2. proposta nasce com base inicial quando existir item preliminar;
3. ausencia de item preliminar nao gera item artificial.

### Fase 3 - Governanca de transicoes e politicas comerciais

Objetivo: endurecer o fluxo onde hoje existe permissividade excessiva.

Escopo:

1. bloquear `rascunho -> aprovada` por padrao;
2. exigir override auditavel, se aprovado pelo negocio;
3. tornar alcada configuravel por empresa;
4. revisar mensagens de bloqueio e historico de eventos.

Criterios de aceite:

1. proposta sem itens continua bloqueada;
2. proposta com desconto acima do limite respeita politica do tenant;
3. fluxo rapido sem controle nao acontece silenciosamente.

### Fase 4 - Rollout, analytics e consolidacao

Objetivo: entrar em producao de forma controlada.

Escopo:

1. feature flags por tenant;
2. migracao assistida;
3. monitoramento pos-go-live;
4. ajuste dos dashboards e indicadores comerciais.

## 7. Sequenciamento recomendado

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4

Observacao:

1. Fase 1 pode ser entregue rapidamente e gerar valor antes da modelagem completa.
2. Fase 2 e Fase 3 podem rodar em paralelo apenas se as decisoes de produto estiverem fechadas.

## 8. Backlog tecnico sugerido

### OPPMOD-01 - Remover placeholder comercial do rascunho

- Tipo: Story
- Backend:
  - ajustar geracao de proposta no controller/service de oportunidades;
  - persistir metadata de origem sem item generico;
- Frontend:
  - reforcar estado vazio do rascunho;
- Criterios de aceite:
  - rascunho sem item preliminar nasce vazio;
  - nenhum item artificial e persistido.

### OPPMOD-02 - CRUD de itens preliminares na oportunidade

- Tipo: Story
- Backend:
  - nova tabela + migration + RLS;
  - endpoints e validacoes;
- Frontend:
  - UI de cadastro/edicao/listagem dentro da oportunidade;
- Criterios de aceite:
  - oportunidade passa a ter visao preliminar por item/linha de solucao.

### OPPMOD-03 - Copia assistida de itens preliminares para proposta

- Tipo: Story
- Backend:
  - mapear snapshot preliminar para item comercial inicial;
- Frontend:
  - informar que os itens foram copiados como base editavel;
- Criterios de aceite:
  - proposta criada do pipeline reaproveita contexto sem mascarar dados finais.

### OPPMOD-04 - Endurecimento de transicoes da proposta

- Tipo: Story
- Backend:
  - revisar matriz de status;
  - adicionar override com auditoria se necessario;
- Frontend:
  - esconder/desabilitar acoes nao permitidas;
- Criterios de aceite:
  - fluxo padrao respeita sequencia comercial esperada.

### OPPMOD-05 - Politica comercial configuravel por empresa

- Tipo: Story
- Backend:
  - limite de desconto e override configuraveis;
- Frontend:
  - tela/controle de configuracao;
- Criterios de aceite:
  - cada empresa aplica sua propria regra de alcada.

### OPPMOD-06 - QA, rollout e observabilidade

- Tipo: Story
- Entregas:
  - suites automatizadas;
  - flags;
  - runbook de rollout e rollback;
- Criterios de aceite:
  - rollout controlado sem regressao no fluxo atual.

## 9. Arquivos e areas mais impactados

### Backend

1. `backend/src/modules/oportunidades/oportunidade.entity.ts`
2. `backend/src/modules/oportunidades/dto/oportunidade.dto.ts`
3. `backend/src/modules/oportunidades/oportunidades.controller.ts`
4. `backend/src/modules/oportunidades/oportunidades.service.ts`
5. `backend/src/modules/propostas/propostas.service.ts`
6. `backend/src/modules/propostas/dto/proposta.dto.ts`
7. `backend/src/migrations/*`

### Frontend

1. `frontend-web/src/pages/PipelinePage.tsx`
2. `frontend-web/src/components/oportunidades/ModalOportunidadeRefatorado.tsx`
3. `frontend-web/src/components/oportunidades/ModalDetalhesOportunidade.tsx`
4. `frontend-web/src/components/modals/ModalNovaProposta.tsx`
5. `frontend-web/src/features/propostas/components/PropostaActions.tsx`
6. `frontend-web/src/services/oportunidadesService.ts`
7. `frontend-web/src/services/propostasService.ts`

### E2E

1. `e2e/pipeline-proposta-rascunho.spec.ts`
2. `e2e/propostas-bloqueio-sem-itens.spec.ts`
3. `e2e/propostas-principal-sync.spec.ts`
4. `e2e/propostas-acoes-status.spec.ts`
5. `e2e/propostas-automacao-fluxo.spec.ts`

## 10. Feature flags recomendadas

1. `sales.pipeline_draft_without_placeholder`
2. `sales.opportunity_preliminary_items`
3. `sales.strict_proposta_transitions`
4. `sales.discount_policy_per_tenant`

## 11. Riscos e mitigacoes

### Risco 1 - Mudanca de habito operacional

- Risco:
  - usuarios podem estranhar o rascunho vazio.
- Mitigacao:
  - banner explicativo e treinamento curto.

### Risco 2 - Itens preliminares virarem "itens finais disfarçados"

- Risco:
  - time passar a tratar oportunidade como proposta incompleta.
- Mitigacao:
  - naming claro, UI distinta e validacoes separadas.

### Risco 3 - Complexidade excessiva de configuracao

- Risco:
  - politica comercial por tenant ficar dificil de manter.
- Mitigacao:
  - comecar com poucas variaveis: limite de desconto + override.

### Risco 4 - Regressao no fluxo atual de sincronizacao

- Risco:
  - mudancas em proposta afetarem sincronizacao com oportunidade.
- Mitigacao:
  - preservar testes de proposta principal e rollout por flag.

## 12. Criterios finais de sucesso

1. O pipeline continua simples para o vendedor.
2. Oportunidade passa a suportar forecast preliminar por item/solucao.
3. Proposta continua sendo a fonte final de verdade comercial.
4. Nao existe mais item generico artificial criado pelo pipeline.
5. Aprovacoes e avancos comerciais ficam mais governados.
6. O fluxo e implantado sem quebrar tenants ja ativos.

## 13. Recomendacao final

Implementar em duas ondas:

1. primeiro, `quick wins` de comportamento e governanca;
2. depois, modelagem de `itens preliminares` na oportunidade.

Essa ordem entrega valor rapido, reduz confusao imediata e evita mexer no schema antes de o modelo funcional estar validado com o time comercial.
