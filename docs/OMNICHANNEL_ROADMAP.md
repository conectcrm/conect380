# Roadmap Omnichannel, Bot e Escalonamento N2/N3

## Objetivo
Estabelecer guia para avaliar e evoluir o fluxo omnichannel (WhatsApp, bot, handoff, filas, N2/N3, SLA, métricas) seguindo boas práticas de mercado.

## Fases e Entregáveis

### Fase 1 – Diagnóstico e fundação
- [x] Mapear produtores da fila `notifications`: identificar `jobName` usados; definir fallback padrão seguro e garantir gravação de `jobName` na DLQ. **Resultado:** nenhum produtor Bull usando `notifications` encontrado no backend; precisamos definir os produtores e incluir `jobName` obrigatório (ou fallback seguro) antes de ativar reprocessamento dessa fila.
- [x] Levantar modelo de dados de ticket: campos atuais vs. necessários (priority, severity, assignedLevel, escalationReason, escalationAt, slaTarget). **Resultado:**
	- Campos existentes: status/prioridade (upper), datas (abertura, primeira resposta, resolução, fechamento, última mensagem), canal/fila/atendente/empresa/departamento, contato (tel/nome/email/foto), tags.
	- Gaps: severity, assignedLevel (N1/N2/N3), escalationReason, escalationAt, slaTargetMinutes/slaExpiresAt; falta sinalização de SLA warning/breach; enums de status/prioridade nos DTOs estão em lowercase (divergem da entity).
	- Plano técnico: adicionar campos na entity; incluir nos DTOs com validação; migration para criar colunas e normalizar enums; opcionalmente expor filtros de severity/assignedLevel.
- [x] Levantar fluxos de bot/handoff: regras atuais de decisão para N1/N2/N3, triggers (intents, score, horário, idioma). **Resultado:**
	- Regras atuais: keyword detecta categoria (confiança ≥ 0.80) → confirma atalho e transfere para núcleo; timeout (5/10 min) oferece 1 continuar / 2 atendente / 3 cancelar; menus ganham opção "Não entendi" que transfere para núcleo.
	- Pontos de handoff: escolha "2" no timeout ou opção "ajuda"; confirmação de atalho também encaminha para núcleo.
	- Gaps: sem níveis N1/N2/N3 explícitos; sem triggers por horário/idioma; não registra motivo/destino do handoff no ticket; sem fallback para confiança < 0.80; não há intents NL ou score contínuo; ausência de roteamento por skill/urgência além do keyword.
- [x] Inventário de métricas: hoje apenas filas; falta KPIs de atendimento (FRT, AHT, TTR, %transfer, %escalation, SLA hit/miss). **Resultado:**
	- Já existem métricas Prometheus declaradas (não sabemos se acionadas): tickets (criados/encerrados/transferidos, abertos gauge, tempo de vida, primeira resposta), mensagens (enviadas/recebidas/erros, latência), atendentes (online, capacidade, tempo atendimento), bot/triagem (sessões iniciadas/completadas/abandonadas, tempo de triagem, desistência), filas Bull (jobs total/status, duração, waiting gauge).
	- Lacunas: não há coleta explícita de FRT/AHT/TTR nos services de atendimento; não há métricas de %transferência/%escalonamento ou SLA hit/miss; não há binding dos counters/histograms em flows de ticket/chat; falta painel consolidado e alertas; não há métricas por nível (N1/N2/N3) ou por severity.
- [x] Inventário de canais: hoje WhatsApp; mapear gaps para e-mail, chat web, Instagram/Telegram. **Resultado:**
	- Implementado: WhatsApp (cloud API oficial via webhook/queues); bot/handoff e métricas já usam esse canal.
	- Handlers prontos na fila `notifications` para SMS (Twilio) e Push (FCM), com retry/backoff e alerta ao admin; **pendente**: produtores reais dos canais/publicação a partir dos serviços de domínio.
	- Sinais de intenção para e-mail/SMTP/SES em `.env` e `.env.production.example`, mas sem pipeline de atendimento (inbox → ticket) identificado.
	- Não identificado: chat web, Instagram, Telegram; ausência de serviços/rotas para esses canais na árvore atual.
	- Próximo: planejar integração do próximo canal (sugestão: e-mail ou chat web) reutilizando arquitetura de filas + SLA + escalonamento.

