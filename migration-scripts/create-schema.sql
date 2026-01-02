-- ============================================================================
-- Script: Criar Tabelas Essenciais no ConectSuite
-- Data: 26/11/2025
-- Objetivo: Criar estrutura mínima para receber dados do Fênix
-- ============================================================================

\echo '🔧 Criando estrutura do banco ConectSuite...'

-- Criar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\echo '✅ Extensão uuid-ossp criada'

-- ============================================================================
-- TABELA: empresas
-- ============================================================================
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    razao_social VARCHAR(200),
    inscricao_estadual VARCHAR(20),
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    website VARCHAR(200),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    logo_url TEXT,
    configuracoes JSONB,
    ativo BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) DEFAULT 'ativo',
    plano_id UUID,
    data_assinatura TIMESTAMP,
    data_expiracao TIMESTAMP,
    max_usuarios INTEGER DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

\echo '✅ Tabela empresas criada'

-- ============================================================================
-- TABELA: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    perfil VARCHAR(50) NOT NULL DEFAULT 'ATENDENTE',
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    avatar_url TEXT,
    idioma_preferido VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    configuracoes JSONB,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_login TIMESTAMP,
    status_atendente VARCHAR(20) DEFAULT 'offline',
    deve_trocar_senha BOOLEAN DEFAULT false,
    primeira_senha VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_empresa_id ON users(empresa_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

\echo '✅ Tabela users criada'

-- ============================================================================
-- TABELA: contatos
-- ============================================================================
CREATE TABLE IF NOT EXISTS contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    tipo VARCHAR(20) NOT NULL,
    documento VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'LEAD',
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    empresa_campo VARCHAR(100),
    cargo VARCHAR(100),
    origem VARCHAR(100),
    tags TEXT,
    observacoes TEXT,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    responsavel_id UUID REFERENCES users(id),
    valor_estimado NUMERIC(10,2) DEFAULT 0,
    ultimo_contato TIMESTAMP,
    proximo_contato TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT true,
    whatsapp_id VARCHAR(255),
    avatar_url TEXT,
    data_nascimento DATE,
    redes_sociais JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON contatos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contatos_email ON contatos(email);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);

\echo '✅ Tabela contatos criada'

-- ============================================================================
-- TABELA: produtos
-- ============================================================================
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    codigo VARCHAR(50),
    categoria VARCHAR(100),
    preco NUMERIC(10,2) NOT NULL DEFAULT 0,
    custo NUMERIC(10,2) DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    estoque_atual INTEGER DEFAULT 0,
    unidade VARCHAR(10) DEFAULT 'UN',
    ativo BOOLEAN NOT NULL DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);

\echo '✅ Tabela produtos criada'

-- ============================================================================
-- RESUMO
-- ============================================================================
\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ✅ ESTRUTURA CRIADA COM SUCESSO!                            ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Tabelas criadas:'
\echo '  - empresas'
\echo '  - users'
\echo '  - contatos'
\echo '  - produtos'
\echo ''
\echo 'Próximo passo: Executar script de migração de dados'
\echo 'Comando: cd migration-scripts && npm install && npm run migrate'
\echo ''
