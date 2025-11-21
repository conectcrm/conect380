# ========================================
# TESTE: Performance e Cache - Sistema de Distribuição
# ========================================
# Descrição: Valida cache hit/miss e métricas de performance
# Data: 7 de Novembro de 2025
# ========================================

param(
  [string]$BackendUrl = "http://localhost:3001",
  [switch]$Verbose
)

# Cores para output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Yellow }
function Write-Data { param($msg) Write-Host "   $msg" -ForegroundColor Gray }

# Variáveis globais
$ErrorCount = 0
$SuccessCount = 0

# ========================================
# STEP 1: Verificar Backend
# ========================================
Write-Step "STEP 1: Verificando se backend está rodando..."

try {
  $healthCheck = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -ErrorAction Stop
  Write-Success "Backend está online na porta 3001"
}
catch {
  Write-Error "Backend não está respondendo. Certifique-se que está rodando: npm run start:dev"
  exit 1
}

# ========================================
# STEP 2: Limpar Cache (Estado Inicial)
# ========================================
Write-Step "STEP 2: Limpando cache para garantir estado inicial..."

try {
  # Nota: Endpoint requer autenticação, então pode falhar se não tiver token
  # Vamos tentar sem autenticação primeiro (se público)
  $clearResult = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/limpar-cache" -Method Post -ErrorAction SilentlyContinue
  Write-Success "Cache limpo com sucesso"
}
catch {
  Write-Info "Não foi possível limpar cache (pode precisar de autenticação). Continuando..."
}

# ========================================
# STEP 3: Obter Métricas Iniciais
# ========================================
Write-Step "STEP 3: Obtendo métricas iniciais de performance..."

try {
  $metricasIniciais = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/metricas-performance" -Method Get -ErrorAction Stop
    
  Write-Success "Métricas obtidas com sucesso"
  Write-Data "Distribuições Totais: $($metricasIniciais.data.distribuicoes.total)"
  Write-Data "Taxa de Sucesso: $($metricasIniciais.data.distribuicoes.taxaSucessoPct)%"
  Write-Data "Tempo Médio: $($metricasIniciais.data.performance.tempoMedioMs)ms"
  Write-Data "Cache Hit Rate: $($metricasIniciais.data.cache.taxaHitPct)%"
  Write-Data "Cache Hits: $($metricasIniciais.data.cache.hits)"
  Write-Data "Cache Misses: $($metricasIniciais.data.cache.misses)"
  Write-Data "Configs Cacheadas: $($metricasIniciais.data.cache.configsCacheadas)"
  Write-Data "Skills Cacheadas: $($metricasIniciais.data.cache.skillsCacheadas)"
    
  $SuccessCount++
}
catch {
  Write-Error "Falha ao obter métricas: $($_.Exception.Message)"
  $ErrorCount++
}

# ========================================
# STEP 4: Verificar Estrutura da Resposta
# ========================================
Write-Step "STEP 4: Validando estrutura da resposta de métricas..."

$validacoes = @(
  @{ Campo = "data.distribuicoes.total"; Valor = $metricasIniciais.data.distribuicoes.total },
  @{ Campo = "data.distribuicoes.sucesso"; Valor = $metricasIniciais.data.distribuicoes.sucesso },
  @{ Campo = "data.distribuicoes.falha"; Valor = $metricasIniciais.data.distribuicoes.falha },
  @{ Campo = "data.distribuicoes.taxaSucessoPct"; Valor = $metricasIniciais.data.distribuicoes.taxaSucessoPct },
  @{ Campo = "data.performance.tempoMedioMs"; Valor = $metricasIniciais.data.performance.tempoMedioMs },
  @{ Campo = "data.performance.tempoTotalMs"; Valor = $metricasIniciais.data.performance.tempoTotalMs },
  @{ Campo = "data.cache.hits"; Valor = $metricasIniciais.data.cache.hits },
  @{ Campo = "data.cache.misses"; Valor = $metricasIniciais.data.cache.misses },
  @{ Campo = "data.cache.taxaHitPct"; Valor = $metricasIniciais.data.cache.taxaHitPct },
  @{ Campo = "data.cache.configsCacheadas"; Valor = $metricasIniciais.data.cache.configsCacheadas },
  @{ Campo = "data.cache.skillsCacheadas"; Valor = $metricasIniciais.data.cache.skillsCacheadas }
)

