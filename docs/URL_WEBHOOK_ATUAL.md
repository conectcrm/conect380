# 🔗 URL do Webhook Atual

## LocalTunnel Ativo

**Data**: 11/12/2025 15:52  
**Serviço**: LocalTunnel (grátis, sem página de aviso)

### URLs Disponíveis:

1. **Principal** (subdomínio fixo):
   ```
   https://conectcrm.loca.lt
   ```

2. **Alternativa** (gerada automaticamente):
   ```
   https://lovely-panther-90.loca.lt
   ```

---

## 📋 URL Completa para Configurar no Meta

**COPIE E COLE NO META DEVELOPER CONSOLE:**

```
https://conectcrm.loca.lt/api/atendimento/webhooks/whatsapp/11111111-1111-1111-1111-111111111111
```

---

## 🔧 Como Configurar no Meta

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App WhatsApp
3. Vá em: **WhatsApp** → **Configuration**
4. Na seção **Webhook**, clique em **Edit**
5. Cole a URL acima em **Callback URL**
6. Em **Verify Token**, use o valor do banco:
   ```sql
   SELECT webhook_verify_token 
   FROM atendimento_canais_configuracao 
   WHERE tipo = 'whatsapp_business_api';
   ```
7. Marque a opção: **messages** ✅
8. Clique em **Verify and Save**

---

## ✅ Vantagens do LocalTunnel

- ✅ **Grátis** (sem custo)
- ✅ **Sem página de aviso** (diferente do ngrok free)
- ✅ **Subdomínio customizado** (`conectcrm.loca.lt`)
- ✅ **Funciona com webhooks** do Meta

## ⚠️ Limitações

- ⚠️ URL pode mudar se reiniciar o túnel
- ⚠️ Às vezes pede CAPTCHA no navegador (mas webhooks funcionam)
- ⚠️ Menos estável que ngrok pago

---

## 🔄 Como Reiniciar (se necessário)

```powershell
# Parar túnel atual
Get-Job | Stop-Job
Get-Job | Remove-Job

# Iniciar novo
npx localtunnel --port 3001 --subdomain conectcrm
```

---

## 📊 Status Atual

- [x] ✅ LocalTunnel instalado
- [x] ✅ Túnel ativo (`https://conectcrm.loca.lt`)
- [ ] ⏳ Configurar URL no Meta
- [ ] ⏳ Testar mensagem real do WhatsApp

---

**Última atualização**: 11/12/2025 15:52
