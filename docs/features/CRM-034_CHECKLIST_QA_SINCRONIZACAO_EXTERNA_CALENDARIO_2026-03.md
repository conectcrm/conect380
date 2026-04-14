# CRM-034 - Checklist de QA e Sign-off da Sincronizacao Externa de Calendario (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional da sincronizacao externa de calendario com base em [CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md](CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato funcional da sincronizacao externa publicado: `docs/features/CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`
- [x] Backlog tecnico inicial publicado: `docs/features/CRM-032_BACKLOG_TECNICO_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`
- [ ] Evidencia automatizada do fluxo de conexao e exportacao publicada em `docs/features/evidencias/`.
- [ ] Evidencia manual de conexao, exportacao, atualizacao e desconexao publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Conectar Google Calendar para usuario/tenant elegivel funciona.
- [ ] Conexao invalida ou expirada e detectada corretamente.
- [ ] Evento elegivel criado no CRM e exportado ao provider inicial.
- [ ] Atualizacao do evento no CRM reflete no evento externo vinculado.
- [ ] Desconexao interrompe novas exportacoes.
- [ ] Falha do provider nao corrompe o evento interno.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Agenda interna permanece como fonte de verdade.
- [ ] Alteracao externa nao reescreve o CRM automaticamente no v1.
- [ ] Cancelamento interno nao reativa evento interno por falha externa.
- [ ] Vinculo externo e rastreavel por evento, usuario e tenant.

Responsavel Produto:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Conexao externa respeita `empresaId` e `usuarioId`.
- [ ] Eventos e logs nao vazam entre tenants.
- [ ] Erros de autenticacao e de provider sao distinguiveis.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao operacional

- [ ] Operacao consegue identificar status de conexao, erro e sincronizacao.
- [ ] Rollout pode ser desligado sem impacto na Agenda interna.
- [ ] Logs permitem investigar falhas por provider e evento.

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
- [ ] Refinar backlog da fase bidirecional/importacao externa (CRM-035).
- [ ] Formalizar contrato da fase seguinte se a bidirecionalidade entrar no roadmap.
