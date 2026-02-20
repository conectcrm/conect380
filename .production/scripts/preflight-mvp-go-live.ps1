param(
  [string]$RlsHost = "localhost",
  [int]$RlsPort = 5434,
  [string]$RlsDatabase = "conectcrm_test",
  [string]$RlsUser = "conectcrm",
  [string]$RlsPassword = "conectcrm123",
  [switch]$SkipApplyRls,
  [switch]$SkipRls,
  [switch]$SkipIsolationE2E,
  [switch]$SkipLintBudget
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

  Run-Step -Name "Frontend build (MVP mode)" -Action {
    $previousMvpMode = [System.Environment]::GetEnvironmentVariable("REACT_APP_MVP_MODE", "Process")
    try {
      $env:REACT_APP_MVP_MODE = "true"
      npm --prefix frontend-web run build
      if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
    }
    finally {
      if ($null -eq $previousMvpMode) {
        Remove-Item "Env:REACT_APP_MVP_MODE" -ErrorAction SilentlyContinue
      }
      else {
        Set-Item "Env:REACT_APP_MVP_MODE" $previousMvpMode
      }
    }
  }

  Run-Step -Name "Multi-tenant guardrails" -Action {
    npm --prefix backend run validate:multi-tenant
    if ($LASTEXITCODE -ne 0) { throw "validate:multi-tenant failed" }
  }

  Run-Step -Name "Permissions governance" -Action {
    npm --prefix backend run validate:permissions-governance
    if ($LASTEXITCODE -ne 0) { throw "validate:permissions-governance failed" }
  }

  if (-not $SkipRls) {
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
  }
  else {
    Add-Result -Step "Apply RLS baseline" -Status "SKIP" -Details "SkipRls enabled"
    Add-Result -Step "Validate RLS coverage" -Status "SKIP" -Details "SkipRls enabled"
  }

  if (-not $SkipLintBudget) {
    Run-Step -Name "Validate lint budget" -Action {
      npm --prefix backend run validate:lint-budget
      if ($LASTEXITCODE -ne 0) { throw "validate:lint-budget failed" }
    }
  }
  else {
    Add-Result -Step "Validate lint budget" -Status "SKIP" -Details "SkipLintBudget enabled"
  }

  Run-Step -Name "E2E atendimento triagem" -Action {
    npm --prefix backend run test:e2e -- test/atendimento/triagem.e2e-spec.ts
    if ($LASTEXITCODE -ne 0) { throw "triagem.e2e-spec.ts failed" }
  }

  if (-not $SkipIsolationE2E) {
    Run-Step -Name "E2E isolamento multi-tenant (MVP)" -Action {
      npm --prefix backend run test:e2e -- test/isolamento-multi-tenant.e2e-spec.ts
      if ($LASTEXITCODE -ne 0) { throw "isolamento-multi-tenant.e2e-spec.ts failed" }
    }
  }
  else {
    Add-Result -Step "E2E isolamento multi-tenant (MVP)" -Status "SKIP" -Details "SkipIsolationE2E enabled"
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "MVP preflight summary:"
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "MVP preflight result: FAIL"
  exit 1
}

Write-Host ""
Write-Host "MVP preflight result: PASS"
exit 0
