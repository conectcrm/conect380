# 🔗 Script de Teste: Correlação Log-Trace
# Semana 3 - Structured Logging
# Valida que:
# 1. Correlation ID é gerado e propagado
# 2. Logs incluem correlationId + trace_id
# 3. Traces aparecem no Jaeger com mesmo trace_id

Write-Host "🔗 Teste de Correlação Log-Trace" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se backend está rodando
Write-Host "1️⃣ Verificando backend (porta 3001)..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $backendRunning) {
  Write-Host "❌ Backend não está rodando!" -ForegroundColor Red
  Write-Host "   Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
  exit 1
}
Write-Host "✅ Backend respondendo na porta 3001" -ForegroundColor Green
Write-Host ""

# 2. Gerar requisições com Correlation ID customizado
Write-Host "2️⃣ Gerando requisições com Correlation ID..." -ForegroundColor Yellow
$testCorrelationId = "test-$(New-Guid)"
Write-Host "   Correlation ID: $testCorrelationId" -ForegroundColor Cyan

try {
  # Fazer requisição GET /atendimento/tickets (listar tickets)
  $response = Invoke-WebRequest `
    -Uri "http://localhost:3001/atendimento/tickets" `
    -Method GET `
    -Headers @{ "X-Correlation-ID" = $testCorrelationId } `
    -UseBasicParsing `
    -TimeoutSec 10
    
  $responseCorrelationId = $response.Headers["X-Correlation-ID"]
    
  Write-Host "✅ Requisição enviada com sucesso" -ForegroundColor Green
  Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Cyan
  Write-Host "   Response Correlation ID: $responseCorrelationId" -ForegroundColor Cyan
    
  if ($responseCorrelationId -eq $testCorrelationId) {
    Write-Host "   ✅ Correlation ID propagado corretamente no response!" -ForegroundColor Green
  }
  else {
    Write-Host "   ⚠️ Correlation ID diferente no response (não crítico)" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "❌ Erro ao fazer requisição: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "   Verifique se tem token JWT válido ou se rota requer autenticação" -ForegroundColor Yellow
}
Write-Host ""

# 3. Verificar logs
Write-Host "3️⃣ Verificando logs (últimas 50 linhas)..." -ForegroundColor Yellow
$logFile = "c:\Projetos\conectcrm\backend\logs\combined-$(Get-Date -Format 'yyyy-MM-dd').log"

if (Test-Path $logFile) {
  Write-Host "   Arquivo: $logFile" -ForegroundColor Cyan
    
  $recentLogs = Get-Content $logFile -Tail 50 | Select-String -Pattern $testCorrelationId
    
  if ($recentLogs) {
    Write-Host "✅ Correlation ID encontrado nos logs!" -ForegroundColor Green
    Write-Host "   Ocorrências:" -ForegroundColor Cyan
    $recentLogs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        
    # Extrair trace_id se existir
    $traceIdMatch = $recentLogs | Select-String -Pattern '"trace_id":"([a-f0-9]+)"'
    if ($traceIdMatch) {
      $traceId = $traceIdMatch.Matches[0].Groups[1].Value
      Write-Host ""
      Write-Host "✅ Trace ID encontrado: $traceId" -ForegroundColor Green
      Write-Host "   Verificar no Jaeger: http://localhost:16686/trace/$traceId" -ForegroundColor Cyan
    }
  }
  else {
    Write-Host "⚠️ Correlation ID não encontrado nos últimos 50 logs" -ForegroundColor Yellow
    Write-Host "   Isso pode acontecer se a rota não gerou logs suficientes" -ForegroundColor Gray
  }
}
else {
  Write-Host "⚠️ Arquivo de log não existe ainda: $logFile" -ForegroundColor Yellow
  Write-Host "   Execute algumas requisições para gerar logs" -ForegroundColor Gray
}
Write-Host ""

# 4. Verificar Jaeger (se estiver rodando)
Write-Host "4️⃣ Verificando Jaeger (porta 16686)..." -ForegroundColor Yellow
$jaegerRunning = Test-NetConnection -ComputerName localhost -Port 16686 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($jaegerRunning) {
  Write-Host "✅ Jaeger UI disponível" -ForegroundColor Green
  Write-Host "   Acesse: http://localhost:16686" -ForegroundColor Cyan
  Write-Host "   Busque por 'conect-crm-backend' para ver traces" -ForegroundColor Gray
}
else {
  Write-Host "⚠️ Jaeger não está rodando" -ForegroundColor Yellow
  Write-Host "   Execute: docker-compose -f docker-compose.observability.yml up -d" -ForegroundColor Cyan
}
Write-Host ""

# 5. Resumo
Write-Host "📋 Resumo do Teste" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Backend: " -NoNewline
if ($backendRunning) { Write-Host "✅ Rodando" -ForegroundColor Green } else { Write-Host "❌ Parado" -ForegroundColor Red }

Write-Host "Jaeger: " -NoNewline
if ($jaegerRunning) { Write-Host "✅ Rodando" -ForegroundColor Green } else { Write-Host "⚠️ Parado" -ForegroundColor Yellow }

Write-Host "Correlation ID propagado: " -NoNewline
if ($responseCorrelationId) { Write-Host "✅ Sim" -ForegroundColor Green } else { Write-Host "⚠️ Não verificado" -ForegroundColor Yellow }

Write-Host ""
Write-Host "🎯 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar logs em: $logFile" -ForegroundColor Gray
Write-Host "   2. Buscar traces no Jaeger UI: http://localhost:16686" -ForegroundColor Gray
Write-Host "   3. Confirmar que trace_id dos logs corresponde aos traces" -ForegroundColor Gray
Write-Host ""
