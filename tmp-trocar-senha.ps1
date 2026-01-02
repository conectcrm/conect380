$payload = @{ userId = 'f9e51bf4-930c-4964-bba7-6f538ea10bc5'; senhaAntiga = 'Temp2025qcy'; senhaNova = '123456' } | ConvertTo-Json -Compress
$response = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/trocar-senha' -Body $payload -ContentType 'application/json' -ErrorAction Stop
$response | ConvertTo-Json -Depth 5