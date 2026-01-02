# 🔍 Verificar Credenciais WhatsApp na Meta API
# Data: 11/12/2025

param(
  [string]$PhoneNumberId = "704423209430762",
  [string]$AccessToken = ""  # Será preenchido do banco
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 DIAGNÓSTICO WHATSAPP - META API" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Se token não foi fornecido, tentar buscar do banco
if ([string]::IsNullOrWhiteSpace($AccessToken)) {
  Write-Host "⚠️  Access Token não fornecido" -ForegroundColor Yellow
  Write-Host "   Por favor, execute este comando COM o token:`n" -ForegroundColor White
  Write-Host "   .\scripts\verificar-credenciais-meta.ps1 -AccessToken 'SEU_TOKEN_AQUI'`n" -ForegroundColor Cyan
    
  Write-Host "📋 Para obter o token do banco de dados:" -ForegroundColor Yellow
  Write-Host @"
    
    -- No PostgreSQL/DBeaver:
    SELECT 
        credenciais->>'whatsapp_api_token' as token_preview,
        LENGTH(credenciais->>'whatsapp_api_token') as token_length,
        credenciais->>'whatsapp_phone_number_id' as phone_id,
        ativo,
        "updatedAt"
    FROM atendimento_canais_configuracao
    WHERE tipo = 'whatsapp_business_api'
    ORDER BY "updatedAt" DESC
    LIMIT 1;
    
"@ -ForegroundColor White
    
  exit 1
}

Write-Host "🔍 Testando credenciais na Meta Graph API...`n" -ForegroundColor Yellow

# 1. Testar Phone Number ID
Write-Host "1️⃣  Teste 1: Verificar Phone Number ID" -ForegroundColor Cyan
Write-Host "   Phone Number ID: $PhoneNumberId`n" -ForegroundColor White

try {
  $uri = "https://graph.facebook.com/v21.0/$PhoneNumberId"
  $headers = @{
    "Authorization" = "Bearer $AccessToken"
  }
    
  Write-Host "   📡 Fazendo requisição para Meta API..." -ForegroundColor Gray
  $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    
  Write-Host "   ✅ PHONE NUMBER ID VÁLIDO!`n" -ForegroundColor Green
  Write-Host "   📱 Detalhes do Número:" -ForegroundColor Yellow
  Write-Host "      ID: $($response.id)" -ForegroundColor White
  Write-Host "      Número: $($response.display_phone_number)" -ForegroundColor White
  Write-Host "      Nome Verificado: $($response.verified_name)" -ForegroundColor White
  Write-Host "      Quality Rating: $($response.quality_rating)" -ForegroundColor White
  Write-Host "      Code Verification: $($response.code_verification_status)`n" -ForegroundColor White
    
  $phoneNumberValido = $true
    
}
catch {
  Write-Host "   ❌ ERRO AO VALIDAR PHONE NUMBER ID!" -ForegroundColor Red
    
  if ($_.Exception.Response) {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Status: $statusCode" -ForegroundColor Red
        
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
      Write-Host "   Erro: $($errorBody.error.message)" -ForegroundColor Red
      Write-Host "   Código: $($errorBody.error.code)" -ForegroundColor Red
      Write-Host "   Type: $($errorBody.error.type)`n" -ForegroundColor Red
            
      if ($errorBody.error.code -eq 190) {
        Write-Host "   🔴 TOKEN INVÁLIDO OU EXPIRADO!" -ForegroundColor Red
        Write-Host "   Gere um novo token em: https://business.facebook.com`n" -ForegroundColor Yellow
      }
            
      if ($errorBody.error.code -eq 133010) {
        Write-Host "   🔴 PHONE NUMBER ID NÃO PERTENCE À CONTA DO TOKEN!" -ForegroundColor Red
        Write-Host "   Verifique se o Phone Number ID está correto`n" -ForegroundColor Yellow
      }
            
    }
    catch {
      Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    }
  }
    
  $phoneNumberValido = $false
}

