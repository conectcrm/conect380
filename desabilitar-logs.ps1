# 🔇 Script para Desabilitar Logs DEBUG

Write-Host "🔇 Desabilitando todos os logs DEBUG..." -ForegroundColor Yellow
Write-Host ""

$arquivos = @(
  "frontend-web\src\features\atendimento\omnichannel\hooks\useWebSocket.ts",
  "frontend-web\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts",
  "frontend-web\src\features\atendimento\omnichannel\hooks\useMensagens.ts",
  "frontend-web\src\features\atendimento\omnichannel\hooks\useContextoCliente.ts",
  "frontend-web\src\features\atendimento\omnichannel\ChatOmnichannel.tsx",
  "frontend-web\src\services\api.ts",
  "frontend-web\src\services\atendimentoService.ts"
)

$count = 0

foreach ($arquivo in $arquivos) {
  $caminhoCompleto = Join-Path $PSScriptRoot $arquivo
    
  if (Test-Path $caminhoCompleto) {
    $conteudo = Get-Content $caminhoCompleto -Raw
    $antigoValor = "const DEBUG = process.env.NODE_ENV === 'development';"
    $novoValor = "const DEBUG = false; // 🔇 Logs desabilitados"
    $novoConteudo = $conteudo -replace [regex]::Escape($antigoValor), $novoValor
        
    if ($conteudo -ne $novoConteudo) {
      Set-Content -Path $caminhoCompleto -Value $novoConteudo -NoNewline
      Write-Host "  ✅ $arquivo" -ForegroundColor Green
      $count++
    }
    else {
      Write-Host "  ⏭️  $arquivo (já desabilitado)" -ForegroundColor Gray
    }
  }
  else {
    Write-Host "  ⚠️  $arquivo (não encontrado)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "✅ $count arquivos atualizados!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Próximo passo:" -ForegroundColor Cyan
Write-Host "   cd frontend-web" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
