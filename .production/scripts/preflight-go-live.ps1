param(
  [string]$RlsHost = "localhost",
  [int]$RlsPort = 5433,
  [string]$RlsDatabase = "conectcrm",
  [string]$RlsUser = "postgres",
  [string]$RlsPassword = "postgres",
  [switch]$SkipApplyRls,
  [switch]$SkipE2E
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
    [string]$DbHost,
    [int]$Port,
    [string]$Database,
    [string]$Username,
    [string]$Password,
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
    $env:DATABASE_HOST = $DbHost
    $env:DATABASE_PORT = "$Port"
    $env:DATABASE_NAME = $Database
    $env:DATABASE_USERNAME = $Username
    $env:DATABASE_PASSWORD = $Password
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
  Run-Step -Name "Backend type-check" -Action {
    npm --prefix backend run type-check
    if ($LASTEXITCODE -ne 0) { throw "backend type-check failed" }
  }

  Run-Step -Name "Backend build" -Action {
    npm --prefix backend run build
    if ($LASTEXITCODE -ne 0) { throw "backend build failed" }
  }

  Run-Step -Name "Frontend type-check" -Action {
    npm --prefix frontend-web run type-check
    if ($LASTEXITCODE -ne 0) { throw "frontend type-check failed" }
  }

  Run-Step -Name "Frontend build" -Action {
    npm --prefix frontend-web run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
  }

  Run-Step -Name "Multi-tenant guardrails" -Action {
    npm --prefix backend run validate:multi-tenant
    if ($LASTEXITCODE -ne 0) { throw "validate:multi-tenant failed" }
  }

  if (-not $SkipApplyRls) {
    Run-Step -Name "Apply RLS baseline" -Action {
      Invoke-WithDbEnv -DbHost $RlsHost -Port $RlsPort -Database $RlsDatabase -Username $RlsUser -Password $RlsPassword -Action {
        npm --prefix backend run apply:rls
        if ($LASTEXITCODE -ne 0) { throw "apply:rls failed" }
      }
    }
  }
  else {
    Add-Result -Step "Apply RLS baseline" -Status "SKIP" -Details "SkipApplyRls enabled"
  }

  Run-Step -Name "Validate RLS coverage" -Action {
    Invoke-WithDbEnv -DbHost $RlsHost -Port $RlsPort -Database $RlsDatabase -Username $RlsUser -Password $RlsPassword -Action {
      npm --prefix backend run validate:rls
      if ($LASTEXITCODE -ne 0) { throw "validate:rls failed" }
    }
  }

  Run-Step -Name "Validate lint budget" -Action {
    npm --prefix backend run validate:lint-budget
    if ($LASTEXITCODE -ne 0) { throw "validate:lint-budget failed" }
  }

  if (-not $SkipE2E) {
    Run-Step -Name "E2E isolamento (clientes/propostas)" -Action {
      Invoke-WithDbEnv -DbHost "localhost" -Port 5434 -Database "conectcrm_test" -Username "conectcrm" -Password "conectcrm123" -Action {
        npm --prefix backend run test:e2e -- test/isolamento-multi-tenant.e2e-spec.ts
        if ($LASTEXITCODE -ne 0) { throw "isolamento-multi-tenant.e2e-spec.ts failed" }
      }
    }

    Run-Step -Name "E2E multi-tenancy suite" -Action {
      Invoke-WithDbEnv -DbHost "localhost" -Port 5434 -Database "conectcrm_test" -Username "conectcrm" -Password "conectcrm123" -Action {
        npm --prefix backend run test:e2e -- test/multi-tenancy.e2e-spec.ts
        if ($LASTEXITCODE -ne 0) { throw "multi-tenancy.e2e-spec.ts failed" }
      }
    }
  }
  else {
    Add-Result -Step "E2E isolamento (clientes/propostas)" -Status "SKIP" -Details "SkipE2E enabled"
    Add-Result -Step "E2E multi-tenancy suite" -Status "SKIP" -Details "SkipE2E enabled"
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Preflight summary:"
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Preflight result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "Preflight result: PASS"
exit 0
