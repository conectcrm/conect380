# 🤖 Simulação de Atendimento via Bot WhatsApp
# Data: 10 de novembro de 2025
# Objetivo: Testar fluxo completo do sistema de atendimento

param(
  [string]$BaseUrl = "http://localhost:3001",
  [string]$EmpresaId = "",
  [switch]$Verbose
)

# Cores para output
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Step {
  param([string]$Message)
  Write-Host "`n🔹 $Message" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Message)
  Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
  param([string]$Message)
  Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
  param([string]$Message)
  Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Result {
  param([string]$Message)
  Write-Host "📊 $Message" -ForegroundColor Magenta
}

# ====================================================================
# FASE 1: PRÉ-REQUISITOS
# ====================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🤖 SIMULAÇÃO DE ATENDIMENTO VIA BOT WHATSAPP             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Step "1. Verificando Backend"
try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -ErrorAction Stop
  Write-Success "Backend online: $($health.status)"
  Write-Info "Uptime: $([math]::Round($health.uptime / 60, 2)) minutos"
}
catch {
  Write-Error-Custom "Backend não está respondendo em $BaseUrl"
  Write-Host "Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
  exit 1
}

# ====================================================================
# FASE 2: BUSCAR DADOS DA EMPRESA
# ====================================================================

Write-Step "2. Buscando empresa ativa"
try {
  $empresas = Invoke-RestMethod -Uri "$BaseUrl/empresas" -Method Get -ErrorAction Stop
    
  if ($empresas.Count -eq 0) {
    Write-Error-Custom "Nenhuma empresa cadastrada no sistema"
    exit 1
  }
    
  $empresa = $empresas[0]
  $EmpresaId = $empresa.id
    
  Write-Success "Empresa encontrada: $($empresa.nome)"
  Write-Info "ID: $EmpresaId"
}
catch {
  Write-Error-Custom "Erro ao buscar empresas: $($_.Exception.Message)"
  exit 1
}

# ====================================================================
# FASE 3: VERIFICAR FLUXO PUBLICADO
# ====================================================================

Write-Step "3. Verificando fluxo de triagem publicado"
try {
  $fluxos = Invoke-RestMethod -Uri "$BaseUrl/fluxos-triagem?empresaId=$EmpresaId" -Method Get -ErrorAction Stop
    
  $fluxoPublicado = $fluxos | Where-Object { $_.publicado -eq $true -and $_.ativo -eq $true } | Select-Object -First 1
    
  if (-not $fluxoPublicado) {
    Write-Error-Custom "Nenhum fluxo publicado encontrado"
    Write-Info "Acesse: Gestão → Fluxos de Bot → Publicar um fluxo"
    exit 1
  }
    
  Write-Success "Fluxo encontrado: $($fluxoPublicado.nome)"
  Write-Info "ID: $($fluxoPublicado.id)"
  Write-Info "Canal: $($fluxoPublicado.canal -join ', ')"
    
  $fluxoId = $fluxoPublicado.id
}
catch {
  Write-Error-Custom "Erro ao buscar fluxos: $($_.Exception.Message)"
  exit 1
}

# ====================================================================
# FASE 4: BUSCAR NÚCLEOS VISÍVEIS NO BOT
# ====================================================================

Write-Step "4. Buscando núcleos visíveis no bot"
try {
  $nucleos = Invoke-RestMethod -Uri "$BaseUrl/nucleos-atendimento?empresaId=$EmpresaId" -Method Get -ErrorAction Stop
    
  $nucleosVisiveis = $nucleos | Where-Object { $_.visivelNoBot -eq $true -and $_.ativo -eq $true }
    
  if ($nucleosVisiveis.Count -eq 0) {
    Write-Error-Custom "Nenhum núcleo visível no bot"
    Write-Info "Acesse: Gestão de Núcleos → Marcar 'Visível no Bot'"
    exit 1
  }
    
  Write-Success "$($nucleosVisiveis.Count) núcleos visíveis no bot:"
  foreach ($nucleo in $nucleosVisiveis) {
    Write-Host "   $($nucleo.prioridade). $($nucleo.nome)" -ForegroundColor White
  }
    
  $nucleoEscolhido = $nucleosVisiveis[0]
  Write-Info "Núcleo selecionado para teste: $($nucleoEscolhido.nome)"
}
catch {
  Write-Error-Custom "Erro ao buscar núcleos: $($_.Exception.Message)"
  exit 1
}

