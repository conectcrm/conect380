# 🔐 Guia de Configuração SSL/HTTPS

## 📋 Índice
1. [Certificados Auto-assinados (Desenvolvimento)](#desenvolvimento)
2. [Let's Encrypt (Produção Linux)](#producao-linux)
3. [IIS/Windows Server (Produção Windows)](#producao-windows)
4. [Configuração do Backend](#configuracao-backend)
5. [Verificação e Testes](#verificacao)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 1. Certificados Auto-assinados (Desenvolvimento) {#desenvolvimento}

### Windows (PowerShell)

**Gerar certificado auto-assinado**:
```powershell
# Criar pasta de certificados
New-Item -Path "backend\certs" -ItemType Directory -Force

# Gerar certificado (válido por 365 dias)
$cert = New-SelfSignedCertificate `
  -Subject "localhost" `
  -DnsName "localhost", "127.0.0.1" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -NotAfter (Get-Date).AddDays(365)

# Exportar para arquivo PEM
$certPath = "backend\certs\cert.pem"
$keyPath = "backend\certs\key.pem"

# Exportar certificado
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n"
$certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem += "`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath $certPath -Encoding ASCII

# Exportar chave privada (requer conversão manual - use OpenSSL)
Write-Host "✅ Certificado criado: $certPath" -ForegroundColor Green
Write-Host "⚠️  Para a chave privada, use OpenSSL:" -ForegroundColor Yellow
Write-Host "   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes" -ForegroundColor Cyan
```

**Alternativa com OpenSSL (recomendado)**:
```bash
# Instalar OpenSSL: https://slproweb.com/products/Win32OpenSSL.html

# Gerar certificado e chave
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout backend/certs/key.pem \
  -out backend/certs/cert.pem \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=ConectCRM/CN=localhost"

# ✅ Resultado:
#    backend/certs/cert.pem (certificado)
#    backend/certs/key.pem (chave privada)
```

### Linux/macOS

```bash
# Criar pasta
mkdir -p backend/certs

# Gerar certificado auto-assinado
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout backend/certs/key.pem \
  -out backend/certs/cert.pem \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=ConectCRM/CN=localhost"

echo "✅ Certificados gerados em backend/certs/"
```

### Confiar no Certificado (Opcional - evita avisos no browser)

**Windows**:
```powershell
# Importar certificado para a store de certificados confiáveis
Import-Certificate -FilePath "backend\certs\cert.pem" -CertStoreLocation "Cert:\CurrentUser\Root"
```

**macOS**:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain backend/certs/cert.pem
```

**Linux (Chrome/Chromium)**:
```bash
sudo cp backend/certs/cert.pem /usr/local/share/ca-certificates/conectcrm.crt
sudo update-ca-certificates
```

---

## 🌐 2. Let's Encrypt (Produção Linux) {#producao-linux}

### Pré-requisitos
- ✅ Servidor Linux (Ubuntu/Debian/CentOS)
- ✅ Domínio apontando para o servidor (DNS configurado)
- ✅ Porta 80 aberta no firewall (para validação HTTP)
- ✅ Acesso root/sudo

### Instalação Automática (Script)

```bash
# 1. Baixar script de configuração
cd /var/www/conectcrm/backend
wget https://raw.githubusercontent.com/seu-repo/conectcrm/main/backend/ssl-setup.sh

# 2. Dar permissão de execução
chmod +x ssl-setup.sh

# 3. Executar (como root)
sudo ./ssl-setup.sh

# 4. Seguir instruções interativas
#    - Informar domínio (ex: api.conectcrm.com.br)
#    - Informar e-mail (para notificações)
#    - Confirmar
```

### Instalação Manual (Certbot)

**Ubuntu/Debian**:
```bash
# 1. Instalar Certbot
sudo apt-get update
sudo apt-get install -y certbot

# 2. Obter certificado (standalone - porta 80 precisa estar livre)
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email seu-email@empresa.com \
  --domains api.conectcrm.com.br

# 3. Certificados ficam em:
#    /etc/letsencrypt/live/api.conectcrm.com.br/fullchain.pem
#    /etc/letsencrypt/live/api.conectcrm.com.br/privkey.pem

# 4. Copiar para o backend
sudo mkdir -p /var/www/conectcrm/backend/certs
sudo cp /etc/letsencrypt/live/api.conectcrm.com.br/fullchain.pem /var/www/conectcrm/backend/certs/cert.pem
sudo cp /etc/letsencrypt/live/api.conectcrm.com.br/privkey.pem /var/www/conectcrm/backend/certs/key.pem

# 5. Ajustar permissões
sudo chown -R www-data:www-data /var/www/conectcrm/backend/certs
sudo chmod 600 /var/www/conectcrm/backend/certs/key.pem
sudo chmod 644 /var/www/conectcrm/backend/certs/cert.pem
```

**CentOS/RHEL**:
```bash
# 1. Instalar Certbot
sudo yum install -y certbot

# 2. Seguir mesmos passos do Ubuntu
```

### Renovação Automática

**Criar hook de renovação**:
```bash
# 1. Criar script de hook
sudo nano /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh
```

**Conteúdo do hook**:
```bash
#!/bin/bash
# Script executado após renovação bem-sucedida

DOMAIN="api.conectcrm.com.br"
BACKEND_CERTS="/var/www/conectcrm/backend/certs"

# Copiar certificados renovados
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $BACKEND_CERTS/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $BACKEND_CERTS/key.pem

# Ajustar permissões
chown -R www-data:www-data $BACKEND_CERTS
chmod 600 $BACKEND_CERTS/key.pem
chmod 644 $BACKEND_CERTS/cert.pem

# Reiniciar backend (escolha um)
systemctl restart conectcrm-backend  # Se usar systemd
# OU
pm2 restart conectcrm-backend        # Se usar PM2

echo "✅ Certificados SSL renovados e backend reiniciado"
```

**Dar permissão e testar**:
```bash
# Permissão de execução
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh

# Testar renovação (dry-run - não renova de verdade)
sudo certbot renew --dry-run

# ✅ Se sucesso: renovação automática funcionando!
```

**Verificar cron de renovação**:
```bash
# Certbot cria automaticamente um timer/cron
systemctl status certbot.timer  # systemd
# OU
cat /etc/cron.d/certbot          # cron tradicional
```

---

## 🪟 3. IIS/Windows Server (Produção Windows) {#producao-windows}

### Opção 1: Win-ACME (Let's Encrypt para Windows)

```powershell
# 1. Baixar Win-ACME
# https://github.com/win-acme/win-acme/releases

# 2. Executar
wacs.exe

# 3. Seguir wizard interativo
#    - Escolher "Create new certificate (simple for IIS)"
#    - Selecionar site/domínio
#    - Confirmar

# 4. Certificados ficam em: C:\ProgramData\win-acme\
```

### Opção 2: Certificado Comercial (Comprado)

1. Comprar certificado (Sectigo, DigiCert, etc)
2. Gerar CSR (Certificate Signing Request)
3. Validar domínio com a CA
4. Baixar certificado (.pfx ou .pem)
5. Instalar no IIS/Backend

---

## ⚙️ 4. Configuração do Backend {#configuracao-backend}

### Arquivo `.env`

```bash
# SSL/HTTPS
SSL_ENABLED=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
FORCE_HTTPS=false  # true para forçar HTTPS mesmo em dev

# Ambiente
NODE_ENV=production  # HTTPS redirect ativo apenas em produção
```

### Verificar Estrutura de Arquivos

```
backend/
├── certs/
│   ├── cert.pem      ← Certificado SSL
│   └── key.pem       ← Chave privada
├── .env              ← Configuração SSL
├── src/
│   └── main.ts       ← Helmet + HTTPS redirect
└── ...
```

### Reiniciar Backend

**Desenvolvimento**:
```bash
cd backend
npm run start:dev
```

**Produção (PM2)**:
```bash
pm2 restart conectcrm-backend
pm2 logs conectcrm-backend  # Ver logs
```

**Produção (systemd)**:
```bash
sudo systemctl restart conectcrm-backend
sudo systemctl status conectcrm-backend
```

---

## ✅ 5. Verificação e Testes {#verificacao}

### Verificar Logs do Backend

```bash
# Procurar por:
# 🔐 [SSL] HTTPS habilitado
# 🛡️  [Helmet] Security headers habilitados (PRODUÇÃO)
# ✅ HSTS: 1 ano, includeSubDomains, preload

# Se aparecer:
# ⚠️  [SSL] Certificados não encontrados. Usando HTTP.
# → Verificar caminhos em .env
```

### Testar HTTPS

**Browser**:
```
https://localhost:3001          (desenvolvimento)
https://api.conectcrm.com.br    (produção)
```

**Curl**:
```bash
# Desenvolvimento (ignora certificado auto-assinado)
curl -k https://localhost:3001/health

# Produção (valida certificado)
curl https://api.conectcrm.com.br/health
```

### Verificar Security Headers

**Online**:
- https://securityheaders.com/
- Digite: https://api.conectcrm.com.br

**Curl (verificar manualmente)**:
```bash
curl -I https://api.conectcrm.com.br/health

# Esperado:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
```

### Testar Redirect HTTP → HTTPS

```bash
# Em produção, HTTP deve redirecionar para HTTPS
curl -I http://api.conectcrm.com.br/health

# Esperado:
# HTTP/1.1 301 Moved Permanently
# Location: https://api.conectcrm.com.br/health
```

### Verificar Validade do Certificado

**OpenSSL**:
```bash
openssl s_client -connect api.conectcrm.com.br:443 -servername api.conectcrm.com.br < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Saída:
# notBefore=Nov 12 00:00:00 2025 GMT
# notAfter=Feb 10 23:59:59 2026 GMT
```

**Online**:
- https://www.ssllabs.com/ssltest/
- Digite: api.conectcrm.com.br
- **Meta**: Score A ou A+

---

## 🔧 6. Troubleshooting {#troubleshooting}

### ❌ Problema: "Certificados não encontrados"

**Causa**: Caminhos errados em `.env` ou arquivos não existem

**Solução**:
```bash
# 1. Verificar se arquivos existem
ls -la backend/certs/

# 2. Verificar permissões
chmod 600 backend/certs/key.pem
chmod 644 backend/certs/cert.pem

# 3. Verificar caminhos no .env
cat backend/.env | grep SSL

# 4. Se caminhos relativos não funcionarem, usar absolutos
SSL_CERT_PATH=/var/www/conectcrm/backend/certs/cert.pem
SSL_KEY_PATH=/var/www/conectcrm/backend/certs/key.pem
```

### ❌ Problema: "HTTPS não está funcionando"

**Causa**: `SSL_ENABLED=false` ou porta errada

**Solução**:
```bash
# 1. Verificar variável
grep SSL_ENABLED backend/.env
# Deve ser: SSL_ENABLED=true

# 2. Verificar porta HTTPS (443 em produção)
# Backend roda na porta do .env (3001), mas HTTPS precisa de 443
# Usar nginx/apache como proxy reverso

# 3. Reiniciar backend
pm2 restart conectcrm-backend
```

### ❌ Problema: "Browser avisa 'Conexão não é segura'"

**Causa**: Certificado auto-assinado (desenvolvimento) ou inválido

**Solução (desenvolvimento)**:
```
1. Chrome: Clicar "Avançado" → "Acessar localhost (inseguro)"
2. OU: Adicionar exceção de segurança
3. OU: Confiar no certificado (ver seção 1)
```

**Solução (produção)**:
```
1. Usar Let's Encrypt (certificado válido)
2. Verificar DNS do domínio
3. Verificar validade: openssl s_client -connect ...
```

### ❌ Problema: "Let's Encrypt falha na validação"

**Causa**: DNS não aponta para o servidor ou porta 80 bloqueada

**Solução**:
```bash
# 1. Verificar DNS
nslookup api.conectcrm.com.br
# Deve retornar IP do servidor

# 2. Verificar porta 80 acessível
curl -I http://api.conectcrm.com.br
# Se timeout: firewall bloqueando

# 3. Abrir porta 80 no firewall
sudo ufw allow 80/tcp  # Ubuntu
# OU
sudo firewall-cmd --add-port=80/tcp --permanent  # CentOS
sudo firewall-cmd --reload
```

### ❌ Problema: "Renovação automática não funciona"

**Causa**: Hook não executável ou erro no script

**Solução**:
```bash
# 1. Verificar permissões do hook
ls -la /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh
# Deve ter: -rwxr-xr-x (executável)

# 2. Dar permissão
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh

# 3. Testar manualmente
sudo bash /etc/letsencrypt/renewal-hooks/post/conectcrm-backend.sh

# 4. Verificar logs do certbot
sudo cat /var/log/letsencrypt/letsencrypt.log
```

### ❌ Problema: "HSTS causando erro após desabilitar HTTPS"

**Causa**: Browser cacheia HSTS header (força HTTPS por 1 ano)

**Solução**:
```
Chrome:
1. Ir para: chrome://net-internals/#hsts
2. Em "Delete domain security policies"
3. Digite: localhost (ou seu domínio)
4. Clicar "Delete"
5. Limpar cache: Ctrl+Shift+Del

Firefox:
1. Fechar Firefox
2. Deletar: ~/Library/Application Support/Firefox/Profiles/*.default/SiteSecurityServiceState.txt
3. Reabrir Firefox
```

---

## 📚 Referências

- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Certbot**: https://certbot.eff.org/docs/
- **Helmet.js**: https://helmetjs.github.io/
- **OWASP HTTPS**: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/

---

**Autor**: ConectCRM  
**Última Atualização**: 12/11/2025  
**Versão**: 1.0
