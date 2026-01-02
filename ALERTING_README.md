# 🚨 Sistema de Alerting & SLOs - ConectCRM

Sistema completo de alertas inteligentes, roteamento multi-canal e monitoramento de Service Level Objectives (SLOs).

---

## 📋 Índice

1. [Quickstart](#-quickstart)
2. [Arquitetura](#-arquitetura)
3. [Alertas Configurados](#-alertas-configurados)
4. [SLOs Definidos](#-slos-definidos)
5. [Configuração](#-configuração)
6. [Testando Alertas](#-testando-alertas)
7. [Runbooks](#-runbooks)
8. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quickstart

### 1. Subir a Stack de Observabilidade

```powershell
# Copiar arquivo de exemplo
Copy-Item .env.alerting.example .env.alerting

# Editar variáveis (SLACK_WEBHOOK_URL, SMTP_*, etc.)
notepad .env.alerting

# Iniciar serviços
docker-compose up -d prometheus alertmanager grafana

# Verificar status
docker-compose ps
```

### 2. Acessar Interfaces

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | - |
| **Alertmanager** | http://localhost:9093 | - |
| **Grafana** | http://localhost:3002 | admin/admin |

### 3. Testar Sistema

```powershell
# Testar todos os alertas
.\scripts\test-alerting.ps1 -Severity all

# Testar apenas críticos
.\scripts\test-alerting.ps1 -Severity critical

# Ver alertas ativos
Start-Process "http://localhost:9093/#/alerts"
```

---

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────────────┐
│                    COLETA DE MÉTRICAS                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Backend NestJS (localhost:3001/metrics)                   │
│     ↓                                                      │
│  Prometheus (scrape a cada 15s)                            │
│     ↓                                                      │
│  Avalia Alert Rules (a cada 30s)                           │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  ROTEAMENTO DE ALERTAS                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Alertmanager                                              │
│     ├─ Critical → Email + Slack + PagerDuty (0s wait)      │
│     ├─ Warning  → Email + Slack (30s wait)                 │
│     ├─ Info     → Slack apenas (5m wait)                   │
│     └─ SLO      → #slo-violations (1h wait)                │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                      VISUALIZAÇÃO                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Grafana Dashboards                                        │
│     ├─ SLO Overview                                        │
│     ├─ Error Budget                                        │
│     ├─ Alert History                                       │
│     └─ Performance Metrics                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔔 Alertas Configurados

### Disponibilidade (3 alertas)

| Alerta | Severidade | Condição | Duração | Runbook |
|--------|------------|----------|---------|---------|
| **APIDown** | 🔴 Critical | `up{job="nestjs-api"} == 0` | 1min | [api-down.md](../backend/docs/runbooks/api-down.md) |
| **DatabaseConnectionPoolExhausted** | 🔴 Critical | Pool > 90% | 5min | [db-pool-exhausted.md](../backend/docs/runbooks/db-pool-exhausted.md) |
| **HighHTTPErrorRate** | 🟡 Warning | > 5% erros 5xx | 3min | - |

### Performance (3 alertas)

| Alerta | Severidade | Condição | Duração | Runbook |
|--------|------------|----------|---------|---------|
| **HighLatencyP95** | 🟡 Warning | P95 > 2s | 5min | - |
| **HighLatencyP99** | 🔴 Critical | P99 > 5s | 3min | - |
| **SlowDatabaseQueries** | 🟡 Warning | Query P95 > 1s | 5min | - |

### Recursos (3 alertas)

| Alerta | Severidade | Condição | Duração |
|--------|------------|----------|---------|
| **HighCPUUsage** | 🟡 Warning | CPU > 80% | 10min |
| **HighMemoryUsage** | 🟡 Warning | Memória > 85% | 5min |
| **DiskSpaceRunningOut** | 🔴 Critical | Disco > 90% | 5min |

### Atendimento (3 alertas)

| Alerta | Severidade | Condição | Duração |
|--------|------------|----------|---------|
| **HighTicketQueueSize** | 🟡 Warning | > 50 tickets na fila | 10min |
| **SlowTicketResponseTime** | 🟡 Warning | Média > 30min | 15min |
| **HighTicketAbandonmentRate** | 🔴 Critical | > 15% abandono | 30min |

### SLOs (1 alerta)

| Alerta | Severidade | Condição | Duração |
|--------|------------|----------|---------|
| **ErrorBudgetExhausted** | 🔴 Critical | > 80% budget consumido | 1h |

### Business (2 alertas)

| Alerta | Severidade | Condição | Duração |
|--------|------------|----------|---------|
| **TrafficDropDetected** | 🟡 Warning | Queda > 50% tráfego | 10min |
| **LowConversionRate** | 🔵 Info | < 50% tickets resolvidos | 2h |

**Total: 14 alertas** (5 critical, 7 warning, 2 info)

---

## 📊 SLOs Definidos

### SLO 1: Disponibilidade
- **Target**: 99.9% (30 dias)
- **Error Budget**: 0.1% = **43 minutos/mês**
- **SLI**: `(success_requests / total_requests) * 100`
- **Alerta**: SLOAvailabilityViolation

### SLO 2: Latência
- **Target**: P95 < 2s (7 dias)
- **Error Budget**: 5%
- **SLI**: `histogram_quantile(0.95, http_request_duration_seconds)`
- **Alerta**: SLOLatencyViolation

### SLO 3: Taxa de Erros
- **Target**: < 0.1% erros 5xx (30 dias)
- **Error Budget**: 0.1%
- **SLI**: `(5xx_requests / total_requests) * 100`
- **Alerta**: HighErrorRate

### SLO 4: Primeira Resposta
- **Target**: P90 < 30min (7 dias)
- **Error Budget**: 10%
- **SLI**: `histogram_quantile(0.90, ticket_tempo_primeira_resposta_seconds)`
- **Alerta**: SlowFirstResponse

### SLO 5: Tempo de Resolução
- **Target**: P80 < 4h (30 dias)
- **Error Budget**: 20%
- **SLI**: `histogram_quantile(0.80, ticket_tempo_resolucao_seconds)`
- **Alerta**: SlowResolutionTime

### SLO 6: Database Latency
- **Target**: P95 < 500ms (1 dia)
- **Error Budget**: 5%
- **SLI**: `histogram_quantile(0.95, typeorm_query_duration_seconds)`
- **Alerta**: SlowDatabaseQueries

### SLO 7: Taxa de Conversão
- **Target**: > 60% tickets resolvidos (7 dias)
- **Error Budget**: 10%
- **SLI**: `(tickets_resolvidos / tickets_criados) * 100`
- **Alerta**: LowConversionRate

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Criar arquivo `.env.alerting` a partir do `.env.alerting.example`:

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty
PAGERDUTY_SERVICE_KEY=your-pagerduty-integration-key

# SMTP (Email)
SMTP_USERNAME=alerts@conectcrm.com
SMTP_PASSWORD=your-smtp-app-password

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
```

#### Alertas internos (fila `notifications` no backend)

No backend, alertas críticos são enfileirados via `notify-user` para o admin configurado:

- `NOTIFICATIONS_ADMIN_USER_ID`: **obrigatório** para receber alertas internos (breaker, backlog alto e SLA em risco/violado). Sem esse valor, nenhum alerta interno é enviado.
- `NOTIFICATIONS_BACKLOG_THRESHOLD`: opcional; se definido, alerta de backlog alto da fila de notificações (cooldown 5min).

Detalhes de comportamento:
- SLA: tickets em risco/violados geram `notify-user` deduplicado por status/ticket e não interrompem o fluxo de SLA se a fila falhar.
- Breaker/backlog: abertura de breaker ou backlog acima do limiar envia `notify-user` para o admin quando configurado.
- Email: handler real via SMTP (`SEND_EMAIL`) com retry/jitter; na última tentativa falha notifica admin via `notify-user` com contexto.
- WhatsApp/SMS/Push: handlers ainda no-op; a cada job é enviada notificação ao admin informando que o canal está em modo no-op (payload inclui `context`, `jobId` e destinatário).

### 2. Configurar Slack

1. Criar app em: https://api.slack.com/apps
2. Ativar "Incoming Webhooks"
3. Criar canais:
   - `#alerts-critical`
   - `#alerts-warning`
   - `#alerts-info`
   - `#slo-violations`
4. Adicionar webhook para cada canal
5. Copiar URL do webhook

### 3. Configurar PagerDuty

1. Criar service em PagerDuty
2. Adicionar integração "Events API v2"
3. Copiar "Integration Key"
4. Configurar escalação:
   - Nível 1: On-call engineer (imediato)
   - Nível 2: Tech Lead (após 5min)
   - Nível 3: CTO (após 10min)

### 4. Configurar SMTP (Gmail)

1. Acessar: https://myaccount.google.com/apppasswords
2. Criar "App Password" para "Mail"
3. Copiar senha de 16 caracteres
4. Usar em `SMTP_PASSWORD`

---

## 🧪 Testando Alertas

### Teste Completo (Todos os Alertas)

```powershell
.\scripts\test-alerting.ps1 -Severity all
```

### Teste por Severidade

```powershell
# Apenas críticos
.\scripts\test-alerting.ps1 -Severity critical

# Apenas warnings
.\scripts\test-alerting.ps1 -Severity warning

# Apenas informativos
.\scripts\test-alerting.ps1 -Severity info

# Apenas SLOs
.\scripts\test-alerting.ps1 -Severity slo
```

### Teste Manual (cURL)

```powershell
# Enviar alerta de teste
$alert = @{
    labels = @{
        alertname = "APIDown"
        severity = "critical"
        instance = "localhost:3001"
    }
    annotations = @{
        summary = "Teste manual de alerta"
    }
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/alerts" `
    -Method Post `
    -Body "[$alert]" `
    -ContentType "application/json"
```

### Verificar Alertas Ativos

```powershell
# Via API
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts" | ConvertTo-Json

# Via UI
Start-Process "http://localhost:9093/#/alerts"
```

---

## 📚 Runbooks

Runbooks operacionais para resolução de incidentes:

### Disponíveis
- ✅ [API Down](../backend/docs/runbooks/api-down.md) - RTO: 5min
- ✅ [DB Pool Exhausted](../backend/docs/runbooks/db-pool-exhausted.md) - Análise de root cause

### Em Desenvolvimento
- ⏳ High Latency - Otimização de performance
- ⏳ High Error Rate - Análise de erros 5xx
- ⏳ SLO Violation - Procedimentos gerais

---

## 🔧 Troubleshooting

### Alertmanager não inicia

```powershell
# Verificar logs
docker-compose logs alertmanager

# Verificar config
docker-compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml

# Restart
docker-compose restart alertmanager
```

### Alertas não chegam no Slack

**Problema**: Variável `SLACK_WEBHOOK_URL` não configurada

**Solução**:
```powershell
# Verificar variável
docker-compose exec alertmanager env | Select-String SLACK

# Se vazio, adicionar em .env.alerting e restart
docker-compose restart alertmanager
```

### Prometheus não envia alertas

**Problema**: Alertmanager não está configurado no Prometheus

**Solução**:
```yaml
# Verificar observability/prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

```powershell
# Reload config
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post

# Verificar status
Start-Process "http://localhost:9090/config"
```

### Alert Rules não carregam

**Problema**: Arquivo não montado corretamente

**Solução**:
```powershell
# Verificar se arquivo existe
Test-Path "backend/config/alert-rules.yml"

# Verificar mount no container
docker-compose exec prometheus ls -la /etc/prometheus/

# Validar sintaxe
docker-compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml
```

### Grafana não mostra datasource

**Problema**: Prometheus datasource não provisionado

**Solução**:
```powershell
# Verificar provisioning
docker-compose exec grafana ls -la /etc/grafana/provisioning/datasources/

# Restart Grafana
docker-compose restart grafana

# Verificar datasources via API
Invoke-RestMethod `
    -Uri "http://localhost:3002/api/datasources" `
    -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin")) }
```

---

## 📊 Dashboards Grafana

### SLO Overview
- Disponibilidade 30d, 7d, 1d
- Latência P50, P95, P99
- Error rate
- Ticket metrics (resposta, resolução, conversão)

### Error Budget
- Budget restante por SLO
- Burn rate (taxa de consumo)
- Dias até esgotar
- Histórico de violações

### Alert History
- Alertas disparados nas últimas 24h
- Tempo médio de resolução (MTTR)
- Alertas por severidade
- Top 10 alertas mais frequentes

---

## 🎯 Error Budget Policy

| Budget Restante | Status | Ação | Deploy Frequency |
|-----------------|--------|------|------------------|
| **> 80%** | 🟢 Normal | Operações normais | Múltiplos/dia |
| **50-80%** | 🟡 Caution | Revisar mudanças | 1-2/dia |
| **20-50%** | 🟠 Warning | Foco em confiabilidade | Emergências apenas |
| **< 20%** | 🔴 **FREEZE** | **DEPLOY FREEZE** | Critical fixes only |

---

## 🔗 Links Úteis

- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Alertmanager Config](https://prometheus.io/docs/alerting/latest/configuration/)
- [SLO Workshop by Google](https://sre.google/workbook/slo-engineering/)
- [Error Budget Policy](https://sre.google/workbook/implementing-slos/#defending_slos)

---

**Status**: ✅ Sistema completo implementado!  
**Última atualização**: 17 de novembro de 2025
