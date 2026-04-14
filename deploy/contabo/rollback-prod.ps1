param(
  [string]$ProfileName = 'production',
  [string]$ProfilePath,
  [string]$TargetReleaseId,
  [switch]$NoCacheBuild,
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptRoot 'contabo-deploy-common.ps1')

function Write-Step {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-TextValue {
  param([string]$Primary, [string]$Fallback)
  if (-not [string]::IsNullOrWhiteSpace($Primary)) { return $Primary }
  return $Fallback
}

function Has-OptionalProperty {
  param(
    $Object,
    [Parameter(Mandatory = $true)][string]$PropertyName
  )

  if ($null -eq $Object) { return $false }
  if ($Object -is [System.Collections.IDictionary]) {
    return $Object.Contains($PropertyName)
  }

  return $Object.PSObject.Properties.Name -contains $PropertyName
}

function Get-OptionalPropertyValue {
  param(
    $Object,
    [Parameter(Mandatory = $true)][string]$PropertyName,
    [string]$Fallback = ''
  )

  if ($null -eq $Object) { return $Fallback }
  if (Has-OptionalProperty -Object $Object -PropertyName $PropertyName) {
    if ($Object -is [System.Collections.IDictionary]) {
      return [string]$Object[$PropertyName]
    }

    return [string]$Object.$PropertyName
  }
  return $Fallback
}

function Invoke-RemotePreviousRelease {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath
  )

  $stateDir = "$($Vm.RemoteRoot)/.deploy"
  $script = @"
set -euo pipefail
state_dir="`$1"
previous_file="`$state_dir/previous_release.txt"
if [ -f "`$previous_file" ]; then
  cat "`$previous_file"
fi
"@

  $result = Invoke-RemoteBash -Vm $Vm -SshKeyPath $SshKeyPath -ScriptText $script -ScriptArgs @($stateDir) -CaptureOutput
  return $result.Trim()
}

function Set-RemoteReleaseState {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$CurrentRelease,
    [string]$PreviousRelease,
    [Parameter(Mandatory = $true)][string]$StatusTag
  )

  $stateDir = "$($Vm.RemoteRoot)/.deploy"
  $script = @"
set -euo pipefail
state_dir="`$1"
current_release="`$2"
previous_release="`$3"
status_tag="`$4"
mkdir -p "`$state_dir"
printf '%s\n' "`$current_release" > "`$state_dir/current_release.txt"
if [ -n "`$previous_release" ]; then
  printf '%s\n' "`$previous_release" > "`$state_dir/previous_release.txt"
else
  rm -f "`$state_dir/previous_release.txt"
fi
printf '%s|%s|%s\n' "`$(date -Iseconds)" "`$current_release" "`$status_tag" >> "`$state_dir/history.log"
"@

  Invoke-RemoteBash `
    -Vm $Vm `
    -SshKeyPath $SshKeyPath `
    -ScriptText $script `
    -ScriptArgs @($stateDir, $CurrentRelease, (Get-TextValue -Primary $PreviousRelease -Fallback ''), $StatusTag)
}

function Invoke-HostRollback {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [ValidateSet('api', 'app')][string]$Role,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$TargetReleaseId,
    [Parameter(Mandatory = $true)][string]$RuntimeEnvRemoteRelativePath,
    [switch]$NoCacheBuild
  )

  $script = @"
set -euo pipefail
remote_root="`$1"
target_release="`$2"
role="`$3"
env_relative="`$4"
no_cache="`$5"

release_dir="`$remote_root/releases/`$target_release"
runtime_env="`$remote_root/`$env_relative"

if [ ! -d "`$release_dir" ]; then
  echo "Release alvo inexistente: `$release_dir" >&2
  exit 31
fi

if [ ! -f "`$runtime_env" ]; then
  echo "Runtime env nao encontrado: `$runtime_env" >&2
  exit 32
fi

cp "`$runtime_env" "`$release_dir/deploy/contabo/.env.app-vm"

cd "`$release_dir"
compose_file="deploy/contabo/docker-compose.app-vm.yml"
env_file="deploy/contabo/.env.app-vm"
compose() {
  docker compose -f "`$compose_file" --env-file "`$env_file" "`$@"
}

wait_http() {
  url="`$1"
  attempts="`${2:-40}"
  sleep_seconds="`${3:-3}"
  i=1
  while [ "`$i" -le "`$attempts" ]; do
    if curl -fsS "`$url" >/dev/null; then
      return 0
    fi
    sleep "`$sleep_seconds"
    i=`$((i + 1))
  done
  echo "Healthcheck falhou para URL: `$url" >&2
  return 1
}

if [ "`$role" = "api" ]; then
  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache redis backend
  else
    compose build redis backend
  fi
  compose up -d redis backend
  wait_http http://127.0.0.1:3500/health 40 3
