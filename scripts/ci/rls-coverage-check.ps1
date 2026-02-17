param(
  [string]$DbHost = "",
  [int]$Port = 0,
  [string]$Database = "",
  [string]$Username = "",
  [string]$Password = "",
  [switch]$AllowMissing
)

$ErrorActionPreference = "Stop"

if (-not $DbHost) {
  $DbHost = if ($env:DATABASE_HOST) { $env:DATABASE_HOST } else { "localhost" }
}

if ($Port -le 0) {
  if ($env:DATABASE_PORT) {
    $Port = [int]$env:DATABASE_PORT
  } else {
    $Port = 5432
  }
}

if (-not $Database) {
  $Database = if ($env:DATABASE_NAME) { $env:DATABASE_NAME } else { "conectcrm" }
}

if (-not $Username) {
  $Username = if ($env:DATABASE_USERNAME) { $env:DATABASE_USERNAME } else { "conectcrm" }
}

if (-not $Password -and $env:DATABASE_PASSWORD) {
  $Password = $env:DATABASE_PASSWORD
}

if ($Password) {
  $env:PGPASSWORD = $Password
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Host "psql nao encontrado no PATH. Instale o PostgreSQL client para executar o check."
  exit 1
}

$sql = @"
WITH tenant_tables AS (
  SELECT c.table_schema, c.table_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
  GROUP BY c.table_schema, c.table_name
),
rls AS (
  SELECT n.nspname AS table_schema,
         cls.relname AS table_name,
         cls.relrowsecurity AS rls_enabled,
         cls.relforcerowsecurity AS rls_forced
  FROM pg_class cls
  JOIN pg_namespace n ON n.oid = cls.relnamespace
  WHERE cls.relkind = 'r'
    AND n.nspname = 'public'
),
pol AS (
  SELECT schemaname AS table_schema,
         tablename AS table_name,
         count(*) AS policies
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
)
SELECT t.table_name,
       COALESCE(r.rls_enabled, false)::int AS rls_enabled,
       COALESCE(r.rls_forced, false)::int AS rls_forced,
       COALESCE(p.policies, 0) AS policies
FROM tenant_tables t
LEFT JOIN rls r
  ON r.table_schema = t.table_schema
 AND r.table_name = t.table_name
LEFT JOIN pol p
  ON p.table_schema = t.table_schema
 AND p.table_name = t.table_name
ORDER BY t.table_name;
"@

Write-Host "RLS coverage check"
Write-Host "Host: $DbHost"
Write-Host "Port: $Port"
Write-Host "Database: $Database"
Write-Host "User: $Username"

$output = & psql -h $DbHost -p $Port -U $Username -d $Database -X -A -t -F "|" -c $sql 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao consultar banco:"
  Write-Host $output
  exit $LASTEXITCODE
}

$rows = @()
foreach ($line in ($output -split "`n")) {
  $trimmed = $line.Trim()
  if (-not $trimmed) {
    continue
  }

  $parts = $trimmed -split "\|"
  if ($parts.Count -lt 4) {
    continue
  }

  $rows += [pscustomobject]@{
    table_name   = $parts[0]
    rls_enabled  = ([int]$parts[1] -eq 1)
    rls_forced   = ([int]$parts[2] -eq 1)
    policies     = [int]$parts[3]
  }
}

if (-not $rows -or $rows.Count -eq 0) {
  Write-Host "Nenhuma tabela com coluna empresa_id foi encontrada."
  if ($AllowMissing) {
    exit 0
  }
  exit 1
}

$rows | Format-Table -AutoSize

$missing = $rows | Where-Object { -not $_.rls_enabled -or $_.policies -lt 1 }

Write-Host ""
Write-Host "Resumo:"
Write-Host " - Tabelas com empresa_id: $($rows.Count)"
Write-Host " - Tabelas com gap de RLS/policies: $($missing.Count)"

if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Tabelas com gap:"
  $missing | ForEach-Object {
    Write-Host " - $($_.table_name) (rls_enabled=$($_.rls_enabled), policies=$($_.policies))"
  }

  if (-not $AllowMissing) {
    exit 1
  }
}

Write-Host "RLS coverage check concluido."
exit 0
