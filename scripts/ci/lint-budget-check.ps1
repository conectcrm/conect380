param(
  [string]$BudgetFile = "scripts/ci/lint-budget.json"
)

$ErrorActionPreference = "Stop"
$repoRoot = (git rev-parse --show-toplevel).Trim()
$budgetPath = Join-Path $repoRoot $BudgetFile
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend-web"

if (-not (Test-Path $budgetPath)) {
  Write-Host "Lint budget file not found: $budgetPath"
  exit 1
}

$budget = Get-Content $budgetPath -Raw | ConvertFrom-Json

function Get-LintResult {
  param(
    [string]$Name,
    [string[]]$CommandArgs
  )

  Write-Host ""
  Write-Host "Running lint for $Name..."
  $outputRaw = & npm @CommandArgs 2>&1
  $exitCode = $LASTEXITCODE
  $outputText = ($outputRaw | ForEach-Object { $_.ToString() }) -join "`n"

  $match = [regex]::Match(
    $outputText,
    "(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if ($match.Success) {
    return [pscustomobject]@{
      Name      = $Name
      ExitCode  = $exitCode
      Problems  = [int]$match.Groups[1].Value
      Errors    = [int]$match.Groups[2].Value
      Warnings  = [int]$match.Groups[3].Value
      Summary   = $match.Value
    }
  }

  if ($exitCode -eq 0) {
    return [pscustomobject]@{
      Name      = $Name
      ExitCode  = 0
      Problems  = 0
      Errors    = 0
      Warnings  = 0
      Summary   = "No lint issues."
    }
  }

  $tail = ($outputRaw | Select-Object -Last 20 | ForEach-Object { $_.ToString() }) -join "`n"
  Write-Host $tail
  throw "Could not parse lint summary for $Name."
}

$backendResult = Get-LintResult -Name "backend" -CommandArgs @("--prefix", $backendDir, "run", "lint")
$frontendResult = Get-LintResult -Name "frontend" -CommandArgs @("--prefix", $frontendDir, "run", "lint")

$violations = @()

if ($backendResult.Errors -gt [int]$budget.backend.maxErrors) {
  $violations += "backend errors $($backendResult.Errors) > budget $($budget.backend.maxErrors)"
}
if ($backendResult.Warnings -gt [int]$budget.backend.maxWarnings) {
  $violations += "backend warnings $($backendResult.Warnings) > budget $($budget.backend.maxWarnings)"
}
if ($frontendResult.Errors -gt [int]$budget.frontend.maxErrors) {
  $violations += "frontend errors $($frontendResult.Errors) > budget $($budget.frontend.maxErrors)"
}
if ($frontendResult.Warnings -gt [int]$budget.frontend.maxWarnings) {
  $violations += "frontend warnings $($frontendResult.Warnings) > budget $($budget.frontend.maxWarnings)"
}

Write-Host ""
Write-Host "Lint budget summary:"
Write-Host " - backend:  $($backendResult.Errors) errors / $($backendResult.Warnings) warnings (budget $($budget.backend.maxErrors)/$($budget.backend.maxWarnings))"
Write-Host " - frontend: $($frontendResult.Errors) errors / $($frontendResult.Warnings) warnings (budget $($budget.frontend.maxErrors)/$($budget.frontend.maxWarnings))"

if ($violations.Count -gt 0) {
  Write-Host ""
  Write-Host "Lint budget check failed:"
  $violations | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Lint budget check passed."
exit 0
