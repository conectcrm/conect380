# Requer privilégios de administrador
# Crie regras de firewall para permitir acesso externo

New-NetFirewallRule -DisplayName "ConectCRM Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "ConectCRM Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

Write-Host "✅ Regras de firewall criadas com sucesso!" -ForegroundColor Green
Write-Host "   - ConectCRM Backend (porta 3001)" -ForegroundColor White
Write-Host "   - ConectCRM Frontend (porta 3000)" -ForegroundColor White
