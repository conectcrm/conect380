param(
  [string]$ServerIp,
  [string]$SshUser,
  [string]$PemPath,
  [string]$RemoteRoot,
  [string]$ProfileName = "production",
  [string]$ProfilePath,
  [switch]$SkipPreflight,
  [switch]$SkipBackup,
  [switch]$NoCacheBuild,
  [switch]$AllowDirtyWorktree,
  [switch]$RunAdm303Smoke,
  [string]$Adm303BaseUrl = "https://api.conect360.com",
  [string]$Adm303RequesterEmail,
  [string]$Adm303RequesterPassword,
  [string]$Adm303RequesterMfaCode,
  [string]$Adm303ApproverEmail,
  [string]$Adm303ApproverPassword,
  [string]$Adm303ApproverMfaCode,
  [string]$Adm303TargetEmail,
  [string]$Adm303TargetPassword,
  [string]$Adm303TargetMfaCode,
  [switch]$Adm303SkipTargetAccessCheck,
  [switch]$Execute
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Comando obrigatorio nao encontrado: $Name"
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

function Load-DeployProfile {
  param(
    [string]$Path,
    [string]$Name
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $null
  }

  if (-not (Test-Path $Path)) {
    throw "Arquivo de perfil nao encontrado: $Path"
  }

  $data = Import-PowerShellDataFile -Path $Path
  if ($null -eq $data -or -not $data.ContainsKey("Profiles")) {
    throw "Arquivo de perfil invalido: chave 'Profiles' ausente em $Path"
  }

  $profiles = $data.Profiles
  if ($null -eq $profiles -or -not $profiles.ContainsKey($Name)) {
    $available = @()
    foreach ($key in $profiles.Keys) {
      $available += [string]$key
    }
    $availableText = if ($available.Count -gt 0) { $available -join ", " } else { "<nenhum>" }
    throw "Perfil '$Name' nao encontrado em $Path. Perfis disponiveis: $availableText"
  }

  return $profiles[$Name]
}

function Resolve-MissingArgs {
  param([hashtable]$ProfileData)

  if ($null -eq $ProfileData) {
    return
  }

  if ([string]::IsNullOrWhiteSpace($ServerIp) -and $ProfileData.ContainsKey("ServerIp")) {
    $script:ServerIp = [string]$ProfileData.ServerIp
  }
  if ([string]::IsNullOrWhiteSpace($SshUser) -and $ProfileData.ContainsKey("SshUser")) {
    $script:SshUser = [string]$ProfileData.SshUser
  }
  if ([string]::IsNullOrWhiteSpace($PemPath) -and $ProfileData.ContainsKey("PemPath")) {
    $script:PemPath = [string]$ProfileData.PemPath
  }
  if ([string]::IsNullOrWhiteSpace($RemoteRoot) -and $ProfileData.ContainsKey("RemoteRoot")) {
    $script:RemoteRoot = [string]$ProfileData.RemoteRoot
  }
}

function Invoke-Remote {
  param([string]$ScriptText)
  ssh -i $PemPath -o StrictHostKeyChecking=no "$SshUser@$ServerIp" $ScriptText
  if ($LASTEXITCODE -ne 0) {
    throw "Falha em comando remoto."
  }
}

function Ensure-RequiredValue {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Parametro obrigatorio ausente para smoke ADM-303: $Name"
  }
}

function Mask-SecretValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "<vazio>"
  }

  if ($Value.Length -le 2) {
    return "**"
  }

  return ($Value.Substring(0, 1) + ("*" * ($Value.Length - 2)) + $Value.Substring($Value.Length - 1, 1))
}

Require-Command git
Require-Command ssh
Require-Command scp

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$defaultProfilePath = Join-Path $repoRoot ".production\configs\deploy-profile.local.psd1"

if ([string]::IsNullOrWhiteSpace($ProfilePath) -and -not [string]::IsNullOrWhiteSpace($env:CONNECT360_DEPLOY_PROFILE_PATH)) {
  $ProfilePath = $env:CONNECT360_DEPLOY_PROFILE_PATH
}

if ([string]::IsNullOrWhiteSpace($ProfilePath) -and (Test-Path $defaultProfilePath)) {
  $ProfilePath = $defaultProfilePath
}

$profileData = Load-DeployProfile -Path $ProfilePath -Name $ProfileName
Resolve-MissingArgs -ProfileData $profileData

if ([string]::IsNullOrWhiteSpace($RemoteRoot)) {
  $RemoteRoot = "/home/azureuser/conect360"
}

$missing = @()
if ([string]::IsNullOrWhiteSpace($ServerIp)) { $missing += "ServerIp" }
if ([string]::IsNullOrWhiteSpace($SshUser)) { $missing += "SshUser" }
if ([string]::IsNullOrWhiteSpace($PemPath)) { $missing += "PemPath" }
if ($missing.Count -gt 0) {
  $missingText = $missing -join ", "
  throw "Parametros obrigatorios ausentes: $missingText. Passe por argumento ou configure o perfil em .production/configs/deploy-profile.local.psd1"
}

if (-not (Test-Path $PemPath)) {
  throw "Arquivo PEM nao encontrado: $PemPath"
}

