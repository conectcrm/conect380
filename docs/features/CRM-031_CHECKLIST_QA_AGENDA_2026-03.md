# CRM-031 - Checklist de QA e Sign-off da Agenda v1 (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional do modulo Agenda com base em [CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md](CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato funcional da Agenda publicado: `docs/features/CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md`
- [x] Backlog tecnico de sincronizacao externa publicado: `docs/features/CRM-032_BACKLOG_TECNICO_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`
- [x] Controller do modulo identificado e revisado: `backend/src/modules/agenda/agenda.controller.ts`
- [x] DTOs vigentes revisados: `backend/src/modules/agenda/dto/agenda-evento.dto.ts`
- [x] Entidade vigente revisada: `backend/src/modules/agenda/agenda-evento.entity.ts`
- [x] Documento de implementacao existente rotulado como evidência tecnica, nao contrato funcional: `docs/implementation/AGENDA_INTEGRADA_NOTIFICACOES.md`
- [ ] Evidencia automatizada de smoke API da Agenda publicada em `docs/features/evidencias/`.
- [ ] Evidencia de QA manual da UI da Agenda publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Criar evento simples com `titulo` e `inicio` funciona sem erro.
- [ ] Criar evento com `fim`, `descricao`, `local` e `color` persiste corretamente.
- [ ] Criar evento `all_day` funciona e aparece corretamente na UI.
- [ ] Listagem por periodo retorna somente eventos esperados do tenant.
- [ ] Filtro por `status` funciona.
- [ ] Filtro por `prioridade` funciona.
- [ ] Filtro por `busca` funciona.
- [ ] Filtro por `interacao_id` funciona quando houver vinculo.
- [ ] Detalhamento `GET /agenda-eventos/:id` retorna payload coerente com o contrato.
- [ ] Atualizacao parcial via `PATCH /agenda-eventos/:id` preserva identidade do evento.
- [ ] Exclusao via `DELETE /agenda-eventos/:id` remove o evento do contexto do tenant.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de participantes e RSVP

- [ ] Endpoint `GET /agenda-eventos/participants` responde com lista valida de participantes.
- [ ] Evento com `attendees` persiste participantes corretamente.
- [ ] RSVP `pending` funciona.
- [ ] RSVP `confirmed` funciona.
- [ ] RSVP `declined` funciona.
- [ ] Resposta de RSVP fica refletida em `attendee_responses` sem afetar outros participantes.

Responsavel Produto:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Endpoints exigem autenticacao.
- [ ] Leitura respeita `empresa_id`.
- [ ] Criacao respeita `empresa_id` do contexto autenticado.
- [ ] Atualizacao de evento de outro tenant e bloqueada.
- [ ] Exclusao de evento de outro tenant e bloqueada.
- [ ] Permissoes de Agenda (read/create/update/delete) estao coerentes com os cenarios de uso.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao de UX e operacao

- [ ] Agenda carrega sem erro no frontend.
- [ ] Fluxo de criacao de evento via modal esta consistente.
- [ ] Edicao de evento via UI esta consistente.
- [ ] Exclusao via UI apresenta confirmacao e feedback adequados.
- [ ] Feedback visual para erro de validacao esta consistente.
- [ ] Integracao com notificacoes nao gera duplicidade ou ruido operacional evidente.

Responsavel UX/Produto:
Data:
Observacoes:

## 7. Decisao final

- Status final: [ ] GO  [ ] NO-GO
- GO tecnico: [ ] SIM  [ ] NAO
- GO produto: [ ] SIM  [ ] NAO
- Condicionantes (se houver):
- Data da decisao:
- Responsavel final:

## 8. Proxima acao apos decisao

- [ ] Publicar evidencias de QA em `docs/features/evidencias/`.
- [x] Backlog complementar de sincronizacao externa de calendario (CRM-032) publicado.
- [ ] Atualizar `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md` quando houver validacao automatizada e operacional suficiente.
