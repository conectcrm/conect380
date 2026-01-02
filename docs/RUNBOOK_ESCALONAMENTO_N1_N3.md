# Runbook de Escalonamento N1 → N2 → N3

Objetivo: padronizar quando e como escalar tickets, quais campos preencher e quais notificações acionar. Usar sempre a paleta e terminologia Crevasse no frontend.

## Critérios de escalonamento
- N1 → N2: problema técnico moderado, dependência de especialista, bloqueio parcial de operação.
- N2 → N3: incidente crítico, impacto amplo ou risco de churn; severidade ALTA/CRITICA; SLA em risco/violado.
- Sempre registrar motivo claro (reason) e contexto (logs, passos já feitos).

## Campos do ticket a preencher/atualizar
- `severity`: BAIXA/MEDIA/ALTA/CRITICA (usar severity adequada).
- `assignedLevel`: N1/N2/N3 conforme destino.
- `escalationReason`: resumo curto (ex: "bug crítico em faturamento"), obrigatório ao escalar.
- `slaTargetMinutes` e `slaExpiresAt`: ajuste se o nível exigir prazo menor.
- `filaId` / `atendenteId`: informar o destino ao reatribuir.
- `prioridade`: revisar; prioridade ALTA/URGENTE deve acionar `ticket-priority-high`.

## Ações no backend (API)
- Escalar: `POST /api/atendimento/tickets/:id/escalar` com `{ level, reason, slaTargetMinutes?, slaExpiresAt? }`.
- Desescalar: `POST /api/atendimento/tickets/:id/desescalar` com `{ reason? }`.
- Reatribuir: `PATCH /api/atendimento/tickets/:id/reatribuir` com `{ filaId?, atendenteId?, assignedLevel?, severity? }`.

## Ações no frontend (service/hook)
- `ticketsService.escalar(id, empresaId, { level, reason, slaTargetMinutes?, slaExpiresAt? })`.
- `ticketsService.desescalar(id, empresaId, { reason? })`.
- `ticketsService.reatribuir(id, empresaId, { filaId?, atendenteId?, assignedLevel?, severity? })`.
- Enum normalizado: levels (N1/N2/N3), severidade (baixa/media/alta/critica), prioridade (baixa/normal/alta/urgente).

## Checklists por nível
- N1
  - Coletar contexto mínimo (erro, passos, canal, cliente afetado).
  - Registrar `severity` e `priority` coerentes; confirmar fila correta.
  - Se bloqueio parcial, considerar escalar para N2.
- N2
  - Validar reprodução e logs; anexar evidências no ticket.
  - Definir/ajustar `slaTargetMinutes` e `slaExpiresAt`.
  - Escalar para N3 se impacto crítico ou dependência de core.
- N3
  - Acionar owner do domínio; registrar workaround e tempo estimado.
  - Atualizar ticket a cada marco relevante; planejar follow-up.

## Mensagens/respostas rápidas (sugestões)
- Aviso de escalonamento: "Estamos escalando seu atendimento para um especialista (N{nivel}); manteremos você atualizado." 
- Aviso de desescalonamento: "Seu atendimento retornou para o time N1/N2 para continuidade; seguimos monitorando." 
- Atualização de SLA: "Seu chamado permanece em tratamento. Prazo estimado: {hora}."

## Notificações e alertas
- Políticas ativas: `ticket-escalation` e `ticket-priority-high` → canais WhatsApp/SMS/Push.
- Para tickets ALTA/URGENTE ou escalados, confirme que o payload inclui empresa/ticket/level/severity.
- Falha de envio já loga e não bloqueia o fluxo; monitorar DLQ/backoff se houver alertas do channel-notifier.

## Boas práticas
- Sempre preencher `reason` ao escalar/desescalar.
- Evitar loops: desescalar só após solução clara ou validação do nível superior.
- Manter o ticket atualizado com timestamps relevantes (escalationAt, slaExpiresAt).
- Usar `reatribuir` quando mudar fila/atendente ou ajustar nível/severidade simultaneamente.
