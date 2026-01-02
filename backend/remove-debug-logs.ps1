# Script para remover logs de debug desnecessários
$files = @(
    'backend/src/modules/atendimento/controllers/*.controller.ts',
    'backend/src/modules/atendimento/services/*.service.ts',
    'backend/src/cotacao/cotacao.controller.ts'
)

$patternsToRemove = @(
    "console\.log\('\u2705 \[.*?Controller\] .*?criado.*?'\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] GET .*? chamado.*?'\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] POST .*? chamado.*?'\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] PUT .*? chamado.*?'\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] DELETE .*? chamado.*?'\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] DTO:', .*?\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] ID:', .*?\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] Tipo:', .*?\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] empresaId:', .*?\);?",
    "console\.log\('\ud83d\udd0d \[.*?\] req\.user:', .*?\);?",
    "console\.log\('\u2705 \[.*?\] .*? encontrados?:', .*?\);?"
)

Write-Host 'Arquivos que ser\u00e3o processados:' -ForegroundColor Yellow
Get-ChildItem -Path backend/src/modules/atendimento/controllers -Filter *.controller.ts | Select-Object Name

Write-Host "
Pressione Enter para continuar ou Ctrl+C para cancelar..." -ForegroundColor Yellow
Read-Host
