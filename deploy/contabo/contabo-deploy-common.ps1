Set-StrictMode -Version Latest

function Require-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  $command = Get-Command -Name $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Comando obrigatorio nao encontrado: $Name"
  }
}

function Get-RepositoryRoot {
  param([Parameter(Mandatory = $true)][string]$ScriptRoot)

  return (Resolve-Path (Join-Path $ScriptRoot '..\..')).Path
}

function Resolve-ProfilePath {
  param(
    [Parameter(Mandatory = $true)][string]$ScriptRoot,
    [string]$ProfilePath
  )

  if (-not [string]::IsNullOrWhiteSpace($ProfilePath)) {
    if ([System.IO.Path]::IsPathRooted($ProfilePath)) {
      return $ProfilePath
    }

    return (Join-Path $ScriptRoot $ProfilePath)
  }

  return (Join-Path $ScriptRoot 'deploy-profile.local.psd1')
}

function Load-ContaboProfile {
  param(
    [Parameter(Mandatory = $true)][string]$ProfilePath,
    [string]$ProfileName = 'production'
  )

  if (-not (Test-Path $ProfilePath)) {
    throw "Perfil nao encontrado: $ProfilePath"
  }

  $raw = Import-PowerShellDataFile -Path $ProfilePath
  if (-not $raw.ContainsKey('Profiles')) {
    throw "Arquivo de perfil invalido: chave 'Profiles' ausente em $ProfilePath"
  }

  $profiles = $raw.Profiles
  if (-not $profiles.ContainsKey($ProfileName)) {
    $available = @($profiles.Keys | ForEach-Object { [string]$_ }) -join ', '
    throw "Perfil '$ProfileName' nao encontrado em $ProfilePath. Disponiveis: $available"
  }

  return $profiles[$ProfileName]
}

function Resolve-ProfileVm {
  param(
    [Parameter(Mandatory = $true)]$VmData,
    [Parameter(Mandatory = $true)][string]$VmName,
    [string]$DefaultUser,
    [int]$DefaultPort,
    [string]$DefaultRemoteRoot
  )

  if ($null -eq $VmData) {
    throw "Configuracao da VM '$VmName' ausente no perfil."
  }

  $vmHost = [string]$VmData.Host
  if ([string]::IsNullOrWhiteSpace($vmHost)) {
    throw "Host da VM '$VmName' nao informado no perfil."
  }

  $user = if (-not [string]::IsNullOrWhiteSpace([string]$VmData.User)) { [string]$VmData.User } else { $DefaultUser }
  if ([string]::IsNullOrWhiteSpace($user)) {
    $user = 'root'
  }

  $hasPort = if ($VmData -is [System.Collections.IDictionary]) {
    $VmData.Contains('Port')
  }
  else {
    $VmData.PSObject.Properties.Name -contains 'Port'
  }

  $port = if ($hasPort -and $VmData.Port) { [int]$VmData.Port } else { $DefaultPort }
  if ($port -le 0) {
    $port = 22
  }

  $remoteRoot = if (-not [string]::IsNullOrWhiteSpace([string]$VmData.RemoteRoot)) { [string]$VmData.RemoteRoot } else { $DefaultRemoteRoot }
  if ([string]::IsNullOrWhiteSpace($remoteRoot)) {
    $remoteRoot = '/opt/conect360'
  }

  return [pscustomobject]@{
    Name = $VmName
    Host = $vmHost
    User = $user
    Port = $port
    RemoteRoot = $remoteRoot
  }
}

function Get-SshArgumentList {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath
  )

  $args = @(
    '-p', [string]$Vm.Port,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    '-o', 'LogLevel=ERROR',
    '-o', 'ConnectTimeout=15'
  )

  if (-not [string]::IsNullOrWhiteSpace($SshKeyPath)) {
    $args += @('-i', $SshKeyPath)
  }

  return $args
}

function Get-ScpArgumentList {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath
  )

  $args = @(
    '-P', [string]$Vm.Port,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    '-o', 'LogLevel=ERROR',
    '-o', 'ConnectTimeout=15'
  )

  if (-not [string]::IsNullOrWhiteSpace($SshKeyPath)) {
    $args += @('-i', $SshKeyPath)
  }

  return $args
}

function Quote-BashArgument {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

  return '"' + ($Value -replace '"', '\"') + '"'
}

function Invoke-RemoteBash {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$ScriptText,
    [string[]]$ScriptArgs = @(),
    [switch]$CaptureOutput
  )

  $sshArgs = Get-SshArgumentList -Vm $Vm -SshKeyPath $SshKeyPath
  $login = "$($Vm.User)@$($Vm.Host)"

  $quotedArgs = @()
  foreach ($arg in $ScriptArgs) {
    $quotedArgs += (Quote-BashArgument -Value ([string]$arg))
  }

  $remoteCommand = if ($quotedArgs.Count -gt 0) {
    "bash -s -- $($quotedArgs -join ' ')"
  }
  else {
    'bash -s'
  }

  $normalizedScript = $ScriptText -replace "`r", ''

  if ($CaptureOutput) {
    $output = $normalizedScript | & ssh @sshArgs $login $remoteCommand 2>&1
    if ($LASTEXITCODE -ne 0) {
      $text = ($output | Out-String).Trim()
      throw "Falha em comando remoto na VM '$($Vm.Name)': $text"
    }

    return ($output | Out-String).Trim()
  }

  $normalizedScript | & ssh @sshArgs $login $remoteCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Falha em comando remoto na VM '$($Vm.Name)'."
  }
}

function Copy-ToRemote {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$LocalPath,
    [Parameter(Mandatory = $true)][string]$RemotePath
  )

  if (-not (Test-Path $LocalPath)) {
    throw "Arquivo local nao encontrado para upload: $LocalPath"
  }

  $scpArgs = Get-ScpArgumentList -Vm $Vm -SshKeyPath $SshKeyPath
  $target = "$($Vm.User)@$($Vm.Host):$RemotePath"

  & scp @scpArgs $LocalPath $target
  if ($LASTEXITCODE -ne 0) {
    throw "Falha no upload para VM '$($Vm.Name)': $RemotePath"
  }
}

function Invoke-RemoteCurrentRelease {
  param(
    [Parameter(Mandatory = $true)]$Vm,
    [string]$SshKeyPath,
    [Parameter(Mandatory = $true)][string]$DeployStateDir
  )

  $script = @"
set -euo pipefail
state_dir="`$1"
current_file="`$state_dir/current_release.txt"
if [ -f "`$current_file" ]; then
  cat "`$current_file"
fi
"@

  $result = Invoke-RemoteBash -Vm $Vm -SshKeyPath $SshKeyPath -ScriptText $script -ScriptArgs @($DeployStateDir) -CaptureOutput
  return $result.Trim()
}
