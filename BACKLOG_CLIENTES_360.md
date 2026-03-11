# Backlog Clientes 360

## Objetivo

Consolidar a evolução da área de clientes para que ela deixe de ser apenas um cadastro operacional e passe a funcionar como uma visão 360 do cliente dentro do sistema, conectando CRM, atendimento, contratos e faturamento.

## Contexto Atual

- A tela de clientes já atende cadastro, listagem, edição, exportação, anexos e contatos.
- O módulo ainda não entrega uma visão consolidada de relacionamento com tickets, propostas, contratos e faturas.
- Existem inconsistências entre os campos que a UI sugere e o que o backend realmente persiste.
- Parte do contexto mais avançado já existe no omnichannel, mas ainda não está sendo reaproveitada na jornada principal de clientes.

## Status Atual dos Cards (marco/2026)

Legenda:

- Concluido: implementado e aderente ao objetivo do card.
- Parcial: existe implementacao, mas incompleta ou inconsistente com o objetivo.
- Nao iniciado: nao ha entrega suficiente para considerar inicio real.

| Card | Status | Observacao objetiva |
| --- | --- | --- |
| CRM-001 | Concluido | Contrato oficial documentado em `docs/features/CRM-001_CONTRATO_OFICIAL_ENTIDADE_CLIENTE_2026-03.md` e adotado como baseline tecnico. |
| CRM-002 | Concluido | Backend validado com DTO oficial aplicado em create/update/find, mantendo compatibilidade legada controlada sem quebrar contrato. |
| CRM-003 | Concluido | Migration `1802600000000-HardenClientesContractSchema.ts` executada com sucesso; validados indice `IDX_clientes_empresa_documento`, RLS ativo e policy `tenant_isolation_cliente_anexos` no PostgreSQL. |
| CRM-004 | Concluido | Tipos e payloads de escrita no frontend alinhados ao contrato oficial; service e modal nao trafegam mais campos fora de escopo. |
| CRM-005 | Concluido | Modal revisado para escopo oficial: somente campos suportados, sem referencias a perfil avancado fora do contrato. |
| CRM-006 | Concluido | Comunicacao do modulo ajustada para escopo atual (cadastro e relacionamento basico), sem promessa de visao 360 completa. |
| CRM-007 | Concluido | Perfil do cliente agora exibe resumo de tickets (total/abertos/resolvidos), ultimo atendimento e lista de ultimos tickets com navegacao para detalhe. |
| CRM-008 | Concluido | Perfil do cliente agora exibe resumo de propostas (total/pendentes/aprovadas/rejeitadas), ultimo registro e lista das ultimas propostas com acesso rapido. |
| CRM-009 | Concluido | Perfil do cliente agora exibe resumo de contratos (total/pendentes/assinados/encerrados), ultimo registro e lista dos ultimos contratos com acesso ao detalhe. |
| CRM-010 | Concluido | Perfil do cliente agora exibe resumo de faturas (total/pagas/pendentes/vencidas), ultimo registro e lista das ultimas faturas com acesso rapido ao financeiro. |
| CRM-011 | Concluido | Perfil do cliente agora consome contexto omnichannel (segmento, estatisticas e historico recente) reaproveitando endpoints de atendimento. |
| CRM-012 | Concluido | Perfil do cliente agora abre tickets, propostas, contratos e faturamento com query params de cliente (`clienteId`/`cliente`) e as paginas destino aplicam pre-filtro automaticamente. |
| CRM-013 | Concluido | Ultimo e proximo contato agora estao persistidos, exibidos no perfil e utilizados na listagem (cards e tabela), com fluxo operacional completo de follow-up. |
| CRM-014 | Concluido | Listagem/exportacao de clientes agora aceitam `followup` (`pendente`/`vencido`) com filtro operacional por `proximo_contato`, incluindo UI, URL e views salvas. |
| CRM-015 | Concluido | Tags agora persistem no backend (create/update), aparecem no cadastro/perfil e podem ser filtradas na listagem/exportacao com estado completo na UI. |
| CRM-016 | Concluido | Origem e responsavel comercial agora persistem no backend, aparecem no cadastro e podem ser filtrados na listagem/exportacao. |
| CRM-017 | Concluido | Dashboard de clientes agora destaca KPIs de follow-up (pendente/vencido) e carteira comercial (com/sem responsavel), com escopo Global e Filtrado explicito. |
| CRM-018 | Concluido | Suite de contrato dedicada criada com artefato explicito (`docs/features/contracts/clientes.contract.json`) e testes automatizados de create/update/read no backend e frontend. |
| CRM-019 | Concluido | Suite funcional minima criada no backend para listagem, cadastro, edicao, abertura de perfil e integracao principal do perfil (resumo de tickets). |
| CRM-020 | Concluido | Checklist de QA do modulo formalizado em `docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md`, cobrindo validacao manual de listagem, cadastro, perfil e integracoes. |

