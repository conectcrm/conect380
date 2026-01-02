#!/usr/bin/env pwsh
# 🧹 Limpar completamente cache HSTS do Chrome

Write-Host "🧹 Limpeza Completa de Cache HSTS do Chrome" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n⚠️  IMPORTANTE: Feche TODOS os navegadores antes de continuar!" -ForegroundColor Yellow
Write-Host "   Chrome, Edge, Brave, Opera, etc." -ForegroundColor Gray
Write-Host "`nPressione ENTER quando tiver fechado todos os navegadores..." -ForegroundColor Cyan
Read-Host

# 1. Verificar processos de navegadores
Write-Host "`n1️⃣  Verificando processos de navegadores..." -ForegroundColor Yellow

$browsers = @('chrome', 'msedge', 'opera', 'brave')
$running = @()

foreach ($browser in $browsers) {
    $process = Get-Process -Name $browser -ErrorAction SilentlyContinue
    if ($process) {
        $running += $browser
    }
}

if ($running.Count -gt 0) {
    Write-Host "   ⚠️  Navegadores ainda rodando: $($running -join ', ')" -ForegroundColor Red
    Write-Host "   Deseja forçar o fechamento? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq 'S' -or $response -eq 's') {
        foreach ($browser in $running) {
            Get-Process -Name $browser -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "   ✅ $browser encerrado" -ForegroundColor Green
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "   ❌ Feche os navegadores manualmente e execute novamente" -ForegroundColor Red
        exit 1
    }
}

Write-Host "   ✅ Nenhum navegador rodando" -ForegroundColor Green

# 2. Limpar cache do Chrome
Write-Host "`n2️⃣  Limpando cache do Chrome..." -ForegroundColor Yellow

$chromePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Storage",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Limpo: $path" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Erro ao limpar: $path" -ForegroundColor Yellow
        }
    }
}

# 3. Limpar HSTS (TransportSecurity)
Write-Host "`n3️⃣  Limpando configurações HSTS..." -ForegroundColor Yellow

$hstsPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\TransportSecurity"
if (Test-Path $hstsPath) {
    try {
        # Backup antes de deletar
        $backupPath = "$hstsPath.backup"
        Copy-Item -Path $hstsPath -Destination $backupPath -Force
        Remove-Item -Path $hstsPath -Force
        Write-Host "   ✅ HSTS limpo (backup em $backupPath)" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Erro ao limpar HSTS: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ Arquivo HSTS não encontrado (já limpo)" -ForegroundColor Green
}

# 4. Limpar DNS cache do Windows
Write-Host "`n4️⃣  Limpando DNS cache do Windows..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "   ✅ DNS cache limpo" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erro ao limpar DNS cache" -ForegroundColor Yellow
}

# 5. Limpar Edge também (se existir)
Write-Host "`n5️⃣  Limpando cache do Edge..." -ForegroundColor Yellow

$edgePaths = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\GPUCache"
)

foreach ($path in $edgePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Limpo: $path" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Erro ao limpar: $path" -ForegroundColor Yellow
        }
    }
}

$edgeHstsPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\TransportSecurity"
if (Test-Path $edgeHstsPath) {
    try {
        Remove-Item -Path $edgeHstsPath -Force
        Write-Host "   ✅ Edge HSTS limpo" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Erro ao limpar Edge HSTS" -ForegroundColor Yellow
    }
}

# Resumo
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Limpeza Concluída!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Abra o Chrome em modo anônimo: Ctrl + Shift + N" -ForegroundColor White
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   3. Se funcionar, feche e abra em aba normal" -ForegroundColor White
Write-Host "   4. Se NÃO funcionar, vá para chrome://net-internals/#hsts" -ForegroundColor White

Write-Host "`n💡 Se ainda der erro HSTS:" -ForegroundColor Cyan
Write-Host "   1. Abra: chrome://net-internals/#hsts" -ForegroundColor Yellow
Write-Host "   2. Em 'Delete domain security policies':" -ForegroundColor White
Write-Host "      - Digite: localhost" -ForegroundColor Yellow
Write-Host "      - Clique em 'Delete'" -ForegroundColor White
Write-Host "   3. Feche e abra o Chrome novamente" -ForegroundColor White

Write-Host "`n🎯 URL para testar:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor Yellow
Write-Host "   (Note o HTTP, não HTTPS!)" -ForegroundColor Gray

Write-Host "`nPressione ENTER para fechar..." -ForegroundColor Gray
Read-Host
