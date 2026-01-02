# ========================================
# 🔍 DIAGNÓSTICO: Mensagens WhatsApp não chegando
# ========================================
# Script para diagnosticar por que mensagens do WhatsApp não estão chegando no sistema
#
# Uso: .\scripts\diagnostico-mensagens-nao-chegam.ps1 -Numero "5562996689991"

param(
  [Parameter(Mandatory = $false)]
  [string]$Numero = "5562996689991"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 DIAGNÓSTICO: MENSAGENS NÃO CHEGANDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Número: $Numero`n" -ForegroundColor White

# 1. Verificar se backend está rodando
Write-Host "1️⃣  Verificando Backend..." -ForegroundColor Yellow
$backend = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
if ($backend) {
  Write-Host "   ✅ Backend rodando na porta 3001" -ForegroundColor Green
}
else {
  Write-Host "   ❌ Backend NÃO está rodando!" -ForegroundColor Red
  Write-Host "   💡 Execute: cd backend && npm run start:dev`n" -ForegroundColor Yellow
  exit 1
}

# 2. Verificar configuração do canal WhatsApp
Write-Host "`n2️⃣  Verificando Canal WhatsApp..." -ForegroundColor Yellow
Write-Host "   📋 Execute no DBeaver/pgAdmin:`n" -ForegroundColor Cyan
$sql1 = @"
SELECT 
    id,
    tipo,
    nome,
    ativo,
    webhook_url,
    webhook_verify_token,
    credenciais->>'whatsapp_phone_number_id' as phone_id,
    CASE 
        WHEN LENGTH(credenciais->>'whatsapp_api_token') > 20 THEN 'Token configurado ✅'
        ELSE 'Token ausente ❌'
    END as token_status
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
AND empresa_id = '11111111-1111-1111-1111-111111111111';
"@
Write-Host $sql1 -ForegroundColor White

# 3. Verificar últimas mensagens do número
Write-Host "`n3️⃣  Verificando Mensagens Recebidas..." -ForegroundColor Yellow
Write-Host "   📋 Execute no DBeaver/pgAdmin:`n" -ForegroundColor Cyan
$sql2 = @"
SELECT 
    m.id,
    m.ticket_id,
    m.remetente,
    m.tipo_remetente,
    LEFT(m.conteudo_texto, 50) as conteudo_preview,
    m.status,
    m.created_at,
    t.numero as ticket_numero,
    t.status as ticket_status
FROM atendimento_mensagens m
LEFT JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE m.remetente LIKE '%$Numero%'
ORDER BY m.created_at DESC
LIMIT 5;
"@
Write-Host $sql2 -ForegroundColor White

# 4. Verificar tickets do número
Write-Host "`n4️⃣  Verificando Tickets..." -ForegroundColor Yellow
Write-Host "   📋 Execute no DBeaver/pgAdmin:`n" -ForegroundColor Cyan
$sql3 = @"
SELECT 
    id,
    numero,
    contato_telefone,
    contato_nome,
    status,
    canal_id,
    ultima_mensagem_em,
    created_at
FROM atendimento_tickets
WHERE contato_telefone LIKE '%$Numero%'
ORDER BY created_at DESC
LIMIT 3;
"@
Write-Host $sql3 -ForegroundColor White

# 5. Checklist de verificação
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "📋 CHECKLIST DE VERIFICAÇÃO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "`n🌐 WEBHOOK CONFIGURADO NO META?" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://developers.facebook.com/apps" -ForegroundColor White
Write-Host "   2. Selecione seu App WhatsApp" -ForegroundColor White
Write-Host "   3. WhatsApp → Configuration" -ForegroundColor White
Write-Host "   4. Verifique se Webhook está configurado:" -ForegroundColor White
Write-Host "`n   📍 Callback URL deve ser algo como:" -ForegroundColor Yellow
Write-Host "      https://seu-dominio.com/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111" -ForegroundColor Green
Write-Host "      OU se local:" -ForegroundColor Yellow
Write-Host "      https://abc123.ngrok.io/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111" -ForegroundColor Green
Write-Host "`n   📍 Verify Token deve ser:" -ForegroundColor Yellow
Write-Host "      (consulte no banco: webhook_verify_token)" -ForegroundColor White
Write-Host "`n   📍 Webhook fields subscribed:" -ForegroundColor Yellow
Write-Host "      ✅ messages" -ForegroundColor Green