### Fase 2 – Hardening de mensageria e DLQ
- [x] Definir `jobName` padrão nos produtores de `notifications`; ajustar DLQ/reprocess para usar fallback seguro. **Status:** enum `NotificationJobName` atualizado (inclui `notify-user`); reprocessamento da DLQ rejeita `jobName` ausente/inválido; **producer/processor mínimos criados** (`notifications.queue-producer.ts` + `notifications.processor.ts`) para `notify-user`; **SLA risk/violation** agora emitem `notify-user` para o admin (deduplicado por status/ticket e não quebra fluxo quando a fila falha). **Plano:** padronizar payload com `context` e ligar falha de envio externa ao producer.
 - [x] Políticas de retry/backoff por tipo de erro (4xx/429 vs 5xx) e circuit breaker para WhatsApp API. **Status:** fila `notifications` com backoff exponencial 5s, `removeOnFail: false`, utilitário de estratégia por código (`retry-strategy.ts`) com jitter aplicado; **breaker por jobName** (pausa após 5 falhas consecutivas do job, retoma em 60s); presets reutilizáveis (`RETRY_META_TRANSIENT`, `RETRY_META_RATE_LIMIT`) e matriz de canais em `channel-policy` + helper `channel-notifier` já usados em SLA, backlog/breaker e tickets ALTA/URGENTE. Handlers de WhatsApp/SMS/Push descartam 4xx≠429, respeitam Retry-After (cap 2min) e alertam admin na última tentativa. **Pendência opcional:** ampliar uso dos canais externos em outros domínios e descontinuar o legado `backend/email-server.js` se não houver consumidores.
- [x] Governança operacional da fila `notifications` (alertas internos). **Status:**
		- Se `NOTIFICATIONS_ADMIN_USER_ID` estiver definido, abertura de breaker em `notifications` e backlog acima de `NOTIFICATIONS_BACKLOG_THRESHOLD` (cooldown 5min) enviam alerta via `notify-user`.
		- SLA em risco/violado enfileira `notify-user` para o admin, deduplicado por status/ticket; falha ao enfileirar é logada e não interrompe o cálculo de SLA.
		- Email tem handler real via SMTP com retry/jitter; falha na última tentativa notifica admin com contexto.
		- **WhatsApp**: integrado à Cloud API (Graph v21) com validação de payload/telefone, truncamento de texto, retry/backoff herdado do Bull e alerta ao admin na última tentativa.
		- **SMS**: integrado à Twilio (`TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM`), normalização E.164, truncamento seguro, retry/backoff e alerta ao admin na última tentativa.
		- **Push**: integrado via FCM (`FCM_PROJECT_ID` obrigatório; `FCM_SERVICE_ACCOUNT_JSON` ou ADC), inicialização única, envio notification+data, retry/backoff e alerta ao admin na última tentativa.
		- **Produtores expostos:** `NotificationChannelsService` disponível no módulo de notifications para enfileirar WhatsApp/SMS/Push. Já adotado em SLA alerts e alerts operacionais de breaker/backlog; demais pontos de domínio podem reutilizar.
- [x] Governança de DLQ: `dlqAttempt` máx, logs de causa raiz, reprocessamento com filtros. **Status:**
	- DLQ recebe `error` normalizado (`errCode/httpStatus/originQueue/jobName/payloadHash/failedAt`).
	- Reprocessamento valida `jobName` de notificações, impõe `MAX_DLQ_ATTEMPT = 3`, reporta descartes e aceita filtros (jobName/errCode/período) com alerta se DLQ passar do limiar.
	- **Auditoria implementada:** tabela `dlq_reprocess_audit` + persistência em arquivo (`DLQ_AUDIT_FILE`), ação identificada por `actionId/actor`, webhook opcional (`DLQ_ALERT_WEBHOOK_URL`) com payload enriquecido (stats, filtros, sample, status).
**Próximos passos (Fase 2):**
	- Produtores de e-mail agora padronizados via fila: MailService, EmailIntegradoService (propostas) e CotacaoEmailService enfileiram `send-email` com `context`; falhas de enqueue disparam `notify-user` se `NOTIFICATIONS_ADMIN_USER_ID` estiver definido.
	- Handler real de e-mail permanece no `notifications.processor` (SMTP via nodemailer) com retry/jitter; handlers reais de WhatsApp/SMS/Push já implementados, aguardando produtores dos canais.
	- Policy `ticket-escalation` criada (WhatsApp/SMS/Push) para alertar escalonamentos; `ticket-priority-high` agora também envia via Push além de WhatsApp/SMS.
	- `.env.example` e `OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md` atualizados para `TWILIO_FROM` + credenciais FCM (projectId + service account/ADC), alinhando env com os handlers reais.
	- Identificado legado `backend/email-server.js` ainda com `createTransport`; marcado como legado a descontinuar ou migrar para a fila se ainda houver uso.
	- Garantir variáveis: `NOTIFICATIONS_ADMIN_USER_ID`, `SMTP_FROM/SMTP_USER/SMTP_PASS`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `FCM_PROJECT_ID` (e `FCM_SERVICE_ACCOUNT_JSON` ou credencial ADC), `NOTIFICATIONS_BACKLOG_THRESHOLD` (opcional) e URLs usadas nos templates (ex.: `FRONTEND_URL`).
	 - Garantir variáveis: `NOTIFICATIONS_ADMIN_USER_ID`, `NOTIFICATIONS_ADMIN_PHONE` (E.164, 10–15 dígitos, usado em SLA/backlog/breaker e tickets ALTA/URGENTE), `SMTP_FROM/SMTP_USER/SMTP_PASS`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `FCM_PROJECT_ID` (e `FCM_SERVICE_ACCOUNT_JSON` ou credencial ADC), `NOTIFICATIONS_BACKLOG_THRESHOLD` (opcional) e URLs usadas nos templates (ex.: `FRONTEND_URL`).

