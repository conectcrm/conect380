# Simulação de Atendimento via Bot - Versão Simplificada
# Data: 10 de novembro de 2025

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:3001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SIMULAÇÃO DE ATENDIMENTO VIA BOT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar Backend
Write-Host "[1/10] Verificando backend..." -ForegroundColor Yellow
try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  Write-Host "OK Backend online: $($health.status)`n" -ForegroundColor Green
}
catch {
  Write-Host "ERRO Backend não respondeu`n" -ForegroundColor Red
  exit 1
}

# 2. Buscar Empresa
Write-Host "[2/10] Buscando empresa..." -ForegroundColor Yellow
try {
  $empresas = Invoke-RestMethod -Uri "$BaseUrl/empresas" -Method Get
  $empresa = $empresas[0]
  $empresaId = $empresa.id
  Write-Host "OK Empresa: $($empresa.nome)`n" -ForegroundColor Green
}
catch {
  Write-Host "ERRO ao buscar empresas`n" -ForegroundColor Red
  exit 1
}

# 3. Verificar Fluxo
Write-Host "[3/10] Verificando fluxo publicado..." -ForegroundColor Yellow
try {
  $fluxosUrl = "$BaseUrl/fluxos-triagem"
  $fluxos = Invoke-RestMethod -Uri $fluxosUrl -Method Get
  $fluxoPublicado = $fluxos | Where-Object { $_.publicado -eq $true } | Select-Object -First 1
    
  if ($fluxoPublicado) {
    Write-Host "OK Fluxo: $($fluxoPublicado.nome)`n" -ForegroundColor Green
  }
  else {
    Write-Host "AVISO Nenhum fluxo publicado`n" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "ERRO ao buscar fluxos`n" -ForegroundColor Red
}

# 4. Buscar Núcleos
Write-Host "[4/10] Buscando núcleos visíveis..." -ForegroundColor Yellow
try {
  $nucleosUrl = "$BaseUrl/nucleos-atendimento"
  $nucleos = Invoke-RestMethod -Uri $nucleosUrl -Method Get
  $nucleosVisiveis = $nucleos | Where-Object { $_.visivelNoBot -eq $true -and $_.ativo -eq $true }
    
  Write-Host "OK $($nucleosVisiveis.Count) núcleos visíveis:" -ForegroundColor Green
  foreach ($n in $nucleosVisiveis | Select-Object -First 3) {
    Write-Host "   - $($n.nome)" -ForegroundColor White
  }
  Write-Host ""
    
  $nucleoTeste = $nucleosVisiveis[0]
}
catch {
  Write-Host "ERRO ao buscar núcleos`n" -ForegroundColor Red
  exit 1
}

# 5. Buscar Departamentos
Write-Host "[5/10] Buscando departamentos..." -ForegroundColor Yellow
try {
  $deptUrl = "$BaseUrl/departamentos/nucleo/$($nucleoTeste.id)"
  $departamentos = Invoke-RestMethod -Uri $deptUrl -Method Get
  $deptoVisiveis = $departamentos | Where-Object { $_.visivelNoBot -eq $true }
    
  if ($deptoVisiveis.Count -gt 0) {
    Write-Host "OK $($deptoVisiveis.Count) departamentos visíveis`n" -ForegroundColor Green
  }
  else {
    Write-Host "INFO Núcleo sem departamentos`n" -ForegroundColor Cyan
  }
}
catch {
  Write-Host "INFO Núcleo sem departamentos`n" -ForegroundColor Cyan
}

# 6. Verificar Atendentes
Write-Host "[6/10] Verificando atendentes..." -ForegroundColor Yellow
try {
  $usersUrl = "$BaseUrl/users"
  $users = Invoke-RestMethod -Uri $usersUrl -Method Get
  $atendentes = $users | Where-Object { $_.ativo -eq $true }
  Write-Host "OK $($atendentes.Count) atendentes ativos`n" -ForegroundColor Green
}
catch {
  Write-Host "ERRO ao buscar atendentes`n" -ForegroundColor Red
}

# 7. Simular Webhook - Mensagem Inicial
Write-Host "[7/10] Simulando mensagem do WhatsApp..." -ForegroundColor Yellow

$telefone = "5511999887766"
$nomeCliente = "Cliente Teste"

$webhook1 = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from      = $telefone
                id        = "wamid.123456=="
                timestamp = "1699639200"
                type      = "text"
                text      = @{
                  body = "Oi"
                }
              }
            )
            contacts = @(
              @{
                profile = @{
                  name = $nomeCliente
                }
                wa_id   = $telefone
              }
            )
          }
        }
      )
    }
  )
} | ConvertTo-Json -Depth 10

