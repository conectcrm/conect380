# 📝 GUIA RÁPIDO - PREENCHER .env.production

**Tempo estimado**: 5 minutos  
**Arquivo**: `backend\.env.production`

---

## ⚠️ VALORES QUE VOCÊ PRECISA PREENCHER

Abra o arquivo `backend\.env.production` e substitua os seguintes valores:

### 1️⃣ **Banco de Dados** (CRÍTICO!)

```env
# Linha 15 - IP do seu servidor PostgreSQL de produção
DATABASE_HOST=<SEU_IP_PRODUCAO_OU_RDS_ENDPOINT>
# Exemplos:
# - Se banco no mesmo servidor AWS: 10.0.1.50 ou localhost (se usar docker-compose com postgres)
# - Se AWS RDS: conectcrm-db.xxxxx.us-east-1.rds.amazonaws.com
# - Se servidor externo: 192.168.1.100 ou db.seudominio.com

# Linha 18 - Senha do banco de produção
DATABASE_PASSWORD=<SENHA_SEGURA_PRODUCAO>
# Use uma senha forte, ex: Pr0d@2025#Secure!DB
```

### 2️⃣ **Email (SMTP)**

```env
# Linha 58 - Email real para envio
SMTP_USER=<EMAIL_PRODUCAO>
# Exemplo: contato@conecthelp.com.br

# Linha 59 - Senha de aplicativo do Gmail (se usar Gmail)
SMTP_PASS=<SENHA_APP_GMAIL_PRODUCAO>
# Como gerar: https://myaccount.google.com/apppasswords
# Exemplo: abcd efgh ijkl mnop

# Linha 64 - Email para Gmail (mesmo que SMTP_USER)
GMAIL_USER=<EMAIL_PRODUCAO>

# Linha 65 - Senha de app (mesma que SMTP_PASS)
GMAIL_PASSWORD=<SENHA_APP_GMAIL_PRODUCAO>
```

### 3️⃣ **WhatsApp Business API**

```env
# Linha 79 - Token do WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=<TOKEN_PRODUCAO_WHATSAPP>
# Obter em: https://developers.facebook.com/apps/
# Exemplo: EAAxxxx... (token longo)

# Linha 80 - ID do telefone
WHATSAPP_PHONE_NUMBER_ID=<PHONE_ID_PRODUCAO>
# Exemplo: 123456789012345

# Linha 81 - ID da conta business
WHATSAPP_BUSINESS_ACCOUNT_ID=<BUSINESS_ACCOUNT_ID>
# Exemplo: 987654321098765

# Linha 82 - Token de verificação do webhook
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<WEBHOOK_TOKEN_SEGURO>
# Crie um token seguro, ex: WhTok2025Secure#Verify
```

### 4️⃣ **APIs de IA** (Opcional - se usar)

```env
# Linha 87 - OpenAI (se usar GPT)
OPENAI_API_KEY=<SUA_CHAVE_OPENAI>
# Obter em: https://platform.openai.com/api-keys
# Exemplo: sk-proj-xxxxx...

# Linha 93 - Anthropic Claude (se usar)
ANTHROPIC_API_KEY=<SUA_CHAVE_ANTHROPIC>
# Obter em: https://console.anthropic.com/
# Exemplo: sk-ant-xxxxx...
```

---

## ✅ VALORES JÁ PREENCHIDOS (NÃO ALTERAR)

Estes valores **JÁ ESTÃO CORRETOS** no arquivo:

✅ **JWT_SECRET** - Gerado automaticamente (256 bits)  
✅ **JWT_REFRESH_SECRET** - Gerado automaticamente (256 bits)  
✅ **NODE_ENV** = production  
✅ **APP_ENV** = production  
✅ **DATABASE_PORT** = 5432  
✅ **DATABASE_NAME** = conectcrm_production  
✅ **CORS_ORIGINS** - URLs de produção configuradas  
✅ **FRONTEND_URL** - URL de produção configurada  

---

## 📋 CHECKLIST DE PREENCHIMENTO

Antes de prosseguir, confirme:

- [ ] **DATABASE_HOST** preenchido (IP/hostname real do banco)
- [ ] **DATABASE_PASSWORD** preenchido (senha forte)
- [ ] **SMTP_USER** preenchido (email real)
- [ ] **SMTP_PASS** preenchido (senha de app)
- [ ] **GMAIL_USER** preenchido (mesmo email)
- [ ] **GMAIL_PASSWORD** preenchido (mesma senha de app)
- [ ] **WHATSAPP_ACCESS_TOKEN** preenchido (token da API)
- [ ] **WHATSAPP_PHONE_NUMBER_ID** preenchido
- [ ] **WHATSAPP_BUSINESS_ACCOUNT_ID** preenchido
- [ ] **WHATSAPP_WEBHOOK_VERIFY_TOKEN** criado (token seguro)
- [ ] **OPENAI_API_KEY** preenchido (se usar, senão deixar placeholder)
- [ ] **ANTHROPIC_API_KEY** preenchido (se usar, senão deixar placeholder)

---

## 🔍 VALIDAÇÃO

Após preencher, execute:

```powershell
.\validar-config-producao.ps1
```

**Resultado esperado**: 0 erros críticos

Se houver erros, corrija conforme indicado pelo script.

---

## ⚡ COMANDO PARA ABRIR O ARQUIVO

```powershell
# VSCode
code backend\.env.production

# Notepad
notepad backend\.env.production

# PowerShell ISE
ise backend\.env.production
```

---

## 🚨 ATENÇÃO

### ❌ NÃO faça:
- Commitar este arquivo no git
- Compartilhar em mensagens/chat
- Deixar senhas fracas

### ✅ FAÇA:
- Use senhas fortes (mínimo 16 caracteres)
- Salve credenciais em gerenciador de senhas
- Mantenha backup seguro

---

## 📝 EXEMPLO DE PREENCHIMENTO

**ANTES** (com placeholders):
```env
DATABASE_HOST=<SEU_IP_PRODUCAO_OU_RDS_ENDPOINT>
DATABASE_PASSWORD=<SENHA_SEGURA_PRODUCAO>
SMTP_USER=<EMAIL_PRODUCAO>
```

**DEPOIS** (com valores reais):
```env
DATABASE_HOST=10.0.1.50
DATABASE_PASSWORD=Pr0d@2025#SecureDB!XyZ
SMTP_USER=contato@conecthelp.com.br
```

---

## 🎯 PRÓXIMO PASSO

Após preencher e validar:

1. ✅ Arquivo preenchido
2. ✅ Validação passou (0 erros)
3. ➡️ **Seguir**: `EXECUCAO_DEPLOY_CORRIGIDO.md`
   - Fase 1: Conectar no AWS
   - Fase 2: Transferir .env.production
   - Fase 3: Executar deploy

---

**⏱️ Tempo**: 5 minutos de preenchimento + 1 minuto de validação = 6 minutos total
