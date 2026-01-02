# 🧹 Script para remover TODOS os logs DEBUG do frontend

Write-Host "🧹 Removendo logs DEBUG..." -ForegroundColor Yellow

$arquivos = @(
  "frontend-web\src\contexts\AuthContext.tsx",
  "frontend-web\src\services\api.ts",
  "frontend-web\src\features\atendimento\omnichannel\components\AtendimentosSidebar.tsx",
  "frontend-web\src\hooks\useAtendimentos.ts",
  "frontend-web\src\hooks\useMensagens.ts",
  "frontend-web\src\hooks\useWebSocket.ts",
  "frontend-web\src\features\atendimento\omnichannel\ChatOmnichannel.tsx",
  "frontend-web\src\services\atendimentoService.ts"
)

$padroes = @(
  "const DEBUG = process\.env\.NODE_ENV === 'development';",
  "if \(DEBUG\) console\.log\([^\)]+\);",
  "if \(DEBUG\) \{[^}]+\}",
  "if \(!DEBUG\) return;"
)

foreach ($arquivo in $arquivos) {
  $caminhoCompleto = Join-Path $PSScriptRoot $arquivo
    
  if (Test-Path $caminhoCompleto) {
    Write-Host "  📝 Processando: $arquivo" -ForegroundColor Cyan
        
    $conteudo = Get-Content $caminhoCompleto -Raw
    $conteudoOriginal = $conteudo
        
    # Remover padrões um por um
    foreach ($padrao in $padroes) {
      $conteudo = $conteudo -replace $padrao, ''
    }
        
    # Remover linhas vazias extras
    $conteudo = $conteudo -replace '(\r?\n){3,}', "`n`n"
        
    if ($conteudo -ne $conteudoOriginal) {
      Set-Content -Path $caminhoCompleto -Value $conteudo -NoNewline
      Write-Host "    ✅ Logs removidos!" -ForegroundColor Green
    }
    else {
      Write-Host "    ⏭️  Nenhuma alteração necessária" -ForegroundColor Gray
    }
  }
  else {
    Write-Host "    ⚠️  Arquivo não encontrado: $arquivo" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "💡 Execute 'npm start' para recompilar o frontend" -ForegroundColor Cyan
