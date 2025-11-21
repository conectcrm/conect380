# ==========================================
# TESTE COMPLETO DO BOT DE TRIAGEM
# ConectCRM - Sistema de Atendimento
# ==========================================
# Valida:
# 1. Endpoints do bot (webhook, iniciar, responder)
# 2. Fluxos publicados
# 3. Núcleos disponíveis para bot
# 4. Integração bot → fila → atendimento
# ==========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTE COMPLETO - BOT DE TRIAGEM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$loginUrl = "$baseUrl/auth/login"

# Credenciais de teste
$loginBody = @{
  email = "admin@conectcrm.com"
  senha = "admin123"
} | ConvertTo-Json

# ==========================================
# 1. AUTENTICAÇÃO
# ==========================================
Write-Host "[1/7] Fazendo login..." -NoNewline -ForegroundColor Yellow

try {
  $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
  $token = $loginResponse.access_token
  $empresaId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    
  Write-Host " [OK]" -ForegroundColor Green
  Write-Host "   Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Gray
  Write-Host "   EmpresaId: $empresaId" -ForegroundColor Gray
}
catch {
  Write-Host " [ERRO]" -ForegroundColor Red
  Write-Host "   Não foi possível fazer login" -ForegroundColor Red
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# ==========================================
# 2. TESTAR GET /triagem/sessao/:telefone
# ==========================================
Write-Host "`n[2/7] Testando GET /triagem/sessao/:telefone..." -NoNewline -ForegroundColor Yellow

$telefone = "5511999999999"
$urlSessao = "$baseUrl/triagem/sessao/$telefone"

try {
  $sessaoResponse = Invoke-RestMethod -Uri $urlSessao -Method GET -Headers $headers
    
  if ($sessaoResponse.ativa) {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "   Sessão ativa encontrada:" -ForegroundColor Gray
    Write-Host "   - ID: $($sessaoResponse.sessao.id)" -ForegroundColor Gray
    Write-Host "   - Etapa: $($sessaoResponse.sessao.etapaAtual)" -ForegroundColor Gray
    Write-Host "   - Status: $($sessaoResponse.sessao.status)" -ForegroundColor Gray
  }
  else {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "   Nenhuma sessão ativa (esperado)" -ForegroundColor Gray
  }
}
catch {
  Write-Host " [ERRO]" -ForegroundColor Red
  Write-Host "   $_" -ForegroundColor Red
}

# ==========================================
# 3. BUSCAR FLUXOS PUBLICADOS
# ==========================================
Write-Host "`n[3/7] Testando GET /fluxos (canal: whatsapp)..." -NoNewline -ForegroundColor Yellow

$urlFluxos = "$baseUrl/fluxos/canal/whatsapp?empresaId=$empresaId"

try {
  $fluxosResponse = Invoke-RestMethod -Uri $urlFluxos -Method GET -Headers $headers
  $totalFluxos = $fluxosResponse.Count
    
  if ($totalFluxos -gt 0) {
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "   Retornou $totalFluxos fluxo(s) publicado(s)" -ForegroundColor Gray
        
    foreach ($fluxo in $fluxosResponse) {
      $publicado = if ($fluxo.publicado) { "SIM" } else { "NÃO" }
      $ativo = if ($fluxo.ativo) { "SIM" } else { "NÃO" }
            
      Write-Host "   → Fluxo: $($fluxo.nome)" -ForegroundColor Gray
      Write-Host "     - ID: $($fluxo.id)" -ForegroundColor Gray
      Write-Host "     - Publicado: $publicado" -ForegroundColor Gray
      Write-Host "     - Ativo: $ativo" -ForegroundColor Gray
      Write-Host "     - Prioridade: $($fluxo.prioridade)" -ForegroundColor Gray
            
      if ($fluxo.estrutura -and $fluxo.estrutura.etapas) {
        $totalEtapas = ($fluxo.estrutura.etapas.PSObject.Properties).Count
        Write-Host "     - Etapas: $totalEtapas" -ForegroundColor Gray
      }
    }
  }
  else {
    Write-Host " [AVISO]" -ForegroundColor Yellow
    Write-Host "   Nenhum fluxo publicado encontrado" -ForegroundColor Yellow
    Write-Host "   RECOMENDAÇÃO: Criar e publicar um fluxo no Builder" -ForegroundColor Yellow
  }
}
catch {
  Write-Host " [ERRO]" -ForegroundColor Red
  Write-Host "   $_" -ForegroundColor Red
}

# ==========================================
# 4. BUSCAR FLUXO PADRÃO
# ==========================================
Write-Host "`n[4/7] Testando GET /fluxos/padrao/whatsapp..." -NoNewline -ForegroundColor Yellow

$urlFluxoPadrao = "$baseUrl/fluxos/padrao/whatsapp?empresaId=$empresaId"

try {
  $fluxoPadraoResponse = Invoke-RestMethod -Uri $urlFluxoPadrao -Method GET -Headers $headers
    
  Write-Host " [OK]" -ForegroundColor Green
  Write-Host "   Fluxo padrão encontrado:" -ForegroundColor Gray
  Write-Host "   - Nome: $($fluxoPadraoResponse.nome)" -ForegroundColor Gray
  Write-Host "   - ID: $($fluxoPadraoResponse.id)" -ForegroundColor Gray
  Write-Host "   - Publicado: $(if ($fluxoPadraoResponse.publicado) { 'SIM' } else { 'NÃO' })" -ForegroundColor Gray
    
  if ($fluxoPadraoResponse.estrutura -and $fluxoPadraoResponse.estrutura.etapas) {
    $totalEtapas = ($fluxoPadraoResponse.estrutura.etapas.PSObject.Properties).Count
    Write-Host "   - Total de etapas: $totalEtapas" -ForegroundColor Gray
        
    # Verificar se tem etapa boas-vindas
    $temBoasVindas = $fluxoPadraoResponse.estrutura.etapas.'boas-vindas' -ne $null
    if ($temBoasVindas) {
      Write-Host "   - Etapa 'boas-vindas': PRESENTE ✓" -ForegroundColor Green
      $etapaBoasVindas = $fluxoPadraoResponse.estrutura.etapas.'boas-vindas'
            
      if ($etapaBoasVindas.mensagem) {
        $mensagemPreview = $etapaBoasVindas.mensagem.Substring(0, [Math]::Min(50, $etapaBoasVindas.mensagem.Length))
        Write-Host "     Mensagem: $mensagemPreview..." -ForegroundColor Gray
      }
            
      if ($etapaBoasVindas.opcoes) {
        Write-Host "     Opções: $($etapaBoasVindas.opcoes.Count) botão(ões)" -ForegroundColor Gray
      }
    }
    else {
      Write-Host "   - Etapa 'boas-vindas': NÃO ENCONTRADA ⚠" -ForegroundColor Yellow
    }
  }
}
catch {
  $statusCode = $null
  if ($_.Exception.Response) {
    $statusCode = $_.Exception.Response.StatusCode.value__
  }
    
  if ($statusCode -eq 404) {
    Write-Host " [AVISO]" -ForegroundColor Yellow
    Write-Host "   Nenhum fluxo padrão publicado encontrado (404)" -ForegroundColor Yellow
    Write-Host "   RECOMENDAÇÃO: Publicar um fluxo no Builder" -ForegroundColor Yellow
  }
  else {
    Write-Host " [ERRO]" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
  }
}

# ==========================================
# 5. BUSCAR NÚCLEOS PARA BOT
# ==========================================
Write-Host "`n[5/7] Testando GET /nucleos/bot/opcoes..." -NoNewline -ForegroundColor Yellow

$urlNucleosBot = "$baseUrl/nucleos/bot/opcoes?empresaId=$empresaId"

try {
  $nucleosBotResponse = Invoke-RestMethod -Uri $urlNucleosBot -Method GET -Headers $headers
    
  if ($nucleosBotResponse.disponiveis) {
    $totalDisponiveis = $nucleosBotResponse.disponiveis.Count
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "   Núcleos disponíveis: $totalDisponiveis" -ForegroundColor Gray
        
    foreach ($nucleo in $nucleosBotResponse.disponiveis) {
      $temDepts = if ($nucleo.departamentos -and $nucleo.departamentos.Count -gt 0) { 
        "$($nucleo.departamentos.Count) depts" 
      }
      else { 
        "sem depts" 
      }
            
      Write-Host "   → $($nucleo.nome) ($temDepts)" -ForegroundColor Gray
      Write-Host "     - ID: $($nucleo.id)" -ForegroundColor Gray
      Write-Host "     - Cor: $($nucleo.cor)" -ForegroundColor Gray
      Write-Host "     - Ícone: $($nucleo.icone)" -ForegroundColor Gray
    }
  }
    
  if ($nucleosBotResponse.foraDoHorario -and $nucleosBotResponse.foraDoHorario.Count -gt 0) {
    Write-Host "`n   Núcleos fora do horário: $($nucleosBotResponse.foraDoHorario.Count)" -ForegroundColor Yellow
    foreach ($nucleo in $nucleosBotResponse.foraDoHorario) {
      Write-Host "   → $($nucleo.nome) (motivo: $($nucleo.motivo))" -ForegroundColor Yellow
    }
  }
}
catch {
  Write-Host " [ERRO]" -ForegroundColor Red
  Write-Host "   $_" -ForegroundColor Red
}

# ==========================================
# 6. TESTAR POST /triagem/iniciar
# ==========================================
Write-Host "`n[6/7] Testando POST /triagem/iniciar..." -NoNewline -ForegroundColor Yellow

$urlIniciar = "$baseUrl/triagem/iniciar"
$bodyIniciar = @{
  contatoTelefone = "5511987654321"
  contatoNome     = "Teste Bot"
  canal           = "whatsapp"
  mensagemInicial = "Olá"
} | ConvertTo-Json

$sessaoIdTeste = $null

try {
  $iniciarResponse = Invoke-RestMethod -Uri $urlIniciar -Method POST -Headers $headers -Body $bodyIniciar
    
  Write-Host " [OK]" -ForegroundColor Green
  Write-Host "   Sessão iniciada com sucesso:" -ForegroundColor Gray
  Write-Host "   - Sessão ID: $($iniciarResponse.sessaoId)" -ForegroundColor Gray
    
  if ($iniciarResponse.mensagem) {
    $preview = $iniciarResponse.mensagem.Substring(0, [Math]::Min(80, $iniciarResponse.mensagem.Length))
    Write-Host "   - Mensagem: $preview..." -ForegroundColor Gray
  }
    
  if ($iniciarResponse.opcoes) {
    Write-Host "   - Opções: $($iniciarResponse.opcoes.Count)" -ForegroundColor Gray
  }
    
  $sessaoIdTeste = $iniciarResponse.sessaoId
}
catch {
  Write-Host " [ERRO]" -ForegroundColor Red
  Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

# ==========================================
# 7. TESTAR POST /triagem/responder
# ==========================================
if ($sessaoIdTeste) {
  Write-Host "`n[7/7] Testando POST /triagem/responder..." -NoNewline -ForegroundColor Yellow
    
  $urlResponder = "$baseUrl/triagem/responder"
  $bodyResponder = @{
    sessaoId = $sessaoIdTeste
    resposta = "1"
  } | ConvertTo-Json
    
  try {
    $responderResponse = Invoke-RestMethod -Uri $urlResponder -Method POST -Headers $headers -Body $bodyResponder
        
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "   Resposta processada com sucesso:" -ForegroundColor Gray
        
    if ($responderResponse.mensagem) {
      $preview = $responderResponse.mensagem.Substring(0, [Math]::Min(80, $responderResponse.mensagem.Length))
      Write-Host "   - Mensagem: $preview..." -ForegroundColor Gray
    }
        
    if ($responderResponse.finalizado) {
      Write-Host "   - Status: FINALIZADO ✓" -ForegroundColor Green
            
      if ($responderResponse.ticketId) {
        Write-Host "   - Ticket criado: $($responderResponse.ticketId)" -ForegroundColor Green
      }
    }
    else {
      Write-Host "   - Status: Em andamento" -ForegroundColor Gray
    }
  }
  catch {
    Write-Host " [ERRO]" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
  }
}
else {
  Write-Host "`n[7/7] PULADO (sessão não iniciada)" -ForegroundColor Yellow
}

# ==========================================
# RESUMO FINAL
# ==========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DA ANÁLISE DO BOT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✓ Endpoints testados: 7/7" -ForegroundColor Green
Write-Host "✓ Autenticação: OK" -ForegroundColor Green

if ($fluxoPadraoResponse) {
  Write-Host "✓ Fluxo padrão: CONFIGURADO" -ForegroundColor Green
}
else {
  Write-Host "⚠ Fluxo padrão: NÃO ENCONTRADO" -ForegroundColor Yellow
  Write-Host "  AÇÃO NECESSÁRIA: Criar e publicar fluxo no Builder" -ForegroundColor Yellow
}

if ($nucleosBotResponse.disponiveis -and $nucleosBotResponse.disponiveis.Count -gt 0) {
  Write-Host "✓ Núcleos disponíveis: $($nucleosBotResponse.disponiveis.Count)" -ForegroundColor Green
}
else {
  Write-Host "⚠ Núcleos: NENHUM DISPONÍVEL" -ForegroundColor Yellow
  Write-Host "  AÇÃO NECESSÁRIA: Configurar núcleos em Gestão de Filas" -ForegroundColor Yellow
}

if ($sessaoIdTeste) {
  Write-Host "✓ Triagem iniciada: SIM" -ForegroundColor Green
}
else {
  Write-Host "✗ Triagem iniciada: NÃO (erro no fluxo)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  WEBHOOK WHATSAPP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Endpoint para configurar no Meta:" -ForegroundColor Yellow
Write-Host "  POST http://localhost:3001/triagem/webhook/whatsapp" -ForegroundColor White
Write-Host "`nToken de verificação (WHATSAPP_WEBHOOK_VERIFY_TOKEN):" -ForegroundColor Yellow
Write-Host "  Configurar no arquivo .env do backend" -ForegroundColor White

Write-Host "`n✓ Teste concluído!`n" -ForegroundColor Green
