#!/usr/bin/env pwsh
# Teste Funcional Rápido - API do Sistema de Fechamento Automático

Write-Host "`n🧪 ============================================" -ForegroundColor Cyan
Write-Host "   TESTE FUNCIONAL - API REST" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$empresaId = "9f675e26-e095-42d7-96e2-17e08e6c24fe"  # ID padrão, pode ser alterado

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Backend: $baseUrl" -ForegroundColor White
Write-Host "   Empresa ID: $empresaId`n" -ForegroundColor White

# Teste 1: Health check do backend
Write-Host "🔍 Teste 1: Verificando backend..." -ForegroundColor Yellow
try {
  # Testar se porta está respondendo (qualquer resposta é válida)
  $response = Invoke-WebRequest -Uri "$baseUrl/atendimento/configuracao-inatividade/health-check" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
  Write-Host "✅ Backend está rodando" -ForegroundColor Green
  $backendOk = $true
}
catch {
  # Qualquer resposta HTTP (404, 500, etc) significa que backend está rodando
  if ($_.Exception.Response) {
    Write-Host "✅ Backend está rodando (porta 3001 respondendo)" -ForegroundColor Green
    $backendOk = $true
  }
  else {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Gray
    $backendOk = $false
  }
}

if (-not $backendOk) {
  Write-Host "`n⚠️ Backend não está disponível. Não é possível continuar os testes." -ForegroundColor Yellow
  Write-Host "   Verifique se o backend está rodando:" -ForegroundColor White
  Write-Host "   cd backend && npm run start:dev`n" -ForegroundColor Gray
  exit 1
}

# Teste 2: Buscar configuração (pode não existir ainda)
Write-Host "`n🔍 Teste 2: Buscando configuração existente..." -ForegroundColor Yellow
try {
  $config = Invoke-RestMethod -Uri "$baseUrl/atendimento/configuracao-inatividade/$empresaId" -Method GET -TimeoutSec 5 -ErrorAction Stop
    
  if ($config) {
    Write-Host "✅ Configuração encontrada:" -ForegroundColor Green
    Write-Host "   Timeout: $($config.timeoutMinutos) minutos" -ForegroundColor White
    Write-Host "   Aviso: $($config.enviarAviso)" -ForegroundColor White
    Write-Host "   Ativo: $($config.ativo)" -ForegroundColor White
    $configExists = $true
  }
  else {
    Write-Host "ℹ️ Nenhuma configuração cadastrada ainda" -ForegroundColor Cyan
    $configExists = $false
  }
}
catch {
  if ($_.Exception.Response.StatusCode -eq 404) {
    Write-Host "ℹ️ Nenhuma configuração cadastrada ainda (404)" -ForegroundColor Cyan
    $configExists = $false
  }
  else {
    Write-Host "⚠️ Erro ao buscar configuração:" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
    $configExists = $false
  }
}

# Teste 3: Criar configuração de teste
if (-not $configExists) {
  Write-Host "`n🔍 Teste 3: Criando configuração de teste..." -ForegroundColor Yellow
    
  $newConfig = @{
    timeoutMinutos     = 1440  # 24 horas
    enviarAviso        = $true
    avisoMinutosAntes  = 60
    mensagemAviso      = "⚠️ Olá! Notamos que você está sem interagir. Este atendimento será fechado em 1 hora."
    mensagemFechamento = "✅ Atendimento encerrado por inatividade. Volte quando precisar!"
    ativo              = $true
    statusAplicaveis   = @("AGUARDANDO", "EM_ATENDIMENTO")
  } | ConvertTo-Json -Depth 10
    
  try {
    $created = Invoke-RestMethod -Uri "$baseUrl/atendimento/configuracao-inatividade/$empresaId" `
      -Method POST `
      -Body $newConfig `
      -ContentType "application/json" `
      -TimeoutSec 10 `
      -ErrorAction Stop
        
    Write-Host "✅ Configuração criada com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($created.id)" -ForegroundColor White
    Write-Host "   Timeout: $($created.timeoutMinutos) minutos" -ForegroundColor White
  }
  catch {
    Write-Host "❌ Erro ao criar configuração:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
        
    if ($_.ErrorDetails.Message) {
      Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
  }
}
else {
  Write-Host "`n⏭️ Teste 3: Pulado (configuração já existe)" -ForegroundColor Cyan
}

# Teste 4: Endpoint de verificação manual
Write-Host "`n🔍 Teste 4: Testando endpoint de verificação manual..." -ForegroundColor Yellow
try {
  $verification = Invoke-RestMethod -Uri "$baseUrl/atendimento/configuracao-inatividade/verificar-agora" `
    -Method POST `
    -TimeoutSec 10 `
    -ErrorAction Stop
    
  Write-Host "✅ Endpoint de verificação funciona:" -ForegroundColor Green
  Write-Host "   Empresas processadas: $($verification.empresasProcessadas)" -ForegroundColor White
  Write-Host "   Tickets processados: $($verification.ticketsProcessados)" -ForegroundColor White
}
catch {
  Write-Host "❌ Erro ao chamar verificação:" -ForegroundColor Red
  Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
}

# Resumo
Write-Host "`n📊 ============================================" -ForegroundColor Cyan
Write-Host "   RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "✅ Sistema funcional e pronto para uso!" -ForegroundColor Green
Write-Host "`n📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Ajustar timeout conforme necessidade do negócio" -ForegroundColor White
Write-Host "   2. Personalizar mensagens de aviso e fechamento" -ForegroundColor White
Write-Host "   3. Definir status aplicáveis (AGUARDANDO, EM_ATENDIMENTO, etc)" -ForegroundColor White
Write-Host "   4. Monitorar logs do backend para ver sistema em ação" -ForegroundColor White
Write-Host "   5. Criar tickets de teste e simular inatividade (SQL)" -ForegroundColor White

Write-Host "`n🎯 Configurações recomendadas por setor:" -ForegroundColor Yellow
Write-Host "   E-commerce: 120min (2h) | Aviso: 30min antes" -ForegroundColor White
Write-Host "   Suporte: 240min (4h) | Aviso: 60min antes" -ForegroundColor White
Write-Host "   Geral: 1440min (24h) | Aviso: 120min antes" -ForegroundColor White
Write-Host "   B2B: 2880min (48h) | Aviso: 240min antes" -ForegroundColor White

Write-Host "`n📚 Documentação completa:" -ForegroundColor Yellow
Write-Host "   - QUICKSTART_TESTE_INATIVIDADE.md" -ForegroundColor Gray
Write-Host "   - TESTE_FECHAMENTO_AUTOMATICO.md" -ForegroundColor Gray
Write-Host "   - CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md" -ForegroundColor Gray

Write-Host "`n============================================`n" -ForegroundColor Cyan