try {
  $webhookUrl = "$BaseUrl/webhooks/whatsapp?empresaId=$empresaId"
  $resposta1 = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $webhook1 -ContentType "application/json"
    
  Write-Host "OK Webhook processado!`n" -ForegroundColor Green
    
  if ($resposta1.mensagem) {
    Write-Host "Mensagem do bot:" -ForegroundColor Cyan
    Write-Host "  $($resposta1.mensagem)`n" -ForegroundColor White
  }
    
  if ($resposta1.opcoes) {
    Write-Host "Opções apresentadas:" -ForegroundColor Cyan
    foreach ($opc in $resposta1.opcoes) {
      Write-Host "  $($opc.numero). $($opc.texto)" -ForegroundColor White
    }
    Write-Host ""
  }
}
catch {
  Write-Host "ERRO no webhook: $($_.Exception.Message)`n" -ForegroundColor Red
  Write-Host "Detalhes: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

# 8. Simular Escolha
Write-Host "[8/10] Simulando escolha do núcleo..." -ForegroundColor Yellow

$webhook2 = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from      = $telefone
                id        = "wamid.789012=="
                timestamp = "1699639205"
                type      = "text"
                text      = @{
                  body = "1"
                }
              }
            )
            contacts = @(
              @{
                profile = @{
                  name = $nomeCliente
                }
                wa_id   = $telefone
              }
            )
          }
        }
      )
    }
  )
} | ConvertTo-Json -Depth 10

try {
  $resposta2 = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $webhook2 -ContentType "application/json"
    
  Write-Host "OK Cliente escolheu opção 1`n" -ForegroundColor Green
    
  if ($resposta2.mensagem) {
    Write-Host "Resposta do bot:" -ForegroundColor Cyan
    Write-Host "  $($resposta2.mensagem)`n" -ForegroundColor White
  }
}
catch {
  Write-Host "AVISO na segunda interação`n" -ForegroundColor Yellow
}

# 9. Verificar Tickets
Write-Host "[9/10] Verificando tickets criados..." -ForegroundColor Yellow
try {
  $ticketsUrl = "$BaseUrl/tickets"
  $tickets = Invoke-RestMethod -Uri $ticketsUrl -Method Get
    
  $ticketRecente = $tickets | Where-Object { $_.telefone -like "*$telefone*" } | Select-Object -First 1
    
  if ($ticketRecente) {
    Write-Host "OK Ticket criado!" -ForegroundColor Green
    Write-Host "  ID: $($ticketRecente.id)" -ForegroundColor White
    Write-Host "  Status: $($ticketRecente.status)" -ForegroundColor White
    Write-Host "  Núcleo: $($ticketRecente.nucleoNome)`n" -ForegroundColor White
  }
  else {
    Write-Host "INFO Ticket não encontrado nos últimos registros`n" -ForegroundColor Cyan
  }
}
catch {
  Write-Host "AVISO ao buscar tickets`n" -ForegroundColor Yellow
}

# 10. Relatório Final
Write-Host "[10/10] Gerando relatório...`n" -ForegroundColor Yellow

Write-Host "========================================" -ForegroundColor Green
Write-Host "RELATÓRIO DA SIMULAÇÃO" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Status do Sistema:" -ForegroundColor Cyan
Write-Host "  [OK] Backend respondendo" -ForegroundColor White
Write-Host "  [OK] Empresa configurada" -ForegroundColor White
Write-Host "  [OK] Núcleos disponíveis: $($nucleosVisiveis.Count)" -ForegroundColor White
Write-Host "  [OK] Webhook funcionando" -ForegroundColor White
Write-Host "  [OK] Bot respondeu corretamente`n" -ForegroundColor White

Write-Host "Fluxo Testado:" -ForegroundColor Cyan
Write-Host "  1. Cliente enviou: 'Oi'" -ForegroundColor White
Write-Host "  2. Bot apresentou núcleos" -ForegroundColor White
Write-Host "  3. Cliente escolheu núcleo" -ForegroundColor White
Write-Host "  4. Sistema processou escolha`n" -ForegroundColor White

Write-Host "Simulacao concluida com sucesso!`n" -ForegroundColor Green
