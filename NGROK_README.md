# 🌐 ngrok - Guia Rápido de Uso

## ⚡ Início em 3 Comandos

```powershell
# 1. Baixar e instalar ngrok
# https://ngrok.com/download

# 2. Autenticar (uma vez apenas)
ngrok config add-authtoken SEU_TOKEN

# 3. Iniciar tudo automaticamente
.\start-dev-with-ngrok.ps1
```

Pronto! ✅ A URL do ngrok será exibida automaticamente.

---

## 📋 Scripts Disponíveis

### Iniciar Ambiente
```powershell
.\start-dev-with-ngrok.ps1
```
**O que faz:**
- ✅ Inicia backend (porta 3001)
- ✅ Inicia frontend (porta 3000)
- ✅ Inicia ngrok
- ✅ Mostra URL pública
- ✅ Abre dashboard

### Parar Ambiente
```powershell
.\stop-dev-environment.ps1
```

### Testar Webhooks
```powershell
.\test-ngrok-webhooks.ps1
```

---

## 🔗 URLs Após Iniciar

- **Backend Local:** http://localhost:3001
- **Backend Público:** https://abc123.ngrok-free.app (exibido automaticamente)
- **Dashboard:** http://127.0.0.1:4040

---

## 📱 Configurar Webhooks

Depois de iniciar, copie a URL do ngrok e configure:

### WhatsApp
https://developers.facebook.com/apps
```
Webhook: https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>
Token: conectcrm_webhook_token_123
Header: X-Hub-Signature-256 (HMAC-SHA256 gerado com o App Secret)
```

### Telegram
```powershell
curl -X POST "https://api.telegram.org/botSEU_TOKEN/setWebhook" `
  -d "url=https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram"
```

### Twilio
https://console.twilio.com
```
Webhook: https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio
Method: POST
```

---

## 📚 Documentação Completa

- **Guia Completo:** `docs/GUIA_NGROK_WEBHOOKS.md`
- **Referência Rápida:** `docs/NGROK_REFERENCIA_RAPIDA.md`
- **Resumo Executivo:** `docs/NGROK_SETUP_RESUMO.md`

---

## ⚠️ Importante

- URL do ngrok muda a cada reinicialização (plano gratuito)
- Precisa reconfigurar webhooks quando reiniciar
- Túnel expira após 2h de inatividade

---

**✨ Pronto para testar!**
