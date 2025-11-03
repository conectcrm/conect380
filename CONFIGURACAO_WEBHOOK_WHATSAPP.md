# 🔌 Configuração do Webhook WhatsApp - Guia Completo

## 📋 Pré-requisitos

- ✅ Backend rodando na porta 3001
- ✅ Conta Meta Business Manager
- ✅ Número WhatsApp Business aprovado
- ✅ Token de acesso permanente da Meta API

---

## 🚀 Passo 1: Configurar ngrok

### 1.1 Instalar ngrok

**Windows (PowerShell como Admin):**
```powershell
# Opção 1: Via Chocolatey
choco install ngrok

# Opção 2: Download direto
# Baixe de: https://ngrok.com/download
# Extraia e adicione ao PATH
```

**Verificar instalação:**
```powershell
ngrok version
```

### 1.2 Criar conta e obter token

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie sua conta gratuita
3. Copie seu authtoken em: https://dashboard.ngrok.com/get-started/your-authtoken
4. Configure o token:

```powershell
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### 1.3 Iniciar túnel ngrok

```powershell
ngrok http 3001
```

**Você verá algo como:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

> ⚠️ **IMPORTANTE:** Copie a URL `https://abc123.ngrok-free.app`

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Editar arquivo `.env` do backend

```bash
# backend/.env

# Token de acesso permanente do Meta Business
WHATSAPP_TOKEN=seu_token_permanente_aqui

# App Secret do Meta Business (para validação HMAC)
WHATSAPP_APP_SECRET=seu_app_secret_aqui

# ID do seu número WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# ID da empresa padrão (já existe no banco)
DEFAULT_EMPRESA_ID=f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### 2.2 Onde encontrar essas informações

**WHATSAPP_TOKEN:**
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App
3. WhatsApp → Configuration → Temporary Access Token
4. Clique em "Generate a permanent token"

**WHATSAPP_APP_SECRET:**
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App
3. Settings → Basic
4. Copie o "App Secret" (clique em "Show")

**WHATSAPP_PHONE_NUMBER_ID:**
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App
3. WhatsApp → Configuration
4. Copie o "Phone Number ID"

### 2.3 Reiniciar backend

```powershell
cd backend
npm run start:dev
```

---

## 🌐 Passo 3: Registrar Webhook no Meta Business

### 3.1 Acessar configuração de Webhooks

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App
3. WhatsApp → Configuration
4. Clique em "Edit" na seção "Webhook"

### 3.2 Configurar Callback URL

**Callback URL:**
```
https://SEU_NGROK_URL.ngrok-free.app/triagem/webhook/whatsapp
```

Exemplo:
```
https://abc123.ngrok-free.app/triagem/webhook/whatsapp
```

**Verify Token:**
```
meu_token_verificacao_123
```
> ℹ️ Pode ser qualquer string. O backend aceita qualquer token na verificação inicial.

### 3.3 Clique em "Verify and Save"

O Meta vai fazer um GET request para verificar:
```
GET https://SEU_NGROK_URL.ngrok-free.app/triagem/webhook/whatsapp?
  hub.mode=subscribe&
  hub.challenge=RANDOM_STRING&
  hub.verify_token=meu_token_verificacao_123
```

✅ Se tudo estiver OK, você verá: **"Webhook verified successfully"**

### 3.4 Subscrever aos eventos

Marque as seguintes opções:
- ✅ **messages** (obrigatório)
- ✅ **message_status** (opcional, para status de entrega)

Clique em **"Subscribe"**

---

## 🧪 Passo 4: Testar o Webhook

### 4.1 Verificar logs do backend

Abra um terminal e monitore os logs:

```powershell
# Os logs aparecem automaticamente no terminal do backend
# Você verá:
# 🔍 [WEBHOOK] Recebendo requisição do WhatsApp
# 🔐 [WEBHOOK] Validando assinatura HMAC SHA-256
# ✅ [WEBHOOK] Assinatura válida!
# 📱 [WEBHOOK] Processando mensagem de: +5511999999999
```

### 4.2 Enviar mensagem de teste

1. No seu celular, abra o WhatsApp
2. Envie uma mensagem para o número Business registrado
3. Exemplo: "Olá"

### 4.3 Verificar resposta

O bot deve responder automaticamente com o fluxo de triagem padrão!

**Fluxo esperado:**
```
Bot: Olá! Bem-vindo ao suporte. 
     Como posso ajudar você hoje?
     
     1️⃣ Suporte Técnico
     2️⃣ Vendas
     3️⃣ Financeiro
     
     Digite o número da opção desejada.
