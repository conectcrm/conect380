#!/bin/bash

# ============================================
# Script de Configuração SSL - Let's Encrypt
# ConectCRM Backend
# ============================================

set -e  # Exit on error

echo "🔐 ============================================"
echo "   Configuração SSL - Let's Encrypt"
echo "============================================"
echo ""

# Verificar se está rodando como root/sudo
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Este script precisa ser executado como root/sudo"
  echo "   Execute: sudo bash ssl-setup.sh"
  exit 1
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
  echo "📦 Certbot não encontrado. Instalando..."
  
  # Detectar sistema operacional
  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y certbot
    echo "✅ Certbot instalado (Debian/Ubuntu)"
  elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL/Fedora
    yum install -y certbot
    echo "✅ Certbot instalado (CentOS/RHEL)"
  else
    echo "❌ Sistema operacional não suportado"
    echo "   Instale o Certbot manualmente: https://certbot.eff.org/"
    exit 1
  fi
else
  echo "✅ Certbot já instalado: $(certbot --version)"
fi

echo ""
echo "📋 Informações Necessárias:"
echo ""

# Solicitar domínio
read -p "Digite o domínio (ex: api.conectcrm.com.br): " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo "❌ Domínio não pode ser vazio"
  exit 1
fi

# Solicitar email
read -p "Digite seu e-mail (para notificações do Let's Encrypt): " EMAIL
if [ -z "$EMAIL" ]; then
  echo "❌ E-mail não pode ser vazio"
  exit 1
fi

echo ""
echo "📝 Configuração:"
echo "   Domínio: $DOMAIN"
echo "   E-mail: $EMAIL"
echo ""

# Confirmar
read -p "Confirmar? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "❌ Cancelado pelo usuário"
  exit 0
fi

echo ""
echo "🚀 Iniciando processo..."
echo ""

# Verificar se a porta 80 está livre (necessária para validação HTTP)
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Porta 80 em uso. Parando processo temporariamente..."
  # Se for nginx ou apache, parar
  if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    RESTART_NGINX=true
  fi
  if systemctl is-active --quiet apache2; then
    systemctl stop apache2
    RESTART_APACHE=true
  fi
fi

# Solicitar certificado com Let's Encrypt
echo "📜 Solicitando certificado SSL..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --preferred-challenges http

if [ $? -eq 0 ]; then
  echo "✅ Certificado SSL obtido com sucesso!"
else
  echo "❌ Falha ao obter certificado SSL"
  echo "   Verifique se:"
  echo "   1. O domínio $DOMAIN aponta para este servidor (DNS configurado)"
  echo "   2. A porta 80 está acessível externamente (firewall aberto)"
  echo "   3. Não há outro certificado ativo para este domínio"
  exit 1
fi

# Criar diretório de certificados no backend
BACKEND_DIR="/var/www/conectcrm/backend"
CERTS_DIR="$BACKEND_DIR/certs"

echo ""
echo "📁 Criando diretório de certificados..."
mkdir -p "$CERTS_DIR"

# Copiar certificados para o diretório do backend
LETSENCRYPT_DIR="/etc/letsencrypt/live/$DOMAIN"

if [ -d "$LETSENCRYPT_DIR" ]; then
  cp "$LETSENCRYPT_DIR/fullchain.pem" "$CERTS_DIR/cert.pem"
  cp "$LETSENCRYPT_DIR/privkey.pem" "$CERTS_DIR/key.pem"
  
  # Ajustar permissões (backend precisa ler)
  chown -R www-data:www-data "$CERTS_DIR"
  chmod 600 "$CERTS_DIR/key.pem"
  chmod 644 "$CERTS_DIR/cert.pem"
  
  echo "✅ Certificados copiados para $CERTS_DIR"
else
  echo "❌ Diretório de certificados não encontrado: $LETSENCRYPT_DIR"
  exit 1
fi

# Configurar renovação automática
echo ""
echo "🔄 Configurando renovação automática..."

# Criar script de renovação com hook
cat > /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh << EOF
#!/bin/bash
# Script executado após renovação bem-sucedida
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERTS_DIR/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERTS_DIR/key.pem
chown -R www-data:www-data $CERTS_DIR
chmod 600 $CERTS_DIR/key.pem
chmod 644 $CERTS_DIR/cert.pem
systemctl restart conectcrm-backend 2>/dev/null || pm2 restart conectcrm-backend 2>/dev/null || echo "Backend não reiniciado (serviço não encontrado)"
echo "✅ Certificados SSL renovados e backend reiniciado"
EOF

chmod +x /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh
echo "✅ Hook de renovação criado"

# Testar renovação automática (dry-run)
echo ""
echo "🧪 Testando renovação automática..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
  echo "✅ Renovação automática funcionando!"
  echo "   Certificados serão renovados automaticamente a cada 60 dias"
else
  echo "⚠️  Falha no teste de renovação automática"
  echo "   Verifique manualmente: certbot renew --dry-run"
fi

# Reiniciar serviços que foram parados
if [ "$RESTART_NGINX" = true ]; then
  systemctl start nginx
  echo "✅ Nginx reiniciado"
fi
if [ "$RESTART_APACHE" = true ]; then
  systemctl start apache2
  echo "✅ Apache reiniciado"
fi

# Atualizar arquivo .env do backend
ENV_FILE="$BACKEND_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  echo ""
  echo "📝 Atualizando .env..."
  
  # Atualizar ou adicionar variáveis SSL
  if grep -q "SSL_ENABLED" "$ENV_FILE"; then
    sed -i "s/SSL_ENABLED=.*/SSL_ENABLED=true/" "$ENV_FILE"
  else
    echo "SSL_ENABLED=true" >> "$ENV_FILE"
  fi
  
  if grep -q "SSL_CERT_PATH" "$ENV_FILE"; then
    sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=./certs/cert.pem|" "$ENV_FILE"
  else
    echo "SSL_CERT_PATH=./certs/cert.pem" >> "$ENV_FILE"
  fi
  
  if grep -q "SSL_KEY_PATH" "$ENV_FILE"; then
    sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=./certs/key.pem|" "$ENV_FILE"
  else
    echo "SSL_KEY_PATH=./certs/key.pem" >> "$ENV_FILE"
  fi
  
  echo "✅ Arquivo .env atualizado"
else
  echo "⚠️  Arquivo .env não encontrado em $ENV_FILE"
  echo "   Configure manualmente as variáveis:"
  echo "   SSL_ENABLED=true"
  echo "   SSL_CERT_PATH=./certs/cert.pem"
  echo "   SSL_KEY_PATH=./certs/key.pem"
fi

echo ""
echo "🎉 ============================================"
echo "   Configuração SSL Concluída!"
echo "============================================"
echo ""
echo "📋 Resumo:"
echo "   Domínio: $DOMAIN"
echo "   Certificado: $CERTS_DIR/cert.pem"
echo "   Chave: $CERTS_DIR/key.pem"
echo "   Validade: 90 dias (renovação automática)"
echo ""
echo "🔄 Próximos Passos:"
echo "   1. Reinicie o backend: pm2 restart conectcrm-backend"
echo "   2. Verifique HTTPS: https://$DOMAIN"
echo "   3. Teste renovação: sudo certbot renew --dry-run"
echo ""
echo "📖 Documentação:"
echo "   - Let's Encrypt: https://letsencrypt.org/docs/"
echo "   - Certbot: https://certbot.eff.org/docs/"
echo ""
echo "✅ Pronto para produção!"
echo ""
