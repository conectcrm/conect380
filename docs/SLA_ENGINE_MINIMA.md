# SLA Engine (Mínima)

Objetivo: definir um clock simples de SLA por prioridade/severidade, disparar eventos de aviso/estouro e publicar em `notifications` usando as políticas existentes (WhatsApp/SMS/Push). Mantém compatibilidade com os campos já presentes no ticket (severity, assignedLevel, slaTargetMinutes, slaExpiresAt, escalationReason).

## Escopos e artefatos
- Fonte: tabela `atendimento_tickets` (campos `priority`, `severity`, `assignedLevel`, `slaTargetMinutes`, `slaExpiresAt`).
- Eventos: `SLA_WARNING` (x% do prazo consumido), `SLA_BREACH` (prazo excedido).
- Consumidor downstream: fila `notifications` → policies (`ticket-priority-high`, `ticket-escalation`, `sla-alert` se criado) enviam WhatsApp/SMS/Push.
- Persistência de estado: reutilizar colunas `slaTargetMinutes` e `slaExpiresAt`; opcionalmente tabela `ticket_sla_events` para auditoria.

## Regras de clock (sugestão inicial)
- Se o ticket tiver `slaExpiresAt`, usar como deadline final.
- Senão, calcular `slaExpiresAt = createdAt + slaTargetMinutes` se informado.
- Caso não haja `slaTargetMinutes`, definir default por prioridade:
  - URGENTE: 30 min
  - ALTA: 2 h
  - NORMAL: 8 h
  - BAIXA: 16 h
- Ajustar por severidade (multiplicador):
  - CRITICA: x0.5
  - ALTA: x0.75
  - MEDIA: x1.0
  - BAIXA: x1.25
- Resultado final: `prazo = basePorPrioridade * multiplicadorSeveridade` e `slaExpiresAt = createdAt + prazo` (a não ser que já exista valor mais restritivo fornecido no ticket).

## Disparadores
- `SLA_WARNING`: quando atingir 70% do tempo (configurável). Ex.: deadline em 60 min → warning aos 42 min.
- `SLA_BREACH`: ao ultrapassar deadline.
- De-duplicação: não reenfileirar se já houver evento recente igual para o mesmo ticket (guardar última emissão em cache/DB por eventType).

## Publicação em notifications
- Payload mínimo sugerido:
  ```json
  {
    "policy": "sla-alert", // nova policy ou reaproveitar ticket-priority-high
    "ticketId": "...",
    "empresaId": "...",
    "priority": "ALTA",
    "severity": "CRITICA",
    "assignedLevel": "N2",
    "event": "SLA_WARNING" | "SLA_BREACH",
    "expiresAt": "2025-01-01T10:00:00Z",
    "remainingMinutes": 15
  }
  ```
- Se preferir não criar `sla-alert`, usar `ticket-priority-high` (já com WhatsApp/SMS/Push) para warnings/breaches; `ticket-escalation` pode ser usada ao transicionar nível.
- Respeitar backoff/breaker já existentes em `channel-policy` e `channel-notifier`.

## Processamento (batch)
- Worker periódico (cron) a cada 1 min:
  1. Selecionar tickets abertos/em_atendimento/aguardando com `slaExpiresAt` futuro ou recente.
  2. Calcular `%_consumido = (agora - createdAt) / (deadline - createdAt)` ou usando `slaTargetMinutes`.
  3. Se `% >= limiarWarning` e nenhum warning emitido → emitir `SLA_WARNING`.
  4. Se `agora > deadline` e nenhum breach emitido → emitir `SLA_BREACH`.
  5. Atualizar marcações de última emissão (cache Redis ou tabela `ticket_sla_events`).
- Ajuste para tickets reatribuídos/escalados: recalcular `slaExpiresAt` quando o ticket mudar de nível/prioridade/severidade se a regra de negócio exigir.

## Variáveis/parametrização
- `SLA_WARNING_THRESHOLD` (default 0.7).
- `SLA_DEFAULT_MINUTES_URGENTE|ALTA|NORMAL|BAIXA`.
- `SLA_MULTIPLIER_CRITICA|ALTA|MEDIA|BAIXA`.
- `SLA_CRON_EXPRESSION` (default: */1 * * * *).
- `SLA_ALERT_POLICY` (default: `sla-alert` ou `ticket-priority-high`).

## Observabilidade
- Métricas Prometheus sugeridas:
  - `sla_deadline_seconds` (histogram) por prioridade/severidade.
  - `sla_warning_total`, `sla_breach_total` (counter) por prioridade/severidade/nivel.
  - `sla_remaining_seconds` (gauge) por ticket (amostragem).
  - `notifications_sla_jobs_total` com status (ok/fail) e canal (whatsapp/sms/push).
- Logs estruturados ao emitir warning/breach (ticketId, empresaId, prioridade, severity, remainingMinutes, event).

## Próximos passos de implementação
1) Criar cron/worker no backend que calcula deadlines e emite warnings/breaches (usa `ticket.service` ou job dedicado).
2) Adicionar policy `sla-alert` em `channel-policy.ts` (WhatsApp/SMS/Push) OU reutilizar `ticket-priority-high`.
3) Criar pequeno repositório/cache para de-duplicar eventos (Redis ou tabela `ticket_sla_events`).
4) Expor no frontend o deadline e estado de SLA (barra de progresso/label) e warnings.
5) Instrumentar métricas e logs conforme acima.
