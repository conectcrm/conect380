# 🔍 SOLUÇÃO: Mensagens WhatsApp Não Estão Chegando

## 🎯 Problema

Mensagens enviadas de um número WhatsApp (ex: `5562996689991`) não aparecem no sistema ConectCRM.

---

## 🔧 Diagnóstico Rápido

### 1️⃣ Verificar Backend Rodando

```powershell
# Verificar se porta 3001 está ativa
netstat -ano | Select-String ":3001" | Select-String "LISTENING"
```

**Resultado esperado**: Deve retornar linha mostrando `LISTENING`

❌ **Se não aparecer nada**:
```powershell
cd backend
npm run start:dev
```

---

### 2️⃣ Verificar Canal WhatsApp no Banco

```sql
-- Execute no DBeaver/pgAdmin
SELECT 
    id,
    tipo,
    nome,
    ativo,
    webhook_url,
    webhook_verify_token,
    credenciais->>'whatsapp_phone_number_id' as phone_id,
    CASE 
        WHEN LENGTH(credenciais->>'whatsapp_api_token') > 20 THEN 'Token OK ✅'
        ELSE 'Token ausente ❌'
    END as token_status
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api'
AND empresa_id = '11111111-1111-1111-1111-111111111111';
```

**Verificar**:
- ✅ `ativo = true`
- ✅ `phone_id` preenchido (ex: `704423209430762`)
- ✅ `token_status = 'Token OK ✅'`
- ✅ `webhook_verify_token` preenchido

---

### 3️⃣ Verificar Webhook Configurado no Meta

**⚠️ ESTA É A CAUSA #1 (80% dos casos)**

#### Passo a Passo:

1. **Acesse**: https://developers.facebook.com/apps
2. **Selecione**: Seu App WhatsApp
3. **Menu**: WhatsApp → Configuration
4. **Procure**: Seção "Webhook"

#### Verificar Configuração:

**Callback URL** deve estar assim:

```
✅ PRODUÇÃO:
https://seu-dominio.com/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111

✅ DESENVOLVIMENTO (ngrok):
https://abc123xyz.ngrok.io/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111

✅ DESENVOLVIMENTO (localtunnel):
https://abc123xyz.loca.lt/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111
```

**Verify Token** deve ser:
- O mesmo valor de `webhook_verify_token` do banco de dados
- Exemplo: `conectcrm_webhook_token_2024`

**Webhook Fields** deve incluir:
- ✅ `messages` (obrigatório)

---

### 4️⃣ Verificar Ngrok/Túnel Ativo

Se estiver desenvolvendo localmente com ngrok:

```powershell
# Iniciar ngrok
ngrok http 3001
```

**Importante**:
- ⚠️ URL do ngrok **MUDA A CADA VEZ** que você reinicia!
- Você deve **ATUALIZAR** a Callback URL no Meta toda vez
- Alternativa: Use ngrok pago (URL fixa) ou localtunnel

#### Configurar Ngrok URL Fixa (Recomendado):

1. Crie conta em https://ngrok.com
2. Configure authtoken:
   ```powershell
   ngrok authtoken SEU_TOKEN_AQUI
   ```
3. Configure domínio fixo no plano pago
4. Use: `ngrok http --domain=seu-dominio-fixo.ngrok.io 3001`

---

### 5️⃣ Verificar Test Number

Se estiver usando **Test Number** (número de teste da Meta):

1. **Acesse**: https://business.facebook.com
2. **Menu**: WhatsApp Manager → Phone Numbers
3. **Selecione**: Test Number
4. **Aba**: Test Recipients
5. **Adicionar**: `5562996689991` (ou o número que está testando)

**⚠️ LIMITAÇÃO**: Test Numbers só recebem de números adicionados como Test Recipients!

---

## 🧪 Teste Manual do Webhook

Execute este comando PowerShell para simular uma mensagem chegando:

```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "1922786558561358"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "15551597121"
                            phone_number_id = "704423209430762"
                        }
                        messages = @(
                            @{
                                from = "5562996689991"
                                id = "wamid.teste123"
                                timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
                                text = @{
                                    body = "Mensagem de teste manual"
                                }
                                type = "text"
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

# Testar endpoint de teste (sem validação de assinatura)
Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111/test" -Method POST -Headers $headers -Body $body
```

**Resultado esperado**:
```json
{
  "success": true,
  "message": "Webhook processado (teste)",
  "data": { ... }
}
```

---

