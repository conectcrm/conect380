#!/usr/bin/env pwsh
# 🧪 Testar acesso em rede - Guia Completo

Write-Host "🧪 Teste de Acesso em Rede Local" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Detectar IP
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

Write-Host "`n📍 IP desta máquina (servidor):" -ForegroundColor Yellow
Write-Host "   $ipAddress" -ForegroundColor White

# Verificar se backend e frontend estão rodando
Write-Host "`n🔍 Verificando serviços..." -ForegroundColor Yellow

$backend = Test-NetConnection -ComputerName $ipAddress -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet
$frontend = Test-NetConnection -ComputerName $ipAddress -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($backend) {
    Write-Host "   ✅ Backend rodando (porta 3001)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend NÃO está rodando!" -ForegroundColor Red
    Write-Host "   Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
}

if ($frontend) {
    Write-Host "   ✅ Frontend rodando (porta 3000)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend NÃO está rodando!" -ForegroundColor Red
    Write-Host "   Execute: cd frontend-web && npm start" -ForegroundColor Yellow
}

if (-not $backend -or -not $frontend) {
    Write-Host "`n❌ Serviços não estão rodando. Execute:" -ForegroundColor Red
    Write-Host "   .\scripts\reiniciar-rede.ps1" -ForegroundColor Yellow
    exit 1
}

# Firewall
Write-Host "`n🛡️  Verificando firewall..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule -DisplayName "ConectCRM*" -ErrorAction SilentlyContinue

if (-not $rules) {
    Write-Host "   ⚠️  Regras de firewall NÃO configuradas" -ForegroundColor Yellow
    Write-Host "   Se não funcionar, execute como admin:" -ForegroundColor Gray
    Write-Host "   .\scripts\configurar-firewall-admin.ps1" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Regras de firewall configuradas" -ForegroundColor Green
}

# Guia de teste
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📱 Como Testar de Outra Máquina/Celular" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n1️⃣  CONECTAR NA MESMA REDE WiFi" -ForegroundColor White
Write-Host "   - Celular, tablet ou outro PC" -ForegroundColor Gray
Write-Host "   - MESMA rede que este computador" -ForegroundColor Gray

Write-Host "`n2️⃣  ABRIR NAVEGADOR" -ForegroundColor White
Write-Host "   - Chrome, Safari, Firefox, etc." -ForegroundColor Gray

Write-Host "`n3️⃣  DIGITAR A URL:" -ForegroundColor White
Write-Host "   http://${ipAddress}:3000" -ForegroundColor Yellow
Write-Host "   (Copie e cole exatamente isso)" -ForegroundColor Gray

Write-Host "`n4️⃣  FAZER LOGIN:" -ForegroundColor White
Write-Host "   Email: admin@conectsuite.com.br" -ForegroundColor Yellow
Write-Host "   Senha: admin123" -ForegroundColor Yellow

Write-Host "`n💡 DICAS:" -ForegroundColor Cyan
Write-Host "   - NÃO use HTTPS (apenas HTTP)" -ForegroundColor White
Write-Host "   - Se não carregar, verifique firewall" -ForegroundColor White
Write-Host "   - Teste primeiro no navegador DESTE PC:" -ForegroundColor White
Write-Host "     http://${ipAddress}:3000" -ForegroundColor Yellow

Write-Host "`n🐛 SE DER ERRO:" -ForegroundColor Cyan
Write-Host "   1. Verifique se está na mesma rede WiFi" -ForegroundColor White
Write-Host "   2. Desabilite firewall temporariamente (teste)" -ForegroundColor White
Write-Host "   3. Verifique se IP está correto: $ipAddress" -ForegroundColor White
Write-Host "   4. Abra o DevTools (F12) e veja console" -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "🔧 URLs de Teste" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📱 De QUALQUER dispositivo na rede:" -ForegroundColor Cyan
Write-Host "   Frontend: http://${ipAddress}:3000" -ForegroundColor Yellow
Write-Host "   Backend:  http://${ipAddress}:3001" -ForegroundColor Yellow

Write-Host "`n💻 Deste computador (local):" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Yellow

Write-Host "`n📋 Rede Detectada:" -ForegroundColor Cyan
Write-Host "   IP: $ipAddress" -ForegroundColor White
Write-Host "   Máscara: $(Get-NetIPAddress -IPAddress $ipAddress | Select-Object -ExpandProperty PrefixLength)" -ForegroundColor White

Write-Host "`nPressione ENTER para abrir teste no navegador local..." -ForegroundColor Gray
Read-Host

# Abrir navegador para teste
Start-Process "http://${ipAddress}:3000"

Write-Host "`n✅ Navegador aberto com http://${ipAddress}:3000" -ForegroundColor Green
Write-Host "   Se funcionar aqui, funcionará em outros dispositivos!" -ForegroundColor White

Write-Host "`nPressione ENTER para fechar..." -ForegroundColor Gray
Read-Host
