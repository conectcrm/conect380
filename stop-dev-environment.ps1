# Script para parar ambiente de desenvolvimento
# Uso: .\stop-dev-environment.ps1

param(
  [switch]$Force
)

Write-Host "`n========================================" -ForegroundColor Red
Write-Host "  🛑 Parando Ambiente de Desenvolvimento" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Red

$ErrorActionPreference = "Continue"

if (-not $Force) {
  Write-Host "⚠️  Isso vai parar:" -ForegroundColor Yellow
  Write-Host "   • Backend NestJS (Node.js)" -ForegroundColor Gray
  Write-Host "   • Frontend React (Node.js)" -ForegroundColor Gray
  Write-Host "   • ngrok (túneis)" -ForegroundColor Gray
  Write-Host ""
  $response = Read-Host "Confirma? (s/N)"
    
  if ($response -ne 's' -and $response -ne 'S') {
    Write-Host "❌ Operação cancelada" -ForegroundColor Yellow
    exit 0
  }
}

# 1. Parar ngrok
Write-Host "`n1️⃣ Parando ngrok..." -ForegroundColor Yellow
$ngrokProcesses = Get-Process -Name ngrok -ErrorAction SilentlyContinue

if ($ngrokProcesses) {
  $ngrokProcesses | ForEach-Object {
    Write-Host "   🛑 Parando processo ngrok (PID: $($_.Id))" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
  Write-Host "✅ ngrok parado" -ForegroundColor Green
}
else {
  Write-Host "ℹ️  ngrok não está rodando" -ForegroundColor Gray
}

# 2. Parar Node.js (Backend + Frontend)
Write-Host "`n2️⃣ Parando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
  $nodeProcesses | ForEach-Object {
    Write-Host "   🛑 Parando processo Node.js (PID: $($_.Id))" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
  Write-Host "✅ Node.js parado" -ForegroundColor Green
}
else {
  Write-Host "ℹ️  Node.js não está rodando" -ForegroundColor Gray
}

# 3. Liberar portas (verificação)
Write-Host "`n3️⃣ Verificando portas..." -ForegroundColor Yellow

$ports = @(3000, 3001, 4040)
foreach ($port in $ports) {
  $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($connection) {
    Write-Host "   ⚠️  Porta $port ainda em uso" -ForegroundColor Yellow
    Write-Host "      Processo: $($connection.OwningProcess)" -ForegroundColor Gray
        
    if ($Force) {
      try {
        Stop-Process -Id $connection.OwningProcess -Force
        Write-Host "      🛑 Processo forçado a parar" -ForegroundColor Red
      }
      catch {
        Write-Host "      ❌ Não foi possível parar: $_" -ForegroundColor Red
      }
    }
  }
  else {
    Write-Host "   ✅ Porta $port livre" -ForegroundColor Green
  }
}

# 4. Limpar sessões PowerShell extras (opcional)
Write-Host "`n4️⃣ Limpando janelas do PowerShell..." -ForegroundColor Yellow
$currentPID = $PID
$psProcesses = Get-Process -Name powershell, pwsh -ErrorAction SilentlyContinue | 
Where-Object { $_.Id -ne $currentPID -and $_.MainWindowTitle -match "Backend|Frontend|ngrok" }

if ($psProcesses) {
  $psProcesses | ForEach-Object {
    Write-Host "   🛑 Fechando janela: $($_.MainWindowTitle)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -ErrorAction SilentlyContinue
  }
  Write-Host "✅ Janelas fechadas" -ForegroundColor Green
}
else {
  Write-Host "ℹ️  Nenhuma janela extra para fechar" -ForegroundColor Gray
}

# Resumo final
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ AMBIENTE PARADO COM SUCESSO!" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📋 Status:" -ForegroundColor Cyan
Write-Host "   🛑 ngrok:          Parado" -ForegroundColor Gray
Write-Host "   🛑 Backend:        Parado" -ForegroundColor Gray
Write-Host "   🛑 Frontend:       Parado" -ForegroundColor Gray
Write-Host "   ✅ Portas:         Liberadas`n" -ForegroundColor Gray

Write-Host "🚀 Para reiniciar:" -ForegroundColor Green
Write-Host "   .\start-dev-with-ngrok.ps1`n" -ForegroundColor White

if (-not $Force) {
  Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
