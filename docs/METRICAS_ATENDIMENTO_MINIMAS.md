# Métricas mínimas de Atendimento (FRT/AHT/TTR, %Escalonamento, SLA)

Objetivo: estabelecer coleta mínima de métricas de atendimento, alinhada ao modelo de ticket (prioridade, severidade, nível) e aos eventos de escalonamento/SLA.

## Métricas prioritárias
- FRT (First Response Time): tempo do `createdAt` até a primeira resposta do atendente/bot humano (usar `data_primeira_resposta`).
- AHT (Average Handling Time): tempo médio de atendimento (abertura até resolução/fechamento). Pode usar `data_resolucao` ou `data_fechamento`; fallback para `ultima_mensagem_em` se não houver resolução.
- TTR (Time to Resolution): igual AHT quando há `data_resolucao`; senão, `data_fechamento`.
- SLA hit/miss: contagem de tickets por status de SLA (on-time vs. breach) considerando `slaExpiresAt`.
- %Escalonamento: proporção de tickets que receberam `escalar` (mudança de `assignedLevel` N1→N2→N3) sobre o total.
- %Transferência: proporção de tickets reatribuídos (`reatribuir`) em relação ao total.
- Backlog por status/nível/severidade/prioridade: contagem de tickets abertos/em atendimento/aguardando, segmentado.

## Eventos de domínio a instrumentar
- Criação do ticket: incrementa counters (por prioridade/severidade/empresa/canal); registra `createdAt` e `slaExpiresAt`.
- Primeira resposta: seta `data_primeira_resposta` e atualiza histogram FRT.
- Resolução/fechamento: seta `data_resolucao`/`data_fechamento` e atualiza histogram AHT/TTR; avalia SLA hit/miss.
- Escalonar/Desescalar: incrementa counter %Escalonamento; atualizar gauge de tickets por nível.
- Reatribuir: incrementa counter %Transferência; atualizar gauge por fila/atendente.
- SLA warning/breach: counters de evento e optional histogram de remainingSeconds.

## Modelagem em Prometheus (sugestão)
- Counters
  - `tickets_created_total{priority,severity,canal,empresa}`
  - `tickets_escalated_total{from_level,to_level,priority,severity}`
  - `tickets_transferred_total{from_queue,to_queue}`
  - `tickets_sla_warning_total{priority,severity,level}`
  - `tickets_sla_breach_total{priority,severity,level}`
  - `tickets_sla_hit_total{priority,severity,level}`
  - `tickets_sla_miss_total{priority,severity,level}`
- Histograms
  - `tickets_frt_seconds{priority,severity,level}`
  - `tickets_aht_seconds{priority,severity,level}`
  - `tickets_ttr_seconds{priority,severity,level}`
  - (Opcional) `sla_remaining_seconds` amostrado na emissão de warning/breach.
- Gauges
  - `tickets_open_gauge{status,priority,severity,level}`
  - `tickets_backlog_gauge{fila,priority,severity}`

## Pontos de código para inserir métricas (backend)
- `TicketService.criar`: incrementa `tickets_created_total`, define `slaExpiresAt` se não vier, set de labels.
- `TicketService.atualizarStatus` (quando vira resolvido/fechado): calcula AHT/TTR, atualiza histograms e counters de SLA hit/miss.
- `TicketService.escalar/desescalar`: incrementa `tickets_escalated_total`, atualiza gauge por nível.
- `TicketService.reatribuir`: incrementa `tickets_transferred_total`, atualiza gauges de fila/atendente.
- SLA cron (SLA_ENGINE_MINIMA): ao emitir warning/breach, incrementa counters `tickets_sla_warning_total` / `tickets_sla_breach_total`.
- `MensagemService` ou ponto da primeira mensagem do atendente: set `data_primeira_resposta` e histogram FRT.

## Dados necessários no ticket
- `createdAt`, `data_primeira_resposta`, `data_resolucao`, `data_fechamento`, `ultima_mensagem_em`.
- `priority`, `severity`, `assignedLevel`, `slaExpiresAt`, `slaTargetMinutes`.
- `filaId`, `atendenteId`, `canalId`, `empresaId`.

## Alertas sugeridos
- Alerta de SLA breach elevado (> X por hora) por prioridade/severidade.
- Alerta de backlog alto por status/priority/severity.
- Alerta de %Escalonamento acima do baseline (ex.: >20% em 1h) para revisar runbook/triagem.

## Integração com notifications
- Reaproveitar policies existentes:
  - `ticket-priority-high`: pode sinalizar SLA warnings/breaches de ALTA/URGENTE.
  - `ticket-escalation`: pode carregar payload com context de nível/severidade.
  - Se criada `sla-alert`: emitir `event: SLA_WARNING | SLA_BREACH` com canais WhatsApp/SMS/Push.

## Próximos passos de implementação
1) Adicionar contadores/histograms em `TicketService` e serviços de mensagem, seguindo labels acima.
2) Conectar SLA cron (de `SLA_ENGINE_MINIMA`) para emitir warning/breach e atualizar métricas.
3) Expor endpoint de `/metrics` (Prometheus) se não estiver ativo para novos instrumentos.
4) No frontend, exibir SLA/nível/prioridade/severidade e destacar tickets em warning/breach (uso de cores Crevasse e badges padronizados).
