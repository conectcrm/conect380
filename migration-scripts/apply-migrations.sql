-- ============================================================================
-- Script: Criar Schema ConectSuite (via migrations compiladas)
-- Data: 26/11/2025
-- Objetivo: Executar todas as migrations para criar estrutura completa
-- ============================================================================

-- Nota: Este script deve ser executado no container conectsuite-postgres
-- Comando: docker exec -i conectsuite-postgres psql -U postgres -d conectcrm -f apply-migrations.sql

\echo '🔧 Aplicando Migrations do ConectSuite...'
\echo ''

-- Verificar se já foi executado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '⚠️  Tabelas já existem. Pulando criação.';
    ELSE
        RAISE NOTICE '✅ Pronto para criar tabelas.';
    END IF;
END $$;

-- Como as migrations são TypeScript/JavaScript compiladas, vamos executá-las via TypeORM
-- Para isso, precisamos usar o comando npm run migration:run do backend

\echo ''
\echo '📝 INSTRUÇÕES PARA EXECUTAR MIGRATIONS:'
\echo ''
\echo '1. Parar qualquer Postgres local na porta 5432:'
\echo '   Get-Process postgres | Stop-Process -Force'
\echo ''
\echo '2. Criar túnel para o container:'
\echo '   docker exec -it conectsuite-postgres bash'
\echo '   psql -U postgres -d conectcrm'
\echo ''
\echo '3. OU usar docker exec direto do backend:'
\echo '   cd backend'
\echo '   Alterar .env temporariamente:'
\echo '   DATABASE_HOST=127.0.0.1'
\echo '   DATABASE_PORT=5432'
\echo '   npm run migration:run'
\echo ''
