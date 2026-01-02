#!/usr/bin/env pwsh
# 🔄 Reiniciar sistema em modo rede local

Write-Host "🔄 Reiniciando Sistema em Modo Rede Local" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Parar processos existentes
Write-Host "`n1️⃣  Parando processos existentes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Encerrando $($nodeProcesses.Count) processo(s) Node.js..." -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Processos encerrados" -ForegroundColor Green
} else {
    Write-Host "   ✅ Nenhum processo Node.js rodando" -ForegroundColor Green
}

# 2. Detectar IP
Write-Host "`n2️⃣  Detectando IP da rede..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    Write-Host "   ❌ Não foi possível detectar o IP da rede!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ IP detectado: $ipAddress" -ForegroundColor Green

# 3. Verificar firewall
Write-Host "`n3️⃣  Verificando firewall..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule -DisplayName "ConectCRM*" -ErrorAction SilentlyContinue

if (-not $rules) {
    Write-Host "   ⚠️  Regras de firewall não encontradas" -ForegroundColor Yellow
    Write-Host "   Execute como administrador: .\scripts\configurar-firewall-admin.ps1" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Regras de firewall configuradas" -ForegroundColor Green
}

# 4. Iniciar Backend
Write-Host "`n4️⃣  Iniciando Backend..." -ForegroundColor Yellow
Write-Host "   Porta: 3001" -ForegroundColor Gray
Write-Host "   URL: http://${ipAddress}:3001" -ForegroundColor Gray

Start-Process pwsh -ArgumentList "-NoProfile", "-Command", "cd '$PSScriptRoot\..\backend'; npm run start:dev" -WindowStyle Normal

Write-Host "   ⏳ Aguardando backend inicializar (10 segundos)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 5. Verificar se backend iniciou
$backendTest = Test-NetConnection -ComputerName $ipAddress -Port 3001 -WarningAction SilentlyContinue
if ($backendTest.TcpTestSucceeded) {
    Write-Host "   ✅ Backend rodando!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend pode não ter iniciado completamente" -ForegroundColor Yellow
    Write-Host "   Verifique o terminal do backend" -ForegroundColor Gray
}

# 6. Iniciar Frontend
Write-Host "`n5️⃣  Iniciando Frontend..." -ForegroundColor Yellow
Write-Host "   Porta: 3000" -ForegroundColor Gray
Write-Host "   URL: http://${ipAddress}:3000" -ForegroundColor Gray

Start-Process pwsh -ArgumentList "-NoProfile", "-Command", "cd '$PSScriptRoot\..\frontend-web'; npm start" -WindowStyle Normal

# 7. Resumo
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Sistema Iniciado!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 URLs de Acesso:" -ForegroundColor Cyan
Write-Host "   Backend:  http://${ipAddress}:3001" -ForegroundColor Yellow
Write-Host "   Frontend: http://${ipAddress}:3000" -ForegroundColor Yellow

Write-Host "`n💡 Deste computador:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor White

Write-Host "`n📱 De outros dispositivos na rede:" -ForegroundColor Cyan
Write-Host "   http://${ipAddress}:3000" -ForegroundColor White

Write-Host "`n🔐 Login:" -ForegroundColor Cyan
Write-Host "   admin@conectsuite.com.br / admin123" -ForegroundColor White

Write-Host "`n🔧 Configuração Aplicada:" -ForegroundColor Cyan
Write-Host "   - API detecta automaticamente o host correto" -ForegroundColor White
Write-Host "   - WebSocket também usa detecção automática" -ForegroundColor White
Write-Host "   - Backend escuta em todas as interfaces (0.0.0.0)" -ForegroundColor White

Write-Host "`nPressione ENTER para fechar este script..." -ForegroundColor Gray
Read-Host
