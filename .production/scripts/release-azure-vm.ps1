param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,
  [Parameter(Mandatory = $true)]
  [string]$SshUser,
  [Parameter(Mandatory = $true)]
  [string]$PemPath,
  [string]$RemoteRoot = "/home/azureuser/conect360",
  [switch]$SkipPreflight,
  [switch]$SkipBackup,
  [switch]$NoCacheBuild,
  [switch]$Execute
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Comando obrigatório não encontrado: $Name"
  }
}

function Run-Step {
  param(
    [string]$Title,
    [scriptblock]$Action
  )
  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
}

function Invoke-Remote {
  param([string]$ScriptText)
  ssh -i $PemPath -o StrictHostKeyChecking=no "$SshUser@$ServerIp" $ScriptText
  if ($LASTEXITCODE -ne 0) {
    throw "Falha em comando remoto."
  }
}

Require-Command git
Require-Command ssh
Require-Command scp

if (-not (Test-Path $PemPath)) {
  throw "Arquivo PEM não encontrado: $PemPath"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$artifactPath = Join-Path $repoRoot ".production\release-$timestamp.zip"
$shortSha = (git -C $repoRoot rev-parse --short HEAD).Trim()

Run-Step -Title "Validar git status" -Action {
  $status = git -C $repoRoot status --porcelain
  if ($status) {
    throw "Working tree com alterações locais. Commit/stash antes da release."
  }
  Write-Host "OK - working tree limpo"
}

if (-not $SkipPreflight) {
  Run-Step -Title "Rodar preflight local" -Action {
    & "$repoRoot\.production\scripts\preflight-go-live.ps1" -SkipE2E
    if ($LASTEXITCODE -ne 0) {
      throw "Preflight falhou."
    }
  }
}

Run-Step -Title "Gerar artifact zip do HEAD ($shortSha)" -Action {
  if (Test-Path $artifactPath) {
    Remove-Item $artifactPath -Force
  }
  git -C $repoRoot archive --format=zip --output $artifactPath HEAD
  Write-Host "Artifact: $artifactPath"
}

Run-Step -Title "Enviar artifact para VM" -Action {
  scp -i $PemPath $artifactPath "$SshUser@${ServerIp}:/tmp/conect360-release.zip"
  if ($LASTEXITCODE -ne 0) {
    throw "Falha no upload do artifact."
  }
}

Run-Step -Title "Preparar comandos remotos" -Action {
  $buildFlag = ""
  if ($NoCacheBuild) {
    $buildFlag = "--no-cache"
  }

  $remoteScript = @"
set -euo pipefail
mkdir -p $RemoteRoot
cd $RemoteRoot
rm -rf /tmp/conect360-release-extract
mkdir -p /tmp/conect360-release-extract
python3 - <<'PY'
import zipfile
zipfile.ZipFile('/tmp/conect360-release.zip').extractall('/tmp/conect360-release-extract')
PY
rsync -a --delete --exclude '.production/.env' --exclude '.production/.env.prod' /tmp/conect360-release-extract/ $RemoteRoot/
rm -rf /tmp/conect360-release-extract
cd $RemoteRoot/.production
"@

  if (-not $SkipBackup) {
    $remoteScript += @"
docker exec conectcrm-postgres pg_dump -U postgres -d conectcrm -Fc > /tmp/conectcrm-$timestamp.dump
"@
  }

  $remoteScript += @"
docker compose up -d postgres redis
docker compose build $buildFlag backend frontend
docker compose up -d backend
docker compose run --rm backend npm run migration:run
docker compose up -d frontend
curl -fsS http://127.0.0.1:3500/health > /dev/null
curl -fsS http://127.0.0.1:3000 > /dev/null
docker compose ps
"@

  if (-not $Execute) {
    Write-Host "Modo dry-run. Comandos que serão executados na VM:"
    Write-Host "--------------------------------------------------"
    Write-Host $remoteScript
    Write-Host "--------------------------------------------------"
    Write-Host "Para executar de fato, rode novamente com -Execute."
    return
  }

  Invoke-Remote -ScriptText $remoteScript
}

if (Test-Path $artifactPath) {
  Remove-Item $artifactPath -Force
}

Write-Host ""
Write-Host "Release concluída." -ForegroundColor Green
Write-Host "Próximo passo: purge de cache no Cloudflare (/index.html, /brand/*, /static/*)." -ForegroundColor Yellow
