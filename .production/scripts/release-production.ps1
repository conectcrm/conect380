param(
  [string]$ProfileName = 'production',
  [string]$ProfilePath,
  [switch]$SkipPreflight,
  [switch]$SkipBackup,
  [switch]$NoCacheBuild,
  [switch]$AllowDirtyWorktree,
  [switch]$RunAdm303Smoke,
  [string]$Adm303BaseUrl,
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

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if ([string]::IsNullOrWhiteSpace($ProfilePath)) {
  $ProfilePath = Join-Path $repoRoot '.production\configs\deploy-profile.local.psd1'
}

$releaseScript = Join-Path $PSScriptRoot 'release-azure-vm.ps1'
$params = @{
  ProfileName = $ProfileName
  ProfilePath = $ProfilePath
}

if ($SkipPreflight) { $params.SkipPreflight = $true }
if ($SkipBackup) { $params.SkipBackup = $true }
if ($NoCacheBuild) { $params.NoCacheBuild = $true }
if ($AllowDirtyWorktree) { $params.AllowDirtyWorktree = $true }
if ($RunAdm303Smoke) { $params.RunAdm303Smoke = $true }
if (-not [string]::IsNullOrWhiteSpace($Adm303BaseUrl)) { $params.Adm303BaseUrl = $Adm303BaseUrl }
if (-not [string]::IsNullOrWhiteSpace($Adm303RequesterEmail)) { $params.Adm303RequesterEmail = $Adm303RequesterEmail }
if (-not [string]::IsNullOrWhiteSpace($Adm303RequesterPassword)) { $params.Adm303RequesterPassword = $Adm303RequesterPassword }
if (-not [string]::IsNullOrWhiteSpace($Adm303RequesterMfaCode)) { $params.Adm303RequesterMfaCode = $Adm303RequesterMfaCode }
if (-not [string]::IsNullOrWhiteSpace($Adm303ApproverEmail)) { $params.Adm303ApproverEmail = $Adm303ApproverEmail }
if (-not [string]::IsNullOrWhiteSpace($Adm303ApproverPassword)) { $params.Adm303ApproverPassword = $Adm303ApproverPassword }
if (-not [string]::IsNullOrWhiteSpace($Adm303ApproverMfaCode)) { $params.Adm303ApproverMfaCode = $Adm303ApproverMfaCode }
if (-not [string]::IsNullOrWhiteSpace($Adm303TargetEmail)) { $params.Adm303TargetEmail = $Adm303TargetEmail }
if (-not [string]::IsNullOrWhiteSpace($Adm303TargetPassword)) { $params.Adm303TargetPassword = $Adm303TargetPassword }
if (-not [string]::IsNullOrWhiteSpace($Adm303TargetMfaCode)) { $params.Adm303TargetMfaCode = $Adm303TargetMfaCode }
if ($Adm303SkipTargetAccessCheck) { $params.Adm303SkipTargetAccessCheck = $true }
if ($Execute) { $params.Execute = $true }

& $releaseScript @params
