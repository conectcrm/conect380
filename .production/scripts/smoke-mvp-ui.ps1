param(
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$BackendHealthUrl = "http://localhost:3001/health",
  [string]$AdminEmail = "admin@conectsuite.com.br",
  [string]$AdminPassword = "admin123"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "MVP UI smoke"
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend health: $BackendHealthUrl"

try {
  $healthStatus = (Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($healthStatus -ne 200) {
    throw "backend health retornou status $healthStatus"
  }
}
catch {
  Write-Host "Falha no health check do backend."
  Write-Host "Suba o backend antes de executar este smoke (ex.: npm --prefix backend run start:api)."
  throw
}

Push-Location $repoRoot
try {
  $env:FRONTEND_URL = $FrontendUrl
  $env:TEST_ADMIN_EMAIL = $AdminEmail
  $env:TEST_ADMIN_PASSWORD = $AdminPassword

  npx playwright test e2e/mvp-smoke-ui.spec.ts --project=chromium
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright MVP UI smoke falhou"
  }
}
finally {
  Pop-Location
}

Write-Host "MVP UI smoke result: PASS"
exit 0