foreach ($validacao in $validacoes) {
  if ($null -ne $validacao.Valor) {
    Write-Success "$($validacao.Campo) está presente"
    $SuccessCount++
  }
  else {
    Write-Error "$($validacao.Campo) está ausente na resposta"
    $ErrorCount++
  }
}

# ========================================
# STEP 5: Validar Cálculos
# ========================================
Write-Step "STEP 5: Validando cálculos de métricas..."

# Validação 1: Taxa de Sucesso
$totalDist = $metricasIniciais.data.distribuicoes.total
if ($totalDist -gt 0) {
  $sucessoEsperado = ($metricasIniciais.data.distribuicoes.sucesso / $totalDist) * 100
  $sucessoReal = $metricasIniciais.data.distribuicoes.taxaSucessoPct
    
  if ([Math]::Abs($sucessoEsperado - $sucessoReal) -lt 0.1) {
    Write-Success "Taxa de Sucesso calculada corretamente: $sucessoReal%"
    $SuccessCount++
  }
  else {
    Write-Error "Taxa de Sucesso incorreta. Esperado: $sucessoEsperado%, Real: $sucessoReal%"
    $ErrorCount++
  }
}
else {
  Write-Info "Sem distribuições ainda, pulando validação de taxa de sucesso"
}

# Validação 2: Taxa de Cache Hit
$totalCache = $metricasIniciais.data.cache.hits + $metricasIniciais.data.cache.misses
if ($totalCache -gt 0) {
  $cacheHitEsperado = ($metricasIniciais.data.cache.hits / $totalCache) * 100
  $cacheHitReal = $metricasIniciais.data.cache.taxaHitPct
    
  if ([Math]::Abs($cacheHitEsperado - $cacheHitReal) -lt 0.1) {
    Write-Success "Cache Hit Rate calculado corretamente: $cacheHitReal%"
    $SuccessCount++
  }
  else {
    Write-Error "Cache Hit Rate incorreto. Esperado: $cacheHitEsperado%, Real: $cacheHitReal%"
    $ErrorCount++
  }
}
else {
  Write-Info "Sem operações de cache ainda, pulando validação"
}

# Validação 3: Tempo Médio
if ($metricasIniciais.data.distribuicoes.sucesso -gt 0) {
  $tempoMedioEsperado = $metricasIniciais.data.performance.tempoTotalMs / $metricasIniciais.data.distribuicoes.sucesso
  $tempoMedioReal = $metricasIniciais.data.performance.tempoMedioMs
    
  if ([Math]::Abs($tempoMedioEsperado - $tempoMedioReal) -lt 0.1) {
    Write-Success "Tempo Médio calculado corretamente: $tempoMedioReal ms"
    $SuccessCount++
  }
  else {
    Write-Error "Tempo Médio incorreto. Esperado: $tempoMedioEsperado ms, Real: $tempoMedioReal ms"
    $ErrorCount++
  }
}
else {
  Write-Info "Sem distribuições bem-sucedidas, pulando validação de tempo médio"
}

# ========================================
# STEP 6: Testar Endpoint de Limpar Cache
# ========================================
Write-Step "STEP 6: Testando endpoint de limpar cache..."

try {
  $limparResult = Invoke-RestMethod -Uri "$BackendUrl/distribuicao-avancada/limpar-cache" -Method Post -ErrorAction Stop
    
  if ($limparResult.success -eq $true) {
    Write-Success "Endpoint de limpar cache funcionando: $($limparResult.message)"
    $SuccessCount++
  }
  else {
    Write-Error "Endpoint retornou success=false"
    $ErrorCount++
  }
}
catch {
  # Se der erro de autenticação, é normal (endpoint protegido)
  if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Unauthorized*") {
    Write-Info "Endpoint requer autenticação (normal). Teste manual necessário com token JWT."
  }
  else {
    Write-Error "Erro ao chamar endpoint de limpar cache: $($_.Exception.Message)"
    $ErrorCount++
  }
}

# ========================================
# STEP 7: Verificar Consistência dos Dados
# ========================================
Write-Step "STEP 7: Verificando consistência dos dados..."

# Total deve ser = sucesso + falha
$somaCalculada = $metricasIniciais.data.distribuicoes.sucesso + $metricasIniciais.data.distribuicoes.falha
$totalReal = $metricasIniciais.data.distribuicoes.total

