# CRM-030 - Contrato Funcional Agenda / Calendario (v1)

Status: Aprovado para baseline funcional
Origem: lacuna identificada em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
Data: 2026-03
Escopo: Backend `agenda-eventos` + frontend Agenda + RSVP interno

## 1. Objetivo

Definir o contrato funcional minimo do modulo Agenda para reduzir ambiguidade entre:

- agenda interna do CRM;
- lembretes e notificacoes;
- participacao de usuarios internos;
- futuras integracoes externas de calendario.

Este documento cobre o escopo v1 atualmente lastreado por controller, DTO e entity do backend.

## 2. Principios

- Multi-tenant obrigatorio: todo evento pertence a `empresa_id`.
- Agenda v1 e um calendario interno do CRM, nao uma sincronizacao externa completa.
- Participantes v1 sao representados por identificadores internos em `attendees`.
- RSVP v1 e por participante interno autenticado.
- Integracao com notificacoes e permitida, mas nao redefine o contrato do dominio Agenda.

## 3. Entidade funcional `agenda_evento`

### 3.1 Campos obrigatorios

- `id` (uuid, gerado pelo sistema)
- `empresa_id` (uuid)
- `titulo` (string, max 255)
- `inicio` (datetime)
- `status` (`confirmado` | `pendente` | `cancelado`)
- `prioridade` (`alta` | `media` | `baixa`)
- `all_day` (boolean, default `false`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3.2 Campos opcionais

- `descricao` (text)
- `fim` (datetime)
- `local` (string, max 255)
- `color` (string, max 20)
- `attendees` (array de identificadores de participantes)
- `attendee_responses` (mapa participante -> `pending` | `confirmed` | `declined`)
- `criado_por_id` (uuid)
- `interacao_id` (uuid, quando o evento nasce associado a interacao do CRM)

## 4. Operacoes obrigatorias do modulo v1

### 4.1 Criar evento

Endpoint de referencia: `POST /agenda-eventos`

Regras:

- aceitar payload com `titulo`, `inicio` e demais campos oficiais;
- preencher defaults de status e prioridade quando ausentes;
- vincular automaticamente ao tenant corrente;
- registrar criador quando contexto autenticado estiver disponivel.

### 4.2 Listar eventos

Endpoint de referencia: `GET /agenda-eventos`

Filtros minimos suportados:

- `status`
- `prioridade`
- `dataInicio`
- `dataFim`
- `busca`
- `interacao_id`

### 4.3 Detalhar evento

Endpoint de referencia: `GET /agenda-eventos/:id`

Regra:

- devolver somente eventos do tenant;
- devolver estado serializado para o usuario autenticado quando aplicavel.

### 4.4 Atualizar evento

Endpoint de referencia: `PATCH /agenda-eventos/:id`

Regra:

- permitir edicao parcial apenas dos campos do contrato;
- manter tenant e criador imutaveis por API funcional comum.

### 4.5 Responder RSVP

Endpoint de referencia: `PATCH /agenda-eventos/:id/rsvp`

Respostas permitidas:

- `pending`
- `confirmed`
- `declined`

### 4.6 Excluir evento

Endpoint de referencia: `DELETE /agenda-eventos/:id`

Regra:

- remocao deve respeitar isolamento tenant e permissoes do modulo.

## 5. Fronteira de dominio

- Agenda:
  - titulo, horario, local, participantes internos, RSVP e associacao com interacao.
- Notificacoes:
  - lembretes, alertas e feedback operacional derivados do evento.
- Atendimento/CRM:
  - contexto da interacao relacionada, sem absorver a agenda como subcampo ad hoc.
- Calendario externo:
  - Google Calendar / Outlook ficam fora do v1 e exigem contrato proprio de sincronizacao.

## 6. Fora de escopo deste contrato v1

- sincronizacao bidirecional com Google Calendar;
- sincronizacao bidirecional com Outlook;
- recorrencia complexa;
- convidados externos sem conta interna;
- anexos de evento;
- salas, recursos e reserva de ativos;
- disponibilidade automatica entre equipes.

## 7. Regras de seguranca e acesso

- autenticacao obrigatoria;
- permissoes minimas de leitura, criacao, edicao e exclusao no escopo CRM Agenda;
- isolamento por `empresa_id` obrigatorio no banco e na API.

## 8. Criterios de aceite minimos

- criar evento simples com sucesso;
- listar com filtros por periodo e status;
- editar campos principais sem quebrar identidade do evento;
- registrar RSVP de participante autenticado;
- excluir evento respeitando tenant e permissao.

## 9. Backlog imediatamente derivado

- CRM-031: checklist de QA funcional da Agenda v1.
- CRM-032: backlog tecnico de sincronizacao externa de calendario.
- CRM-033: politica de notificacao e lembretes desacoplada do dominio Agenda.

Resultado: Agenda deixa de depender apenas de docs de implementacao e passa a ter contrato funcional minimo v1.
