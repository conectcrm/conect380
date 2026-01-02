#!/bin/bash

#####################################################
# Script de Deploy Completo - AWS EC2
# ConectCRM - Produção
#####################################################

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Iniciando Deploy ConectCRM na AWS"
echo "================================================"

# 1. Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.prod.yml não encontrado!${NC}"
    echo "Execute este script na raiz do projeto ConectCRM"
    exit 1
fi

# 2. Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Erro: .env.production não encontrado!${NC}"
    echo "Crie o arquivo .env.production com as configurações de produção"
    exit 1
fi

# 3. Parar containers antigos (se existirem)
echo -e "${YELLOW}🛑 Parando containers antigos...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# 4. Remover volumes antigos (CUIDADO: isso apaga o banco!)
# Descomente se quiser limpar tudo:
# docker volume rm conectcrm_postgres-data 2>/dev/null || true

# 5. Build das imagens
echo -e "${YELLOW}🔨 Construindo imagens Docker...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# 6. Subir apenas o banco primeiro
echo -e "${YELLOW}🗄️  Iniciando banco de dados...${NC}"
docker compose -f docker-compose.prod.yml up -d postgres

# Aguardar banco ficar pronto
echo -e "${YELLOW}⏳ Aguardando PostgreSQL inicializar (30 segundos)...${NC}"
sleep 30

# 7. Executar migrations
echo -e "${YELLOW}🔄 Executando migrations...${NC}"
docker compose -f docker-compose.prod.yml run --rm backend npm run migration:run

# 8. Subir todos os serviços
echo -e "${YELLOW}🚀 Iniciando todos os serviços...${NC}"
docker compose -f docker-compose.prod.yml up -d

# 9. Aguardar containers iniciarem
echo -e "${YELLOW}⏳ Aguardando serviços iniciarem (20 segundos)...${NC}"
sleep 20

# 10. Verificar status
echo ""
echo "================================================"
echo -e "${GREEN}✅ Deploy Concluído!${NC}"
echo "================================================"
echo ""
echo "📊 Status dos Containers:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "🔗 URLs de Acesso:"
echo "   Frontend: http://56.124.63.239:3000"
echo "   Backend:  http://56.124.63.239:3500"
echo "   Health:   http://56.124.63.239:3500/health"
echo ""
echo "📋 Comandos Úteis:"
echo "   Ver logs backend:   docker logs -f conectcrm-backend-prod"
echo "   Ver logs frontend:  docker logs -f conectcrm-frontend-prod"
echo "   Ver logs postgres:  docker logs -f conectcrm-postgres-prod"
echo "   Parar tudo:        docker compose -f docker-compose.prod.yml down"
echo "   Reiniciar:         docker compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo "1. Testar acesso ao frontend: http://56.124.63.239:3000"
echo "2. Testar API backend: http://56.124.63.239:3500/health"
echo "3. Configurar webhook WhatsApp com URL: http://56.124.63.239:3500/webhook/whatsapp"
echo "4. Configurar domínio (app.conectcrm.com.br) no Route 53"
echo "5. Configurar SSL/TLS com certificado ACM"
echo ""
