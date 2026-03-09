param(
  [switch]$SyncFirst,
  [Parameter(Mandatory = $true)]
  [string]$CommandLine,
  [string]$RuntimePath = ''
)

$ErrorActionPreference = 'Stop'

if (-not $CommandLine) {
  throw 'Informe um comando para executar dentro do clone runtime.'
}

$repoRoot = ((& git rev-parse --show-toplevel) -join '').Trim()
if (-not $repoRoot) {
  throw 'Nao foi possivel identificar a raiz do repositorio.'
}

$repoRoot = [System.IO.Path]::GetFullPath($repoRoot)

if (-not $RuntimePath) {
  $parentDir = Split-Path $repoRoot -Parent
  $repoName = Split-Path $repoRoot -Leaf
  $RuntimePath = Join-Path $parentDir ($repoName + '-runtime')
}

$RuntimePath = [System.IO.Path]::GetFullPath($RuntimePath)

if (-not (Test-Path (Join-Path $RuntimePath '.git'))) {
  throw "Clone runtime nao encontrado em $RuntimePath. Execute npm run runtime:prepare primeiro."
}

if ($SyncFirst) {
  $syncScript = Join-Path $repoRoot 'scripts\git\sync-runtime-clone.ps1'
  & powershell -ExecutionPolicy Bypass -File $syncScript -RuntimePath $RuntimePath -SourcePath $repoRoot
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Push-Location $RuntimePath
try {
  Invoke-Expression $CommandLine
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
