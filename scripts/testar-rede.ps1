#!/usr/bin/env pwsh
# 🧪 Testar conectividade de rede local

param(
    [string]$IP = "172.23.192.1"
)

Write-Host "🧪 Testando Conectividade de Rede Local" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📍 IP a testar: $IP" -ForegroundColor Yellow

# Teste 1: Backend (porta 3001)
Write-Host "`n1️⃣  Testando Backend (porta 3001)..." -ForegroundColor Cyan
try {
    $backend = Test-NetConnection -ComputerName $IP -Port 3001 -WarningAction SilentlyContinue
    if ($backend.TcpTestSucceeded) {
        Write-Host "   ✅ Backend acessível em http://${IP}:3001" -ForegroundColor Green
        
        # Tentar fazer request HTTP
        try {
            $response = Invoke-WebRequest -Uri "http://${IP}:3001" -TimeoutSec 5 -UseBasicParsing
            Write-Host "   ✅ HTTP OK (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Porta aberta mas HTTP não responde: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Backend não acessível" -ForegroundColor Red
        Write-Host "   Verifique se o backend está rodando" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao testar backend: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Frontend (porta 3000)
Write-Host "`n2️⃣  Testando Frontend (porta 3000)..." -ForegroundColor Cyan
try {
    $frontend = Test-NetConnection -ComputerName $IP -Port 3000 -WarningAction SilentlyContinue
    if ($frontend.TcpTestSucceeded) {
        Write-Host "   ✅ Frontend acessível em http://${IP}:3000" -ForegroundColor Green
        
        # Tentar fazer request HTTP
        try {
            $response = Invoke-WebRequest -Uri "http://${IP}:3000" -TimeoutSec 5 -UseBasicParsing
            Write-Host "   ✅ HTTP OK (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Porta aberta mas HTTP não responde: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Frontend não acessível" -ForegroundColor Red
        Write-Host "   Verifique se o frontend está rodando" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao testar frontend: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Firewall
Write-Host "`n3️⃣  Verificando Firewall..." -ForegroundColor Cyan
$rules = Get-NetFirewallRule -DisplayName "ConectCRM*" -ErrorAction SilentlyContinue

if ($rules) {
    Write-Host "   ✅ Regras de firewall encontradas:" -ForegroundColor Green
    $rules | ForEach-Object {
        $enabled = if ($_.Enabled) { "Habilitada" } else { "Desabilitada" }
        Write-Host "      - $($_.DisplayName): $enabled" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  Nenhuma regra de firewall encontrada" -ForegroundColor Yellow
    Write-Host "   Execute como administrador: .\scripts\configurar-firewall-admin.ps1" -ForegroundColor Gray
}

# Resumo
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📋 Resumo" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`nURLs para testar em outros dispositivos:" -ForegroundColor White
Write-Host "   Backend:  http://${IP}:3001" -ForegroundColor Yellow
Write-Host "   Frontend: http://${IP}:3000" -ForegroundColor Yellow

Write-Host "`n💡 Dicas:" -ForegroundColor Cyan
Write-Host "   1. Conecte o dispositivo na mesma rede WiFi" -ForegroundColor White
Write-Host "   2. Se não funcionar, execute o firewall como admin" -ForegroundColor White
Write-Host "   3. Temporariamente, pode desabilitar o firewall para testar" -ForegroundColor White

Write-Host "`nPressione ENTER para fechar..." -ForegroundColor Gray
Read-Host
