# 🔑 GUIA: Gerar e Configurar Token WhatsApp Business API

## ❌ PROBLEMA IDENTIFICADO

**Token expirado!**
- Expirou em: 11 de outubro de 2025, 21:00 PDT
- Erro: `Session has expired on Saturday, 11-Oct-25 21:00:00 PDT`
- Status: 401 OAuthException

## 📋 PASSO A PASSO PARA GERAR NOVO TOKEN

### 1️⃣ Acessar Meta Developer Console

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu aplicativo WhatsApp
3. No menu lateral, clique em **"WhatsApp" → "API Setup"**

### 2️⃣ Gerar Token de Acesso Permanente

#### Opção A: Token Temporário (24 horas)
```
No painel "API Setup", você verá um token temporário já gerado.
⚠️ Estes tokens expiram em 24 horas!
Use apenas para testes rápidos.
```

#### Opção B: Token Permanente (RECOMENDADO) ✅

1. **Criar System User**:
   - No menu superior, vá em **"Business Settings"**
   - Menu lateral: **"Users" → "System Users"**
   - Clique em **"Add"**
   - Nome: `ConectCRM WhatsApp`
   - Role: **Admin**
   - Clique em **"Create System User"**

2. **Gerar Token Permanente**:
   - Clique no system user que você criou
   - Clique em **"Generate New Token"**
   - Selecione seu aplicativo WhatsApp
   - Marque as permissões necessárias:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
   - Tempo de expiração: **Never Expire** ✅
   - Clique em **"Generate Token"**
   - **COPIE O TOKEN E GUARDE EM LOCAL SEGURO!**

3. **Adicionar Assets ao System User**:
   - Ainda nas configurações do system user
   - Seção **"Assign Assets"**
   - Clique em **"Add Assets"**
   - Tipo: **Apps**
   - Selecione seu aplicativo WhatsApp
   - Marque: **Manage App** e **Full Control**
   - Salve

### 3️⃣ Atualizar Token no Banco de Dados

Copie o código SQL abaixo e substitua `SEU_TOKEN_PERMANENTE_AQUI` pelo token que você copiou:

```sql
-- ⚠️ EXECUTE NO POSTGRESQL
UPDATE atendimento_integracoes_config
SET credenciais = jsonb_set(
  credenciais,
  '{whatsapp_api_token}',
  '"SEU_TOKEN_PERMANENTE_AQUI"'
)
WHERE tipo = 'whatsapp_business_api'
  AND empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

**Via PowerShell**:
```powershell
# Substitua SEU_TOKEN_PERMANENTE pelo token real
$TOKEN = "SEU_TOKEN_PERMANENTE"

docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  UPDATE atendimento_integracoes_config
  SET credenciais = jsonb_set(
    credenciais,
    '{whatsapp_api_token}',
    '\"$TOKEN\"'
  )
  WHERE tipo = 'whatsapp_business_api'
    AND empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
"
```

### 4️⃣ Verificar Atualização

```powershell
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    tipo,
    ativo,
    credenciais->>'whatsapp_api_token' as token_preview
  FROM atendimento_integracoes_config
  WHERE tipo = 'whatsapp_business_api';
"
```

### 5️⃣ Testar Envio de Mensagem

```powershell
node test-envio-whatsapp.js
```

Se tudo estiver correto, você verá:
```
✅ Token WhatsApp válido e funcionando
✅ Mensagem enviada via API
✅ Mensagem salva no banco
✅ Ticket atualizado
✅ Sistema de envio 100% funcional!
```

---

## 🔐 INFORMAÇÕES DE SEGURANÇA

### ⚠️ Proteger Token de Acesso

**O token é sensível!** Ele permite enviar mensagens em nome da sua empresa.

**Boas práticas**:
- ✅ Use tokens de System User (não expiram)
- ✅ Armazene tokens apenas no banco de dados
- ✅ Nunca commite tokens no Git
- ✅ Use variáveis de ambiente para desenvolvimento
- ❌ Nunca compartilhe tokens publicamente

### 🔄 Rotação de Tokens

**Quando rotacionar**:
- Token comprometido
- Funcionário deixou a empresa
- Mudança de aplicativo WhatsApp
- Auditoria de segurança

**Como rotacionar**:
1. Gerar novo token no Meta Developer Console
2. Atualizar no banco de dados
3. Invalidar token antigo
4. Testar sistema completo

---

## 📊 VALIDAÇÃO DO TOKEN

### Informações que você precisa confirmar:

```json
{
  "whatsapp_api_token": "EAAL...",           // ← Token gerado
  "whatsapp_phone_number_id": "704423209430762",  // ← Correto ✅
  "whatsapp_business_account_id": "1922786558561358"  // ← Correto ✅
}
```

✅ **Phone Number ID** e **Business Account ID** já estão corretos!  
⚠️ Só precisa atualizar o `whatsapp_api_token`

---

## 🎯 CHECKLIST DE CONFIGURAÇÃO

- [ ] Acessei Meta Developer Console
- [ ] Criei System User (se não existir)
- [ ] Gerei token permanente com permissões corretas
- [ ] Copiei e guardei o token em local seguro
- [ ] Atualizei token no banco de dados
- [ ] Verifiquei que o token foi salvo corretamente
- [ ] Executei `node test-envio-whatsapp.js`
- [ ] Vi mensagem no WhatsApp do cliente
- [ ] Confirmei mensagem salva no banco

---

## 🆘 RESOLUÇÃO DE PROBLEMAS

### Erro: "Invalid OAuth access token"
**Causa**: Token incorreto ou não gerado corretamente  
**Solução**: Gerar novo token no Meta Developer Console

### Erro: "Insufficient permissions"
**Causa**: Token não tem as permissões necessárias  
**Solução**: Regenerar token com permissões corretas:
- `whatsapp_business_management`
- `whatsapp_business_messaging`

### Erro: "Phone number not verified"
**Causa**: Número do WhatsApp Business não verificado  
**Solução**: Verificar número no Meta Business Manager

### Erro: "Message template required"
**Causa**: Tentando iniciar conversa sem template aprovado  
**Solução**: 
- Para responder mensagens: funciona normalmente ✅
- Para iniciar conversa: precisa usar template aprovado

### Erro: "Rate limit exceeded"
**Causa**: Muitas mensagens enviadas em pouco tempo  
**Solução**: 
- Tier 1: 1.000 conversas/dia
- Tier 2: 10.000 conversas/dia
- Solicitar aumento de tier no Meta

---

## 📚 LINKS ÚTEIS

- **Meta Developer Console**: https://developers.facebook.com/apps
- **Documentação WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **System Users**: https://business.facebook.com/settings/system-users
- **Guia de Tokens**: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-users

---

## ✅ APÓS CONFIGURAR

Quando o token estiver atualizado, execute:

```powershell
# Testar envio
node test-envio-whatsapp.js

# Ver resultado no banco
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "
  SELECT 
    remetente_tipo,
    LEFT(conteudo, 50) as mensagem,
    created_at
  FROM atendimento_mensagens
  WHERE ticket_id = '356ef550-f1b8-4b66-a421-ce9e798cde81'
  ORDER BY created_at;
"
```

---

**Pronto! Com o token atualizado, o sistema poderá enviar mensagens! 🚀**
