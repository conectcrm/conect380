# 🔑 Como Obter Credenciais WhatsApp Business API

**Guia Completo Passo a Passo**

---

## 📋 **O QUE VOCÊ PRECISA**

Para configurar o WhatsApp Business API, você precisa de **4 dados essenciais**:

1. ✅ **Access Token** (Token de acesso permanente)
2. ✅ **Phone Number ID** (ID do número de telefone)
3. ✅ **Business Account ID** (ID da conta business)
4. ✅ **Verify Token** (Token de verificação do webhook - você cria)

---

## 🚀 **PASSO 1: Criar App no Meta Developers**

### **1.1 Acessar Meta Developers**
```
https://developers.facebook.com/apps
```

### **1.2 Criar Novo App**
1. Clique em **"Create App"**
2. Escolha **"Business"** como tipo
3. Preencha:
   - **Display name:** ConectCRM WhatsApp
   - **App contact email:** seu@email.com
4. Clique em **"Create App"**

### **1.3 Adicionar WhatsApp**
1. No dashboard do app, procure **"WhatsApp"**
2. Clique em **"Set up"**

✅ **Pronto! App criado!**

---

## 📱 **PASSO 2: Obter Phone Number ID**

### **2.1 Ir para WhatsApp > Getting Started**
```
No menu lateral:
WhatsApp → Getting Started
```

### **2.2 Copiar Phone Number ID**

Na seção **"Send and receive messages"**, você verá:

```
┌─────────────────────────────────────────────────────┐
│ From                                                │
├─────────────────────────────────────────────────────┤
│ Phone number ID: 123456789012345                    │
│                  └──────────────┬─────────────────┘ │
│                         COPIE ESTE NÚMERO           │
└─────────────────────────────────────────────────────┘
```

**Exemplo de Phone Number ID:**
```
123456789012345
```

✅ **Cole este ID em:** `WHATSAPP_PHONE_NUMBER_ID` no `.env`

---

## 🏢 **PASSO 3: Obter Business Account ID**

### **Opção A: Via Interface**

1. No menu lateral, vá em: **WhatsApp > API Setup**
2. Procure por **"WhatsApp Business Account ID"**
3. Copie o ID (formato: `987654321098765`)

### **Opção B: Via URL**

1. Vá em: **WhatsApp > Getting Started**
2. Olhe a URL do navegador:
```
https://developers.facebook.com/apps/1234567890/whatsapp-business/wa-settings/?business_id=987654321098765
                                                                                    └────┬────┘
                                                                        Este é o Business Account ID
```

**Exemplo de Business Account ID:**
```
987654321098765
```

✅ **Cole este ID em:** `WHATSAPP_BUSINESS_ACCOUNT_ID` no `.env`

---

## 🔐 **PASSO 4: Obter Access Token (Permanente)**

### **4.1 Token Temporário (24h)**

No **Getting Started**, você verá:

```
┌─────────────────────────────────────────────────────┐
│ Temporary access token                              │
├─────────────────────────────────────────────────────┤
│ EAAJhp...ZD (expira em 24 horas)                   │
└─────────────────────────────────────────────────────┘
```

⚠️ **NÃO USE ESTE!** Ele expira em 24 horas!

### **4.2 Gerar Token Permanente**

#### **Método 1: Via Meta Business Suite (Recomendado)**

1. Acesse: https://business.facebook.com/settings/system-users
2. Clique em **"Add"** para criar System User
3. Preencha:
   - **Name:** ConectCRM WhatsApp Bot
   - **Role:** Admin
4. Clique em **"Create System User"**
5. Clique em **"Add Assets"**
6. Selecione **"Apps"**
7. Selecione seu app WhatsApp
8. Marque **"Manage app"**
9. Clique em **"Generate New Token"**
10. Selecione permissões:
    - ✅ `whatsapp_business_management`
    - ✅ `whatsapp_business_messaging`
11. Copie o token gerado (começa com `EAA...`)

#### **Método 2: Via Graph API Explorer**

1. Acesse: https://developers.facebook.com/tools/explorer/
2. Selecione seu app
3. Clique em **"Generate Access Token"**
4. Selecione permissões:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
5. Gerar token
6. Clique em **"Extend Access Token"** para tornar permanente

**Exemplo de Access Token:**
```
EAAJhpZBsZBZBZCZBo9gZBZBZBZBZBZBZBZBZBZBZBZB...ZDZD
```

✅ **Cole este token em:** `WHATSAPP_API_TOKEN` no `.env`

---

## 🔒 **PASSO 5: Criar Verify Token**

Este token você **inventa**! É usado para verificar webhooks.

### **Regras:**
- ✅ Mínimo 12 caracteres
- ✅ Use letras, números e símbolos
- ✅ Não use caracteres especiais complexos

