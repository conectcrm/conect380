#!/usr/bin/env pwsh

Write-Host "Limpando cache do React..." -ForegroundColor Yellow

# Parar processos node na porta 3000
Write-Host "Parando servidor existente..." -ForegroundColor Cyan
$processosNode = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processosNode) {
    $processosNode | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Servidor parado" -ForegroundColor Green
}

# Limpar todos os caches
Write-Host "Deletando caches..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "Caches deletados" -ForegroundColor Green

# Aguardar um segundo
Start-Sleep -Seconds 2

# Iniciar o servidor
Write-Host ""
Write-Host "Iniciando servidor React..." -ForegroundColor Green
Write-Host "Aguarde a compilacao..." -ForegroundColor Yellow
Write-Host "Servidor sera aberto em http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Se o erro AtendimentoPage aparecer:" -ForegroundColor Red
Write-Host "  1. Pressione Ctrl+Shift+R no navegador" -ForegroundColor Yellow
Write-Host "  2. Ou limpe o cache do navegador manualmente" -ForegroundColor Yellow
Write-Host ""

# Configurar variáveis de ambiente e iniciar
$env:PORT = 3000
$env:NODE_OPTIONS = '--max_old_space_size=4096'
npm start
