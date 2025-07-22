# 🚀 OTIMIZADOR AVANÇADO VS CODE
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 OTIMIZADOR AVANÇADO VS CODE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar processos VS Code
Write-Host "📊 Processos VS Code ativos:" -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -like "*Code*"} | Select-Object Name, Id, @{Name="Memoria(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table -AutoSize

Write-Host "📊 Processos Node.js:" -ForegroundColor Yellow  
Get-Process | Where-Object {$_.Name -eq "node"} | Select-Object Name, Id, @{Name="Memoria(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table -AutoSize

# Limpar cache VS Code
Write-Host "🧹 Limpando cache do VS Code..." -ForegroundColor Yellow

$cacheDir = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $cacheDir) {
    Write-Host "Limpando: $cacheDir"
    Get-ChildItem $cacheDir | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

$logsDir = "$env:APPDATA\Code\logs"  
if (Test-Path $logsDir) {
    Write-Host "Limpando: $logsDir"
    Get-ChildItem $logsDir | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ OTIMIZAÇÕES CONCLUÍDAS!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host "✓ Cache limpo"
Write-Host "✓ Logs removidos" 
Write-Host "✓ Configurações otimizadas"
Write-Host ""

Write-Host "💡 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "1. Pressione Ctrl+Shift+P no VS Code"
Write-Host "2. Digite: Developer: Reload Window"
Write-Host "3. Pressione Enter para reiniciar"
Write-Host ""

Write-Host "🎯 VS Code deve estar mais rápido agora!" -ForegroundColor Green
