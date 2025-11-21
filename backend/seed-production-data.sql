-- ========================================
-- SEED DATA PARA PRODUÇÃO
-- ========================================
-- Dados essenciais que devem existir em produção
-- para o sistema funcionar corretamente

-- IMPORTANTE: Execute este script APÓS aplicar todas as migrations!

BEGIN;

-- ========================================
-- 1. FLUXO PADRÃO DE TRIAGEM
-- ========================================

INSERT INTO fluxo_triagem (
    id,
    nome,
    descricao,
    estrutura,
    ativo,
    visivel_bot,
    criado_em,
    atualizado_em
) VALUES (
    gen_random_uuid(),
    'Atendimento Padrão',
    'Fluxo padrão de atendimento inicial - criado automaticamente no deploy',
    '{
        "nome": "Atendimento Padrão",
        "descricao": "Fluxo inicial de triagem",
        "etapas": [
            {
                "id": "inicio",
                "tipo": "mensagem",
                "conteudo": "Olá! Bem-vindo ao nosso atendimento. Como posso ajudar você hoje?",
                "opcoes": [
                    {
                        "id": "opcao1",
                        "texto": "Suporte Técnico",
                        "proxima_etapa": "suporte"
                    },
                    {
                        "id": "opcao2",
                        "texto": "Vendas",
                        "proxima_etapa": "vendas"
                    },
                    {
                        "id": "opcao3",
                        "texto": "Financeiro",
                        "proxima_etapa": "financeiro"
                    }
                ]
            },
            {
                "id": "suporte",
                "tipo": "transferencia",
                "departamento": "Suporte",
                "mensagem": "Transferindo para nossa equipe de suporte..."
            },
            {
                "id": "vendas",
                "tipo": "transferencia",
                "departamento": "Vendas",
                "mensagem": "Transferindo para nossa equipe comercial..."
            },
            {
                "id": "financeiro",
                "tipo": "transferencia",
                "departamento": "Financeiro",
                "mensagem": "Transferindo para nosso setor financeiro..."
            }
        ]
    }'::jsonb,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- ========================================
-- 2. NÚCLEO PADRÃO
-- ========================================

INSERT INTO nucleos (
    id,
    nome,
    descricao,
    ativo,
    cor,
    icone,
    ordem,
    criado_em,
    atualizado_em
) VALUES (
    gen_random_uuid(),
    'Atendimento Geral',
    'Núcleo padrão para atendimentos gerais',
    true,
    '#159A9C',
    'headphones',
    1,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- ========================================
-- 3. DEPARTAMENTOS PADRÃO
-- ========================================

-- Buscar ID do núcleo criado
WITH nucleo AS (
    SELECT id FROM nucleos WHERE nome = 'Atendimento Geral' LIMIT 1
)
INSERT INTO departamentos (
    id,
    nome,
    descricao,
    nucleo_id,
    tipo_distribuicao,
    ativo,
    cor,
    ordem,
    criado_em,
    atualizado_em
)
SELECT 
    gen_random_uuid(),
    nome,
    descricao,
    nucleo.id,
    'ROUND_ROBIN',
    true,
    cor,
    ordem,
    NOW(),
    NOW()
FROM nucleo, (VALUES
    ('Suporte', 'Atendimento de suporte técnico', '#3B82F6', 1),
    ('Vendas', 'Atendimento comercial e vendas', '#10B981', 2),
    ('Financeiro', 'Questões financeiras e pagamentos', '#F59E0B', 3)
) AS depts(nome, descricao, cor, ordem)
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. CANAIS DE ATENDIMENTO
-- ========================================

INSERT INTO canais (
    id,
    nome,
    tipo,
    configuracao,
    ativo,
    criado_em,
    atualizado_em
) VALUES 
(
    gen_random_uuid(),
    'WhatsApp Principal',
    'WHATSAPP',
    '{
        "provider": "whatsapp-web.js",
        "qrcode_enabled": true,
        "auto_reply_enabled": false
    }'::jsonb,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Chat Web',
    'WEBCHAT',
    '{
        "widget_position": "right",
        "theme": "crevasse",
        "welcome_message": "Olá! Como posso ajudar?"
    }'::jsonb,
    true,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. CONFIGURAÇÕES PADRÃO DO SISTEMA
