param(
    [string]$UserId = 'f9e51bf4-930c-4964-bba7-6f538ea10bc5',
    [string]$SenhaAntiga = 'Temp2025qcy',
    [string]$SenhaNova = '123456',
    [int]$StartupDelaySeconds = 5
)

$backendPath = Join-Path $PSScriptRoot '..' 'backend'
$nodeExe = 'node'
$serverArgs = 'dist/src/main.js'
$serverProcess = $null

try {
    Write-Host '🚀 Iniciando backend temporário...' -ForegroundColor Cyan
    $serverProcess = Start-Process -FilePath $nodeExe -ArgumentList $serverArgs -WorkingDirectory $backendPath -PassThru -WindowStyle Hidden

    Write-Host "⏳ Aguardando $StartupDelaySeconds s pelo bootstrap..." -ForegroundColor Yellow
    Start-Sleep -Seconds $StartupDelaySeconds

    $payload = @{ userId = $UserId; senhaAntiga = $SenhaAntiga; senhaNova = $SenhaNova } | ConvertTo-Json -Compress

    Write-Host '🔐 Enviando POST /auth/trocar-senha' -ForegroundColor Cyan
    $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/trocar-senha' -Body $payload -ContentType 'application/json'

    Write-Host '✅ Resposta recebida:' -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host '❌ Erro durante o teste:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor DarkRed
    }
}
finally {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Write-Host '🛑 Encerrando backend temporário...' -ForegroundColor Yellow
        Stop-Process -Id $serverProcess.Id -Force
    }
}
