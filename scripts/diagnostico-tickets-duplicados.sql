-- ============================================
-- 🔍 Script de Diagnóstico: Tickets Duplicados
-- ============================================
-- Execute este script para identificar tickets duplicados
-- no sistema antes e depois da correção.
-- Data: 06/11/2025
-- ============================================

-- 1. TICKETS DUPLICADOS POR CLIENTE (ativos no momento)
-- Este query mostra clientes que têm mais de um ticket ativo
SELECT 
    contato_telefone AS telefone_cliente,
    contato_nome AS nome_cliente,
    COUNT(*) AS total_tickets_ativos,
    STRING_AGG(DISTINCT status, ', ') AS status_encontrados,
    STRING_AGG(id::text, ', ') AS ticket_ids,
    MIN(created_at) AS primeiro_ticket,
    MAX(created_at) AS ultimo_ticket,
    MAX(created_at) - MIN(created_at) AS intervalo_entre_tickets
FROM atendimento_tickets
WHERE status NOT IN ('FECHADO', 'RESOLVIDO')
  AND deleted_at IS NULL
GROUP BY contato_telefone, contato_nome, empresa_id, canal_id
HAVING COUNT(*) > 1
ORDER BY total_tickets_ativos DESC, ultimo_ticket DESC;

-- 2. TICKETS DUPLICADOS NAS ÚLTIMAS 24 HORAS
-- Identifica duplicações recentes (provavelmente bug ativo)
SELECT 
    contato_telefone AS telefone_cliente,
    COUNT(*) AS tickets_criados_24h,
    STRING_AGG(DISTINCT status, ', ') AS status_distintos,
    STRING_AGG(
        CONCAT('#', numero, ' (', status, ')'), 
        ' → '
    ) AS sequencia_tickets
FROM atendimento_tickets
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND deleted_at IS NULL
GROUP BY contato_telefone, empresa_id
HAVING COUNT(*) > 1
ORDER BY tickets_criados_24h DESC;

-- 3. HISTÓRICO DE CRIAÇÃO (últimas 2 horas)
-- Mostra todos os tickets criados recentemente
SELECT 
    numero,
    contato_telefone,
    contato_nome,
    status,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS minutos_atras,
    CASE 
        WHEN atendente_id IS NOT NULL THEN 'Com atendente'
        ELSE 'Sem atendente'
    END AS situacao_atendente
FROM atendimento_tickets
WHERE created_at >= NOW() - INTERVAL '2 hours'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- 4. CLIENTES COM MÚLTIPLAS CONVERSAS FRAGMENTADAS
-- Identifica clientes que tiveram tickets duplicados mesmo com atendente
SELECT 
    t.contato_telefone,
    t.contato_nome,
    COUNT(DISTINCT t.id) AS total_tickets,
    COUNT(DISTINCT t.atendente_id) AS atendentes_diferentes,
    STRING_AGG(
        CONCAT(
            'Ticket #', t.numero, 
            ' - Status: ', t.status,
            ' - Atendente: ', COALESCE(u.nome, 'Nenhum'),
            ' - Criado: ', TO_CHAR(t.created_at, 'HH24:MI:SS')
        ),
        E'\n'
    ) AS detalhes_tickets
FROM atendimento_tickets t
LEFT JOIN users u ON t.atendente_id = u.id
WHERE t.created_at >= NOW() - INTERVAL '24 hours'
  AND t.deleted_at IS NULL
GROUP BY t.contato_telefone, t.contato_nome, t.empresa_id
HAVING COUNT(DISTINCT t.id) > 1
ORDER BY total_tickets DESC;

