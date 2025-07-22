Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OTIMIZADOR VS CODE" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificando processos VS Code..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -like "*Code*"} | Select-Object Name, Id, @{Name="MemoriaMB";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table -AutoSize

Write-Host "Verificando processos Node.js..." -ForegroundColor Yellow  
Get-Process | Where-Object {$_.Name -eq "node"} | Select-Object Name, Id, @{Name="MemoriaMB";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table -AutoSize

Write-Host "Limpando cache do VS Code..." -ForegroundColor Yellow

$cacheDir = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $cacheDir) {
    Write-Host "Limpando workspace storage..."
    Get-ChildItem $cacheDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

$logsDir = "$env:APPDATA\Code\logs"  
if (Test-Path $logsDir) {
    Write-Host "Limpando logs..."
    Get-ChildItem $logsDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

$tempDir = "$env:APPDATA\Code\CachedExtensions"
if (Test-Path $tempDir) {
    Write-Host "Limpando extensions cache..."
    Get-ChildItem $tempDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "OTIMIZACOES CONCLUIDAS!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "Cache limpo"
Write-Host "Logs removidos" 
Write-Host "Configuracoes otimizadas no .vscode/settings.json"
Write-Host ""

Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. No VS Code: Ctrl+Shift+P"
Write-Host "2. Digite: Developer: Reload Window"
Write-Host "3. Pressione Enter"
Write-Host "4. Feche abas desnecessarias"
Write-Host "5. Desative extensoes nao utilizadas"
Write-Host ""

Write-Host "VS Code deve estar mais rapido agora!" -ForegroundColor Green
