Write-Host '========================================' -ForegroundColor Cyan
Write-Host 'SIMULACAO DE ATENDIMENTO VIA BOT' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

Write-Host '[1/3] Verificando backend...' -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/health' -Method Get
    Write-Host 'OK Backend online' -ForegroundColor Green
} catch {
    Write-Host 'ERRO Backend nao respondeu' -ForegroundColor Red
    exit 1
}

Write-Host '[2/3] Buscando empresa...' -ForegroundColor Yellow
try {
    $empresas = Invoke-RestMethod -Uri 'http://localhost:3001/empresas' -Method Get
    $empresa = $empresas[0]
    Write-Host "OK Empresa: $($empresa.nome)" -ForegroundColor Green
} catch {
    Write-Host 'ERRO ao buscar empresas' -ForegroundColor Red
    exit 1
}

Write-Host '[3/3] Buscando nucleos visiveis...' -ForegroundColor Yellow
try {
    $nucleos = Invoke-RestMethod -Uri 'http://localhost:3001/nucleos-atendimento' -Method Get
    $nucleosVisiveis = $nucleos | Where-Object { $_.visivelNoBot -eq $true -and $_.ativo -eq $true }
    Write-Host "OK $($nucleosVisiveis.Count) nucleos visiveis no bot" -ForegroundColor Green
    foreach ($n in $nucleosVisiveis) {
        Write-Host "   - $($n.nome)" -ForegroundColor White
    }
} catch {
    Write-Host 'ERRO ao buscar nucleos' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'SISTEMA DE ATENDIMENTO: PRONTO!' -ForegroundColor Green
