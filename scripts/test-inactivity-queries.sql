-- ============================================
-- Scripts SQL para Testes de Inatividade
-- ============================================

-- ============================================
-- 1. ENCONTRAR TICKETS PARA TESTE
-- ============================================

-- Buscar tickets em atendimento (últimos 10)
SELECT 
    id, 
    numero, 
    contato_nome, 
    contato_telefone,
    status, 
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo,
    empresa_id
FROM atendimento_ticket
WHERE status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
ORDER BY created_at DESC
LIMIT 10;

-- Buscar tickets inativos há mais de 1 hora
SELECT 
    id,
    numero, 
    contato_nome, 
    status, 
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND ultima_mensagem_em < NOW() - INTERVAL '1 hour'
ORDER BY ultima_mensagem_em ASC
LIMIT 10;

-- ============================================
-- 2. SIMULAR INATIVIDADE PARA TESTE
-- ============================================

-- SUBSTITUIR: {{TICKET_ID}} pelo ID do ticket

-- Simular 4 minutos de inatividade (para teste com timeout de 5min)
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '4 minutes'
WHERE id = '{{TICKET_ID}}';

-- Simular 7 minutos de inatividade (para fechar com timeout de 5min)
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '7 minutes'
WHERE id = '{{TICKET_ID}}';

-- Simular 2 horas de inatividade
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '2 hours'
WHERE id = '{{TICKET_ID}}';

-- Simular 24 horas de inatividade
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '24 hours'
WHERE id = '{{TICKET_ID}}';

-- ============================================
-- 3. VERIFICAR STATUS DO TICKET
-- ============================================

-- SUBSTITUIR: {{TICKET_ID}} pelo ID do ticket

-- Ver detalhes completos
SELECT 
    numero,
    contato_nome,
    contato_telefone,
    status,
    ultima_mensagem_em,
    data_fechamento,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo,
    created_at,
    empresa_id
FROM atendimento_ticket
WHERE id = '{{TICKET_ID}}';

-- ============================================
-- 4. VERIFICAR CONFIGURAÇÕES DE INATIVIDADE
-- ============================================

-- SUBSTITUIR: {{EMPRESA_ID}} pelo ID da empresa

-- Ver configuração da empresa
SELECT 
    empresa_id,
    timeout_minutos,
    enviar_aviso,
    aviso_minutos_antes,
    mensagem_aviso,
    mensagem_fechamento,
    ativo,
    status_aplicaveis,
    created_at,
    updated_at
FROM atendimento_configuracao_inatividade
WHERE empresa_id = '{{EMPRESA_ID}}';

-- Ver todas as configurações ativas
SELECT 
    ci.empresa_id,
    e.nome AS empresa_nome,
    ci.timeout_minutos,
    ci.enviar_aviso,
    ci.ativo,
    ci.status_aplicaveis
FROM atendimento_configuracao_inatividade ci
LEFT JOIN empresas e ON e.id = ci.empresa_id
WHERE ci.ativo = true
ORDER BY e.nome;

-- ============================================
-- 5. BUSCAR TICKETS INATIVOS (COMO O SISTEMA FAZ)
-- ============================================

-- SUBSTITUIR: {{EMPRESA_ID}} e {{TIMEOUT_MINUTOS}}

-- Tickets que seriam fechados (timeout completo)
SELECT 
    numero,
    contato_nome,
    status,
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE empresa_id = '{{EMPRESA_ID}}'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND ultima_mensagem_em < NOW() - INTERVAL '{{TIMEOUT_MINUTOS}} minutes'
ORDER BY ultima_mensagem_em ASC;

-- Tickets que receberiam aviso (perto do timeout)
SELECT 
    numero,
    contato_nome,
    status,
    ultima_mensagem_em,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo,
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 - ({{TIMEOUT_MINUTOS}} - {{AVISO_MINUTOS_ANTES}}) AS minutos_apos_tempo_aviso
FROM atendimento_ticket
WHERE empresa_id = '{{EMPRESA_ID}}'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND ultima_mensagem_em < NOW() - INTERVAL '({{TIMEOUT_MINUTOS}} - {{AVISO_MINUTOS_ANTES}}) minutes'
  AND ultima_mensagem_em >= NOW() - INTERVAL '{{TIMEOUT_MINUTOS}} minutes'
ORDER BY ultima_mensagem_em ASC;

-- ============================================
-- 6. RESETAR TICKET PARA NOVO TESTE
-- ============================================

-- SUBSTITUIR: {{TICKET_ID}}

