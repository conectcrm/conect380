# 🧪 Teste de Alertas Log-Based (Loki)

**Objetivo**: Validar que alertas baseados em logs disparam corretamente.  
**Tempo estimado**: 20 minutos  
**Pré-requisito**: Week 9 completo, Loki rules carregadas

---

## 📋 Alertas Loki a Testar

### Grupo 1: log_errors (3 alertas)
- ✅ `HighLogErrorRate`: Taxa de logs ERROR >10/min por 5min
- ✅ `CriticalLogDetected`: Log FATAL ou CRITICAL encontrado
- ✅ `RepeatedExceptionPattern`: Mesma exception >5 vezes em 5min

### Grupo 2: database_errors (3 alertas)
- ✅ `DatabaseConnectionErrors`: Erro "connection refused|timeout" >3/min
- ✅ `QueryTimeouts`: Erro "query timeout" >2/min
- ✅ `DeadlockDetected`: Log contém "deadlock"

### Grupo 3: security_logs (2 alertas)
- ✅ `MultipleFailedLogins`: >5 login failures em 5min
- ✅ `HighJWTTokenErrors`: Erro JWT >10/min

### Grupo 4: external_apis (2 alertas)
- ✅ `WhatsAppIntegrationErrors`: Erro WhatsApp API >5/min
- ✅ `ExternalAPIErrors`: Erro "external API" >3/min

### Grupo 5: resource_exhaustion (2 alertas)
- ✅ `MemoryHeapNearLimit`: Log "heap out of memory|memory exhausted"
- ✅ `FileDescriptorExhaustion`: Log "too many open files|EMFILE"

### Grupo 6: business_errors (2 alertas)
- ✅ `TicketProcessingErrors`: Erro processamento de ticket >3/min
- ✅ `PaymentProcessingErrors`: Erro "payment failed|charge failed"

### Grupo 7: trace_correlation (1 alerta)
- ✅ `HighErrorTraceRate`: Traces com erro >10% em 10min

---

## 🚀 Scripts de Teste

### Teste 1: HighLogErrorRate

**Objetivo**: Gerar >10 logs ERROR por minuto

```powershell
# Script: Gerar logs de erro massivos
Write-Host "🧪 Teste 1: HighLogErrorRate" -ForegroundColor Cyan

# Gerar 15 logs ERROR em 30 segundos
for ($i=1; $i -le 15; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
        -Method Post `
        -Body (@{ 
            level = "ERROR"
            message = "Test error #$i - HighLogErrorRate validation"
        } | ConvertTo-Json) `
        -ContentType "application/json"
    
    Start-Sleep -Seconds 2
}

Write-Host "✅ 15 logs ERROR gerados em 30s (30 logs/min)" -ForegroundColor Green
Write-Host "   Aguarde 5 minutos para alerta disparar..." -ForegroundColor Yellow
```

**Verificação** (após 5 minutos):
```powershell
# Verificar no Prometheus
Invoke-RestMethod "http://localhost:9090/api/v1/alerts" |
    ConvertFrom-Json |
    Select-Object -ExpandProperty data |
    Select-Object -ExpandProperty alerts |
    Where-Object { $_.labels.alertname -eq "HighLogErrorRate" }
```

### Teste 2: CriticalLogDetected

**Objetivo**: Gerar log FATAL/CRITICAL

