# Semana 5: Alerting & SLOs - Implementação Completa

## 🎯 Objetivo
Implementar sistema completo de alertas inteligentes e SLOs (Service Level Objectives) para garantir disponibilidade e performance do ConectCRM.

---

## ✅ O Que Foi Implementado

### 1. **Alertmanager Configuration** (`config/alertmanager.yml`)

#### Roteamento Inteligente
- **4 níveis de severidade**: critical, warning, info, SLO
- **Múltiplos canais**: Email, Slack, PagerDuty
- **Inibição automática**: Warning inibido quando Critical ativo
- **Group by**: Agrupa alertas relacionados

#### Receivers Configurados
```yaml
critical-alerts:  → Email + Slack + PagerDuty
warning-alerts:   → Email + Slack
info-alerts:      → Slack apenas
slo-alerts:       → Canal dedicado #slo-violations
```

#### Timings Otimizados
- **group_wait**: 0s para crítico, 30s para warning
- **repeat_interval**: 5min crítico, 3h warning, 24h info
- **resolve_timeout**: 5min

---

### 2. **Alert Rules** (`config/alert-rules.yml`)

#### 14 Alertas Implementados

**Grupo 1: Disponibilidade (3 alertas)**
1. ✅ **APIDown**: API fora do ar por 1min → CRITICAL
2. ✅ **DatabaseConnectionPoolExhausted**: Pool > 90% → CRITICAL  
3. ✅ **HighHTTPErrorRate**: > 5% erros 5xx → WARNING

**Grupo 2: Performance (3 alertas)**
4. ✅ **HighLatencyP95**: P95 > 2s por 5min → WARNING
5. ✅ **HighLatencyP99**: P99 > 5s por 3min → CRITICAL
6. ✅ **SlowDatabaseQueries**: Query P95 > 1s → WARNING

**Grupo 3: Recursos (3 alertas)**
7. ✅ **HighCPUUsage**: CPU > 80% por 10min → WARNING
8. ✅ **HighMemoryUsage**: Memória > 85% por 5min → WARNING
9. ✅ **DiskSpaceRunningOut**: Disco > 90% → CRITICAL

**Grupo 4: Atendimento (3 alertas)**
10. ✅ **HighTicketQueueSize**: > 50 tickets na fila → WARNING
11. ✅ **SlowTicketResponseTime**: Média > 30min → WARNING
12. ✅ **HighTicketAbandonmentRate**: > 15% abandono → CRITICAL

**Grupo 5: SLOs (1 alerta)**
13. ✅ **ErrorBudgetExhausted**: > 80% budget consumido → CRITICAL

**Grupo 6: Business (2 alertas)**
14. ✅ **TrafficDropDetected**: Queda > 50% de tráfego → WARNING

---

### 3. **SLO Definitions** (`config/slo-definitions.yml`)

#### 7 SLOs Definidos

**SLO 1: Disponibilidade**
- Target: **99.9%** (30 dias)
- Error Budget: **0.1%** = 43min downtime/mês
- Alerta: SLOAvailabilityViolation

**SLO 2: Latência**
- Target: **P95 < 2s** (7 dias)
- Error Budget: **5%** podem exceder
- Alerta: SLOLatencyViolation

**SLO 3: Taxa de Erros**
- Target: **< 0.1% erros 5xx** (30 dias)
- Error Budget: **0.1%**
- Alerta: HighErrorRate

**SLO 4: Primeira Resposta**
- Target: **P90 < 30min** (7 dias)
- Error Budget: **10%**
- Alerta: SlowFirstResponse

**SLO 5: Tempo de Resolução**
- Target: **P80 < 4h** (30 dias)
- Error Budget: **20%**
- Alerta: SlowResolutionTime

**SLO 6: Database Latency**
- Target: **P95 < 500ms** (1 dia)
- Error Budget: **5%**
- Alerta: SlowDatabaseQueries

**SLO 7: Taxa de Conversão**
- Target: **> 60%** tickets resolvidos (7 dias)
- Error Budget: **10%**
- Alerta: LowConversionRate

#### Error Budget Policy

| Budget Restante | Ação | Frequência Deploy |
|---|---|---|
| > 80% | Normal operations | Múltiplos/dia |
| 50-80% | Caution | 1-2/dia |
| 20-50% | Warning | Emergências apenas |
| < 20% | **FREEZE** | Deploy freeze |

---

### 4. **Runbooks Detalhados**

#### Runbook 1: API Down (`docs/runbooks/api-down.md`)
- ✅ Diagnóstico em 2 minutos
- ✅ 4 soluções comuns (processo morto, OOM, DB down, porta ocupada)
- ✅ Checklist de recuperação
- ✅ Procedimento completo (15min)
- ✅ Escalação por tempo
- ✅ RTO: 5 minutos

#### Runbook 2: DB Pool Exhausted (`docs/runbooks/db-pool-exhausted.md`)
- ✅ Diagnóstico SQL detalhado
- ✅ 3 soluções imediatas
- ✅ Root Cause Analysis para 4 causas comuns
- ✅ Code review checklist
- ✅ Configurações recomendadas
- ✅ Prevenção e monitoring

---

## 📊 Arquitetura de Alerting

```
Prometheus (métricas)
    ↓
Alert Rules (avalia a cada 30s)
    ↓
Alertmanager (roteia)
    ↓
    ├── Critical → Email + Slack + PagerDuty
    ├── Warning → Email + Slack
    ├── Info → Slack
    └── SLO → #slo-violations
```

