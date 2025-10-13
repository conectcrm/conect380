# Script para corrigir chamadas de registrarHistorico

$file = "c:\Projetos\conectcrm\backend\src\modules\atendimento\services\orquestrador.service.ts"

$content = Get-Content $file -Raw

# Substituir as chamadas de registrarHistorico
$content = $content -replace "await this\.registrarHistorico\(ticket\.id, TipoHistorico\.NOTA, \{[^}]+\}\);", 
"await this.registrarHistorico(ticket.id, TipoHistorico.NOTA, 'Nova mensagem recebida');"

$content = $content -replace "await this\.registrarHistorico\(ticket\.id, TipoHistorico\.CRIACAO, \{[^}]+\}\);",
"await this.registrarHistorico(ticket.id, TipoHistorico.CRIACAO, 'Ticket criado');"

$content = $content -replace "await this\.registrarHistorico\(ticket\.id, TipoHistorico\.ATRIBUICAO, \{[^}]+\}\);",
"await this.registrarHistorico(ticket.id, TipoHistorico.ATRIBUICAO, 'Ticket atribuído automaticamente');"

Set-Content $file $content

Write-Host "Corrigido!" -ForegroundColor Green
