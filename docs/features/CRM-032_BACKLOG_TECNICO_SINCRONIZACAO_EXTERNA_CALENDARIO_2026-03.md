# CRM-032 - Backlog Tecnico de Sincronizacao Externa de Calendario (2026-03)

Status: Backlog tecnico inicial para refinamento
Origem: derivado de `CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md`
Data: 2026-03
Escopo: Agenda interna -> Google Calendar / Outlook

## 1. Objetivo

Definir o backlog tecnico minimo para evoluir a Agenda interna do CRM para suportar sincronizacao externa com calendarios de terceiros sem misturar esse escopo com a Agenda v1 interna.

## 2. Premissas

- A Agenda v1 continua sendo o sistema interno de verdade do CRM ate definicao explicita em contrario.
- Google Calendar e Outlook nao devem ser tratados como simples campo extra do evento.
- Sincronizacao externa exige ownership claro, reconciliacao e observabilidade.
- Qualquer rollout deve acontecer por fase e com provider explicitamente habilitado.

## 3. Historias tecnicas propostas

### CRM032-01 - Modelo de conexao por usuario/tenant

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - definir entidade/configuracao de conexao externa por tenant e usuario;
  - suportar armazenar provider, calendario padrao, escopos e estado da conexao;
  - prever revogacao e expiração de credenciais.
- Criterios de aceite:
  - o sistema identifica qual calendario externo pertence a qual usuario/tenant;
  - desconexao nao deixa sincronizacao fantasma ativa.

### CRM032-02 - Mapeamento de evento interno <-> evento externo

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - criar tabela/registro de vinculo entre `agenda_evento` e `external_event_id`;
  - armazenar provider, calendario, versao/sync token e timestamp da ultima sincronizacao.
- Criterios de aceite:
  - um evento interno sincronizado possui rastreabilidade do item externo;
  - conflitos de deduplicacao sao detectados.

### CRM032-03 - Exportacao inicial CRM -> calendario externo

- Tipo: Story
- Estimativa: 5 pontos
- Backend:
  - publicar evento interno ou job para criar/atualizar evento externo;
  - enviar campos suportados do contrato da Agenda: titulo, descricao, inicio, fim, local e participantes elegiveis.
- Criterios de aceite:
  - criacao/edicao no CRM gera evento correspondente no provider habilitado;
  - falha externa nao corrompe o evento interno.

### CRM032-04 - Importacao controlada calendario externo -> CRM

- Tipo: Story
- Estimativa: 8 pontos
- Backend:
  - definir webhook/polling por provider;
  - criar estrategia de importacao apenas para eventos elegiveis;
  - registrar origem externa sem sobrescrever manualmente eventos internos indevidos.
- Criterios de aceite:
  - o sistema importa ou atualiza eventos conforme politica definida;
  - alteracoes externas ficam auditaveis.

### CRM032-05 - Politica de conflito e ownership

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - definir fonte de verdade por cenario;
  - definir estrategia para conflito simultaneo de horario/campo;
  - definir regra de exclusao e cancelamento bidirecional.
- Criterios de aceite:
  - conflitos nao resultam em loop de sincronizacao;
  - ownership do ultimo update e identificavel.

### CRM032-06 - Seguranca, observabilidade e rollout

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - logs com `correlationId` por sincronizacao;
  - fila de excecoes para falha de import/export;
  - flags por provider e tenant piloto;
  - checklist de QA e monitoramento pos-go-live.
- Criterios de aceite:
  - operacao consegue rastrear falhas por tenant e provider;
  - rollout pode ser desligado sem degradar a Agenda interna.

## 4. Dependencias abertas

1. Definir qual provider entra primeiro: Google Calendar ou Outlook.
2. Definir se a sincronizacao inicial sera unidirecional ou bidirecional.
3. Definir estrategia de autenticacao e refresh token.
4. Definir politica de participantes externos.
5. Definir politica de recorrencia, que hoje esta fora do escopo da Agenda v1.

## 5. Fora de escopo deste backlog inicial

- disponibilidade inteligente entre equipes;
- reserva de salas/recursos;
- recorrencia avancada multiplataforma;
- importacao historica massiva;
- sincronizacao com calendarios sem provider homologado.

## 6. Evidencias atuais de contexto

1. Contrato funcional da Agenda v1: `docs/features/CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md`
2. Checklist de QA da Agenda v1: `docs/features/CRM-031_CHECKLIST_QA_AGENDA_2026-03.md`
3. Matriz de cobertura apontando lacuna da sincronizacao externa: `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
4. Historico antigo de demos Google Calendar existe apenas como contexto em `docs/archive/` e nao deve ser usado como baseline de implementacao.

## 7. Proximo documento necessario

- contrato funcional v1 da sincronizacao externa, definindo primeiro provider, direcao de sync e politica de conflito.
- publicado em `docs/features/CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`.

Resultado: a sincronizacao externa de calendario deixa de ser apenas promessa aberta e passa a ter backlog tecnico de evolucao controlada.
