# Diagnóstico: ERR_CONNECTION_REFUSED

Write-Host "🔍 DIAGNÓSTICO: ERR_CONNECTION_REFUSED" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Verificar backend
Write-Host "`n1️⃣ VERIFICANDO BACKEND..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "   ✅ Backend rodando na porta 3001" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend NÃO está rodando" -ForegroundColor Red
    Write-Host "   💡 Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

# 2. Testar HTTP direto
Write-Host "`n2️⃣ TESTANDO HTTP DIRETO..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -UseBasicParsing
    Write-Host "   ✅ HTTP acessível: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "   ✅ HTTP acessível (404 esperado)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ HTTP não acessível: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Verificar firewall
Write-Host "`n3️⃣ VERIFICANDO FIREWALL..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule -DisplayName "*Node*" -ErrorAction SilentlyContinue
if ($firewallRules) {
    Write-Host "   ℹ️ Regras de firewall encontradas para Node.js" -ForegroundColor Cyan
    $firewallRules | ForEach-Object {
        Write-Host "      • $($_.DisplayName): $($_.Enabled)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️ Nenhuma regra de firewall para Node.js" -ForegroundColor Yellow
}

# 4. Verificar proxy do sistema
Write-Host "`n4️⃣ VERIFICANDO PROXY DO SISTEMA..." -ForegroundColor Yellow
$proxy = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue
if ($proxy.ProxyEnable -eq 1) {
    Write-Host "   ⚠️ PROXY ATIVO NO SISTEMA!" -ForegroundColor Red
    Write-Host "      Servidor: $($proxy.ProxyServer)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔧 SOLUÇÃO:" -ForegroundColor Cyan
    Write-Host "      No Chrome, adicionar exceção para localhost:" -ForegroundColor White
    Write-Host "      1. chrome://settings/system" -ForegroundColor Yellow
    Write-Host "      2. 'Open your computer's proxy settings'" -ForegroundColor Yellow
    Write-Host "      3. Em 'Bypass proxy server for', adicionar:" -ForegroundColor Yellow
    Write-Host "         localhost;127.0.0.1" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Nenhum proxy configurado" -ForegroundColor Green
}

# 5. IP detectado no erro (192.168.200.44)
Write-Host "`n5️⃣ ANALISANDO IP DO ERRO (192.168.200.44)..." -ForegroundColor Yellow
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
if ($networkAdapters) {
    Write-Host "   ℹ️ Adaptadores de rede encontrados:" -ForegroundColor Cyan
    $networkAdapters | ForEach-Object {
        Write-Host "      • $($_.IPAddress)" -ForegroundColor Gray
    }
    
    if ($networkAdapters.IPAddress -contains "192.168.200.44") {
        Write-Host ""
        Write-Host "   ⚠️ IP 192.168.200.44 encontrado no sistema!" -ForegroundColor Yellow
        Write-Host "      Pode haver configuração de proxy corporativo" -ForegroundColor Yellow
    }
}

Write-Host "`n6️⃣ SOLUÇÕES RECOMENDADAS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔧 SOLUÇÃO 1: Desabilitar Proxy no Chrome" -ForegroundColor Yellow
Write-Host "      1. Abrir Chrome" -ForegroundColor White
Write-Host "      2. Colar na barra de endereço:" -ForegroundColor White
Write-Host "         chrome://settings/system" -ForegroundColor Cyan
Write-Host "      3. Clicar em 'Open your computer's proxy settings'" -ForegroundColor White
Write-Host "      4. Na janela de configurações do Windows:" -ForegroundColor White
Write-Host "         • Desligar 'Use a proxy server' (se estiver ligado)" -ForegroundColor White
Write-Host "         OU" -ForegroundColor White
Write-Host "         • Em 'Use the proxy server except for addresses...':" -ForegroundColor White
Write-Host "           Adicionar: localhost;127.0.0.1;*.local" -ForegroundColor Cyan
Write-Host "      5. Salvar e recarregar o sistema" -ForegroundColor White
Write-Host ""

Write-Host "   🔧 SOLUÇÃO 2: Usar Extensão 'Proxy SwitchyOmega'" -ForegroundColor Yellow
Write-Host "      1. Instalar extensão no Chrome" -ForegroundColor White
Write-Host "      2. Configurar para NÃO usar proxy em localhost" -ForegroundColor White
Write-Host ""

Write-Host "   🔧 SOLUÇÃO 3: Adicionar Flag no Chrome" -ForegroundColor Yellow
Write-Host "      1. Fechar TODOS os Chromes" -ForegroundColor White
Write-Host "      2. Criar atalho do Chrome com flag:" -ForegroundColor White
Write-Host "         chrome.exe --proxy-bypass-list=localhost;127.0.0.1" -ForegroundColor Cyan
Write-Host ""

Write-Host "   🔧 SOLUÇÃO 4: Desabilitar proxy no .env (se existir)" -ForegroundColor Yellow
$envFile = "C:\Projetos\conectcrm\frontend-web\.env"
if (Test-Path $envFile) {
    $proxyConfig = Get-Content $envFile | Select-String "PROXY|proxy"
    if ($proxyConfig) {
        Write-Host "      ⚠️ Configuração de proxy encontrada no .env!" -ForegroundColor Red
        Write-Host "      Remova ou comente essas linhas:" -ForegroundColor Yellow
        $proxyConfig | ForEach-Object { Write-Host "         $_" -ForegroundColor Gray }
    } else {
        Write-Host "      ✅ Nenhuma configuração de proxy no .env" -ForegroundColor Green
    }
}

Write-Host "`n7️⃣ TESTE RÁPIDO NO CONSOLE DO NAVEGADOR:" -ForegroundColor Cyan
Write-Host ""
Write-Host "// Verificar se há proxy interferindo" -ForegroundColor Gray
Write-Host "fetch('http://localhost:3001')" -ForegroundColor Yellow
Write-Host "  .then(r => console.log('✅ Backend OK:', r.status))" -ForegroundColor Yellow
Write-Host "  .catch(e => console.error('❌ Erro:', e.message));" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host ""
