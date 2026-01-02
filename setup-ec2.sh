#!/bin/bash

#####################################################
# Script de Setup Automatizado - EC2 Ubuntu 24.04
# ConectCRM - Deploy AWS
#####################################################

set -e  # Para execução em caso de erro

echo "🚀 Iniciando setup da instância EC2..."
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# 2. Instalar dependências básicas
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    wget \
    unzip \
    ufw

# 3. Instalar Docker
echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Adicionar chave GPG oficial do Docker
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Adicionar repositório Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Adicionar usuário atual ao grupo docker
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✅ Docker instalado com sucesso!${NC}"
else
    echo -e "${GREEN}✅ Docker já está instalado${NC}"
fi

# 4. Verificar Docker Compose
echo -e "${YELLOW}🐳 Verificando Docker Compose...${NC}"
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose já está instalado${NC}"
else
    echo -e "${RED}❌ Docker Compose não encontrado!${NC}"
    exit 1
fi

# 5. Configurar Firewall (UFW)
echo -e "${YELLOW}🔥 Configurando Firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 3000/tcp comment 'Frontend React'
sudo ufw allow 3500/tcp comment 'Backend NestJS'
sudo ufw reload
echo -e "${GREEN}✅ Firewall configurado!${NC}"

# 6. Criar diretório de deploy
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

# 7. Configurar Git
echo -e "${YELLOW}🔧 Configurando Git...${NC}"
git config --global user.name "Deploy Bot"
git config --global user.email "deploy@conectcrm.com"

# 8. Verificar versões instaladas
echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo "================================================"
echo ""
echo "📋 Versões instaladas:"
echo "   Docker: $(docker --version)"
echo "   Docker Compose: $(docker compose version)"
echo "   Git: $(git --version)"
echo ""
echo "🔥 Firewall (UFW) status:"
sudo ufw status numbered
echo ""
echo "📁 Diretório de deploy: /home/ubuntu/apps"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Faça logout e login novamente para aplicar permissões do Docker!${NC}"
echo -e "${YELLOW}   Comando: exit (depois conecte novamente)${NC}"
echo ""
