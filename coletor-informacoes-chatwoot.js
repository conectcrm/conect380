/**
 * 🔍 Coletor de Informações Chatwoot
 * 
 * Este script te ajuda a identificar as informações
 * necessárias para configurar o Chatwoot
 */

console.log(`
🔍 ===============================================
   COLETOR DE INFORMAÇÕES CHATWOOT
===============================================

Siga estes passos para coletar as informações:

📋 PASSO 1: ACCESS TOKEN
┌─────────────────────────────────────────────┐
│ 1. No seu painel Chatwoot:                 │
│    Settings → Account Settings → Access Tokens │
│                                             │
│ 2. Clique: "Create new token"              │
│                                             │
│ 3. Nome: "ConectCRM Integration"           │
│                                             │
│ 4. COPIE o token (aparece só uma vez!)     │
└─────────────────────────────────────────────┘

🏢 PASSO 2: ACCOUNT ID  
┌─────────────────────────────────────────────┐
│ 1. Olhe na URL do seu painel:              │
│    https://app.chatwoot.com/app/accounts/[ID]/dashboard │
│                                             │
│ 2. Exemplo:                                 │
│    URL: .../accounts/123/dashboard         │
│    ACCOUNT_ID = 123                        │
└─────────────────────────────────────────────┘

📱 PASSO 3: INBOX ID (após criar inbox WhatsApp)
┌─────────────────────────────────────────────┐
│ 1. Settings → Inboxes                      │
│                                             │
│ 2. Clique no inbox WhatsApp que você criou │
│                                             │
│ 3. Na URL: .../inboxes/[ID]/settings       │
│    Exemplo: .../inboxes/456/settings       │
│    INBOX_ID = 456                          │
└─────────────────────────────────────────────┘

🌐 PASSO 4: BASE URL
┌─────────────────────────────────────────────┐
│ Se você usa Chatwoot Cloud:                │
│ BASE_URL = https://app.chatwoot.com         │
│                                             │
│ Se você tem instalação própria:            │
│ BASE_URL = https://seu-dominio.com          │
└─────────────────────────────────────────────┘

===============================================

📝 ANOTE SUAS INFORMAÇÕES AQUI:

✏️  ACCESS_TOKEN: _________________________
✏️  ACCOUNT_ID: ___________________________  
✏️  INBOX_ID: _____________________________
✏️  BASE_URL: https://app.chatwoot.com

===============================================

🚀 PRÓXIMO PASSO:
   Após coletar essas informações, execute:
   node configurar-chatwoot-final.js

===============================================
`);

// Função para validar se as informações estão corretas
function validarInformacoes() {
  console.log(`
🧪 TESTE RÁPIDO DA SUA CONFIGURAÇÃO:

Você pode testar manualmente se suas informações estão corretas:

1️⃣ TESTAR ACCESS TOKEN:
   curl -H "api_access_token: SEU_TOKEN" \\
   "https://app.chatwoot.com/api/v1/accounts/SEU_ACCOUNT_ID"
   
   ✅ Sucesso: JSON com dados da conta
   ❌ Erro: {"error": "Invalid token"}

2️⃣ TESTAR INBOX:
   curl -H "api_access_token: SEU_TOKEN" \\
   "https://app.chatwoot.com/api/v1/accounts/SEU_ACCOUNT_ID/inboxes/SEU_INBOX_ID"
   
   ✅ Sucesso: "channel_type": "Channel::Whatsapp"
   ❌ Erro: {"error": "Inbox not found"}

🔧 Se der erro, revise as informações coletadas!
`);
}

validarInformacoes();

module.exports = { validarInformacoes };
