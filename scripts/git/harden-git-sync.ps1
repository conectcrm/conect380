param(
  [switch]$Global
)

$ErrorActionPreference = "Stop"

$scope = "--local"
if ($Global) {
  $scope = "--global"
}

function Set-RepoConfig {
  param(
    [string]$Key,
    [string]$Value
  )
  & git config $scope $Key $Value
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao configurar $Key=$Value ($scope)."
  }
}

function Read-RepoConfig {
  param([string]$Key)
  $v = & git config $scope --get $Key 2>$null
  if ($LASTEXITCODE -ne 0) { return "<unset>" }
  return $v
}

Write-Host "Aplicando hardening de sincronizacao Git ($scope)..." -ForegroundColor Cyan

Set-RepoConfig -Key "pull.rebase" -Value "true"
Set-RepoConfig -Key "pull.ff" -Value "only"
Set-RepoConfig -Key "fetch.prune" -Value "true"
Set-RepoConfig -Key "rebase.autoStash" -Value "true"
Set-RepoConfig -Key "rerere.enabled" -Value "true"
Set-RepoConfig -Key "branch.autoSetupRebase" -Value "always"

Write-Host "`nConfiguracoes ativas:" -ForegroundColor Green
Write-Host " - pull.rebase = $(Read-RepoConfig "pull.rebase")"
Write-Host " - pull.ff = $(Read-RepoConfig "pull.ff")"
Write-Host " - fetch.prune = $(Read-RepoConfig "fetch.prune")"
Write-Host " - rebase.autoStash = $(Read-RepoConfig "rebase.autoStash")"
Write-Host " - rerere.enabled = $(Read-RepoConfig "rerere.enabled")"
Write-Host " - branch.autoSetupRebase = $(Read-RepoConfig "branch.autoSetupRebase")"

Write-Host "`nHardening concluido." -ForegroundColor Green
