# ============================================
# 🧪 Script de Teste - Fechamento Automático
# ============================================
# 
# Este script testa o sistema completo de fechamento
# automático por inatividade de tickets.
#
# Data: 06/11/2025
# ============================================

param(
  [string]$BackendUrl = "http://localhost:3001",
  [string]$EmpresaId = "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  [int]$TimeoutMinutos = 5,
  [switch]$SkipCleanup
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ============================================
# FUNÇÕES HELPER (definidas no início)
# ============================================

function Write-Success { 
  param($Message)
  Write-Host "✅ $Message" -ForegroundColor Green 
}

function Write-Info { 
  param($Message)
  Write-Host "ℹ️  $Message" -ForegroundColor Cyan 
}

function Write-Warn { 
  param($Message)
  Write-Host "⚠️  $Message" -ForegroundColor Yellow 
}

function Write-Err { 
  param($Message)
  Write-Host "❌ $Message" -ForegroundColor Red 
}

function Write-Step { 
  param($Message)
  Write-Host "`n🔹 $Message" -ForegroundColor Blue 
}

# Resultados do teste
$script:TestResults = @{
  ConfiguracaoCriada   = $false
  ConfiguracaoSalva    = $false
  TicketEncontrado     = $false
  VerificacaoExecutada = $false
  AvisoEnviado         = $false
  TicketFechado        = $false
}

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

function Test-BackendRunning {
  Write-Step "Verificando se backend está rodando..."
  try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -ErrorAction SilentlyContinue
    Write-Success "Backend está rodando na porta 3001"
    return $true
  }
  catch {
    Write-Error "Backend não está rodando! Execute: cd backend && npm run start:dev"
    return $false
  }
}

function Get-ConfiguracaoAtual {
  Write-Step "Buscando configuração atual..."
  try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/atendimento/configuracao-inatividade/$EmpresaId" -Method Get
        
    if ($response.sucesso) {
      Write-Success "Configuração encontrada"
      Write-Info "  Timeout: $($response.dados.timeoutMinutos) minutos"
      Write-Info "  Aviso: $($response.dados.enviarAviso)"
      Write-Info "  Ativo: $($response.dados.ativo)"
      return $response.dados
    }
    return $null
  }
  catch {
    Write-Warning "Nenhuma configuração existente"
    return $null
  }
}

