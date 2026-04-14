# ATD-EMAIL-002 - Contrato Funcional do Canal Email no Omnichannel (v1)

Status: Aprovado para baseline funcional
Origem: evolucao de `ATD-EMAIL-001_MINUTA_REQUISITOS_CANAL_EMAIL_OMNICHANNEL_2026-03.md`
Data: 2026-03
Escopo: Atendimento / Omnichannel / configuracao do canal email + envio outbound por ticket

## 1. Objetivo

Definir o contrato funcional v1 do canal Email no Omnichannel com base no suporte efetivamente observavel no backend atual.

## 2. Principios

- o canal email e um canal de comunicacao do modulo Atendimento;
- o v1 cobre configuracao do canal e envio outbound a partir de ticket;
- inbound completo por email ainda nao faz parte deste contrato v1;
- o fluxo deve respeitar tenant, contexto do ticket e rastreabilidade do envio;
- anexos sao suportados no outbound quando o fluxo de mensagem do ticket os fornecer.

## 3. Superficie funcional observada no v1

### 3.1 Configuracao de canal

O sistema suporta canal do tipo `email` no cadastro de canais.

Evidencias tecnicas observadas:

- enum `TipoCanal.EMAIL`;
- endpoint de teste de configuracao em `POST /atendimento/canais/validar-email`;
- endpoint de criacao inicial de canal em `POST /atendimento/canais/criar-canal-email`;
- `EmailSenderService` com suporte a provedores e envio.

### 3.2 Envio outbound por ticket

O fluxo de envio de mensagem do ticket suporta envio via email quando:

- o ticket possui canal do tipo `email`;
- o ticket possui `contatoEmail`;
- existe configuracao valida do canal email para a empresa.

### 3.3 Modos de envio suportados

- email de texto simples;
- email com anexos;
- teste de configuracao do canal.

## 4. Entidades e dados minimos do v1

### 4.1 Canal de email

Campos/condicoes minimas:

- `empresaId`
- `tipo = email`
- `ativo = true`
- `provider`
- `configuracao` com dados suficientes do provedor

### 4.2 Ticket elegivel para outbound

Campos/condicoes minimas:

- ticket associado ao tenant correto;
- `contatoEmail` preenchido;
- canal associado do tipo `email`.

### 4.3 Mensagem outbound

Campos/condicoes minimas:

- conteudo de texto;
- assunto derivado do ticket;
- anexos opcionais quando fornecidos pelo fluxo de mensagem.

## 5. Operacoes obrigatorias do canal v1

### 5.1 Testar configuracao do canal

Endpoint de referencia: `POST /atendimento/canais/validar-email`

Payload minimo observado:

- `emailTeste`

Regra:

- o sistema deve tentar enviar email de teste usando a configuracao ativa do tenant;
- sucesso ou falha devem ser retornados de forma auditavel para operacao.

### 5.2 Criar canal de email base

Endpoint de referencia: `POST /atendimento/canais/criar-canal-email`

Regra:

- o sistema pode criar canal inicial do tipo email por tenant quando ainda nao existir;
- se o canal ja existir, a operacao deve responder de forma idempotente.

### 5.3 Enviar resposta por email a partir do ticket

Fluxo funcional de referencia:

- envio disparado pelo fluxo normal de mensagens do ticket no `MensagemService` quando `canal.tipo === email`.

Regras:

- se houver `contatoEmail`, o sistema envia a resposta ao email do contato;
- o assunto padrao deve referenciar o ticket;
- se houver anexo no fluxo da mensagem, o email pode ser enviado com anexos;
- se nao houver `contatoEmail`, o sistema nao deve tentar envio e precisa registrar a falha operacional.

## 6. Regras operacionais obrigatorias

- o canal email deve estar ativo e configurado para o tenant;
- o envio outbound deve respeitar o `empresaId` do ticket;
- falhas de configuracao ou ausencia de email do contato devem ser detectaveis;
- o fluxo nao deve tentar mascarar falta de destinatario como sucesso.

## 7. Fora de escopo deste contrato v1

- recebimento inbound completo de emails;
- threading formal por `message-id` e `reply-to`;
- deduplicacao de conversas email;
- classificacao automatica por IA;
- caixa compartilhada multiagente e polling IMAP completo;
- SLA especifico do canal email alem do que o modulo Atendimento ja aplica genericamente.

## 8. Criterios de aceite minimos

- criar ou garantir canal email para o tenant;
- testar configuracao de envio com retorno claro de sucesso/falha;
- enviar mensagem outbound por email a partir de ticket elegivel;
- enviar email com anexo quando houver anexo no fluxo da mensagem;
- bloquear envio quando faltar `contatoEmail`, com trilha operacional coerente.

## 9. Backlog imediatamente derivado

- ATD-EMAIL-003: checklist de QA do canal email v1.
- ATD-EMAIL-004: backlog tecnico do inbound email e threading.
- ATD-EMAIL-005: contrato de integracao com provider escolhido quando houver decisao formal de fase seguinte.

Resultado: o canal email deixa de existir apenas como minuta ampla e passa a ter contrato funcional v1 alinhado ao suporte atual do backend.
