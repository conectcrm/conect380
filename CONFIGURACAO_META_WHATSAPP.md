# 📱 Configuração WhatsApp Business API - Meta Developers

**Guia Passo a Passo Completo**

---

## 🔗 **PASSO 1: Acessar Meta Developers**

**URL:** https://developers.facebook.com/apps

1. Faça login com sua conta Facebook/Meta
2. Selecione seu App WhatsApp
3. No menu lateral, vá em: **WhatsApp > Configuration**

---

## 📝 **PASSO 2: Dados para Inserir**

### **🌐 Callback URL (Webhook URL)**

Depois de iniciar o ngrok, você vai receber uma URL como:
```
https://abc123def456.ngrok-free.app
```

**Cole esta URL no campo "Callback URL":**
```
https://SUA_URL_DO_NGROK.ngrok-free.app/api/atendimento/webhooks/whatsapp
```

**Exemplo completo:**
```
https://abc123def456.ngrok-free.app/api/atendimento/webhooks/whatsapp
```

⚠️ **IMPORTANTE:**
- ✅ Incluir o `/api/atendimento/webhooks/whatsapp` no final
- ✅ Usar HTTPS (ngrok sempre fornece HTTPS)
- ✅ Não colocar barra `/` no final

---

### **🔐 Verify Token**

**Cole exatamente este token no campo "Verify Token":**
```
conectcrm_webhook_token_123
```

⚠️ **IMPORTANTE:**
- ✅ Copie exatamente como está (case-sensitive)
- ✅ Este token está configurado no seu `.env` do backend
- ✅ Não modifique este valor

---

## 📋 **PASSO 3: Inscrever-se nos Eventos (Webhook Fields)**

Marque estas opções:

- ✅ **messages** (mensagens recebidas)
- ✅ **message_status** (status de entrega: enviado, entregue, lido)
- ✅ **message_echoes** (opcional - suas próprias mensagens)

---

## 🎯 **RESUMO VISUAL**

```
┌─────────────────────────────────────────────────────────────┐
│ Meta Developers - WhatsApp Configuration                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Callback URL:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://abc123.ngrok-free.app/api/atendimento/webhooks/│ │
│ │ whatsapp                                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Verify Token:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ conectcrm_webhook_token_123                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Webhook Fields:                                             │
│ ☑ messages                                                  │
│ ☑ message_status                                            │
│ ☐ message_echoes (opcional)                                │
│                                                             │
│           [Verify and Save]                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **PASSO 4: Fluxo Completo de Configuração**

### **1. Iniciar Ambiente Local**
```powershell
.\start-dev-with-ngrok.ps1
```

Aguarde aparecer a URL do ngrok, algo como:
```
🔗 URL do ngrok:
   https://abc123def456.ngrok-free.app