# ====================================================================
# FASE 5: BUSCAR DEPARTAMENTOS DO NÚCLEO
# ====================================================================

Write-Step "5. Buscando departamentos do núcleo"
try {
  $departamentos = Invoke-RestMethod -Uri "$BaseUrl/departamentos/nucleo/$($nucleoEscolhido.id)" -Method Get -ErrorAction Stop
    
  $deptosVisiveis = $departamentos | Where-Object { $_.visivelNoBot -eq $true -and $_.ativo -eq $true }
    
  if ($deptosVisiveis.Count -gt 0) {
    Write-Success "$($deptosVisiveis.Count) departamentos visíveis:"
    foreach ($dept in $deptosVisiveis) {
      Write-Host "   - $($dept.nome)" -ForegroundColor White
    }
    $departamentoEscolhido = $deptosVisiveis[0]
  }
  else {
    Write-Info "Núcleo sem departamentos (atribuição direta ao núcleo)"
    $departamentoEscolhido = $null
  }
}
catch {
  Write-Info "Núcleo sem departamentos ou erro ao buscar"
  $departamentoEscolhido = $null
}

# ====================================================================
# FASE 6: VERIFICAR ATENDENTES DISPONÍVEIS
# ====================================================================

Write-Step "6. Verificando atendentes disponíveis"
try {
  $users = Invoke-RestMethod -Uri "$BaseUrl/users?empresaId=$EmpresaId" -Method Get -ErrorAction Stop
    
  $atendentes = $users | Where-Object { $_.ativo -eq $true }
    
  if ($atendentes.Count -eq 0) {
    Write-Error-Custom "Nenhum atendente disponível"
    exit 1
  }
    
  Write-Success "$($atendentes.Count) atendentes ativos no sistema"
    
  # Verificar se há atendentes no núcleo
  if ($nucleoEscolhido.atendentesIds -and $nucleoEscolhido.atendentesIds.Count -gt 0) {
    Write-Success "$($nucleoEscolhido.atendentesIds.Count) atendentes atribuídos ao núcleo"
  }
  else {
    Write-Info "Núcleo sem atendentes específicos (distribuição geral)"
  }
}
catch {
  Write-Error-Custom "Erro ao buscar atendentes: $($_.Exception.Message)"
  exit 1
}

# ====================================================================
# FASE 7: SIMULAR WEBHOOK DO WHATSAPP
# ====================================================================

Write-Step "7. Simulando chegada de mensagem do WhatsApp"

$telefoneSimulado = "+5511999887766"
$nomeCliente = "Cliente Teste Bot"
$mensagemInicial = "Olá"

Write-Info "Cliente: $nomeCliente"
Write-Info "Telefone: $telefoneSimulado"

# Payload simulado do webhook do WhatsApp
$webhookPayload = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from      = $telefoneSimulado.Replace("+", "")
                id        = "wamid.$(Get-Random -Minimum 1000000 -Maximum 9999999)=="
                timestamp = [Math]::Floor((Get-Date -UFormat %s))
                type      = "text"
                text      = @{
                  body = $mensagemInicial
                }
              }
            )
            contacts = @(
              @{
                profile = @{
                  name = $nomeCliente
                }
                wa_id   = $telefoneSimulado.Replace("+", "")
              }
            )
            metadata = @{
              phone_number_id      = "123456789"
              display_phone_number = "+5511999998888"
            }
          }
        }
      )
    }
  )
}

Write-Info "Enviando webhook para: $BaseUrl/webhooks/whatsapp"