## 🔍 Verificar Logs do Backend

Observe o terminal onde o backend está rodando. Procure por:

### ✅ Mensagem chegou corretamente:
```
[WhatsAppWebhookController] 📩 Webhook recebido - Empresa: 11111111-1111-1111-1111-111111111111
[WhatsAppWebhookController] 📞 phone_number_id extraído: "704423209430762"
[Bull Queue] Processing job: process-whatsapp-webhook
```

### ❌ Phone Number ID não pertence à empresa:
```
[WhatsAppWebhookController] ❌ phone_number_id 704423209430762 não pertence à empresa 11111111-1111-1111-1111-111111111111
```

**Solução**: Atualizar `phone_number_id` no banco de dados.

### ❌ Assinatura inválida:
```
[WhatsAppWebhookController] ❌ Assinatura inválida - Empresa: 11111111-1111-1111-1111-111111111111
```

**Solução**: Verificar `App Secret` no código e no Meta App.

### ❌ Token de verificação inválido:
```
[WhatsAppWebhookController] ❌ Token de verificação inválido para empresa 11111111-1111-1111-1111-111111111111
```

**Solução**: Atualizar `webhook_verify_token` no banco ou no Meta.

---

## 📊 Verificar Mensagens Recebidas

```sql
-- Últimas mensagens do número
SELECT 
    m.id,
    m.ticket_id,
    m.remetente,
    m.tipo_remetente,
    m.conteudo_texto,
    m.status,
    m.created_at,
    t.numero as ticket_numero,
    t.status as ticket_status
FROM atendimento_mensagens m
LEFT JOIN atendimento_tickets t ON m.ticket_id = t.id
WHERE m.remetente LIKE '%5562996689991%'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Se não retornar nada**: Mensagens não estão chegando no backend (problema de webhook).

**Se retornar mensagens antigas**: Webhook parou de funcionar (URL mudou?).

---

## ✅ Checklist Completo

- [ ] **Backend rodando** (porta 3001 ativa)
- [ ] **Canal WhatsApp ativo** no banco de dados
- [ ] **Phone Number ID correto** (`704423209430762`)
- [ ] **Token configurado** no banco
- [ ] **Webhook URL configurada** no Meta App
- [ ] **Webhook URL correta** (com empresaId: `11111111-1111-1111-1111-111111111111`)
- [ ] **Verify Token correto** (mesmo do banco)
- [ ] **Webhook Fields**: `messages` subscribed
- [ ] **Ngrok/túnel ativo** (se desenvolvimento local)
- [ ] **URL atualizada no Meta** (se ngrok reiniciou)
- [ ] **Test Recipient adicionado** (se usar Test Number)
- [ ] **Logs do backend sem erros** ao receber webhook
- [ ] **Teste manual funcionou** (endpoint `/test`)

---

## 💡 Problemas Mais Comuns (em ordem)

### 1. Webhook não configurado no Meta (80%)
**Sintoma**: Nenhuma mensagem chega, logs backend silenciosos.  
**Solução**: Configurar webhook no Meta Developer Console.

### 2. URL do ngrok mudou (15%)
**Sintoma**: Funcionava antes, parou de funcionar após reiniciar ngrok.  
**Solução**: Atualizar Callback URL no Meta com nova URL do ngrok.

### 3. Verify Token incorreto (3%)
**Sintoma**: Meta não consegue verificar webhook.  
**Solução**: Copiar `webhook_verify_token` do banco e colar no Meta.

### 4. Phone Number ID errado (1%)
**Sintoma**: Logs backend: "phone_number_id não pertence à empresa".  
**Solução**: Atualizar no banco com ID correto do Meta.

### 5. Test Number sem Test Recipient (1%)
**Sintoma**: Mensagens de números externos não chegam (Test Number).  
**Solução**: Adicionar número como Test Recipient ou migrar para produção.

---

## 📚 Documentação Oficial

- **WhatsApp Webhooks**: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Ngrok**: https://ngrok.com/docs
- **LocalTunnel**: https://github.com/localtunnel/localtunnel

---

## 🚀 Script Automático

Execute o script de diagnóstico:

```powershell
.\scripts\diagnostico-mensagens-nao-chegam.ps1 -Numero "5562996689991"
```

Este script verifica automaticamente:
- Backend rodando
- Configuração do canal
- Últimas mensagens
- Tickets existentes
- Mostra checklist completo

---

**Última atualização**: 11/12/2025