## Prioridades

### P0

#### CRM-001

- Tipo: Spike
- Sprint: Sprint 1
- Estimativa: 3 pontos
- Dependências: nenhuma
- Título: Definir contrato oficial da entidade cliente

Descrição:

Definir quais campos pertencem oficialmente ao domínio de cliente e quais pertencem a contato, atendimento, comercial ou financeiro.

Critérios de aceite:

- Os campos obrigatórios do cliente estão definidos.
- Os campos opcionais do cliente estão definidos.
- Os campos fora de escopo do cliente estão definidos.
- A fronteira entre cliente, contato, atendimento e comercial está documentada.
- O contrato final pode ser usado como referência técnica e funcional.

#### CRM-002

- Tipo: Story
- Sprint: Sprint 1
- Estimativa: 8 pontos
- Dependências: CRM-001
- Título: Persistir corretamente os campos oficiais do cliente no backend

Descrição:

Adequar a entity e os serviços de clientes para persistirem apenas o contrato oficial aprovado.

Critérios de aceite:

- Os campos aprovados existem na persistência.
- O create salva corretamente os campos do contrato.
- O update atualiza corretamente os campos do contrato.
- O find retorna corretamente os campos do contrato.
- Campos fora de escopo deixam de ser tratados como persistidos.

#### CRM-003

- Tipo: Task
- Sprint: Sprint 1
- Estimativa: 5 pontos
- Dependências: CRM-001
- Título: Criar migration de alinhamento do schema de clientes

Descrição:

Ajustar o schema do banco para suportar o contrato oficial da entidade cliente.

Critérios de aceite:

- Existe migration para criar ou ajustar colunas necessárias.
- O schema final suporta os campos aprovados no contrato.
- O isolamento multi-tenant continua preservado.
- A migration não quebra dados existentes.

#### CRM-004

- Tipo: Story
- Sprint: Sprint 1
- Estimativa: 5 pontos
- Dependências: CRM-002
- Título: Ajustar tipos e service do frontend para o contrato real de cliente

Descrição:

Alinhar tipagem e service do frontend com o contrato persistido no backend.

Critérios de aceite:

- O tipo Cliente do frontend reflete o contrato real.
- O service de clientes trafega apenas campos suportados.
- Não há dependência de propriedades legadas ambíguas.
- O frontend deixa de sugerir persistência de campos inexistentes.

#### CRM-005

- Tipo: Story
- Sprint: Sprint 1
- Estimativa: 5 pontos
- Dependências: CRM-004
- Título: Revisar o modal de cadastro de cliente para refletir o escopo real

Descrição:

Ajustar a UI de cadastro e edição para mostrar apenas campos suportados e confiáveis.

Critérios de aceite:

- O formulário exibe apenas campos válidos para o escopo atual.
- Os dados informados persistem corretamente.
- O texto do modal não induz o usuário a erro.
- O fluxo de edição usa os mesmos campos e regras do fluxo de criação.

#### CRM-006

- Tipo: Task
- Sprint: Sprint 1
- Estimativa: 3 pontos
- Dependências: CRM-001
- Título: Alinhar comunicação do módulo de clientes com o escopo real do produto

Descrição:

Revisar descrições, promessas e posicionamento do módulo para refletir a maturidade atual da funcionalidade.

Critérios de aceite:

- Não existe contradição entre descrição do módulo e escopo atual.
- O posicionamento do módulo é coerente com a entrega real.
- Menu, rota e descrição não passam mensagem conflitante.

