# Script de Monitoramento - Webhook WhatsApp Real
# Execute APÓS enviar a mensagem do WhatsApp

Write-Host "`n🔍 VERIFICANDO NOVOS TICKETS E MENSAGENS...`n" -ForegroundColor Cyan

# Últimos 3 tickets
Write-Host "📊 ÚLTIMOS TICKETS CRIADOS:" -ForegroundColor Yellow
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    numero,
    contato_telefone,
    contato_nome,
    LEFT(assunto, 40) as assunto,
    status,
    TO_CHAR(created_at, 'HH24:MI:SS') as hora
  FROM atendimento_tickets 
  ORDER BY created_at DESC 
  LIMIT 3;
"

Write-Host ""

# Últimas 5 mensagens
Write-Host "💬 ÚLTIMAS MENSAGENS RECEBIDAS:" -ForegroundColor Yellow
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    t.numero as ticket,
    t.contato_nome as cliente,
    m.tipo,
    LEFT(m.conteudo, 50) as mensagem,
    m.remetente_tipo,
    TO_CHAR(m.created_at, 'HH24:MI:SS') as hora
  FROM atendimento_mensagens m
  JOIN atendimento_tickets t ON m.ticket_id = t.id
  ORDER BY m.created_at DESC
  LIMIT 5;
"

Write-Host ""

# Estatísticas
Write-Host "📈 ESTATÍSTICAS:" -ForegroundColor Yellow
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    (SELECT COUNT(*) FROM atendimento_tickets) as total_tickets,
    (SELECT COUNT(*) FROM atendimento_mensagens) as total_mensagens,
    (SELECT COUNT(*) FROM atendimento_tickets WHERE status = 'ABERTO') as tickets_abertos;
"

Write-Host "`n✅ Verificação concluída!" -ForegroundColor Green
Write-Host "   Se você enviou uma mensagem e nada apareceu:" -ForegroundColor Gray
Write-Host "   1. Verifique os logs do backend (terminal da task)" -ForegroundColor Gray
Write-Host "   2. Confirme que a URL do webhook está correta no Meta" -ForegroundColor Gray
Write-Host "   3. Execute novamente este script após alguns segundos`n" -ForegroundColor Gray