```

### **2. Copiar URL**
A URL será copiada automaticamente para seu clipboard.

### **3. Ir para Meta Developers**
https://developers.facebook.com/apps

### **4. Configurar Webhook**

**Callback URL:**
```
https://abc123def456.ngrok-free.app/api/atendimento/webhooks/whatsapp
```

**Verify Token:**
```
conectcrm_webhook_token_123
```

### **5. Clicar em "Verify and Save"**

O Meta vai fazer uma requisição GET para seu webhook para verificar se está funcionando.

### **6. Verificação Bem-Sucedida**

Se tudo estiver certo, você verá:
```
✅ Webhook verified successfully
```

---

## 🧪 **PASSO 5: Testar Webhook**

### **Opção 1: Enviar Mensagem Real**

1. Abra o WhatsApp do seu celular
2. Envie mensagem para o número do WhatsApp Business API
3. Veja no dashboard ngrok (http://127.0.0.1:4040)
4. Veja nos logs do backend

### **Opção 2: Teste Automático**

```powershell
.\test-ngrok-webhooks.ps1
```

---

## 📊 **MONITORAR WEBHOOKS**

### **Dashboard ngrok**
```
http://127.0.0.1:4040
```

Você verá todas as requisições que o Meta envia, incluindo:
- ✅ Requisição de verificação (GET)
- ✅ Mensagens recebidas (POST)
- ✅ Status de mensagens (POST)

### **Logs do Backend**

No terminal do backend, você verá:
```
[Nest] LOG [WhatsAppWebhookController] Webhook recebido
[Nest] LOG Mensagem de: 5511999999999
[Nest] LOG Texto: Olá!
```

---

## ⚠️ **PROBLEMAS COMUNS**

### **Erro: "Callback verification failed"**

**Causas:**
- ❌ Backend não está rodando
- ❌ ngrok não está conectado
- ❌ URL do webhook incorreta
- ❌ Verify Token incorreto

**Solução:**
1. Verificar se backend está rodando: http://localhost:3001
2. Verificar dashboard ngrok: http://127.0.0.1:4040
3. Conferir URL completa (com `/api/atendimento/webhooks/whatsapp`)
4. Conferir verify token exatamente como está

### **Erro: "Webhook não recebe mensagens"**

**Causas:**
- ❌ Não se inscreveu nos eventos (messages)
- ❌ ngrok expirou (plano gratuito: 2h)
- ❌ URL mudou (reiniciou o ngrok)

**Solução:**
1. Verificar se marcou "messages" nos Webhook Fields
2. Reiniciar ngrok se expirou
3. Atualizar URL no Meta se mudou

---

## 📱 **ONDE ENCONTRAR OS DADOS NO BACKEND**

### **Arquivo: `backend/.env`**

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=conectcrm_webhook_token_123
WHATSAPP_API_TOKEN=seu_token_permanente_aqui
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
```

### **Arquivo: `backend/src/modules/atendimento/controllers/whatsapp-webhook.controller.ts`**

```typescript
// Verificação do webhook (GET)
@Get()
verifyWebhook(@Query() query: any) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === 'conectcrm_webhook_token_123') {
    return challenge; // Meta confirma o webhook
  }
  
  throw new UnauthorizedException('Verification failed');
}

// Recebimento de mensagens (POST)
@Post()
async receiveWebhook(@Body() body: any) {
  // Processa mensagens recebidas
}
```

---

## 🔑 **DADOS IMPORTANTES**

### **Para Meta Developers (Webhook):**
```
Callback URL: https://SEU_NGROK.ngrok-free.app/api/atendimento/webhooks/whatsapp
Verify Token: conectcrm_webhook_token_123
```

### **Para Enviar Mensagens (via API):**
Você vai precisar também:
- `WHATSAPP_API_TOKEN` - Token permanente do WhatsApp Business
- `WHATSAPP_PHONE_NUMBER_ID` - ID do número de telefone
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - ID da conta business

**Onde obter:**
1. Meta Developers > WhatsApp > Getting Started
2. Copiar "Phone Number ID"
3. Copiar "WhatsApp Business Account ID"
4. Gerar Token permanente (Access Token)

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Backend rodando (localhost:3001)
- [ ] ngrok conectado
- [ ] URL do ngrok copiada
- [ ] Meta Developers aberto
- [ ] Callback URL configurada (com `/api/atendimento/webhooks/whatsapp`)
- [ ] Verify Token configurado (`conectcrm_webhook_token_123`)
- [ ] Eventos marcados (messages, message_status)
- [ ] Clicou em "Verify and Save"
- [ ] Verificação bem-sucedida ✅
- [ ] Teste enviado
- [ ] Mensagem recebida no backend ✅

---

## 📚 **DOCUMENTAÇÃO RELACIONADA**

- **Guia Completo ngrok:** `docs/GUIA_NGROK_WEBHOOKS.md`
- **Testes de Integrações:** `docs/TESTES_INTEGRACOES.md`
- **API Documentation:** `docs/API_DOCUMENTATION.md`

---

## 🆘 **SUPORTE**

Se tiver problemas:

1. **Verifique dashboard ngrok:** http://127.0.0.1:4040
2. **Veja logs do backend**
3. **Execute teste:** `.\test-ngrok-webhooks.ps1`
4. **Consulte:** `docs/GUIA_NGROK_WEBHOOKS.md` (seção Troubleshooting)

---

**✨ Pronto! Com esses dados você consegue configurar o webhook do WhatsApp!**
