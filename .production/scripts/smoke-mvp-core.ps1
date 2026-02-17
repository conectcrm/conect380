param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 5434,
  [string]$DbDatabase = "conectcrm_test",
  [string]$DbUser = "conectcrm",
  [string]$DbPassword = "conectcrm123"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$results = @()

function Add-Result {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Details = ""
  )

  $script:results += [pscustomobject]@{
    Step = $Step
    Status = $Status
    Details = $Details
  }
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host ">> $Name"
  try {
    & $Action
    Add-Result -Step $Name -Status "PASS"
  }
  catch {
    Add-Result -Step $Name -Status "FAIL" -Details $_.Exception.Message
  }
}

function Invoke-WithDbEnv {
  param(
    [string]$DbHostName,
    [int]$DbPortNumber,
    [string]$DbName,
    [string]$DbUsername,
    [string]$DbUserPassword,
    [scriptblock]$Action
  )

  $keys = @(
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_NAME",
    "DATABASE_USERNAME",
    "DATABASE_PASSWORD"
  )

  $previous = @{}
  foreach ($key in $keys) {
    $previous[$key] = [System.Environment]::GetEnvironmentVariable($key, "Process")
  }

  try {
    $env:DATABASE_HOST = $DbHostName
    $env:DATABASE_PORT = "$DbPortNumber"
    $env:DATABASE_NAME = $DbName
    $env:DATABASE_USERNAME = $DbUsername
    $env:DATABASE_PASSWORD = $DbUserPassword
    & $Action
  }
  finally {
    foreach ($key in $keys) {
      $value = $previous[$key]
      if ($null -eq $value) {
        Remove-Item "Env:$key" -ErrorAction SilentlyContinue
      }
      else {
        Set-Item "Env:$key" $value
      }
    }
  }
}

Push-Location $repoRoot
try {
  Run-Step -Name "Smoke E2E: auth + leads + pipeline + produtos (multi-tenancy)" -Action {
    Invoke-WithDbEnv -DbHostName $DbHost -DbPortNumber $DbPort -DbName $DbDatabase -DbUsername $DbUser -DbUserPassword $DbPassword -Action {
      npm --prefix backend run test:e2e -- test/multi-tenancy.e2e-spec.ts
      if ($LASTEXITCODE -ne 0) { throw "multi-tenancy.e2e-spec.ts failed" }
    }
  }

  Run-Step -Name "Smoke E2E: propostas (isolamento)" -Action {
    Invoke-WithDbEnv -DbHostName $DbHost -DbPortNumber $DbPort -DbName $DbDatabase -DbUsername $DbUser -DbUserPassword $DbPassword -Action {
      npm --prefix backend run test:e2e -- test/isolamento-multi-tenant.e2e-spec.ts
      if ($LASTEXITCODE -ne 0) { throw "isolamento-multi-tenant.e2e-spec.ts failed" }
    }
  }

  Run-Step -Name "Smoke E2E: atendimento inbox/triagem" -Action {
    Invoke-WithDbEnv -DbHostName $DbHost -DbPortNumber $DbPort -DbName $DbDatabase -DbUsername $DbUser -DbUserPassword $DbPassword -Action {
      npm --prefix backend run test:e2e -- test/atendimento/triagem.e2e-spec.ts
      if ($LASTEXITCODE -ne 0) { throw "triagem.e2e-spec.ts failed" }
    }
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "MVP smoke summary:"
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "MVP smoke result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "MVP smoke result: PASS"
exit 0
