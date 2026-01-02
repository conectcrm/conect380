# Script para Testar Envio de Mensagem WhatsApp via Meta API
# Data: 11/12/2025

param(
    [string]$AccessToken = "EAALQrbLuMHwBQCHrD1nZBEUYVMXWGVn8808a5ASe5vrHUYZCgz3SZBOi60ZAZC8XfZBgHKBPYhmEvmS3bkA8PwHeNPw4C6TpEwUkk5JEpab2heXao3aQmY7xlMGfZBdvHM2F7pBSMd5zuSxKlcicMkkWXdGOVvMNaJSxEbMsvkJOQxPpiEdoKqvrZB4oPZAQbYgZDZD",
    [string]$PhoneNumberId = "704423209430762",
    [string]$DestinoNumero = "5562996689991",
    [string]$Mensagem = "🧪 Teste de envio via API - $(Get-Date -Format 'HH:mm:ss')"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📤 TESTE DE ENVIO - WhatsApp Business API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Configurações:" -ForegroundColor Yellow
Write-Host "   Phone Number ID: $PhoneNumberId" -ForegroundColor White
Write-Host "   Destino: $DestinoNumero" -ForegroundColor White
Write-Host "   Mensagem: $Mensagem`n" -ForegroundColor White

# URL da API do WhatsApp
$url = "https://graph.facebook.com/v21.0/$PhoneNumberId/messages"

# Payload da mensagem
$body = @{
    messaging_product = "whatsapp"
    recipient_type = "individual"
    to = $DestinoNumero
    type = "text"
    text = @{
        preview_url = $false
        body = $Mensagem
    }
} | ConvertTo-Json -Depth 10

# Headers
$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type" = "application/json"
}

Write-Host "📤 Enviando mensagem..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ MENSAGEM ENVIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "📊 Resposta da API:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    if ($response.messages -and $response.messages.Count -gt 0) {
        $messageId = $response.messages[0].id
        Write-Host "`n📬 Message ID: $messageId" -ForegroundColor Yellow
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "🔍 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "1️⃣  Verifique no celular (5562996689991):" -ForegroundColor Yellow
        Write-Host "   A mensagem deve chegar em alguns segundos!`n" -ForegroundColor White
        
        Write-Host "2️⃣  Responda a mensagem no WhatsApp:" -ForegroundColor Yellow
        Write-Host "   Sua resposta deve chegar no sistema via webhook`n" -ForegroundColor White
        
        Write-Host "3️⃣  Verifique no banco de dados:" -ForegroundColor Yellow
        Write-Host "   SELECT * FROM atendimento_mensagens" -ForegroundColor Gray
        Write-Host "   WHERE remetente LIKE '%5562996689991%'" -ForegroundColor Gray
        Write-Host "   ORDER BY created_at DESC LIMIT 5;`n" -ForegroundColor Gray
        
        Write-Host "========================================`n" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "❌ ERRO AO ENVIAR MENSAGEM" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    
    Write-Host "💥 Erro:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor White
    
    if ($_.Exception.Response) {
        Write-Host "`n📄 Resposta do servidor:" -ForegroundColor Yellow
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        try {
            $errorJson = $responseBody | ConvertFrom-Json
            $errorJson | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Red
            
            if ($errorJson.error) {
                Write-Host "`n🔍 Detalhes do erro:" -ForegroundColor Yellow
                Write-Host "   Código: $($errorJson.error.code)" -ForegroundColor White
                Write-Host "   Mensagem: $($errorJson.error.message)" -ForegroundColor White
                
                if ($errorJson.error.error_data) {
                    Write-Host "   Detalhes: $($errorJson.error.error_data.details)" -ForegroundColor White
                }
            }
        } catch {
            Write-Host $responseBody -ForegroundColor Red
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "💡 POSSÍVEIS CAUSAS:" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta
    
    Write-Host "1. Token expirado ou inválido" -ForegroundColor Yellow
    Write-Host "   Solução: Gerar novo token no Meta Developer Console`n" -ForegroundColor Gray
    
    Write-Host "2. Phone Number ID incorreto" -ForegroundColor Yellow
    Write-Host "   Solução: Verificar no Meta: WhatsApp > API Setup`n" -ForegroundColor Gray
    
    Write-Host "3. Número de destino não está na lista de teste" -ForegroundColor Yellow
    Write-Host "   Solução: Adicionar 5562996689991 em Phone Numbers`n" -ForegroundColor Gray
    
    Write-Host "4. App não tem permissões necessárias" -ForegroundColor Yellow
    Write-Host "   Solução: Verificar permissões no App Dashboard`n" -ForegroundColor Gray
    
    Write-Host "========================================`n" -ForegroundColor Cyan
}
