# Script para gerar PDF do Pitch Deck ConectCRM
# Versão: 1.0.0
# Data: 12/11/2025

param(
  [string]$SourceFile = "PITCH_DECK_INVESTIDORES.md",
  [string]$OutputFile = "ConectCRM_Pitch_Deck.pdf"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📄 Gerador de PDF - Pitch Deck" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar se arquivo fonte existe
if (-not (Test-Path $SourceFile)) {
  Write-Host "❌ Erro: Arquivo $SourceFile não encontrado!" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Arquivo fonte encontrado: $SourceFile" -ForegroundColor Green

# Verificar ferramentas disponíveis
$pandocInstalled = Get-Command pandoc -ErrorAction SilentlyContinue
$mdToPdfInstalled = Get-Command markdown-pdf -ErrorAction SilentlyContinue
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue

Write-Host "`n🔍 Verificando ferramentas instaladas..." -ForegroundColor Yellow

# Método 1: Pandoc (recomendado)
if ($pandocInstalled) {
  Write-Host "✅ Pandoc encontrado!" -ForegroundColor Green
  Write-Host "`n📝 Gerando PDF com Pandoc..." -ForegroundColor Cyan
    
  try {
    pandoc $SourceFile -o $OutputFile `
      --pdf-engine=xelatex `
      -V geometry:margin=1in `
      -V fontsize=11pt `
      -V colorlinks=true `
      -V linkcolor=blue `
      -V urlcolor=blue `
      --toc `
      --toc-depth=2 `
      2>&1 | Out-Null
        
    if (Test-Path $OutputFile) {
      $fileSize = (Get-Item $OutputFile).Length / 1MB
      Write-Host "✅ PDF gerado com sucesso!" -ForegroundColor Green
      Write-Host "   📄 Arquivo: $OutputFile" -ForegroundColor White
      Write-Host "   📊 Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
            
      # Abrir PDF
      Start-Process $OutputFile
      exit 0
    }
  }
  catch {
    Write-Host "⚠️ Erro ao gerar PDF com Pandoc: $_" -ForegroundColor Yellow
  }
}
else {
  Write-Host "⚠️ Pandoc não instalado" -ForegroundColor Yellow
}

# Método 2: markdown-pdf (Node.js)
if ($nodeInstalled -and $mdToPdfInstalled) {
  Write-Host "✅ Node.js + markdown-pdf encontrado!" -ForegroundColor Green
  Write-Host "`n📝 Gerando PDF com markdown-pdf..." -ForegroundColor Cyan
    
  try {
    markdown-pdf $SourceFile -o $OutputFile
        
    if (Test-Path $OutputFile) {
      $fileSize = (Get-Item $OutputFile).Length / 1MB
      Write-Host "✅ PDF gerado com sucesso!" -ForegroundColor Green
      Write-Host "   📄 Arquivo: $OutputFile" -ForegroundColor White
      Write-Host "   📊 Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
            
      # Abrir PDF
      Start-Process $OutputFile
      exit 0
    }
  }
  catch {
    Write-Host "⚠️ Erro ao gerar PDF com markdown-pdf: $_" -ForegroundColor Yellow
  }
}

# Método 3: Alternativa - Criar HTML e usar print to PDF
Write-Host "`n⚠️ Nenhuma ferramenta de conversão encontrada!" -ForegroundColor Yellow
Write-Host "`n📋 OPÇÕES PARA GERAR PDF:`n" -ForegroundColor Cyan

Write-Host "OPÇÃO 1 - Instalar Pandoc (RECOMENDADO):" -ForegroundColor Green
Write-Host "  1. Baixar: https://pandoc.org/installing.html"
Write-Host "  2. Instalar: pandoc-2.19.2-windows-x86_64.msi"
Write-Host "  3. Executar novamente este script`n"

Write-Host "OPÇÃO 2 - Usar VSCode:" -ForegroundColor Green
Write-Host "  1. Instalar extensão: 'Markdown PDF' (yzane.markdown-pdf)"
Write-Host "  2. Abrir $SourceFile no VSCode"
Write-Host "  3. Ctrl+Shift+P → 'Markdown PDF: Export (pdf)'"
Write-Host "  4. Arquivo será salvo na mesma pasta`n"

Write-Host "OPÇÃO 3 - Online (rápido):" -ForegroundColor Green
Write-Host "  1. Acessar: https://www.markdowntopdf.com/"
Write-Host "  2. Upload: $SourceFile"
Write-Host "  3. Download: PDF gerado`n"

Write-Host "OPÇÃO 4 - Google Chrome:" -ForegroundColor Green
Write-Host "  1. Instalar extensão: 'Markdown Viewer'"
Write-Host "  2. Abrir $SourceFile no Chrome"
Write-Host "  3. Ctrl+P → 'Salvar como PDF'`n"

Write-Host "OPÇÃO 5 - Node.js (para desenvolvedores):" -ForegroundColor Green
Write-Host "  npm install -g markdown-pdf"
Write-Host "  markdown-pdf $SourceFile -o $OutputFile`n"

# Gerar HTML como fallback
$htmlFile = $OutputFile -replace '\.pdf$', '.html'
Write-Host "📝 Gerando HTML como alternativa..." -ForegroundColor Cyan

try {
  $content = Get-Content $SourceFile -Raw -Encoding UTF8
    
  $html = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConectCRM - Pitch Deck</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        h1 { font-size: 2.5em; color: #159A9C; margin: 40px 0 20px; border-bottom: 3px solid #159A9C; padding-bottom: 10px; }
        h2 { font-size: 2em; color: #002333; margin: 30px 0 15px; }
        h3 { font-size: 1.5em; color: #159A9C; margin: 25px 0 10px; }
        h4 { font-size: 1.2em; color: #002333; margin: 20px 0 10px; }
        p { margin: 10px 0; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #159A9C;
            color: white;
            font-weight: 600;
        }
        tr:hover { background: #f5f5f5; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #002333;
            color: #fff;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 20px 0;
        }
        blockquote {
            border-left: 4px solid #159A9C;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #666;
        }
        .slide {
            background: white;
            padding: 40px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        ul, ol { margin: 15px 0 15px 30px; }
        li { margin: 5px 0; }
        strong { color: #159A9C; }
        .emoji { font-size: 1.2em; }
        @media print {
            body { background: white; }
            .slide { box-shadow: none; page-break-after: always; }
            h1 { color: #159A9C; }
        }
    </style>
</head>
<body>
    <div class="content">
$($content -replace '(?m)^# ', '<h1>' -replace '(?m)^## ', '</div><div class="slide"><h2>' -replace '(?m)^### ', '<h3>' -replace '(?m)^#### ', '<h4>' -replace '(?m)^- ', '<li>' -replace '\n\n', '</p><p>' -replace '\*\*([^*]+)\*\*', '<strong>$1</strong>')
    </div>
</body>
</html>
"@

  $html | Out-File -FilePath $htmlFile -Encoding UTF8
    
  Write-Host "✅ HTML gerado com sucesso!" -ForegroundColor Green
  Write-Host "   📄 Arquivo: $htmlFile" -ForegroundColor White
  Write-Host "`n💡 Abra o HTML no Chrome e use Ctrl+P para salvar como PDF" -ForegroundColor Cyan
    
  # Abrir HTML no navegador padrão
  Start-Process $htmlFile
    
}
catch {
  Write-Host "❌ Erro ao gerar HTML: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host ""
