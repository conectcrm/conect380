# 🌐 Guia Completo: Configuração de Domínio CONECTHELP.COM.BR

## ✅ Arquivos Criados e Configurados

- ✅ `nginx.conf` - Proxy reverso com SSL/HTTPS
- ✅ `.env.production` - Variáveis com domínio
- ✅ `docker-compose.prod.yml` - Nginx + Backend + Frontend
- ✅ `setup-ssl.sh` - Script automático para SSL

---

## 📋 PASSO A PASSO COMPLETO

### 🔴 **PARTE 1: CONFIGURAR DNS (NO PROVEDOR DO DOMÍNIO)**

**Onde**: Painel do provedor onde você comprou `conecthelp.com.br` (Registro.br, GoDaddy, Hostinger, etc.)

#### 1.1. Acessar Painel DNS
- Login no provedor do domínio
- Ir em: **DNS / Gerenciar DNS / Zona DNS**

#### 1.2. Criar Registro A (Principal)
```
Tipo:  A
Nome:  @ (ou deixar vazio)
Valor: 56.124.63.239
TTL:   3600 (1 hora)
```
**Resultado**: `conecthelp.com.br` → `56.124.63.239`

#### 1.3. Criar Registro A para WWW (Opcional)
```
Tipo:  A
Nome:  www
Valor: 56.124.63.239
TTL:   3600
```
**Resultado**: `www.conecthelp.com.br` → `56.124.63.239`

#### 1.4. Salvar e Aguardar Propagação
- **Tempo**: 5 minutos a 48 horas (geralmente 1-2 horas)
- **Verificar propagação**: https://dnschecker.org

---

### 🟠 **PARTE 2: CONFIGURAR AWS SECURITY GROUP**

**Onde**: AWS Console → EC2 → Security Groups

#### 2.1. Acessar Security Group
1. AWS Console → **EC2**
2. Menu esquerdo → **Security Groups**
3. Encontrar o Security Group da sua instância (provavelmente `launch-wizard-X`)

#### 2.2. Adicionar Regra para HTTPS (Porta 443)

**Clicar em "Edit inbound rules" → "Add rule"**

```
Type:        HTTPS
Protocol:    TCP
Port Range:  443
Source:      0.0.0.0/0 (Anywhere IPv4)
Description: HTTPS para ConectHelp
```

**Clicar em "Save rules"**

#### 2.3. Verificar Regra HTTP (Porta 80)

**Certifique-se que já existe:**
```
Type:        HTTP
Protocol:    TCP
Port Range:  80
Source:      0.0.0.0/0
Description: HTTP (redirecionará para HTTPS)
```

**Se não existir, adicionar também!**

---

### 🟢 **PARTE 3: FAZER DEPLOY NA EC2 (VIA SSH)**

#### 3.1. Conectar na EC2
```bash
# Windows (PowerShell)
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239

# Se der erro de permissão da chave:
# 1. Botão direito no arquivo .pem → Propriedades → Segurança
# 2. Desabilitar herança → Remover todos os usuários
# 3. Adicionar apenas seu usuário com controle total
```

#### 3.2. Navegar para o Projeto
```bash
cd ~/conectcrm
```

#### 3.3. Atualizar Código (Git Pull)
```bash
git pull origin consolidacao-atendimento
```

#### 3.4. Verificar DNS (IMPORTANTE!)
```bash
# Verificar se DNS está apontando corretamente
dig +short conecthelp.com.br

# Deve retornar: 56.124.63.239
# Se não retornar, aguardar propagação!
```

#### 3.5. Executar Setup SSL
```bash
# Dar permissão de execução
chmod +x setup-ssl.sh

# Executar como root
sudo ./setup-ssl.sh
```

**O que o script faz automaticamente:**
1. ✅ Verifica se Docker está rodando
2. ✅ Verifica se DNS está configurado corretamente
3. ✅ Cria diretórios para certificados
4. ✅ Sobe Nginx temporário
5. ✅ Obtém certificado SSL via Let's Encrypt
6. ✅ Configura renovação automática (cron)
7. ✅ Reinicia containers com SSL ativado

---

## 🧪 TESTES APÓS DEPLOY

### 1. Testar Acesso HTTPS
```bash
# No navegador:
https://conecthelp.com.br
https://www.conecthelp.com.br

# Deve mostrar a aplicação com cadeado verde 🔒
```

### 2. Verificar Redirecionamento HTTP → HTTPS
```bash
# Acessar sem HTTPS:
http://conecthelp.com.br

# Deve redirecionar automaticamente para:
https://conecthelp.com.br
```

### 3. Testar Backend (API)
```bash
# Linux/Mac:
curl https://conecthelp.com.br/api/health

# Windows (PowerShell):
Invoke-WebRequest -Uri "https://conecthelp.com.br/api/health"
```

