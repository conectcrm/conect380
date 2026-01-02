# 🎯 SOLUÇÃO DEFINITIVA: Limpar HSTS do Chrome

Write-Host "🔧 LIMPANDO HSTS DO CHROME" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "O Chrome está forçando HTTPS devido ao cache HSTS." -ForegroundColor White
Write-Host "Siga os passos abaixo EXATAMENTE:" -ForegroundColor White
Write-Host ""

Write-Host "1️⃣ LIMPAR HSTS (PASSO CRÍTICO):" -ForegroundColor Cyan
Write-Host "   a) Abrir NOVA aba no Chrome" -ForegroundColor White
Write-Host "   b) Copiar e colar na barra de endereço:" -ForegroundColor White
Write-Host ""
Write-Host "      chrome://net-internals/#hsts" -ForegroundColor Yellow
Write-Host ""
Write-Host "   c) Pressionar ENTER" -ForegroundColor White
Write-Host "   d) Rolar até a seção 'Delete domain security policies'" -ForegroundColor White
Write-Host "   e) No campo 'Domain', digitar:" -ForegroundColor White
Write-Host ""
Write-Host "      localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "   f) Clicar no botão 'Delete'" -ForegroundColor White
Write-Host "   g) Deve aparecer 'Success' ou ficar em branco (significa que deletou)" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ LIMPAR DADOS DO SITE:" -ForegroundColor Cyan
Write-Host "   a) Abrir nova aba e colar:" -ForegroundColor White
Write-Host ""
Write-Host "      chrome://settings/content/all?searchSubpage=localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "   b) Procurar por 'localhost:3000' e 'localhost:3001'" -ForegroundColor White
Write-Host "   c) Clicar no ícone da lixeira ao lado de cada um" -ForegroundColor White
Write-Host "   d) Confirmar remoção" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ FECHAR TODAS AS ABAS:" -ForegroundColor Cyan
Write-Host "   • Fechar TODAS as abas do sistema (localhost:3000)" -ForegroundColor White
Write-Host "   • Fechar também as abas chrome://net-internals e chrome://settings" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣ ABRIR NOVA ABA E ACESSAR:" -ForegroundColor Cyan
Write-Host ""
Write-Host "      http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "   (IMPORTANTE: digitar 'http://' no início)" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣ VERIFICAÇÃO FINAL:" -ForegroundColor Cyan
Write-Host "   • Abrir Console (F12)" -ForegroundColor White
Write-Host "   • Verificar se ainda aparece 'ERR_SSL_PROTOCOL_ERROR'" -ForegroundColor White
Write-Host "   • Se sim: repetir passos 1-4" -ForegroundColor White
Write-Host "   • Se não: Fazer login normalmente" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "🎯 ALTERNATIVA RÁPIDA (se os passos acima não funcionarem):" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "Opção A: Usar aba anônima sempre" -ForegroundColor Cyan
Write-Host "   • Ctrl+Shift+N" -ForegroundColor White
Write-Host "   • Acessar: http://localhost:3000" -ForegroundColor White
Write-Host "   • Fazer login" -ForegroundColor White
Write-Host ""
Write-Host "Opção B: Usar Opera" -ForegroundColor Cyan
Write-Host "   • Opera já funciona perfeitamente" -ForegroundColor White
Write-Host ""
Write-Host "Opção C: Resetar configurações do Chrome" -ForegroundColor Cyan
Write-Host "   1. Fechar TODOS os Chromes" -ForegroundColor White
Write-Host "   2. Abrir e colar:" -ForegroundColor White
Write-Host ""
Write-Host "      chrome://settings/resetProfileSettings" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Clicar em 'Reset settings'" -ForegroundColor White
Write-Host "   4. Confirmar" -ForegroundColor White
Write-Host "   5. Acessar: http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "✅ Instruções prontas!" -ForegroundColor Green
Write-Host ""
