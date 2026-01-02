# ⚡ Início Rápido - ngrok (Já Instalado)

**Status:** ✅ ngrok instalado e configurado  
**Data:** 11 de outubro de 2025

---

## 🚀 OPÇÃO 1: AUTOMÁTICO (Recomendado)

### Um único comando faz tudo:

```powershell
.\start-dev-with-ngrok.ps1
```

**O que acontece automaticamente:**
- ✅ Backend NestJS iniciado (porta 3001)
- ✅ Frontend React iniciado (porta 3000)
- ✅ ngrok conectado
- ✅ URL pública obtida e copiada
- ✅ Dashboard aberto (http://127.0.0.1:4040)
- ✅ Instruções de webhooks exibidas

**Tempo:** ~30 segundos

---

## 📝 OPÇÃO 2: MANUAL (Passo a Passo)

### 1. Terminal 1 - Backend
```powershell
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

### 2. Terminal 2 - ngrok
```powershell
ngrok http 3001
```

**Copie a URL HTTPS que aparece:**
```
https://abc123.ngrok-free.app
```

### 3. Configure Webhooks

Use a URL copiada nos webhooks das plataformas (ver seção abaixo).

---

## 🔗 CONFIGURAR WEBHOOKS

### 📱 WhatsApp (Meta Developers)
**1. Acesse:** https://developers.facebook.com/apps  
**2. WhatsApp > Configuration**  
**3. Callback URL:**
```
https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>
```
**4. Verify Token:**
```
conectcrm_webhook_token_123
```
**5. Header obrigatório:** `X-Hub-Signature-256` (HMAC SHA256 com o App Secret)
**6. Eventos:** messages, message_status

---

### 💬 Telegram
**Configurar via API:**
```powershell
curl -X POST "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook" `
  -d "url=https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram"
```

**Verificar:**
```powershell
curl "https://api.telegram.org/botSEU_BOT_TOKEN/getWebhookInfo"
```

---

### 📞 Twilio
**1. Acesse:** https://console.twilio.com  
**2. Phone Numbers > Manage > Active Numbers**  
**3. Messaging Configuration:**
```
Webhook: https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio
Method: HTTP POST
```

---

## 🧪 TESTAR WEBHOOKS

### Teste Automático
```powershell
.\test-ngrok-webhooks.ps1
```

Testa:
- ✅ Health Check
- ✅ WhatsApp Webhook
- ✅ Telegram Webhook
- ✅ Twilio Webhook
- ✅ Endpoint de Validação

---

### Teste Manual

**Health Check:**
```powershell
curl https://SEU_DOMINIO.ngrok-free.app/api/health
```

**WhatsApp Webhook:**
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA> `
   -H "Content-Type: application/json" `
   -H "X-Hub-Signature-256: sha256=<HMAC_GERADO>" `
   -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"Teste"}}]}}]}]}'
```

---

## 📊 MONITORAR

### Dashboard ngrok
```
http://127.0.0.1:4040
```

**Funcionalidades:**
- 📊 Ver todas requisições em tempo real
- 🔍 Inspecionar headers, body, query params
- 🔁 Replay de requisições
- 📈 Estatísticas de latência

---

## 🛑 PARAR TUDO

```powershell
.\stop-dev-environment.ps1
```

Para:
- ❌ Backend
- ❌ Frontend
- ❌ ngrok
- ✅ Libera portas

---

## 📚 DOCUMENTAÇÃO

| Documento | Quando Usar |
|-----------|-------------|
| **NGROK_README.md** | Referência ultra-rápida |
| **docs/GUIA_NGROK_WEBHOOKS.md** | Guia completo (600+ linhas) |
| **docs/NGROK_REFERENCIA_RAPIDA.md** | Comandos e URLs |
| **docs/NGROK_SETUP_RESUMO.md** | Resumo executivo |

---

## ⚠️ AVISOS

### Plano Gratuito ngrok:
- ✅ 1 túnel simultâneo
- ✅ 40 requisições/minuto
- ⚠️ **URL muda a cada reinicialização**
- ⚠️ Sessão expira após 2h inatividade

### Importante:
- 🔄 Precisa reconfigurar webhooks quando reiniciar
- 🔒 Use apenas para desenvolvimento/testes
- ⛔ Não use em produção

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Backend não inicia
```powershell
# Verificar porta
Get-NetTCPConnection -LocalPort 3001

# Matar processos Node
Get-Process -Name node | Stop-Process -Force
```

### ngrok não conecta
```powershell
# Verificar versão
ngrok version

# Verificar config
ngrok config check
```

### Webhook não chama
1. ✅ Dashboard ngrok: http://127.0.0.1:4040
2. ✅ Logs do backend
3. ✅ URL configurada corretamente?
4. ✅ Testar com curl primeiro

---

## ✅ CHECKLIST

- [ ] ngrok instalado ✅
- [ ] Backend iniciado
- [ ] ngrok conectado
- [ ] URL copiada
- [ ] Webhooks configurados:
  - [ ] WhatsApp
  - [ ] Telegram
  - [ ] Twilio
- [ ] Testes executados
- [ ] Mensagens reais testadas

---

## 🎯 FLUXO RECOMENDADO

```
1. .\start-dev-with-ngrok.ps1
   ↓
2. Copiar URL do ngrok
   ↓
3. Configurar webhooks nas plataformas
   ↓
4. .\test-ngrok-webhooks.ps1
   ↓
5. Enviar mensagens reais para testar
   ↓
6. Monitorar dashboard: http://127.0.0.1:4040
   ↓
7. Desenvolver e iterar
   ↓
8. .\stop-dev-environment.ps1
```

---

**✨ Pronto para começar! Execute: `.\start-dev-with-ngrok.ps1`**
