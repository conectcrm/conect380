param(
  [string]$BaseSha = "",
  [string]$HeadSha = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = (git rev-parse --show-toplevel).Trim()

if (-not $HeadSha) {
  $HeadSha = (git -C $repoRoot rev-parse HEAD).Trim()
}

if (-not $BaseSha -or $BaseSha -eq $HeadSha -or $BaseSha -match '^0+$') {
  try {
    $BaseSha = (git -C $repoRoot rev-parse "$HeadSha~1").Trim()
  } catch {
    $BaseSha = (git -C $repoRoot rev-list --max-parents=0 $HeadSha | Select-Object -First 1).Trim()
  }
}

Write-Host "Multi-tenant guardrails"
Write-Host "Base: $BaseSha"
Write-Host "Head: $HeadSha"

$changedFiles = git -C $repoRoot diff --name-only $BaseSha $HeadSha | Where-Object { $_ }
if (-not $changedFiles) {
  $workingTreeFiles = @(
    git -C $repoRoot diff --name-only
    git -C $repoRoot diff --name-only --cached
  ) | Sort-Object -Unique | Where-Object { $_ }

  if ($workingTreeFiles) {
    Write-Host "No commit-range diff detected. Falling back to working tree diff."
    $changedFiles = $workingTreeFiles
  } else {
    Write-Host "No changed files detected."
    exit 0
  }
}

$backendFiles = $changedFiles | Where-Object {
  $_ -like "backend/src/*.ts" -or $_ -like "backend/src/**/*.ts"
}

if (-not $backendFiles) {
  $workingTreeBackendFiles = @(
    git -C $repoRoot diff --name-only -- backend/src
    git -C $repoRoot diff --name-only --cached -- backend/src
  ) | Sort-Object -Unique | Where-Object { $_ -like "*.ts" }

  if ($workingTreeBackendFiles) {
    Write-Host "No backend file found in commit-range diff. Falling back to working tree backend diff."
    $backendFiles = $workingTreeBackendFiles
  } else {
    Write-Host "No backend source files changed."
    exit 0
  }
}

$guardExemptControllers = @(
  'backend/src/empresas/empresas.controller.ts',
  'backend/src/migration/migration.controller.ts'
)

$scopeExemptFiles = @(
  'backend/src/empresas/empresas.service.ts',
  'backend/src/modules/admin/services/admin-empresas.service.ts'
)

$issues = @()

foreach ($file in $backendFiles) {
  $normalizedFile = $file -replace '\\', '/'
  $filePath = Join-Path $repoRoot $normalizedFile

  if (-not (Test-Path $filePath)) {
    continue
  }

  $content = Get-Content $filePath -Raw

  if ($content -match "@Query\('empresaId'\)") {
    $issues += "[tenant] $normalizedFile uses empresaId from query string."
  }

  $isGuardExempt = $guardExemptControllers -contains $normalizedFile
  $isAdminScopedController = $content -match "RolesGuard" -and $content -match "@Roles\("
  if (
    $normalizedFile -like "*.controller.ts" -and
    $content -match "@UseGuards\(JwtAuthGuard" -and
    $content -notmatch "EmpresaGuard" -and
    $content -notmatch "SkipEmpresaValidation" -and
    -not $isGuardExempt -and
    -not $isAdminScopedController
  ) {
    $issues += "[guard] $normalizedFile uses JwtAuthGuard without EmpresaGuard."
  }

  if ($scopeExemptFiles -notcontains $normalizedFile -and $content -match "findOne\(\{\s*where:\s*\{\s*id\s*\}") {
    $issues += "[scope] $normalizedFile has findOne by id without tenant scope."
  }
}

if ($issues.Count -gt 0) {
  Write-Host ""
  Write-Host "Guardrails failed:"
  $issues | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Guardrails passed."
