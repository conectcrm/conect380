# ATD-EMAIL-003 - Checklist de QA e Sign-off do Canal Email Omnichannel v1 (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional do canal Email no Omnichannel com base em [ATD-EMAIL-002_CONTRATO_FUNCIONAL_CANAL_EMAIL_OMNICHANNEL_2026-03.md](ATD-EMAIL-002_CONTRATO_FUNCIONAL_CANAL_EMAIL_OMNICHANNEL_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Minuta inicial publicada: `docs/features/ATD-EMAIL-001_MINUTA_REQUISITOS_CANAL_EMAIL_OMNICHANNEL_2026-03.md`
- [x] Contrato funcional v1 publicado: `docs/features/ATD-EMAIL-002_CONTRATO_FUNCIONAL_CANAL_EMAIL_OMNICHANNEL_2026-03.md`
- [x] Endpoints de configuracao/teste revisados em `backend/src/modules/atendimento/controllers/canais.controller.ts`
- [x] Fluxo outbound revisado em `backend/src/modules/atendimento/services/mensagem.service.ts`
- [x] Service de envio revisado em `backend/src/modules/atendimento/services/email-sender.service.ts`
- [ ] Evidencia automatizada dedicada do envio outbound por ticket publicada em `docs/features/evidencias/`.
- [ ] Evidencia manual do fluxo de configuracao + teste + envio publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Criar ou garantir canal email do tenant funciona de forma idempotente.
- [ ] Testar configuracao de envio retorna sucesso quando o canal esta corretamente configurado.
- [ ] Testar configuracao retorna falha clara quando a configuracao esta invalida.
- [ ] Envio outbound por ticket com `contatoEmail` funciona.
- [ ] Envio outbound com anexo funciona quando o fluxo da mensagem fornece arquivo.
- [ ] Fluxo nao tenta enviar email quando `contatoEmail` esta ausente.
- [ ] Assunto padrao referencia corretamente o ticket.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Canal email ativo e respeitado no fluxo do ticket.
- [ ] Tenant sem canal email ativo nao recebe falso positivo de envio.
- [ ] O fluxo outbound nao e confundido com inbound completo.
- [ ] O canal email permanece como capacidade de atendimento, nao como modulo isolado.

Responsavel Produto/Operacoes:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Configuracao do canal respeita `empresaId`.
- [ ] Envio outbound usa apenas canal/configuracao do tenant correto.
- [ ] Dados do destinatario nao vazam entre tenants.
- [ ] Falhas de configuracao sao detectaveis sem expor segredos operacionais.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao operacional

- [ ] Operacao consegue distinguir falha de configuracao de falta de destinatario.
- [ ] Logs/retornos permitem rastrear se o email saiu ou nao.
- [ ] Fluxo de teste de email e suficiente para onboarding do tenant.

Responsavel Operacoes:
Data:
Observacoes:

## 7. Decisao final

- Status final: [ ] GO  [ ] NO-GO
- GO tecnico: [ ] SIM  [ ] NAO
- GO negocio: [ ] SIM  [ ] NAO
- Condicionantes (se houver):
- Data da decisao:
- Responsavel final:

## 8. Proxima acao apos decisao

- [ ] Publicar evidencias dedicadas em `docs/features/evidencias/`.
- [ ] Refinar backlog tecnico do inbound/threading de email.
- [ ] Formalizar contrato da fase seguinte se inbound entrar no escopo.
