-- ============================================================
-- 🔍 QUERIES DE VERIFICAÇÃO - Sistema de Tickets
-- ============================================================
-- Execute estas queries para verificar o funcionamento do sistema

-- ------------------------------------------------------------
-- 1️⃣ VERIFICAR TICKETS CRIADOS
-- ------------------------------------------------------------
SELECT 
    t.id,
    t.numero,
    t.assunto,
    t.contato_telefone,
    t.contato_nome,
    t.status,
    t.prioridade,
    t.origem,
    t.data_abertura,
    t.data_primeira_resposta,
    t.data_resolucao,
    t.data_fechamento,
    t.ultima_mensagem_em,
    c.nome as canal_nome,
    c.tipo as canal_tipo,
    a.nome as atendente_nome,
    COUNT(m.id) as total_mensagens
FROM atendimento_tickets t
LEFT JOIN canais c ON t.canal_id = c.id
LEFT JOIN atendentes a ON t.atendente_id = a.id
LEFT JOIN atendimento_mensagens m ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP'
GROUP BY t.id, c.nome, c.tipo, a.nome
ORDER BY t.data_abertura DESC
LIMIT 10;

-- ------------------------------------------------------------
-- 2️⃣ VERIFICAR MENSAGENS DO ÚLTIMO TICKET
-- ------------------------------------------------------------
WITH ultimo_ticket AS (
    SELECT id, numero
    FROM atendimento_tickets
    WHERE origem = 'WHATSAPP'
    ORDER BY data_abertura DESC
    LIMIT 1
)
SELECT 
    m.id,
    m.tipo,
    m.remetente,
    m.conteudo,
    m.id_externo,
    m.status,
    m.midia,
    m.created_at,
    ut.numero as ticket_numero
FROM atendimento_mensagens m
JOIN ultimo_ticket ut ON m.ticket_id = ut.id
ORDER BY m.created_at ASC;

-- ------------------------------------------------------------
-- 3️⃣ ESTATÍSTICAS GERAIS
-- ------------------------------------------------------------
SELECT 
    '📊 ESTATÍSTICAS DO SISTEMA' as tipo,
    '' as valor
UNION ALL
SELECT 
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as tipo,
    '' as valor
UNION ALL
SELECT 
    '🎫 Total de Tickets' as tipo,
    COUNT(*)::text as valor
FROM atendimento_tickets
WHERE origem = 'WHATSAPP'
UNION ALL
SELECT 
    '📨 Total de Mensagens' as tipo,
    COUNT(*)::text as valor
FROM atendimento_mensagens
UNION ALL
SELECT 
    '👥 Mensagens de Clientes' as tipo,
    COUNT(*)::text as valor
FROM atendimento_mensagens
WHERE remetente = 'CLIENTE'
UNION ALL
SELECT 
    '🤖 Mensagens do Bot' as tipo,
    COUNT(*)::text as valor
FROM atendimento_mensagens
WHERE remetente = 'BOT'
UNION ALL
SELECT 
    '👨‍💼 Mensagens de Atendentes' as tipo,
    COUNT(*)::text as valor
FROM atendimento_mensagens
WHERE remetente = 'ATENDENTE'
UNION ALL
SELECT 
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as tipo,
    '' as valor;

-- ------------------------------------------------------------
-- 4️⃣ TICKETS POR STATUS
-- ------------------------------------------------------------
SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM atendimento_tickets
WHERE origem = 'WHATSAPP'
GROUP BY status
ORDER BY quantidade DESC;

-- ------------------------------------------------------------
-- 5️⃣ ÚLTIMAS 5 CONVERSAS (TICKETS COM MENSAGENS)
-- ------------------------------------------------------------
SELECT 
    t.numero as ticket,
    t.contato_nome as cliente,
    t.contato_telefone as telefone,
    t.status,
    COUNT(m.id) as qtd_mensagens,
    MAX(m.created_at) as ultima_mensagem,
    t.data_abertura as aberto_em,
    CASE 
        WHEN t.data_fechamento IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (t.data_fechamento - t.data_abertura))/60
        ELSE 
            EXTRACT(EPOCH FROM (NOW() - t.data_abertura))/60
    END as duracao_minutos
FROM atendimento_tickets t
LEFT JOIN atendimento_mensagens m ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP'
GROUP BY t.id
ORDER BY t.data_abertura DESC
LIMIT 5;

-- ------------------------------------------------------------
-- 6️⃣ VERIFICAR RESPOSTA AUTOMÁTICA DA IA
-- ------------------------------------------------------------
SELECT 
    t.numero as ticket,
    t.contato_nome as cliente,
    m.conteudo as mensagem_cliente,
    bot.conteudo as resposta_bot,
    m.created_at as enviada_em,
    bot.created_at as respondida_em,
    EXTRACT(EPOCH FROM (bot.created_at - m.created_at)) as tempo_resposta_segundos
