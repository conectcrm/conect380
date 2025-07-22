Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚫 DESABILITANDO EXTENSÕES PESADAS" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 EXTENSÕES DETECTADAS ATIVAS:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host "• Recursos de Linguagem TypeScript e JavaScript (2857ms)"
Write-Host "• Recursos de Linguagem CSS (2850ms)"
Write-Host "• GitHub Copilot (3315ms)" 
Write-Host "• GIT Base (3024ms)"
Write-Host "• Dev Containers (2806ms)"
Write-Host "• Suporte NPM para VS Code (2766ms)"
Write-Host "• Emmet (2740ms)"
Write-Host "• Recursos de Linguagem JSON (3004ms)"
Write-Host ""

Write-Host "🎯 RECOMENDAÇÕES DE DESABILITAÇÃO:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔴 EXTENSÕES PARA DESABILITAR (pesadas e desnecessárias no modo editor):" -ForegroundColor Red
Write-Host "• Recursos de Linguagem TypeScript e JavaScript"
Write-Host "• Recursos de Linguagem CSS" 
Write-Host "• Recursos de Linguagem JSON"
Write-Host "• Dev Containers"
Write-Host "• Suporte NPM para VS Code"
Write-Host "• Emmet"
Write-Host ""

Write-Host "🟡 EXTENSÕES PARA MANTER (úteis mas configurar):" -ForegroundColor Yellow  
Write-Host "• GitHub Copilot (manter, mas configurar para menor uso)"
Write-Host "• GIT Base (manter, mas já configurado para não fazer análise)"
Write-Host ""

Write-Host "📝 COMO DESABILITAR MANUALMENTE:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "1. No VS Code: Ctrl+Shift+X (abrir extensões)"
Write-Host "2. Procure cada extensão na lista"
Write-Host "3. Clique na engrenagem ⚙️ da extensão"
Write-Host "4. Selecione 'Desabilitar'"
Write-Host "5. Reinicie o VS Code: Ctrl+Shift+P → Reload Window"
Write-Host ""

Write-Host "🤖 CONFIGURAÇÃO ADICIONAL GITHUB COPILOT:" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "• Mantenha ativo (é útil para código)"
Write-Host "• Mas configure para menor impacto na performance"
Write-Host ""

Write-Host "⚡ RESULTADO ESPERADO APÓS DESABILITAÇÃO:" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "• Redução de ~15 segundos no startup"
Write-Host "• Economia de ~500MB+ de RAM"
Write-Host "• VS Code ainda mais responsivo"
Write-Host "• Foco total na edição de código"
Write-Host ""

Write-Host "💡 DICA IMPORTANTE:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host "Após desabilitar, execute os processos externos:"
Write-Host ".\executar-processos-externos.ps1"
Write-Host ""

Write-Host "🎯 Configuração de editor puro quase completa!" -ForegroundColor Green