-- 5. TICKETS COM STATUS "SUSPEITO" (criados rapidamente)
-- Tickets do mesmo cliente criados com menos de 5 minutos de diferença
WITH tickets_sequenciais AS (
    SELECT 
        id,
        numero,
        contato_telefone,
        contato_nome,
        status,
        created_at,
        LAG(created_at) OVER (
            PARTITION BY contato_telefone, empresa_id 
            ORDER BY created_at
        ) AS ticket_anterior,
        LAG(id) OVER (
            PARTITION BY contato_telefone, empresa_id 
            ORDER BY created_at
        ) AS id_anterior
    FROM atendimento_tickets
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND deleted_at IS NULL
)
SELECT 
    contato_telefone,
    contato_nome,
    numero AS ticket_novo,
    id AS id_novo,
    status,
    created_at AS criado_em,
    EXTRACT(EPOCH FROM (created_at - ticket_anterior)) / 60 AS minutos_depois_anterior,
    id_anterior
FROM tickets_sequenciais
WHERE ticket_anterior IS NOT NULL
  AND EXTRACT(EPOCH FROM (created_at - ticket_anterior)) < 300 -- menos de 5 minutos
ORDER BY created_at DESC;

-- 6. RESUMO GERAL (estatísticas do problema)
SELECT 
    'Tickets duplicados (ativos)' AS metrica,
    COUNT(*) AS valor
FROM (
    SELECT contato_telefone
    FROM atendimento_tickets
    WHERE status NOT IN ('FECHADO', 'RESOLVIDO')
      AND deleted_at IS NULL
    GROUP BY contato_telefone, empresa_id
    HAVING COUNT(*) > 1
) sub

UNION ALL

SELECT 
    'Clientes afetados' AS metrica,
    COUNT(DISTINCT contato_telefone) AS valor
FROM atendimento_tickets
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND deleted_at IS NULL
  AND contato_telefone IN (
      SELECT contato_telefone
      FROM atendimento_tickets
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY contato_telefone, empresa_id
      HAVING COUNT(*) > 1
  )

UNION ALL

SELECT 
    'Tickets criados (últimas 24h)' AS metrica,
    COUNT(*) AS valor
FROM atendimento_tickets
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND deleted_at IS NULL

UNION ALL

SELECT 
    'Taxa de duplicação (%)' AS metrica,
    ROUND(
        100.0 * COUNT(CASE WHEN duplicados > 1 THEN 1 END) / NULLIF(COUNT(*), 0),
        2
    ) AS valor
FROM (
    SELECT 
        contato_telefone,
        COUNT(*) AS duplicados
    FROM atendimento_tickets
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND deleted_at IS NULL
    GROUP BY contato_telefone, empresa_id
) sub;

-- ============================================
-- 📊 INTERPRETAÇÃO DOS RESULTADOS
-- ============================================
-- 
-- Query 1: Se retornar linhas, há clientes com múltiplos tickets ativos
--          (problema confirmado)
--
-- Query 2: Mostra duplicações nas últimas 24h
--          (se vazio após correção = problema resolvido)
--
-- Query 3: Histórico recente para contexto temporal
--
-- Query 4: Detalha cada caso de duplicação com nomes dos atendentes
--
-- Query 5: Tickets criados muito rapidamente (alta chance de bug)
--
-- Query 6: Resumo estatístico do impacto do problema
--
-- ============================================
-- 🎯 AÇÕES RECOMENDADAS
-- ============================================
--
-- Se Query 1 retornar resultados:
-- 1. Anotar os ticket_ids duplicados
-- 2. Verificar manualmente qual ticket tem mais mensagens
-- 3. Mesclar ou fechar tickets duplicados manualmente
-- 4. Aplicar correção no código (já feita!)
-- 5. Monitorar por 24-48h após deploy
--
-- Query para mesclar mensagens (exemplo):
-- UPDATE mensagens 
-- SET ticket_id = 'TICKET_ID_PRINCIPAL' 
-- WHERE ticket_id IN ('TICKET_ID_DUPLICADO1', 'TICKET_ID_DUPLICADO2');
--
-- Depois fechar duplicatas:
-- UPDATE atendimento_tickets 
-- SET status = 'FECHADO', 
--     observacoes = 'Ticket duplicado - mesclado com #NUMERO_PRINCIPAL'
-- WHERE id IN ('TICKET_ID_DUPLICADO1', 'TICKET_ID_DUPLICADO2');
--
-- ============================================
