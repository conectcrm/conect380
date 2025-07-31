# 🚀 Guia Completo - Configuração Chatwoot para WhatsApp

## 📋 **PASSO A PASSO PARA CONFIGURAR**

### **🎯 Pré-requisitos**
✅ Conta no Chatwoot (gratuita)  
✅ Número de WhatsApp Business  
✅ Sistema ConectCRM funcionando  

---

## **ETAPA 1: 🏢 Criar Conta no Chatwoot**

### **1.1 Registrar no Chatwoot**
```bash
# Acesse: https://app.chatwoot.com/app/signup
# OU instale localmente: https://www.chatwoot.com/docs/self-hosted
```

**Dados necessários:**
- Nome da empresa
- Email corporativo
- Nome da conta (subdomínio)

### **1.2 Confirmar Email**
- ✉️ Verifique seu email
- 🔑 Confirme a conta
- 🚪 Faça login no painel

---

## **ETAPA 2: 📱 Configurar Inbox WhatsApp**

### **2.1 Criar Novo Inbox**
1. **Acesse:** Settings → Inboxes
2. **Clique:** "Add Inbox"
3. **Selecione:** "WhatsApp"
4. **Escolha:** "WhatsApp Business API" ou "WhatsApp Cloud API"

### **2.2 Configurar WhatsApp Business API**

#### **Opção A: WhatsApp Cloud API (Recomendado)**
```javascript
// Configurações necessárias:
{
  "phoneNumberId": "SUA_PHONE_NUMBER_ID",
  "businessAccountId": "SEU_BUSINESS_ACCOUNT_ID", 
  "accessToken": "SEU_ACCESS_TOKEN",
  "webhookUrl": "https://seudominio.com/webhooks/whatsapp",
  "verifyToken": "SEU_VERIFY_TOKEN"
}
```

#### **Opção B: WhatsApp Business API Local**
```javascript
// Usando provider como 360Dialog, Turn.io, etc.
{
  "apiUrl": "https://api.360dialog.com",
  "apiKey": "SUA_API_KEY",
  "phoneNumber": "+5511999999999"
}
```

---

## **ETAPA 3: 🔑 Obter Tokens e Configurações**

### **3.1 Access Token do Chatwoot**
1. **Vá em:** Settings → Account Settings → Access Tokens
2. **Clique:** "Create new token"
3. **Nome:** "ConectCRM Integration"
4. **Copie:** O token gerado

### **3.2 Account ID**
```javascript
// Encontre na URL do Chatwoot:
// https://app.chatwoot.com/app/accounts/[ACCOUNT_ID]/dashboard
// Exemplo: se URL = .../accounts/123/dashboard
// Então ACCOUNT_ID = 123
```

### **3.3 Inbox ID**
1. **Acesse:** Settings → Inboxes
2. **Clique:** no inbox WhatsApp criado
3. **Na URL:** .../inboxes/[INBOX_ID]/settings
4. **Copie:** o INBOX_ID

### **3.4 Base URL**
```javascript
// Para Chatwoot Cloud:
const CHATWOOT_BASE_URL = "https://app.chatwoot.com";

// Para instalação própria:
const CHATWOOT_BASE_URL = "https://seudominio.chatwoot.com";
```

---

## **ETAPA 4: ⚙️ Configurar no ConectCRM**

### **4.1 Atualizar Arquivo .env**
```bash
# Abra: backend/.env
# Adicione/atualize estas variáveis:

CHATWOOT_BASE_URL=https://app.chatwoot.com
CHATWOOT_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI
CHATWOOT_ACCOUNT_ID=123
CHATWOOT_INBOX_ID=456
```

### **4.2 Reiniciar Backend**
```bash
cd backend
npm run start:dev
```

### **4.3 Acessar Configurações no Frontend**
1. **Abra:** http://localhost:3000
2. **Vá em:** Configurações → Chatwoot (WhatsApp)
3. **Teste:** Clique em "Testar Conexão"

---

## **ETAPA 5: 🧪 Testar Integração**

### **5.1 Teste de Conexão**
```javascript
// No frontend, você deve ver:
✅ "Conexão estabelecida com sucesso"
✅ "Inbox WhatsApp conectado"
✅ "API funcionando corretamente"
```

