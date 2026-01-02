# 🧪 Teste Rápido WhatsApp - Verificar Credenciais
# Data: 11/12/2025

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE WHATSAPP - VERIFICAÇÃO RÁPIDA" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se backend está rodando
Write-Host "1️⃣  Verificando backend..." -ForegroundColor Yellow
$backend = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
if ($backend) {
  Write-Host "   ✅ Backend rodando na porta 3001`n" -ForegroundColor Green
}
else {
  Write-Host "   ❌ Backend NÃO está rodando!" -ForegroundColor Red
  Write-Host "   Execute: cd backend && npm run start:dev`n" -ForegroundColor Yellow
  exit 1
}

# 2. Buscar tickets disponíveis
Write-Host "2️⃣  Buscando tickets ativos..." -ForegroundColor Yellow

$token = "seu-token-jwt-aqui"  # ⚠️ Substitua se tiver autenticação
$headers = @{
  "Content-Type" = "application/json"
}

try {
  # Buscar lista de tickets (ajuste a rota conforme seu backend)
  $ticketsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/tickets" `
    -Method GET `
    -Headers $headers `
    -ErrorAction Stop
    
  if ($ticketsResponse.tickets -and $ticketsResponse.tickets.Count -gt 0) {
    $ticket = $ticketsResponse.tickets[0]
    $ticketId = $ticket.id
    $clienteNumero = $ticket.clienteNumero
        
    Write-Host "   ✅ Ticket encontrado:" -ForegroundColor Green
    Write-Host "      ID: $ticketId" -ForegroundColor White
    Write-Host "      Cliente: $clienteNumero`n" -ForegroundColor White
        
    # 3. Tentar enviar mensagem de teste
    Write-Host "3️⃣  Enviando mensagem de teste..." -ForegroundColor Yellow
        
    $mensagemBody = @{
      texto        = "🧪 Teste automatizado - credenciais atualizadas $(Get-Date -Format 'HH:mm:ss')"
      tipoMensagem = "text"
    } | ConvertTo-Json
        
    $envioResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/tickets/$ticketId/mensagens" `
      -Method POST `
      -Headers $headers `
      -Body $mensagemBody `
      -ErrorAction Stop
        
    Write-Host "   ✅ MENSAGEM ENVIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "      Message ID: $($envioResponse.messageId)" -ForegroundColor White
    Write-Host "      Status: $($envioResponse.status)`n" -ForegroundColor White
        
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ TESTE PASSOU - WHATSAPP FUNCIONAL!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
        
  }
  else {
    Write-Host "   ⚠️  Nenhum ticket ativo encontrado" -ForegroundColor Yellow
    Write-Host "   💡 Teste manual: Envie mensagem via UI`n" -ForegroundColor Cyan
  }
    
}
catch {
  Write-Host "   ❌ ERRO NO TESTE!" -ForegroundColor Red
  Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "   📄 Resposta do servidor:" -ForegroundColor Yellow
    Write-Host "   $responseBody`n" -ForegroundColor Red
        
    # Verificar se é erro #133010
    if ($responseBody -match "133010" -or $responseBody -match "Account not registered") {
      Write-Host "========================================" -ForegroundColor Red
      Write-Host "⚠️  ERRO #133010 - CREDENCIAIS AINDA INVÁLIDAS" -ForegroundColor Red
      Write-Host "========================================`n" -ForegroundColor Red
      Write-Host "Possíveis causas:" -ForegroundColor Yellow
      Write-Host "1. Token expirado/incorreto" -ForegroundColor White
      Write-Host "2. Phone Number ID não pertence à conta" -ForegroundColor White
      Write-Host "3. Número desconectado do WhatsApp Manager" -ForegroundColor White
      Write-Host "4. Permissões insuficientes no token`n" -ForegroundColor White
      Write-Host "📚 Consulte: docs/SOLUCAO_URGENTE_WHATSAPP_133010.md`n" -ForegroundColor Cyan
    }
  }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste concluído em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
