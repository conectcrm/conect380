param(
  [string]$Remote = "origin",
  [string]$MainBranch = "main",
  [int]$StaleDays = 21,
  [int]$BehindWarning = 15,
  [int]$BehindCritical = 60,
  [switch]$PruneFetch,
  [switch]$FailOnCritical,
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

function Test-RemoteRefExists {
  param([string]$Ref)
  try {
    [void](Invoke-Git -GitArgs @("show-ref", "--verify", "--quiet", "refs/remotes/$Ref"))
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
    return @{ Ahead = 0; Behind = 0 }
  }
  return @{
    Ahead = [int]$parts[0]
    Behind = [int]$parts[1]
  }
}

try {
  [void](Invoke-Git -GitArgs @("rev-parse", "--is-inside-work-tree"))

  if ($PruneFetch) {
    Write-Host "Executando fetch --prune..." -ForegroundColor Cyan
    [void](Invoke-Git -GitArgs @("fetch", $Remote, "--prune"))
  }

  $mainRef = "$Remote/$MainBranch"
  if (-not (Test-RemoteRefExists -Ref $mainRef)) {
    throw "Referencia remota $mainRef nao encontrada."
  }

  $rows = New-Object System.Collections.Generic.List[object]
  $now = Get-Date

  $rawBranches = Invoke-Git -GitArgs @(
    "for-each-ref",
    "--format=%(refname:short)|%(upstream:short)|%(committerdate:iso8601)|%(committerdate:unix)",
    "refs/heads"
  )

  foreach ($line in $rawBranches) {
    if (-not $line) { continue }
    $parts = $line.Split("|")
    $branch = $parts[0]
    $upstream = if ($parts.Count -gt 1) { $parts[1] } else { "" }
    $dateIso = if ($parts.Count -gt 2) { $parts[2] } else { "" }
    $dateUnix = if ($parts.Count -gt 3) { $parts[3] } else { "0" }

    $lastCommit = if ($dateUnix -match "^\d+$" -and [int64]$dateUnix -gt 0) {
      [DateTimeOffset]::FromUnixTimeSeconds([int64]$dateUnix).LocalDateTime
    } else {
      $now
    }
    $ageDays = [int][Math]::Floor(($now - $lastCommit).TotalDays)

    $upstreamState = "OK"
    $aheadUpstream = 0
    $behindUpstream = 0

    if (-not $upstream) {
      $upstreamState = "NO_UPSTREAM"
    } elseif (-not (Test-RemoteRefExists -Ref $upstream)) {
      $upstreamState = "UPSTREAM_GONE"
    } else {
      $abUpstream = Get-AheadBehind -LeftRef $branch -RightRef $upstream
      $aheadUpstream = $abUpstream.Ahead
      $behindUpstream = $abUpstream.Behind
    }

    $abMain = Get-AheadBehind -LeftRef $branch -RightRef $mainRef
    $aheadMain = $abMain.Ahead
    $behindMain = $abMain.Behind

    $health = "HEALTHY"
    $reason = "ok"

    if ($upstreamState -eq "UPSTREAM_GONE") {
      $health = "CRITICAL"
      $reason = "upstream gone"
    } elseif ($behindMain -ge $BehindCritical) {
      $health = "CRITICAL"
      $reason = "muito atras da main"
    } elseif ($behindMain -ge $BehindWarning -or $ageDays -ge $StaleDays -or $upstreamState -eq "NO_UPSTREAM") {
      $health = "WARNING"
      if ($upstreamState -eq "NO_UPSTREAM") {
        $reason = "sem upstream"
      } elseif ($behindMain -ge $BehindWarning) {
        $reason = "atrasada da main"
      } else {
        $reason = "branch stale"
      }
    }

    $rows.Add([PSCustomObject]@{
      Branch         = $branch
      Upstream       = if ($upstream) { $upstream } else { "-" }
      UpstreamState  = $upstreamState
      AheadUpstream  = $aheadUpstream
      BehindUpstream = $behindUpstream
      AheadMain      = $aheadMain
      BehindMain     = $behindMain
      AgeDays        = $ageDays
      Health         = $health
      Reason         = $reason
      LastCommit     = $dateIso
    }) | Out-Null
  }

  $critical = @($rows | Where-Object { $_.Health -eq "CRITICAL" })
  $warning = @($rows | Where-Object { $_.Health -eq "WARNING" })
  $healthy = @($rows | Where-Object { $_.Health -eq "HEALTHY" })

  $sorted = $rows | Sort-Object @{ Expression = "Health"; Descending = $true }, @{ Expression = "BehindMain"; Descending = $true }, @{ Expression = "AgeDays"; Descending = $true }

  $header = @()
  $header += "BRANCH HEALTH REPORT"
  $header += "generated_at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")"
  $header += "main_ref: $mainRef"
  $header += "thresholds: stale=$StaleDays d, behind_warning=$BehindWarning, behind_critical=$BehindCritical"
  $header += "summary: healthy=$($healthy.Count), warning=$($warning.Count), critical=$($critical.Count), total=$($rows.Count)"

  $table = $sorted | Select-Object Branch, Health, Reason, UpstreamState, BehindMain, AheadMain, AgeDays, Upstream

  Write-Host ""
  $header | ForEach-Object { Write-Host $_ }
  Write-Host ""
  $table | Format-Table -AutoSize | Out-String | Write-Host

  if ($critical.Count -gt 0 -or $warning.Count -gt 0) {
    Write-Host "Acoes recomendadas:" -ForegroundColor Yellow
    if ($critical.Count -gt 0) {
      Write-Host " - CRITICAL: nao tente limpar a branch no workspace principal."
      Write-Host " - CRITICAL: abra um worktree isolado com npm run branch:worktree:new -- -BranchName <nova-branch>."
      Write-Host " - CRITICAL: reaplique commits somente no worktree isolado baseado em $mainRef."
      Write-Host " - CRITICAL: remover/arrumar branches com upstream gone."
    }
    if ($warning.Count -gt 0) {
      Write-Host " - WARNING: rodar npm run sync:audit e sincronizar via npm run sync:apply."
      Write-Host " - WARNING: revisar branches stale e fechar PRs antigas."
    }
  } else {
    Write-Host "Todas as branches locais estao saudaveis." -ForegroundColor Green
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
    if ($critical.Count -gt 0 -or $warning.Count -gt 0) {
      $output += "Acoes recomendadas:"
      if ($critical.Count -gt 0) {
        $output += " - CRITICAL: nao tente limpar a branch no workspace principal."
        $output += " - CRITICAL: abra um worktree isolado com npm run branch:worktree:new -- -BranchName <nova-branch>."
        $output += " - CRITICAL: reaplique commits somente no worktree isolado baseado em $mainRef."
        $output += " - CRITICAL: remover/arrumar branches com upstream gone."
      }
      if ($warning.Count -gt 0) {
        $output += " - WARNING: rodar npm run sync:audit e sincronizar via npm run sync:apply."
        $output += " - WARNING: revisar branches stale e fechar PRs antigas."
      }
    }
    Set-Content -Path $OutputFile -Value ($output -join [Environment]::NewLine) -Encoding UTF8
    Write-Host "Relatorio salvo em: $OutputFile" -ForegroundColor Green
  }

  if ($FailOnCritical -and $critical.Count -gt 0) {
    exit 2
  }
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