### **5.2 Teste de Envio**
1. **Crie:** Uma proposta no sistema
2. **Adicione:** Número de WhatsApp do cliente
3. **Clique:** "Enviar por WhatsApp"
4. **Verifique:** Se mensagem foi enviada

---

## **ETAPA 6: 🎨 Configurações Avançadas**

### **6.1 Webhooks (Opcional)**
```javascript
// Para receber mensagens do WhatsApp no CRM:
const webhookUrl = "https://seudominio.com/api/chatwoot/webhook";

// Configure no Chatwoot:
// Settings → Integrations → Webhooks
// URL: https://seudominio.com/api/chatwoot/webhook
// Events: message_created, conversation_status_changed
```

### **6.2 Templates de Mensagem**
```javascript
// Configure templates no Chatwoot para propostas:
const templateProposta = `
Olá {{contact.name}}! 👋

Aqui está sua proposta personalizada:

📄 **{{custom_attributes.proposta_titulo}}**
💰 **Valor:** R$ {{custom_attributes.proposta_valor}}
📅 **Válida até:** {{custom_attributes.proposta_validade}}

🔗 **Link da proposta:** {{custom_attributes.proposta_link}}

Qualquer dúvida, estou à disposição! 😊
`;
```

---

## **🚨 PROBLEMAS COMUNS E SOLUÇÕES**

### **❌ Erro: "Connection failed"**
**Causa:** Token inválido ou URL incorreta  
**Solução:**
```bash
# Verifique se o token está correto
# Confirme a URL base (com ou sem 'api' no final)
# Teste manualmente: curl -H "api_access_token: SEU_TOKEN" https://app.chatwoot.com/api/v1/accounts/ACCOUNT_ID
```

### **❌ Erro: "Inbox not found"**
**Causa:** INBOX_ID incorreto  
**Solução:**
```bash
# Vá em Settings → Inboxes no Chatwoot
# Anote o ID correto do inbox WhatsApp
# Atualize CHATWOOT_INBOX_ID no .env
```

### **❌ Erro: "WhatsApp not configured"**
**Causa:** Inbox WhatsApp não está ativo  
**Solução:**
```bash
# No Chatwoot: Settings → Inboxes → WhatsApp
# Certifique-se que está "Enabled"
# Verifique se o número WhatsApp está verificado
```

---

## **📱 EXEMPLO PRÁTICO**

### **Configuração Completa de Exemplo:**
```bash
# .env
CHATWOOT_BASE_URL=https://app.chatwoot.com
CHATWOOT_ACCESS_TOKEN=pR8x9mN2vQ7aK4tL1wE6yU3oI5rT8nM
CHATWOOT_ACCOUNT_ID=42
CHATWOOT_INBOX_ID=156
```

### **Teste da API:**
```bash
# Teste manual via curl:
curl -X GET \
  -H "api_access_token: pR8x9mN2vQ7aK4tL1wE6yU3oI5rT8nM" \
  "https://app.chatwoot.com/api/v1/accounts/42/inboxes/156"

# Resposta esperada:
{
  "id": 156,
  "name": "WhatsApp Business",
  "channel_type": "Channel::Whatsapp",
  "phone_number": "+5511999999999"
}
```

---

## **🎉 RESULTADO FINAL**

Após seguir todos os passos, você terá:

✅ **Chatwoot conectado** ao ConectCRM  
✅ **WhatsApp integrado** para envio de propostas  
✅ **Interface funcionando** na tela de configurações  
✅ **Envio automático** de propostas via WhatsApp  
✅ **Logs e monitoramento** funcionando  

---

## **📞 PRÓXIMOS PASSOS**

1. **🎨 Personalizar templates** de mensagem
2. **📊 Configurar relatórios** de envios
3. **🤖 Implementar chatbot** para respostas automáticas
4. **📱 Configurar multi-números** WhatsApp
5. **🔄 Implementar sincronização** bidirecional

---

**🚀 Pronto! Seu WhatsApp Business está integrado ao ConectCRM via Chatwoot!**
