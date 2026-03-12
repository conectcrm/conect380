# ATD-EMAIL-005 - Contrato Funcional do Inbound e Threading do Canal Email (v2) (2026-03)

Status: Aprovado para baseline funcional de fase seguinte
Origem: evolucao de `ATD-EMAIL-004_BACKLOG_TECNICO_INBOUND_THREADING_EMAIL_2026-03.md`
Data: 2026-03
Escopo: Atendimento / Omnichannel / inbound email, correlacao e threading

## 1. Objetivo

Definir o contrato funcional da fase seguinte do canal Email no Omnichannel, cobrindo recebimento inbound, correlacao com tickets e threading minimo entre mensagens de email.

## 2. Decisoes de fase

- o v1 do canal continua cobrindo configuracao e outbound por ticket;
- esta fase adiciona inbound e threading minimo, sem exigir caixa compartilhada completa como requisito obrigatorio;
- o modo de entrada pode ser webhook, polling ou alias encaminhado, desde que preserve tenant, auditoria e correlacao;
- o canal email continua sendo um canal do modulo Atendimento, nao um inbox isolado fora do ticket.

## 3. Principios

- email inbound deve sempre cair no contexto correto de tenant;
- reply relacionado deve preferir o ticket existente em vez de gerar duplicidade;
- ausencia de correlacao valida pode gerar novo ticket segundo politica oficial;
- threading e parte do dominio do canal, nao detalhe acidental de provider;
- falha de provider, correlacao ou anexo deve ser rastreavel separadamente.

## 4. Entidades e dados minimos da fase

### 4.1 Evento inbound normalizado

Campos minimos:

- `empresaId`
- `provider` ou origem de ingestao
- `fromEmail`
- `toEmail`
- `subject`
- `bodyText` ou `bodyHtml`
- `messageId`
- `references` opcional
- `inReplyTo` opcional
- `receivedAt`
- `attachments` opcionais

### 4.2 Metadados de threading

Campos minimos:

- `messageId` da mensagem atual;
- `parentMessageId` quando houver correlacao direta;
- referencia ao ticket correlacionado;
- status de correlacao (`novo_ticket` | `ticket_existente` | `erro_correlacao` | `ignorado`).

## 5. Operacoes obrigatorias da fase inbound

### 5.1 Ingerir email inbound

Objetivo:

- receber email de origem externa e normalizar seu payload para o dominio interno.

Regras:

- o sistema deve identificar o tenant correto antes de qualquer criacao de ticket ou mensagem;
- payload bruto e payload normalizado devem permanecer rastreaveis;
- email inbound invalido ou sem tenant resolvido nao pode entrar silenciosamente como sucesso.

### 5.2 Correlacionar inbound com ticket existente

Objetivo:

- reutilizar ticket quando o email representa continuidade de conversa existente.

Chaves de correlacao aceitas:

- `message-id`
- `references`
- `in-reply-to`
- assunto ou referencia operacional equivalente quando as chaves tecnicas nao bastarem

Regras:

- correlacao deve preferir identificadores tecnicos do thread;
- fallback por assunto deve ser controlado para nao gerar colisao indevida;
- reply correlacionado deve registrar a mensagem no ticket certo.

### 5.3 Criar ticket novo a partir de inbound nao correlacionado

Regras:

- quando nao houver correlacao valida, o sistema pode criar novo ticket;
- o ticket deve nascer com contexto minimo do remetente, assunto e corpo recebido;
- criacao nova nao pode duplicar ticket quando houver forte indicio de thread existente.

### 5.4 Registrar mensagem inbound no thread do ticket

Regras:

- a mensagem inbound precisa manter referencia tecnica minima ao thread;
- o ticket deve preservar ordem e rastreabilidade das mensagens;
- anexos validos devem ser vinculados de forma auditavel.

### 5.5 Responder outbound preservando threading

Regras:

- respostas outbound do ticket devem preservar metadados necessarios para continuidade do thread quando o provider suportar;
- o sistema deve manter referencia entre mensagem outbound e contexto do thread;
- falta de suporte do provider nao pode apagar a trilha interna do encadeamento.

## 6. Politica oficial de correlacao do v2

- prioridade 1: `in-reply-to` e `references`;
- prioridade 2: `message-id` previamente conhecido no historico do ticket;
- prioridade 3: heuristica controlada por assunto/referencia operacional;
- se nenhuma regra for confiavel, o sistema cria novo ticket ou direciona para excecao operacional conforme configuracao.

## 7. Politica de anexos e sanitizacao

- anexos validos entram no fluxo com trilha auditavel;
- anexos invalidos, grandes demais ou fora da politica devem ser bloqueados com motivo acionavel;
- rejeicao de anexo nao deve destruir automaticamente a rastreabilidade do email inbound.

## 8. Seguranca, isolamento e observabilidade

- inbound deve respeitar tenant e canal configurado;
- logs devem diferenciar erro de provider, erro de correlacao, erro de anexo e erro de persistencia;
- reprocessamento de inbound falho deve ser tecnicamente viavel;
- o sistema nao deve expor conteudo de outro tenant ao tentar correlacionar emails.

## 9. Fora de escopo deste contrato de fase

- multi-provider com roteamento automatico;
- caixa compartilhada multiagente completa como requisito obrigatorio;
- classificacao automatica por IA como parte obrigatoria do inbound;
- deliverability avancada, warm-up e reputacao de dominio;
- SLA especializado alem do que o Atendimento ja aplica genericamente.

## 10. Criterios de aceite minimos

- email inbound chega ao tenant correto;
- reply inbound correlaciona com ticket existente quando houver metadados confiaveis;
- inbound sem correlacao valida pode criar novo ticket de forma controlada;
- mensagens inbound e outbound mantem trilha minima de thread;
- anexos validos entram no fluxo e anexos invalidos geram falha rastreavel;
- operacao consegue distinguir erro de provider, correlacao e anexo.

## 11. Backlog imediatamente derivado

- ATD-EMAIL-006: checklist de QA e sign-off do inbound/threading.
- ATD-EMAIL-007: contrato de provider/arquitetura operacional escolhida quando a fase for implementada.

Resultado: o canal email deixa de ter a fase inbound apenas como backlog tecnico e passa a ter contrato funcional explicito para correlacao e threading.
