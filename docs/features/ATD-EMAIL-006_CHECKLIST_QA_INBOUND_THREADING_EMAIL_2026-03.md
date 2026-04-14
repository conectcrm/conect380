# ATD-EMAIL-006 - Checklist de QA e Sign-off do Inbound e Threading de Email (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional da fase inbound/threading do canal Email com base em [ATD-EMAIL-005_CONTRATO_FUNCIONAL_INBOUND_THREADING_EMAIL_2026-03.md](ATD-EMAIL-005_CONTRATO_FUNCIONAL_INBOUND_THREADING_EMAIL_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato funcional da fase inbound/threading publicado: `docs/features/ATD-EMAIL-005_CONTRATO_FUNCIONAL_INBOUND_THREADING_EMAIL_2026-03.md`
- [x] Backlog tecnico da fase publicado: `docs/features/ATD-EMAIL-004_BACKLOG_TECNICO_INBOUND_THREADING_EMAIL_2026-03.md`
- [x] Checklist do canal outbound/base publicado: `docs/features/ATD-EMAIL-003_CHECKLIST_QA_CANAL_EMAIL_OMNICHANNEL_2026-03.md`
- [ ] Evidencia automatizada do fluxo inbound + correlacao publicada em `docs/features/evidencias/`.
- [ ] Evidencia manual de inbound, correlacao, novo ticket, anexos e resposta publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Email inbound chega ao tenant correto.
- [ ] Payload bruto e payload normalizado permanecem rastreaveis.
- [ ] Reply com `in-reply-to` ou `references` correlaciona com ticket existente.
- [ ] Email sem correlacao confiavel pode criar novo ticket de forma controlada.
- [ ] Mensagem inbound entra no thread correto do ticket.
- [ ] Resposta outbound preserva continuidade minima do thread quando suportado.
- [ ] Email invalido ou sem tenant resolvido nao entra como sucesso silencioso.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Reply relacionado prefere ticket existente em vez de criar duplicidade.
- [ ] Heuristica por assunto nao causa colisao indevida em massa.
- [ ] Criacao de ticket novo so ocorre quando a correlacao nao for confiavel.
- [ ] Canal email continua subordinado ao ticket, nao vira inbox paralelo fora do dominio de Atendimento.

Responsavel Produto/Operacoes:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Correlacao respeita `empresaId` e nao cruza conversas entre tenants.
- [ ] Conteudo inbound nao e exposto fora do tenant correto.
- [ ] Erros de provider, correlacao, anexo e persistencia sao distinguiveis.
- [ ] Reprocessamento de inbound falho preserva trilha auditavel.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao de anexos e sanitizacao

- [ ] Anexos validos entram no fluxo com vinculo auditavel.
- [ ] Anexos invalidos ou fora da politica geram bloqueio com motivo acionavel.
- [ ] Falha de anexo nao apaga a rastreabilidade do email recebido.

Responsavel Operacoes:
Data:
Observacoes:

## 7. Validacao operacional

- [ ] Operacao consegue diferenciar falha de provider, falha de correlacao e falha de anexo.
- [ ] Excecoes operacionais de correlacao sao investigaveis.
- [ ] Processo de homologacao deixa claro qual arquitetura de ingestao foi usada: webhook, polling ou alias encaminhado.

Responsavel Operacoes:
Data:
Observacoes:

## 8. Decisao final

- Status final: [ ] GO  [ ] NO-GO
- GO tecnico: [ ] SIM  [ ] NAO
- GO negocio: [ ] SIM  [ ] NAO
- Condicionantes (se houver):
- Arquitetura homologada de ingestao:
- Data da decisao:
- Responsavel final:

## 9. Proxima acao apos decisao

- [ ] Publicar evidencias dedicadas em `docs/features/evidencias/`.
- [ ] Formalizar contrato de provider/arquitetura operacional escolhida (ATD-EMAIL-007) quando a implementacao entrar em fase real.
- [ ] Revisar politica de excecao operacional caso a correlacao por assunto seja habilitada.
