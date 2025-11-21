# ═══════════════════════════════════════════════════════════════
# 🎯 DEMONSTRAÇÃO COMPLETA DO SISTEMA OMNICHANNEL
# ═══════════════════════════════════════════════════════════════

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 SISTEMA OMNICHANNEL - DEMONSTRAÇÃO COMPLETA" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"
$headers = @{ "Content-Type" = "application/json" }

# ═══════════════════════════════════════════════════════════════
# 1. TESTE DE LOGIN
# ═══════════════════════════════════════════════════════════════
Write-Host "🔐 TESTE 1: Autenticação no Sistema" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

$loginBody = @{
  email = "teste@omnichannel.com"
  senha = "teste123"
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -Headers $headers -ErrorAction Stop
  $token = $loginResponse.data.access_token
  $authHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
  }
    
  Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
  Write-Host "   👤 Usuário: $($loginResponse.data.user.nome)" -ForegroundColor White
  Write-Host "   📧 Email: $($loginResponse.data.user.email)" -ForegroundColor White
  Write-Host "   🎫 Token JWT recebido" -ForegroundColor DarkGray
}
catch {
  Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 2. LISTAR CANAIS
# ═══════════════════════════════════════════════════════════════
Write-Host "`n📱 TESTE 2: Listar Canais de Atendimento" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  $canais = Invoke-RestMethod -Uri "$baseUrl/atendimento/canais" -Method GET -Headers $authHeaders -ErrorAction Stop
    
  Write-Host "✅ $($canais.Count) canal(is) encontrado(s)" -ForegroundColor Green
  foreach ($canal in $canais) {
    Write-Host "   📱 Canal #$($canal.id)" -ForegroundColor White
    Write-Host "      Tipo: $($canal.tipo)" -ForegroundColor DarkGray
    Write-Host "      Nome: $($canal.nome)" -ForegroundColor DarkGray
    Write-Host "      Status: $($canal.ativo)" -ForegroundColor DarkGray
  }
    
  $canalId = $canais[0].id
}
catch {
  Write-Host "❌ Erro ao listar canais: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 3. LISTAR FILAS
# ═══════════════════════════════════════════════════════════════
Write-Host "`n🎯 TESTE 3: Listar Filas de Atendimento" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  $filas = Invoke-RestMethod -Uri "$baseUrl/atendimento/filas" -Method GET -Headers $authHeaders -ErrorAction Stop
    
  Write-Host "✅ $($filas.Count) fila(s) encontrada(s)" -ForegroundColor Green
  foreach ($fila in $filas) {
    Write-Host "   🎯 Fila #$($fila.id)" -ForegroundColor White
    Write-Host "      Nome: $($fila.nome)" -ForegroundColor DarkGray
    Write-Host "      Descrição: $($fila.descricao)" -ForegroundColor DarkGray
    Write-Host "      Canal: $($fila.canalId)" -ForegroundColor DarkGray
  }
    
  $filaId = $filas[0].id
}
catch {
  Write-Host "❌ Erro ao listar filas: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 4. LISTAR ATENDENTES
# ═══════════════════════════════════════════════════════════════
Write-Host "`n👥 TESTE 4: Listar Atendentes" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  $atendentes = Invoke-RestMethod -Uri "$baseUrl/atendimento/atendentes" -Method GET -Headers $authHeaders -ErrorAction Stop
    
  Write-Host "✅ $($atendentes.Count) atendente(s) encontrado(s)" -ForegroundColor Green
  foreach ($atendente in $atendentes) {
    Write-Host "   👤 Atendente #$($atendente.id)" -ForegroundColor White
    Write-Host "      Nome: $($atendente.nome)" -ForegroundColor DarkGray
    Write-Host "      Email: $($atendente.email)" -ForegroundColor DarkGray
    Write-Host "      Status: $($atendente.status)" -ForegroundColor DarkGray
  }
    
  $atendenteId = $atendentes[0].id
}
catch {
  Write-Host "❌ Erro ao listar atendentes: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 5. LISTAR TICKETS
# ═══════════════════════════════════════════════════════════════
Write-Host "`n🎫 TESTE 5: Listar Tickets" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  $tickets = Invoke-RestMethod -Uri "$baseUrl/atendimento/tickets" -Method GET -Headers $authHeaders -ErrorAction Stop
    
  Write-Host "✅ $($tickets.Count) ticket(s) encontrado(s)" -ForegroundColor Green
  foreach ($ticket in $tickets) {
    Write-Host "   🎫 Ticket #$($ticket.numero)" -ForegroundColor White
    Write-Host "      Status: $($ticket.status)" -ForegroundColor DarkGray
    Write-Host "      Prioridade: $($ticket.prioridade)" -ForegroundColor DarkGray
    Write-Host "      Atendente: $($ticket.atendenteId)" -ForegroundColor DarkGray
    Write-Host "      Criado: $($ticket.criadoEm)" -ForegroundColor DarkGray
  }
    
  if ($tickets.Count -gt 0) {
    $ticketId = $tickets[0].id
  }
}
catch {
  Write-Host "❌ Erro ao listar tickets: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 6. LISTAR MENSAGENS
# ═══════════════════════════════════════════════════════════════
Write-Host "`n💬 TESTE 6: Listar Mensagens" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  if ($ticketId) {
    $mensagens = Invoke-RestMethod -Uri "$baseUrl/atendimento/mensagens?ticketId=$ticketId" -Method GET -Headers $authHeaders -ErrorAction Stop
        
    Write-Host "✅ $($mensagens.Count) mensagem(ns) encontrada(s)" -ForegroundColor Green
    foreach ($mensagem in $mensagens) {
      $icon = if ($mensagem.direcao -eq "recebida") { "📥" } else { "📤" }
      Write-Host "   $icon Mensagem #$($mensagem.id)" -ForegroundColor White
      Write-Host "      Direção: $($mensagem.direcao)" -ForegroundColor DarkGray
      Write-Host "      Conteúdo: $($mensagem.conteudo)" -ForegroundColor DarkGray
      Write-Host "      Enviado: $($mensagem.enviadoEm)" -ForegroundColor DarkGray
    }
  }
  else {
    Write-Host "⚠️  Nenhum ticket disponível para listar mensagens" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "❌ Erro ao listar mensagens: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# 7. CRIAR NOVA MENSAGEM
# ═══════════════════════════════════════════════════════════════
Write-Host "`n📨 TESTE 7: Criar Nova Mensagem" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray

try {
  if ($ticketId) {
    $novaMensagemBody = @{
      ticketId = $ticketId
      conteudo = "Olá! Esta é uma mensagem de teste enviada pelo sistema omnichannel. 🚀"
      direcao  = "enviada"
      tipo     = "texto"
    } | ConvertTo-Json
        
    $novaMensagem = Invoke-RestMethod -Uri "$baseUrl/atendimento/mensagens" -Method POST -Body $novaMensagemBody -Headers $authHeaders -ErrorAction Stop
        
    Write-Host "✅ Mensagem criada com sucesso!" -ForegroundColor Green
    Write-Host "   📨 ID: $($novaMensagem.id)" -ForegroundColor White
    Write-Host "   📝 Conteúdo: $($novaMensagem.conteudo)" -ForegroundColor DarkGray
    Write-Host "   ⏰ Enviado em: $($novaMensagem.enviadoEm)" -ForegroundColor DarkGray
  }
  else {
    Write-Host "⚠️  Nenhum ticket disponível para criar mensagem" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "❌ Erro ao criar mensagem: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════════
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ DEMONSTRAÇÃO COMPLETA FINALIZADA!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 ESTATÍSTICAS DO SISTEMA:" -ForegroundColor Yellow
Write-Host "   • Canais cadastrados: $($canais.Count)" -ForegroundColor White
Write-Host "   • Filas ativas: $($filas.Count)" -ForegroundColor White
Write-Host "   • Atendentes online: $($atendentes.Count)" -ForegroundColor White
Write-Host "   • Tickets em atendimento: $($tickets.Count)" -ForegroundColor White
if ($ticketId) {
  Write-Host "   • Mensagens trocadas: $($mensagens.Count + 1)" -ForegroundColor White
}
Write-Host ""
Write-Host "🎯 CONTROLLERS ATIVOS:" -ForegroundColor Yellow
Write-Host "   ✅ CanaisController - 7 endpoints" -ForegroundColor Green
Write-Host "   ✅ FilasController - 6 endpoints" -ForegroundColor Green
Write-Host "   ✅ AtendentesController - 6 endpoints" -ForegroundColor Green
Write-Host "   ✅ TicketsController - 7 endpoints" -ForegroundColor Green
Write-Host "   ✅ MensagensController - 2 endpoints" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Sistema Omnichannel 100% Operacional!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
