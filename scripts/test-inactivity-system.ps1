#!/usr/bin/env pwsh
# Script de Teste - Sistema de Fechamento Automático por Inatividade
# Executar: .\scripts\test-inactivity-system.ps1

Write-Host "`n🧪 ============================================" -ForegroundColor Cyan
Write-Host "   TESTE: Sistema de Fechamento Automático" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$empresaId = Read-Host "Digite o ID da empresa para teste (UUID)"

if (-not $empresaId) {
  Write-Host "❌ ID da empresa é obrigatório!" -ForegroundColor Red
  exit 1
}

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
  param(
    [string]$Method,
    [string]$Endpoint,
    [object]$Body = $null
  )
    
  try {
    $headers = @{
      "Content-Type" = "application/json"
    }
        
    $params = @{
      Uri     = "$baseUrl$Endpoint"
      Method  = $Method
      Headers = $headers
    }
        
    if ($Body) {
      $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
        
    $response = Invoke-RestMethod @params
    return $response
  }
  catch {
    Write-Host "❌ Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
    return $null
  }
}

# ============================================
# ETAPA 1: Verificar se configuração existe
# ============================================
Write-Host "📋 ETAPA 1: Verificando configuração existente..." -ForegroundColor Yellow

$config = Invoke-ApiRequest -Method GET -Endpoint "/atendimento/configuracao-inatividade/$empresaId"

if ($config) {
  Write-Host "✅ Configuração encontrada:" -ForegroundColor Green
  Write-Host "   - Timeout: $($config.timeoutMinutos) minutos" -ForegroundColor White
  Write-Host "   - Aviso: $($config.enviarAviso)" -ForegroundColor White
  Write-Host "   - Aviso antes: $($config.avisoMinutosAntes) minutos" -ForegroundColor White
  Write-Host "   - Ativo: $($config.ativo)" -ForegroundColor White
    
  $recriar = Read-Host "`n⚠️  Deseja recriar a configuração para teste rápido? (s/N)"
  if ($recriar -ne "s" -and $recriar -ne "S") {
    Write-Host "✅ Usando configuração existente`n" -ForegroundColor Green
  }
  else {
    $config = $null
  }
}

# ============================================
# ETAPA 2: Criar configuração de teste
# ============================================
if (-not $config) {
  Write-Host "`n📝 ETAPA 2: Criando configuração de teste rápido..." -ForegroundColor Yellow
    
  $newConfig = @{
    timeoutMinutos     = 5
    enviarAviso        = $true
    avisoMinutosAntes  = 2
    mensagemAviso      = "⚠️ Olá! Notamos que você ficou sem responder. Se não houver interação, este atendimento será encerrado em breve."
    mensagemFechamento = "✅ Atendimento encerrado por inatividade. Volte quando precisar!"
    ativo              = $true
    statusAplicaveis   = @("AGUARDANDO", "EM_ATENDIMENTO")
  }
    
  $config = Invoke-ApiRequest -Method POST -Endpoint "/atendimento/configuracao-inatividade/$empresaId" -Body $newConfig
    
  if ($config) {
    Write-Host "✅ Configuração criada com sucesso!" -ForegroundColor Green
    Write-Host "   - Timeout: 5 minutos" -ForegroundColor White
    Write-Host "   - Aviso: 2 minutos antes" -ForegroundColor White
  }
  else {
    Write-Host "❌ Falha ao criar configuração. Verifique os logs do backend." -ForegroundColor Red
    exit 1
  }
}

# ============================================
# ETAPA 3: Buscar ticket para teste
# ============================================
Write-Host "`n🔍 ETAPA 3: Buscando tickets disponíveis para teste..." -ForegroundColor Yellow

# Instrução para buscar no banco
Write-Host @"
`n📊 Execute este SQL para encontrar um ticket de teste:

SELECT 
    id, 
    numero, 
    contato_nome, 
    contato_telefone,
    status, 
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE empresa_id = '$empresaId'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
ORDER BY created_at DESC
LIMIT 5;

"@ -ForegroundColor Cyan

$ticketId = Read-Host "Digite o ID do ticket para teste (UUID)"

if (-not $ticketId) {
  Write-Host "❌ ID do ticket é obrigatório!" -ForegroundColor Red
  exit 1
}

# ============================================
# ETAPA 4: Simular inatividade (4 minutos)
# ============================================
Write-Host "`n⏱️  ETAPA 4: Simulando inatividade de 4 minutos..." -ForegroundColor Yellow

Write-Host @"
`n📝 Execute este SQL para simular inatividade:

UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '4 minutes'
WHERE id = '$ticketId';

-- Verificar:
SELECT 
    numero, 
    status, 
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE id = '$ticketId';

"@ -ForegroundColor Cyan

Read-Host "Pressione ENTER após executar o SQL acima"

# ============================================
# ETAPA 5: Forçar verificação (esperado: aviso)
# ============================================
Write-Host "`n🚀 ETAPA 5: Forçando verificação (deve enviar AVISO)..." -ForegroundColor Yellow

