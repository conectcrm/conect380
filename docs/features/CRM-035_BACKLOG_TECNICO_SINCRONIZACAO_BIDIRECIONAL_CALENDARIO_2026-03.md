# CRM-035 - Backlog Tecnico da Fase Bidirecional e Importacao Externa de Calendario (2026-03)

Status: Backlog tecnico inicial para fase seguinte
Origem: derivado de `CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`
Data: 2026-03
Escopo: Agenda / sincronizacao externa / importacao controlada e bidirecionalidade

## 1. Objetivo

Definir o backlog tecnico minimo para evoluir a sincronizacao externa de calendario do modelo outbound controlado do v1 para uma fase com importacao externa e regras bidirecionais explicitamente governadas.

## 2. Premissas

- o v1 tem CRM como fonte de verdade e sincronizacao outbound para Google Calendar;
- bidirecionalidade so pode entrar com ownership e politica de conflito mais estritos;
- importacao externa nao pode criar loops nem duplicidade estrutural na Agenda;
- rollout dessa fase deve continuar controlado por tenant/provider/usuario.

## 3. Historias tecnicas propostas

### CRM035-01 - Ingestao controlada de eventos externos

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - definir webhook, polling ou sync token do provider;
  - normalizar eventos externos elegiveis;
  - classificar evento como novo, vinculado ou ignorado.
- Criterios de aceite:
  - importacao nao duplica eventos ja vinculados;
  - evento externo inelegivel nao invade a Agenda do CRM.

### CRM035-02 - Politica de ownership por tipo de evento

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - definir cenarios em que o dono do evento e CRM, provider ou usuario;
  - permitir marcar eventos como somente leitura importada quando aplicavel;
  - registrar ownership no vinculo de sincronizacao.
- Criterios de aceite:
  - o sistema consegue decidir quem prevalece em cada tipo de evento;
  - ownership fica auditavel.

### CRM035-03 - Resolucao de conflito bidirecional

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - politica formal para conflito de horario, titulo, descricao e cancelamento;
  - estrategia de ultima escrita, prioridade de origem ou conciliacao assistida;
  - fila de excecao para conflito irresolvido automaticamente.
- Criterios de aceite:
  - conflitos nao geram loop de sincronizacao;
  - conflito relevante nao e resolvido silenciosamente sem rastreio.

### CRM035-04 - Cancelamento e exclusao bidirecional

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - tratar exclusao externa e interna com regras diferentes por ownership;
  - impedir recriacao acidental de evento removido legitimamente;
  - registrar motivo de cancelamento/ignoracao.
- Criterios de aceite:
  - evento cancelado segue regra coerente entre sistemas;
  - exclusao externa nao destrói historico interno sem politica formal.

### CRM035-05 - Recorrencia e excecoes

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - mapear series recorrentes e excecoes;
  - impedir que recorrencia complexa seja tratada como evento simples;
  - registrar limites do provider e do dominio interno.
- Criterios de aceite:
  - series simples sao rastreaveis;
  - series complexas fora da fase geram erro/ignoracao controlada.

## 4. Dependencias abertas

1. Definir estrategia oficial de ingestao externa.
2. Definir politica de ownership por caso de uso.
3. Definir suporte a recorrencia e excecoes.
4. Definir se Outlook entra na mesma fase ou em contrato separado.

## 5. Fora de escopo deste backlog inicial

- disponibilidade inteligente multiagenda;
- reserva de salas e recursos corporativos;
- roteamento multi-provider automatico;
- migracao historica massiva de calendarios legados.

## 6. Proximo documento necessario

- contrato funcional da fase bidirecional/importacao externa, se aprovado em roadmap.

Resultado: a fase bidirecional deixa de ser expectativa difusa e passa a ter backlog tecnico governado, separado do v1 outbound.