#### CRM-007

- Tipo: Story
- Sprint: Sprint 2
- Estimativa: 5 pontos
- Dependências: CRM-004
- Título: Exibir tickets e atendimentos no perfil do cliente

Descrição:

Adicionar visão de tickets e atendimentos diretamente no perfil do cliente.

Critérios de aceite:

- O perfil mostra total de tickets do cliente.
- O perfil mostra tickets abertos e resolvidos.
- O perfil mostra último atendimento.
- O usuário pode navegar para o ticket ou lista filtrada.

#### CRM-008

- Tipo: Story
- Sprint: Sprint 2
- Estimativa: 5 pontos
- Dependências: CRM-004
- Título: Exibir propostas vinculadas no perfil do cliente

Descrição:

Adicionar seção de propostas do cliente dentro do perfil.

Critérios de aceite:

- O perfil mostra propostas vinculadas ao cliente.
- Cada proposta mostra status relevante.
- O usuário consegue abrir a proposta ou lista filtrada por cliente.

#### CRM-009

- Tipo: Story
- Sprint: Sprint 2
- Estimativa: 5 pontos
- Dependências: CRM-004
- Título: Exibir contratos vinculados no perfil do cliente

Descrição:

Adicionar visão de contratos do cliente no perfil.

Critérios de aceite:

- O perfil mostra contratos do cliente.
- Cada contrato mostra situação principal.
- O usuário consegue abrir o contrato ou lista correspondente.

#### CRM-010

- Tipo: Story
- Sprint: Sprint 2
- Estimativa: 5 pontos
- Dependências: CRM-004
- Título: Exibir faturas vinculadas no perfil do cliente

Descrição:

Adicionar visão financeira básica do cliente no perfil.

Critérios de aceite:

- O perfil mostra faturas vinculadas.
- O perfil mostra situação mínima de pago, pendente e vencido.
- O usuário consegue abrir o detalhe financeiro correspondente.

### P1

#### CRM-011

- Tipo: Story
- Sprint: Sprint 2
- Estimativa: 8 pontos
- Dependências: CRM-007
- Título: Integrar o contexto omnichannel ao perfil do cliente

Descrição:

Reaproveitar a infraestrutura existente de contexto do cliente para enriquecer o perfil.

Critérios de aceite:

- O perfil consome o contexto completo do cliente.
- O histórico deixa de ser apenas cadastro e atualização.
- As estatísticas de relacionamento passam a refletir dados reais disponíveis.

#### CRM-012

- Tipo: Task
- Sprint: Sprint 2
- Estimativa: 3 pontos
- Dependências: CRM-007, CRM-008, CRM-009, CRM-010
- Título: Criar navegação cruzada do perfil do cliente para módulos relacionados

Descrição:

Adicionar links e ações para abrir tickets, propostas, contratos e faturas a partir do perfil do cliente.

Critérios de aceite:

- O perfil possui ações claras para abrir módulos relacionados.
- A navegação aplica filtro por cliente.
- O usuário não precisa repetir busca manual.

#### CRM-013

- Tipo: Story
- Sprint: Sprint 3
- Estimativa: 5 pontos
- Dependências: CRM-002
- Título: Implementar último contato e próximo contato como dados operacionais

Descrição:

Transformar follow-up em funcionalidade real do módulo de clientes.

Critérios de aceite:

- O cliente possui último contato e próximo contato persistidos.
- O perfil exibe esses dados.
- A listagem pode usar essas informações.

#### CRM-014

- Tipo: Story
- Sprint: Sprint 3
- Estimativa: 3 pontos
- Dependências: CRM-013
- Título: Adicionar filtros de follow-up pendente e follow-up vencido

Descrição:

Permitir gestão ativa da carteira pela cadência de contato.

Critérios de aceite:

- Existe filtro para follow-up vencido.
- Existe filtro para clientes sem próximo contato.
- O resultado pode ser exportado.

#### CRM-015

- Tipo: Story
- Sprint: Sprint 3
- Estimativa: 5 pontos
- Dependências: CRM-002
- Título: Implementar tags com persistência e filtro

