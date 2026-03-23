param(
  [string]$Remote = "origin",
  [string]$MainBranch = "main",
  [int]$StaleDays = 21,
  [switch]$PruneFetch,
  [switch]$FailOnReview,
  [string]$OutputFile = ""
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

function Test-RefExists {
  param([string]$Ref)
  try {
    [void](Invoke-Git -GitArgs @("show-ref", "--verify", "--quiet", $Ref))
    return $true
  }
  catch {
    return $false
  }
}

function Get-AheadBehind {
  param([string]$LeftRef, [string]$RightRef)
  $raw = (Invoke-Git -GitArgs @("rev-list", "--left-right", "--count", "$LeftRef...$RightRef")).Trim()
  $parts = $raw -split "\s+"
  if ($parts.Count -lt 2) {
    return @{ LeftOnly = 0; RightOnly = 0 }
  }

  return @{
    LeftOnly = [int]$parts[0]
    RightOnly = [int]$parts[1]
  }
}

function Test-IsAncestor {
  param([string]$AncestorRef, [string]$DescendantRef)

  & git merge-base --is-ancestor $AncestorRef $DescendantRef | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Get-CherryStats {
  param([string]$BaseRef, [string]$BranchRef)

  $plus = 0
  $minus = 0
  $raw = Invoke-Git -GitArgs @("cherry", $BaseRef, $BranchRef)
  foreach ($line in $raw) {
    if (-not $line) { continue }
    if ($line.StartsWith("+ ")) {
      $plus++
    } elseif ($line.StartsWith("- ")) {
      $minus++
    }
  }

  return @{
    UniquePatches = $plus
    EquivalentPatches = $minus
  }
}

try {
  [void](Invoke-Git -GitArgs @("rev-parse", "--is-inside-work-tree"))

  if ($PruneFetch) {
    Write-Host "Executando fetch --prune..." -ForegroundColor Cyan
    [void](Invoke-Git -GitArgs @("fetch", $Remote, "--prune"))
  }

  $mainRef = "$Remote/$MainBranch"
  if (-not (Test-RefExists -Ref "refs/remotes/$mainRef")) {
    throw "Referencia remota $mainRef nao encontrada."
  }

  $rows = New-Object System.Collections.Generic.List[object]
  $now = Get-Date

  $rawBranches = Invoke-Git -GitArgs @(
    "for-each-ref",
    "--format=%(refname:short)|%(committerdate:iso8601)|%(committerdate:unix)",
    "refs/remotes/$Remote"
  )

  foreach ($line in $rawBranches) {
    if (-not $line) { continue }

    $parts = $line.Split("|")
    $remoteBranch = $parts[0]
    if ($remoteBranch -eq "$Remote/HEAD") { continue }

    $shortBranch = $remoteBranch.Substring($Remote.Length + 1)
    if ($shortBranch -eq $MainBranch) { continue }

    $dateIso = if ($parts.Count -gt 1) { $parts[1] } else { "" }
    $dateUnix = if ($parts.Count -gt 2) { $parts[2] } else { "0" }

    $lastCommit = if ($dateUnix -match "^\d+$" -and [int64]$dateUnix -gt 0) {
      [DateTimeOffset]::FromUnixTimeSeconds([int64]$dateUnix).LocalDateTime
    } else {
      $now
    }
    $ageDays = [int][Math]::Floor(($now - $lastCommit).TotalDays)

    $hasLocal = Test-RefExists -Ref "refs/heads/$shortBranch"
    $abMain = Get-AheadBehind -LeftRef $mainRef -RightRef $remoteBranch
    $behindMain = $abMain.LeftOnly
    $aheadMain = $abMain.RightOnly
    $isMerged = Test-IsAncestor -AncestorRef $remoteBranch -DescendantRef $mainRef
    $cherry = Get-CherryStats -BaseRef $mainRef -BranchRef $remoteBranch

    $category = "REVIEW"
    $reason = "commits exclusivos sem branch local"

    if ($shortBranch -eq "develop") {
      $category = "KEEP"
      $reason = "branch protegida"
    } elseif ($shortBranch -like "dependabot/*") {
      $category = "DEPENDABOT"
      $reason = "branch automatica pendente"
    } elseif ($hasLocal) {
      $category = "KEEP"
      $reason = "branch local ativa"
    } elseif ($isMerged) {
      $category = "DELETE_SAFE"
      $reason = "mergeada na main"
    } elseif ($cherry.UniquePatches -eq 0) {
      $category = "DELETE_SAFE"
      $reason = "equivalente por patch a main"
    } elseif ($ageDays -ge $StaleDays) {
      $category = "REVIEW"
      $reason = "stale com commits exclusivos"
    }

    $rows.Add([PSCustomObject]@{
      RemoteBranch       = $remoteBranch
      Category           = $category
      Reason             = $reason
      AheadMain          = $aheadMain
      BehindMain         = $behindMain
      UniquePatches      = $cherry.UniquePatches
      EquivalentPatches  = $cherry.EquivalentPatches
      AgeDays            = $ageDays
      HasLocal           = $hasLocal
      LastCommit         = $dateIso
    }) | Out-Null
  }

  $deleteSafe = @($rows | Where-Object { $_.Category -eq "DELETE_SAFE" })
  $review = @($rows | Where-Object { $_.Category -eq "REVIEW" })
  $keep = @($rows | Where-Object { $_.Category -eq "KEEP" })
  $dependabot = @($rows | Where-Object { $_.Category -eq "DEPENDABOT" })

  $categoryOrder = @{
    "DELETE_SAFE" = 0
    "REVIEW" = 1
    "KEEP" = 2
    "DEPENDABOT" = 3
  }

  $sorted = $rows | Sort-Object `
    @{ Expression = { $categoryOrder[$_.Category] } }, `
    @{ Expression = "AgeDays"; Descending = $true }, `
    @{ Expression = "AheadMain"; Descending = $true }

  $header = @()
  $header += "REMOTE BRANCH HEALTH REPORT"
  $header += "generated_at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")"
  $header += "main_ref: $mainRef"
  $header += "stale_days: $StaleDays"
  $header += "summary: delete_safe=$($deleteSafe.Count), review=$($review.Count), keep=$($keep.Count), dependabot=$($dependabot.Count), total=$($rows.Count)"

  $table = $sorted | Select-Object RemoteBranch, Category, Reason, AheadMain, BehindMain, UniquePatches, EquivalentPatches, AgeDays, HasLocal

  Write-Host ""
  $header | ForEach-Object { Write-Host $_ }
  Write-Host ""
  $table | Format-Table -AutoSize | Out-String | Write-Host

  if ($deleteSafe.Count -gt 0 -or $review.Count -gt 0) {
    Write-Host "Acoes recomendadas:" -ForegroundColor Yellow
    if ($deleteSafe.Count -gt 0) {
      Write-Host " - DELETE_SAFE: remover remotas sem branch local e sem diferenca util contra $mainRef."
    }
    if ($review.Count -gt 0) {
      Write-Host " - REVIEW: validar PR, dono e necessidade funcional antes de deletar."
      Write-Host " - REVIEW: se decidir remover, arquivar o commit com tag antes do delete remoto."
    }
  } else {
    Write-Host "Nenhuma branch remota problematica encontrada." -ForegroundColor Green
  }

  if ($OutputFile) {
    $dir = Split-Path -Parent $OutputFile
    if ($dir -and -not (Test-Path $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $output = @()
    $output += $header
    $output += ""
    $output += ($table | Format-Table -AutoSize | Out-String)
    if ($deleteSafe.Count -gt 0 -or $review.Count -gt 0) {
      $output += "Acoes recomendadas:"
      if ($deleteSafe.Count -gt 0) {
        $output += " - DELETE_SAFE: remover remotas sem branch local e sem diferenca util contra $mainRef."
      }
      if ($review.Count -gt 0) {
        $output += " - REVIEW: validar PR, dono e necessidade funcional antes de deletar."
        $output += " - REVIEW: se decidir remover, arquivar o commit com tag antes do delete remoto."
      }
    }
    Set-Content -Path $OutputFile -Value ($output -join [Environment]::NewLine) -Encoding UTF8
    Write-Host "Relatorio salvo em: $OutputFile" -ForegroundColor Green
  }

  if ($FailOnReview -and $review.Count -gt 0) {
    exit 2
  }
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
