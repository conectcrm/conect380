param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,

  [Parameter(Mandatory = $true)]
  [string]$Repo,

  [Parameter(Mandatory = $true)]
  [string]$Branch,

  [int]$RequiredApprovals = 1,

  [switch]$EnforceAdmins,

  [switch]$DryRun,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ExtraArgs
)

$ErrorActionPreference = "Stop"

$normalizedExtraArgs = @($ExtraArgs | ForEach-Object { [string]$_ } | ForEach-Object { $_.Trim().ToLowerInvariant() })
$dryRunRequested = $DryRun.IsPresent -or $normalizedExtraArgs -contains "dryrun"
$enforceAdminsRequested = $EnforceAdmins.IsPresent -or $normalizedExtraArgs -contains "enforceadmins"

if (-not $dryRunRequested -and -not $env:GITHUB_TOKEN) {
  throw "Variavel de ambiente GITHUB_TOKEN nao definida. Defina um token com permissao de administracao no repositorio."
}

if ($RequiredApprovals -lt 1) {
  throw "RequiredApprovals deve ser >= 1."
}

$requiredChecks = @(
  "CI - Testes e Build / Status Final do CI",
  "PR Template Guardrails / PR Template Guardrails"
)

$payload = @{
  required_status_checks = @{
    strict = $true
    contexts = $requiredChecks
  }
  enforce_admins = $enforceAdminsRequested
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $true
    required_approving_review_count = $RequiredApprovals
    require_last_push_approval = $false
  }
  restrictions = $null
  required_conversation_resolution = $true
  required_linear_history = $false
  allow_force_pushes = @{
    enabled = $false
  }
  allow_deletions = @{
    enabled = $false
  }
  block_creations = $false
  lock_branch = $false
  allow_fork_syncing = $false
} | ConvertTo-Json -Depth 8

$url = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"

Write-Host "Configurando branch protection..."
Write-Host "Repositorio: $Owner/$Repo"
Write-Host "Branch: $Branch"
Write-Host "Required checks:"
$requiredChecks | ForEach-Object { Write-Host " - $_" }
Write-Host "Required approvals: $RequiredApprovals"
Write-Host "Enforce admins: $enforceAdminsRequested"

if ($dryRunRequested) {
  Write-Host ""
  Write-Host "Dry-run habilitado. Payload que seria enviado:"
  Write-Host $payload
  exit 0
}

$headers = @{
  Authorization = "Bearer $($env:GITHUB_TOKEN)"
  Accept = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

try {
  $repoInfo = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$Owner/$Repo" -Headers $headers
  $hasAdminPermission = $false
  if ($null -ne $repoInfo.permissions -and $null -ne $repoInfo.permissions.admin) {
    $hasAdminPermission = [bool]$repoInfo.permissions.admin
  }

  if (-not $hasAdminPermission) {
    throw "Token autenticado sem permissao ADMIN no repositorio $Owner/$Repo. Permissao atual: WRITE/READ. Solicite acesso ADMIN ou use token de owner/admin."
  }

  $response = Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body $payload -ContentType "application/json"
} catch {
  $errorMessage = $_.Exception.Message
  if ($errorMessage -match "404" -or $errorMessage -match "Not Found") {
    throw "Falha ao aplicar branch protection (404). Em repositorios privados isso normalmente indica falta de permissao ADMIN para o token atual."
  }

  if (
    $errorMessage -match "403" -or
    $errorMessage -match "Upgrade to GitHub Pro" -or
    $errorMessage -match "enable this feature"
  ) {
    throw "Falha ao aplicar branch protection (403). O plano atual do repositorio/organizacao nao permite branch protection para repositorio privado. Necessario upgrade de plano (GitHub Team/Enterprise ou Pro) ou tornar o repositorio publico."
  }

  throw
}

Write-Host ""
Write-Host "Branch protection aplicada com sucesso."
Write-Host "URL: $($response.url)"
