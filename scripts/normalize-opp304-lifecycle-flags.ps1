<#
.SYNOPSIS
Audita e normaliza a flag de lifecycle moderno da Pipeline por tenant.

.DESCRIPTION
Executa um pacote operacional para:
1) auditar o estado atual da flag `crm_oportunidades_lifecycle_v1`;
2) aplicar normalizacao em lote (upsert) para os tenants do escopo;
3) gerar evidencia em markdown.

Por padrao roda em modo dry-run (sem gravar).

.EXAMPLE
.\scripts\normalize-opp304-lifecycle-flags.ps1

.EXAMPLE
.\scripts\normalize-opp304-lifecycle-flags.ps1 -Apply

.EXAMPLE
.\scripts\normalize-opp304-lifecycle-flags.ps1 -Apply -EmpresaIds "id-1,id-2" -Enabled:$false -RolloutPercentage 0
#>

param(
  [Parameter(Mandatory = $false)]
  [string]$DatabaseUrl = $env:DATABASE_URL,

  [Parameter(Mandatory = $false)]
  [string]$FlagKey = 'crm_oportunidades_lifecycle_v1',

  [Parameter(Mandatory = $false)]
  [bool]$Enabled = $true,

  [Parameter(Mandatory = $false)]
  [ValidateRange(0, 100)]
  [int]$RolloutPercentage = 0,

  [Parameter(Mandatory = $false)]
  [switch]$Apply = $false,

  [Parameter(Mandatory = $false)]
  [switch]$IncludeInactive = $false,

  [Parameter(Mandatory = $false)]
  [string]$EmpresaIds = '',

  [Parameter(Mandatory = $false)]
  [switch]$ShowDetails = $false,

  [Parameter(Mandatory = $false)]
  [string]$OutputFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-CommandExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando '$Name' nao encontrado no PATH."
  }
}

function Escape-SqlLiteral {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return $Value.Replace("'", "''")
}

function Read-DotEnvMap {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath
  )

  $map = @{}
  if (-not (Test-Path $FilePath)) {
    return $map
  }

  foreach ($line in Get-Content -Path $FilePath) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) {
      continue
    }

    $equalsIndex = $trimmed.IndexOf('=')
    if ($equalsIndex -le 0) {
      continue
    }

    $key = $trimmed.Substring(0, $equalsIndex).Trim()
    $value = $trimmed.Substring($equalsIndex + 1).Trim()
    $value = $value.Trim('"').Trim("'")

    if (-not $map.ContainsKey($key)) {
      $map[$key] = $value
    }
  }

  return $map
}

function Resolve-DatabaseUrl {
  param(
    [Parameter(Mandatory = $false)]
    [string]$ExplicitDatabaseUrl
  )

  if (-not [string]::IsNullOrWhiteSpace($ExplicitDatabaseUrl)) {
    return $ExplicitDatabaseUrl
  }

  $databaseHost = $env:DATABASE_HOST
  $databasePort = $env:DATABASE_PORT
  $databaseUser = $env:DATABASE_USERNAME
  $databasePassword = $env:DATABASE_PASSWORD
  $databaseName = $env:DATABASE_NAME

  $hasAllFromEnv = @($databaseHost, $databasePort, $databaseUser, $databasePassword, $databaseName) -notcontains $null `
    -and @($databaseHost, $databasePort, $databaseUser, $databasePassword, $databaseName) -notcontains ''

  if (-not $hasAllFromEnv) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $backendEnvPath = Join-Path $repoRoot 'backend/.env'
    $envMap = Read-DotEnvMap -FilePath $backendEnvPath

    if ([string]::IsNullOrWhiteSpace($databaseHost) -and $envMap.ContainsKey('DATABASE_HOST')) {
      $databaseHost = $envMap['DATABASE_HOST']
    }
    if ([string]::IsNullOrWhiteSpace($databasePort) -and $envMap.ContainsKey('DATABASE_PORT')) {
      $databasePort = $envMap['DATABASE_PORT']
    }
    if ([string]::IsNullOrWhiteSpace($databaseUser) -and $envMap.ContainsKey('DATABASE_USERNAME')) {
      $databaseUser = $envMap['DATABASE_USERNAME']
    }
    if ([string]::IsNullOrWhiteSpace($databasePassword) -and $envMap.ContainsKey('DATABASE_PASSWORD')) {
      $databasePassword = $envMap['DATABASE_PASSWORD']
    }
    if ([string]::IsNullOrWhiteSpace($databaseName) -and $envMap.ContainsKey('DATABASE_NAME')) {
      $databaseName = $envMap['DATABASE_NAME']
    }
  }

  $hasAll = @($databaseHost, $databasePort, $databaseUser, $databasePassword, $databaseName) -notcontains $null `
    -and @($databaseHost, $databasePort, $databaseUser, $databasePassword, $databaseName) -notcontains ''

  if (-not $hasAll) {
    return ''
  }

  $encodedUser = [Uri]::EscapeDataString($databaseUser)
  $encodedPassword = [Uri]::EscapeDataString($databasePassword)
  $encodedDbName = [Uri]::EscapeDataString($databaseName)

  return "postgresql://${encodedUser}:${encodedPassword}@${databaseHost}:${databasePort}/${encodedDbName}"
}

