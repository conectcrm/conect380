# Script para corrigir enums em todos os arquivos do módulo atendimento

$basePath = "c:\Projetos\conectcrm\backend\src\modules\atendimento"

# Arquivos para corrigir
$files = @(
  "$basePath\controllers\tickets.controller.ts",
  "$basePath\controllers\atendentes.controller.ts",
  "$basePath\services\orquestrador.service.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Corrigindo $file..." -ForegroundColor Cyan
        
    $content = Get-Content $file -Raw
        
    # Substituições de Status
    $content = $content -replace "status: 'aguardando'", "status: StatusTicket.AGUARDANDO"
    $content = $content -replace "status === 'aguardando'", "status === StatusTicket.AGUARDANDO"
    $content = $content -replace "status: 'em_atendimento'", "status: StatusTicket.EM_ATENDIMENTO"
    $content = $content -replace "status === 'em_atendimento'", "status === StatusTicket.EM_ATENDIMENTO"
    $content = $content -replace "status: 'resolvido'", "status: StatusTicket.RESOLVIDO"
    $content = $content -replace "status === 'resolvido'", "status === StatusTicket.RESOLVIDO"
    $content = $content -replace "status: 'fechado'", "status: StatusTicket.FECHADO"
        
    # Atendente status
    $content = $content -replace "status: 'online'", "status: StatusAtendente.ONLINE"
    $content = $content -replace "status === 'online'", "status === StatusTicket.ONLINE"
    $content = $content -replace "status: 'offline'", "status: StatusAtendente.OFFLINE"
        
    # TipoMensagem e Remetente
    $content = $content -replace "tipo: 'enviada'", "tipo: TipoMensagem.TEXTO"
    $content = $content -replace "tipo: 'recebida'", "tipo: TipoMensagem.TEXTO"
    $content = $content -replace "tipo === 'recebida'", "remetente === RemetenteEnum.CLIENTE"
    $content = $content -replace "tipo === 'enviada'", "remetente === RemetenteEnum.ATENDENTE"
    $content = $content -replace "remetente: 'atendente'", "remetente: RemetenteEnum.ATENDENTE"
    $content = $content -replace "remetente: 'cliente'", "remetente: RemetenteEnum.CLIENTE"
        
    Set-Content $file $content
    Write-Host "✅ $file corrigido" -ForegroundColor Green
  }
}

Write-Host "`n✅ Correções aplicadas!" -ForegroundColor Green
