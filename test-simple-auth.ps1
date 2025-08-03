Write-Host "🔐 Testando autenticação..."

$loginData = @{
  email = "admin@conectcrm.com"
  password = "password"
} | ConvertTo-Json

Write-Host "📤 Dados: $loginData"

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body $loginData
  Write-Host "✅ Status: $($response.StatusCode)"
  Write-Host "📦 Content: $($response.Content)"
} catch {
  Write-Host "❌ Erro: $($_.Exception.Message)"
}