```

---

## 🔍 Passo 5: Monitorar e Debugar

### 5.1 Verificar logs em tempo real

**Backend logs:**
```powershell
# Terminal onde o backend está rodando
# Você verá todas as requisições e respostas
```

**ngrok logs:**
```
# No terminal do ngrok você vê as requisições HTTP
```

**Logs detalhados do bot:**
```
backend/logs/triagem-bot.log
```

### 5.2 Testar validação de assinatura

O backend valida automaticamente o header `X-Hub-Signature-256`:

```typescript
// Se a assinatura for inválida:
⚠️ [WEBHOOK] Assinatura inválida! Possível ataque.

// Se a assinatura for válida:
✅ [WEBHOOK] Assinatura válida!
```

### 5.3 Testar fluxo de triagem

**Cenário 1: Usuário escolhe Suporte**
```
Você: 1
Bot: Você foi direcionado para o núcleo SUPORTE.
     Um atendente entrará em contato em breve.
```

**Cenário 2: Usuário escolhe Vendas**
```
Você: 2
Bot: Você foi direcionado para o núcleo VENDAS.
     Um atendente entrará em contato em breve.
```

**Cenário 3: Opção inválida**
```
Você: 5
Bot: Opção inválida. Por favor, escolha uma opção válida.
```

---

## ⚠️ Troubleshooting

### Webhook não recebe mensagens

**Verificar:**
1. ✅ ngrok está rodando?
2. ✅ Backend está rodando?
3. ✅ URL do webhook está correta no Meta?
4. ✅ Eventos estão subscritos?

**Testar manualmente:**
```powershell
# Verificar se ngrok está funcionando
curl https://SEU_NGROK_URL.ngrok-free.app/health

# Deve retornar:
# { "status": "ok" }
```

### Erro de assinatura inválida

**Verificar:**
1. ✅ `WHATSAPP_APP_SECRET` está correto no `.env`?
2. ✅ Backend foi reiniciado após adicionar a variável?

**Testar:**
```powershell
# Ver logs do backend
# Se aparecer "WHATSAPP_APP_SECRET não configurado", adicione ao .env
```

### Mensagens não são processadas

**Verificar:**
1. ✅ Número está registrado no sistema?
2. ✅ Empresa padrão existe no banco?
3. ✅ Núcleos estão ativos?

**Query para verificar:**
```sql
-- Verificar núcleos ativos
SELECT * FROM nucleos_atendimento WHERE ativo = true;

-- Verificar sessões ativas
SELECT * FROM sessoes_triagem WHERE status = 'aguardando_resposta';
```

### ngrok URL mudou

Se você reiniciar o ngrok, a URL muda. Você precisa:

1. Copiar a nova URL
2. Atualizar no Meta Business Manager
3. Clicar em "Verify and Save" novamente

**Dica:** Use ngrok pago para URL fixa!

---

## 🎯 Endpoints Disponíveis

### Webhook Principal
```
POST /triagem/webhook/whatsapp
```
Recebe mensagens do WhatsApp

### Iniciar Triagem Manual
```
POST /triagem/iniciar
Body: {
  "telefone": "+5511999999999",
  "canal": "whatsapp",
  "empresaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### Responder Triagem
```
POST /triagem/responder
Body: {
  "telefone": "+5511999999999",
  "mensagem": "1"
}
```

### Consultar Sessão
```
GET /triagem/sessao/:telefone
```

### Encerrar Sessão
```
DELETE /triagem/sessao/:sessaoId
```

---

## 📊 Próximos Passos

Após configurar o webhook:

1. ✅ Testar com múltiplos usuários
2. ✅ Criar fluxos customizados
3. ✅ Configurar transferência para atendentes
4. ✅ Implementar fila de espera
5. ✅ Adicionar métricas e dashboards

---

## 📞 Suporte

Se precisar de ajuda:

- 📧 Email: suporte@conectcrm.com
- 💬 Slack: #dev-webhook-whatsapp
- 📖 Docs: https://docs.conectcrm.com/webhook

---

**🎉 Webhook configurado com sucesso!**

Agora você tem um bot de triagem WhatsApp totalmente funcional com validação de segurança HMAC SHA-256!
