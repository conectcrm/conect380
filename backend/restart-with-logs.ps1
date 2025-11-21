# Script para reiniciar backend e capturar logs

Write-Host "Parando processos Node..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 2

Write-Host "Iniciando backend com logs..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\backend"

# Iniciar em background
$job = Start-Job -ScriptBlock {
  Set-Location "C:\Projetos\conectcrm\backend"
  node dist/src/main.js
}

Write-Host "Backend iniciado (Job ID: $($job.Id))" -ForegroundColor Green
Write-Host "Aguarde 5 segundos..." -ForegroundColor Cyan

Start-Sleep -Seconds 5

Write-Host "Backend deve estar rodando agora!" -ForegroundColor Green
