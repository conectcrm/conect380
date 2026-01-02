# Diagnóstico: Por que um navegador funciona e outro não?

Write-Host "🔍 DIAGNÓSTICO DE COMPATIBILIDADE DE NAVEGADOR" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Verificar se serviços estão rodando
Write-Host "`n1️⃣ VERIFICANDO SERVIÇOS..." -ForegroundColor Yellow

$backend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($backend) {
  Write-Host "   ✅ Backend rodando na porta 3001" -ForegroundColor Green
}
else {
  Write-Host "   ❌ Backend NÃO está rodando na porta 3001" -ForegroundColor Red
  Write-Host "   💡 Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
}

if ($frontend) {
  Write-Host "   ✅ Frontend rodando na porta 3000" -ForegroundColor Green
}
else {
  Write-Host "   ❌ Frontend NÃO está rodando na porta 3000" -ForegroundColor Red
  Write-Host "   💡 Execute: cd frontend-web && npm start" -ForegroundColor Yellow
}

# 2. Testar conectividade backend
Write-Host "`n2️⃣ TESTANDO CONECTIVIDADE BACKEND..." -ForegroundColor Yellow

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -UseBasicParsing -ErrorAction Stop
  Write-Host "   ✅ Backend respondendo (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
  if ($_.Exception.Response.StatusCode -eq 404) {
    Write-Host "   ✅ Backend respondendo com 404 (esperado)" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ Backend não responde: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# 3. Testar CORS
Write-Host "`n3️⃣ TESTANDO CORS DO BACKEND..." -ForegroundColor Yellow

try {
  $headers = @{
    "Origin"                        = "http://localhost:3000"
    "Access-Control-Request-Method" = "GET"
  }
    
  $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Options -Headers $headers -UseBasicParsing -ErrorAction Stop
    
  $corsHeaders = $response.Headers
    
  if ($corsHeaders['Access-Control-Allow-Origin']) {
    Write-Host "   ✅ CORS configurado: $($corsHeaders['Access-Control-Allow-Origin'])" -ForegroundColor Green
  }
  else {
    Write-Host "   ⚠️ Header Access-Control-Allow-Origin não encontrado" -ForegroundColor Yellow
  }
    
  if ($corsHeaders['Access-Control-Allow-Methods']) {
    Write-Host "   ✅ Métodos permitidos: $($corsHeaders['Access-Control-Allow-Methods'])" -ForegroundColor Green
  }
    
  if ($corsHeaders['Access-Control-Allow-Headers']) {
    Write-Host "   ✅ Headers permitidos: $($corsHeaders['Access-Control-Allow-Headers'])" -ForegroundColor Green
  }
    
}
catch {
  Write-Host "   ⚠️ Erro ao testar CORS: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Verificar arquivo de configuração do frontend
Write-Host "`n4️⃣ VERIFICANDO CONFIGURAÇÃO DO FRONTEND..." -ForegroundColor Yellow

$envFile = "C:\Projetos\conectcrm\frontend-web\.env"
if (Test-Path $envFile) {
  Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
  $envContent = Get-Content $envFile
  $apiUrl = $envContent | Select-String "REACT_APP_API_URL"
  if ($apiUrl) {
    Write-Host "   📝 $apiUrl" -ForegroundColor Cyan
  }
  else {
    Write-Host "   ⚠️ REACT_APP_API_URL não definido (usando default: http://localhost:3001)" -ForegroundColor Yellow
  }
}
else {
  Write-Host "   ⚠️ Arquivo .env não encontrado (usando defaults)" -ForegroundColor Yellow
  Write-Host "   📝 API URL padrão: http://localhost:3001" -ForegroundColor Cyan
}

# 5. Testar API de login (endpoint real)
Write-Host "`n5️⃣ TESTANDO ENDPOINT DE LOGIN..." -ForegroundColor Yellow

try {
  $loginBody = @{
    email    = "admin@conectsuite.com.br"
    password = "admin123"
  } | ConvertTo-Json
    
  $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    
  if ($response.success -and $response.data.access_token) {
    Write-Host "   ✅ Endpoint de login funcionando" -ForegroundColor Green
    Write-Host "   ✅ Token JWT gerado com sucesso" -ForegroundColor Green
  }
  else {
    Write-Host "   ⚠️ Resposta inesperada do login" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "   ❌ Erro ao testar login: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verificar Storage/Cache do navegador
Write-Host "`n6️⃣ POSSÍVEIS CAUSAS DO PROBLEMA..." -ForegroundColor Yellow

Write-Host "`n   🌐 NAVEGADOR QUE FUNCIONA:" -ForegroundColor Green
Write-Host "      • Cookies/LocalStorage limpos" -ForegroundColor Gray
Write-Host "      • Cache de DNS atualizado" -ForegroundColor Gray
Write-Host "      • Sem extensões bloqueando requisições" -ForegroundColor Gray
Write-Host "      • CORS aceito corretamente" -ForegroundColor Gray

Write-Host "`n   ❌ NAVEGADOR QUE NÃO FUNCIONA:" -ForegroundColor Red
Write-Host "      • LocalStorage pode ter token expirado" -ForegroundColor Gray
Write-Host "      • Cache de JavaScript desatualizado" -ForegroundColor Gray
Write-Host "      • Extensões (AdBlock, NoScript, Privacy Badger)" -ForegroundColor Gray
Write-Host "      • CORS bloqueado por política de segurança" -ForegroundColor Gray
Write-Host "      • Service Worker antigo em cache" -ForegroundColor Gray

# 7. Soluções recomendadas
Write-Host "`n7️⃣ SOLUÇÕES RECOMENDADAS:" -ForegroundColor Cyan

Write-Host "`n   🔧 NO NAVEGADOR QUE NÃO FUNCIONA:" -ForegroundColor Yellow
Write-Host "      1. Abrir DevTools (F12)" -ForegroundColor White
Write-Host "      2. Ir para Console e verificar erros" -ForegroundColor White
Write-Host "      3. Ir para Network e ver se requisições para localhost:3001 falham" -ForegroundColor White
Write-Host "      4. Limpar LocalStorage:" -ForegroundColor White
Write-Host "         • Console → localStorage.clear()" -ForegroundColor Gray
Write-Host "      5. Limpar cache e recarregar:" -ForegroundColor White
Write-Host "         • Ctrl+Shift+R (force reload)" -ForegroundColor Gray
Write-Host "         • Ou Ctrl+Shift+Delete → Limpar cache" -ForegroundColor Gray
Write-Host "      6. Desabilitar extensões temporariamente" -ForegroundColor White
Write-Host "      7. Tentar modo anônimo/privado" -ForegroundColor White

Write-Host "`n   🔍 VERIFICAR NO CONSOLE DO NAVEGADOR:" -ForegroundColor Yellow
Write-Host "      • CORS errors" -ForegroundColor White
Write-Host "      • Network errors (net::ERR_CONNECTION_REFUSED)" -ForegroundColor White
Write-Host "      • 401 Unauthorized (token inválido)" -ForegroundColor White
Write-Host "      • Mixed Content (HTTPS/HTTP)" -ForegroundColor White

Write-Host "`n   📋 INFORMAÇÕES PARA DEBUGGING:" -ForegroundColor Yellow
Write-Host "      • Qual navegador funciona? (Chrome, Edge, Firefox...)" -ForegroundColor White
Write-Host "      • Qual navegador NÃO funciona?" -ForegroundColor White
Write-Host "      • Versão do navegador" -ForegroundColor White
Write-Host "      • Erros no Console (F12)" -ForegroundColor White
Write-Host "      • Status das requisições no Network tab" -ForegroundColor White

Write-Host "`n✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host "   Abra o navegador com problema e verifique os itens acima." -ForegroundColor White
Write-Host ""
