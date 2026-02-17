param(
  [Parameter(Mandatory = $true)]
  [string]$BaseSha,

  [Parameter(Mandatory = $true)]
  [string]$HeadSha
)

$ErrorActionPreference = "Stop"

Write-Host "Docs scope guardrails"
Write-Host "Base: $BaseSha"
Write-Host "Head: $HeadSha"

$changedFiles = git diff --name-only $BaseSha $HeadSha
if (-not $changedFiles) {
  Write-Host "No changed files detected."
  exit 0
}

$allowedExact = @(
  ".github/workflows/docs-scope-guardrails.yml",
  "scripts/ci/docs-scope-guardrails.ps1"
)

$violations = @()

foreach ($file in $changedFiles) {
  if ($allowedExact -contains $file) {
    continue
  }

  if ($file -like "docs/*") {
    continue
  }

  if ($file -match "\.md$") {
    continue
  }

  $violations += $file
}

if ($violations.Count -gt 0) {
  Write-Host ""
  Write-Host "Docs scope guardrails failed. Non-doc files changed:"
  $violations | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Docs scope guardrails passed."
