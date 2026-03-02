param(
  [string]$ZoneId,
  [string]$ApiToken,
  [string[]]$Files,
  [switch]$PurgeEverything,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ZoneId)) {
  $ZoneId = $env:CLOUDFLARE_ZONE_ID
}

if ([string]::IsNullOrWhiteSpace($ApiToken)) {
  $ApiToken = $env:CLOUDFLARE_API_TOKEN
}

if ([string]::IsNullOrWhiteSpace($ZoneId)) {
  throw "ZoneId ausente. Informe -ZoneId ou configure CLOUDFLARE_ZONE_ID."
}

if ([string]::IsNullOrWhiteSpace($ApiToken)) {
  throw "ApiToken ausente. Informe -ApiToken ou configure CLOUDFLARE_API_TOKEN."
}

$endpoint = "https://api.cloudflare.com/client/v4/zones/$ZoneId/purge_cache"

$usePurgeEverything = $PurgeEverything
if (-not $PurgeEverything -and ($null -eq $Files -or $Files.Count -eq 0)) {
  # Default seguro para evitar inconsistencias de cache apos release.
  $usePurgeEverything = $true
}

if ($usePurgeEverything) {
  $payload = @{
    purge_everything = $true
  }
} else {
  $normalizedFiles = @()
  foreach ($file in $Files) {
    if (-not [string]::IsNullOrWhiteSpace($file)) {
      $normalizedFiles += $file.Trim()
    }
  }

  if ($normalizedFiles.Count -eq 0) {
    throw "Lista de arquivos vazia para purge seletivo."
  }

  $payload = @{
    files = $normalizedFiles
  }
}

$payloadJson = $payload | ConvertTo-Json -Depth 10

Write-Host "Cloudflare purge endpoint: $endpoint"
Write-Host "Modo purge: $(if ($usePurgeEverything) { 'purge_everything' } else { 'files' })"
if (-not $usePurgeEverything) {
  Write-Host "Arquivos:"
  $payload.files | ForEach-Object { Write-Host " - $_" }
}

if ($DryRun) {
  Write-Host "Dry-run ativo: nenhuma chamada foi enviada."
  exit 0
}

$headers = @{
  Authorization = "Bearer $ApiToken"
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -Body $payloadJson

if (-not $response.success) {
  $errors = @()
  if ($response.errors) {
    $errors = @($response.errors | ForEach-Object { $_.message })
  }
  $errorText = if ($errors.Count -gt 0) { $errors -join " | " } else { "Erro desconhecido no purge." }
  throw "Purge Cloudflare falhou: $errorText"
}

Write-Host "Purge Cloudflare executado com sucesso."
