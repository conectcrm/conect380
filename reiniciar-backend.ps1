# Script para reiniciar o backend com logs de debug
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 REINICIANDO BACKEND" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 1. Finalizar processos Node.js na porta 3001
Write-Host "1️⃣  Finalizando processos na porta 3001..." -ForegroundColor White
$connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($connections) {
  $connections | ForEach-Object {
    $processId = $_.OwningProcess
    Write-Host "   🔴 Finalizando processo $processId" -ForegroundColor Red
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
  Write-Host "   ✅ Porta 3001 liberada`n" -ForegroundColor Green
}
else {
  Write-Host "   ℹ️  Nenhum processo na porta 3001`n" -ForegroundColor Gray
}

# 2. Recompilar backend (garante versão mais recente)
Write-Host "2️⃣  Recompilando backend..." -ForegroundColor White
Set-Location C:\Projetos\conectcrm\backend
$compileResult = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "   ✅ Backend recompilado com sucesso!`n" -ForegroundColor Green
}
else {
  Write-Host "   ❌ Erro ao recompilar!" -ForegroundColor Red
  Write-Host $compileResult
  exit 1
}

# 3. Iniciar backend
Write-Host "3️⃣  Iniciando backend na porta 3001..." -ForegroundColor White
Write-Host "   📋 Aguarde logs de inicialização...`n" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🟢 BACKEND INICIADO - LOGS ABAIXO:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Executar backend (não retorna até ser finalizado)
node dist/src/main.js
