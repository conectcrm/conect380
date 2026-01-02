# ============================================
# Script Simplificado - Criar Canal E-mail
# ============================================

Write-Host "`n📧 CRIANDO CANAL DE E-MAIL" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

Write-Host "⏳ Aguardando backend estar pronto (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n🚀 Chamando endpoint de setup..." -ForegroundColor Cyan

try {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/setup/criar-canal-email" -Method POST
    
  if ($response.success) {
    Write-Host "`n✅ SUCESSO!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host $response.message -ForegroundColor White
        
    if ($response.dados) {
      Write-Host "`n📊 Detalhes:" -ForegroundColor Cyan
      Write-Host "   Empresas: $($response.dados.empresasTotal)" -ForegroundColor Gray
      Write-Host "   Canais Criados: $($response.dados.canaisCriados)" -ForegroundColor Gray
      Write-Host "   Canais Já Existentes: $($response.dados.canaisJaExistentes)" -ForegroundColor Gray
            
      if ($response.dados.canais -and $response.dados.canais.Count -gt 0) {
        Write-Host "`n📧 Canais de E-mail:" -ForegroundColor Cyan
        foreach ($canal in $response.dados.canais) {
          Write-Host "   • $($canal.nome) (ID: $($canal.id))" -ForegroundColor Gray
        }
      }
    }
        
    Write-Host "`n🎉 PRONTO!" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Green
    Write-Host "✅ Agora você pode:" -ForegroundColor Cyan
    Write-Host "   1. Abrir o modal 'Novo Atendimento'" -ForegroundColor White
    Write-Host "   2. Selecionar o canal 'E-mail Principal'" -ForegroundColor White
    Write-Host "   3. Configurar SendGrid em: http://localhost:3000/nuclei/atendimento/canais/email`n" -ForegroundColor White
  }
  else {
    throw $response.message
  }
}
catch {
  Write-Host "`n❌ ERRO!" -ForegroundColor Red
  Write-Host "==========================================" -ForegroundColor Red
  Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor White
    
  Write-Host "`n💡 Possíveis causas:" -ForegroundColor Yellow
  Write-Host "   • Backend não está rodando (porta 3001)" -ForegroundColor Gray
  Write-Host "   • Backend ainda está compilando (aguarde mais)" -ForegroundColor Gray
  Write-Host "   • Erro de conexão com banco de dados" -ForegroundColor Gray
    
  Write-Host "`n🔧 Soluções:" -ForegroundColor Cyan
  Write-Host "   1. Verifique se backend está rodando:" -ForegroundColor White
  Write-Host "      cd backend && npm run start:dev" -ForegroundColor Gray
  Write-Host "   2. Aguarde 30 segundos e execute este script novamente" -ForegroundColor White
  Write-Host "   3. Verifique logs do backend no terminal`n" -ForegroundColor White
    
  exit 1
}