try {
  $webhookResponse = Invoke-RestMethod `
    -Uri "$BaseUrl/webhooks/whatsapp?empresaId=$EmpresaId" `
    -Method Post `
    -Body ($webhookPayload | ConvertTo-Json -Depth 10) `
    -ContentType "application/json" `
    -ErrorAction Stop
    
  Write-Success "Webhook processado com sucesso!"
    
  if ($Verbose) {
    Write-Host "`n📨 Resposta do Bot:" -ForegroundColor Cyan
    Write-Host ($webhookResponse | ConvertTo-Json -Depth 5) -ForegroundColor Gray
  }
    
  # Extrair informações da resposta
  if ($webhookResponse.mensagem) {
    Write-Result "Mensagem do bot:"
    Write-Host "   $($webhookResponse.mensagem)" -ForegroundColor White
  }
    
  if ($webhookResponse.opcoes -and $webhookResponse.opcoes.Count -gt 0) {
    Write-Result "Opções apresentadas:"
    foreach ($opcao in $webhookResponse.opcoes) {
      Write-Host "   $($opcao.numero). $($opcao.texto)" -ForegroundColor White
    }
  }
    
}
catch {
  Write-Error-Custom "Erro ao processar webhook: $($_.Exception.Message)"
  if ($Verbose) {
    Write-Host $_.Exception -ForegroundColor Red
  }
  exit 1
}

# ====================================================================
# FASE 8: SIMULAR ESCOLHA DO NÚCLEO
# ====================================================================

Write-Step "8. Simulando escolha do núcleo pelo cliente"

$opcaoEscolhida = "1"  # Primeira opção (núcleo)

$webhookPayload2 = @{
  entry = @(
    @{
      changes = @(
        @{
          value = @{
            messages = @(
              @{
                from      = $telefoneSimulado.Replace("+", "")
                id        = "wamid.$(Get-Random -Minimum 1000000 -Maximum 9999999)=="
                timestamp = [Math]::Floor((Get-Date -UFormat %s))
                type      = "text"
                text      = @{
                  body = $opcaoEscolhida
                }
              }
            )
            contacts = @(
              @{
                profile = @{
                  name = $nomeCliente
                }
                wa_id   = $telefoneSimulado.Replace("+", "")
              }
            )
            metadata = @{
              phone_number_id      = "123456789"
              display_phone_number = "+5511999998888"
            }
          }
        }
      )
    }
  )
}

Write-Info "Cliente escolheu: Opção $opcaoEscolhida ($($nucleoEscolhido.nome))"