### **Exemplos de Verify Tokens Válidos:**
```
conectcrm_webhook_token_123
my_super_secret_webhook_2024
whatsapp_verify_abc123xyz
webhook_secure_token_v1
```

### **Recomendação:**
```
conectcrm_webhook_token_123
```

✅ **Cole este token em:** `WHATSAPP_VERIFY_TOKEN` no `.env`

⚠️ **IMPORTANTE:** Use o **MESMO token** ao configurar webhook no Meta!

---

## 📝 **PASSO 6: Configurar .env**

Edite: `backend/.env`

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=conectcrm_webhook_token_123
WHATSAPP_API_TOKEN=EAAJhpZBsZBZBZCZBo9g...ZDZD
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
```

**Substitua:**
- `WHATSAPP_API_TOKEN` → Token permanente que você gerou
- `WHATSAPP_PHONE_NUMBER_ID` → Phone Number ID copiado
- `WHATSAPP_BUSINESS_ACCOUNT_ID` → Business Account ID copiado
- `WHATSAPP_VERIFY_TOKEN` → Token que você inventou

---

## ✅ **PASSO 7: Validar Credenciais**

### **Executar Script de Teste:**

```bash
cd backend
node test-whatsapp-credentials.js
```

**Resultado esperado:**
```
🔍 Verificando Credenciais WhatsApp Business API...

1️⃣ Testando Access Token e Phone Number ID...
   ✅ Access Token: VÁLIDO
   ✅ Phone Number ID: VÁLIDO
   📱 Nome verificado: Minha Empresa
   📞 Número: +55 11 99999-9999

2️⃣ Testando WhatsApp Business Account ID...
   ✅ Business Account ID: VÁLIDO
   🏢 Nome: Minha Empresa Business
   🌍 Timezone: America/Sao_Paulo

3️⃣ Verificando Verify Token...
   ✅ Verify Token: DEFINIDO
   🔐 Token: conectcrm_webhook_token_123

============================================================
📊 RESUMO DOS TESTES
============================================================
Access Token:          ✅ VÁLIDO
Phone Number ID:       ✅ VÁLIDO
Business Account ID:   ✅ VÁLIDO
Verify Token:          ✅ DEFINIDO
============================================================

🎉 TODAS AS CREDENCIAIS ESTÃO VÁLIDAS!
✅ Você pode prosseguir com a configuração do webhook!
```

---

## 📊 **RESUMO - Onde Encontrar Cada Dado**

| Dado | Onde Encontrar | Exemplo |
|------|----------------|---------|
| **Phone Number ID** | WhatsApp > Getting Started | `123456789012345` |
| **Business Account ID** | WhatsApp > API Setup ou URL | `987654321098765` |
| **Access Token** | Business Suite > System Users | `EAAJhp...ZDZD` |
| **Verify Token** | Você cria! | `conectcrm_webhook_token_123` |

---

## 🎯 **CHECKLIST DE CONFIGURAÇÃO**

- [ ] App criado no Meta Developers
- [ ] WhatsApp adicionado ao app
- [ ] Phone Number ID copiado
- [ ] Business Account ID copiado
- [ ] Access Token permanente gerado
- [ ] Verify Token criado
- [ ] Todos os dados inseridos no `.env`
- [ ] Script de validação executado
- [ ] Todas as credenciais válidas ✅

---

## **PROBLEMAS COMUNS**

### **Erro: "Invalid OAuth access token"**
- ❌ Token expirado (use permanente, não temporário)
- ❌ Token de outro app
- ❌ Permissões insuficientes

**Solução:** Gere novo token permanente com permissões corretas

### **Erro: "Phone number ID not found"**
- ❌ ID incorreto
- ❌ Número não verificado no Meta

**Solução:** Copie o ID correto do Getting Started

### **Erro: "Business account ID invalid"**
- ❌ ID incorreto
- ❌ Conta não associada ao app

**Solução:** Verifique o ID na URL ou API Setup

---

## 📚 **PRÓXIMOS PASSOS**

Depois de obter todas as credenciais:

1. ✅ Configurar `.env` com os dados
2. ✅ Executar `node test-whatsapp-credentials.js`
3. ✅ Iniciar ngrok: `.\start-dev-with-ngrok.ps1`
4. ✅ Configurar webhook no Meta (consulte: `CONFIGURACAO_META_WHATSAPP.md`)

---

## 📖 **DOCUMENTAÇÃO RELACIONADA**

- **Configurar Webhook:** `CONFIGURACAO_META_WHATSAPP.md`
- **Guia ngrok:** `docs/GUIA_NGROK_WEBHOOKS.md`
- **API WhatsApp:** https://developers.facebook.com/docs/whatsapp

---

**✨ Pronto! Com esses dados válidos você pode configurar o WhatsApp Business API!**
