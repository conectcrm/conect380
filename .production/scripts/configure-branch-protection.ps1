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
  [switch]$DryRun,
  [switch]$FailOnMissingBranch
)

$ErrorActionPreference = "Stop"

function Get-HttpStatusCode {
  param(
    [System.Management.Automation.ErrorRecord]$ErrorRecord
  )

  $response = $ErrorRecord.Exception.Response
  if ($null -eq $response) {
    return $null
  }

  try {
    if ($response -is [System.Net.Http.HttpResponseMessage]) {
      return [int]$response.StatusCode
    }

    if ($null -ne $response.StatusCode) {
      if ($null -ne $response.StatusCode.value__) {
        return [int]$response.StatusCode.value__
      }

      return [int]$response.StatusCode
    }
  }
  catch {
    return $null
  }

  if ($null -ne $ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
    try {
      $errorPayload = $ErrorRecord.ErrorDetails.Message | ConvertFrom-Json
      if ($null -ne $errorPayload.status) {
        return [int]$errorPayload.status
      }
      if ($null -ne $errorPayload.statusCode) {
        return [int]$errorPayload.statusCode
      }
    }
    catch {
      # ignore parse errors
    }
  }

  return $null
}

function Get-ErrorMessage {
  param(
    [System.Management.Automation.ErrorRecord]$ErrorRecord
  )

  if ($null -ne $ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
    return $ErrorRecord.ErrorDetails.Message
  }

  return $ErrorRecord.Exception.Message
}

function Get-RepoBranch {
  param(
    [string]$BranchName,
    [hashtable]$ApiHeaders,
    [string]$BaseRepoUrl
  )

  $branchEncoded = [uri]::EscapeDataString($BranchName)
  $branchUrl = "$BaseRepoUrl/branches/$branchEncoded"
  try {
    return Invoke-RestMethod -Method Get -Uri $branchUrl -Headers $ApiHeaders
  }
  catch {
    $statusCode = Get-HttpStatusCode -ErrorRecord $_
    if ($statusCode -eq 404) {
      return $null
    }

    throw
  }
}

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
$repoData = $null
$existingBranches = @()
$missingBranches = @()
$failedBranches = @()
$planRestrictionDetected = $false

if (-not $DryRun) {
  try {
    $repoData = Invoke-RestMethod -Method Get -Uri $repoUrl -Headers $headers
  }
  catch {
    Write-Host "Falha ao acessar repositorio $Owner/$Repo."
    Write-Host "Verifique se o repo existe e se o token tem permissao admin no repositorio."
    throw
  }

  $hasAdminPermission = $false
  if ($null -ne $repoData.permissions -and $null -ne $repoData.permissions.admin) {
    $hasAdminPermission = [bool]$repoData.permissions.admin
  }

  if (-not $hasAdminPermission) {
    Write-Host "Token autenticado sem permissao admin no repositorio $Owner/$Repo."
    Write-Host "Permissao atual: push=$($repoData.permissions.push), admin=$($repoData.permissions.admin)"
    Write-Host "Solicite permissao de administrador ou token de um maintainer para aplicar branch protection."
    exit 1
  }

  foreach ($branch in $Branches) {
    $branchData = Get-RepoBranch -BranchName $branch -ApiHeaders $headers -BaseRepoUrl $repoUrl
    if ($null -eq $branchData) {
      $missingBranches += $branch
      continue
    }

    $existingBranches += $branch
  }

  if ($missingBranches.Count -gt 0) {
    Write-Host "Branches nao encontradas no repositorio: $($missingBranches -join ', ')"
    if ($FailOnMissingBranch) {
      Write-Host "Falha por -FailOnMissingBranch habilitado."
      exit 1
    }

    Write-Host "Continuando apenas com branches existentes."
  }

  if ($existingBranches.Count -eq 0) {
    Write-Host "Nenhuma branch alvo encontrada para aplicar protection."
    exit 1
  }
}
else {
  $existingBranches = @($Branches)
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
  }
  restrictions = $null
  required_conversation_resolution = $true
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
} | ConvertTo-Json -Depth 10

Write-Host "Configuracao de branch protection"
Write-Host "Repositorio: $Owner/$Repo"
Write-Host "Branches solicitadas: $($Branches -join ', ')"
Write-Host "Branches alvo: $($existingBranches -join ', ')"
Write-Host "Checks obrigatorios:"
$RequiredChecks | ForEach-Object { Write-Host " - $_" }

if ($DryRun) {
  Write-Host ""
  Write-Host "DryRun habilitado. Nenhuma alteracao foi enviada para o GitHub."
  exit 0
}

foreach ($branch in $existingBranches) {
  $branchEncoded = [uri]::EscapeDataString($branch)
  $url = "https://api.github.com/repos/$Owner/$Repo/branches/$branchEncoded/protection"
  Write-Host ""
  Write-Host "Aplicando branch protection em '$branch'..."
  try {
    $null = Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body $payload -ContentType "application/json"
    Write-Host "OK: $branch protegido."
  }
  catch {
    $statusCode = Get-HttpStatusCode -ErrorRecord $_
    $errorMessage = Get-ErrorMessage -ErrorRecord $_
    if ($null -eq $statusCode -or $statusCode -eq 0) {
      try {
        $parsedError = $errorMessage | ConvertFrom-Json
        if ($null -ne $parsedError.status) {
          $statusCode = [int]$parsedError.status
        }
        elseif ($null -ne $parsedError.statusCode) {
          $statusCode = [int]$parsedError.statusCode
        }
      }
      catch {
        # ignore parse errors
      }
    }
    Write-Host "Falha ao aplicar branch protection em '$branch' (HTTP $statusCode)."
    Write-Host "Detalhes: $errorMessage"
    if ($statusCode -eq 403 -and $errorMessage -like "*Upgrade to GitHub Pro or make this repository public*") {
      $planRestrictionDetected = $true
      Write-Host "Motivo: o plano/repositorio atual nao permite branch protection neste endpoint."
    }
    $failedBranches += $branch
  }
}

Write-Host ""
if ($failedBranches.Count -gt 0) {
  Write-Host "Branch protection aplicada parcialmente."
  Write-Host "Falhas: $($failedBranches -join ', ')"
  if ($planRestrictionDetected) {
    Write-Host "Acao recomendada: tornar o repositorio publico ou migrar para plano GitHub com branch protection para repositorios privados."
  }
  exit 1
}

Write-Host "Branch protection aplicada com sucesso."
