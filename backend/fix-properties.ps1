# Script para corrigir propriedades incorretas

$basePath = "c:\Projetos\conectcrm\backend\src\modules\atendimento"

# Arquivos específicos para corrigir
$files = @(
  "$basePath\services\orquestrador.service.ts",
  "$basePath\controllers\tickets.controller.ts",
  "$basePath\processors\webhook.processor.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Corrigindo $file..." -ForegroundColor Cyan
        
    $content = Get-Content $file -Raw
        
    # Substituir tipoEvento por tipo
    $content = $content -replace "tipoEvento:", "tipo:"
    $content = $content -replace "tipoEvento,", "tipo,"
        
    Set-Content $file $content
    Write-Host "✅ $file corrigido" -ForegroundColor Green
  }
}

Write-Host "`n✅ Correções aplicadas!" -ForegroundColor Green
