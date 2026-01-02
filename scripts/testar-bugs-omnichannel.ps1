# 🧪 Script de Teste Automatizado - Bugs Omnichannel

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE DOS BUGS OMNICHANNEL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se servidores estão rodando
Write-Host "📡 Verificando servidores..." -ForegroundColor Yellow
$backend = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
$frontend = netstat -ano | Select-String ":3000" | Select-String "LISTENING"

if ($backend) {
  Write-Host "✅ Backend rodando (porta 3001)" -ForegroundColor Green
}
else {
  Write-Host "❌ Backend NÃO está rodando!" -ForegroundColor Red
  Write-Host "   Execute: cd backend && npm run start:dev" -ForegroundColor Yellow
  exit 1
}

if ($frontend) {
  Write-Host "✅ Frontend rodando (porta 3000)" -ForegroundColor Green
}
else {
  Write-Host "❌ Frontend NÃO está rodando!" -ForegroundColor Red
  Write-Host "   Execute: cd frontend-web && npm start" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 CHECKLIST DE TESTES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Abrir documentação de testes
Write-Host "📖 Abrindo guia de testes..." -ForegroundColor Yellow
if (Test-Path "docs/GUIA_TESTE_BUGS_OMNICHANNEL.md") {
  code "docs/GUIA_TESTE_BUGS_OMNICHANNEL.md"
  Write-Host "✅ Guia aberto no VS Code" -ForegroundColor Green
}
else {
  Write-Host "⚠️  Guia não encontrado em docs/" -ForegroundColor Yellow
}

Write-Host ""

# Abrir navegador
Write-Host "🌐 Abrindo aplicação no navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"
Write-Host "✅ Navegador aberto" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎯 INSTRUÇÕES DE TESTE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Fazer login:" -ForegroundColor White
Write-Host "   📧 Email: admin@conectsuite.com.br" -ForegroundColor Gray
Write-Host "   🔑 Senha: admin123" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Navegar:" -ForegroundColor White
Write-Host "   Menu → Atendimento → Chat Omnichannel" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 1: SCROLL AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Cenário 1: Abrir chat com muitas mensagens" -ForegroundColor White
Write-Host "  → Deve fazer scroll INSTANTÂNEO até o final" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Cenário 2: Rolar para cima e receber mensagem" -ForegroundColor White
Write-Host "  → NÃO deve fazer scroll (não interromper leitura)" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Cenário 3: Estar no final e receber mensagem" -ForegroundColor White
Write-Host "  → Deve fazer scroll SUAVE até nova mensagem" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 2: PROGRESS BAR" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Cenário 1: Anexar arquivo pequeno (<1MB)" -ForegroundColor White
Write-Host "  → Progress bar aparece brevemente" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Cenário 2: Anexar arquivo grande (10-50MB)" -ForegroundColor White
Write-Host "  → Progress bar mostra 0% → 100% em tempo real" -ForegroundColor Gray
Write-Host "  → Cor: #159A9C (teal Crevasse)" -ForegroundColor Gray
Write-Host "  → Texto: 'Enviando arquivo... X%'" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 3: WEBSOCKET RECONNECTION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Cenário 1: Desconectar rede" -ForegroundColor White
Write-Host "  1. Abrir DevTools (F12) → Console" -ForegroundColor Gray
Write-Host "  2. Desligar Wi-Fi" -ForegroundColor Gray
Write-Host "  3. Ver log: '⚠️ WebSocket desconectado'" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Cenário 2: Reconectar rede" -ForegroundColor White
Write-Host "  1. Ligar Wi-Fi" -ForegroundColor Gray
Write-Host "  2. Ver logs: '🔄 Tentativa de reconexão...'" -ForegroundColor Gray
Write-Host "  3. Ver log: '✅ WebSocket conectado'" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ CHECKLIST FINAL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[ ] Console sem erros vermelhos (F12 → Console)" -ForegroundColor White
Write-Host "[ ] Network tab: requisições 200/201 (F12 → Network)" -ForegroundColor White
Write-Host "[ ] Animações suaves e responsivas" -ForegroundColor White
Write-Host "[ ] Design consistente (cores Crevasse)" -ForegroundColor White
Write-Host "[ ] Testado em Desktop, Tablet, Mobile" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📊 REPORTAR RESULTADOS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Se todos os testes passarem:" -ForegroundColor Green
Write-Host "   → Marcar bugs como ✅ Testados" -ForegroundColor Gray
Write-Host "   → Fazer commit das alterações" -ForegroundColor Gray
Write-Host "   → Feature pronta para produção!" -ForegroundColor Gray
Write-Host ""

Write-Host "❌ Se encontrar problemas:" -ForegroundColor Red
Write-Host "   → Reportar em: docs/BUGS_ENCONTRADOS.md" -ForegroundColor Gray
Write-Host "   → Incluir: screenshot, logs, passos para reproduzir" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🚀 BOA SORTE NOS TESTES!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Aguardar input do usuário
Write-Host "Pressione qualquer tecla para abrir o Console do Chrome..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Instruções para abrir DevTools
Write-Host ""
Write-Host "💡 DICA: Para abrir Console do Chrome:" -ForegroundColor Cyan
Write-Host "   1. Clique no navegador" -ForegroundColor Gray
Write-Host "   2. Pressione F12" -ForegroundColor Gray
Write-Host "   3. Vá para aba 'Console'" -ForegroundColor Gray
Write-Host ""
Write-Host "   Ou clique com botão direito → Inspecionar → Console" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Ambiente de teste pronto!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
