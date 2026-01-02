# 🌐 Guia Completo - ngrok para Webhooks e Integrações

**Data:** 11 de outubro de 2025  
**Versão:** 1.0.0  
**Objetivo:** Configurar ngrok para testar webhooks em ambiente de desenvolvimento

---

## 📋 **Índice**

1. [O que é ngrok](#o-que-é-ngrok)
2. [Instalação](#instalação)
3. [Configuração Básica](#configuração-básica)
4. [Configuração para ConectCRM](#configuração-para-conectcrm)
5. [Webhooks por Integração](#webhooks-por-integração)
6. [Testes e Validação](#testes-e-validação)
7. [Troubleshooting](#troubleshooting)
8. [Alternativas ao ngrok](#alternativas-ao-ngrok)

---

## 🤔 **O que é ngrok?**

O **ngrok** é um túnel reverso que expõe seu servidor local (localhost) para a internet, permitindo:

✅ Receber webhooks de APIs externas (WhatsApp, Telegram, etc.)  
✅ Testar integrações sem deploy  
✅ Debugar requisições em tempo real  
✅ Compartilhar seu ambiente de desenvolvimento  

**Como funciona:**
```
Internet → ngrok.io → Túnel seguro → localhost:3001 (seu backend)
```

---

## 💻 **Instalação**

### **Método 1: Download Direto (Recomendado)**

1. Acesse: https://ngrok.com/download
2. Faça o download para Windows
3. Extraia o arquivo `ngrok.exe` para uma pasta (ex: `C:\ngrok\`)
4. Adicione ao PATH do Windows (opcional):
   - Painel de Controle → Sistema → Variáveis de Ambiente
   - Adicione `C:\ngrok` à variável `Path`

### **Método 2: Via Chocolatey**

```powershell
choco install ngrok
```

### **Método 3: Via Scoop**

```powershell
scoop install ngrok
```

### **Verificar Instalação**

```powershell
ngrok version
# Saída esperada: ngrok version X.X.X
```

---

## 🔑 **Configuração Básica**

### **1. Criar Conta no ngrok (Grátis)**

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta (pode usar GitHub)
3. No dashboard, copie seu **authtoken**

### **2. Autenticar ngrok**

```powershell
ngrok config add-authtoken SEU_TOKEN_AQUI
```

Exemplo:
```powershell
ngrok config add-authtoken 2hJKL3jk4h5jk6h7jk8h9jk0hJKL3jk4h5jk6h7
```

### **3. Verificar Configuração**

O arquivo de config fica em:
```
Windows: C:\Users\SEU_USUARIO\.ngrok2\ngrok.yml
```

---

## ⚙️ **Configuração para ConectCRM**

### **Arquivo de Configuração Avançada**

Crie/edite o arquivo `ngrok.yml`:

```yaml
# C:\Users\SEU_USUARIO\.ngrok2\ngrok.yml
version: "2"
authtoken: SEU_TOKEN_AQUI

tunnels:
  # Backend NestJS
  conectcrm-backend:
    addr: 3001
    proto: http
    bind_tls: true
    inspect: true
    # Domínio personalizado (apenas para contas pagas)
    # hostname: conectcrm.ngrok.io

  # Frontend React (opcional)
  conectcrm-frontend:
    addr: 3000
    proto: http
    bind_tls: true
    inspect: false

# Região mais próxima (menor latência)
region: us # us, eu, ap, au, sa, jp, in
```

### **Iniciar ngrok para Backend**

**Método 1: Simples (apenas backend)**
```powershell
ngrok http 3001
```

**Método 2: Com configuração customizada**
```powershell
ngrok start conectcrm-backend
```

**Método 3: Backend + Frontend simultâneos**
```powershell
ngrok start conectcrm-backend conectcrm-frontend
```

### **Saída Esperada**

```
ngrok                                                                  

Session Status                online
Account                       seu-email@example.com (Plan: Free)
Version                       3.5.0
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**URL Pública:** `https://abc123def.ngrok-free.app`

---

## 🔗 **Webhooks por Integração**

### **1. WhatsApp Business API (Meta)**

**URL do Webhook:**
```
https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>
```

**Configurar no Meta Developers:**

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu app WhatsApp
3. Vá em **WhatsApp > Configuration**
4. **Callback URL:** `https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>`
5. **Verify Token:** `conectcrm_webhook_token_123` (mesmo do `.env`)
6. **Header obrigatório:** `X-Hub-Signature-256` com HMAC SHA256 gerado via App Secret
7. Clique em **Verify and Save**
8. Inscreva-se nos eventos:
   - ✅ messages
   - ✅ message_status
   - ✅ message_echoes

**Testar Webhook:**
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA> `
  -H "Content-Type: application/json" `
  -H "X-Hub-Signature-256: sha256=<HMAC_GERADO>" `
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "text": {
              "body": "Olá, teste!"
            }
          }]
        }
      }]
    }]
  }'
```

---

### **2. Telegram Bot**

**URL do Webhook:**
```
https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram
```

**Configurar via API do Telegram:**

```powershell
# Substitua SEU_BOT_TOKEN e SEU_DOMINIO
curl -X POST "https://api.telegram.org/botSEU_BOT_TOKEN/setWebhook" `
  -d "url=https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram" `
  -d "drop_pending_updates=true"
```

**Verificar Configuração:**
```powershell
curl "https://api.telegram.org/botSEU_BOT_TOKEN/getWebhookInfo"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

**Testar Webhook:**
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/telegram `
  -H "Content-Type: application/json" `
  -d '{
    "message": {
      "chat": {
        "id": 123456789
      },
      "text": "Teste ngrok"
    }
  }'
```

---

### **3. Twilio (SMS/WhatsApp)**

**URL do Webhook:**
```
https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio
```

**Configurar no Console Twilio:**

1. Acesse: https://console.twilio.com
2. **Phone Numbers > Manage > Active Numbers**
3. Selecione seu número
4. **Messaging Configuration:**
   - **A MESSAGE COMES IN:** `https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio`
   - **HTTP POST**
5. Salvar

**Testar Webhook:**
```powershell
curl -X POST https://SEU_DOMINIO.ngrok-free.app/api/atendimento/webhooks/twilio `
  -d "From=+5511999999999" `
  -d "Body=Teste ngrok Twilio"
```

---

### **4. OpenAI / Anthropic**

Essas integrações **não usam webhooks** (são chamadas síncronas), então não precisam de ngrok.

---

## 🧪 **Testes e Validação**

### **Dashboard Web do ngrok**

Acesse: **http://127.0.0.1:4040**

**Funcionalidades:**
- 📊 Ver todas as requisições em tempo real
- 🔍 Inspecionar headers, body, query params
- 🔁 Replay de requisições
- 📈 Estatísticas de latência

### **Testar Conectividade**

```powershell
# Testar se o backend está acessível via ngrok
curl https://SEU_DOMINIO.ngrok-free.app/api/health
```

### **Monitorar Logs do Backend**

```powershell
# Terminal 1: Backend rodando
cd C:\Projetos\conectcrm\backend
npm run start:dev

# Terminal 2: ngrok
ngrok http 3001

# Terminal 3: Enviar requisições de teste
curl https://SEU_DOMINIO.ngrok-free.app/api/atendimento/tickets
```

### **Script de Teste Completo**

```powershell
# test-ngrok-webhooks.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "🧪 Testando webhooks via ngrok..." -ForegroundColor Cyan
Write-Host "URL: $NgrokUrl`n" -ForegroundColor Yellow

# 1. Health Check
Write-Host "1️⃣ Health Check..." -ForegroundColor Green
curl "$NgrokUrl/api/health"

# 2. WhatsApp Webhook
Write-Host "`n2️⃣ WhatsApp Webhook..." -ForegroundColor Green
$empresaId = "<ID_EMPRESA>" # substitua pelo ID real
curl -X POST "$NgrokUrl/api/atendimento/webhooks/whatsapp/$empresaId" `
  -H "Content-Type: application/json" `
  -H "X-Hub-Signature-256: sha256=<HMAC_GERADO>" `
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "text": {
              "body": "Teste ngrok!"
            }
          }]
        }
      }]
    }]
  }'

# 3. Telegram Webhook
Write-Host "`n3️⃣ Telegram Webhook..." -ForegroundColor Green
curl -X POST "$NgrokUrl/api/atendimento/webhooks/telegram" `
  -H "Content-Type: application/json" `
  -d '{
    "message": {
      "chat": {
        "id": 123456789
      },
      "text": "Teste ngrok Telegram"
    }
  }'

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green
Write-Host "Verifique os logs do backend e o dashboard ngrok (http://127.0.0.1:4040)" -ForegroundColor Yellow
```

**Usar:**
```powershell
.\test-ngrok-webhooks.ps1 -NgrokUrl "https://abc123def.ngrok-free.app"
```

---

## 🛠️ **Troubleshooting**

### **Problema 1: "ERR_NGROK_108 - Authtoken inválido"**

**Solução:**
```powershell
# Re-autenticar
ngrok config add-authtoken SEU_NOVO_TOKEN
```

### **Problema 2: "Failed to complete tunnel connection"**

**Causas possíveis:**
- Backend não está rodando
- Porta incorreta
- Firewall bloqueando

**Solução:**
```powershell
# Verificar se o backend está rodando na porta 3001
netstat -ano | findstr :3001

# Se não estiver, iniciar:
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

### **Problema 3: Webhook não está sendo chamado**

**Checklist:**
1. ✅ ngrok está rodando?
2. ✅ Backend está rodando?
3. ✅ URL do webhook configurada corretamente na plataforma?
4. ✅ Verifique o dashboard ngrok (http://127.0.0.1:4040)
5. ✅ Veja os logs do backend

### **Problema 4: "ngrok is not recognized"**

**Solução:**
```powershell
# Usar caminho completo
C:\ngrok\ngrok.exe http 3001

# Ou adicionar ao PATH
$env:Path += ";C:\ngrok"
```

### **Problema 5: Túnel desconecta após 2 horas (plano gratuito)**

**Solução:**
- Plano gratuito tem limite de 2h por sessão
- Reiniciar o ngrok (nova URL será gerada)
- Ou: upgrade para plano pago (domínio fixo)

### **Problema 6: "ERR_NGROK_3200 - Tunnel limit reached"**

**Solução:**
- Plano gratuito: 1 túnel simultâneo
- Parar outros túneis ativos
- Ou: upgrade para plano pago

---

## 🔄 **Automação com Scripts**

### **Script: Iniciar Backend + ngrok**

```powershell
# start-dev-with-ngrok.ps1

Write-Host "🚀 Iniciando ambiente de desenvolvimento..." -ForegroundColor Cyan

# 1. Iniciar backend em background
Write-Host "`n1️⃣ Iniciando backend NestJS..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Projetos\conectcrm\backend; npm run start:dev"

# Aguardar backend iniciar
Write-Host "⏳ Aguardando backend iniciar (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. Iniciar ngrok
Write-Host "`n2️⃣ Iniciando ngrok..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3001"

# Aguardar ngrok iniciar
Start-Sleep -Seconds 5

# 3. Abrir dashboard ngrok
Write-Host "`n3️⃣ Abrindo dashboard ngrok..." -ForegroundColor Green
Start-Process "http://127.0.0.1:4040"

Write-Host "`n✅ Ambiente iniciado!" -ForegroundColor Green
Write-Host "📊 Dashboard ngrok: http://127.0.0.1:4040" -ForegroundColor Cyan
Write-Host "🔗 Copie a URL do ngrok e configure nos webhooks das plataformas" -ForegroundColor Yellow
```

**Executar:**
```powershell
.\start-dev-with-ngrok.ps1
```

---

### **Script: Parar Tudo**

```powershell
# stop-dev-environment.ps1

Write-Host "🛑 Parando ambiente de desenvolvimento..." -ForegroundColor Red

# Parar processos Node.js (backend)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Parar processos ngrok
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ Ambiente parado!" -ForegroundColor Green
```

---

## 🌍 **Alternativas ao ngrok**

### **1. Cloudflare Tunnel (Gratuito)**

```powershell
# Instalar
choco install cloudflared

# Iniciar
cloudflared tunnel --url http://localhost:3001
```

**Vantagens:**
- ✅ Gratuito sem limites
- ✅ Sem timeout
- ✅ Cloudflare CDN

### **2. LocalTunnel (Gratuito)**

```powershell
# Instalar
npm install -g localtunnel

# Iniciar
lt --port 3001 --subdomain conectcrm
```

### **3. Serveo (Gratuito)**

```powershell
ssh -R 80:localhost:3001 serveo.net
```

### **4. Pagekite (Gratuito/Pago)**

```powershell
pagekite.py 3001 conectcrm.pagekite.me
```

### **Comparação**

| Ferramenta | Grátis | Domínio Fixo | Timeout | Interface Web |
|------------|--------|--------------|---------|---------------|
| **ngrok** | ✅ (1 túnel) | ❌ (pago) | 2h | ✅ Excelente |
| **Cloudflare** | ✅ Ilimitado | ✅ | ❌ Sem limite | ❌ |
| **LocalTunnel** | ✅ | ❌ | ❌ Sem limite | ❌ |
| **Serveo** | ✅ | ❌ | ❌ Sem limite | ❌ |

**Recomendação:** ngrok para desenvolvimento (melhor UX e debugging)

---

## 📚 **Referências**

- **ngrok Docs:** https://ngrok.com/docs
- **ngrok Dashboard:** https://dashboard.ngrok.com
- **WhatsApp Webhooks:** https://developers.facebook.com/docs/whatsapp/webhooks
- **Telegram Webhooks:** https://core.telegram.org/bots/api#setwebhook
- **Twilio Webhooks:** https://www.twilio.com/docs/usage/webhooks

---

## ✅ **Checklist de Configuração**

- [ ] ngrok instalado
- [ ] Conta criada no ngrok.com
- [ ] Authtoken configurado
- [ ] Backend rodando em `localhost:3001`
- [ ] ngrok iniciado: `ngrok http 3001`
- [ ] URL ngrok copiada (ex: `https://abc123.ngrok-free.app`)
- [ ] Webhook WhatsApp configurado no Meta Developers
- [ ] Webhook Telegram configurado via API
- [ ] Webhook Twilio configurado no Console
- [ ] Dashboard ngrok aberto: http://127.0.0.1:4040
- [ ] Testes realizados com sucesso

---

## 🎯 **Próximos Passos**

1. ✅ Configurar ngrok
2. ✅ Configurar webhooks nas plataformas
3. ✅ Testar cada integração
4. ⏳ Criar contas de teste em cada plataforma
5. ⏳ Documentar fluxos de teste
6. ⏳ Preparar para deploy em produção

---

**✨ Agora você está pronto para testar todas as integrações em ambiente local!**
