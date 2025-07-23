-- Script para configurar o banco de dados ConectCRM
-- Execute este script como superusuário (postgres)

-- Criar usuário conectcrm se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'conectcrm') THEN
        CREATE USER conectcrm WITH PASSWORD 'conectcrm123';
    END IF;
END
$$;

-- Criar banco de dados se não existir
SELECT 'CREATE DATABASE conectcrm_db OWNER conectcrm;'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'conectcrm_db')\gexec

-- Conceder privilégios ao usuário
GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;
GRANT ALL ON SCHEMA public TO conectcrm;
GRANT ALL ON ALL TABLES IN SCHEMA public TO conectcrm;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO conectcrm;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO conectcrm;

-- Definir privilégios padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO conectcrm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO conectcrm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO conectcrm;

-- Verificar se foi criado corretamente
\du conectcrm
\l conectcrm_db
