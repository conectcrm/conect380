-- ============================================================================
-- Script: Migração de Dados Fênix → ConectSuite (SQL Puro)
-- Data: 26/11/2025
-- Objetivo: Migrar dados do Fênix para ConectSuite usando SQL
-- ============================================================================

\echo '🔄 Iniciando Migração de Dados: Fênix CRM → ConectSuite'
\echo ''

-- ============================================================================
-- MIGRAR EMPRESAS
-- ============================================================================
\echo '📦 Migrando Empresas...'

INSERT INTO empresas (
    id, nome, slug, cnpj, razao_social, email, telefone, endereco, cidade, 
    estado, cep, logo_url, configuracoes, ativo, created_at, updated_at,
    status, max_usuarios
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Fênix CRM Empresa Demo',
    'fenix-crm-demo',
    '00.000.000/0001-00',
    'Fênix CRM Empresa Demo',
    'contato@fenixcrm.com',
    '(11) 99999-9999',
    'Rua Demo, 123',
    'São Paulo',
    'SP',
    '01000-000',
    NULL,
    NULL,
    true,
    '2025-07-18 15:37:28.815421',
    '2025-07-18 15:37:28.815421',
    'ativo',
    10
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    updated_at = NOW();

\echo '   ✅ Empresa migrada: Fênix CRM Empresa Demo'

-- ============================================================================
-- MIGRAR USUÁRIOS
-- ============================================================================
\echo ''
\echo '👥 Migrando Usuários...'

-- Admin Sistema
INSERT INTO users (
    id, nome, email, senha, telefone, perfil, empresa_id, avatar_url, 
    idioma_preferido, configuracoes, ativo, ultimo_login, created_at, updated_at,
    status_atendente, deve_trocar_senha
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin Sistema',
    'admin@conectsuite.com.br',
    '$2a$10$FlCEpmIgRopB4XZXGtaVpOmT0s5HCe.Qxksv005Af5NB4szwiTYam',
    NULL,
    'SUPER_ADMIN',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'pt-BR',
    NULL,
    true,
    '2025-07-22 14:48:30.665',
    '2025-07-18 15:37:28.821722',
    '2025-07-22 17:48:30.683259',
    'offline',
    false
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = NOW();

\echo '   ✅ Usuário migrado: Admin Sistema (admin@conectsuite.com.br)'

-- Manager Sistema
INSERT INTO users (
    id, nome, email, senha, telefone, perfil, empresa_id, avatar_url, 
    idioma_preferido, configuracoes, ativo, ultimo_login, created_at, updated_at,
    status_atendente, deve_trocar_senha
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Manager Sistema',
    'manager@conectcrm.com',
    '$2a$10$JIKv0c1EeAKC3w74oyomueq6igwCSqVa.LO2akFbD6jzUgWsX82kO',
    NULL,
    'ADMIN',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'pt-BR',
    NULL,
    true,
    NULL,
    '2025-07-18 15:37:28.821722',
    '2025-07-18 15:37:28.821722',
    'offline',
    false
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = NOW();

\echo '   ✅ Usuário migrado: Manager Sistema (manager@conectcrm.com)'

-- Vendedor Sistema
INSERT INTO users (
    id, nome, email, senha, telefone, perfil, empresa_id, avatar_url, 
    idioma_preferido, configuracoes, ativo, ultimo_login, created_at, updated_at,
    status_atendente, deve_trocar_senha
)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'Vendedor Sistema',
    'vendedor@conectcrm.com',
    '$2a$10$td24SLNFNJBW5ipMToUGyuUIqKVdFn0bu7n7rgPDh8aj.ZrarvHam',
    NULL,
    'ATENDENTE',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'pt-BR',
    NULL,
    true,
    NULL,
    '2025-07-18 15:37:28.821722',
    '2025-07-18 15:37:28.821722',
    'offline',
    false
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = NOW();

\echo '   ✅ Usuário migrado: Vendedor Sistema (vendedor@conectcrm.com)'

-- ============================================================================
-- MIGRAR CLIENTES → CONTATOS
-- ============================================================================
\echo ''
\echo '👤 Migrando Clientes → Contatos...'

-- Cliente 1
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    'f184921c-e586-4f04-afd3-d35e632bc1a0',
    'Beatriz Dos Santos',
    'bdossantos588@gmail.com',
    '62981108984444444',
    'PESSOA_FISICA',
    '0581411633100000',
    'LEAD',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    false,
    '2025-07-20 00:10:46.630503',
    '2025-07-20 00:10:54.317146'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 2
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    '7f6f0b19-82cb-4a9f-827b-e640ee4d6c98',
    'Dhonleno Freitas',
    'dhonleno@hotmail.com',
    '62996689991',
    'PESSOA_FISICA',
    '',
    'CLIENTE',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    false,
    '2025-07-20 02:24:20.480599',
    '2025-07-20 02:49:31.125321'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 3
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    '8d55b643-a8c1-4e22-84b2-dbcade0e4be3',
    'Dhonleno Lopes Freitas',
    'dhonleno@hotmail.com',
    '62996689991',
    'PESSOA_FISICA',
    '01086830288',
    'PROSPECT',
    'Avenida Anápolis, 57, Vila Brasília',
    'Aparecida de Goiânia',
    'GO',
    '74911360',
    '',
    '',
    '',
    'Premium',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    true,
    '2025-07-20 03:00:43.601998',
    '2025-07-20 03:00:43.601998'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 4
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    '4ecb4033-8aeb-46f1-bcb5-a61665f2fb1b',
    'Beatriz Dos Santos',
    'bdossantos588@gmail.com',
    '62981108984',
    'PESSOA_FISICA',
    '05814116331',
    'CLIENTE',
    'Avenida Anápolis, 58, qd 8 lt 17, Vila Brasília',
    'Aparecida de Goiânia',
    'GO',
    '74911360',
    '',
    '',
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    true,
    '2025-07-20 03:05:22.596861',
    '2025-07-20 03:05:22.596861'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 5
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    'cbfaf2bb-272f-489c-b207-9a1497446184',
    'MULTSOFT DESENVOLVIMENTO DE SISTEMAS LTDA - EPP',
    'ti@multbovinos.com',
    '6235412459',
    'PESSOA_JURIDICA',
    '57068090000170',
    'CLIENTE',
    'Rua 89, 87, qd, Setor Sul',
    'Goiânia',
    'GO',
    '74093140',
    '',
    '',
    '',
    'Premium',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    true,
    '2025-07-20 03:43:43.141669',
    '2025-07-20 03:43:43.141669'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 6
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    '85ee72ee-2998-46b1-a1ab-5de8d514805c',
    'Marenilde Dos Santos',
    'mare@gmail.com',
    '62984885522',
    'PESSOA_FISICA',
    '64474992334',
    'PROSPECT',
    'Avenida Anápolis, 4, Vila Brasília',
    'Aparecida de Goiânia',
    'GO',
    '74911360',
    '',
    '',
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    true,
    '2025-07-20 03:56:27.118179',
    '2025-07-20 03:56:27.118179'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Cliente 7
INSERT INTO contatos (
    id, nome, email, telefone, tipo, documento, status, endereco, cidade, 
    estado, cep, empresa_campo, cargo, origem, tags, observacoes, empresa_id, 
    responsavel_id, valor_estimado, ultimo_contato, proximo_contato, ativo, 
    created_at, updated_at
)
VALUES (
    '745ab7c2-51da-4d0a-8d5e-35d946bb26d4',
    'Guilherme Paiva',
    'gui@gmail.com',
    '6292566330',
    'PESSOA_FISICA',
    '02229709011',
    'LEAD',
    'Avenida Anápolis, 25, qd, Vila Brasília',
    'Aparecida de Goiânia',
    'GO',
    '74911360',
    '',
    '',
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    0.00,
    NULL,
    NULL,
    true,
    '2025-07-21 22:43:16.843981',
    '2025-07-21 22:43:16.843981'
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

\echo '   ✅ 7 contatos migrados'

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================
\echo ''
\echo '🔍 Validando Migração...'
\echo ''

SELECT 
    '📊 Empresas migradas: ' || COUNT(*)::TEXT AS resultado
FROM empresas;

SELECT 
    '📊 Usuários migrados: ' || COUNT(*)::TEXT AS resultado
FROM users;

SELECT 
    '📊 Contatos migrados: ' || COUNT(*)::TEXT AS resultado
FROM contatos;

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!                          ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Próximos Passos:'
\echo '1. Testar login: admin@conectsuite.com.br (senha do Fênix)'
\echo '2. Verificar dados no sistema'
\echo '3. Parar container fenixcrm-postgres'
\echo ''
