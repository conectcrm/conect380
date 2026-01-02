#!/usr/bin/env pwsh
# 🌐 Script para iniciar sistema em modo Rede Local
# Permite acesso de qualquer dispositivo na mesma rede

Write-Host "🌐 Iniciando ConectCRM em Modo Rede Local" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Obter IP da máquina
Write-Host "`n🔍 Detectando IP da máquina..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    Write-Host "❌ Não foi possível detectar o IP da rede!" -ForegroundColor Red
    Write-Host "   Verifique se está conectado a uma rede" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ IP detectado: $ipAddress" -ForegroundColor Green

# URLs de acesso
$backendUrl = "http://${ipAddress}:3001"
$frontendUrl = "http://${ipAddress}:3000"

Write-Host "`n📋 URLs de Acesso:" -ForegroundColor Cyan
Write-Host "   Backend:  $backendUrl" -ForegroundColor White
Write-Host "   Frontend: $frontendUrl" -ForegroundColor White

# Verificar se portas estão em uso
Write-Host "`n🔍 Verificando portas..." -ForegroundColor Yellow

$backend3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
$frontend3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($backend3001) {
    Write-Host "⚠️  Porta 3001 já está em uso (Backend)" -ForegroundColor Yellow
    Write-Host "   Se quiser reiniciar, encerre o processo primeiro" -ForegroundColor Gray
} else {
    Write-Host "✅ Porta 3001 disponível (Backend)" -ForegroundColor Green
}

if ($frontend3000) {
    Write-Host "⚠️  Porta 3000 já está em uso (Frontend)" -ForegroundColor Yellow
    Write-Host "   Se quiser reiniciar, encerre o processo primeiro" -ForegroundColor Gray
} else {
    Write-Host "✅ Porta 3000 disponível (Frontend)" -ForegroundColor Green
}

# Firewall
Write-Host "`n🛡️  Verificando regras de firewall..." -ForegroundColor Yellow

$firewallBackend = Get-NetFirewallRule -DisplayName "ConectCRM Backend" -ErrorAction SilentlyContinue
$firewallFrontend = Get-NetFirewallRule -DisplayName "ConectCRM Frontend" -ErrorAction SilentlyContinue

if (-not $firewallBackend -or -not $firewallFrontend) {
    Write-Host "⚠️  Regras de firewall não encontradas" -ForegroundColor Yellow
    Write-Host "   Deseja criar as regras agora? (Requer privilégios de administrador)" -ForegroundColor Gray
    Write-Host "   [S] Sim   [N] Não (pode não funcionar em outros dispositivos)" -ForegroundColor Cyan
    
    $response = Read-Host "   Escolha"
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "`n🔧 Criando regras de firewall..." -ForegroundColor Cyan
        
        try {
            New-NetFirewallRule -DisplayName "ConectCRM Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null
            Write-Host "✅ Regra criada: ConectCRM Backend (porta 3001)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao criar regra de backend: $_" -ForegroundColor Red
        }
        
        try {
            New-NetFirewallRule -DisplayName "ConectCRM Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null
            Write-Host "✅ Regra criada: ConectCRM Frontend (porta 3000)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao criar regra de frontend: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ Regras de firewall já existem" -ForegroundColor Green
}

# Instruções de uso
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📱 Como Acessar de Outros Dispositivos" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n1️⃣  Conecte o dispositivo na MESMA rede WiFi" -ForegroundColor White
Write-Host "2️⃣  Abra o navegador" -ForegroundColor White
Write-Host "3️⃣  Digite: $frontendUrl" -ForegroundColor Yellow
Write-Host "4️⃣  Login: admin@conectsuite.com.br / admin123" -ForegroundColor White

Write-Host "`n💡 Dica: Salve a URL nos favoritos do celular!" -ForegroundColor Green

# Aguardar confirmação
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Pressione ENTER para iniciar os servidores..." -ForegroundColor Cyan
Read-Host

# Iniciar Backend
Write-Host "`n🚀 Iniciando Backend..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoProfile", "-Command", "cd '$PSScriptRoot\..\backend'; npm run start:dev" -WindowStyle Normal

Write-Host "⏳ Aguardando backend inicializar (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Iniciar Frontend
Write-Host "`n🚀 Iniciando Frontend em modo rede..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoProfile", "-Command", "cd '$PSScriptRoot\..\frontend-web'; npm run start:network" -WindowStyle Normal

Write-Host "`n✅ Servidores iniciando!" -ForegroundColor Green
Write-Host "   Backend:  $backendUrl" -ForegroundColor White
Write-Host "   Frontend: $frontendUrl" -ForegroundColor White

Write-Host "`n📱 Agora você pode acessar de qualquer dispositivo na rede!" -ForegroundColor Cyan
Write-Host "   Use: $frontendUrl" -ForegroundColor Yellow

Write-Host "`nPressione ENTER para fechar este script (servidores continuarão rodando)..." -ForegroundColor Gray
Read-Host