if ($profileData) {
  Write-Host "Perfil de deploy carregado: '$ProfileName'" -ForegroundColor DarkCyan
  Write-Host "Arquivo de perfil: $ProfilePath" -ForegroundColor DarkCyan
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$artifactPath = Join-Path $repoRoot ".production\release-$timestamp.zip"
$shortSha = (git -C $repoRoot rev-parse --short HEAD).Trim()

Run-Step -Title "Validar git status" -Action {
  $status = git -C $repoRoot status --porcelain
  if ($status) {
    if (-not $AllowDirtyWorktree) {
      throw "Working tree com alteracoes locais. Commit/stash antes da release."
    }

    Write-Host "AVISO: release executando com working tree sujo (AllowDirtyWorktree)." -ForegroundColor Yellow
    Write-Host "AVISO: o artifact continua sendo gerado a partir do HEAD commitado." -ForegroundColor Yellow
    return
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
  if (-not $Execute) {
    Write-Host "Modo dry-run. Upload do artifact nao sera executado."
    return
  }

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
wait_http() {
  url="`$1"
  attempts="`${2:-30}"
  sleep_seconds="`${3:-2}"
  i=1
  while [ "`$i" -le "`$attempts" ]; do
    if curl -fsS "`$url" > /dev/null; then
      return 0
    fi
    sleep "`$sleep_seconds"
    i=`$((i + 1))
  done
  echo "Endpoint nao respondeu em tempo: `$url" >&2
  return 1
}
wait_http http://127.0.0.1:3500/health 30 2
wait_http http://127.0.0.1:3000 45 2
docker compose ps
"@

  if (-not $Execute) {
    Write-Host "Modo dry-run. Comandos que serao executados na VM:"
    Write-Host "--------------------------------------------------"
    Write-Host $remoteScript
    Write-Host "--------------------------------------------------"
    Write-Host "Para executar de fato, rode novamente com -Execute."
    return
  }

  # Normaliza fim de linha para LF antes de enviar ao shell remoto.
  $remoteScript = $remoteScript -replace "`r", ""
  Invoke-Remote -ScriptText $remoteScript
}

if (Test-Path $artifactPath) {
  Remove-Item $artifactPath -Force
}

if ($RunAdm303Smoke) {
  Ensure-RequiredValue -Name "Adm303RequesterEmail" -Value $Adm303RequesterEmail
  Ensure-RequiredValue -Name "Adm303RequesterPassword" -Value $Adm303RequesterPassword
  Ensure-RequiredValue -Name "Adm303ApproverEmail" -Value $Adm303ApproverEmail
  Ensure-RequiredValue -Name "Adm303ApproverPassword" -Value $Adm303ApproverPassword
  Ensure-RequiredValue -Name "Adm303TargetEmail" -Value $Adm303TargetEmail
  Ensure-RequiredValue -Name "Adm303TargetPassword" -Value $Adm303TargetPassword

  $smokeScriptPath = Join-Path $repoRoot ".production\scripts\smoke-adm303-break-glass.ps1"
  if (-not (Test-Path $smokeScriptPath)) {
    throw "Script de smoke ADM-303 nao encontrado: $smokeScriptPath"
  }

  if (-not $Execute) {
    Run-Step -Title "Dry-run do smoke ADM-303 pos-deploy" -Action {
      Write-Host "Smoke sera executado com os parametros abaixo (senhas mascaradas):"
      Write-Host "  BaseUrl: $Adm303BaseUrl"
      Write-Host "  RequesterEmail: $Adm303RequesterEmail"
      Write-Host "  RequesterPassword: $(Mask-SecretValue -Value $Adm303RequesterPassword)"
      Write-Host "  ApproverEmail: $Adm303ApproverEmail"
      Write-Host "  ApproverPassword: $(Mask-SecretValue -Value $Adm303ApproverPassword)"
      Write-Host "  TargetEmail: $Adm303TargetEmail"
      Write-Host "  TargetPassword: $(Mask-SecretValue -Value $Adm303TargetPassword)"
      if ($Adm303SkipTargetAccessCheck) {
        Write-Host "  SkipTargetAccessCheck: true"
      }
    }
  }
  else {
    Run-Step -Title "Executar smoke ADM-303 pos-deploy" -Action {
      $smokeParams = @{
        BaseUrl = $Adm303BaseUrl
        RequesterEmail = $Adm303RequesterEmail
        RequesterPassword = $Adm303RequesterPassword
        ApproverEmail = $Adm303ApproverEmail
        ApproverPassword = $Adm303ApproverPassword
        TargetEmail = $Adm303TargetEmail
        TargetPassword = $Adm303TargetPassword
      }

      if (-not [string]::IsNullOrWhiteSpace($Adm303RequesterMfaCode)) {
        $smokeParams.RequesterMfaCode = $Adm303RequesterMfaCode
      }
      if (-not [string]::IsNullOrWhiteSpace($Adm303ApproverMfaCode)) {
        $smokeParams.ApproverMfaCode = $Adm303ApproverMfaCode
      }
      if (-not [string]::IsNullOrWhiteSpace($Adm303TargetMfaCode)) {
        $smokeParams.TargetMfaCode = $Adm303TargetMfaCode
      }
      if ($Adm303SkipTargetAccessCheck) {
        $smokeParams.SkipTargetAccessCheck = $true
      }

      & $smokeScriptPath @smokeParams
      if ($LASTEXITCODE -ne 0) {
        throw "Smoke ADM-303 pos-deploy falhou."
      }
    }
  }
}

Write-Host ""
Write-Host "Release concluida." -ForegroundColor Green
Write-Host "Proximo passo: purge de cache no Cloudflare (/index.html, /brand/*, /static/*)." -ForegroundColor Yellow