function Parse-EmpresaIds {
  param(
    [Parameter(Mandatory = $false)]
    [string]$RawValue
  )

  if ([string]::IsNullOrWhiteSpace($RawValue)) {
    return ,@()
  }

  $items = @()
  foreach ($token in ($RawValue -split '[,; ]+')) {
    $trimmed = $token.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
      continue
    }

    $parsedGuid = [Guid]::Empty
    if (-not [Guid]::TryParse($trimmed, [ref]$parsedGuid)) {
      throw "EmpresaId invalido: '$trimmed'."
    }

    $items += $parsedGuid.ToString()
  }

  return ,@($items | Select-Object -Unique)
}

function Build-ScopeWhereClause {
  param(
    [Parameter(Mandatory = $false)]
    [string[]]$ScopedEmpresaIds = @(),

    [Parameter(Mandatory = $true)]
    [bool]$ShouldIncludeInactive
  )

  $clauses = @()
  $resolvedEmpresaIds = @($ScopedEmpresaIds)

  if (-not $ShouldIncludeInactive) {
    $clauses += 'e.ativo = true'
  }

  if ($resolvedEmpresaIds.Count -gt 0) {
    $idSql = ($resolvedEmpresaIds | ForEach-Object { "'$($_)'::uuid" }) -join ', '
    $clauses += "e.id IN ($idSql)"
  }

  if ($clauses.Count -eq 0) {
    return ''
  }

  return "WHERE $($clauses -join ' AND ')"
}

function Invoke-Psql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$DbUrl,

    [Parameter(Mandatory = $true)]
    [string]$Sql,

    [Parameter(Mandatory = $false)]
    [switch]$Csv = $false
  )

  $args = @('-X', $DbUrl, '-v', 'ON_ERROR_STOP=1')
  if ($Csv) {
    $args += @('-A', '-F', ',')
  }
  $args += @('-c', $Sql)

  $previousErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $output = (& psql @args 2>&1)
  } finally {
    $ErrorActionPreference = $previousErrorPreference
  }
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    $errorText = if ($output) { $output -join [Environment]::NewLine } else { '(sem detalhes)' }
    throw "psql falhou com exit code $exitCode.`n$errorText"
  }

  return $output
}

function Get-AuditSummarySql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FlagKeyEscaped,

    [Parameter(Mandatory = $true)]
    [string]$WhereClause
  )

  return @"
WITH scoped AS (
  SELECT
    e.id AS empresa_id,
    e.nome,
    e.ativo,
    e.status,
    f.enabled,
    COALESCE(f.rollout_percentage, 0) AS rollout_percentage
  FROM empresas e
  LEFT JOIN feature_flags_tenant f
    ON f.empresa_id = e.id
   AND f.flag_key = '$FlagKeyEscaped'
  $WhereClause
),
classified AS (
  SELECT
    CASE
      WHEN enabled IS NULL THEN 'missing'
      WHEN enabled = true THEN 'enabled'
      WHEN rollout_percentage > 0 THEN 'rollout'
      ELSE 'disabled'
    END AS state
  FROM scoped
)
SELECT state, COUNT(*) AS total
FROM classified
GROUP BY state
ORDER BY state;
"@
}

function Get-AuditDetailsSql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FlagKeyEscaped,

    [Parameter(Mandatory = $true)]
    [string]$WhereClause
  )

  return @"
WITH scoped AS (
  SELECT
    e.id AS empresa_id,
    e.nome,
    e.ativo,
    e.status,
    f.enabled,
    COALESCE(f.rollout_percentage, 0) AS rollout_percentage
  FROM empresas e
  LEFT JOIN feature_flags_tenant f
    ON f.empresa_id = e.id
   AND f.flag_key = '$FlagKeyEscaped'
  $WhereClause
)
SELECT
  empresa_id,
  nome,
  ativo,
  status,
  COALESCE(enabled, false) AS enabled,
  rollout_percentage,
  CASE
    WHEN enabled IS NULL THEN 'missing'
    WHEN enabled = true THEN 'enabled'
    WHEN rollout_percentage > 0 THEN 'rollout'
    ELSE 'disabled'
  END AS state
FROM scoped
ORDER BY nome;
"@
}

function Get-ApplySql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FlagKeyEscaped,

    [Parameter(Mandatory = $true)]
    [bool]$EnabledValue,

    [Parameter(Mandatory = $true)]
    [int]$RolloutValue,

    [Parameter(Mandatory = $true)]
    [string]$WhereClause
  )

  $enabledLiteral = if ($EnabledValue) { 'true' } else { 'false' }

  return @"
INSERT INTO feature_flags_tenant (
  empresa_id,
  flag_key,
  enabled,
  rollout_percentage,
  updated_by,
  updated_at
)
SELECT
  e.id,
  '$FlagKeyEscaped',
  $enabledLiteral,
  $RolloutValue,
  NULL,
  now()
FROM empresas e
$WhereClause
ON CONFLICT (empresa_id, flag_key)
DO UPDATE SET
  enabled = EXCLUDED.enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();
