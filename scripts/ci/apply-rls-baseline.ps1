param(
  [string]$DbHost = "",
  [int]$Port = 0,
  [string]$Database = "",
  [string]$Username = "",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

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
  Write-Host "psql nao encontrado no PATH. Instale o PostgreSQL client para aplicar RLS."
  exit 1
}

$sql = @'
SET client_min_messages TO warning;
BEGIN;

CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$;

CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tenant_setting text;
BEGIN
  tenant_setting := current_setting('app.current_tenant_id', true);

  IF tenant_setting IS NULL OR tenant_setting = '' THEN
    RETURN NULL;
  END IF;

  RETURN tenant_setting::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

DO $$
DECLARE
  rec record;
  policy_name text;
BEGIN
  FOR rec IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'empresa_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    policy_name := 'tenant_isolation_' || rec.table_name;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (empresa_id::text = get_current_tenant()::text) WITH CHECK (empresa_id::text = get_current_tenant()::text)',
      policy_name,
      rec.table_name
    );
  END LOOP;
END;
$$;

COMMIT;
'@

Write-Host "Apply RLS baseline"
Write-Host "Host: $DbHost"
Write-Host "Port: $Port"
Write-Host "Database: $Database"
Write-Host "User: $Username"

$output = & psql -h $DbHost -p $Port -U $Username -d $Database -X -v ON_ERROR_STOP=1 -c $sql 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao aplicar RLS baseline:"
  Write-Host $output
  exit $LASTEXITCODE
}

Write-Host $output
Write-Host "RLS baseline aplicado com sucesso."
