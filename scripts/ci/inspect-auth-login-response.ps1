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

if (-not (Test-Path $backendEntry)) {
  throw "Backend build nao encontrado em: $backendEntry"
}

$proc = $null
try {
  $proc = Start-Process -FilePath 'node' `
    -ArgumentList @('--enable-source-maps', $backendEntry) `
    -WorkingDirectory $repoRoot `
    -PassThru

  Start-Sleep -Seconds $StartupSeconds
  if ($proc.HasExited) {
    throw "Backend encerrou durante startup (pid=$($proc.Id), exitCode=$($proc.ExitCode))."
  }

  $url = "$($BaseUrl.TrimEnd('/'))/auth/login"
  $body = @{ email = $Email; senha = $Senha } | ConvertTo-Json -Depth 5

  try {
    $resp = Invoke-WebRequest -Uri $url -Method POST -UseBasicParsing -ContentType 'application/json' -Body $body -ErrorAction Stop
    Write-Host "status=$([int]$resp.StatusCode)"
    Write-Host 'content:'
    Write-Output $resp.Content
  } catch {
    $statusCode = 0
    $content = ''
    if ($_.Exception.Response) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch {}
      try {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $sr.ReadToEnd()
        $sr.Close()
      } catch {}
    }

    Write-Host "status=$statusCode"
    Write-Host 'content:'
    Write-Output $content
    throw
  }
}
finally {
  if ($null -ne $proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