"@
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  $DatabaseUrl = Resolve-DatabaseUrl -ExplicitDatabaseUrl $DatabaseUrl
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw 'DATABASE_URL nao informado. Use -DatabaseUrl ou defina a variavel de ambiente.'
}

Assert-CommandExists -Name 'psql'

$flagKeyEscaped = Escape-SqlLiteral -Value $FlagKey
$scopedIds = Parse-EmpresaIds -RawValue $EmpresaIds
$whereClause = Build-ScopeWhereClause -ScopedEmpresaIds $scopedIds -ShouldIncludeInactive:$IncludeInactive

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$modeLabel = if ($Apply) { 'apply' } else { 'dry-run' }
$startedAt = Get-Date

$summarySql = Get-AuditSummarySql -FlagKeyEscaped $flagKeyEscaped -WhereClause $whereClause
$detailsSql = Get-AuditDetailsSql -FlagKeyEscaped $flagKeyEscaped -WhereClause $whereClause
$applySql = Get-ApplySql `
  -FlagKeyEscaped $flagKeyEscaped `
  -EnabledValue $Enabled `
  -RolloutValue $RolloutPercentage `
  -WhereClause $whereClause

Write-Host ''
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' OPP-304 - Pacote de normalizacao lifecycle' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "RunId: $runId"
Write-Host "Mode: $modeLabel"
Write-Host "FlagKey: $FlagKey"
Write-Host "Enabled target: $Enabled"
Write-Host "Rollout target: $RolloutPercentage"
Write-Host "IncludeInactive: $($IncludeInactive.IsPresent)"
Write-Host "Scoped IDs: $(if ($scopedIds.Count -gt 0) { $scopedIds.Count } else { 0 })"
Write-Host ''

Write-Host '[1/3] Auditoria antes da normalizacao...' -ForegroundColor Yellow
$auditBeforeSummary = Invoke-Psql -DbUrl $DatabaseUrl -Sql $summarySql
$auditBeforeDetails = @()
if ($ShowDetails) {
  $auditBeforeDetails = Invoke-Psql -DbUrl $DatabaseUrl -Sql $detailsSql
}

if ($Apply) {
  Write-Host '[2/3] Aplicando normalizacao...' -ForegroundColor Yellow
  $applyOutput = Invoke-Psql -DbUrl $DatabaseUrl -Sql $applySql
  Write-Host '[3/3] Auditoria apos normalizacao...' -ForegroundColor Yellow
  $auditAfterSummary = Invoke-Psql -DbUrl $DatabaseUrl -Sql $summarySql
  $auditAfterDetails = @()
  if ($ShowDetails) {
    $auditAfterDetails = Invoke-Psql -DbUrl $DatabaseUrl -Sql $detailsSql
  }
} else {
  $applyOutput = @('Dry-run: nenhuma escrita executada.')
  $auditAfterSummary = @('Dry-run: sem auditoria pos-aplicacao.')
  $auditAfterDetails = @()
}

$finishedAt = Get-Date

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $OutputFile = Join-Path $repoRoot "docs/features/evidencias/OPP304_NORMALIZACAO_LIFECYCLE_$runId.md"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$outputDir = Split-Path -Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$report = @()
$report += '# OPP-304 - Pacote de normalizacao lifecycle'
$report += ''
$report += "- RunId: $runId"
$report += "- Inicio: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$report += "- Fim: $($finishedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$report += "- Modo: $modeLabel"
$report += "- Flag: $FlagKey"
$report += "- Enabled alvo: $Enabled"
$report += "- Rollout alvo: $RolloutPercentage"
$report += "- IncludeInactive: $($IncludeInactive.IsPresent)"
$report += "- Escopo por IDs: $(if ($scopedIds.Count -gt 0) { $scopedIds -join ', ' } else { '(todos do escopo)' })"
$report += ''
$report += '## Auditoria antes'
$report += '```'
$report += ($auditBeforeSummary -join [Environment]::NewLine)
$report += '```'
$report += ''
if ($ShowDetails) {
  $report += '### Detalhes (antes)'
  $report += '```'
  $report += ($auditBeforeDetails -join [Environment]::NewLine)
  $report += '```'
  $report += ''
}
$report += '## Aplicacao'
$report += '```sql'
$report += $applySql.Trim()
$report += '```'
$report += ''
$report += '```'
$report += ($applyOutput -join [Environment]::NewLine)
$report += '```'
$report += ''
$report += '## Auditoria apos'
$report += '```'
$report += ($auditAfterSummary -join [Environment]::NewLine)
$report += '```'
$report += ''
if ($ShowDetails -and $auditAfterDetails.Count -gt 0) {
  $report += '### Detalhes (apos)'
  $report += '```'
  $report += ($auditAfterDetails -join [Environment]::NewLine)
  $report += '```'
  $report += ''
}

Set-Content -Path $OutputFile -Value $report -Encoding UTF8

Write-Host ''
Write-Host 'Pacote concluido.' -ForegroundColor Green
Write-Host "Evidencia: $OutputFile"

exit 0
