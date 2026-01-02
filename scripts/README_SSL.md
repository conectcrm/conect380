# 🔐 SSL/HTTPS - Guia Completo de Configuração

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação do Certificado](#instalação-do-certificado)
4. [Configuração do Backend](#configuração-do-backend)
5. [Configuração AWS/Firewall](#configuração-awsfirewall)
6. [Configuração DNS](#configuração-dns)
7. [Renovação Automática](#renovação-automática)
8. [Validação](#validação)
9. [Troubleshooting](#troubleshooting)
10. [Monitoramento](#monitoramento)

---

## 🎯 Visão Geral

Este guia cobre a configuração completa de SSL/HTTPS para o ConectCRM usando **Let's Encrypt** (certificados gratuitos e automatizados).

### O que é SSL/HTTPS?

- **SSL** (Secure Sockets Layer): Protocolo de segurança para criptografar comunicações
- **HTTPS**: HTTP com SSL (porta 443)
- **Let's Encrypt**: Autoridade certificadora gratuita e automatizada
- **Certbot**: Ferramenta oficial para obter certificados Let's Encrypt

### Por que é obrigatório?

✅ **Segurança**: Criptografa dados sensíveis (senhas, tokens, dados pessoais)  
✅ **Conformidade**: LGPD/GDPR exigem HTTPS para dados pessoais  
✅ **SEO**: Google penaliza sites sem HTTPS  
✅ **APIs**: WhatsApp, pagamentos, webhooks exigem HTTPS  
✅ **Confiança**: Navegadores marcam HTTP como "Não Seguro"  

---

## ✅ Pré-requisitos

### 1. Domínio Configurado

Você precisa de um **domínio próprio** (ex: `conectcrm.com.br` ou `app.conectcrm.com.br`).

**Não funciona com:**
- ❌ `localhost`
- ❌ Endereços IP (`192.168.1.100`, `3.45.67.89`)
- ❌ Domínios `.local`

**Onde comprar domínio:**
- [Registro.br](https://registro.br) (domínios `.br`)
- [GoDaddy](https://godaddy.com)
- [Namecheap](https://namecheap.com)
- [AWS Route 53](https://aws.amazon.com/route53/)

---

### 2. Servidor com Porta 80 Liberada

O Let's Encrypt precisa **validar** que você controla o domínio. Para isso:

✅ **Porta 80 deve estar:**
- Acessível externamente (liberar no firewall/security group)
- Sem nenhum serviço rodando (Certbot vai usar temporariamente)

**Verificar se porta 80 está livre:**

```powershell
# Windows
Test-NetConnection -ComputerName localhost -Port 80

# Linux
sudo lsof -i :80
```

---

### 3. DNS Configurado

O domínio deve apontar para o servidor (registro A):

```
Tipo: A
Nome: @ (ou app, api, etc.)
Valor: 3.45.67.89 (IP público do servidor)
TTL: 300
```

**Verificar DNS:**

```powershell
# Windows/Linux
nslookup conectcrm.com.br

# Deve retornar o IP do servidor
```

⏰ **Importante**: DNS pode levar até 24h para propagar (geralmente 5-30 minutos).

---

## 📦 Instalação do Certificado

### Método 1: Script Automatizado (Recomendado)

```powershell
# Executar script de instalação
.\scripts\setup-ssl.ps1 -Domain "conectcrm.com.br" -Email "admin@conectsuite.com.br"

# Para testes (staging - não é certificado válido)
.\scripts\setup-ssl.ps1 -Domain "test.conectcrm.com.br" -Email "dev@conectcrm.com.br" -Staging
```

**O que o script faz:**

1. ✅ Verifica sistema operacional (Windows/Linux)
2. ✅ Instala Certbot (via Chocolatey no Windows, apt/yum no Linux)
3. ✅ Valida pré-requisitos (porta 80, DNS)
4. ✅ Gera certificado Let's Encrypt
5. ✅ Copia certificados para `certs/`
6. ✅ Valida certificado gerado

---

### Método 2: Manual

#### Windows (PowerShell como Administrador):

```powershell
# 1. Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar Certbot
choco install certbot -y

# 3. Gerar certificado
certbot certonly --standalone --agree-tos --email admin@conectsuite.com.br -d conectcrm.com.br

# 4. Copiar certificados
New-Item -ItemType Directory -Path "certs" -Force
Copy-Item "C:\Certbot\live\conectcrm.com.br\fullchain.pem" "certs\cert.pem"
Copy-Item "C:\Certbot\live\conectcrm.com.br\privkey.pem" "certs\key.pem"
```

#### Linux (Ubuntu/Debian):

```bash
# 1. Instalar Certbot
sudo apt-get update
sudo apt-get install -y certbot

# 2. Gerar certificado
sudo certbot certonly --standalone --agree-tos --email admin@conectsuite.com.br -d conectcrm.com.br

# 3. Copiar certificados
mkdir -p certs
sudo cp /etc/letsencrypt/live/conectcrm.com.br/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/conectcrm.com.br/privkey.pem certs/key.pem
sudo chmod 644 certs/*.pem
```

---

## ⚙️ Configuração do Backend

### 1. Adicionar Variáveis de Ambiente

Edite `backend/.env`:

```env
# SSL/HTTPS Configuration
SSL_ENABLED=true
SSL_CERT_PATH=../certs/cert.pem
SSL_KEY_PATH=../certs/key.pem

# Ambiente (produção força HTTPS)
NODE_ENV=production
FORCE_HTTPS=true
```

**Explicação:**

- `SSL_ENABLED=true` → Habilita HTTPS no NestJS
- `SSL_CERT_PATH` → Caminho do certificado (fullchain.pem)
- `SSL_KEY_PATH` → Caminho da chave privada (privkey.pem)
- `NODE_ENV=production` → Força redirecionamento HTTP→HTTPS
- `FORCE_HTTPS=true` → Força HTTPS mesmo em dev (opcional)

---

### 2. Estrutura de Arquivos

```
conectcrm/
├── certs/                      # Certificados SSL
│   ├── cert.pem               # Certificado público
│   ├── key.pem                # Chave privada
│   └── chain.pem              # Cadeia de certificação (opcional)
├── backend/
│   ├── .env                   # Configurações SSL
│   └── src/
│       ├── main.ts            # Configuração HTTPS
│       └── common/
│           └── middleware/
│               └── https-redirect.middleware.ts  # Redirect HTTP→HTTPS
└── scripts/
    ├── setup-ssl.ps1          # Instalação do certificado
    └── setup-ssl-renewal.ps1  # Renovação automática
```

---

### 3. Reiniciar Backend

```powershell
cd backend
npm run start:dev
```

**Saída esperada:**

```
🚀 [NestJS] Iniciando aplicação...
🔐 [SSL] HTTPS habilitado
   Certificado: C:\Projetos\conectcrm\certs\cert.pem
   Chave: C:\Projetos\conectcrm\certs\key.pem
✅ [NestJS] AppModule criado com sucesso
🚀 Conect CRM Backend rodando na porta 3001 (HTTPS)
📖 Documentação disponível em: https://localhost:3001/api-docs
🔐 Conexão segura HTTPS ativada
```

---

## 🔥 Configuração AWS/Firewall

### AWS Security Group

Acesse: **EC2 → Security Groups → ConectCRM-SG**

**Regras de Entrada (Inbound):**

| Tipo | Protocolo | Porta | Origem | Descrição |
|------|-----------|-------|--------|-----------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Certbot validation + HTTP redirect |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS (produção) |
| SSH | TCP | 22 | Seu IP | Acesso SSH |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 | Backend API (temporário) |

**Após tudo funcionar:**

Remova a regra da porta 3001 e use apenas:
- **80** → Redireciona para HTTPS
- **443** → HTTPS (único acesso externo)

---

### Nginx Reverse Proxy (Recomendado para Produção)

Em produção, use **Nginx** como proxy reverso:

```nginx
# /etc/nginx/sites-available/conectcrm

server {
    listen 80;
    server_name conectcrm.com.br;
    
    # Redirecionar HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name conectcrm.com.br;
    
    # Certificados SSL
    ssl_certificate /home/ubuntu/conectcrm/certs/cert.pem;
    ssl_certificate_key /home/ubuntu/conectcrm/certs/key.pem;
    
    # Segurança SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar configuração:**

```bash
sudo ln -s /etc/nginx/sites-available/conectcrm /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

---

## 🌐 Configuração DNS

### Exemplo (AWS Route 53)

1. Acesse **Route 53 → Hosted zones**
2. Selecione seu domínio (`conectcrm.com.br`)
3. Criar registros:

**Registro A (Principal):**

```
Nome: @ (ou deixe vazio)
Tipo: A
Valor: 3.45.67.89 (IP público do servidor)
TTL: 300
```

**Registro A (Subdomínio - opcional):**

```
Nome: api
Tipo: A
Valor: 3.45.67.89
TTL: 300
```

Agora você pode acessar:
- `https://conectcrm.com.br` → Frontend
- `https://api.conectcrm.com.br` → Backend

---

## 🔄 Renovação Automática

### Certificados Let's Encrypt Expiram em 90 Dias!

**Configurar renovação automática:**

```powershell
# Configurar renovação mensal (recomendado)
.\scripts\setup-ssl-renewal.ps1 -Domain "conectcrm.com.br" -Schedule Monthly

# Testar renovação sem agendar
.\scripts\setup-ssl-renewal.ps1 -Domain "conectcrm.com.br" -TestRenewal
```

**O que o script faz:**

1. ✅ Cria script de renovação (`renew-ssl-certificate.ps1`)
2. ✅ Agenda no Task Scheduler (Windows) ou cron (Linux)
3. ✅ Executa `certbot renew` mensalmente
4. ✅ Copia certificados atualizados para `certs/`
5. ✅ Loga resultado em `logs/ssl-renewal.log`

---

### Windows Task Scheduler

**Verificar task:**

1. Abrir **Task Scheduler** (`taskschd.msc`)
2. Navegar: **Task Scheduler Library**
3. Encontrar: **ConectCRM SSL Renewal**
4. Botão direito → **Run** (testar manualmente)

---

### Linux Cron Job

**Verificar cron:**

```bash
# Listar cron jobs
sudo crontab -l

# Editar cron
sudo crontab -e
```

**Entrada esperada:**

```cron
# Renovar certificado SSL mensalmente (dia 1 às 02:00)
0 2 1 * * pwsh -NoProfile -ExecutionPolicy Bypass -File "/home/ubuntu/conectcrm/scripts/renew-ssl-certificate.ps1"
```

---

## ✅ Validação

### 1. Testar Localmente

```powershell
# Testar backend HTTPS
Invoke-WebRequest -Uri https://localhost:3001/health -SkipCertificateCheck

# Deve retornar 200 OK
```

---

### 2. Testar Publicamente

```powershell
# Testar domínio
Invoke-WebRequest -Uri https://conectcrm.com.br/api/health

# Verificar certificado
openssl s_client -connect conectcrm.com.br:443 -showcerts
```

---

### 3. SSL Labs (Teste Completo)

Acesse: https://www.ssllabs.com/ssltest/

Digite seu domínio e aguarde análise (2-3 minutos).

**Nota esperada:** A ou A+

---

### 4. Verificar Certificado no Navegador

1. Acessar `https://conectcrm.com.br`
2. Clicar no **cadeado** ao lado da URL
3. Ver detalhes do certificado

**Informações esperadas:**
- Emitido por: Let's Encrypt Authority X3
- Válido para: conectcrm.com.br
- Válido até: (90 dias a partir da emissão)

---

## 🔧 Troubleshooting

### Erro: "Port 80 is already in use"

**Causa:** Outro serviço está usando porta 80.

**Solução:**

```powershell
# Windows - Identificar processo
Get-Process -Id (Get-NetTCPConnection -LocalPort 80).OwningProcess

# Parar processo temporariamente
Stop-Process -Id <PID> -Force

# Ou parar serviço (ex: IIS)
Stop-Service -Name W3SVC
```

```bash
# Linux - Identificar processo
sudo lsof -i :80

# Parar processo
sudo systemctl stop apache2  # Ou nginx
```

---

### Erro: "DNS resolution failed"

**Causa:** DNS não aponta para o servidor.

**Solução:**

```powershell
# Verificar DNS
nslookup conectcrm.com.br

# Deve retornar o IP público do servidor
# Se não retornar, aguardar propagação (5-30 min)
```

**Dica:** Use `8.8.8.8` (Google DNS) para testar:

```powershell
nslookup conectcrm.com.br 8.8.8.8
```

---

### Erro: "Certificate not valid for domain"

**Causa:** Certificado foi gerado para domínio diferente.

**Solução:**

```powershell
# Verificar domínio do certificado
openssl x509 -in certs/cert.pem -noout -text | Select-String "Subject:"

# Se estiver errado, gerar novamente
.\scripts\setup-ssl.ps1 -Domain "conectcrm-correto.com.br" -Email "admin@conectsuite.com.br"
```

---

### Erro: "Too many requests"

**Causa:** Let's Encrypt tem rate limits (5 certificados/domínio/semana).

**Solução:**

1. Usar **modo staging** para testes:
   ```powershell
   .\scripts\setup-ssl.ps1 -Domain "test.conectcrm.com.br" -Email "dev@conectcrm.com.br" -Staging
   ```

2. Aguardar 1 semana para resetar limite

3. Usar subdomínios diferentes (`app1.conectcrm.com.br`, `app2.conectcrm.com.br`)

---

### Erro: "ERR_SSL_PROTOCOL_ERROR" no navegador

**Causa:** Backend não está usando HTTPS corretamente.

**Solução:**

```powershell
# 1. Verificar .env
Get-Content backend\.env | Select-String "SSL"

# Deve ter:
# SSL_ENABLED=true
# SSL_CERT_PATH=../certs/cert.pem
# SSL_KEY_PATH=../certs/key.pem

# 2. Verificar se certificados existem
Test-Path certs\cert.pem
Test-Path certs\key.pem

# 3. Reiniciar backend
cd backend
npm run start:dev
```

---

## 📊 Monitoramento

### 1. Verificar Expiração do Certificado

```powershell
# Verificar data de expiração
openssl x509 -in certs/cert.pem -noout -enddate

# Output: notAfter=Feb 1 12:00:00 2026 GMT
```

**Script de verificação:**

```powershell
# Adicionar ao Task Scheduler (diário)
$certPath = "C:\Projetos\conectcrm\certs\cert.pem"
$expiryDate = openssl x509 -in $certPath -noout -enddate | Select-String "notAfter=" | ForEach-Object { $_ -replace "notAfter=", "" }
$daysLeft = ((Get-Date $expiryDate) - (Get-Date)).Days

if ($daysLeft -lt 30) {
    Write-Warning "⚠️ Certificado SSL expira em $daysLeft dias!"
    # Enviar email/alerta
}
```

---

### 2. Logs de Renovação

```powershell
# Verificar logs de renovação
Get-Content logs\ssl-renewal.log -Tail 50

# Buscar erros
Get-Content logs\ssl-renewal.log | Select-String "❌"
```

---

### 3. Alertas Automáticos (Opcional)

**Let's Encrypt envia emails automáticos:**
- 30 dias antes da expiração
- 7 dias antes
- 1 dia antes

**Configure alertas adicionais:**
- Slack webhook quando renovação falhar
- Email quando certificado < 30 dias
- Dashboard com data de expiração

---

## 📚 Referências

### Documentação Oficial

- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Certbot](https://certbot.eff.org/)
- [NestJS HTTPS](https://docs.nestjs.com/faq/http-adapter#https)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)

---

### Rate Limits Let's Encrypt

| Limite | Valor | Janela |
|--------|-------|--------|
| Certificados por domínio | 50 | 7 dias |
| Certificados por conta | 300 | 3 horas |
| Failed validations | 5 | 1 hora |
| Duplicate certificates | 5 | 7 dias |

---

## 🎓 Próximos Passos

Após configurar SSL, considere:

1. ✅ **CDN (CloudFlare)**: Caching + DDoS protection
2. ✅ **HSTS**: Força HTTPS no navegador (header `Strict-Transport-Security`)
3. ✅ **CAA Records**: Especificar autoridades certificadoras permitidas
4. ✅ **OCSP Stapling**: Melhor performance na validação de certificado
5. ✅ **TLS 1.3**: Habilitar protocolo mais seguro

---

**Última atualização:** 03/11/2025  
**Versão:** 1.0.0  
**Mantenedores:** Equipe ConectCRM
