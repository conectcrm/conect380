# Script para corrigir os últimos erros

$file = "c:\Projetos\conectcrm\backend\src\modules\atendimento\services\orquestrador.service.ts"

$content = Get-Content $file -Raw

# Corrigir chamadas de registrarHistorico
$content = $content -replace "'mensagem_recebida'", "TipoHistorico.NOTA"
$content = $content -replace "'ticket_criado'", "TipoHistorico.CRIACAO"
$content = $content -replace "'ticket_atribuido'", "TipoHistorico.ATRIBUICAO"
$content = $content -replace "'recebida',", "TipoMensagem.TEXTO,"
$content = $content -replace "tipo: 'enviada',", "tipo: TipoMensagem.TEXTO,"

# Corrigir status de mensagens
$content = $content -replace "webhook\.status\.status", "StatusMensagem.ENVIADA"

Set-Content $file $content

Write-Host "Arquivo corrigido!" -ForegroundColor Green
