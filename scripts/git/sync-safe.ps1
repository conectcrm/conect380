param(
  [string]$Remote = "origin",
  [string]$BaseBranch = "main",
  [switch]$Apply,
  [switch]$AllowHighRisk,
  [int]$MaxBehind = 120,
  [int]$MaxOverlap = 25,
  [string]$ReportFile = ""
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param([string[]]$GitArgs)

  $nativePrefWasSet = $false
  $nativePrefPrevious = $null
  if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $nativePrefWasSet = $true
    $nativePrefPrevious = $PSNativeCommandUseErrorActionPreference
    $PSNativeCommandUseErrorActionPreference = $false
  }

  try {
    $output = & git @GitArgs 2>&1
    $exitCode = $LASTEXITCODE
  }
  finally {
    if ($nativePrefWasSet) {
      $PSNativeCommandUseErrorActionPreference = $nativePrefPrevious
    }
  }

  if ($exitCode -ne 0) {
    throw "git $($GitArgs -join ' ') failed.`n$output"
  }
  return $output
}

function Get-GitLines {
  param([string[]]$GitArgs)
  $raw = Invoke-Git -GitArgs $GitArgs
  if (-not $raw) { return @() }
  return @($raw | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ -ne "" })
}

try {
  $insideRepo = Invoke-Git -GitArgs @("rev-parse", "--is-inside-work-tree")
  if ($insideRepo.Trim() -ne "true") {
    throw "Diretorio atual nao e um repositorio Git."
  }

  $currentBranch = (Invoke-Git -GitArgs @("branch", "--show-current")).Trim()
  if (-not $currentBranch) {
    throw "Nao foi possivel identificar a branch atual."
  }

  $baseRef = "$Remote/$BaseBranch"
  Write-Host "== Sync Audit ==" -ForegroundColor Cyan
  Write-Host "Branch atual: $currentBranch"
  Write-Host "Base remota:  $baseRef"

  Write-Host "`n[1/4] Fetch remoto..." -ForegroundColor Cyan
  [void](Invoke-Git -GitArgs @("fetch", $Remote))

  Write-Host "[2/4] Calculando ahead/behind..." -ForegroundColor Cyan
  $aheadBehindRaw = (Invoke-Git -GitArgs @("rev-list", "--left-right", "--count", "HEAD...$baseRef")).Trim()
  $parts = $aheadBehindRaw -split "\s+"
  if ($parts.Count -lt 2) {
    throw "Falha ao calcular ahead/behind. Saida: $aheadBehindRaw"
  }
  $ahead = [int]$parts[0]
  $behind = [int]$parts[1]

  Write-Host "[3/4] Coletando arquivos alterados..." -ForegroundColor Cyan
  $mergeBase = (Invoke-Git -GitArgs @("merge-base", "HEAD", $baseRef)).Trim()
  $branchFiles = Get-GitLines -GitArgs @("diff", "--name-only", "$mergeBase..HEAD")
  $baseFiles = Get-GitLines -GitArgs @("diff", "--name-only", "$mergeBase..$baseRef")

  $baseSet = New-Object "System.Collections.Generic.HashSet[string]"
  foreach ($file in $baseFiles) { [void]$baseSet.Add($file) }

  $overlap = New-Object System.Collections.Generic.List[string]
  foreach ($file in $branchFiles) {
    if ($baseSet.Contains($file)) {
      $overlap.Add($file) | Out-Null
    }
  }

  $overlapCount = $overlap.Count

  $risk = "LOW"
  if ($behind -gt $MaxBehind -or $overlapCount -gt $MaxOverlap) {
    $risk = "HIGH"
  } elseif ($behind -gt [Math]::Floor($MaxBehind / 2) -or $overlapCount -gt [Math]::Floor($MaxOverlap / 2)) {
    $risk = "MEDIUM"
  }

  Write-Host "[4/4] Montando relatorio..." -ForegroundColor Cyan
  $report = @()
  $report += "SYNC AUDIT REPORT"
  $report += "generated_at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")"
  $report += "branch: $currentBranch"
  $report += "base: $baseRef"
  $report += "merge_base: $mergeBase"
  $report += "ahead: $ahead"
  $report += "behind: $behind"
  $report += "changed_in_branch: $($branchFiles.Count)"
  $report += "changed_in_base: $($baseFiles.Count)"
  $report += "overlap_count: $overlapCount"
  $report += "risk: $risk"

  if ($overlapCount -gt 0) {
    $report += ""
    $report += "overlap_files_top20:"
    $overlap | Select-Object -First 20 | ForEach-Object { $report += " - $_" }
    if ($overlapCount -gt 20) {
      $report += " - ... ($($overlapCount - 20) arquivos adicionais omitidos)"
    }
  }

  $reportText = ($report -join [Environment]::NewLine)
  Write-Host ""
  Write-Host $reportText

  if ($ReportFile) {
    $reportDir = Split-Path -Path $ReportFile -Parent
    if ($reportDir -and -not (Test-Path $reportDir)) {
      New-Item -Path $reportDir -ItemType Directory -Force | Out-Null
    }
    Set-Content -Path $ReportFile -Value $reportText -Encoding UTF8
    Write-Host "`nRelatorio salvo em: $ReportFile" -ForegroundColor Green
  }

  if (-not $Apply) {
    Write-Host "`nModo auditoria concluido. Nenhuma alteracao aplicada." -ForegroundColor Yellow
    Write-Host "Para sincronizar com rebase seguro: npm run sync:apply"
    exit 0
  }

  $dirty = Get-GitLines -GitArgs @("status", "--porcelain")
  if ($dirty.Count -gt 0) {
    throw "Working tree nao esta limpo. Commit/stash antes de sincronizar."
  }

  if ($risk -eq "HIGH" -and -not $AllowHighRisk) {
    throw @"
Risco HIGH detectado (behind=$behind, overlap=$overlapCount).
Sincronizacao bloqueada para evitar regressao visual/funcional.

Opcoes seguras:
1) Revisar relatorio e reduzir escopo da branch.
2) Reaplicar commits em branch limpa baseada em $baseRef.
3) Se for intencional, execute com -AllowHighRisk.
"@
  }

  Write-Host "`nExecutando rebase seguro em $baseRef..." -ForegroundColor Cyan
  [void](Invoke-Git -GitArgs @("rebase", $baseRef))
  Write-Host "Rebase concluido com sucesso." -ForegroundColor Green
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
