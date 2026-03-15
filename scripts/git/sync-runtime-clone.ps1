param(
  [string]$RuntimePath = '',
  [string]$SourcePath = '',
  [switch]$NoFetchOrigin,
  [switch]$NoFetchWorkspace,
  [switch]$NoFetchSourceOrigin,
  [switch]$AllowDivergentSource
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$WorkingDirectory = ''
  )

  if ($WorkingDirectory) {
    & git -C $WorkingDirectory @Arguments
  } else {
    & git @Arguments
  }

  if ($LASTEXITCODE -ne 0) {
    $scope = if ($WorkingDirectory) { " -C $WorkingDirectory" } else { '' }
    throw "Falha ao executar: git$scope $($Arguments -join ' ')"
  }
}

function Get-GitText {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$WorkingDirectory = ''
  )

  $output = $null
  if ($WorkingDirectory) {
    $output = (& git -C $WorkingDirectory @Arguments)
  } else {
    $output = (& git @Arguments)
  }

  if ($LASTEXITCODE -ne 0) {
    $scope = if ($WorkingDirectory) { " -C $WorkingDirectory" } else { '' }
    throw "Falha ao executar: git$scope $($Arguments -join ' ')"
  }

  return (($output -join '').Trim())
}

function Test-RemoteRefExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Ref,
    [string]$WorkingDirectory = ''
  )

  if ($WorkingDirectory) {
    & git -C $WorkingDirectory show-ref --verify --quiet "refs/remotes/$Ref"
  } else {
    & git show-ref --verify --quiet "refs/remotes/$Ref"
  }

  return ($LASTEXITCODE -eq 0)
}

if (-not $SourcePath) {
  $SourcePath = Get-GitText -Arguments @('rev-parse', '--show-toplevel')
}

if (-not $SourcePath) {
  throw 'Nao foi possivel identificar o repositorio de origem.'
}

$SourcePath = [System.IO.Path]::GetFullPath($SourcePath)

$repoName = Split-Path $SourcePath -Leaf
if (-not $RuntimePath) {
  $parentDir = Split-Path $SourcePath -Parent
  $RuntimePath = Join-Path $parentDir ($repoName + '-runtime')
}

$RuntimePath = [System.IO.Path]::GetFullPath($RuntimePath)

if (-not (Test-Path (Join-Path $RuntimePath '.git'))) {
  throw "Clone runtime nao encontrado em $RuntimePath. Execute primeiro o script de criacao."
}

$runtimeFlag = ''
try {
  $runtimeFlag = Get-GitText -WorkingDirectory $RuntimePath -Arguments @('config', '--get', 'conect360.runtimeClone')
}
catch {
  $runtimeFlag = ''
}

if ($runtimeFlag -ne 'true') {
  throw "O repositorio em $RuntimePath nao esta marcado como clone runtime do Conect360."
}

$runtimeStatus = ((@(& git -C $RuntimePath status --porcelain=v1)) -join "`n").Trim()
if ($runtimeStatus) {
  throw 'Clone runtime com alteracoes locais. Limpe o runtime antes de sincronizar.'
}

$sourceBranch = Get-GitText -WorkingDirectory $SourcePath -Arguments @('branch', '--show-current')
$sourceCommit = Get-GitText -WorkingDirectory $SourcePath -Arguments @('rev-parse', 'HEAD')
$sourceUpstream = ''
$sourceAhead = 0
$sourceBehind = 0

if (-not $sourceBranch -and -not $AllowDivergentSource) {
  throw 'Workspace de origem esta em detached HEAD. Runtime sync exige branch com upstream remoto. Use -AllowDivergentSource apenas se for intencional.'
}

if (-not $NoFetchSourceOrigin) {
  Invoke-Git -WorkingDirectory $SourcePath -Arguments @('fetch', 'origin', '--prune')
}

if ($sourceBranch) {
  try {
    $sourceUpstream = Get-GitText -WorkingDirectory $SourcePath -Arguments @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
  }
  catch {
    $sourceUpstream = ''
  }

  if (-not $sourceUpstream) {
    $fallbackUpstream = "origin/$sourceBranch"
    if (Test-RemoteRefExists -WorkingDirectory $SourcePath -Ref $fallbackUpstream) {
      $sourceUpstream = $fallbackUpstream
    }
  }

  if (-not $sourceUpstream) {
    if (-not $AllowDivergentSource) {
      throw "Branch '$sourceBranch' sem upstream remoto. Faca push/set-upstream antes de sincronizar runtime. Se for intencional, use -AllowDivergentSource."
    }

    Write-Warning "Branch '$sourceBranch' sem upstream remoto. Metadata nao tera comparacao ahead/behind."
  }
}

if ($sourceUpstream) {
  $aheadBehindRaw = Get-GitText -WorkingDirectory $SourcePath -Arguments @('rev-list', '--left-right', '--count', "HEAD...$sourceUpstream")
  $aheadBehindParts = $aheadBehindRaw -split '\s+'
  if ($aheadBehindParts.Count -lt 2) {
    throw "Falha ao calcular ahead/behind para '$sourceUpstream'. Saida: $aheadBehindRaw"
  }

  $sourceAhead = [int]$aheadBehindParts[0]
  $sourceBehind = [int]$aheadBehindParts[1]
}

if ($AllowDivergentSource) {
  if (-not $sourceBranch) {
    Write-Warning 'Runtime sync executando com -AllowDivergentSource em detached HEAD.'
  } elseif (-not $sourceUpstream) {
    Write-Warning 'Runtime sync executando com -AllowDivergentSource sem upstream remoto configurado.'
  } else {
    Write-Warning "Runtime sync executando com -AllowDivergentSource (ahead=$sourceAhead, behind=$sourceBehind). Commit local divergente sera refletido no runtime."
  }
}
else {
  if (-not $sourceUpstream) {
    throw "Nao foi possivel comparar '$sourceBranch' com upstream remoto."
  }

  if ($sourceAhead -gt 0 -or $sourceBehind -gt 0) {
    throw "Workspace de origem divergente de '$sourceUpstream' (ahead=$sourceAhead, behind=$sourceBehind). Runtime sync bloqueado para evitar regressao acidental. Se for intencional, use -AllowDivergentSource."
  }
}

if (-not $NoFetchWorkspace) {
  Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('fetch', 'workspace')
}

$originUrl = ''
try {
  $originUrl = Get-GitText -WorkingDirectory $RuntimePath -Arguments @('remote', 'get-url', 'origin')
}
catch {
  $originUrl = ''
}

if ($originUrl -and -not $NoFetchOrigin) {
  Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('fetch', 'origin', '--prune')
}

Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('switch', '--detach', $sourceCommit)

$metadata = [ordered]@{
  sourceWorkspace = $SourcePath
  sourceBranch    = $sourceBranch
  sourceUpstream  = $sourceUpstream
  sourceAhead     = $sourceAhead
  sourceBehind    = $sourceBehind
  sourceSafetyBypassed = [bool]$AllowDivergentSource
  syncedCommit    = $sourceCommit
  syncedAt        = (Get-Date).ToString('o')
}

$metadata | ConvertTo-Json | Set-Content -Path (Join-Path $RuntimePath '.runtime-workspace.json') -Encoding UTF8

Write-Host ''
Write-Host 'Clone runtime sincronizado:'
Write-Host "  Runtime       : $RuntimePath"
Write-Host "  Branch origem : $sourceBranch"
Write-Host "  Commit atual  : $sourceCommit"