Write-Host "`n🔌 NGROK/TÚNEL ATIVO?" -ForegroundColor Cyan
Write-Host "   Se estiver usando ngrok ou localtunnel:" -ForegroundColor White
Write-Host "   - Verifique se o túnel está ativo" -ForegroundColor Gray
Write-Host "   - Atualize a URL do webhook no Meta (URL muda toda vez!)" -ForegroundColor Gray
Write-Host "   - Execute: ngrok http 3001" -ForegroundColor Yellow

Write-Host "`n📱 NÚMERO DE TESTE?" -ForegroundColor Cyan
Write-Host "   Se estiver usando Test Number:" -ForegroundColor White
Write-Host "   - Número $Numero deve estar adicionado como Test Recipient" -ForegroundColor Gray
Write-Host "   - Acesse: Meta Business Suite → WhatsApp → Test Numbers" -ForegroundColor Gray
Write-Host "   - Adicione o número na lista" -ForegroundColor Gray

Write-Host "`n🔍 LOGS DO BACKEND?" -ForegroundColor Cyan
Write-Host "   Observe o terminal do backend e procure por:" -ForegroundColor White
Write-Host "   - '📩 Webhook recebido' (mensagem chegou)" -ForegroundColor Green
Write-Host "   - '❌ phone_number_id não pertence à empresa' (config errada)" -ForegroundColor Red
Write-Host "   - '❌ Assinatura inválida' (secret incorreto)" -ForegroundColor Red

Write-Host "`n🧪 TESTAR WEBHOOK MANUALMENTE?" -ForegroundColor Cyan
Write-Host "   Execute este comando para simular webhook:" -ForegroundColor White
$curlTest = @'
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    "object" = "whatsapp_business_account"
    "entry" = @(
        @{
            "id" = "1922786558561358"
            "changes" = @(
                @{
                    "value" = @{
                        "messaging_product" = "whatsapp"
                        "metadata" = @{
                            "display_phone_number" = "15551597121"
                            "phone_number_id" = "704423209430762"
                        }
                        "messages" = @(
                            @{
                                "from" = "5562996689991"
                                "id" = "wamid.teste123"
                                "timestamp" = "1733933000"
                                "text" = @{
                                    "body" = "Mensagem de teste"
                                }
                                "type" = "text"
                            }
                        )
                    }
                    "field" = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111/test" -Method POST -Headers $headers -Body $body
'@
Write-Host $curlTest -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "💡 PROBLEMAS MAIS COMUNS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1️⃣  Webhook NÃO configurado no Meta (80% dos casos)" -ForegroundColor White
Write-Host "2️⃣  URL do ngrok mudou e não foi atualizada no Meta" -ForegroundColor White
Write-Host "3️⃣  Verify Token incorreto" -ForegroundColor White
Write-Host "4️⃣  Phone Number ID não corresponde ao configurado" -ForegroundColor White
Write-Host "5️⃣  Número de teste não adicionado como Test Recipient" -ForegroundColor White
Write-Host "6️⃣  App Secret incorreto (validação de assinatura)" -ForegroundColor White

Write-Host "`n📚 DOCUMENTAÇÃO ÚTIL:" -ForegroundColor Cyan
Write-Host "   - WhatsApp Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks" -ForegroundColor Gray
Write-Host "   - Ngrok: https://ngrok.com/docs" -ForegroundColor Gray
Write-Host "   - LocalTunnel: https://github.com/localtunnel/localtunnel`n" -ForegroundColor Gray

Write-Host "========================================`n" -ForegroundColor Cyan
