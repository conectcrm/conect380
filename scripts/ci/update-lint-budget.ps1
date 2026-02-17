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

function Get-LintCounts {
  param(
    [string]$Name,
    [string[]]$CommandArgs
  )

  Write-Host "Running lint for $Name..."
  $outputRaw = & npm @CommandArgs 2>&1
  $outputText = ($outputRaw | ForEach-Object { $_.ToString() }) -join "`n"

  $match = [regex]::Match(
    $outputText,
    "(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if ($match.Success) {
    return [pscustomobject]@{
      errors = [int]$match.Groups[2].Value
      warnings = [int]$match.Groups[3].Value
    }
  }

  if ($LASTEXITCODE -eq 0) {
    return [pscustomobject]@{
      errors = 0
      warnings = 0
    }
  }

  Write-Host ($outputRaw | Select-Object -Last 20 | ForEach-Object { $_.ToString() }) -join "`n"
  throw "Could not parse lint summary for $Name."
}

$backend = Get-LintCounts -Name "backend" -CommandArgs @("--prefix", $backendDir, "run", "lint")
$frontend = Get-LintCounts -Name "frontend" -CommandArgs @("--prefix", $frontendDir, "run", "lint")

$updatedBudget = [pscustomobject]@{
  backend = [pscustomobject]@{
    maxErrors = $backend.errors
    maxWarnings = $backend.warnings
  }
  frontend = [pscustomobject]@{
    maxErrors = $frontend.errors
    maxWarnings = $frontend.warnings
  }
}

$json = $updatedBudget | ConvertTo-Json -Depth 4
Set-Content -Path $budgetPath -Value $json -Encoding UTF8

Write-Host ""
Write-Host "Lint budget updated:"
Write-Host " - backend:  $($backend.errors) errors / $($backend.warnings) warnings"
Write-Host " - frontend: $($frontend.errors) errors / $($frontend.warnings) warnings"
