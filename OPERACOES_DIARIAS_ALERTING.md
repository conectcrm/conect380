# 🛠️ Operações Diárias - Sistema de Alerting

Comandos úteis para gerenciar o sistema de alerting no dia a dia.

---

## 🚀 Iniciar/Parar Serviços

### Iniciar Stack Completa
```powershell
# Iniciar tudo (Prometheus + Alertmanager + Grafana)
docker-compose up -d prometheus alertmanager grafana

# Verificar status
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f alertmanager
```

### Parar Serviços
```powershell
# Parar todos
docker-compose stop prometheus alertmanager grafana

# Parar apenas Alertmanager
docker-compose stop alertmanager

# Parar e remover (dados persistem nos volumes)
docker-compose down prometheus alertmanager grafana
```

### Restart Rápido
```powershell
# Restart individual
docker-compose restart alertmanager

# Restart tudo
docker-compose restart prometheus alertmanager grafana
```

---

## 🔍 Verificar Status

### Health Checks
```powershell
# Prometheus
Invoke-RestMethod -Uri "http://localhost:9090/-/healthy"

# Alertmanager
Invoke-RestMethod -Uri "http://localhost:9093/-/healthy"

# Grafana
Invoke-RestMethod -Uri "http://localhost:3002/api/health"
```

### Ver Logs
```powershell
# Últimas 50 linhas
docker-compose logs --tail=50 alertmanager

# Últimas 100 linhas com timestamp
docker-compose logs --tail=100 --timestamps prometheus

# Seguir logs em tempo real
docker-compose logs -f alertmanager

# Buscar erro específico
docker-compose logs alertmanager | Select-String "error"
```

### Verificar Configurações
```powershell
# Prometheus - ver config carregado
Start-Process "http://localhost:9090/config"

# Alertmanager - ver config carregado
Start-Process "http://localhost:9093/#/status"

# Validar sintaxe YAML
docker-compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml
docker-compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
```

---

## 🚨 Gerenciar Alertas

### Ver Alertas Ativos
```powershell
# Via API (JSON)
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts" | ConvertTo-Json

# Via UI
Start-Process "http://localhost:9093/#/alerts"

# Filtrar apenas críticos
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts" | 
    ConvertFrom-Json | 
    Where-Object { $_.labels.severity -eq "critical" }
```

### Enviar Alerta de Teste
```powershell
# Usar script pronto
.\scripts\test-alerting.ps1 -Severity critical

# Enviar manualmente
$alert = @{
    labels = @{
        alertname = "TestAlert"
        severity = "warning"
        instance = "localhost:3001"
    }
    annotations = @{
        summary = "Teste manual"
    }
    startsAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/alerts" `
    -Method Post `
    -Body "[$alert]" `
    -ContentType "application/json"
