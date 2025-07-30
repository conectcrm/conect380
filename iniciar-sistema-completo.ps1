# Sistema ConectCRM - Inicialização Completa
Write-Host "🚀 Iniciando Sistema ConectCRM Completo" -ForegroundColor Green
Write-Host ""

# Função para parar processos na porta
function Stop-ProcessOnPort {
  param($Port)
  $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  if ($processes) {
    foreach ($process in $processes) {
      Write-Host "⚠️  Encerrando processo na porta $Port`: $($process.OwningProcess)" -ForegroundColor Yellow
      Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

# Parar processos existentes
Write-Host "📌 Verificando portas ocupadas..."
Stop-ProcessOnPort 3001
Stop-ProcessOnPort 3800

# Ir para pasta do backend
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

Write-Host "📦 Compilando backend..." -ForegroundColor Cyan
& npx nest build

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erro na compilação. Verifique os logs acima." -ForegroundColor Red
  Read-Host "Pressione Enter para continuar"
  exit 1
}

Write-Host "🎯 Iniciando backend com email integrado na porta 3001..." -ForegroundColor Green

# Iniciar backend em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; node dist/main.js" -WindowStyle Normal

Start-Sleep 3

Write-Host ""
Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Serviços disponíveis:" -ForegroundColor White
Write-Host "   🌐 Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   📖 API Docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "   📧 Email: Integrado no backend" -ForegroundColor Green
Write-Host "   🎯 Portal: http://localhost:3900/portal/proposta/[numero]/[token]" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Endpoints de Email:" -ForegroundColor Yellow
Write-Host "   POST /email/notificar-aceite" -ForegroundColor Gray
Write-Host "   POST /email/enviar-proposta" -ForegroundColor Gray
Write-Host "   GET  /email/testar" -ForegroundColor Gray
Write-Host "   GET  /email/status" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Agora você precisa rodar apenas 1 servidor!" -ForegroundColor Magenta
Write-Host ""

# Testar se o backend está respondendo
Write-Host "🔍 Testando backend..." -ForegroundColor Cyan
Start-Sleep 2

try {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/email/status" -Method GET -TimeoutSec 5
  Write-Host "✅ Backend respondendo corretamente!" -ForegroundColor Green
  Write-Host "📧 Status do email: $($response.status)" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  Backend ainda inicializando ou erro na conexão" -ForegroundColor Yellow
  Write-Host "   Aguarde alguns segundos e teste manualmente" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para finalizar"
