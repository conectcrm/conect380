# 🚨 ERRO: Token WhatsApp Inválido

**Data**: 09/12/2025 09:42  
**Erro**: `Malformed access token` (401 Unauthorized)  
**Status**: ⚠️ **AÇÃO NECESSÁRIA**

---

## ❌ Problema

A Meta está rejeitando o token atual com erro:

```json
{
  "error": {
    "message": "Malformed access token EAANdXajZCWZBwBO0zU...",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Causa**: O token no banco está **inválido, expirado ou malformado**.

---

## ✅ SOLUÇÃO (3 passos simples)

### 📍 Passo 1: Obter Token Válido

#### Opção A: Token Temporário (Teste - 24h)
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App WhatsApp
3. Vá em **WhatsApp → API Setup**
4. Copie o **Temporary access token** (válido 24h)

#### Opção B: Token Permanente (Produção)
1. Acesse: https://business.facebook.com/settings/system-users
2. Selecione ou crie um **System User**
3. Clique em **Generate New Token**
4. Selecione seu App WhatsApp
5. Marque permissões:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
6. **Copie o token** (guarde em local seguro!)

---

### 📍 Passo 2: Atualizar no Sistema

**Método 1: Script Automático** (Recomendado)

```powershell
# No PowerShell, execute:
cd C:\Projetos\conectcrm
.\update-token.ps1 -Token "COLE_SEU_TOKEN_AQUI"
```

O script vai:
- ✅ Testar se token é válido
- ✅ Atualizar no banco de dados
- ✅ Confirmar sucesso

---

**Método 2: SQL Direto**

```sql
-- Substitua YOUR_NEW_TOKEN pelo token copiado
UPDATE atendimento_integracoes_config 
SET 
    whatsapp_api_token = 'YOUR_NEW_TOKEN',
    credenciais = jsonb_set(
        COALESCE(credenciais, '{}'::jsonb),
        '{whatsapp_api_token}',
        '"YOUR_NEW_TOKEN"'
    ),
    atualizado_em = NOW()
WHERE empresa_id = '11111111-1111-1111-1111-111111111111' 
  AND tipo = 'whatsapp_business_api';
```

Para executar:
```powershell
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "SEU_SQL_AQUI"
```

---

### 📍 Passo 3: Verificar

```powershell
# Verificar se token foi atualizado
docker exec conectcrm-postgres psql -U conectcrm -d conectcrm_db -c `
  "SELECT LEFT(whatsapp_api_token, 50) || '...' as token, atualizado_em 
   FROM atendimento_integracoes_config 
   WHERE empresa_id='11111111-1111-1111-1111-111111111111';"
```

Depois tente **enviar uma mensagem** novamente pelo sistema.

---

## 🔍 Validar Token Antes de Usar

Teste se o token funciona:

```powershell
# Substitua YOUR_TOKEN
$token = "YOUR_TOKEN_HERE"
Invoke-RestMethod "https://graph.facebook.com/v18.0/me?access_token=$token"
```

**Resposta esperada**:
```json
{
  "id": "1234567890",
  "name": "Seu App WhatsApp"
}
```

Se retornar erro, o token está inválido!

---

## 📋 Checklist

- [ ] Acessei Meta Developers ou Business Settings
- [ ] Copiei token válido (começa com `EAA...`)
- [ ] Testei token com `graph.facebook.com/me`
- [ ] Executei script `update-token.ps1` OU SQL manual
- [ ] Verifiquei atualização no banco
- [ ] Tentei enviar mensagem novamente
- [ ] Mensagem enviada com sucesso! ✅

---

## 🚨 Erros Comuns

### "Invalid OAuth access token"
- Token expirou ou foi revogado
- Regenere um novo token

### "Permissions error"
- Token não tem permissões necessárias
- Certifique-se de marcar:
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`

### "Token parece válido mas erro persiste"
- Verifique se Phone Number ID está correto: `704423209430762`
- Verifique se App tem acesso ao número

---

## 📚 Links Úteis

- **App Dashboard**: https://developers.facebook.com/apps
- **Business Settings**: https://business.facebook.com/settings
- **WhatsApp API Docs**: https://developers.facebook.com/docs/whatsapp
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer

---

## 💡 Dica de Segurança

**NUNCA** compartilhe seu token em:
- ❌ Repositórios Git públicos
- ❌ Screenshots ou vídeos
- ❌ Mensagens não criptografadas
- ❌ Logs públicos

Tokens têm acesso total ao seu WhatsApp Business!

---

**Status**: ⏳ **AGUARDANDO TOKEN VÁLIDO**  
**Próxima ação**: Obter token da Meta e executar `update-token.ps1`

---

**Gerado por**: GitHub Copilot  
**Data**: 09/12/2025 09:45