```

---

## 🔇 Silenciar Alertas

### Criar Silence (1 hora)
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

### Silence de Múltiplos Alertas (Regex)
```powershell
$silence = @{
    matchers = @(
        @{ name = "severity"; value = "warning"; isRegex = $false }
        @{ name = "component"; value = "system"; isRegex = $false }
    )
    startsAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endsAt = (Get-Date).AddHours(2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    createdBy = "$env:USERNAME"
    comment = "Atualização de sistema"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/silences" `
    -Method Post `
    -Body $silence `
    -ContentType "application/json"
```

### Listar Silences Ativos
```powershell
# Via API
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/silences" | ConvertTo-Json

# Via UI
Start-Process "http://localhost:9093/#/silences"
```

### Deletar Silence
```powershell
# Pegar ID do silence primeiro
$silences = Invoke-RestMethod -Uri "http://localhost:9093/api/v1/silences"
$silenceId = $silences[0].id

# Deletar
Invoke-RestMethod `
    -Uri "http://localhost:9093/api/v1/silence/$silenceId" `
    -Method Delete
```

---

## 📊 Queries Prometheus Úteis

### Dashboard de Operações
```powershell
# Abrir Prometheus UI
Start-Process "http://localhost:9090/graph"
```

### Queries Rápidas

**1. Alertas disparando agora**
```promql
ALERTS{alertstate="firing"}
```

**2. RPS (Requests por segundo)**
```promql
sum(rate(http_requests_total[5m]))
```

**3. Latência P95**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**4. Taxa de erro 5xx**
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**5. Pool de conexões DB**
```promql
typeorm_connection_pool_active / typeorm_connection_pool_max * 100
```

**6. CPU usage**
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**7. Memory usage**
```promql
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```

**8. Tickets na fila**
```promql
tickets_em_fila_total
```

---

## 🔄 Reload Configurações

### Prometheus (Sem Restart)
```powershell
# Reload via API
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post

# Verificar se funcionou
Start-Process "http://localhost:9090/config"
```

### Alertmanager (Sem Restart)
```powershell
# Reload via API
Invoke-RestMethod -Uri "http://localhost:9093/-/reload" -Method Post

# Verificar status
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/status" | ConvertTo-Json
```

### Quando Reload Não Funciona
```powershell
# Restart completo
docker-compose restart prometheus alertmanager
```

---

## 📈 Grafana

### Login Rápido
```powershell
# Abrir Grafana
Start-Process "http://localhost:3002"

# Login padrão: admin / admin
# (mudar senha no primeiro login)
```

### Criar Snapshot de Dashboard
```powershell
# Via API (requer token)
$token = "your-api-token"
$dashboard = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/dashboards/uid/conectcrm-slo" `
    -Headers @{ Authorization = "Bearer $token" }

# Salvar JSON
$dashboard | ConvertTo-Json -Depth 100 | Out-File "dashboard-backup.json"
```

### Importar Dashboard
```powershell
# Via UI: + → Import → Upload JSON
Start-Process "http://localhost:3002/dashboard/import"
```

---

## 🧹 Manutenção

### Limpar Dados Antigos

**Prometheus (TSDB Compaction)**
```powershell
# Ver estatísticas
docker-compose exec prometheus promtool tsdb analyze /prometheus

# Compactar manualmente (geralmente automático)
docker-compose exec prometheus promtool tsdb compact /prometheus
```

**Alertmanager (Limpar Silences Expirados)**
```powershell
# Silences expirados são removidos automaticamente
# Ver silences ativos
Invoke-RestMethod -Uri "http://localhost:9093/api/v1/silences?filter=active=true"
```

### Limpar Volumes (CUIDADO!)
```powershell
# Parar serviços primeiro
docker-compose stop prometheus alertmanager grafana

# Remover volumes (PERDE TODOS OS DADOS!)
docker volume rm conectsuite-prometheus-data
docker volume rm conectsuite-alertmanager-data
docker volume rm conectsuite-grafana-data

# Recriar
docker-compose up -d prometheus alertmanager grafana
```

### Backup de Dados
```powershell
# Criar diretório de backup
$backupDir = "C:\Backups\alerting\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $backupDir

# Exportar volumes Docker
docker run --rm `
    -v conectsuite-prometheus-data:/data `
    -v ${backupDir}:/backup `
    alpine tar czf /backup/prometheus-data.tar.gz /data

docker run --rm `
    -v conectsuite-alertmanager-data:/data `
    -v ${backupDir}:/backup `
    alpine tar czf /backup/alertmanager-data.tar.gz /data

docker run --rm `
    -v conectsuite-grafana-data:/data `
    -v ${backupDir}:/backup `
    alpine tar czf /backup/grafana-data.tar.gz /data

Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green
```

---

## 🔧 Troubleshooting Rápido

### Problema: Alertmanager não envia notificações

```powershell
# 1. Verificar logs
docker-compose logs --tail=100 alertmanager | Select-String "error|fail"

# 2. Testar envio direto
.\scripts\test-alerting.ps1 -Severity critical

# 3. Verificar variáveis de ambiente
docker-compose exec alertmanager env | Select-String "SLACK|SMTP"

# 4. Restart se necessário
docker-compose restart alertmanager
```

### Problema: Prometheus não mostra alertas

```powershell
# 1. Verificar se alert-rules.yml está carregado
Start-Process "http://localhost:9090/rules"

# 2. Verificar sintaxe
docker-compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml

# 3. Verificar mount do volume
docker-compose exec prometheus ls -la /etc/prometheus/

# 4. Reload config
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post
```

### Problema: Grafana não conecta ao Prometheus

```powershell
# 1. Testar conectividade do container
docker-compose exec grafana wget -O- http://prometheus:9090/api/v1/query?query=up

# 2. Verificar datasource
Invoke-RestMethod `
    -Uri "http://localhost:3002/api/datasources" `
    -Headers @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin")) }

# 3. Restart Grafana
docker-compose restart grafana
```

---

## 📊 Monitoramento do Sistema de Alerting

### Dashboard de Métricas (PromQL)

**Prometheus Scrape Success Rate**
```promql
avg(up{job="conectcrm-backend"}) * 100
```

**Alert Rule Evaluation Duration**
```promql
prometheus_rule_evaluation_duration_seconds
```

**Alertmanager Notification Success Rate**
```promql
sum(rate(alertmanager_notifications_total[5m])) by (integration)
```

**Alertmanager Queue Size**
```promql
alertmanager_notification_queue_capacity - alertmanager_notification_queue_length
```

---

## 🎯 Scripts Personalizados

### Script: Ver Resumo do Sistema

```powershell
# resumo-alerting.ps1
Write-Host "`n📊 RESUMO DO SISTEMA DE ALERTING`n" -ForegroundColor Cyan

# Status dos serviços
Write-Host "🔧 Status dos Serviços:" -ForegroundColor Yellow
docker-compose ps prometheus alertmanager grafana

# Alertas ativos
Write-Host "`n🚨 Alertas Ativos:" -ForegroundColor Yellow
$alerts = Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts" -ErrorAction SilentlyContinue
if ($alerts) {
    $alertCount = ($alerts | Measure-Object).Count
    Write-Host "   Total: $alertCount alertas" -ForegroundColor White
    
    $critical = ($alerts | Where-Object { $_.labels.severity -eq "critical" } | Measure-Object).Count
    $warning = ($alerts | Where-Object { $_.labels.severity -eq "warning" } | Measure-Object).Count
    $info = ($alerts | Where-Object { $_.labels.severity -eq "info" } | Measure-Object).Count
    
    Write-Host "   🔴 Critical: $critical" -ForegroundColor Red
    Write-Host "   🟡 Warning: $warning" -ForegroundColor Yellow
    Write-Host "   🔵 Info: $info" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Nenhum alerta ativo" -ForegroundColor Green
}

# Silences ativos
Write-Host "`n🔇 Silences Ativos:" -ForegroundColor Yellow
$silences = Invoke-RestMethod -Uri "http://localhost:9093/api/v1/silences" -ErrorAction SilentlyContinue
if ($silences) {
    $activeSilences = $silences | Where-Object { $_.status.state -eq "active" }
    $count = ($activeSilences | Measure-Object).Count
    Write-Host "   Total: $count silences ativos" -ForegroundColor White
} else {
    Write-Host "   Nenhum silence ativo" -ForegroundColor Gray
}

# RPS atual
Write-Host "`n📈 Métricas em Tempo Real:" -ForegroundColor Yellow
$query = "sum(rate(http_requests_total[1m]))"
$result = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=$query" -ErrorAction SilentlyContinue
if ($result.data.result) {
    $rps = [math]::Round($result.data.result[0].value[1], 2)
    Write-Host "   RPS: $rps req/s" -ForegroundColor White
}

Write-Host ""
```

### Script: Exportar Alertas para CSV

```powershell
# exportar-alertas.ps1
$alerts = Invoke-RestMethod -Uri "http://localhost:9093/api/v1/alerts"

$export = $alerts | ForEach-Object {
    [PSCustomObject]@{
        AlertName = $_.labels.alertname
        Severity = $_.labels.severity
        Instance = $_.labels.instance
        Status = $_.status.state
        StartsAt = $_.startsAt
        Summary = $_.annotations.summary
    }
}

$export | Export-Csv -Path "alertas-$(Get-Date -Format 'yyyy-MM-dd').csv" -NoTypeInformation
Write-Host "✅ Alertas exportados para CSV" -ForegroundColor Green
```

---

## 🔗 Links Rápidos

```powershell
# Abrir todas as interfaces
Start-Process "http://localhost:9090"      # Prometheus
Start-Process "http://localhost:9093"      # Alertmanager
Start-Process "http://localhost:3002"      # Grafana
Start-Process "http://localhost:3001/metrics"  # Backend metrics
```

---

**Última atualização**: 17 de novembro de 2025  
**Dica**: Salve este arquivo nos favoritos do browser para acesso rápido! 🚀