### 4. Testar WebSocket (Chat)
```bash
# Abrir DevTools (F12) no navegador
# Ir em "Console" e executar:

const socket = io('https://conecthelp.com.br');
socket.on('connect', () => console.log('✅ WebSocket conectado!'));
```

---

## 🔧 ATUALIZAR WEBHOOK DO WHATSAPP

**Após SSL funcionando, atualizar no Meta Business:**

1. Acessar: https://developers.facebook.com
2. Seu App → **WhatsApp** → **Configuration**
3. Webhook URL:
   ```
   https://conecthelp.com.br/webhook/whatsapp
   ```
4. Verify Token: `conectcrm_webhook_token_123`
5. Clicar em **Verify and Save**

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────────────┐
│           conecthelp.com.br (DNS)               │
│                     ↓                           │
│              56.124.63.239 (AWS EC2)            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│               NGINX (Proxy Reverso)             │
│  - Porta 80 (HTTP) → Redireciona para HTTPS    │
│  - Porta 443 (HTTPS) → SSL/TLS                 │
└─────────────────────────────────────────────────┘
         ↓                ↓                ↓
    ┌────────┐      ┌─────────┐     ┌──────────┐
    │Frontend│      │ Backend │     │WebSocket │
    │React   │      │ NestJS  │     │Socket.io │
    │:3000   │      │ :3500   │     │          │
    └────────┘      └─────────┘     └──────────┘
                          ↓
                   ┌──────────────┐
                   │  PostgreSQL  │
                   │    :5432     │
                   └──────────────┘
```

---

## 🚨 TROUBLESHOOTING

### Problema: DNS não resolve
**Solução**:
```bash
# Verificar propagação global
https://dnschecker.org

# Limpar cache DNS local (Windows)
ipconfig /flushdns

# Aguardar até 48h para propagação completa
```

### Problema: Certificado SSL não gera
**Possíveis causas**:
1. DNS não está apontando corretamente
2. Porta 80 bloqueada no Security Group
3. Nginx não está rodando

**Solução**:
```bash
# 1. Verificar DNS
dig +short conecthelp.com.br

# 2. Verificar se porta 80 está aberta
sudo netstat -tuln | grep :80

# 3. Ver logs do Nginx
docker logs conectcrm-nginx

# 4. Tentar novamente
sudo ./setup-ssl.sh
```

### Problema: CORS Error no Frontend
**Solução**:
Verificar se `.env.production` tem:
```bash
CORS_ORIGINS=https://conecthelp.com.br,https://www.conecthelp.com.br
```

Reiniciar containers:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Problema: WhatsApp não recebe mensagens
**Solução**:
1. Atualizar webhook na Meta:
   ```
   https://conecthelp.com.br/webhook/whatsapp
   ```
2. Verificar logs:
   ```bash
   docker logs conectcrm-backend-prod
   ```

---

## 📝 CHECKLIST FINAL

### Antes do Deploy
- [ ] DNS configurado no provedor
- [ ] Security Group AWS com porta 443 aberta
- [ ] Código atualizado via `git pull`
- [ ] Arquivo `.env.production` correto

### Durante Deploy
- [ ] Script `setup-ssl.sh` executado com sucesso
- [ ] Certificado SSL obtido
- [ ] Containers iniciados (nginx, backend, frontend, postgres)

### Após Deploy
- [ ] `https://conecthelp.com.br` abre a aplicação
- [ ] Cadeado verde aparece no navegador
- [ ] `http://conecthelp.com.br` redireciona para HTTPS
- [ ] Login funciona
- [ ] Chat funciona (WebSocket conectado)
- [ ] Webhook WhatsApp atualizado no Meta
- [ ] Mensagens WhatsApp chegam no sistema

---

## 🎓 COMANDOS ÚTEIS

### Ver logs dos containers
```bash
# Todos os containers
docker compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker logs -f conectcrm-backend-prod

# Apenas Nginx
docker logs -f conectcrm-nginx
```

### Reiniciar containers
```bash
# Todos
docker compose -f docker-compose.prod.yml restart

# Apenas backend
docker restart conectcrm-backend-prod
```

### Verificar status
```bash
# Ver containers rodando
docker ps

# Ver uso de recursos
docker stats

# Ver saúde dos containers
docker compose -f docker-compose.prod.yml ps
```

### Renovar certificado manualmente
```bash
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot renew

docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 📞 SUPORTE

**Documentação Let's Encrypt**: https://letsencrypt.org/docs/  
**Documentação Nginx**: https://nginx.org/en/docs/  
**Verificar SSL**: https://www.ssllabs.com/ssltest/

---

**Data**: 31 de outubro de 2025  
**Domínio**: conecthelp.com.br  
**IP**: 56.124.63.239  
**Região AWS**: sa-east-1 (São Paulo)
