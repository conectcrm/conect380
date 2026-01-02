# Script para buscar ID da empresa

Write-Host "🔍 Buscando ID da empresa..." -ForegroundColor Yellow

# Conectar ao banco e buscar
$result = docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -t -c "SELECT id FROM empresas LIMIT 1;"

if ($result) {
  $empresaId = $result.Trim()
  Write-Host ""
  Write-Host "✅ ID da Empresa encontrado:" -ForegroundColor Green
  Write-Host "   $empresaId" -ForegroundColor Cyan
  # Buscar URL atual do ngrok
  $ngrokUrl = (curl http://127.0.0.1:4040/api/tunnels 2>$null | ConvertFrom-Json).tunnels[0].public_url
    
  if ($ngrokUrl) {
    $webhookUrl = "$ngrokUrl/api/atendimento/webhooks/whatsapp/$empresaId"
    Write-Host ""
    Write-Host "📋 Use esta URL completa no Meta:" -ForegroundColor Yellow
    Write-Host "   $webhookUrl" -ForegroundColor White
    Write-Host ""
        
    # Copiar para clipboard
    Set-Clipboard -Value $webhookUrl
    Write-Host "✅ URL completa copiada para área de transferência!" -ForegroundColor Green
  }
  else {
    Write-Host "⚠️  ngrok não está rodando! Execute: .\start-dev-with-ngrok.ps1" -ForegroundColor Yellow
  }
}
else {
  Write-Host "❌ Nenhuma empresa encontrada no banco de dados" -ForegroundColor Red
  Write-Host "   Execute: docker exec conectcrm-postgres psql -U postgres -d conectcrm" -ForegroundColor Yellow
}
