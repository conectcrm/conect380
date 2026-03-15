param(
  [string]$RuntimePath = ''
)

$ErrorActionPreference = 'Stop'

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

$packages = @(
  '.',
  'backend',
  'frontend-web',
  'admin-web',
  'guardian-web'
)

foreach ($relativePath in $packages) {
  $targetPath = if ($relativePath -eq '.') { $RuntimePath } else { Join-Path $RuntimePath $relativePath }
  $packageJson = Join-Path $targetPath 'package.json'

  if (-not (Test-Path $packageJson)) {
    continue
  }

  Write-Host ''
  Write-Host "Instalando dependencias com npm ci em: $targetPath"
  & npm --prefix $targetPath ci
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar npm ci em $targetPath"
  }
}

Write-Host ''
Write-Host "Dependencias do clone runtime instaladas em $RuntimePath"