-- Reabrir ticket fechado para novo teste
UPDATE atendimento_ticket
SET 
    status = 'EM_ATENDIMENTO',
    data_fechamento = NULL,
    ultima_mensagem_em = NOW()
WHERE id = '{{TICKET_ID}}';

-- Verificar reset
SELECT numero, status, data_fechamento, ultima_mensagem_em
FROM atendimento_ticket
WHERE id = '{{TICKET_ID}}';

-- ============================================
-- 7. ESTATÍSTICAS E MONITORAMENTO
-- ============================================

-- Contar tickets fechados automaticamente (últimas 24h)
SELECT 
    COUNT(*) as total_fechado,
    DATE_TRUNC('hour', data_fechamento) as hora
FROM atendimento_ticket
WHERE status = 'FECHADO'
  AND data_fechamento > NOW() - INTERVAL '24 hours'
  -- Nota: adicionar campo 'fechado_automaticamente' boolean para rastrear melhor
GROUP BY DATE_TRUNC('hour', data_fechamento)
ORDER BY hora DESC;

-- Tickets atualmente inativos por empresa
SELECT 
    e.nome AS empresa,
    COUNT(*) as tickets_inativos,
    AVG(EXTRACT(EPOCH FROM (NOW() - t.ultima_mensagem_em)) / 60) as media_minutos_inativo
FROM atendimento_ticket t
JOIN empresas e ON e.id = t.empresa_id
WHERE t.status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
  AND t.ultima_mensagem_em < NOW() - INTERVAL '1 hour'
GROUP BY e.nome
ORDER BY tickets_inativos DESC;

-- Tickets por status
SELECT 
    status,
    COUNT(*) as total
FROM atendimento_ticket
WHERE empresa_id = '{{EMPRESA_ID}}'
GROUP BY status
ORDER BY total DESC;

-- ============================================
-- 8. TROUBLESHOOTING
-- ============================================

-- Verificar se campo ultima_mensagem_em está sendo atualizado
SELECT 
    numero,
    ultima_mensagem_em,
    ultima_mensagem_cliente,
    created_at,
    updated_at
FROM atendimento_ticket
ORDER BY updated_at DESC
LIMIT 10;

-- Verificar se webhook está funcionando
-- (ultima_mensagem_em deve ser atualizada quando cliente envia mensagem)

-- Tickets sem ultima_mensagem_em (problema)
SELECT 
    id,
    numero,
    contato_nome,
    status,
    ultima_mensagem_em
FROM atendimento_ticket
WHERE ultima_mensagem_em IS NULL
  AND status IN ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO')
LIMIT 10;

-- ============================================
-- 9. DADOS DE EXEMPLO PARA TESTE
-- ============================================

-- Criar ticket de teste (se necessário)
-- SUBSTITUIR: {{EMPRESA_ID}}, {{ATENDENTE_ID}}

INSERT INTO atendimento_ticket (
    empresa_id,
    numero,
    origem,
    contato_nome,
    contato_telefone,
    contato_email,
    status,
    prioridade,
    categoria,
    subcategoria,
    descricao,
    atendente_responsavel_id,
    ultima_mensagem_em,
    created_at,
    updated_at
) VALUES (
    '{{EMPRESA_ID}}',
    'TESTE-' || FLOOR(RANDOM() * 10000),
    'whatsapp',
    'Cliente Teste Inatividade',
    '5511999999999',
    'teste@example.com',
    'EM_ATENDIMENTO',
    'MEDIA',
    'Suporte',
    'Teste',
    'Ticket criado para teste de fechamento automático por inatividade',
    '{{ATENDENTE_ID}}',
    NOW() - INTERVAL '10 minutes', -- já criado inativo
    NOW(),
    NOW()
)
RETURNING id, numero;

-- ============================================
-- 10. LIMPEZA (CUIDADO!)
-- ============================================

-- CUIDADO: Usar apenas em ambiente de desenvolvimento!

-- Deletar configurações de teste
DELETE FROM atendimento_configuracao_inatividade
WHERE timeout_minutos = 5; -- configurações de teste rápido

-- Deletar tickets de teste
DELETE FROM atendimento_ticket
WHERE numero LIKE 'TESTE-%';

-- ============================================
-- QUERIES ÚTEIS COM PLACEHOLDERS
-- ============================================

-- Template: Verificar ticket específico
SELECT * FROM atendimento_ticket WHERE id = '{{TICKET_ID}}';

-- Template: Verificar config específica
SELECT * FROM atendimento_configuracao_inatividade WHERE empresa_id = '{{EMPRESA_ID}}';

-- Template: Simular inatividade customizada
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '{{MINUTOS}} minutes'
WHERE id = '{{TICKET_ID}}';
