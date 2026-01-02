param(
  [switch]$FreshStart,
  [switch]$SkipFrontend,
  [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

function Write-Step($text) {
  Write-Host "`n==== $text ====" -ForegroundColor Cyan
}

function Wait-ForCondition {
  param(
    [string]$Label,
    [scriptblock]$Condition,
    [int]$Timeout = 120,
    [int]$Delay = 3
  )

  $start = Get-Date
  while ($true) {
    try {
      if (& $Condition) {
        Write-Host "✅ $Label respondendo" -ForegroundColor Green
        break
      }
    }
    catch {
      # Ignora erros até o timeout
    }

    if ((Get-Date) - $start -gt [TimeSpan]::FromSeconds($Timeout)) {
      throw "Tempo esgotado ao aguardar $Label"
    }

    Start-Sleep -Seconds $Delay
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
  Write-Step "Preparando ambiente"
  if ($FreshStart) {
    Write-Host "🧹 derrubando containers anteriores (down -v)..."
    docker compose down -v
  }

  $services = @('postgres', 'redis', 'backend')
  if (-not $SkipFrontend) {
    $services += 'frontend-dev'
  }

  Write-Host "🟢 Subindo serviços: $($services -join ', ')"
  docker compose up -d @services

  Write-Step "Aguardando saúde do backend"
  Wait-ForCondition -Label "Backend" -Timeout $TimeoutSeconds -Condition {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
  }

  if (-not $SkipFrontend) {
    Write-Step "Aguardando frontend-dev responder"
    Wait-ForCondition -Label "Frontend" -Timeout $TimeoutSeconds -Condition {
      $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
      return $response.StatusCode -eq 200
    }
  }

  Write-Step "Checklist rápido"
  Write-Host "• Backend health: http://localhost:3001/health" -ForegroundColor Yellow
  Write-Host "• Frontend dev: http://localhost:3000" -ForegroundColor Yellow
  Write-Host "• Logs backend: docker compose logs -f backend" -ForegroundColor Yellow
  if (-not $SkipFrontend) {
    Write-Host "• Logs frontend: docker compose logs -f frontend-dev" -ForegroundColor Yellow
  }

  Write-Step "Teste de hot reload (manual)"
  Write-Host "1. Edite qualquer arquivo em backend/src (ex.: main.ts) e salve." -ForegroundColor Gray
  Write-Host "2. Confira nos logs a mensagem 'File change detected'." -ForegroundColor Gray
  Write-Host "3. Edite um componente React (ex.: src/App.tsx). A página deve atualizar sozinha." -ForegroundColor Gray
  Write-Host "4. Finalize marcando o checklist em VALIDACAO_DOCKER_CHECKLIST.md." -ForegroundColor Gray

  Write-Host "`n✅ Ambiente pronto para validação manual." -ForegroundColor Green
}
finally {
  Pop-Location
}
