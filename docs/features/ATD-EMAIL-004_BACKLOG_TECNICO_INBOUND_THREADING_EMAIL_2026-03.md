# ATD-EMAIL-004 - Backlog Tecnico de Inbound e Threading do Canal Email (2026-03)

Status: Backlog tecnico inicial para fase seguinte
Origem: derivado de `ATD-EMAIL-002_CONTRATO_FUNCIONAL_CANAL_EMAIL_OMNICHANNEL_2026-03.md`
Data: 2026-03
Escopo: Atendimento / Omnichannel / inbound email e threading

## 1. Objetivo

Definir o backlog tecnico minimo para evoluir o canal Email do suporte outbound atual para um canal omnichannel completo com inbound, threading e correlacao com tickets.

## 2. Premissas

- o v1 atual do canal email cobre configuracao e envio outbound;
- inbound completo ainda nao existe como contrato funcional fechado no repositório;
- threading e correlacao precisam ser tratados como parte do dominio, nao como detalhe de provider;
- qualquer fase seguinte deve preservar tenant, auditoria e contexto de ticket.

## 3. Historias tecnicas propostas

### ATDEMAIL004-01 - Ingestao inbound por provider

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - definir modo de entrada: webhook, polling ou alias encaminhado;
  - normalizar payload inbound para formato unico interno;
  - mapear remetente, assunto, corpo e anexos.
- Criterios de aceite:
  - um email inbound chega ao tenant correto;
  - payload bruto e normalizado ficam rastreaveis.

### ATDEMAIL004-02 - Correlacao inbound com ticket

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - politica de correlacao por `message-id`, `references`, `in-reply-to` ou regras equivalentes;
  - criacao de ticket quando nao houver correlacao valida;
  - reutilizacao do ticket quando a conversa ja existir.
- Criterios de aceite:
  - email novo cria ticket;
  - reply inbound cai no ticket correto sem duplicidade indevida.

### ATDEMAIL004-03 - Threading outbound/inbound

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - armazenar metadados de threading na mensagem/ticket;
  - garantir que respostas outbound preservem contexto tecnico do thread;
  - suportar rastreio minimo de `reply-to` quando aplicavel.
- Criterios de aceite:
  - mensagens relacionadas mantem o mesmo contexto conversacional;
  - operacao consegue investigar porque uma mensagem entrou no ticket errado.

### ATDEMAIL004-04 - Politica de anexos e sanitizacao

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - definir limite de tamanho/tipos aceitos;
  - armazenar anexos com trilha auditavel;
  - rejeitar anexos fora da politica.
- Criterios de aceite:
  - anexos validos entram no fluxo;
  - anexos invalidos sao bloqueados com motivo acionavel.

### ATDEMAIL004-05 - Observabilidade operacional

- Tipo: Story
- Estimativa: 3 pontos
- Entregas:
  - logs por tenant e por thread;
  - fila de erro/reprocessamento para inbound falho;
  - indicadores minimos de sucesso/falha e atraso.
- Criterios de aceite:
  - operacao consegue distinguir falha de provider, falha de correlacao e falha de anexo.

## 4. Dependencias abertas

1. Escolher provider ou modo oficial de inbound.
2. Definir chaves tecnicas de correlacao aceitas.
3. Definir politica de anexos e retenção.
4. Definir se o canal suportara caixas compartilhadas multiagente em fase posterior.

## 5. Fora de escopo deste backlog inicial

- warm-up e deliverability avancada;
- rules engine de classificacao por IA obrigatoria;
- assinatura HTML corporativa rica como requisito de fase;
- multi-provider com roteamento automatico.

## 6. Proximo documento necessario

- contrato funcional v2 do canal Email cobrindo inbound + threading.
- publicado em `docs/features/ATD-EMAIL-005_CONTRATO_FUNCIONAL_INBOUND_THREADING_EMAIL_2026-03.md`.

Resultado: o canal email deixa de depender de promessa ampla para sua fase seguinte e passa a ter backlog tecnico explicito para inbound/threading.
