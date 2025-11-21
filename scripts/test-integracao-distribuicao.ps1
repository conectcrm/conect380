# Script de Teste: Integração Distribuição Avançada + Filas
# Testa se a integração entre DistribuicaoAvancadaService e FilaService está funcionando

param(
  [string]$BackendUrl = "http://localhost:3001",
  [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 TESTE DE INTEGRAÇÃO: Distribuição Avançada + Filas" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Cores para output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "🔹 $msg" -ForegroundColor Cyan }

# Verificar se backend está rodando
Write-Step "Verificando se backend está rodando em $BackendUrl..."
try {
  $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -ErrorAction Stop
  Write-Success "Backend está online!"
}
catch {
  Write-Error "Backend não está respondendo em $BackendUrl"
  Write-Info "Execute: npm run start:dev no diretório backend/"
  exit 1
}

Write-Host ""
Write-Host "📊 CENÁRIO 1: Listar Configurações de Distribuição" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

try {
  Write-Step "GET /distribuicao-avancada/configuracoes"
  $configs = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/configuracoes" -Method GET
    
  if ($configs.Count -gt 0) {
    Write-Success "Encontradas $($configs.Count) configuração(ões)"
        
    foreach ($config in $configs) {
      Write-Host "   📌 ID: $($config.id)" -ForegroundColor Gray
      Write-Host "   📌 Fila: $($config.filaId)" -ForegroundColor Gray
      Write-Host "   📌 Algoritmo: $($config.algoritmo)" -ForegroundColor Gray
      Write-Host "   📌 Ativo: $($config.ativo)" -ForegroundColor $(if ($config.ativo) { "Green" } else { "Red" })
      Write-Host ""
    }
  }
  else {
    Write-Info "Nenhuma configuração encontrada (esperado se for primeira execução)"
  }
}
catch {
  Write-Error "Falha ao listar configurações: $($_.Exception.Message)"
  if ($Verbose) {
    Write-Host $_.Exception -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "📊 CENÁRIO 2: Listar Skills de Atendentes" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

try {
  Write-Step "GET /distribuicao-avancada/skills"
  $skills = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/skills" -Method GET
    
  if ($skills.Count -gt 0) {
    Write-Success "Encontradas $($skills.Count) skill(s) cadastrada(s)"
        
    # Agrupar por atendente
    $skillsPorAtendente = $skills | Group-Object -Property atendenteId
        
    Write-Host "   📊 Total de atendentes com skills: $($skillsPorAtendente.Count)" -ForegroundColor Gray
        
    foreach ($grupo in $skillsPorAtendente | Select-Object -First 3) {
      Write-Host "   👤 Atendente: $($grupo.Name)" -ForegroundColor Gray
      foreach ($skill in $grupo.Group) {
        Write-Host "      • $($skill.skill) (nível $($skill.nivelProficiencia))" -ForegroundColor DarkGray
      }
    }
        
    if ($skillsPorAtendente.Count -gt 3) {
      Write-Host "   ... e mais $($skillsPorAtendente.Count - 3) atendente(s)" -ForegroundColor DarkGray
    }
  }
  else {
    Write-Info "Nenhuma skill cadastrada (esperado se for primeira execução)"
  }
}
catch {
  Write-Error "Falha ao listar skills: $($_.Exception.Message)"
  if ($Verbose) {
    Write-Host $_.Exception -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "📊 CENÁRIO 3: Verificar Logs de Distribuição (últimas 24h)" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

try {
  Write-Step "GET /distribuicao-avancada/logs?limit=10"
  $logs = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/logs?limit=10" -Method GET
    
  if ($logs.Count -gt 0) {
    Write-Success "Encontrados $($logs.Count) log(s) de distribuição"
        
    # Estatísticas
    $sucessos = ($logs | Where-Object { $_.sucesso -eq $true }).Count
    $falhas = ($logs | Where-Object { $_.sucesso -eq $false }).Count
    $taxaSucesso = if ($logs.Count -gt 0) { [math]::Round(($sucessos / $logs.Count) * 100, 2) } else { 0 }
        
    Write-Host ""
    Write-Host "   📈 Estatísticas:" -ForegroundColor Cyan
    Write-Host "      ✅ Sucessos: $sucessos" -ForegroundColor Green
    Write-Host "      ❌ Falhas: $falhas" -ForegroundColor $(if ($falhas -gt 0) { "Red" } else { "Gray" })
    Write-Host "      📊 Taxa de sucesso: $taxaSucesso%" -ForegroundColor $(if ($taxaSucesso -ge 90) { "Green" } elseif ($taxaSucesso -ge 70) { "Yellow" } else { "Red" })
    Write-Host ""
        
    # Algoritmos mais usados
    $algoritmos = $logs | Group-Object -Property algoritmo | Sort-Object Count -Descending
    Write-Host "   🎯 Algoritmos utilizados:" -ForegroundColor Cyan
    foreach ($alg in $algoritmos) {
      Write-Host "      • $($alg.Name): $($alg.Count)x" -ForegroundColor Gray
    }
        
    Write-Host ""
    Write-Host "   📋 Últimas distribuições:" -ForegroundColor Cyan
    foreach ($log in $logs | Select-Object -First 5) {
      $statusIcon = if ($log.sucesso) { "✅" } else { "❌" }
      $tempoMs = if ($log.tempoProcessamentoMs) { "$($log.tempoProcessamentoMs)ms" } else { "N/A" }
      Write-Host "      $statusIcon [$($log.algoritmo)] Ticket: $($log.ticketId) → Atendente: $($log.atendenteId) ($tempoMs)" -ForegroundColor Gray
    }
  }
  else {
    Write-Info "Nenhum log de distribuição encontrado"
    Write-Info "Isso é esperado se o sistema ainda não distribuiu nenhum ticket via algoritmo avançado"
  }
}
catch {
  Write-Error "Falha ao listar logs: $($_.Exception.Message)"
  if ($Verbose) {
    Write-Host $_.Exception -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "📊 CENÁRIO 4: Testar Endpoints de Criação (se houver dados)" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Info "Pulando teste de criação (requer dados de fila/atendente existentes)"
Write-Info "Para testar criação, use o frontend ou execute SQL manualmente"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🎉 TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Se não há configurações, crie via frontend:" -ForegroundColor Gray
Write-Host "      http://localhost:3000/nuclei/atendimento/distribuicao/configuracao" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   2. Cadastre skills dos atendentes:" -ForegroundColor Gray
Write-Host "      http://localhost:3000/nuclei/atendimento/distribuicao/skills" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   3. Crie um ticket e veja a distribuição automática acontecer!" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Acompanhe no dashboard:" -ForegroundColor Gray
Write-Host "      http://localhost:3000/nuclei/atendimento/distribuicao/dashboard" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📚 Documentação completa em:" -ForegroundColor Cyan
Write-Host "   • INTEGRACAO_DISTRIBUICAO_FILA.md" -ForegroundColor DarkCyan
Write-Host "   • GUIA_TESTES_INTEGRACAO_DISTRIBUICAO.md" -ForegroundColor DarkCyan
Write-Host "   • CONCLUSAO_INTEGRACAO_DISTRIBUICAO.md" -ForegroundColor DarkCyan
Write-Host ""