---

## 🚀 Como Usar

### 1. Iniciar Alertmanager

```bash
# Via Docker
docker run -d \
  --name alertmanager \
  -p 9093:9093 \
  -v $(pwd)/backend/config/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
  prom/alertmanager:latest

# Verificar
curl http://localhost:9093/-/healthy
```

### 2. Configurar Prometheus

```yaml
# prometheus.yml
rule_files:
  - 'alert-rules.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

```bash
# Reload config
curl -X POST http://localhost:9090/-/reload
```

### 3. Configurar Variáveis de Ambiente

```bash
# .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_SERVICE_KEY=your-pagerduty-integration-key
SMTP_USERNAME=alerts@conectcrm.com
SMTP_PASSWORD=your-smtp-password
```

### 4. Testar Alertas

```bash
# Simular alerta crítico
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "APIDown",
    "severity": "critical",
    "instance": "localhost:3001"
  },
  "annotations": {
    "summary": "Teste de alerta crítico"
  }
}]'

# Ver alertas ativos
curl http://localhost:9093/api/v1/alerts
```

---

## 📈 Dashboards Recomendados

### Dashboard 1: SLO Overview
```
┌─────────────────────────────────────┐
│ Availability (30d): 99.93% ✅       │
│ Latency P95 (7d): 1.8s ✅           │
│ Error Rate (1h): 0.05% ✅           │
│ First Response (7d): 28min ✅       │
└─────────────────────────────────────┘
```

### Dashboard 2: Error Budget
```
┌─────────────────────────────────────┐
│ Error Budget Remaining: 65%         │
│ Burn Rate: 0.8x (Normal)            │
│ Days Until Exhaustion: 23d          │
└─────────────────────────────────────┘
```

### Dashboard 3: Alertas Ativos
```
┌─────────────────────────────────────┐
│ 🔴 Critical: 0                       │
│ 🟡 Warning: 2 (CPU, Memory)          │
│ 🔵 Info: 1 (Traffic Drop)            │
└─────────────────────────────────────┘
```

---

## 🎓 Conceitos Importantes

### SLI vs SLO vs SLA

**SLI** (Service Level Indicator)
- Métrica que mede o serviço
- Exemplo: % de requisições com status 2xx

**SLO** (Service Level Objective)
- Target/meta da SLI
- Exemplo: 99.9% de disponibilidade

**SLA** (Service Level Agreement)
- Contrato com cliente (SLO + consequências)
- Exemplo: 99.9% ou reembolso de 10%

### Error Budget

**Conceito**: Margem de erro aceitável (1 - SLO)

```
SLO: 99.9% disponibilidade
Error Budget: 0.1% = 43min downtime/mês

Se consumir > 80% do budget:
→ Freeze deploys
→ Focus em estabilidade
```

### Alert Fatigue Prevention

**Problema**: Muitos alertas → Equipe ignora

**Solução**:
1. ✅ Agrupar alertas relacionados
2. ✅ Inibir warnings quando critical ativo
3. ✅ Repeat interval adequado (não spammar)
4. ✅ Severity correta (não tudo critical)
5. ✅ Runbooks claros (resolve rápido)

---

## 🔗 Integrações

### Slack
```bash
# Criar webhook em https://api.slack.com/apps
# Adicionar aos canais:
#alerts-critical
#alerts-warning
#alerts-info
#slo-violations
```

### PagerDuty
```bash
# Criar integration em PagerDuty
# Copiar Integration Key
# Adicionar em alertmanager.yml
```

### Email
```yaml
# Gmail SMTP
smtp_smarthost: 'smtp.gmail.com:587'
smtp_from: 'alerts@conectcrm.com'
smtp_auth_username: 'your-email@gmail.com'
smtp_auth_password: 'app-specific-password'
```

---

## 📝 Próximos Passos

### Curto Prazo (Semana 6)
- [ ] Implementar error budget dashboard
- [ ] Criar template de postmortem
- [ ] Configurar on-call rotation
- [ ] Treinar equipe em runbooks

### Médio Prazo (Semana 7-8)
- [ ] Implementar circuit breaker
- [ ] Adicionar retry automático
- [ ] Health checks avançados
- [ ] Chaos engineering tests

### Longo Prazo (Semana 9-12)
- [ ] Multi-region deployment
- [ ] Auto-scaling baseado em SLO
- [ ] Machine learning para anomaly detection
- [ ] Self-healing automation

---

## 🎯 Métricas de Sucesso

**Objetivos da Semana 5:**
- ✅ 14 alertas configurados e testados
- ✅ 7 SLOs definidos com error budgets
- ✅ 2 runbooks detalhados criados
- ✅ Alertmanager configurado e rodando
- ✅ Integração Slack/Email funcionando

**KPIs:**
- MTTD (Mean Time To Detect): < 1min
- MTTR (Mean Time To Resolve): < 15min
- Alert Accuracy: > 95%
- False Positive Rate: < 5%

---

## 📚 Referências

- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [SLO Workshop by Google](https://sre.google/workbook/slo-engineering/)

---

**Status**: ✅ **COMPLETO** - Semana 5 implementada com sucesso!  
**Próximo**: Semana 6 - Error Budget Management & Postmortems