# 2. Testar envio de mensagem (se Phone Number válido)
if ($phoneNumberValido) {
  Write-Host "`n2️⃣  Teste 2: Simular Envio de Mensagem" -ForegroundColor Cyan
  Write-Host "   ⚠️  NOTA: Não enviará mensagem real, apenas valida permissões`n" -ForegroundColor Yellow
    
  # Verificar permissões do token
  Write-Host "   🔐 Verificando permissões do token..." -ForegroundColor Gray
    
  try {
    $debugUri = "https://graph.facebook.com/debug_token?input_token=$AccessToken&access_token=$AccessToken"
    $debugResponse = Invoke-RestMethod -Uri $debugUri -Method GET -ErrorAction Stop
        
    Write-Host "   ✅ Token válido!`n" -ForegroundColor Green
    Write-Host "   🔑 Detalhes do Token:" -ForegroundColor Yellow
    Write-Host "      App ID: $($debugResponse.data.app_id)" -ForegroundColor White
    Write-Host "      Válido: $($debugResponse.data.is_valid)" -ForegroundColor White
    Write-Host "      Expira em: $(if ($debugResponse.data.expires_at -eq 0) { 'Nunca (permanente)' } else { (Get-Date '1970-01-01').AddSeconds($debugResponse.data.expires_at) })" -ForegroundColor White
        
    if ($debugResponse.data.scopes) {
      Write-Host "      Permissões:" -ForegroundColor White
      $debugResponse.data.scopes | ForEach-Object {
        $required = ($_ -eq "whatsapp_business_messaging" -or $_ -eq "whatsapp_business_management")
        $color = if ($required) { "Green" } else { "Gray" }
        $icon = if ($required) { "✅" } else { "  " }
        Write-Host "         $icon $_" -ForegroundColor $color
      }
    }
        
    Write-Host ""
        
    # Verificar se tem as permissões necessárias
    $hasMessaging = $debugResponse.data.scopes -contains "whatsapp_business_messaging"
    $hasManagement = $debugResponse.data.scopes -contains "whatsapp_business_management"
        
    if (-not $hasMessaging -or -not $hasManagement) {
      Write-Host "   ⚠️  PERMISSÕES INSUFICIENTES!" -ForegroundColor Red
      Write-Host "   O token precisa das permissões:" -ForegroundColor Yellow
      if (-not $hasMessaging) {
        Write-Host "      ❌ whatsapp_business_messaging (FALTANDO)" -ForegroundColor Red
      }
      if (-not $hasManagement) {
        Write-Host "      ❌ whatsapp_business_management (FALTANDO)" -ForegroundColor Red
      }
      Write-Host "`n   Gere um novo token com essas permissões em:" -ForegroundColor Yellow
      Write-Host "   https://business.facebook.com → System Users → Generate Token`n" -ForegroundColor Cyan
    }
    else {
      Write-Host "   ✅ Permissões corretas!`n" -ForegroundColor Green
    }
        
  }
  catch {
    Write-Host "   ⚠️  Não foi possível verificar permissões do token" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Gray
  }
}

# 3. Resumo Final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DO DIAGNÓSTICO" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if ($phoneNumberValido) {
  Write-Host "✅ Phone Number ID: VÁLIDO" -ForegroundColor Green
  Write-Host "✅ Access Token: VÁLIDO" -ForegroundColor Green
  Write-Host "`n🤔 Mas ainda assim o erro #133010 persiste?`n" -ForegroundColor Yellow
    
  Write-Host "📋 Possíveis causas:" -ForegroundColor Yellow
  Write-Host "   1. Número desconectado do WhatsApp Manager" -ForegroundColor White
  Write-Host "   2. Phone Number ID de outra conta/projeto" -ForegroundColor White
  Write-Host "   3. Delay de sincronização da Meta (aguarde 5-10 min)" -ForegroundColor White
  Write-Host "   4. Business Account ID incorreto no banco" -ForegroundColor White
  Write-Host "`n📚 Próximos passos:" -ForegroundColor Yellow
  Write-Host "   1. Verificar no WhatsApp Manager se número está 'Connected' (verde)" -ForegroundColor Cyan
  Write-Host "   2. Confirmar que Phone Number ID pertence à mesma WABA do token" -ForegroundColor Cyan
  Write-Host "   3. Aguardar 5 minutos e testar novamente" -ForegroundColor Cyan
  Write-Host "   4. Se persistir, regenerar token e reconectar número`n" -ForegroundColor Cyan
    
}
else {
  Write-Host "❌ Phone Number ID ou Token: INVÁLIDO" -ForegroundColor Red
  Write-Host "`n📋 Ações necessárias:" -ForegroundColor Yellow
  Write-Host "   1. Acessar: https://business.facebook.com" -ForegroundColor Cyan
  Write-Host "   2. Ir em: WhatsApp Manager → Configurações" -ForegroundColor Cyan
  Write-Host "   3. Copiar Phone Number ID correto" -ForegroundColor Cyan
  Write-Host "   4. Gerar novo System User token (60 dias)" -ForegroundColor Cyan
  Write-Host "   5. Atualizar no banco de dados" -ForegroundColor Cyan
  Write-Host "   6. Testar novamente`n" -ForegroundColor Cyan
}

Write-Host "========================================`n" -ForegroundColor Cyan
