$ErrorActionPreference = "Continue"

Write-Host "Fazendo login..." -ForegroundColor Yellow
$loginBody = '{"email":"admin@conectsuite.com.br","senha":"admin123"}'
try {
  $login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
  Write-Host "✅ Login OK" -ForegroundColor Green
    
  if ($login.data.access_token) {
    $token = $login.data.access_token
  }
  elseif ($login.accessToken) {
    $token = $login.accessToken
  }
  elseif ($login.access_token) {
    $token = $login.access_token
  }
  else {
    Write-Host "❌ Token não encontrado no response!" -ForegroundColor Red
    exit 1
  }
    
  Write-Host "Token obtido: $($token.Substring(0,50))..." -ForegroundColor Cyan
}
catch {
  Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
  exit 1
}

Write-Host "`nBuscando tickets..." -ForegroundColor Yellow
try {
  $tickets = Invoke-RestMethod -Uri "http://localhost:3001/atendimento/tickets" -Headers @{Authorization = "Bearer $token" }
}
catch {
  Write-Host "❌ Erro ao buscar tickets: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
  exit 1
}

if ($tickets.items) {
  Write-Host "✅ Encontrados: $($tickets.items.Count) tickets" -ForegroundColor Green
  $tickets.items | Select-Object -First 5 | ForEach-Object {
    Write-Host "  🎫 $($_.protocolo) | $($_.status) | $($_.origem) | $($_.contato_telefone)" -ForegroundColor White
  }
}
else {
  Write-Host "❌ Nenhum ticket encontrado" -ForegroundColor Red
}
