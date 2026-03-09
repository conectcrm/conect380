param(
  [string]$RuntimePath = '',
  [string]$SourcePath = '',
  [switch]$NoFetchOrigin,
  [switch]$NoFetchWorkspace
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

  if ($WorkingDirectory) {
    return ((& git -C $WorkingDirectory @Arguments) -join '').Trim()
  }

  return ((& git @Arguments) -join '').Trim()
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
  syncedCommit    = $sourceCommit
  syncedAt        = (Get-Date).ToString('o')
}

$metadata | ConvertTo-Json | Set-Content -Path (Join-Path $RuntimePath '.runtime-workspace.json') -Encoding UTF8

Write-Host ''
Write-Host 'Clone runtime sincronizado:'
Write-Host "  Runtime       : $RuntimePath"
Write-Host "  Branch origem : $sourceBranch"
Write-Host "  Commit atual  : $sourceCommit"