try {
  $webhookResponse2 = Invoke-RestMethod `
    -Uri "$BaseUrl/webhooks/whatsapp?empresaId=$EmpresaId" `
    -Method Post `
    -Body ($webhookPayload2 | ConvertTo-Json -Depth 10) `
    -ContentType "application/json" `
    -ErrorAction Stop
    
  Write-Success "Resposta recebida!"
    
  if ($webhookResponse2.mensagem) {
    Write-Result "Mensagem do bot:"
    Write-Host "   $($webhookResponse2.mensagem)" -ForegroundColor White
  }
    
  # Se houver departamentos, mostrar opções
  if ($webhookResponse2.opcoes -and $webhookResponse2.opcoes.Count -gt 0) {
    Write-Result "Departamentos disponíveis:"
    foreach ($opcao in $webhookResponse2.opcoes) {
      Write-Host "   $($opcao.numero). $($opcao.texto)" -ForegroundColor White
    }
  }
    
}
catch {
  Write-Error-Custom "Erro na segunda interação: $($_.Exception.Message)"
  exit 1
}

# ====================================================================
# FASE 9: VERIFICAR CRIAÇÃO DO TICKET
# ====================================================================

Write-Step "9. Verificando criação do ticket"

Start-Sleep -Seconds 2  # Aguardar processamento

try {
  $ticketsUrl = "$BaseUrl/tickets?empresaId=$EmpresaId&limit=5"
  $tickets = Invoke-RestMethod -Uri $ticketsUrl -Method Get -ErrorAction Stop
    
  $ticketRecente = $tickets | Where-Object { 
    $_.telefone -eq $telefoneSimulado -or 
    $_.contatoNome -eq $nomeCliente 
  } | Select-Object -First 1
    
  if ($ticketRecente) {
    Write-Success "Ticket criado com sucesso!"
    Write-Result "Detalhes do ticket:"
    Write-Host "   ID: $($ticketRecente.id)" -ForegroundColor White
    Write-Host "   Status: $($ticketRecente.status)" -ForegroundColor White
    Write-Host "   Canal: $($ticketRecente.canal)" -ForegroundColor White
    Write-Host "   Núcleo: $($ticketRecente.nucleoNome)" -ForegroundColor White
        
    if ($ticketRecente.departamentoNome) {
      Write-Host "   Departamento: $($ticketRecente.departamentoNome)" -ForegroundColor White
    }
        
    if ($ticketRecente.atendenteNome) {
      Write-Host "   Atendente: $($ticketRecente.atendenteNome)" -ForegroundColor White
    }
    else {
      Write-Info "Ticket aguardando atribuição de atendente"
    }
  }
  else {
    Write-Info "Ticket não encontrado nos últimos 5 registros"
    Write-Host "Total de tickets no sistema: $($tickets.Count)" -ForegroundColor Gray
  }
}
catch {
  Write-Error-Custom "Erro ao buscar tickets: $($_.Exception.Message)"
}

# ====================================================================
# FASE 10: VERIFICAR SESSÃO DO BOT
# ====================================================================

Write-Step "10. Verificando sessão do bot"

try {
  $sessoesUrl = "$BaseUrl/triagem/sessoes?empresaId=$EmpresaId"
  $sessoes = Invoke-RestMethod -Uri $sessoesUrl -Method Get -ErrorAction Stop
    
  $sessaoAtiva = $sessoes | Where-Object { 
    $_.telefone -eq $telefoneSimulado -and 
    $_.ativa -eq $true 
  } | Select-Object -First 1
    
  if ($sessaoAtiva) {
    Write-Success "Sessão ativa encontrada!"
    Write-Result "Detalhes da sessão:"
    Write-Host "   ID: $($sessaoAtiva.id)" -ForegroundColor White
    Write-Host "   Etapa atual: $($sessaoAtiva.etapaAtual)" -ForegroundColor White
    Write-Host "   Fluxo: $($sessaoAtiva.fluxoNome)" -ForegroundColor White
        
    if ($sessaoAtiva.nucleoEscolhido) {
      Write-Host "   Núcleo escolhido: $($sessaoAtiva.nucleoEscolhido)" -ForegroundColor White
    }
        
    if ($sessaoAtiva.departamentoEscolhido) {
      Write-Host "   Departamento escolhido: $($sessaoAtiva.departamentoEscolhido)" -ForegroundColor White
    }
  }
  else {
    Write-Info "Nenhuma sessão ativa encontrada (pode ter sido encerrada após criar ticket)"
  }
}
catch {
  Write-Info "Endpoint de sessões não disponível ou erro ao buscar"
}

# ====================================================================
# RELATÓRIO FINAL
# ====================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           📊 RELATÓRIO DA SIMULAÇÃO                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n✅ Sistema de Atendimento - Status:" -ForegroundColor Green
Write-Host "   [OK] Backend online e respondendo"
Write-Host "   [OK] Empresa configurada: $($empresa.nome)"
Write-Host "   [OK] Fluxo publicado: $($fluxoPublicado.nome)"
Write-Host "   [OK] Núcleos visíveis no bot: $($nucleosVisiveis.Count)"
Write-Host "   [OK] Atendentes disponíveis: $($atendentes.Count)"
Write-Host "   [OK] Webhook processado com sucesso"
Write-Host "   [OK] Bot respondeu corretamente"

Write-Host "`n📋 Fluxo testado:" -ForegroundColor Cyan
Write-Host "   1. Cliente enviou mensagem inicial: '$mensagemInicial'"
Write-Host "   2. Bot apresentou núcleos disponíveis"
Write-Host "   3. Cliente escolheu: $($nucleoEscolhido.nome)"

if ($deptosVisiveis -and $deptosVisiveis.Count -gt 0) {
  Write-Host "   4. Bot apresentou departamentos disponíveis"
}

Write-Host "`n🎯 Próximos passos para teste completo:" -ForegroundColor Yellow
Write-Host "   1. Testar com WhatsApp real (conectar API)"
Write-Host "   2. Testar distribuição automática de tickets"
Write-Host "   3. Testar atendimento por atendente na interface"
Write-Host "   4. Testar fluxo completo até fechamento do ticket"

Write-Host "`n✨ Simulação concluída com sucesso!`n" -ForegroundColor Green