else
  app_services="frontend"

  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache `$app_services
  else
    compose build `$app_services
  fi
  compose up -d --no-deps `$app_services
  wait_http http://127.0.0.1:3000/health 50 3
fi

compose ps
"@

  $cacheFlag = if ($NoCacheBuild) { '1' } else { '0' }

  Invoke-RemoteBash `
    -Vm $Vm `
    -SshKeyPath $SshKeyPath `
    -ScriptText $script `
    -ScriptArgs @(
      $Vm.RemoteRoot,
      $TargetReleaseId,
      $Role,
      $RuntimeEnvRemoteRelativePath,
      $cacheFlag
    )
}

$repoRoot = Get-RepositoryRoot -ScriptRoot $scriptRoot
$resolvedProfilePath = Resolve-ProfilePath -ScriptRoot $scriptRoot -ProfilePath $ProfilePath
$profile = Load-ContaboProfile -ProfilePath $resolvedProfilePath -ProfileName $ProfileName

$defaultSshUser = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'SshUser') -Fallback 'root'
$defaultSshPort = if ((Has-OptionalProperty -Object $profile -PropertyName 'SshPort') -and $profile.SshPort) { [int]$profile.SshPort } else { 22 }
$defaultRemoteRoot = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'RemoteRoot') -Fallback '/opt/conect360'
$sshKeyPath = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'SshKeyPath') -Fallback ''

$apiVm = Resolve-ProfileVm -VmData $profile.ApiVm -VmName 'api' -DefaultUser $defaultSshUser -DefaultPort $defaultSshPort -DefaultRemoteRoot $defaultRemoteRoot
$appVm = Resolve-ProfileVm -VmData $profile.AppVm -VmName 'app' -DefaultUser $defaultSshUser -DefaultPort $defaultSshPort -DefaultRemoteRoot $defaultRemoteRoot
$runtimeEnvRemoteRelativePath = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'RuntimeEnvRemoteRelativePath') -Fallback 'shared/.env.app-vm'

Write-Step "Validar pre-requisitos locais"
if ($Execute) {
  Require-Command -Name ssh
}

if (-not [string]::IsNullOrWhiteSpace($sshKeyPath) -and -not (Test-Path $sshKeyPath)) {
  throw "Chave SSH nao encontrada: $sshKeyPath"
}

Write-Host "Profile: $ProfileName"
Write-Host "Execute: $Execute"
Write-Host "TargetReleaseId (global): $(Get-TextValue -Primary $TargetReleaseId -Fallback '<auto>')"

if (-not $Execute) {
  Write-Step "Dry-run"
  Write-Host "Rollback APP e API para release anterior registrada (ou -TargetReleaseId)."
  Write-Host "Use -Execute para aplicar."
  exit 0
}

Write-Step "Coletar releases atuais"
$apiCurrent = Invoke-RemoteCurrentRelease -Vm $apiVm -SshKeyPath $sshKeyPath -DeployStateDir "$($apiVm.RemoteRoot)/.deploy"
$appCurrent = Invoke-RemoteCurrentRelease -Vm $appVm -SshKeyPath $sshKeyPath -DeployStateDir "$($appVm.RemoteRoot)/.deploy"
$apiPrevious = Invoke-RemotePreviousRelease -Vm $apiVm -SshKeyPath $sshKeyPath
$appPrevious = Invoke-RemotePreviousRelease -Vm $appVm -SshKeyPath $sshKeyPath

$apiTarget = Get-TextValue -Primary $TargetReleaseId -Fallback $apiPrevious
$appTarget = Get-TextValue -Primary $TargetReleaseId -Fallback $appPrevious

if ([string]::IsNullOrWhiteSpace($appTarget)) {
  throw "APP VM sem release alvo para rollback (informe -TargetReleaseId ou configure previous_release)."
}
if ([string]::IsNullOrWhiteSpace($apiTarget)) {
  throw "API VM sem release alvo para rollback (informe -TargetReleaseId ou configure previous_release)."
}

Write-Host "APP atual: $(Get-TextValue -Primary $appCurrent -Fallback '<none>') -> alvo: $appTarget"
Write-Host "API atual: $(Get-TextValue -Primary $apiCurrent -Fallback '<none>') -> alvo: $apiTarget"

Write-Step "Rollback APP VM"
Invoke-HostRollback `
  -Vm $appVm `
  -Role 'app' `
  -SshKeyPath $sshKeyPath `
  -TargetReleaseId $appTarget `
  -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
  -NoCacheBuild:$NoCacheBuild
Set-RemoteReleaseState -Vm $appVm -SshKeyPath $sshKeyPath -CurrentRelease $appTarget -PreviousRelease $appCurrent -StatusTag 'ROLLBACK_OK'

Write-Step "Rollback API VM"
Invoke-HostRollback `
  -Vm $apiVm `
  -Role 'api' `
  -SshKeyPath $sshKeyPath `
  -TargetReleaseId $apiTarget `
  -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
  -NoCacheBuild:$NoCacheBuild
Set-RemoteReleaseState -Vm $apiVm -SshKeyPath $sshKeyPath -CurrentRelease $apiTarget -PreviousRelease $apiCurrent -StatusTag 'ROLLBACK_OK'

Write-Host ""
Write-Host "Rollback concluido com sucesso." -ForegroundColor Green
