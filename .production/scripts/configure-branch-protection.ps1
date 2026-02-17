param(
  [string]$Owner = "conectcrm",
  [string]$Repo = "conect380",
  [string[]]$Branches = @("main", "develop"),
  [string[]]$RequiredChecks = @(
    "PR Template Guardrails",
    "Multi-tenant Guardrails",
    "Lint Budget Guardrails",
    "Backend - Testes e Build",
    "Frontend - Testes e Build",
    "Status Final do CI"
  ),
  [int]$RequiredApprovals = 1,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token) -and -not $DryRun) {
  Write-Host "GITHUB_TOKEN nao definido. Exporte a variavel antes de executar."
  Write-Host "Exemplo: `$env:GITHUB_TOKEN='ghp_xxx'"
  exit 1
}

$headers = @{
  "Accept" = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

if (-not $DryRun) {
  $headers["Authorization"] = "Bearer $token"
}

$repoUrl = "https://api.github.com/repos/$Owner/$Repo"

if (-not $DryRun) {
  try {
    $null = Invoke-RestMethod -Method Get -Uri $repoUrl -Headers $headers
  }
  catch {
    Write-Host "Falha ao acessar repositorio $Owner/$Repo."
    Write-Host "Verifique se o repo existe e se o token tem permissao admin no repositorio."
    throw
  }
}

$payload = @{
  required_status_checks = @{
    strict = $true
    contexts = $RequiredChecks
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = $RequiredApprovals
    require_last_push_approval = $false
    dismissal_restrictions = @{
      users = @()
      teams = @()
    }
    bypass_pull_request_allowances = @{
      users = @()
      teams = @()
      apps = @()
    }
  }
  restrictions = $null
  required_conversation_resolution = $true
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
} | ConvertTo-Json -Depth 10

Write-Host "Configuracao de branch protection"
Write-Host "Repositorio: $Owner/$Repo"
Write-Host "Branches: $($Branches -join ', ')"
Write-Host "Checks obrigatorios:"
$RequiredChecks | ForEach-Object { Write-Host " - $_" }

if ($DryRun) {
  Write-Host ""
  Write-Host "DryRun habilitado. Nenhuma alteracao foi enviada para o GitHub."
  exit 0
}

foreach ($branch in $Branches) {
  $url = "https://api.github.com/repos/$Owner/$Repo/branches/$branch/protection"
  Write-Host ""
  Write-Host "Aplicando branch protection em '$branch'..."
  try {
    $null = Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body $payload -ContentType "application/json"
    Write-Host "OK: $branch protegido."
  }
  catch {
    Write-Host "Falha ao aplicar branch protection em '$branch'."
    throw
  }
}

Write-Host ""
Write-Host "Branch protection aplicada com sucesso."


