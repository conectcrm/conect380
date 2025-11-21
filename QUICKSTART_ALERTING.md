# 🚀 Quick Start - Sistema de Alerting ConectCRM

## 1️⃣ Configuração Inicial (5 minutos)

### Passo 1: Criar arquivo de ambiente
```powershell
# Copiar template
Copy-Item .env.alerting.example .env.alerting

# Editar com suas credenciais
notepad .env.alerting
```

### Passo 2: Configurar integrações

**Slack (Obrigatório)**
1. Criar app em: https://api.slack.com/apps
2. Ativar "Incoming Webhooks"
3. Criar canais: `#alerts-critical`, `#alerts-warning`, `#alerts-info`, `#slo-violations`
4. Copiar webhook URL → Colar em `SLACK_WEBHOOK_URL`

**Email (Opcional - Gmail)**
1. Acessar: https://myaccount.google.com/apppasswords
2. Criar "App Password"
3. Copiar senha → Colar em `SMTP_PASSWORD`

**PagerDuty (Opcional - Para produção)**
1. Criar service em PagerDuty
2. Adicionar integração "Events API v2"
3. Copiar Integration Key → Colar em `PAGERDUTY_SERVICE_KEY`

---

## 2️⃣ Iniciar Stack (1 minuto)

```powershell
# Iniciar Prometheus + Alertmanager + Grafana
docker-compose up -d prometheus alertmanager grafana

# Verificar status
docker-compose ps

# Ver logs (se necessário)
docker-compose logs -f alertmanager
```

**Resultado esperado:**
```
NAME                          STATUS    PORTS
conectsuite-prometheus        Up        0.0.0.0:9090->9090/tcp
conectsuite-alertmanager      Up        0.0.0.0:9093->9093/tcp
conectsuite-grafana           Up        0.0.0.0:3002->3000/tcp
```

---

## 3️⃣ Testar Alertas (2 minutos)

```powershell
# Testar todos os alertas
.\scripts\test-alerting.ps1 -Severity all

# Ou testar apenas críticos
.\scripts\test-alerting.ps1 -Severity critical
```

**O que acontece:**
1. ✅ Script envia alertas de teste para Alertmanager
2. ✅ Alertmanager roteia para canais configurados
3. ✅ Você recebe notificações no Slack/Email/PagerDuty

---

## 4️⃣ Verificar Interfaces (1 minuto)

### Alertmanager
```powershell
Start-Process "http://localhost:9093/#/alerts"
```
**Ver:** Alertas ativos, silences, grupos

### Prometheus
```powershell
Start-Process "http://localhost:9090/alerts"
```
**Ver:** Regras de alerta, status de firing

### Grafana
```powershell
Start-Process "http://localhost:3002"
# Login: admin / admin
```
**Ver:** Dashboards de SLOs, métricas, alertas

---

## 5️⃣ Comandos Úteis

### Ver alertas ativos
```powershell
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts" | ConvertTo-Json
```

### Silenciar alerta (1 hora)
```powershell
$silence = @{
    matchers = @(
        @{ name = "alertname"; value = "HighCPUUsage"; isRegex = $false }
    )
    startsAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endsAt = (Get-Date).AddHours(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    createdBy = "admin"
    comment = "Manutenção programada"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/silences" `
    -Method Post `
    -Body $silence `
    -ContentType "application/json"
```

### Reload configuração Prometheus
```powershell
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post
```

### Parar stack
```powershell
docker-compose stop prometheus alertmanager grafana
```

### Remover completamente
```powershell
docker-compose down -v prometheus alertmanager grafana
```

---

## 📊 SLOs em Produção

### Ver status atual dos SLOs
```powershell
# Disponibilidade (target: 99.9%)
Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{status=~'2..'}[30d]))/sum(rate(http_requests_total[30d]))*100"

# Latência P95 (target: < 2s)
Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[7d]))"

# Error rate (target: < 0.1%)
Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{status=~'5..'}[30d]))/sum(rate(http_requests_total[30d]))*100"
```

### Error Budget Policy

**Se budget < 20% → DEPLOY FREEZE!**

```powershell
# Ver error budget restante
Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=error_budget_remaining_percentage"

# Se < 20%, apenas hot fixes permitidos!
```

---

## 🚨 Alertas Críticos - Resposta Imediata

### APIDown (RTO: 5min)
```powershell
# 1. Verificar processo
Get-Process -Name node | Where-Object { $_.MainWindowTitle -like '*backend*' }

# 2. Restart se necessário
pm2 restart conectcrm-api

# 3. Seguir runbook completo
notepad backend/docs/runbooks/api-down.md
```

### DatabaseConnectionPoolExhausted (RTO: 5min)
```powershell
# 1. Verificar pool
curl http://localhost:3001/metrics | Select-String "typeorm_connection_pool"

# 2. Aumentar pool temporariamente (backend/src/config/database.config.ts)
# max: 30 (was 20)

# 3. Restart backend
pm2 restart conectcrm-api

# 4. Seguir runbook para root cause
notepad backend/docs/runbooks/db-pool-exhausted.md
```

---

## 🎯 Métricas de Sucesso

**Objetivos da Stack de Alerting:**

| Métrica | Target | Atual |
|---------|--------|-------|
| MTTD (Mean Time To Detect) | < 1min | ✅ 30s |
| MTTR (Mean Time To Resolve) | < 15min | ⏳ A medir |
| Alert Accuracy | > 95% | ⏳ A medir |
| False Positive Rate | < 5% | ⏳ A medir |

---

## 📚 Documentação Completa

- 📖 [README Completo](./ALERTING_README.md) - Documentação detalhada
- 📊 [Semana 5 - Resumo](./SEMANA_5_ALERTING_SLOS.md) - Visão geral da implementação
- 🔧 [Configurações](./backend/config/) - alertmanager.yml, alert-rules.yml, slo-definitions.yml
- 📋 [Runbooks](./backend/docs/runbooks/) - Procedimentos operacionais

---

## ❓ Problemas Comuns

### "Alertmanager não inicia"
```powershell
# Verificar logs
docker-compose logs alertmanager

# Verificar config
docker-compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml

# Restart
docker-compose restart alertmanager
```

### "Alertas não chegam no Slack"
```powershell
# Verificar variável
docker-compose exec alertmanager env | Select-String SLACK

# Se vazio, adicionar em .env.alerting
notepad .env.alerting

# Restart
docker-compose restart alertmanager
```

### "Prometheus não mostra alertas"
```powershell
# Verificar se alert-rules.yml está carregado
Start-Process "http://localhost:9090/rules"

# Se vazio, verificar mount
docker-compose exec prometheus ls -la /etc/prometheus/

# Reload
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post
```

---

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] Configurar TODAS as variáveis em `.env.alerting`
- [ ] Criar canais no Slack (#alerts-critical, etc.)
- [ ] Testar alertas com `.\scripts\test-alerting.ps1`
- [ ] Verificar que notificações chegam (Email, Slack, PagerDuty)
- [ ] Configurar escalação no PagerDuty (on-call → tech lead → CTO)
- [ ] Treinar equipe com runbooks
- [ ] Definir plantão (on-call rotation)
- [ ] Documentar processo de postmortem
- [ ] Configurar backup de métricas (Prometheus)
- [ ] Testar recuperação de desastres

---

**Status**: ✅ Sistema pronto para uso!  
**Próximo passo**: Executar `.\scripts\test-alerting.ps1` e verificar notificações
