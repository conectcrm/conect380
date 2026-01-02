#!/bin/bash

# ============================================
# Script de Deploy para AWS EC2
# ============================================

set -e  # Exit on error

echo "🚀 Iniciando deploy do ConectCRM na AWS..."

# ============================================
# 1. Verificar dependências
# ============================================
echo "📋 Verificando dependências..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

# ============================================
# 2. Configurar variáveis de ambiente
# ============================================
echo "🔐 Configurando variáveis de ambiente..."

if [ ! -f "backend/.env.production" ]; then
    echo "❌ Arquivo backend/.env.production não encontrado!"
    echo "📝 Copie .env.production.example e configure as variáveis:"
    echo "   cp backend/.env.production.example backend/.env.production"
    exit 1
fi

# ============================================
# 3. Parar containers antigos
# ============================================
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down || true

# ============================================
# 4. Limpar imagens antigas (opcional)
# ============================================
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# ============================================
# 5. Build das imagens
# ============================================
echo "🏗️  Fazendo build das imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# ============================================
# 6. Executar migrations do banco de dados
# ============================================
echo "📊 Executando migrations do banco de dados..."
docker-compose -f docker-compose.prod.yml up -d postgres

# Aguardar PostgreSQL iniciar
echo "⏳ Aguardando PostgreSQL iniciar..."
sleep 10

# Executar migrations
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run

# ============================================
# 7. Subir todos os serviços
# ============================================
echo "🚀 Iniciando todos os serviços..."
docker-compose -f docker-compose.prod.yml up -d

# ============================================
# 8. Verificar status
# ============================================
echo "✅ Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# ============================================
# 9. Logs
# ============================================
echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📝 Para ver os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔍 Para verificar o status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🌐 Acesse a aplicação:"
echo "   Frontend: http://seu-ip-ou-dominio"
echo "   Backend:  http://seu-ip-ou-dominio:3001"
echo ""