```powershell
Write-Host "🧪 Teste 2: CriticalLogDetected" -ForegroundColor Cyan

# Gerar log FATAL
Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
    -Method Post `
    -Body (@{
        level = "FATAL"
        message = "FATAL ERROR: System critical failure - immediate attention required"
        stack_trace = "FatalError: at module.exports (/app/src/critical.ts:42)"
    } | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "✅ Log FATAL gerado" -ForegroundColor Green
Write-Host "   Alerta deve disparar em até 2 minutos..." -ForegroundColor Yellow
```

### Teste 3: DatabaseConnectionErrors

**Objetivo**: Gerar erros de conexão DB

```powershell
Write-Host "🧪 Teste 3: DatabaseConnectionErrors" -ForegroundColor Cyan

# Gerar 5 erros de conexão em 1 minuto
for ($i=1; $i -le 5; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
        -Method Post `
        -Body (@{
            level = "ERROR"
            message = "Database connection refused: Connection timeout after 5000ms"
            error = "Error: connect ECONNREFUSED localhost:5432"
        } | ConvertTo-Json) `
        -ContentType "application/json"
    
    Start-Sleep -Seconds 10
}

Write-Host "✅ 5 erros de conexão DB gerados" -ForegroundColor Green
Write-Host "   Taxa: 5 erros/min (threshold: >3/min)" -ForegroundColor Yellow
```

### Teste 4: MultipleFailedLogins

**Objetivo**: Simular tentativas de login falhas

```powershell
Write-Host "🧪 Teste 4: MultipleFailedLogins" -ForegroundColor Cyan

# Gerar 7 login failures em 2 minutos
$users = @("admin", "root", "test@test.com", "attacker@evil.com")

for ($i=1; $i -le 7; $i++) {
    $user = $users | Get-Random
    
    Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
        -Method Post `
        -Body (@{
            level = "WARN"
            message = "Failed login attempt for user: $user"
            context = @{
                username = $user
                ip = "192.168.1.$([System.Random]::new().Next(1,255))"
                reason = "Invalid password"
            }
        } | ConvertTo-Json -Depth 3) `
        -ContentType "application/json"
    
    Start-Sleep -Seconds 15
}

Write-Host "✅ 7 login failures gerados (threshold: >5 em 5min)" -ForegroundColor Green
```

### Teste 5: MemoryHeapNearLimit

**Objetivo**: Simular OOM (Out of Memory)

```powershell
Write-Host "🧪 Teste 5: MemoryHeapNearLimit" -ForegroundColor Cyan

Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
    -Method Post `
    -Body (@{
        level = "ERROR"
        message = "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory"
        stack_trace = @"
<--- Last few GCs --->
[12345:0x123456]   45678 ms: Scavenge 2048.1 (2048.8) -> 2047.9 (2048.8) MB, 12.3 / 0.0 ms  (average mu = 0.123, current mu = 0.456)
[12345:0x123456]   45690 ms: Mark-sweep 2048.3 (2048.8) -> 2048.0 (2048.8) MB, 234.5 / 0.0 ms  (average mu = 0.234, current mu = 0.567)
<--- JS stacktrace --->
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
"@
    } | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "✅ Log OOM gerado - alerta deve disparar imediatamente" -ForegroundColor Green
```

### Teste 6: RepeatedExceptionPattern

**Objetivo**: Mesma exception repetida

```powershell
Write-Host "🧪 Teste 6: RepeatedExceptionPattern" -ForegroundColor Cyan

# Gerar mesma exception 8 vezes
$exception = "TypeError: Cannot read property 'id' of undefined at UserService.findById"

for ($i=1; $i -le 8; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
        -Method Post `
        -Body (@{
            level = "ERROR"
            message = $exception
            stack_trace = "at UserService.findById (/app/src/services/user.service.ts:123)"
        } | ConvertTo-Json) `
        -ContentType "application/json"
    
    Start-Sleep -Seconds 30
}

Write-Host "✅ 8 ocorrências da mesma exception (threshold: >5 em 5min)" -ForegroundColor Green
```

### Teste 7: WhatsAppIntegrationErrors

**Objetivo**: Erros da API WhatsApp

```powershell
Write-Host "🧪 Teste 7: WhatsAppIntegrationErrors" -ForegroundColor Cyan

# Gerar 7 erros WhatsApp em 1 minuto
for ($i=1; $i -le 7; $i++) {
    Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
        -Method Post `
        -Body (@{
            level = "ERROR"
            message = "WhatsApp API Error: Message send failed"
            error = "Error 131051: Message failed to send because more than 24 hours have passed"
            context = @{
                api = "whatsapp"
                endpoint = "/messages"
                status_code = 400
            }
        } | ConvertTo-Json -Depth 3) `
        -ContentType "application/json"
    
    Start-Sleep -Seconds 8
}

Write-Host "✅ 7 erros WhatsApp gerados (threshold: >5/min)" -ForegroundColor Green
```

---

## 🔍 Validação Manual

### Método 1: Loki Query (Grafana Explore)

1. Acesse: http://localhost:3002/explore
2. Datasource: **Loki**
3. Query:
   ```logql
   # Ver logs ERROR dos últimos 5 minutos
   {container="conectsuite-backend"} |= "ERROR" | json
   
   # Contar logs ERROR por minuto
   sum(rate({container="conectsuite-backend"} |= "ERROR" [1m]))
   
   # Ver logs FATAL/CRITICAL
   {container="conectsuite-backend"} |~ "FATAL|CRITICAL"
   
   # Ver erros de conexão DB
   {container="conectsuite-backend"} |~ "connection refused|connection timeout"
   ```

### Método 2: Prometheus Alerts

```powershell
# Listar alertas Loki ativos
Invoke-RestMethod "http://localhost:9090/api/v1/alerts" |
    ConvertFrom-Json |
    Select-Object -ExpandProperty data |
    Select-Object -ExpandProperty alerts |
    Where-Object { $_.labels.alert_type -eq "log_based" } |
    Format-Table -Property @{
        Label = "Alert"
        Expression = { $_.labels.alertname }
    }, @{
        Label = "State"
        Expression = { $_.state }
    }, @{
        Label = "ActiveAt"
        Expression = { $_.activeAt }
    }
```

### Método 3: Loki Ruler API

```powershell
# Verificar se rules foram carregadas
Invoke-RestMethod "http://localhost:3100/loki/api/v1/rules" |
    ConvertFrom-Json

# Ver status de uma rule específica
Invoke-RestMethod "http://localhost:3100/prometheus/api/v1/rules" |
    ConvertFrom-Json |
    Select-Object -ExpandProperty data |
    Select-Object -ExpandProperty groups |
    Where-Object { $_.name -eq "log_errors" }
```

---

## 🤖 Script Automatizado Completo

```powershell
# test-loki-alerts.ps1
# Executa todos os testes de alertas log-based

param(
    [switch]$Verbose,
    [switch]$WaitForAlerts
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 TESTE DE ALERTAS LOG-BASED (LOKI)               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Array de testes
$tests = @(
    @{
        Name = "HighLogErrorRate"
        Description = "Gerar >10 logs ERROR/min"
        ExpectedAlert = "HighLogErrorRate"
        WaitTime = 300  # 5 minutos
        Script = {
            for ($i=1; $i -le 15; $i++) {
                Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
                    -Method Post -Body (@{ level = "ERROR"; message = "Test error #$i" } | ConvertTo-Json) `
                    -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
                Start-Sleep -Seconds 2
            }
        }
    },
    @{
        Name = "CriticalLogDetected"
        Description = "Gerar log FATAL"
        ExpectedAlert = "CriticalLogDetected"
        WaitTime = 120  # 2 minutos
        Script = {
            Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
                -Method Post -Body (@{ level = "FATAL"; message = "FATAL: Critical failure" } | ConvertTo-Json) `
                -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        }
    },
    @{
        Name = "DatabaseConnectionErrors"
        Description = "Gerar >3 erros DB/min"
        ExpectedAlert = "DatabaseConnectionErrors"
        WaitTime = 180  # 3 minutos
        Script = {
            for ($i=1; $i -le 5; $i++) {
                Invoke-RestMethod -Uri "http://localhost:3001/api/test/generate-error" `
                    -Method Post -Body (@{ level = "ERROR"; message = "Database connection refused" } | ConvertTo-Json) `
                    -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
                Start-Sleep -Seconds 10
            }
        }
    }
    # Adicionar outros testes...
)

# Executar testes
$results = @()

foreach ($test in $tests) {
    Write-Host "`n📋 Teste: $($test.Name)" -ForegroundColor Yellow
    Write-Host "   $($test.Description)" -ForegroundColor Gray
    
    try {
        # Executar script de teste
        & $test.Script
        
        if ($WaitForAlerts) {
            Write-Host "   ⏳ Aguardando $($test.WaitTime)s para alerta disparar..." -ForegroundColor Gray
            Start-Sleep -Seconds $test.WaitTime
            
            # Verificar se alerta disparou
            $alert = Invoke-RestMethod "http://localhost:9090/api/v1/alerts" |
                ConvertFrom-Json |
                Select-Object -ExpandProperty data |
                Select-Object -ExpandProperty alerts |
                Where-Object { $_.labels.alertname -eq $test.ExpectedAlert }
            
            if ($alert) {
                Write-Host "   ✅ Alerta $($test.ExpectedAlert) DISPAROU!" -ForegroundColor Green
                $results += @{ Test = $test.Name; Result = "PASS" }
            } else {
                Write-Host "   ❌ Alerta $($test.ExpectedAlert) NÃO disparou" -ForegroundColor Red
                $results += @{ Test = $test.Name; Result = "FAIL" }
            }
        } else {
            Write-Host "   ✅ Logs gerados com sucesso" -ForegroundColor Green
            $results += @{ Test = $test.Name; Result = "LOGS_SENT" }
        }
        
    } catch {
        Write-Host "   ❌ Erro ao executar teste: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{ Test = $test.Name; Result = "ERROR" }
    }
}

# Resumo
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    📊 RESUMO                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$results | ForEach-Object {
    $color = switch ($_.Result) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "LOGS_SENT" { "Yellow" }
        "ERROR" { "Red" }
    }
    Write-Host "   $($_.Test): $($_.Result)" -ForegroundColor $color
}