$result1 = Invoke-ApiRequest -Method POST -Endpoint "/atendimento/configuracao-inatividade/verificar-agora"

if ($result1) {
  Write-Host "✅ Verificação executada:" -ForegroundColor Green
  Write-Host "   - Empresas processadas: $($result1.empresasProcessadas)" -ForegroundColor White
  Write-Host "   - Tickets processados: $($result1.ticketsProcessados)" -ForegroundColor White
  Write-Host "`n📱 Verifique o WhatsApp do cliente - deve ter recebido AVISO" -ForegroundColor Yellow
  Write-Host "📋 Verifique os logs do backend para confirmar envio" -ForegroundColor Yellow
}

Read-Host "`nPressione ENTER para continuar com teste de fechamento"

# ============================================
# ETAPA 6: Simular inatividade total (7 minutos)
# ============================================
Write-Host "`n⏱️  ETAPA 6: Simulando inatividade total de 7 minutos..." -ForegroundColor Yellow

Write-Host @"
`n📝 Execute este SQL para simular timeout completo:

UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '7 minutes'
WHERE id = '$ticketId';

-- Verificar:
SELECT 
    numero, 
    status, 
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE id = '$ticketId';

"@ -ForegroundColor Cyan

Read-Host "Pressione ENTER após executar o SQL acima"

# ============================================
# ETAPA 7: Forçar verificação (esperado: fechamento)
# ============================================
Write-Host "`n🚀 ETAPA 7: Forçando verificação (deve FECHAR ticket)..." -ForegroundColor Yellow

$result2 = Invoke-ApiRequest -Method POST -Endpoint "/atendimento/configuracao-inatividade/verificar-agora"

if ($result2) {
  Write-Host "✅ Verificação executada:" -ForegroundColor Green
  Write-Host "   - Empresas processadas: $($result2.empresasProcessadas)" -ForegroundColor White
  Write-Host "   - Tickets processados: $($result2.ticketsProcessados)" -ForegroundColor White
  Write-Host "`n📱 Verifique o WhatsApp - deve ter recebido mensagem de FECHAMENTO" -ForegroundColor Yellow
  Write-Host "📋 Verifique os logs do backend para confirmar fechamento" -ForegroundColor Yellow
}

# ============================================
# ETAPA 8: Verificar resultado no banco
# ============================================
Write-Host "`n✅ ETAPA 8: Verificando resultado final..." -ForegroundColor Yellow

Write-Host @"
`n📝 Execute este SQL para confirmar fechamento:

SELECT 
    numero,
    status,
    data_fechamento,
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE id = '$ticketId';

"@ -ForegroundColor Cyan

Write-Host "`n✅ RESULTADO ESPERADO:" -ForegroundColor Green
Write-Host "   - status = 'FECHADO'" -ForegroundColor White
Write-Host "   - data_fechamento = (preenchida com timestamp)" -ForegroundColor White
Write-Host "   - WhatsApp recebeu 2 mensagens (aviso + fechamento)" -ForegroundColor White
Write-Host "   - Logs do backend mostram sucesso" -ForegroundColor White

# ============================================
# RESUMO FINAL
# ============================================
Write-Host "`n`n📊 ============================================" -ForegroundColor Cyan
Write-Host "   RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "✅ Checklist de Validação:`n" -ForegroundColor Yellow

Write-Host "Backend:" -ForegroundColor White
Write-Host "  [ ] Logs mostram 'Aviso enviado com sucesso'" -ForegroundColor Gray
Write-Host "  [ ] Logs mostram 'Ticket fechado por inatividade'" -ForegroundColor Gray
Write-Host "  [ ] Logs mostram 'Mensagem de fechamento enviada'" -ForegroundColor Gray

Write-Host "`nWhatsApp:" -ForegroundColor White
Write-Host "  [ ] Cliente recebeu mensagem de aviso" -ForegroundColor Gray
Write-Host "  [ ] Cliente recebeu mensagem de fechamento" -ForegroundColor Gray

Write-Host "`nBanco de Dados:" -ForegroundColor White
Write-Host "  [ ] status = 'FECHADO'" -ForegroundColor Gray
Write-Host "  [ ] data_fechamento preenchida" -ForegroundColor Gray

Write-Host "`n`n🎯 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Se tudo funcionou: ajustar timeouts para produção" -ForegroundColor White
Write-Host "   2. Configurar empresas reais com timeouts apropriados" -ForegroundColor White
Write-Host "   3. Monitorar logs por 1 semana" -ForegroundColor White
Write-Host "   4. Opcional: criar interface frontend de configuração" -ForegroundColor White

Write-Host "`n✅ Sistema de fechamento automático testado!`n" -ForegroundColor Green
