# ========================================
# 🧪 TESTE DE WEBHOOK - SIMULAR META ENVIANDO MENSAGEM
# ========================================
# Este script simula o Meta enviando uma mensagem via webhook
# para verificar se o sistema está recebendo corretamente

param(
    [Parameter(Mandatory=$false)]
    [string]$NgrokUrl = "https://3a7c1c8cb884.ngrok-free.app",
    
    [Parameter(Mandatory=$false)]
    [string]$Numero = "5562996689991",
    
    [Parameter(Mandatory=$false)]
    [string]$Mensagem = "Teste de webhook via ngrok"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE DE WEBHOOK VIA NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URL: $NgrokUrl" -ForegroundColor White
Write-Host "Número: $Numero" -ForegroundColor White
Write-Host "Mensagem: $Mensagem`n" -ForegroundColor White

# Preparar payload exatamente como o Meta envia
$headers = @{
    "Content-Type" = "application/json"
    "X-Hub-Signature-256" = "sha256=test" # Será validado pelo backend
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$messageId = "wamid.test_" + $timestamp

$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "1922786558561358"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "15551597121"
                            phone_number_id = "704423209430762"
                        }
                        contacts = @(
                            @{
                                profile = @{
                                    name = "Teste Webhook"
                                }
                                wa_id = $Numero
                            }
                        )
                        messages = @(
                            @{
                                from = $Numero
                                id = $messageId
                                timestamp = $timestamp.ToString()
                                text = @{
                                    body = $Mensagem
                                }
                                type = "text"
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando webhook..." -ForegroundColor Yellow

try {
    # Tentar endpoint de teste primeiro (sem validação de assinatura)
    Write-Host "`n1️⃣  Testando endpoint /test (sem validação)..." -ForegroundColor Cyan
    
    $testUrl = "$NgrokUrl/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111/test"
    
    $response = Invoke-RestMethod -Uri $testUrl -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "`n📊 Resposta do servidor:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`n🔍 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Verifique no banco se a mensagem foi criada:" -ForegroundColor White
    Write-Host "      SELECT * FROM atendimento_mensagens WHERE remetente LIKE '%$Numero%' ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Gray
    Write-Host "`n   2. Verifique se o ticket foi criado/atualizado:" -ForegroundColor White
    Write-Host "      SELECT * FROM atendimento_tickets WHERE contato_telefone LIKE '%$Numero%' ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Gray
    Write-Host "`n   3. Envie uma mensagem REAL do WhatsApp agora!" -ForegroundColor White
    Write-Host "      Se o teste funcionou, mensagens reais também devem funcionar.`n" -ForegroundColor Gray
    
} catch {
    Write-Host "   ❌ ERRO!" -ForegroundColor Red
    Write-Host "`n📋 Detalhes do erro:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`n📄 Resposta do servidor:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "💡 POSSÍVEIS CAUSAS:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "1️⃣  Ngrok não está rodando" -ForegroundColor White
    Write-Host "   Execute: ngrok http 3001`n" -ForegroundColor Gray
    
    Write-Host "2️⃣  Backend não está rodando" -ForegroundColor White
    Write-Host "   Execute: cd backend && npm run start:dev`n" -ForegroundColor Gray
    
    Write-Host "3️⃣  URL do ngrok mudou" -ForegroundColor White
    Write-Host "   Verifique a URL atual do ngrok" -ForegroundColor Gray
    Write-Host "   Atualize no Meta Developer Console`n" -ForegroundColor Gray
    
    Write-Host "4️⃣  Phone Number ID incorreto no payload" -ForegroundColor White
    Write-Host "   Verifique: SELECT credenciais->>'whatsapp_phone_number_id' FROM atendimento_canais_configuracao WHERE tipo = 'whatsapp_business_api';`n" -ForegroundColor Gray
    
    exit 1
}

Write-Host "========================================`n" -ForegroundColor Cyan
