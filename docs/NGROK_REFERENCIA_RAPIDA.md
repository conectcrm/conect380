# ⚡ ngrok - Referência Rápida

## 🚀 Comandos Essenciais

### Iniciar Túnel
```powershell
# Túnel HTTP simples
ngrok http 3001

# Túnel com subdomínio customizado (pago)
ngrok http 3001 --subdomain=conectcrm

# Túnel com região específica
ngrok http 3001 --region=us

# Múltiplos túneis
ngrok start conectcrm-backend conectcrm-frontend
```

### Autenticação
```powershell
# Adicionar authtoken
ngrok config add-authtoken SEU_TOKEN

# Ver configuração
ngrok config check

# Editar configuração
notepad C:\Users\$env:USERNAME\.ngrok2\ngrok.yml
```

### Verificar Status
```powershell
# Versão
ngrok version

# Ajuda
ngrok help

# Status do túnel (via API)
Invoke-RestMethod http://127.0.0.1:4040/api/tunnels
```

---

## 📋 Scripts Disponíveis

### 1. Iniciar Ambiente Completo
```powershell
.\start-dev-with-ngrok.ps1

# Opções:
.\start-dev-with-ngrok.ps1 -SkipBackend      # Pular backend
.\start-dev-with-ngrok.ps1 -SkipFrontend     # Pular frontend
.\start-dev-with-ngrok.ps1 -BackendPort 3002 # Porta customizada
```

### 2. Parar Ambiente
```powershell
.\stop-dev-environment.ps1

# Forçar parada (sem confirmação)
.\stop-dev-environment.ps1 -Force
```

### 3. Testar Webhooks
```powershell
# Automático (detecta URL)
.\test-ngrok-webhooks.ps1

# Manual
.\test-ngrok-webhooks.ps1 -NgrokUrl "https://abc123.ngrok-free.app"
```

---

## 🌐 URLs Importantes

| Serviço | URL Local | URL Pública (exemplo) |
|---------|-----------|----------------------|
| **Backend** | http://localhost:3001 | https://abc123.ngrok-free.app |
| **Frontend** | http://localhost:3000 | https://def456.ngrok-free.app |
| **Dashboard ngrok** | http://127.0.0.1:4040 | - |
| **API ngrok** | http://127.0.0.1:4040/api/tunnels | - |

---

## 🔗 Webhooks para Configurar

### WhatsApp (Meta Developers)
```
URL: https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp
Verify Token: conectcrm_webhook_token_123
```

**Configurar em:** https://developers.facebook.com/apps

### Telegram
```bash
curl -X POST "https://api.telegram.org/botSEU_TOKEN/setWebhook" \
  -d "url=https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram"
```

### Twilio
```
URL: https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio
Method: POST
```

**Configurar em:** https://console.twilio.com

---

## 🧪 Testes Rápidos

### Health Check
```powershell
curl https://SEU_DOMINIO.ngrok-free.app/api/health
```

### WhatsApp Webhook
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp `
  -H "Content-Type: application/json" `
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"Teste"}}]}}]}]}'
```

### Telegram Webhook
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram `
  -H "Content-Type: application/json" `
  -d '{"message":{"chat":{"id":123456789},"text":"Teste"}}'
```

---

## 🛠️ Troubleshooting Rápido

### Problema: Túnel não conecta
```powershell
# Verificar se backend está rodando
Get-NetTCPConnection -LocalPort 3001

# Verificar processos
Get-Process -Name ngrok, node
```

### Problema: URL muda toda vez
**Solução:** Upgrade para plano pago (domínio fixo) ou use Cloudflare Tunnel (grátis)

### Problema: Webhook não chama
1. ✅ Verificar dashboard: http://127.0.0.1:4040
2. ✅ Ver logs do backend
3. ✅ Confirmar URL configurada corretamente
4. ✅ Testar com curl primeiro

### Problema: Túnel expira
**Causa:** Plano gratuito tem limite de 2h de inatividade  
**Solução:** Reiniciar ngrok ou fazer upgrade

---

## 📊 Dashboard ngrok

### Acesso
http://127.0.0.1:4040

### Funcionalidades
- ✅ Ver todas requisições em tempo real
- ✅ Inspecionar headers, body, query params
- ✅ Replay de requisições
- ✅ Filtrar por status code
- ✅ Exportar requisições

---

## 🔧 Configuração Avançada (ngrok.yml)

```yaml
version: "2"
authtoken: SEU_TOKEN

tunnels:
  conectcrm-backend:
    addr: 3001
    proto: http
    bind_tls: true
    inspect: true
    
  conectcrm-frontend:
    addr: 3000
    proto: http
    bind_tls: true

region: us
log_level: info
log_format: json
```

**Local:** `C:\Users\$env:USERNAME\.ngrok2\ngrok.yml`

---

## 📚 Recursos

- **Documentação:** https://ngrok.com/docs
- **Dashboard:** https://dashboard.ngrok.com
- **Guia Completo:** `docs/GUIA_NGROK_WEBHOOKS.md`
- **API Docs:** `docs/API_DOCUMENTATION.md`
- **Testes:** `docs/TESTES_INTEGRACOES.md`

---

## ⚠️ Limites do Plano Gratuito

| Recurso | Limite |
|---------|--------|
| Túneis simultâneos | 1 |
| Requisições/minuto | 40 |
| Sessão | 2h (inatividade) |
| Domínio fixo | ❌ Não |
| IP personalizado | ❌ Não |

**Upgrade:** https://dashboard.ngrok.com/billing/subscription

---

## 🎯 Workflow Recomendado

1. ✅ Iniciar ambiente: `.\start-dev-with-ngrok.ps1`
2. ✅ Copiar URL do ngrok (é exibida automaticamente)
3. ✅ Configurar webhooks nas plataformas
4. ✅ Testar: `.\test-ngrok-webhooks.ps1`
5. ✅ Monitorar: http://127.0.0.1:4040
6. ✅ Desenvolver e testar
7. ✅ Parar tudo: `.\stop-dev-environment.ps1`

---

**✨ Pronto para testar suas integrações!**
