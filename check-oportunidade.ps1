# Verificar dados da oportunidade 4
$baseUrl = "http://localhost:3001"

# Login
$loginBody = @{
  email    = "admin@conectsuite.com.br"
  password = "admin123"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $auth.data.access_token

# Buscar oportunidade
$headers = @{ Authorization = "Bearer $token" }
$opp = Invoke-RestMethod -Uri "$baseUrl/oportunidades/4" -Headers $headers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DADOS DA OPORTUNIDADE 4" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Título:     " -NoNewline; Write-Host $opp.titulo -ForegroundColor Yellow
Write-Host "Nome:       " -NoNewline; Write-Host $opp.nomeContato -ForegroundColor Green
Write-Host "Email:      " -NoNewline; Write-Host $opp.emailContato -ForegroundColor Green
Write-Host "Telefone:   " -NoNewline; Write-Host $opp.telefoneContato -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
