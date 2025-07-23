-- Script de inicialização do banco ConectCRM
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar esquemas se necessário
-- CREATE SCHEMA IF NOT EXISTS app;

-- Mensagem de sucesso
SELECT 'Banco ConectCRM inicializado com sucesso!' as status;