if (-not $WaitForAlerts) {
    Write-Host "`n💡 Dica: Use -WaitForAlerts para aguardar e validar alertas automaticamente" -ForegroundColor Cyan
    Write-Host "   Exemplo: .\test-loki-alerts.ps1 -WaitForAlerts`n" -ForegroundColor Gray
}
```

**Uso**:
```powershell
# Apenas gerar logs (rápido)
.\test-loki-alerts.ps1

# Gerar logs E aguardar alertas (lento, ~15min)
.\test-loki-alerts.ps1 -WaitForAlerts

# Com saída detalhada
.\test-loki-alerts.ps1 -WaitForAlerts -Verbose
```

---

## ✅ Checklist de Validação

Após executar testes, verificar:

- [ ] HighLogErrorRate disparou após 5min com >10 logs ERROR/min
- [ ] CriticalLogDetected disparou imediatamente com log FATAL
- [ ] RepeatedExceptionPattern detectou mesma exception 5+ vezes
- [ ] DatabaseConnectionErrors disparou com >3 erros DB/min
- [ ] QueryTimeouts detectou logs de timeout
- [ ] MultipleFailedLogins disparou com >5 login failures
- [ ] HighJWTTokenErrors detectou erros JWT >10/min
- [ ] WhatsAppIntegrationErrors detectou erros API WhatsApp
- [ ] MemoryHeapNearLimit disparou com log OOM
- [ ] PaymentProcessingErrors detectou erros de pagamento
- [ ] Alertas aparecem no Grafana dashboard
- [ ] Alertmanager recebeu e roteou alertas
- [ ] (Opcional) Notificações chegaram em Slack/Email

---

## 🚨 Troubleshooting

### Logs não aparecem no Loki

**Verificar Promtail**:
```powershell
# Status do Promtail
docker logs promtail --tail 50

