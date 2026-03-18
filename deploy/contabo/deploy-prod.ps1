param(
  [string]$ProfileName = 'production',
  [string]$ProfilePath,
  [string]$TargetRef,
  [switch]$AllowDirtyWorktree,
  [switch]$UploadRuntimeEnv,
  [switch]$SkipMigrations,
  [switch]$NoCacheBuild,
  [switch]$RunSmoke,
  [switch]$SkipSmoke,
  [switch]$SkipSmokeAuthChecks,
  [string]$SuperAdminEmail,
  [string]$SuperAdminPassword,
  [string]$SuperAdminMfaCode,
  [string]$ExpectedOwnerEmpresaId,
  [switch]$Execute,
  [ValidateSet('run', 'start', 'status', 'wait')][string]$Mode = 'run',
  [string]$OperationId,
  [int]$PollIntervalSeconds = 10,
  [int]$WaitTimeoutMinutes = 120
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptPath = $MyInvocation.MyCommand.Path
$scriptRoot = Split-Path -Parent $scriptPath
$repositoryRoot = (Resolve-Path (Join-Path $scriptRoot '..\..')).Path

function Get-DeployJobDirectory {
  param([Parameter(Mandatory = $true)][string]$RepositoryRoot)

  $jobDir = Join-Path $RepositoryRoot '.production\deploy-jobs'
  New-Item -Path $jobDir -ItemType Directory -Force | Out-Null
  return $jobDir
}

function Resolve-DeployOperationId {
  param(
    [Parameter(Mandatory = $true)][string]$JobsDirectory,
    [string]$OperationId
  )

  if (-not [string]::IsNullOrWhiteSpace($OperationId)) {
    return $OperationId
  }

  $latestMetadata = Get-ChildItem -Path $JobsDirectory -Filter '*.json' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($null -eq $latestMetadata) {
    throw "Nenhuma operacao de deploy encontrada em $JobsDirectory."
  }

  return [System.IO.Path]::GetFileNameWithoutExtension($latestMetadata.Name)
}

function Convert-BoundParametersToTokenList {
  param(
    [Parameter(Mandatory = $true)][hashtable]$BoundParameters,
    [string[]]$ExcludeKeys = @()
  )

  $tokens = @()
  foreach ($entry in $BoundParameters.GetEnumerator()) {
    $key = [string]$entry.Key
    if ($ExcludeKeys -contains $key) { continue }

    $value = $entry.Value
    if ($value -is [switch]) {
      if ([bool]$value) {
        $tokens += "-$key"
      }
      continue
    }

    if ($null -eq $value) { continue }

    $text = [string]$value
    if ([string]::IsNullOrWhiteSpace($text)) { continue }
    $tokens += "-$key"
    $tokens += $text
  }

  return ,$tokens
}

function Start-DetachedDeploy {
  param(
    [Parameter(Mandatory = $true)][string]$ScriptPath,
    [Parameter(Mandatory = $true)][string]$JobsDirectory,
    [Parameter(Mandatory = $true)][hashtable]$BoundParameters,
    [string]$OperationId
  )

  $resolvedOperationId = if (-not [string]::IsNullOrWhiteSpace($OperationId)) {
    $OperationId
  }
  else {
    "deploy-{0}-{1}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), (Get-Random -Minimum 1000 -Maximum 9999)
  }

  $stdoutPath = Join-Path $JobsDirectory "$resolvedOperationId.stdout.log"
  $stderrPath = Join-Path $JobsDirectory "$resolvedOperationId.stderr.log"
  $exitCodePath = Join-Path $JobsDirectory "$resolvedOperationId.exitcode"
  $runnerPath = Join-Path $JobsDirectory "$resolvedOperationId.runner.ps1"
  $metadataPath = Join-Path $JobsDirectory "$resolvedOperationId.json"

  foreach ($path in @($stdoutPath, $stderrPath, $exitCodePath, $runnerPath, $metadataPath)) {
    if (Test-Path $path) { Remove-Item $path -Force }
  }

  $forwardParams = @{}
  foreach ($entry in $BoundParameters.GetEnumerator()) {
    $key = [string]$entry.Key
    if (@('Mode', 'OperationId', 'PollIntervalSeconds', 'WaitTimeoutMinutes') -contains $key) {
      continue
    }

    $value = $entry.Value
    if ($value -is [switch]) {
      if ([bool]$value) {
        $forwardParams[$key] = $true
      }
      continue
    }

    if ($null -eq $value) { continue }
    if ($value -is [string] -and [string]::IsNullOrWhiteSpace($value)) { continue }
    $forwardParams[$key] = $value
  }
  $forwardParams['Mode'] = 'run'

  $escapedScriptPath = $ScriptPath -replace "'", "''"
  $escapedExitCodePath = $exitCodePath -replace "'", "''"
  $paramEntries = @()
  foreach ($paramKey in ($forwardParams.Keys | Sort-Object)) {
    $value = $forwardParams[$paramKey]
    $keyLiteral = $paramKey -replace "'", "''"

    $valueLiteral = if ($value -is [bool]) {
      if ($value) { '$true' } else { '$false' }
    }
    elseif ($value -is [int] -or $value -is [long] -or $value -is [double] -or $value -is [decimal]) {
      [string]$value
    }
    else {
      "'{0}'" -f (([string]$value) -replace "'", "''")
    }

    $paramEntries += "  '$keyLiteral' = $valueLiteral"
  }
  $invokeParamsLiteral = $paramEntries -join "`r`n"

  $runnerScript = @"
`$ErrorActionPreference = 'Stop'
`$invokeParams = @{
$invokeParamsLiteral
}
try {
  & '$escapedScriptPath' @invokeParams
  if (`$LASTEXITCODE -is [int]) {
    `$code = [int]`$LASTEXITCODE
  }
  else {
    `$code = 0
  }
}
catch {
  Write-Error (`$_.Exception.Message)
  if (`$_.ScriptStackTrace) {
    Write-Error (`$_.ScriptStackTrace)
  }
  `$code = 1
}
Set-Content -Path '$escapedExitCodePath' -Value `$code -Encoding ASCII -NoNewline
exit `$code
"@

  Set-Content -Path $runnerPath -Value $runnerScript -Encoding UTF8

  $process = Start-Process `
    -FilePath 'powershell' `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $runnerPath) `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru

  $metadata = [ordered]@{
    operationId = $resolvedOperationId
    pid = $process.Id
    startedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    scriptPath = $ScriptPath
    runnerPath = $runnerPath
    stdoutPath = $stdoutPath
    stderrPath = $stderrPath
    exitCodePath = $exitCodePath
    metadataPath = $metadataPath
    mode = 'run'
    invokeParameters = $forwardParams
  }

  $metadata | ConvertTo-Json -Depth 8 | Set-Content -Path $metadataPath -Encoding UTF8
  return [pscustomobject]$metadata
}

function Get-DetachedDeploySnapshot {
  param(
    [Parameter(Mandatory = $true)][string]$JobsDirectory,
    [string]$OperationId
  )

  $resolvedOperationId = Resolve-DeployOperationId -JobsDirectory $JobsDirectory -OperationId $OperationId
  $metadataPath = Join-Path $JobsDirectory "$resolvedOperationId.json"

  if (-not (Test-Path $metadataPath)) {
    throw "Metadata da operacao nao encontrada: $metadataPath"
  }

  $metadata = Get-Content -Path $metadataPath -Raw | ConvertFrom-Json
  $processId = [int]$metadata.pid

  $isRunning = $false
  try {
    Get-Process -Id $processId -ErrorAction Stop | Out-Null
    $isRunning = $true
  }
  catch {
    $isRunning = $false
  }

  $exitCode = $null
  if (Test-Path $metadata.exitCodePath) {
    $rawExitCode = (Get-Content -Path $metadata.exitCodePath -Raw).Trim()
    $parsedExitCode = 0
    if ([int]::TryParse($rawExitCode, [ref]$parsedExitCode)) {
      $exitCode = $parsedExitCode
    }
  }

  $status = if ($null -ne $exitCode) {
    if ($exitCode -eq 0) { 'SUCCESS' } else { 'FAILED' }
  }
  elseif ($isRunning) {
    'RUNNING'
  }
  else {
    'UNKNOWN'
  }

  return [pscustomobject]@{
    operationId = $resolvedOperationId
    status = $status
    pid = $processId
    isRunning = $isRunning
    exitCode = $exitCode
    startedAtUtc = [string]$metadata.startedAtUtc
    stdoutPath = [string]$metadata.stdoutPath
    stderrPath = [string]$metadata.stderrPath
    exitCodePath = [string]$metadata.exitCodePath
    metadataPath = $metadataPath
  }
}

function Show-DetachedDeploySnapshot {
  param(
    [Parameter(Mandatory = $true)]$Snapshot,
    [int]$TailLines = 25
  )

  Write-Host "Operacao: $($Snapshot.operationId)"
  Write-Host "Status:   $($Snapshot.status)"
  Write-Host "PID:      $($Snapshot.pid)"
  Write-Host "Inicio:   $($Snapshot.startedAtUtc)"
  Write-Host "ExitCode: $(if ($null -eq $Snapshot.exitCode) { '<pending>' } else { $Snapshot.exitCode })"
  Write-Host "Stdout:   $($Snapshot.stdoutPath)"
  Write-Host "Stderr:   $($Snapshot.stderrPath)"

  if (Test-Path $Snapshot.stdoutPath) {
    $stdoutLines = @(Get-Content -Path $Snapshot.stdoutPath -Tail $TailLines)
    if ($stdoutLines.Count -gt 0) {
      Write-Host ""
      Write-Host "---- stdout (ultimas $TailLines linhas) ----" -ForegroundColor DarkCyan
      $stdoutLines | ForEach-Object { Write-Host $_ }
    }
  }

  if (Test-Path $Snapshot.stderrPath) {
    $stderrLines = @(Get-Content -Path $Snapshot.stderrPath -Tail $TailLines)
    if ($stderrLines.Count -gt 0) {
      Write-Host ""
      Write-Host "---- stderr (ultimas $TailLines linhas) ----" -ForegroundColor Yellow
      $stderrLines | ForEach-Object { Write-Host $_ }
    }
  }
}

function Wait-DetachedDeploy {
  param(
    [Parameter(Mandatory = $true)][string]$JobsDirectory,
    [string]$OperationId,
    [int]$PollIntervalSeconds = 10,
    [int]$WaitTimeoutMinutes = 120
  )

  $timeoutAt = (Get-Date).AddMinutes([Math]::Max(1, $WaitTimeoutMinutes))

  while ($true) {
    $snapshot = Get-DetachedDeploySnapshot -JobsDirectory $JobsDirectory -OperationId $OperationId
    $nowLabel = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$nowLabel] status=$($snapshot.status) pid=$($snapshot.pid)"

    if ($snapshot.status -ne 'RUNNING') {
      Show-DetachedDeploySnapshot -Snapshot $snapshot -TailLines 40
      if ($snapshot.status -eq 'SUCCESS') {
        return
      }

      throw "Operacao $($snapshot.operationId) finalizou com status $($snapshot.status)."
    }

    if ((Get-Date) -ge $timeoutAt) {
      throw "Timeout aguardando operacao $($snapshot.operationId). Use -Mode status para acompanhar."
    }

    Start-Sleep -Seconds ([Math]::Max(2, $PollIntervalSeconds))
  }
}

if ($Mode -ne 'run') {
  $jobsDirectory = Get-DeployJobDirectory -RepositoryRoot $repositoryRoot

  switch ($Mode) {
    'start' {
      $metadata = Start-DetachedDeploy `
        -ScriptPath $scriptPath `
        -JobsDirectory $jobsDirectory `
        -BoundParameters $PSBoundParameters `
        -OperationId $OperationId

      Write-Host ""
      Write-Host "Deploy iniciado em background." -ForegroundColor Green
      Write-Host "OperationId: $($metadata.operationId)"
      Write-Host "PID:         $($metadata.pid)"
      Write-Host "Stdout:      $($metadata.stdoutPath)"
      Write-Host "Stderr:      $($metadata.stderrPath)"
      Write-Host ""
      Write-Host "Acompanhar status:"
      Write-Host "  deploy\\contabo\\deploy-prod.bat status $($metadata.operationId)"
      Write-Host "Aguardar termino:"
      Write-Host "  deploy\\contabo\\deploy-prod.bat wait $($metadata.operationId)"
      Write-Output "DEPLOY_OPERATION_ID=$($metadata.operationId)"
      return
    }
    'status' {
      $snapshot = Get-DetachedDeploySnapshot -JobsDirectory $jobsDirectory -OperationId $OperationId
      Show-DetachedDeploySnapshot -Snapshot $snapshot -TailLines 40
      if ($snapshot.status -eq 'FAILED') {
        exit 1
      }
      return
    }
    'wait' {
      Wait-DetachedDeploy `
        -JobsDirectory $jobsDirectory `
        -OperationId $OperationId `
        -PollIntervalSeconds $PollIntervalSeconds `
        -WaitTimeoutMinutes $WaitTimeoutMinutes
      return
    }
  }
}

. (Join-Path $scriptRoot 'contabo-deploy-common.ps1')

function Write-Step {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-TextValue {
  param(
    [string]$Primary,
    [string]$Fallback
  )

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

function Invoke-HostDeploy {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [ValidateSet('api', 'app')][string]$Role,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$RemoteArtifactPath,
    [Parameter(Mandatory = $true)][string]$ReleaseId,
    [Parameter(Mandatory = $true)][string]$RuntimeEnvRemoteRelativePath,
    [switch]$NoCacheBuild,
    [switch]$RunMigrations
  )

  $script = @"
set -euo pipefail
remote_root="`$1"
artifact_path="`$2"
release_id="`$3"
role="`$4"
env_relative="`$5"
no_cache="`$6"
run_migrations="`$7"

release_dir="`$remote_root/releases/`$release_id"
state_dir="`$remote_root/.deploy"
runtime_env="`$remote_root/`$env_relative"

mkdir -p "`$remote_root/releases" "`$state_dir"
rm -rf "`$release_dir"
mkdir -p "`$release_dir"

python3 - "`$artifact_path" "`$release_dir" <<'PY'
import sys, zipfile
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
PY

if [ ! -f "`$runtime_env" ]; then
  echo "Runtime env nao encontrado: `$runtime_env" >&2
  exit 28
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
  target_container="`${4:-}"
  i=1
  while [ "`$i" -le "`$attempts" ]; do
    if curl -fsS --connect-timeout 2 --max-time 5 "`$url" >/dev/null 2>&1; then
      return 0
    fi

    if [ -n "`$target_container" ]; then
      container_health="`$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "`$target_container" 2>/dev/null || true)"
      if [ "`$container_health" = "healthy" ]; then
        echo "Health HTTP ainda oscilando, mas container '`$target_container' esta healthy." >&2
        return 0
      fi
    fi

    sleep "`$sleep_seconds"
    i=`$((i + 1))
  done
  echo "Healthcheck falhou para URL: `$url (attempts=`$attempts, sleep=`${sleep_seconds}s)" >&2
  if [ -n "`$target_container" ]; then
    echo "Status do container `$target_container:" >&2
    docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "`$target_container" 2>/dev/null >&2 || true
    echo "Ultimos logs do container `$target_container:" >&2
    docker logs --tail 120 "`$target_container" >&2 || true
  fi
  return 1
}

if [ "`$role" = "api" ]; then
  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache redis backend
  else
    compose build redis backend
  fi
  compose up -d redis backend
  if [ "`$run_migrations" = "1" ]; then
    compose run --rm backend npm run migration:run
  fi
  wait_http http://127.0.0.1:3500/health 120 3 conect360-backend
else
  app_services="frontend"
  if [ -d "guardian-web" ] && [ -f "guardian-web/Dockerfile" ]; then
    app_services="frontend guardian-web"
  else
    echo "guardian-web ausente no release; mantendo container atual sem rebuild/restart." >&2
  fi

  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache `$app_services
  else
    compose build `$app_services
  fi
  compose up -d --no-deps `$app_services
  wait_http http://127.0.0.1:3000/health 80 3
  case " `$app_services " in
    *" guardian-web "*) wait_http http://127.0.0.1:3020/ 80 3 ;;
  esac
fi

ls -1dt "`$remote_root/releases"/* 2>/dev/null | tail -n +6 | xargs -r rm -rf
compose ps
"@

  $cacheFlag = if ($NoCacheBuild) { '1' } else { '0' }
  $migrationFlag = if ($RunMigrations) { '1' } else { '0' }

  Invoke-RemoteBash `
    -Vm $Vm `
    -SshKeyPath $SshKeyPath `
    -ScriptText $script `
    -ScriptArgs @(
      $Vm.RemoteRoot,
      $RemoteArtifactPath,
      $ReleaseId,
      $Role,
      $RuntimeEnvRemoteRelativePath,
      $cacheFlag,
      $migrationFlag
    )
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
  target_container="`${4:-}"
  i=1
  while [ "`$i" -le "`$attempts" ]; do
    if curl -fsS --connect-timeout 2 --max-time 5 "`$url" >/dev/null 2>&1; then
      return 0
    fi

    if [ -n "`$target_container" ]; then
      container_health="`$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "`$target_container" 2>/dev/null || true)"
      if [ "`$container_health" = "healthy" ]; then
        echo "Health HTTP ainda oscilando, mas container '`$target_container' esta healthy." >&2
        return 0
      fi
    fi

    sleep "`$sleep_seconds"
    i=`$((i + 1))
  done
  echo "Healthcheck falhou para URL: `$url (attempts=`$attempts, sleep=`${sleep_seconds}s)" >&2
  if [ -n "`$target_container" ]; then
    echo "Status do container `$target_container:" >&2
    docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "`$target_container" 2>/dev/null >&2 || true
    echo "Ultimos logs do container `$target_container:" >&2
    docker logs --tail 120 "`$target_container" >&2 || true
  fi
  return 1
}

if [ "`$role" = "api" ]; then
  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache redis backend
  else
    compose build redis backend
  fi
  compose up -d redis backend
  wait_http http://127.0.0.1:3500/health 120 3 conect360-backend
else
  app_services="frontend"
  if [ -d "guardian-web" ] && [ -f "guardian-web/Dockerfile" ]; then
    app_services="frontend guardian-web"
  else
    echo "guardian-web ausente no release; mantendo container atual sem rebuild/restart." >&2
  fi

  if [ "`$no_cache" = "1" ]; then
    compose build --no-cache `$app_services
  else
    compose build `$app_services
  fi
  compose up -d --no-deps `$app_services
  wait_http http://127.0.0.1:3000/health 80 3
  case " `$app_services " in
    *" guardian-web "*) wait_http http://127.0.0.1:3020/ 80 3 ;;
  esac
fi
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

$runtimeEnvLocalPathRaw = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'RuntimeEnvLocalPath') -Fallback 'deploy/contabo/.env.app-vm'
$runtimeEnvLocalPath = if ([System.IO.Path]::IsPathRooted($runtimeEnvLocalPathRaw)) {
  $runtimeEnvLocalPathRaw
}
else {
  Join-Path $repoRoot $runtimeEnvLocalPathRaw
}
$runtimeEnvRemoteRelativePath = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $profile -PropertyName 'RuntimeEnvRemoteRelativePath') -Fallback 'shared/.env.app-vm'

$resolvedTargetRef = Get-TextValue -Primary $TargetRef -Fallback (Get-OptionalPropertyValue -Object $profile -PropertyName 'GitRef')
if ([string]::IsNullOrWhiteSpace($resolvedTargetRef)) {
  $resolvedTargetRef = 'HEAD'
}

$urlProfile = if (Has-OptionalProperty -Object $profile -PropertyName 'Urls') { $profile.Urls } else { $null }
$apiBaseUrl = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'Api') -Fallback 'https://api.conect360.com'
$appBaseUrl = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'App') -Fallback 'https://conect360.com'
$guardianBaseUrl = Get-TextValue -Primary (Get-OptionalPropertyValue -Object $urlProfile -PropertyName 'Guardian') -Fallback 'https://guardian.conect360.com'

$smokeEnabledByProfile = $false
$smokeProfile = if (Has-OptionalProperty -Object $profile -PropertyName 'Smoke') { $profile.Smoke } else { $null }
if ($null -ne $smokeProfile) {
  if (Has-OptionalProperty -Object $smokeProfile -PropertyName 'Enabled') {
    $smokeEnabledByProfile = [bool]$smokeProfile.Enabled
  }
}
$shouldRunSmoke = (-not $SkipSmoke) -and ($RunSmoke -or $smokeEnabledByProfile)

if ([string]::IsNullOrWhiteSpace($SuperAdminEmail) -and $null -ne $smokeProfile) {
  $SuperAdminEmail = [string]$smokeProfile.SuperAdminEmail
}
if ([string]::IsNullOrWhiteSpace($SuperAdminPassword) -and $null -ne $smokeProfile) {
  $SuperAdminPassword = [string]$smokeProfile.SuperAdminPassword
}
if ([string]::IsNullOrWhiteSpace($SuperAdminMfaCode) -and $null -ne $smokeProfile) {
  $SuperAdminMfaCode = [string]$smokeProfile.SuperAdminMfaCode
}
if ([string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId) -and $null -ne $smokeProfile) {
  $ExpectedOwnerEmpresaId = [string]$smokeProfile.ExpectedOwnerEmpresaId
}

Write-Step "Validar pre-requisitos locais"
Require-Command -Name git
if ($Execute) {
  Require-Command -Name ssh
  Require-Command -Name scp
}

if (-not [string]::IsNullOrWhiteSpace($sshKeyPath) -and -not (Test-Path $sshKeyPath)) {
  throw "Chave SSH nao encontrada: $sshKeyPath"
}

$worktreeStatus = git -C $repoRoot status --porcelain
if ($worktreeStatus) {
  if (-not $AllowDirtyWorktree) {
    throw "Working tree com alteracoes locais. Use -AllowDirtyWorktree para ignorar esta validacao."
  }

  Write-Host "AVISO: executando deploy com working tree sujo (artifact sera gerado a partir do commit $resolvedTargetRef)." -ForegroundColor Yellow
}
else {
  Write-Host "OK - working tree limpo"
}

$resolvedCommit = (git -C $repoRoot rev-parse $resolvedTargetRef).Trim()
if ([string]::IsNullOrWhiteSpace($resolvedCommit)) {
  throw "Nao foi possivel resolver TargetRef: $resolvedTargetRef"
}
$shortSha = (git -C $repoRoot rev-parse --short $resolvedCommit).Trim()
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$releaseId = "rel-$timestamp-$shortSha"

$artifactDir = Join-Path $repoRoot '.production\artifacts'
$artifactPath = Join-Path $artifactDir "contabo-$releaseId.zip"
$remoteArtifactPath = "/tmp/conect360-release-$releaseId.zip"
$remoteEnvTempPath = "/tmp/conect360-env-$releaseId"

Write-Step "Preparar artifact git archive"
New-Item -Path $artifactDir -ItemType Directory -Force | Out-Null
if (Test-Path $artifactPath) {
  Remove-Item $artifactPath -Force
}
git -C $repoRoot archive --format=zip --output $artifactPath $resolvedCommit
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $artifactPath) -or ((Get-Item $artifactPath).Length -le 0)) {
  throw "Falha ao gerar artifact do commit $resolvedCommit. Verifique o TargetRef informado."
}

Write-Host "Profile: $ProfileName"
Write-Host "Commit:  $resolvedCommit"
Write-Host "Release: $releaseId"
Write-Host "API VM:  $($apiVm.User)@$($apiVm.Host):$($apiVm.Port) root=$($apiVm.RemoteRoot)"
Write-Host "APP VM:  $($appVm.User)@$($appVm.Host):$($appVm.Port) root=$($appVm.RemoteRoot)"
Write-Host "Execute: $Execute"

$apiPreviousRelease = ''
$appPreviousRelease = ''
$apiDeployed = $false
$appDeployed = $false

try {
  if (-not $Execute) {
    Write-Step "Dry-run"
    Write-Host "Upload artifact para as duas VMs: $remoteArtifactPath"
    if ($UploadRuntimeEnv) {
      Write-Host "Upload de runtime env: $runtimeEnvLocalPath -> <remote>/$runtimeEnvRemoteRelativePath"
    }
    else {
      Write-Host "Runtime env NAO sera enviado (esperado no host em <remote>/$runtimeEnvRemoteRelativePath)"
    }
    Write-Host "Deploy API: redis + backend" 
    Write-Host "Deploy APP: frontend + guardian-web"
    if (-not $SkipMigrations) {
      Write-Host "Migration: executa em API VM"
    }
    else {
      Write-Host "Migration: ignorada por -SkipMigrations"
    }
  }
  else {
    Write-Step "Coletar estado atual das VMs"
    $apiPreviousRelease = Invoke-RemoteCurrentRelease -Vm $apiVm -SshKeyPath $sshKeyPath -DeployStateDir "$($apiVm.RemoteRoot)/.deploy"
    $appPreviousRelease = Invoke-RemoteCurrentRelease -Vm $appVm -SshKeyPath $sshKeyPath -DeployStateDir "$($appVm.RemoteRoot)/.deploy"
    Write-Host "API release atual: $(Get-TextValue -Primary $apiPreviousRelease -Fallback '<none>')"
    Write-Host "APP release atual: $(Get-TextValue -Primary $appPreviousRelease -Fallback '<none>')"

    Write-Step "Upload artifact para API VM"
    Copy-ToRemote -Vm $apiVm -SshKeyPath $sshKeyPath -LocalPath $artifactPath -RemotePath $remoteArtifactPath
    Write-Step "Upload artifact para APP VM"
    Copy-ToRemote -Vm $appVm -SshKeyPath $sshKeyPath -LocalPath $artifactPath -RemotePath $remoteArtifactPath

    if ($UploadRuntimeEnv) {
      Write-Step "Upload runtime env para as VMs"
      Copy-ToRemote -Vm $apiVm -SshKeyPath $sshKeyPath -LocalPath $runtimeEnvLocalPath -RemotePath $remoteEnvTempPath
      Copy-ToRemote -Vm $appVm -SshKeyPath $sshKeyPath -LocalPath $runtimeEnvLocalPath -RemotePath $remoteEnvTempPath

      $installEnvScript = @"
set -euo pipefail
remote_root="`$1"
env_relative="`$2"
tmp_env="`$3"
target_env="`$remote_root/`$env_relative"
mkdir -p "`$(dirname "`$target_env")"
install -m 600 "`$tmp_env" "`$target_env"
rm -f "`$tmp_env"
"@

      Invoke-RemoteBash -Vm $apiVm -SshKeyPath $sshKeyPath -ScriptText $installEnvScript -ScriptArgs @($apiVm.RemoteRoot, $runtimeEnvRemoteRelativePath, $remoteEnvTempPath)
      Invoke-RemoteBash -Vm $appVm -SshKeyPath $sshKeyPath -ScriptText $installEnvScript -ScriptArgs @($appVm.RemoteRoot, $runtimeEnvRemoteRelativePath, $remoteEnvTempPath)
    }

    Write-Step "Deploy API VM"
    Invoke-HostDeploy `
      -Vm $apiVm `
      -Role 'api' `
      -SshKeyPath $sshKeyPath `
      -RemoteArtifactPath $remoteArtifactPath `
      -ReleaseId $releaseId `
      -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
      -NoCacheBuild:$NoCacheBuild `
      -RunMigrations:($SkipMigrations -eq $false)
    Set-RemoteReleaseState -Vm $apiVm -SshKeyPath $sshKeyPath -CurrentRelease $releaseId -PreviousRelease $apiPreviousRelease -StatusTag 'DEPLOY_OK'
    $apiDeployed = $true

    Write-Step "Deploy APP VM"
    Invoke-HostDeploy `
      -Vm $appVm `
      -Role 'app' `
      -SshKeyPath $sshKeyPath `
      -RemoteArtifactPath $remoteArtifactPath `
      -ReleaseId $releaseId `
      -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
      -NoCacheBuild:$NoCacheBuild `
      -RunMigrations:$false
    Set-RemoteReleaseState -Vm $appVm -SshKeyPath $sshKeyPath -CurrentRelease $releaseId -PreviousRelease $appPreviousRelease -StatusTag 'DEPLOY_OK'
    $appDeployed = $true

    Write-Step "Limpar artifact remoto"
    $cleanupScript = @"
set -euo pipefail
rm -f "`$1"
"@
    Invoke-RemoteBash -Vm $apiVm -SshKeyPath $sshKeyPath -ScriptText $cleanupScript -ScriptArgs @($remoteArtifactPath)
    Invoke-RemoteBash -Vm $appVm -SshKeyPath $sshKeyPath -ScriptText $cleanupScript -ScriptArgs @($remoteArtifactPath)
  }

  if ($shouldRunSmoke) {
    Write-Step "Executar smoke pos-deploy"
    $smokeScript = Join-Path $repoRoot '.production\scripts\smoke-production-owner-admin.ps1'
    if (-not (Test-Path $smokeScript)) {
      throw "Script de smoke nao encontrado: $smokeScript"
    }

    if (-not $Execute) {
      Write-Host "Dry-run: smoke seria executado com Api=$apiBaseUrl App=$appBaseUrl Guardian=$guardianBaseUrl"
    }
    else {
      $smokeParams = @{
        ApiBaseUrl = $apiBaseUrl
        AppBaseUrl = $appBaseUrl
        GuardianBaseUrl = $guardianBaseUrl
      }

      if ($SkipSmokeAuthChecks) {
        $smokeParams.SkipAuthChecks = $true
      }
      else {
        if ([string]::IsNullOrWhiteSpace($SuperAdminEmail) -or [string]::IsNullOrWhiteSpace($SuperAdminPassword)) {
          throw "Para smoke autenticado informe -SuperAdminEmail e -SuperAdminPassword (ou configure no profile)."
        }

        $smokeParams.SuperAdminEmail = $SuperAdminEmail
        $smokeParams.SuperAdminPassword = $SuperAdminPassword
        if (-not [string]::IsNullOrWhiteSpace($SuperAdminMfaCode)) {
          $smokeParams.SuperAdminMfaCode = $SuperAdminMfaCode
        }
        if (-not [string]::IsNullOrWhiteSpace($ExpectedOwnerEmpresaId)) {
          $smokeParams.ExpectedOwnerEmpresaId = $ExpectedOwnerEmpresaId
        }
      }

      & $smokeScript @smokeParams
      if ($LASTEXITCODE -ne 0) {
        throw "Smoke pos-deploy falhou."
      }
    }
  }
}
catch {
  $deployError = $_
  Write-Host ""
  Write-Host "ERRO: $($deployError.Exception.Message)" -ForegroundColor Red

  if ($Execute) {
    Write-Step "Rollback automatico (melhor esforco)"
    try {
      if (-not [string]::IsNullOrWhiteSpace($appPreviousRelease)) {
        Write-Host "Rollback APP para $appPreviousRelease"
        Invoke-HostRollback `
          -Vm $appVm `
          -Role 'app' `
          -SshKeyPath $sshKeyPath `
          -TargetReleaseId $appPreviousRelease `
          -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
          -NoCacheBuild:$NoCacheBuild
        Set-RemoteReleaseState -Vm $appVm -SshKeyPath $sshKeyPath -CurrentRelease $appPreviousRelease -PreviousRelease $releaseId -StatusTag 'ROLLBACK_OK'
      }
      else {
        Write-Host "APP sem release anterior registrada. Rollback APP ignorado." -ForegroundColor Yellow
      }
    }
    catch {
      Write-Host "Falha no rollback APP: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    try {
      if (-not [string]::IsNullOrWhiteSpace($apiPreviousRelease)) {
        Write-Host "Rollback API para $apiPreviousRelease"
        Invoke-HostRollback `
          -Vm $apiVm `
          -Role 'api' `
          -SshKeyPath $sshKeyPath `
          -TargetReleaseId $apiPreviousRelease `
          -RuntimeEnvRemoteRelativePath $runtimeEnvRemoteRelativePath `
          -NoCacheBuild:$NoCacheBuild
        Set-RemoteReleaseState -Vm $apiVm -SshKeyPath $sshKeyPath -CurrentRelease $apiPreviousRelease -PreviousRelease $releaseId -StatusTag 'ROLLBACK_OK'
      }
      else {
        Write-Host "API sem release anterior registrada. Rollback API ignorado." -ForegroundColor Yellow
      }
    }
    catch {
      Write-Host "Falha no rollback API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }

  throw
}
finally {
  if (Test-Path $artifactPath) {
    Remove-Item $artifactPath -Force
  }
}

Write-Host ""
if ($Execute) {
  Write-Host "Deploy concluido com sucesso." -ForegroundColor Green
}
else {
  Write-Host "Dry-run concluido. Use -Execute para aplicar." -ForegroundColor Yellow
}
