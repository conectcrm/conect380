#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "[ADM-301] Deploy isolado do admin-web" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor DarkGray

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "[ERRO] Docker nao encontrado." -ForegroundColor Red
  exit 1
}

$composeFile = "docker-compose.admin-web.yml"
$adminWebPort = if ([string]::IsNullOrWhiteSpace($env:ADMIN_WEB_PORT)) { "3010" } else { $env:ADMIN_WEB_PORT }
$adminContainer = "conect360-admin-web"

if (-not (Test-Path $composeFile)) {
  Write-Host "[ERRO] Arquivo $composeFile nao encontrado." -ForegroundColor Red
  exit 1
}

Write-Host "[INFO] Build + up do admin-web dedicado..." -ForegroundColor Yellow
docker compose -f $composeFile up -d --build

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERRO] Falha ao subir admin-web." -ForegroundColor Red
  exit 1
}

Write-Host "[INFO] Aguardando health do container $adminContainer..." -ForegroundColor Yellow
$maxAttempts = 45
$healthy = $false

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  $status = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" $adminContainer 2>$null
  $status = ($status | Select-Object -First 1).ToString().Trim()

  if ($status -eq "healthy" -or $status -eq "running") {
    $healthy = $true
    break
  }

  if ($status -eq "starting") {
    try {
      $httpCheck = Invoke-WebRequest -Uri "http://localhost:$adminWebPort" -Method GET -UseBasicParsing -TimeoutSec 3
      if ($httpCheck.StatusCode -ge 200 -and $httpCheck.StatusCode -lt 400) {
        $healthy = $true
        break
      }
    }
    catch {
      # aguarda proxima tentativa
    }
  }

  Start-Sleep -Seconds 2
}

if (-not $healthy) {
  Write-Host "[ERRO] Container nao ficou saudavel no tempo esperado." -ForegroundColor Red
  docker ps --filter "name=$adminContainer"
  exit 1
}

Write-Host "[OK] admin-web publicado em http://localhost:$adminWebPort" -ForegroundColor Green
