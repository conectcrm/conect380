#!/bin/bash

# ==========================================
# SCRIPT DE MIGRAÇÃO COMPLETA - CONECT CRM
# ==========================================
# Script para executar a migração completa de domínios

echo "🚀 Iniciando migração de domínios Fênix → Conect CRM..."

# Verificar se o PostgreSQL está rodando
if ! docker ps | grep -q "conectcrm-postgres"; then
    echo "❌ PostgreSQL não está rodando. Execute setup-docker-postgres.bat primeiro."
    exit 1
fi

echo "📊 Executando script de atualização de domínios..."

# Executar script de atualização
docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db -f /tmp/update-domains.sql

echo "✅ Migração de domínios concluída!"

echo ""
echo "📋 CREDENCIAIS ATUALIZADAS:"
echo "=========================================="
echo "Email: admin@conectcrm.com     | Senha: admin123"
echo "Email: maria@conectcrm.com     | Senha: manager123"  
echo "Email: joao@conectcrm.com      | Senha: vendedor123"
echo "=========================================="
echo ""
echo "🏢 EMPRESA ATUALIZADA:"
echo "=========================================="
echo "Nome: Conect Tecnologia"
echo "Email: contato@conectcrm.com.br"
echo "Slug: conect-tecnologia"
echo "=========================================="
