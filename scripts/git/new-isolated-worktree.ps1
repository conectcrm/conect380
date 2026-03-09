param(
  [Parameter(Mandatory = $true)]
  [string]$BranchName,

  [string]$BaseRef = 'origin/main',

  [string]$WorktreeRoot = '',

  [switch]$NoFetch
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: git $($Arguments -join ' ')"
  }
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw 'Nao foi possivel identificar a raiz do repositorio.'
}

$repoName = Split-Path $repoRoot -Leaf
$sanitizedBranch = ($BranchName -replace '[\\/:*?""<>|]', '-').Trim()
if (-not $sanitizedBranch) {
  throw 'Nome de branch invalido.'
}

if (-not $WorktreeRoot) {
  $parentDir = Split-Path $repoRoot -Parent
  $WorktreeRoot = Join-Path $parentDir ($repoName + '-worktrees')
}

if (-not (Test-Path $WorktreeRoot)) {
  New-Item -ItemType Directory -Path $WorktreeRoot | Out-Null
}

$worktreePath = Join-Path $WorktreeRoot $sanitizedBranch

Set-Location $repoRoot

$status = (& git status --porcelain=v1).Trim()
if ($status) {
  throw 'Workspace principal com alteracoes pendentes. Limpe antes de criar um worktree isolado.'
}

if (-not $NoFetch) {
  Invoke-Git -Arguments @('fetch', 'origin', '--prune')
}

$null = & git show-ref --verify --quiet ("refs/heads/{0}" -f $BranchName)
$localExists = $LASTEXITCODE -eq 0
if ($localExists) {
  throw "A branch local '$BranchName' ja existe. Escolha outro nome."
}

if (Test-Path $worktreePath) {
  throw "O diretorio de worktree ja existe: $worktreePath"
}

Invoke-Git -Arguments @('worktree', 'add', '-b', $BranchName, $worktreePath, $BaseRef)

Write-Host ''
Write-Host 'Worktree isolado criado com sucesso:'
Write-Host "  Repo principal : $repoRoot"
Write-Host "  Base           : $BaseRef"
Write-Host "  Branch         : $BranchName"
Write-Host "  Worktree       : $worktreePath"
Write-Host ''
Write-Host 'Uso recomendado:'
Write-Host "  1. Abra o worktree em outra janela de terminal/editor."
Write-Host "  2. Faça cherry-pick ou commits de PR somente nele."
Write-Host "  3. Nao troque a branch do workspace principal que executa o sistema."
