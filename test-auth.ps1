try {
  Write-Host "🔐 Testando autenticação simples..."
  
  $loginData = @{
    email = "admin@conectcrm.com"
    password = "password"
  }
  
  $json = $loginData | ConvertTo-Json
  Write-Host "📤 Enviando login: $json"
  
  $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body $json
  
  Write-Host "✅ Status Code: $($response.StatusCode)"
  Write-Host "📦 Response Content: $($response.Content)"
  
} catch {
  Write-Host "❌ Erro: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseContent = $reader.ReadToEnd()
    Write-Host "📋 Response Content: $responseContent"
  }
}
