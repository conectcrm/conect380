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

$docScopedChanges = @()
$nonDocChanges = @()

foreach ($file in $changedFiles) {
  if ($allowedExact -contains $file) {
    $docScopedChanges += $file
    continue
  }

  if ($file -like "docs/*") {
    $docScopedChanges += $file
    continue
  }

  if ($file -match "\.md$") {
    $docScopedChanges += $file
    continue
  }

  $nonDocChanges += $file
}

if ($docScopedChanges.Count -eq 0) {
  Write-Host "No docs-scope files changed. Skipping docs guardrail."
  exit 0
}

if ($nonDocChanges.Count -gt 0) {
  Write-Host ""
  Write-Host "Docs scope guardrails: mixed changes detected (docs + non-doc)."
  Write-Host "Guardrail running in advisory mode for this PR."
  $nonDocChanges | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  exit 0
}

Write-Host "Docs scope guardrails passed."
