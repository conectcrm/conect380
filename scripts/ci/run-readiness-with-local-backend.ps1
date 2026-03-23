param(
  [string]$BaseUrl = 'http://localhost:3001',
  [string]$Email = 'admin@conect360.com.br',
  [string]$Senha = 'admin123',
  [int]$StartupSeconds = 12
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backendEntry = Join-Path $repoRoot 'backend\dist\src\main.js'
$readinessScript = Join-Path $repoRoot 'scripts\ci\guardian-production-readiness-real-check.ps1'
$tmpDir = Join-Path $repoRoot 'tmp'
$stdoutLog = Join-Path $tmpDir 'guardian-local-backend.stdout.log'
$stderrLog = Join-Path $tmpDir 'guardian-local-backend.stderr.log'

if (-not (Test-Path $backendEntry)) {
  throw "Backend build nao encontrado em: $backendEntry"
}

if (-not (Test-Path $tmpDir)) {
  New-Item -ItemType Directory -Path $tmpDir | Out-Null
}

if (Test-Path $stdoutLog) { Remove-Item $stdoutLog -Force }
if (Test-Path $stderrLog) { Remove-Item $stderrLog -Force }

$proc = $null
try {
  Write-Host "[local-readiness] Subindo backend local..." -ForegroundColor Cyan
  $proc = Start-Process -FilePath 'node' `
    -ArgumentList @('--enable-source-maps', $backendEntry) `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  Start-Sleep -Seconds $StartupSeconds
  if ($proc.HasExited) {
    $stdoutTail = if (Test-Path $stdoutLog) { (Get-Content $stdoutLog -Tail 40 -ErrorAction SilentlyContinue) -join [Environment]::NewLine } else { '' }
    $stderrTail = if (Test-Path $stderrLog) { (Get-Content $stderrLog -Tail 40 -ErrorAction SilentlyContinue) -join [Environment]::NewLine } else { '' }
    if (-not [string]::IsNullOrWhiteSpace($stdoutTail)) {
      Write-Host "[local-readiness] STDOUT tail:" -ForegroundColor Yellow
      Write-Host $stdoutTail
    }
    if (-not [string]::IsNullOrWhiteSpace($stderrTail)) {
      Write-Host "[local-readiness] STDERR tail:" -ForegroundColor Red
      Write-Host $stderrTail
    }
    throw "Backend encerrou durante startup (pid=$($proc.Id), exitCode=$($proc.ExitCode))."
  }

  Write-Host "[local-readiness] Executando readiness real..." -ForegroundColor Cyan
  & powershell -ExecutionPolicy Bypass -File $readinessScript -BaseUrl $BaseUrl -Email $Email -Senha $Senha
  exit $LASTEXITCODE
}
finally {
  if ($null -ne $proc -and -not $proc.HasExited) {
    Write-Host "[local-readiness] Encerrando backend local (pid=$($proc.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
