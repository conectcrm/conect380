param(
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$BackendHealthUrl = "http://localhost:3001/health",
  [string]$AdminEmail = "admin@conectsuite.com.br",
  [string]$AdminPassword = "admin123",
  [switch]$SkipMobileGuard
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "MVP UI smoke"
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend health: $BackendHealthUrl"

$maxHealthAttempts = 18 # 3 minutos (18 * 10s)
$healthReady = $false

for ($attempt = 1; $attempt -le $maxHealthAttempts; $attempt++) {
  try {
    $healthStatus = (Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 10).StatusCode
    if ($healthStatus -eq 200) {
      $healthReady = $true
      break
    }

    if ($healthStatus -eq 429) {
      Write-Host "Health check retornou 429 (rate-limit). Tentativa $attempt/$maxHealthAttempts..."
      if ($attempt -lt $maxHealthAttempts) {
        Start-Sleep -Seconds 10
        continue
      }
    }

    throw "backend health retornou status $healthStatus"
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 429) {
      Write-Host "Health check retornou 429 (rate-limit). Tentativa $attempt/$maxHealthAttempts..."
      if ($attempt -lt $maxHealthAttempts) {
        Start-Sleep -Seconds 10
        continue
      }
      throw "backend respondeu 429 por mais de 3 minutos. Aguarde liberar o rate-limit e tente novamente."
    }

    Write-Host "Falha no health check do backend."
    Write-Host "Suba o backend antes de executar este smoke (ex.: npm --prefix backend run start:api)."
    throw
  }
}

if (-not $healthReady) {
  throw "Backend indisponivel para smoke UI (health nao estabilizou)."
}

Push-Location $repoRoot
try {
  $env:FRONTEND_URL = $FrontendUrl
  $env:TEST_ADMIN_EMAIL = $AdminEmail
  $env:TEST_ADMIN_PASSWORD = $AdminPassword

  npx playwright test e2e/mvp-smoke-ui.spec.ts --project=chromium --reporter=list
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright MVP UI smoke falhou"
  }

  if (-not $SkipMobileGuard) {
    npx playwright test e2e/mobile-responsiveness-smoke.spec.ts e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list
    if ($LASTEXITCODE -ne 0) {
      throw "Playwright mobile guard smoke falhou"
    }
  }
  else {
    Write-Host "Mobile guard skipped (SkipMobileGuard enabled)."
  }
}
finally {
  Pop-Location
}

Write-Host "MVP UI smoke result: PASS"
exit 0