function New-ConfiguracaoTeste {
  Write-Step "Criando configuração de teste..."
    
  $config = @{
    departamentoId     = $null
    timeoutMinutos     = $TimeoutMinutos
    enviarAviso        = $true
    avisoMinutosAntes  = [Math]::Floor($TimeoutMinutos * 0.8)  # 80% do timeout
    mensagemAviso      = "⚠️ TESTE: Este ticket será fechado em {{minutos}} minutos por inatividade."
    mensagemFechamento = "✅ TESTE: Ticket fechado automaticamente por inatividade."
    ativo              = $true
    statusAplicaveis   = @("AGUARDANDO", "EM_ATENDIMENTO")
  }
    
  Write-Info "  Timeout: $($config.timeoutMinutos) minutos"
  Write-Info "  Aviso: $($config.avisoMinutosAntes) minutos antes"
    
  try {
    $body = $config | ConvertTo-Json -Depth 10
    $response = Invoke-RestMethod -Uri "$BackendUrl/atendimento/configuracao-inatividade/$EmpresaId" `
      -Method Post `
      -Body $body `
      -ContentType "application/json"
        
    if ($response.sucesso) {
      Write-Success "Configuração criada com sucesso!"
      $TestResults.ConfiguracaoCriada = $true
      $TestResults.ConfiguracaoSalva = $true
      return $response.dados
    }
    else {
      Write-Error "Falha ao criar configuração: $($response.erro)"
      return $null
    }
  }
  catch {
    Write-Error "Erro ao criar configuração: $_"
    Write-Error $_.Exception.Message
    return $null
  }
}

function Find-TicketParaTeste {
  Write-Step "Buscando ticket para teste..."
    
  # Aqui você pode ajustar a query conforme sua estrutura
  Write-Info "  Procurando tickets com status AGUARDANDO ou EM_ATENDIMENTO..."
  Write-Warning "  Este passo requer acesso direto ao banco de dados"
  Write-Warning "  Execute manualmente: SELECT * FROM atendimento_tickets WHERE status IN ('AGUARDANDO', 'EM_ATENDIMENTO') LIMIT 1"
    
  $ticketId = Read-Host "`nℹ️  Digite o ID de um ticket para teste (ou ENTER para pular)"
    
  if ($ticketId) {
    Write-Success "Usando ticket: $ticketId"
    $TestResults.TicketEncontrado = $true
    return $ticketId
  }
    
  Write-Warning "Teste de ticket pulado"
  return $null
}

function Invoke-VerificacaoManual {
  Write-Step "Executando verificação manual de inatividade..."
    
  try {
    $url = "$BackendUrl/atendimento/configuracao-inatividade/verificar-agora?empresaId=$EmpresaId"
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json"
        
    if ($response.sucesso) {
      Write-Success "Verificação executada!"
      Write-Info "  Fechados: $($response.fechados)"
      Write-Info "  Avisados: $($response.avisados)"
      Write-Info "  Configurações: $($response.configuracoes)"
            
      $TestResults.VerificacaoExecutada = $true
            
      if ($response.fechados -gt 0) {
        $TestResults.TicketFechado = $true
      }
      if ($response.avisados -gt 0) {
        $TestResults.AvisoEnviado = $true
      }
            
      return $response
    }
    else {
      Write-Error "Falha na verificação: $($response.erro)"
      return $null
    }
  }
  catch {
    Write-Error "Erro ao executar verificação: $_"
    Write-Error $_.Exception.Message
    return $null
  }
}

function Show-TestResults {
  Write-Host "`n" -NoNewline
  Write-Host "============================================" -ForegroundColor Cyan
  Write-Host "📊 RESULTADOS DOS TESTES" -ForegroundColor Cyan
  Write-Host "============================================" -ForegroundColor Cyan
    
  $results = @(
    @{ Name = "Configuração criada"; Value = $TestResults.ConfiguracaoCriada }
    @{ Name = "Configuração salva"; Value = $TestResults.ConfiguracaoSalva }
    @{ Name = "Ticket encontrado"; Value = $TestResults.TicketEncontrado }
    @{ Name = "Verificação executada"; Value = $TestResults.VerificacaoExecutada }
    @{ Name = "Aviso enviado"; Value = $TestResults.AvisoEnviado }
    @{ Name = "Ticket fechado"; Value = $TestResults.TicketFechado }
  )
    
  foreach ($result in $results) {
    $status = if ($result.Value) { "✅ PASSOU" } else { "❌ FALHOU" }
    $color = if ($result.Value) { "Green" } else { "Red" }
    Write-Host "  $($result.Name): " -NoNewline
    Write-Host $status -ForegroundColor $color
  }
    
  $passed = ($results | Where-Object { $_.Value }).Count
  $total = $results.Count
  $percentage = [Math]::Round(($passed / $total) * 100, 2)
    
  $successRate = "$passed/$total ($percentage%)"
  Write-Host "`n📈 Taxa de Sucesso: $successRate" -ForegroundColor $(if ($percentage -ge 80) { "Green" } else { "Yellow" })
  Write-Host "============================================`n" -ForegroundColor Cyan
}

function Show-NextSteps {
  Write-Host "🎯 PRÓXIMOS PASSOS RECOMENDADOS:" -ForegroundColor Yellow
  Write-Host ""
    
  if (-not $TestResults.ConfiguracaoSalva) {
    Write-Host "1. Verificar logs do backend para entender erro no salvamento" -ForegroundColor Yellow
    Write-Host "2. Validar que o DTO está sendo recebido corretamente" -ForegroundColor Yellow
  }
    
  if ($TestResults.ConfiguracaoSalva -and -not $TestResults.TicketEncontrado) {
    Write-Host "1. Criar um ticket de teste manualmente" -ForegroundColor Yellow
    Write-Host "2. Executar novamente o script com um ticket real" -ForegroundColor Yellow
  }
    
  if ($TestResults.VerificacaoExecutada -and -not $TestResults.AvisoEnviado -and -not $TestResults.TicketFechado) {
    Write-Host "1. Verificar se o ticket está realmente inativo (última mensagem > timeout)" -ForegroundColor Yellow
    Write-Host "2. Usar SQL para simular inatividade: UPDATE atendimento_tickets SET updated_at = NOW() - INTERVAL '10 minutes' WHERE id = '...'" -ForegroundColor Yellow
    Write-Host "3. Executar verificação novamente" -ForegroundColor Yellow
  }
    
  Write-Host ""
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE - FECHAMENTO AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚙️  Configurações:" -ForegroundColor White
Write-Host "  Backend: $BackendUrl" -ForegroundColor Gray
Write-Host "  Empresa: $EmpresaId" -ForegroundColor Gray
Write-Host "  Timeout: $TimeoutMinutos minutos" -ForegroundColor Gray
Write-Host ""

# 1. Verificar backend
if (-not (Test-BackendRunning)) {
  Write-Error "Abortando testes - backend não está rodando"
  exit 1
}

# 2. Buscar configuração atual
$configAtual = Get-ConfiguracaoAtual

if ($configAtual) {
  Write-Warning "Já existe uma configuração. Deseja sobrescrever? (S/N)"
  $resposta = Read-Host
  if ($resposta -ne "S" -and $resposta -ne "s") {
    Write-Info "Usando configuração existente"
    $TestResults.ConfiguracaoCriada = $true
    $TestResults.ConfiguracaoSalva = $true
  }
  else {
    $configTeste = New-ConfiguracaoTeste
  }
}
else {
  $configTeste = New-ConfiguracaoTeste
}

# 3. Buscar ticket para teste
$ticketId = Find-TicketParaTeste

if ($ticketId) {
  Write-Info "`nPara simular inatividade, execute no banco:"
  Write-Host "UPDATE atendimento_tickets SET updated_at = NOW() - INTERVAL '$($TimeoutMinutos + 1) minutes' WHERE id = '$ticketId';" -ForegroundColor Yellow
  Write-Host ""
  $continuar = Read-Host "Pressione ENTER após executar o UPDATE (ou 'S' para pular)"
}

# 4. Executar verificação manual
Write-Host ""
$resultado = Invoke-VerificacaoManual

# 5. Aguardar e verificar novamente (para teste de aviso)
if ($resultado -and $resultado.avisados -gt 0) {
  Write-Info "`nAguardando $TimeoutMinutos minutos para verificar fechamento..."
  Write-Warning "Pressione CTRL+C para cancelar"
  Start-Sleep -Seconds ($TimeoutMinutos * 60)
    
  Write-Step "Verificando se ticket foi fechado..."
  $resultadoFinal = Invoke-VerificacaoManual
}

# 6. Mostrar resultados
Show-TestResults
Show-NextSteps

# 7. Cleanup (opcional)
if (-not $SkipCleanup) {
  Write-Host "`n⚠️  Deseja remover a configuração de teste? (S/N)" -ForegroundColor Yellow
  $limpar = Read-Host
  if ($limpar -eq "S" -or $limpar -eq "s") {
    Write-Info "Limpeza não implementada - remova manualmente pela UI"
  }
}

Write-Host "`n✅ Script de teste concluído!`n" -ForegroundColor Green
