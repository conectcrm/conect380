param(
  [string]$RuntimePath = '',
  [string]$SourcePath = '',
  [switch]$NoFetch,
  [switch]$SkipSync
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

if (Test-Path $RuntimePath) {
  throw "O diretorio runtime ja existe: $RuntimePath. Use o script de sincronizacao."
}

$sourceOrigin = ''
try {
  $sourceOrigin = Get-GitText -WorkingDirectory $SourcePath -Arguments @('remote', 'get-url', 'origin')
}
catch {
  $sourceOrigin = ''
}

$sourceBranch = Get-GitText -WorkingDirectory $SourcePath -Arguments @('branch', '--show-current')
$sourceCommit = Get-GitText -WorkingDirectory $SourcePath -Arguments @('rev-parse', 'HEAD')
$sourceStatus = ((@(& git -C $SourcePath status --porcelain=v1)) -join "`n").Trim()

if ($sourceStatus) {
  Write-Warning 'Workspace principal com alteracoes locais. O clone runtime sera sincronizado apenas com o commit atual ja registrado em Git.'
}

Invoke-Git -Arguments @('clone', '--origin', 'workspace', $SourcePath, $RuntimePath)

if ($sourceOrigin) {
  Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('remote', 'add', 'origin', $sourceOrigin)
  if (-not $NoFetch) {
    Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('fetch', 'origin', '--prune')
  }
}

Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('config', 'conect360.runtimeClone', 'true')
Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('config', 'conect360.sourceWorkspace', $SourcePath)
Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('config', 'advice.detachedHead', 'false')

$excludeFile = Join-Path $RuntimePath '.git\info\exclude'
if (-not (Test-Path $excludeFile)) {
  New-Item -ItemType File -Path $excludeFile | Out-Null
}

$excludeContent = Get-Content $excludeFile -ErrorAction SilentlyContinue
if ($excludeContent -notcontains '.runtime-workspace.json') {
  Add-Content -Path $excludeFile -Value '.runtime-workspace.json'
}

if (-not $SkipSync) {
  Invoke-Git -WorkingDirectory $RuntimePath -Arguments @('switch', '--detach', $sourceCommit)
}

$metadata = [ordered]@{
  sourceWorkspace = $SourcePath
  sourceBranch    = $sourceBranch
  syncedCommit    = $sourceCommit
  syncedAt        = (Get-Date).ToString('o')
}

$metadata | ConvertTo-Json | Set-Content -Path (Join-Path $RuntimePath '.runtime-workspace.json') -Encoding UTF8

Write-Host ''
Write-Host 'Clone runtime criado com sucesso:'
Write-Host "  Origem        : $SourcePath"
Write-Host "  Runtime       : $RuntimePath"
Write-Host "  Branch origem : $sourceBranch"
Write-Host "  Commit atual  : $sourceCommit"
Write-Host ''
Write-Host 'Uso recomendado:'
Write-Host '  1. Instale dependencias no clone runtime com npm ci se necessario.'
Write-Host '  2. Rode npm run runtime:sync antes de subir o sistema.'
Write-Host '  3. Use o clone runtime para executar o sistema e o workspace principal para Git.'