# Verificar se está scrapando backend
docker logs promtail 2>&1 | Select-String "backend"
```

**Testar query manual**:
```logql
# No Grafana Explore
{container="conectsuite-backend"} | json | line_format "{{.level}} {{.message}}"
```

### Alertas não disparam

**Verificar Loki Ruler**:
```powershell
# Ver se rules foram carregadas
Invoke-RestMethod "http://localhost:3100/loki/api/v1/rules"

# Logs do Loki
docker logs loki --tail 50 | Select-String "rule|alert"
```

**Verificar sintaxe LogQL**:
- Usar `|=` para match exato
- Usar `|~` para regex
- Lembrar de `| json` se logs são JSON
- Rate/count requires `[duration]`

### Backend não tem endpoint `/api/test/generate-error`

**Criar controller temporário**:

```typescript
// backend/src/test/test.controller.ts
@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  @Post('generate-error')
  generateError(@Body() body: { level: string; message: string }) {
    switch (body.level) {
      case 'FATAL':
        this.logger.fatal(body.message);
        break;
      case 'ERROR':
        this.logger.error(body.message);
        break;
      case 'WARN':
        this.logger.warn(body.message);
        break;
      default:
        this.logger.log(body.message);
    }
    return { success: true, logged: body.message };
  }
}
```

**OU gerar logs manualmente**:
```powershell
# Forçar erro no backend
docker exec conectsuite-backend node -e "console.error('ERROR: Test error for Loki')"
```

---

**Alertas log-based validados = Visibilidade completa de problemas!** 🎯
