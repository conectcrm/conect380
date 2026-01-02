#!/usr/bin/env pwsh
# ============================================
# Script de Validação da Integração IA + Bot
# ============================================

param(
  [switch]$Detailed,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$SuccessCount = 0
$FailCount = 0
$WarningCount = 0

function Write-Success {
  param([string]$Message)
  Write-Host "✅ $Message" -ForegroundColor Green
  $script:SuccessCount++
}

function Write-Fail {
  param([string]$Message)
  Write-Host "❌ $Message" -ForegroundColor Red
  $script:FailCount++
}

function Write-Warn {
  param([string]$Message)
  Write-Host "⚠️  $Message" -ForegroundColor Yellow
  $script:WarningCount++
}

function Write-Info {
  param([string]$Message)
  Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Section {
  param([string]$Title)
  Write-Host "`n========================================" -ForegroundColor Magenta
  Write-Host "  $Title" -ForegroundColor Magenta
  Write-Host "========================================`n" -ForegroundColor Magenta
}

# ============================================
# 1. Verificar Estrutura de Arquivos
# ============================================
Write-Section "1. Estrutura de Arquivos"

$arquivosObrigatorios = @(
  @{Path = "backend/src/modules/ia/ia.service.ts"; Desc = "IAService" },
  @{Path = "backend/src/modules/ia/ia.module.ts"; Desc = "IAModule" },
  @{Path = "backend/src/modules/ia/ia-auto-resposta.service.ts"; Desc = "IAAutoRespostaService" },
  @{Path = "backend/src/modules/triagem/triagem.module.ts"; Desc = "TriagemModule" },
  @{Path = "backend/src/modules/triagem/services/triagem-bot.service.ts"; Desc = "TriagemBotService" }
)

foreach ($arquivo in $arquivosObrigatorios) {
  if (Test-Path $arquivo.Path) {
    Write-Success "$($arquivo.Desc) existe: $($arquivo.Path)"
  }
  else {
    Write-Fail "$($arquivo.Desc) NÃO encontrado: $($arquivo.Path)"
  }
}

# ============================================
# 2. Verificar Imports no Código
# ============================================
Write-Section "2. Verificar Imports e Integrações"

# Verificar se TriagemModule importa IAModule
Write-Info "Verificando se TriagemModule importa IAModule..."
$triagemModuleContent = Get-Content "backend/src/modules/triagem/triagem.module.ts" -Raw
if ($triagemModuleContent -match "import.*IAModule") {
  Write-Success "TriagemModule importa IAModule"
}
else {
  Write-Fail "TriagemModule NÃO importa IAModule"
}

if ($triagemModuleContent -match "IAModule") {
  Write-Success "IAModule está nos imports do TriagemModule"
}
else {
  Write-Fail "IAModule NÃO está nos imports do TriagemModule"
}

# Verificar se TriagemBotService importa IAService
Write-Info "Verificando se TriagemBotService usa IAService..."
$botServiceContent = Get-Content "backend/src/modules/triagem/services/triagem-bot.service.ts" -Raw
if ($botServiceContent -match "import.*IAService") {
  Write-Success "TriagemBotService importa IAService"
}
else {
  Write-Fail "TriagemBotService NÃO importa IAService"
}

if ($botServiceContent -match "private readonly iaService: IAService") {
  Write-Success "IAService está injetado no constructor"
}
else {
  Write-Fail "IAService NÃO está injetado no constructor"
}

# Verificar métodos de integração
if ($botServiceContent -match "processarComIA") {
  Write-Success "Método processarComIA() implementado"
}
else {
  Write-Fail "Método processarComIA() NÃO encontrado"
}

if ($botServiceContent -match "tentarRespostaIA") {
  Write-Success "Método tentarRespostaIA() implementado"
}
else {
  Write-Fail "Método tentarRespostaIA() NÃO encontrado"
}

if ($botServiceContent -match "converterHistoricoParaIA") {
  Write-Success "Método converterHistoricoParaIA() implementado"
}
else {
  Write-Fail "Método converterHistoricoParaIA() NÃO encontrado"
}

# ============================================
# 3. Verificar Configuração .env
# ============================================
Write-Section "3. Configuração do .env"

$envPath = "backend/.env"
if (Test-Path $envPath) {
  $envContent = Get-Content $envPath -Raw
    
  # Verificar variáveis obrigatórias
  $variaveisIA = @(
    "OPENAI_API_KEY",
    "IA_PROVIDER",
    "IA_MODEL",
    "IA_TEMPERATURE",
    "IA_MAX_TOKENS",
    "IA_CONTEXT_WINDOW",
    "IA_AUTO_RESPOSTA_ENABLED",
    "IA_MIN_CONFIANCA"
  )
    
  foreach ($var in $variaveisIA) {
    if ($envContent -match "$var=") {
      # Verificar se não está vazio
      $linha = ($envContent -split "`n" | Where-Object { $_ -match "^$var=" })[0]
      $valor = $linha -replace "^$var=", ""
            
      if ($var -eq "OPENAI_API_KEY") {
        if ($valor -and $valor.Trim() -ne "") {
          if ($valor -match "^sk-") {
            Write-Success "$var configurada (sk-...)"
          }
          else {
            Write-Warn "$var configurada mas formato inválido (deve começar com 'sk-')"
          }
        }
        else {
          Write-Warn "$var está VAZIA - IA NÃO funcionará sem isso"
        }
      }
      else {
        if ($valor -and $valor.Trim() -ne "") {
          Write-Success "$var = $valor"
        }
        else {
          Write-Fail "$var está vazia"
        }
      }
    }
    else {
      Write-Fail "$var NÃO encontrada no .env"
    }
  }
}
else {
  Write-Fail "Arquivo .env NÃO encontrado em backend/"
}

# ============================================
# 4. Verificar Compilação TypeScript
# ============================================
Write-Section "4. Compilação TypeScript"

if (-not $SkipBuild) {
  Write-Info "Compilando backend (isso pode levar alguns segundos)..."
    
  Push-Location backend
    
  # Tentar compilar
  $buildOutput = npm run build 2>&1
  $buildExitCode = $LASTEXITCODE
    
  Pop-Location
    
  if ($buildExitCode -eq 0) {
    Write-Success "Backend compilado com sucesso"
  }
  else {
    Write-Fail "Erro na compilação do backend"
    if ($Detailed) {
      Write-Host "`nErros de compilação:" -ForegroundColor Red
      $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor DarkRed }
    }
  }
}
else {
  Write-Info "Compilação ignorada (flag -SkipBuild)"
}

# ============================================
# 5. Verificar Dependências
# ============================================
Write-Section "5. Dependências NPM"

$packageJsonPath = "backend/package.json"
if (Test-Path $packageJsonPath) {
  $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
  $dependenciasIA = @{
    "openai"         = "OpenAI SDK"
    "@nestjs/config" = "ConfigModule"
  }
    
  foreach ($dep in $dependenciasIA.Keys) {
    if ($packageJson.dependencies.$dep) {
      Write-Success "$($dependenciasIA[$dep]) instalado: $($packageJson.dependencies.$dep)"
    }
    else {
      Write-Fail "$($dependenciasIA[$dep]) NÃO encontrado nas dependências"
    }
  }
}
else {
  Write-Fail "package.json NÃO encontrado"
}

# ============================================
# 6. Verificar Tipos TypeScript
# ============================================
Write-Section "6. Tipos TypeScript"

# Verificar se os tipos estão corretos
Write-Info "Verificando tipos importados..."

if ($botServiceContent -match "import type.*ContextoConversa.*IAResponse") {
  Write-Success "Tipos ContextoConversa e IAResponse importados corretamente"
}
else {
  if ($botServiceContent -match "ContextoConversa") {
    Write-Warn "ContextoConversa encontrado mas pode estar sem 'type' import"
  }
  else {
    Write-Fail "Tipo ContextoConversa NÃO importado"
  }
}

# ============================================
# 7. Testes de Lógica (Sintaxe)
# ============================================
Write-Section "7. Análise de Lógica"

Write-Info "Verificando fluxo de decisão da IA..."

# Verificar se há verificação de IA habilitada
if ($botServiceContent -match "IA_AUTO_RESPOSTA_ENABLED") {
  Write-Success "Verificação de IA habilitada presente"
}
else {
  Write-Warn "Falta verificação se IA está habilitada"
}

# Verificar se há validação de confiança
if ($botServiceContent -match "IA_MIN_CONFIANCA") {
  Write-Success "Validação de confiança mínima presente"
}
else {
  Write-Warn "Falta validação de confiança mínima"
}

# Verificar se há detecção de escalação
if ($botServiceContent -match "requerAtendimentoHumano") {
  Write-Success "Detecção de escalação para humano presente"
}
else {
  Write-Fail "Falta lógica de escalação para atendente humano"
}

# Verificar se há registro de logs
if ($botServiceContent -match "registrarLogSistema") {
  if ($botServiceContent -match "ia_resposta") {
    Write-Success "Registro de logs da IA implementado"
  }
  else {
    Write-Info "Método registrarLogSistema existe (verificar se chama com 'ia_resposta')"
  }
}
else {
  Write-Warn "Falta método registrarLogSistema"
}

# ============================================
# 8. Verificar Entities e Logs
# ============================================
Write-Section "8. Sistema de Logs"

$triagemLogPath = "backend/src/modules/triagem/entities/triagem-log.entity.ts"
if (Test-Path $triagemLogPath) {
  $logContent = Get-Content $triagemLogPath -Raw
    
  if ($logContent -match "metadata.*Record<string, any>") {
    Write-Success "Campo metadata (JSONB) existe em TriagemLog"
  }
  else {
    Write-Fail "Campo metadata NÃO encontrado em TriagemLog"
  }
    
  if ($logContent -match "tipo\?.*string") {
    Write-Success "Campo tipo existe em TriagemLog"
  }
  else {
    Write-Fail "Campo tipo NÃO encontrado em TriagemLog"
  }
}
else {
  Write-Fail "Entity TriagemLog NÃO encontrada"
}

# ============================================
# 9. Resumo Final
# ============================================
Write-Section "RESUMO"

$total = $SuccessCount + $FailCount + $WarningCount

Write-Host "Total de verificações: $total" -ForegroundColor White
Write-Host "  ✅ Sucessos: $SuccessCount" -ForegroundColor Green
Write-Host "  ❌ Falhas: $FailCount" -ForegroundColor Red
Write-Host "  ⚠️  Avisos: $WarningCount" -ForegroundColor Yellow

Write-Host ""

if ($FailCount -eq 0 -and $WarningCount -eq 0) {
  Write-Host "🎉 PERFEITO! Integração 100% completa!" -ForegroundColor Green
  Write-Host "   Próximo passo: Adicionar OPENAI_API_KEY no .env e testar" -ForegroundColor Cyan
  exit 0
}
elseif ($FailCount -eq 0) {
  Write-Host "✅ BOM! Integração funcional com alguns avisos" -ForegroundColor Green
  Write-Host "   Revisar avisos acima e adicionar OPENAI_API_KEY" -ForegroundColor Yellow
  exit 0
}
elseif ($FailCount -le 2) {
  Write-Host "⚠️  ATENÇÃO! Algumas falhas encontradas" -ForegroundColor Yellow
  Write-Host "   Revisar falhas acima antes de prosseguir" -ForegroundColor Yellow
  exit 1
}
else {
  Write-Host "❌ CRÍTICO! Várias falhas encontradas" -ForegroundColor Red
  Write-Host "   Integração incompleta - revisar implementação" -ForegroundColor Red
  exit 1
}

# ============================================
# 10. Instruções Próximos Passos
# ============================================
Write-Section "Próximos Passos"

Write-Info "Para ativar a IA completamente:"
Write-Host ""
Write-Host "1. Obter API Key:" -ForegroundColor White
Write-Host "   https://platform.openai.com/api-keys" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Adicionar no .env:" -ForegroundColor White
Write-Host "   OPENAI_API_KEY=sk-proj-SUA_CHAVE_AQUI" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Reiniciar backend:" -ForegroundColor White
Write-Host "   cd backend && npm run start:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Testar com mensagem:" -ForegroundColor White
Write-Host "   Enviar mensagem via webhook WhatsApp" -ForegroundColor Cyan
Write-Host ""
