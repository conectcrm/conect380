-- ===============================================
-- VERIFICAÇÃO RÁPIDA - BOT DE TRIAGEM
-- ConectCRM - Status de Configuração
-- ===============================================

\echo '═══════════════════════════════════════════════'
\echo '  VERIFICAÇÃO RÁPIDA - BOT DE TRIAGEM'
\echo '═══════════════════════════════════════════════'

-- 1. Verificar fluxos publicados
\echo ''
\echo '1. FLUXOS PUBLICADOS:'
\echo '   (Necessário pelo menos 1 para bot funcionar)'
\echo ''

SELECT 
    id,
    nome,
    publicado,
    ativo,
    prioridade,
    canais,
    published_at::date as data_publicacao,
    CASE 
        WHEN estrutura->'etapas' ? 'boas-vindas' THEN '✓ Tem boas-vindas'
        ELSE '✗ Falta boas-vindas'
    END as validacao_estrutura
FROM fluxos_triagem
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND publicado = TRUE
  AND ativo = TRUE
  AND 'whatsapp' = ANY(canais)
ORDER BY prioridade DESC, published_at DESC
LIMIT 5;

\echo ''
\echo '   TOTAL DE FLUXOS PUBLICADOS:'
SELECT COUNT(*) as total_fluxos_publicados
FROM fluxos_triagem
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND publicado = TRUE
  AND ativo = TRUE;

-- 2. Verificar núcleos visíveis no bot
\echo ''
\echo '2. NÚCLEOS VISÍVEIS NO BOT:'
\echo '   (Aparecem no menu de opções)'
\echo ''

SELECT 
    id,
    nome,
    visivel_no_bot,
    ativo,
    CASE 
        WHEN horario_funcionamento IS NOT NULL THEN '✓ Com horário'
        ELSE '✗ Sem horário'
    END as tem_horario,
    cor,
    icone
FROM nucleos_atendimento
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND ativo = TRUE
ORDER BY nome;

-- 3. Verificar departamentos visíveis
\echo ''
\echo '3. DEPARTAMENTOS VISÍVEIS NO BOT:'
\echo '   (Aparecem após escolher núcleo)'
\echo ''

SELECT 
    d.id,
    d.nome as departamento,
    n.nome as nucleo,
    d.visivel_no_bot,
    d.ativo,
    (SELECT COUNT(*) 
     FROM atendentes_departamentos ad 
     WHERE ad.departamento_id = d.id) as total_atendentes
FROM departamentos d
INNER JOIN nucleos_atendimento n ON d.nucleo_id = n.id
WHERE n.empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND d.ativo = TRUE
ORDER BY n.nome, d.nome;

-- 4. Verificar sessões de triagem ativas
\echo ''
\echo '4. SESSÕES DE TRIAGEM ATIVAS:'
\echo '   (Conversas em andamento)'
\echo ''

SELECT 
    id,
    contato_telefone,
    contato_nome,
    etapa_atual,
    status,
    iniciado_em,
    AGE(NOW(), iniciado_em) as tempo_decorrido
FROM sessoes_triagem
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND status = 'em_andamento'
ORDER BY iniciado_em DESC
LIMIT 10;

-- 5. Estatísticas gerais
\echo ''
\echo '5. ESTATÍSTICAS GERAIS:'
\echo ''

SELECT 
    (SELECT COUNT(*) FROM fluxos_triagem 
     WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
       AND publicado = TRUE) as fluxos_publicados,
    
    (SELECT COUNT(*) FROM nucleos_atendimento 
     WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
       AND ativo = TRUE 
       AND visivel_no_bot = TRUE) as nucleos_visiveis,
    
    (SELECT COUNT(*) FROM departamentos d
     INNER JOIN nucleos_atendimento n ON d.nucleo_id = n.id
     WHERE n.empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
       AND d.ativo = TRUE 
       AND d.visivel_no_bot = TRUE) as departamentos_visiveis,
    
    (SELECT COUNT(*) FROM sessoes_triagem 
     WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
       AND status = 'em_andamento') as sessoes_ativas,
    
    (SELECT COUNT(*) FROM sessoes_triagem 
     WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
       AND status = 'concluido'
       AND iniciado_em > NOW() - INTERVAL '24 hours') as triagens_concluidas_24h;

-- 6. Status de prontidão
\echo ''
\echo '═══════════════════════════════════════════════'
\echo '  STATUS DE PRONTIDÃO PARA PRODUÇÃO'
\echo '═══════════════════════════════════════════════'
\echo ''

WITH status_config AS (
    SELECT 
        (SELECT COUNT(*) > 0 FROM fluxos_triagem 
         WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
           AND publicado = TRUE) as tem_fluxo,
        
        (SELECT COUNT(*) > 0 FROM nucleos_atendimento 
         WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
           AND ativo = TRUE 
           AND visivel_no_bot = TRUE) as tem_nucleos
)
SELECT 
    CASE WHEN tem_fluxo THEN '✓ OK' ELSE '✗ FALTA' END as fluxo_publicado,
    CASE WHEN tem_nucleos THEN '✓ OK' ELSE '✗ FALTA' END as nucleos_configurados,
    CASE 
        WHEN tem_fluxo AND tem_nucleos THEN '🎉 PRONTO PARA PRODUÇÃO'
        WHEN tem_fluxo THEN '⚠️  FALTA CONFIGURAR NÚCLEOS'
        WHEN tem_nucleos THEN '⚠️  FALTA CRIAR E PUBLICAR FLUXO'
        ELSE '❌ FALTA FLUXO E NÚCLEOS'
    END as status_geral
FROM status_config;

\echo ''
\echo '═══════════════════════════════════════════════'