-- ========================================

-- Configuração de horário de atendimento (24/7 inicialmente)
CREATE TABLE IF NOT EXISTS sistema_configuracao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO sistema_configuracao (chave, valor, descricao)
VALUES 
(
    'horario_atendimento',
    '{
        "segunda": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "terca": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "quarta": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "quinta": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "sexta": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "sabado": {"inicio": "00:00", "fim": "23:59", "ativo": true},
        "domingo": {"inicio": "00:00", "fim": "23:59", "ativo": true}
    }'::jsonb,
    'Horário de funcionamento do atendimento (padrão: 24/7)'
),
(
    'bot_configuracao',
    '{
        "habilitado": true,
        "timeout_resposta": 300,
        "max_tentativas": 3,
        "mensagem_timeout": "Desculpe, não consegui entender. Vou transferir para um atendente."
    }'::jsonb,
    'Configurações gerais do bot de atendimento'
),
(
    'notificacoes',
    '{
        "email_enabled": false,
        "sms_enabled": false,
        "push_enabled": false
    }'::jsonb,
    'Configurações de notificações do sistema'
)
ON CONFLICT (chave) DO NOTHING;

-- ========================================
-- 6. STATUS PADRÃO DE TICKETS
-- ========================================

CREATE TABLE IF NOT EXISTS ticket_status (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) NOT NULL,
    ordem INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO ticket_status (id, nome, descricao, cor, ordem)
VALUES 
('novo', 'Novo', 'Ticket recém criado, aguardando atribuição', '#3B82F6', 1),
('em_atendimento', 'Em Atendimento', 'Ticket sendo atendido por um agente', '#F59E0B', 2),
('aguardando_cliente', 'Aguardando Cliente', 'Aguardando resposta do cliente', '#8B5CF6', 3),
('resolvido', 'Resolvido', 'Ticket resolvido com sucesso', '#10B981', 4),
('fechado', 'Fechado', 'Ticket encerrado', '#6B7280', 5)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. PRIORIDADES DE TICKETS
-- ========================================

CREATE TABLE IF NOT EXISTS ticket_prioridade (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) NOT NULL,
    ordem INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO ticket_prioridade (id, nome, descricao, cor, ordem)
VALUES 
('baixa', 'Baixa', 'Prioridade baixa - não urgente', '#6B7280', 1),
('media', 'Média', 'Prioridade média - atendimento normal', '#3B82F6', 2),
('alta', 'Alta', 'Prioridade alta - requer atenção', '#F59E0B', 3),
('urgente', 'Urgente', 'Prioridade urgente - atendimento imediato', '#DC2626', 4)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
    fluxos_count INTEGER;
    nucleos_count INTEGER;
    departamentos_count INTEGER;
    canais_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fluxos_count FROM fluxo_triagem WHERE ativo = true;
    SELECT COUNT(*) INTO nucleos_count FROM nucleos WHERE ativo = true;
    SELECT COUNT(*) INTO departamentos_count FROM departamentos WHERE ativo = true;
    SELECT COUNT(*) INTO canais_count FROM canais WHERE ativo = true;
    
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '✅ SEED DATA APLICADO COM SUCESSO!';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'Fluxos de Triagem: %', fluxos_count;
    RAISE NOTICE 'Núcleos: %', nucleos_count;
    RAISE NOTICE 'Departamentos: %', departamentos_count;
    RAISE NOTICE 'Canais: %', canais_count;
    RAISE NOTICE '═══════════════════════════════════════';
    
    IF fluxos_count = 0 OR nucleos_count = 0 OR departamentos_count = 0 THEN
        RAISE WARNING '⚠️  Alguns dados essenciais podem não ter sido criados!';
        RAISE WARNING 'Verifique os logs acima para possíveis conflitos.';
    END IF;
END $$;
