# Teste Direto na Meta API
$accessToken = 'EAALQrbLuMHwBQCHrD1nZBEUYVMXWGVn8808a5ASe5vrHUYZCgz3SZBOi60ZAZC8XfZBgHKBPYhmEvmS3bkA8PwHeNPw4C6TpEwUkk5JEpab2heXao3aQmY7xlMGfZBdvHM2F7pBSMd5zuSxKlcicMkkWXdGOVvMNaJSxEbMsvkJOQxPpiEdoKqvrZB4oPZAQbYgZDZD'
$phoneNumberId = '704423209430762'
$destinatario = '5562996689991'

Write-Host '🧪 Testando envio direto na Meta API...' -ForegroundColor Yellow

$body = @{
    messaging_product = 'whatsapp'
    to = $destinatario
    type = 'text'
    text = @{
        body = 'Teste direto Meta API - ' + (Get-Date -Format 'HH:mm:ss')
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v21.0/$phoneNumberId/messages" `
        -Method POST `
        -Headers @{
            'Authorization' = "Bearer $accessToken"
            'Content-Type' = 'application/json'
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host '✅ MENSAGEM ENVIADA COM SUCESSO!' -ForegroundColor Green
    Write-Host "   Message ID: $($response.messages[0].id)" -ForegroundColor White
    Write-Host '   Verifique o WhatsApp do número teste!' -ForegroundColor Cyan
} catch {
    Write-Host '❌ ERRO AO ENVIAR!' -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody -ForegroundColor Red
    }
}
