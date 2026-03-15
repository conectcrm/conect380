# ATD-EMAIL-001 - Minuta de Requisitos do Canal Email no Omnichannel

Status: Minuta inicial para refinamento
Origem: lacuna formal registrada em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
Data: 2026-03
Escopo: Atendimento / Omnichannel / canal Email

## 1. Objetivo

Formalizar o canal Email como parte do Omnichannel, cobrindo:

- recebimento inbound;
- envio outbound;
- vinculacao a ticket e cliente;
- rastreabilidade operacional e auditoria.

## 2. Estado atual observado

Evidencias tecnicas localizadas:

- enum de canal inclui `email`;
- ticket possui `contato_email`;
- modulo atendimento referencia `EmailSenderService`;
- documentacao setorial cita email como canal possivel.

Conclusao:

- existe lastro tecnico parcial para envio e modelagem;
- nao existe ainda contrato funcional vigente do canal como produto completo.

## 3. Escopo funcional minimo esperado

### 3.1 Inbound

O sistema deve permitir recebimento de emails e transformacao em atendimento rastreavel.

Requisitos minimos:

- identificar empresa/canal destinatario;
- criar ou correlacionar ticket;
- registrar remetente, assunto, corpo e anexos;
- manter trilha de mensagens do atendimento.

### 3.2 Outbound

O atendente deve conseguir responder por email a partir do ticket.

Requisitos minimos:

- envio usando canal configurado da empresa;
- persistencia do corpo enviado;
- registro de status de envio;
- auditoria do usuario responsavel.

### 3.3 Vinculo com CRM

O atendimento por email deve poder ser associado a cliente conhecido ou gerar contexto minimo para identificacao posterior.

### 3.4 SLA e fila

O canal email deve herdar regras de fila, ownership, prioridade e SLA do modulo Atendimento.

## 4. Entidades e dados minimos

- canal do tipo `email` com provider/configuracao;
- ticket com `contato_email` e origem `EMAIL`;
- mensagem com direcao inbound/outbound, assunto e corpo;
- anexos vinculados a mensagem;
- metadata de threading quando existir integracao com provedor.

## 5. Regras operacionais obrigatorias

- um email inbound nao pode ficar sem ticket associado;
- replies outbound devem manter correlacao com o ticket de origem;
- anexos precisam respeitar politicas de tamanho e auditoria;
- reenvio e falha de entrega devem ser observaveis.

## 6. Fora de escopo desta minuta inicial

- caixa compartilhada multiagente com sincronizacao IMAP completa;
- rules engine avancado de roteamento por assunto;
- classificacao automatica por IA como requisito obrigatorio;
- assinatura HTML rica padronizada por marca;
- warm-up, reputacao e deliverability avancada.

## 7. Dependencias para contrato v1

- definir provider suportado por fase: SMTP, SendGrid, SES ou outro;
- definir modelo de inbound: webhook, polling ou alias encaminhado;
- definir regras de threading e deduplicacao;
- definir politica de anexos;
- definir checklist de QA e homologacao.

## 8. Criterios de aceite de uma futura v1

- receber email e criar ticket corretamente;
- responder ticket por email com rastreabilidade;
- manter historico inbound/outbound no mesmo contexto;
- exibir remetente, assunto e anexos na timeline;
- registrar falhas de envio com observabilidade minima.

## 9. Proximos documentos necessarios

- backlog tecnico do canal email;
- contrato de integracao com provider escolhido;
- checklist de QA do fluxo inbound/outbound.

Resultado: a promessa de email omnichannel deixa de estar completamente sem forma e passa a ter minuta inicial de requisito.