### Fase 3 – Modelo de ticket e escalonamento
- ✅ Implementado: entity/DTOs com priority, severity, assignedLevel (N1/N2/N3), escalationReason, escalationAt, slaTargetMinutes/slaExpiresAt; migration `1781000000000-AddTicketSeverityEscalation` já executada.
- ✅ API/serviço: rotas `escalar`, `desescalar`, `reatribuir` (ajusta fila/atendente/nivel/severidade) e prioridade; políticas de notificação `ticket-escalation` e `ticket-priority-high` enviam WhatsApp/SMS/Push.
- ✅ Frontend: service/hook de tickets expõe filtros de prioridade/severidade/nivel e ações de escalar/desescalar/reatribuir, normalizando enums para o backend.
- Templates de resposta e checklists por nível (runbooks breves) com anotações no ticket. **Pendência.**

### Fase 4 – Roteamento e SLA
- Roteamento por skill/prioridade/VIP: usar prioridade de job Bull e filtro por skill set do agente.
- ✅ SLA engine mínima: policy `sla-alert` agora inclui WhatsApp/SMS/Push; `SlaMonitorMinimoService` em `atendimento.module` roda via `setInterval` (config: `SLA_MONITOR_ENABLED`, `SLA_MONITOR_INTERVAL_MS`, `SLA_MONITOR_BATCH`, `SLA_WARNING_THRESHOLD`, `SLA_ALERT_COOLDOWN_MS`, admin `NOTIFICATIONS_ADMIN_PHONE`/`USER_ID`); dedup por ticket/status com cache + cooldown; eventos de warning/breach enfileiram `notify-user` e registram logs.
- Alertas: webhook/e-mail/WhatsApp interno para breaches, backlog alto ou DLQ crescente (continuar expandindo produtores reais e métricas de saúde).

Como testar rapidamente (dev/local):
1) Definir envs no backend: `SLA_MONITOR_ENABLED=true`, `SLA_MONITOR_INTERVAL_MS=10000` (10s para teste), `SLA_WARNING_THRESHOLD=0.7`, `SLA_ALERT_COOLDOWN_MS=60000`, `NOTIFICATIONS_ADMIN_USER_ID` e/ou `NOTIFICATIONS_ADMIN_PHONE` (E.164).
2) Criar/ajustar um ticket aberto com `prioridade`, `severity`, `assignedLevel` e opcionalmente `slaTargetMinutes` ou `slaExpiresAt` curto (ex.: 15 minutos à frente) para forçar warning/breach.
3) Rodar backend (`npm run start:dev`) e observar logs do `SlaMonitorMinimoService`; esperar emissão de `SLA_WARNING` (~70% consumido) e `SLA_BREACH` após deadline.
4) Verificar fila `notifications`: presença de jobs `notify-user` com `context.source = sla-monitor-minimo`; confirmar recebimento em WhatsApp/SMS/Push conforme policy `sla-alert` e admin configurado.

### Fase 5 – Bot e handoff
- Orquestrador de conversas: estado, intents, confiança, regras de handoff (score baixo, intent crítica, horário/idioma).
- Registrar no ticket motivo e destino do handoff (Nível/Núcleo/Fila).
- Fallback contextual antes de escalar (clarifying questions) para reduzir transferências desnecessárias.

### Fase 6 – Métricas e observabilidade
- KPIs: FRT, AHT, TTR, SLA hit/miss por prioridade, %transferência, %escalonamento, backlog por status/nível.
- Tracing leve (request_id/correlation_id) entre bot → roteador → agente.
- Painéis: filas + atendimento (Prometheus/Grafana) e alertas configurados.

### Fase 7 – Qualidade e auditoria
- Log estruturado de roteamento/escalonamento (quem/por quê/para onde).
- Amostragem de QA: marcar tickets para revisão, checklist de qualidade, feedback.
- Auditoria de DLQ reprocessada (quem reprocessou, quantos jobs, resultado).

### Fase 8 – Canais e expansão
- Planejar integração próxima (e-mail ou chat web) reutilizando a arquitetura de filas, SLAs e escalonamento.
- Unificar modelo de mensagem/ticket para múltiplos canais.

## Uso prático (por onde começar)
1) Executar Fase 1 para mapear riscos: `notifications` jobName, campos de ticket faltantes, gaps de bot/handoff.
2) Endurecer mensageria e DLQ (Fase 2) para evitar perda de eventos.
3) Implementar escalonamento no ticket + API (Fase 3) e rotas de SLA/alerta (Fase 4) para suporte N2/N3.
4) Evoluir bot/handoff (Fase 5) e adicionar KPIs/observabilidade (Fase 6).
5) Fechar com QA/auditoria (Fase 7) e planejar novo canal (Fase 8).