FROM atendimento_mensagens m
JOIN atendimento_tickets t ON m.ticket_id = t.id
LEFT JOIN LATERAL (
    SELECT conteudo, created_at
    FROM atendimento_mensagens
    WHERE ticket_id = m.ticket_id
        AND remetente = 'BOT'
        AND created_at > m.created_at
    ORDER BY created_at ASC
    LIMIT 1
) bot ON true
WHERE m.remetente = 'CLIENTE'
    AND t.origem = 'WHATSAPP'
ORDER BY m.created_at DESC
LIMIT 10;

-- ------------------------------------------------------------
-- 7️⃣ VERIFICAR TICKETS REUTILIZADOS (MESMO TELEFONE)
-- ------------------------------------------------------------
SELECT 
    contato_telefone,
    contato_nome,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status IN ('ABERTO', 'EM_ATENDIMENTO') THEN 1 END) as tickets_abertos,
    MIN(data_abertura) as primeiro_contato,
    MAX(data_abertura) as ultimo_contato,
    MAX(ultima_mensagem_em) as ultima_mensagem
FROM atendimento_tickets
WHERE origem = 'WHATSAPP'
    AND contato_telefone IS NOT NULL
GROUP BY contato_telefone, contato_nome
HAVING COUNT(*) > 1
ORDER BY total_tickets DESC, ultimo_contato DESC;

-- ------------------------------------------------------------
-- 8️⃣ PERFORMANCE - TEMPO MÉDIO DE PRIMEIRA RESPOSTA
-- ------------------------------------------------------------
SELECT 
    AVG(EXTRACT(EPOCH FROM (data_primeira_resposta - data_abertura))/60) as tempo_medio_minutos,
    MIN(EXTRACT(EPOCH FROM (data_primeira_resposta - data_abertura))/60) as tempo_minimo_minutos,
    MAX(EXTRACT(EPOCH FROM (data_primeira_resposta - data_abertura))/60) as tempo_maximo_minutos,
    COUNT(*) as total_tickets_com_resposta
FROM atendimento_tickets
WHERE origem = 'WHATSAPP'
    AND data_primeira_resposta IS NOT NULL;

-- ------------------------------------------------------------
-- 9️⃣ VERIFICAR CANAIS CONFIGURADOS
-- ------------------------------------------------------------
SELECT 
    c.id,
    c.nome,
    c.tipo,
    c.ativo,
    c.configuracao->>'credenciais' as credenciais,
    COUNT(t.id) as total_tickets
FROM canais c
LEFT JOIN atendimento_tickets t ON t.canal_id = c.id
WHERE c.tipo = 'whatsapp'
GROUP BY c.id
ORDER BY c.ativo DESC, c.created_at DESC;

-- ------------------------------------------------------------
-- 🔟 ÚLTIMAS MENSAGENS EM TEMPO REAL
-- ------------------------------------------------------------
SELECT 
    m.created_at as hora,
    t.numero as ticket,
    m.remetente,
    m.tipo,
    LEFT(m.conteudo, 50) as conteudo_preview,
    m.status,
    t.contato_nome as cliente
FROM atendimento_mensagens m
JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE t.origem = 'WHATSAPP'
ORDER BY m.created_at DESC
LIMIT 20;

-- ------------------------------------------------------------
-- 🎯 VERIFICAÇÃO RÁPIDA - STATUS DO SISTEMA
-- ------------------------------------------------------------
-- Execute esta query para ter uma visão geral rápida
SELECT 
    'Sistema de Tickets WhatsApp' as sistema,
    (SELECT COUNT(*) FROM atendimento_tickets WHERE origem = 'WHATSAPP') as total_tickets,
    (SELECT COUNT(*) FROM atendimento_tickets WHERE origem = 'WHATSAPP' AND status = 'ABERTO') as tickets_abertos,
    (SELECT COUNT(*) FROM atendimento_tickets WHERE origem = 'WHATSAPP' AND status = 'EM_ATENDIMENTO') as em_atendimento,
    (SELECT COUNT(*) FROM atendimento_mensagens m JOIN atendimento_tickets t ON m.ticket_id = t.id WHERE t.origem = 'WHATSAPP') as total_mensagens,
    (SELECT COUNT(*) FROM canais WHERE tipo = 'whatsapp' AND ativo = true) as canais_ativos,
    (SELECT MAX(data_abertura) FROM atendimento_tickets WHERE origem = 'WHATSAPP') as ultimo_ticket,
    (SELECT MAX(m.created_at) FROM atendimento_mensagens m JOIN atendimento_tickets t ON m.ticket_id = t.id WHERE t.origem = 'WHATSAPP') as ultima_mensagem;
