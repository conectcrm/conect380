# ✅ CHECKLIST - Configuração Chatwoot WhatsApp

## 🎯 **FASE 1: PREPARAÇÃO**

### ☐ **1.1 Conta Chatwoot**
- ☐ Acesse: https://app.chatwoot.com/app/signup
- ☐ Registre sua empresa
- ☐ Confirme email de verificação
- ☐ Faça login no painel

### ☐ **1.2 WhatsApp Business**
- ☐ Tenha número WhatsApp Business válido
- ☐ Acesso ao Facebook Business Manager (para Cloud API)
- ☐ Documentos da empresa (se necessário)

---

## 🏢 **FASE 2: CONFIGURAR CHATWOOT**

### ☐ **2.1 Criar Inbox WhatsApp**
- ☐ No Chatwoot: **Settings** → **Inboxes**
- ☐ Clique: **"Add Inbox"**
- ☐ Selecione: **"WhatsApp"**
- ☐ Escolha: **"WhatsApp Cloud API"** (recomendado)
- ☐ Configure conforme instruções
- ☐ Verifique que inbox está **"Enabled"**

### ☐ **2.2 Gerar Access Token**
- ☐ Vá em: **Settings** → **Account Settings** → **Access Tokens**
- ☐ Clique: **"Create new token"**
- ☐ Nome: **"ConectCRM Integration"**
- ☐ **Copie e salve** o token gerado
- ☐ ⚠️ **IMPORTANTE:** Token só aparece uma vez!

---

## 🔍 **FASE 3: COLETAR INFORMAÇÕES**

### ☐ **3.1 Account ID**
```
Na URL do Chatwoot:
https://app.chatwoot.com/app/accounts/[ACCOUNT_ID]/dashboard

Exemplo: .../accounts/123/dashboard
ACCOUNT_ID = 123
```
- ☐ **Meu Account ID:** `_____________`

### ☐ **3.2 Inbox ID**
```
1. Settings → Inboxes
2. Clique no inbox WhatsApp
3. Na URL: .../inboxes/[INBOX_ID]/settings

Exemplo: .../inboxes/456/settings  
INBOX_ID = 456
```
- ☐ **Meu Inbox ID:** `_____________`

### ☐ **3.3 Base URL**
```
Para Chatwoot Cloud: https://app.chatwoot.com
Para instalação própria: https://seu-dominio.com
```
- ☐ **Minha Base URL:** `_____________`

### ☐ **3.4 Access Token**
- ☐ **Meu Access Token:** `_____________`

---

## ⚙️ **FASE 4: CONFIGURAR CONECTCRM**

### ☐ **4.1 Arquivo .env**
- ☐ Abra: `backend/.env`
- ☐ Adicione/atualize:
```bash
CHATWOOT_BASE_URL=https://app.chatwoot.com
CHATWOOT_ACCESS_TOKEN=seu_token_aqui
CHATWOOT_ACCOUNT_ID=123
CHATWOOT_INBOX_ID=456
```

### ☐ **4.2 Reiniciar Backend**
```bash
cd backend
npm run start:dev
```
- ☐ Backend reiniciado sem erros
- ☐ Logs mostram: "ChatwootModule dependencies initialized"

---

## 🧪 **FASE 5: TESTAR INTEGRAÇÃO**

### ☐ **5.1 Teste Frontend**
- ☐ Acesse: http://localhost:3000
- ☐ Faça login no sistema
- ☐ Vá em: **Configurações** → **Chatwoot (WhatsApp)**
- ☐ Clique: **"Testar Conexão"**
- ☐ ✅ Deve mostrar: **"Conexão estabelecida com sucesso"**

### ☐ **5.2 Teste API Manual**
```bash
curl -X GET \
  -H "api_access_token: SEU_TOKEN" \
  "https://app.chatwoot.com/api/v1/accounts/SEU_ACCOUNT_ID"
```
- ☐ Resposta sem erro (status 200)
- ☐ JSON com dados da conta

### ☐ **5.3 Teste Inbox**
```bash
curl -X GET \
  -H "api_access_token: SEU_TOKEN" \
  "https://app.chatwoot.com/api/v1/accounts/SEU_ACCOUNT_ID/inboxes/SEU_INBOX_ID"
```
- ☐ Resposta: `"channel_type": "Channel::Whatsapp"`
- ☐ Número WhatsApp aparece

---

## 📱 **FASE 6: TESTE REAL**

### ☐ **6.1 Criar Proposta Teste**
- ☐ Crie cliente com número WhatsApp válido
- ☐ Crie proposta para esse cliente
- ☐ Vá na proposta e clique **"Enviar por WhatsApp"**
- ☐ ✅ Sistema deve mostrar: **"Enviado com sucesso"**

### ☐ **6.2 Verificar Envio**
- ☐ No Chatwoot: verifique se conversa foi criada
- ☐ No WhatsApp: confirme se mensagem chegou
- ☐ Logs do backend: sem erros de envio

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS**

### ❌ **"Connection failed"**
- ☐ Verificar se token está correto
- ☐ Confirmar URL base (com/sem 'api')
- ☐ Testar token manualmente via curl

### ❌ **"Inbox not found"**
- ☐ Verificar INBOX_ID na URL
- ☐ Confirmar que inbox está ativo
- ☐ Verificar se é inbox WhatsApp

### ❌ **"Unauthorized"**
- ☐ Gerar novo Access Token
- ☐ Verificar permissões do token
- ☐ Confirmar Account ID

### ❌ **"WhatsApp not configured"**
- ☐ Inbox WhatsApp deve estar "Enabled"
- ☐ Número WhatsApp verificado
- ☐ API WhatsApp configurada corretamente

---

## 🎉 **SUCESSO! CONFIGURAÇÃO COMPLETA**

Quando todos os itens estiverem ✅, você terá:

✅ **Chatwoot integrado** ao ConectCRM  
✅ **WhatsApp funcionando** para propostas  
✅ **Interface de configuração** operacional  
✅ **Envio automático** de mensagens  
✅ **Logs e monitoramento** ativos  

---

## 📞 **SUPORTE**

Se ainda tiver problemas:

1. **🔍 Verificar logs:** Console do navegador + logs do backend
2. **📋 Conferir variáveis:** Todas as variáveis .env estão corretas?
3. **🧪 Testar API:** Use curl para testar endpoints manualmente
4. **📱 Validar WhatsApp:** Inbox está ativo no Chatwoot?
5. **🔄 Reiniciar:** Backend + frontend + limpar cache

**🚀 Boa sorte com sua integração WhatsApp!**