Descrição:

Permitir segmentação real por tags no módulo de clientes.

Critérios de aceite:

- Tags são persistidas no backend.
- Tags podem ser editadas.
- A listagem permite filtrar por tags.
- O perfil exibe tags corretamente.

#### CRM-016

- Tipo: Story
- Sprint: Sprint 3
- Estimativa: 5 pontos
- Dependências: CRM-002
- Título: Implementar origem do cliente e responsável comercial

Descrição:

Adicionar metadados comerciais essenciais para gestão da carteira.

Critérios de aceite:

- O cliente possui origem persistida.
- O cliente possui responsável comercial persistido.
- Existem filtros por origem e responsável.
- O perfil mostra essas informações de forma clara.

#### CRM-017

- Tipo: Story
- Sprint: Sprint 3
- Estimativa: 3 pontos
- Dependências: CRM-013, CRM-015, CRM-016
- Título: Adicionar KPIs operacionais da carteira de clientes

Descrição:

Criar indicadores mínimos para gestão da base de clientes.

Critérios de aceite:

- A tela mostra clientes ativos, leads e prospects.
- A tela mostra follow-ups pendentes e vencidos.
- Os indicadores deixam claro se são globais ou filtrados.

#### CRM-018

- Tipo: Task
- Sprint: Sprint 3
- Estimativa: 5 pontos
- Dependências: CRM-002, CRM-004
- Título: Criar testes de contrato entre frontend e backend do módulo de clientes

Descrição:

Adicionar proteção automática contra regressões no contrato do módulo.

Critérios de aceite:

- Existe cobertura para create, update e read.
- Mudanças incompatíveis quebram testes.
- O contrato esperado fica explícito.

#### CRM-019

- Tipo: Task
- Sprint: Sprint 3
- Estimativa: 5 pontos
- Dependências: CRM-005, CRM-007, CRM-008, CRM-010
- Título: Criar testes funcionais da listagem e perfil de clientes

Descrição:

Cobrir os fluxos principais do módulo com testes funcionais mínimos.

Critérios de aceite:

- Existe teste para cadastro.
- Existe teste para edição.
- Existe teste para abertura do perfil.
- Existe teste mínimo para integração principal do perfil.

### P2

#### CRM-020

- Tipo: Task
- Sprint: Sprint 3
- Estimativa: 2 pontos
- Dependências: CRM-019
- Título: Criar checklist de QA do módulo de clientes

Descrição:

Documentar a validação manual mínima para releases do módulo.

Critérios de aceite:

- Existe checklist de QA documentado.
- O checklist cobre cadastro, edição, perfil, filtros e integrações.
- O checklist pode ser executado por qualquer pessoa do time.

## Resumo por Sprint

### Sprint 1

- CRM-001
- CRM-002
- CRM-003
- CRM-004
- CRM-005
- CRM-006

### Sprint 2

- CRM-007
- CRM-008
- CRM-009
- CRM-010
- CRM-011
- CRM-012

### Sprint 3

- CRM-013
- CRM-014
- CRM-015
- CRM-016
- CRM-017
- CRM-018
- CRM-019
- CRM-020

## Resumo por Prioridade

### P0

- CRM-001
- CRM-002
- CRM-003
- CRM-004
- CRM-005
- CRM-006
- CRM-007
- CRM-008
- CRM-009
- CRM-010

### P1

- CRM-011
- CRM-012
- CRM-013
- CRM-014
- CRM-015
- CRM-016
- CRM-017
- CRM-018
- CRM-019

### P2

- CRM-020

## Sequência Recomendada

1. Fechar contrato de domínio.
2. Ajustar persistência e schema.
3. Alinhar frontend com o contrato real.
4. Limpar o cadastro e o perfil básico.
5. Entregar o perfil 360 com integrações.
6. Implementar follow-up e gestão de carteira.
7. Fechar testes e checklist de QA.

## Resultado Esperado

Ao final desse backlog, a área de clientes deve funcionar como:

- fonte confiável de dados do cliente;
- perfil consolidado de relacionamento;
- ponto de entrada para atendimento, comercial e financeiro;
- base operacional para follow-up e gestão da carteira.