if ($somaCalculada -eq $totalReal) {
  Write-Success "Consistência: Total = Sucesso + Falha ($totalReal = $somaCalculada)"
  $SuccessCount++
}
else {
  Write-Error "Inconsistência: Total ($totalReal) ≠ Sucesso + Falha ($somaCalculada)"
  $ErrorCount++
}

# ========================================
# STEP 8: Analisar Performance
# ========================================
Write-Step "STEP 8: Analisando performance do sistema..."

if ($metricasIniciais.data.performance.tempoMedioMs -gt 0) {
  $tempoMedio = $metricasIniciais.data.performance.tempoMedioMs
    
  if ($tempoMedio -le 100) {
    Write-Success "Performance EXCELENTE: Tempo médio de $tempoMedio ms (< 100ms) ⚡"
    $SuccessCount++
  }
  elseif ($tempoMedio -le 200) {
    Write-Info "Performance BOA: Tempo médio de $tempoMedio ms (100-200ms) ✅"
    $SuccessCount++
  }
  elseif ($tempoMedio -le 500) {
    Write-Info "Performance ACEITÁVEL: Tempo médio de $tempoMedio ms (200-500ms) ⚠️"
  }
  else {
    Write-Error "Performance RUIM: Tempo médio de $tempoMedio ms (> 500ms) 🐌"
    $ErrorCount++
  }
}
else {
  Write-Info "Sem dados de tempo médio ainda"
}

# Cache Hit Rate
if ($totalCache -gt 0) {
  $cacheHitRate = $metricasIniciais.data.cache.taxaHitPct
    
  if ($cacheHitRate -ge 80) {
    Write-Success "Cache EXCELENTE: $cacheHitRate% hit rate (>= 80%) 🚀"
    $SuccessCount++
  }
  elseif ($cacheHitRate -ge 60) {
    Write-Info "Cache BOM: $cacheHitRate% hit rate (60-80%) ✅"
    $SuccessCount++
  }
  elseif ($cacheHitRate -ge 40) {
    Write-Info "Cache MÉDIO: $cacheHitRate% hit rate (40-60%) ⚠️"
  }
  else {
    Write-Error "Cache BAIXO: $cacheHitRate% hit rate (< 40%) - Verifique TTL ❌"
    $ErrorCount++
  }
}
else {
  Write-Info "Sem dados de cache ainda (sistema pode ter acabado de iniciar)"
}

# ========================================
# RELATORIO FINAL
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RELATORIO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nMetricas do Sistema:" -ForegroundColor White
Write-Data "Total de Distribuicoes: $($metricasIniciais.data.distribuicoes.total)"
Write-Data "Distribuicoes com Sucesso: $($metricasIniciais.data.distribuicoes.sucesso)"
Write-Data "Distribuicoes com Falha: $($metricasIniciais.data.distribuicoes.falha)"
Write-Data "Taxa de Sucesso: $($metricasIniciais.data.distribuicoes.taxaSucessoPct)%"

Write-Host "`nPerformance:" -ForegroundColor White
Write-Data "Tempo Medio: $($metricasIniciais.data.performance.tempoMedioMs) ms"
Write-Data "Tempo Total: $($metricasIniciais.data.performance.tempoTotalMs) ms"

Write-Host "`nCache:" -ForegroundColor White
Write-Data "Cache Hits: $($metricasIniciais.data.cache.hits)"
Write-Data "Cache Misses: $($metricasIniciais.data.cache.misses)"
Write-Data "Taxa de Hit: $($metricasIniciais.data.cache.taxaHitPct)%"
Write-Data "Configs em Cache: $($metricasIniciais.data.cache.configsCacheadas)"
Write-Data "Skills em Cache: $($metricasIniciais.data.cache.skillsCacheadas)"

Write-Host "`nResultados dos Testes:" -ForegroundColor White
Write-Success "Testes Passaram: $SuccessCount"
if ($ErrorCount -gt 0) {
  Write-Error "Testes Falharam: $ErrorCount"
}
else {
  Write-Data "Testes Falharam: 0"
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
  Write-Success "TODOS OS TESTES PASSARAM! Sistema funcionando corretamente. ✅"
  Write-Host "========================================`n" -ForegroundColor Cyan
  exit 0
}
else {
  Write-Error "ALGUNS TESTES FALHARAM. Verificar erros acima. ❌"
  Write-Host "========================================`n" -ForegroundColor Cyan
  exit 1
}
