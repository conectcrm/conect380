param(
  [string]$FrontendUrl = 'http://127.0.0.1:4020',
  [int]$TimeoutSeconds = 60
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Wait-ForHttpReady {
  param(
    [string]$Url,
    [int]$Timeout
  )

  $deadline = (Get-Date).AddSeconds($Timeout)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    }
    catch {
      Start-Sleep -Milliseconds 800
    }
  }

  return $false
}

$previewProcess = $null
$env:GUARDIAN_FRONTEND_URL = $FrontendUrl

try {
  Write-Host '[GDN-308] Iniciando guardian-web preview...' -ForegroundColor Cyan

  $previewProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm --prefix guardian-web run preview' -PassThru -WindowStyle Hidden

  if (-not (Wait-ForHttpReady -Url $FrontendUrl -Timeout $TimeoutSeconds)) {
    throw "guardian-web preview nao respondeu em $FrontendUrl dentro de ${TimeoutSeconds}s"
  }

  Write-Host '[GDN-308] Executando suite Playwright de responsividade/visual guardian...' -ForegroundColor Cyan
  npx playwright test e2e/guardian-responsive-visual.spec.ts --project=chromium --reporter=list

  if ($LASTEXITCODE -ne 0) {
    throw "Playwright retornou codigo $LASTEXITCODE"
  }

  Write-Host '[GDN-308] Validacao concluida com sucesso.' -ForegroundColor Green
}
finally {
  if ($previewProcess -and -not $previewProcess.HasExited) {
    Write-Host '[GDN-308] Encerrando guardian-web preview...' -ForegroundColor Yellow
    Stop-Process -Id $previewProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
