param(
  [string]$BackendDir = 'c:\Projetos\conectcrm\backend',
  [string]$Port = '3001',
  [string]$Email = 'admin@conectsuite.com.br',
  [string]$Senha = 'admin123'
)
$ErrorActionPreference = 'Stop'

function Wait-Port {
  param([string]$port, [int]$retries = 30)
  for ($i = 0; $i -lt $retries; $i++) {
    $tnc = Test-NetConnection -ComputerName 'localhost' -Port $port -WarningAction SilentlyContinue
    if ($tnc.TcpTestSucceeded) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

Write-Host '🔎 Validando porta' -ForegroundColor Cyan
$up = Wait-Port -port $Port -retries 10
if (-not $up) {
  Write-Host '🚀 Subindo backend com Start-Process...' -ForegroundColor Yellow
  $p = Start-Process -FilePath 'node' -ArgumentList 'dist/src/main.js' -WorkingDirectory $BackendDir -PassThru -WindowStyle Hidden
  Write-Host ("➡️  Processo Node iniciado. PID=" + $p.Id)
  Start-Sleep -Milliseconds 500
  $up = Wait-Port -port $Port -retries 30
}

if (-not $up) {
  Write-Error "Porta $Port não respondeu. Verifique logs do backend."
}

Write-Host "✅ Porta $Port em escuta" -ForegroundColor Green

# Login
$body = @{ email = $Email; senha = $Senha } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Method Post -Uri "http://localhost:$Port/auth/login" -Headers @{ Accept = 'application/json' } -Body $body -ContentType 'application/json'
}
catch {
  Write-Error "Falha no login: $($_.Exception.Message)"
}

$token = $resp.data.access_token
if (-not $token) { throw 'Sem token no login' }
Write-Host ('🔐 Token prefix: ' + $token.Substring(0, 15)) -ForegroundColor Green

# Teste /faturamento/faturas
$r1 = Invoke-RestMethod -Method Get -Uri "http://localhost:$Port/faturamento/faturas?page=1&pageSize=5&sortBy=createdAt&sortOrder=DESC" -Headers @{ Authorization = ("Bearer $token") }
$keys1 = ($r1 | Get-Member -MemberType NoteProperty | Select-Object -Expand Name)
Write-Host ('/faturamento/faturas keys: ' + ($keys1 -join ', ')) -ForegroundColor Cyan
if ($r1.aggregates) { Write-Host ('faturas.aggregates: ' + ($r1.aggregates | ConvertTo-Json -Compress)) -ForegroundColor Yellow } else { Write-Host 'faturas sem aggregates' -ForegroundColor DarkYellow }

# Teste /faturamento/faturas/paginadas
$r2 = Invoke-RestMethod -Method Get -Uri "http://localhost:$Port/faturamento/faturas/paginadas?page=1&pageSize=5&sortBy=createdAt&sortOrder=DESC" -Headers @{ Authorization = ("Bearer $token") }
$dk = ($r2.data | Get-Member -MemberType NoteProperty | Select-Object -Expand Name)
Write-Host ('/faturamento/faturas/paginadas data keys: ' + ($dk -join ', ')) -ForegroundColor Cyan
Write-Host ("items=$($r2.data.items.Count) total=$($r2.data.total) page=$($r2.data.page) pageSize=$($r2.data.pageSize)") -ForegroundColor Green
if ($r2.data.aggregates) { Write-Host ('aggregates: ' + ($r2.data.aggregates | ConvertTo-Json -Compress)) -ForegroundColor Green } else { Write-Host 'sem aggregates' -ForegroundColor Yellow }
