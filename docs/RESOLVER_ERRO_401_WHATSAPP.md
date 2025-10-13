# 🔴 ERRO 401: Token WhatsApp Inválido ou Expirado

**Data:** 11 de outubro de 2025  
**Erro:** `Request failed with status code 401`  
**Mensagem:** "Token de acesso inválido ou expirado"

---

## 🔍 DIAGNÓSTICO

O erro **401 Unauthorized** ao enviar mensagem de teste pelo WhatsApp indica que o **Access Token do Meta Business API está inválido ou expirou**.

### ✅ O que está funcionando:

- ✅ Canal WhatsApp configurado no banco de dados
- ✅ Token salvo corretamente (`whatsapp_api_token`)
- ✅ Phone Number ID presente
- ✅ Business Account ID presente
- ✅ Backend consegue ler as credenciais

### ❌ O problema:

- ❌ **Access Token expirado** ou inválido
- ❌ Canal está INATIVO (`ativo: false`)
- ❌ Status: CONFIGURANDO (não finalizado)

---

## 📋 CAUSA RAIZ

### Tokens Temporários do Meta (24 horas)

Quando você obtém um token no **Meta Developer Console** em **API Setup**, ele é um **Temporary Access Token** que expira em **24 horas**.

```
Token obtido: 11/10/2025 às 10:00
Token expira: 12/10/2025 às 10:00  ⏰
```

Depois disso, você recebe **erro 401** ao tentar usar.

---

## ✅ SOLUÇÃO

Existem **3 opções** para resolver:

---

## 🔧 OPÇÃO 1: Gerar Novo Token Temporário (Rápido, mas expira em 24h)

### Passo a Passo:

1. **Acessar Meta Developer Console**
   ```
   https://developers.facebook.com/
   ```

2. **Ir para seu aplicativo WhatsApp**
   - Meus Aplicativos → [Seu App]

3. **Gerar novo token**
   - Menu lateral: **WhatsApp** → **API Setup**
   - Procure: **Temporary access token**
   - Clique em **Generate Token** 🔄
   - ✅ **Copie o novo token**

4. **Atualizar no ConectCRM**
   - Acesse: http://localhost:3000
   - Vá em: **Configurações** → **Integrações** → **WhatsApp**
   - Cole o novo token no campo **Access Token**
   - ✅ Marque **"Ativar este canal"**
   - Clique em **SALVAR**

5. **Testar novamente**
   - Clique em **"Testar Mensagem"**
   - Deve funcionar! ✅

⚠️ **Problema:** Este token expira em 24 horas. Você terá que repetir todo dia.

---

## 🔧 OPÇÃO 2: Usar System User Token (Recomendado - Permanente)

### O que é?

Um **System User Token** é um token permanente que **não expira**, ideal para produção.

### Passo a Passo:

#### 1. Criar System User

1. Acesse **Meta Business Manager**:
   ```
   https://business.facebook.com/
   ```

2. Vá em:
   - **Configurações do negócio**
   - **Usuários** → **Usuários do sistema**
   - Clique em **Adicionar**

3. Preencha:
   ```
   Nome: ConectCRM WhatsApp Bot
   Função: Administrador
   ```

4. Clique em **Criar usuário do sistema**

#### 2. Gerar Token Permanente

1. Clique no usuário criado
2. Clique em **Gerar novo token**
3. Selecione o aplicativo WhatsApp
4. Marque as permissões:
   ```
   ☑ whatsapp_business_management
   ☑ whatsapp_business_messaging
   ☑ business_management
   ```

5. Selecione **Sem expiração** ⏰
6. Clique em **Gerar token**
7. ✅ **COPIE E GUARDE O TOKEN** (não vai poder ver novamente!)

#### 3. Atribuir Assets

1. No System User, vá em **Ativos atribuídos**
2. Clique em **Adicionar ativos**
3. Selecione **Aplicativos**
4. Marque seu aplicativo WhatsApp
5. Permissões: **Controle total**
6. Salvar

#### 4. Atualizar no ConectCRM

1. Acesse: http://localhost:3000
2. **Configurações** → **Integrações** → **WhatsApp**
3. Cole o **System User Token** no campo **Access Token**
4. ✅ Marque **"Ativar este canal"**
5. **SALVAR**

✅ **Vantagem:** Token permanente, nunca expira!

---

## 🔧 OPÇÃO 3: Atualizar via SQL (Emergencial)

Se precisar atualizar rapidamente via banco de dados:

```sql
-- 1. Ver canal atual
SELECT id, nome, ativo, status, configuracao 
FROM canais 
WHERE tipo = 'whatsapp' 
LIMIT 1;

-- 2. Atualizar token (substitua SEU_NOVO_TOKEN)
UPDATE canais 
SET 
  configuracao = jsonb_set(
    configuracao,
    '{credenciais,whatsapp_api_token}',
    '"SEU_NOVO_TOKEN_AQUI"'
  ),
  ativo = true,
  status = 'ATIVO'
WHERE id = '2fe447a9-3547-427e-be9c-e7ef36eca202';

-- 3. Verificar
SELECT 
  configuracao->'credenciais'->>'whatsapp_api_token' as token_preview,
  ativo,
  status
FROM canais 
WHERE id = '2fe447a9-3547-427e-be9c-e7ef36eca202';
```

⚠️ **Atenção:** Substitua `SEU_NOVO_TOKEN_AQUI` pelo token real!

---

## 📋 VERIFICAR SE O TOKEN ESTÁ VÁLIDO

### Teste Manual com cURL

```bash
# Substitua os valores:
PHONE_NUMBER_ID="704423209430762"
ACCESS_TOKEN="EAALQrbLuMHw..."

curl -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Se o token estiver válido:**
```json
{
  "verified_name": "Seu Nome WhatsApp",
  "display_phone_number": "+55 62 99668-9991",
  "quality_rating": "GREEN",
  "id": "704423209430762"
}
```

**Se o token estiver inválido (401):**
```json
{
  "error": {
    "message": "Invalid OAuth access token.",
    "type": "OAuthException",
    "code": 190
  }
}
```

---

## 🔍 ATIVAR O CANAL

**IMPORTANTE:** Mesmo com token válido, o canal precisa estar **ATIVO**!

### Via Frontend:

1. http://localhost:3000
2. **Configurações** → **Integrações** → **WhatsApp**
3. ☑ **Marcar "Ativar este canal"**
4. **SALVAR**

### Via SQL:

```sql
UPDATE canais 
SET 
  ativo = true,
  status = 'ATIVO'
WHERE tipo = 'whatsapp' 
  AND id = '2fe447a9-3547-427e-be9c-e7ef36eca202';
```

---

## ✅ TESTE FINAL

Depois de atualizar o token e ativar o canal:

### 1. Via Frontend

1. Vá em **Configurações** → **Integrações** → **WhatsApp**
2. Clique em **"Testar Mensagem"**
3. Deve retornar: ✅ **"Mensagem enviada com sucesso!"**

### 2. Via Terminal

```powershell
# Verificar se canal está ativo
$env:PGPASSWORD='conectcrm123'
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT id, nome, ativo, status FROM canais WHERE tipo = 'whatsapp';"
```

Deve mostrar:
```
ativo | status
------+--------
  t   | ATIVO
```

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Opção | Validade | Facilidade | Recomendado Para |
|-------|----------|------------|------------------|
| **Temporary Token** | 24 horas ⏰ | ⭐⭐⭐ Fácil | Testes rápidos |
| **System User Token** | Permanente ✅ | ⭐⭐ Médio | **PRODUÇÃO** ✅ |
| **SQL Direto** | Depende do token | ⭐ Difícil | Emergências |

---

## 🎯 RECOMENDAÇÃO

**Para PRODUÇÃO:** Use **System User Token** (Opção 2) ✅  
**Para TESTES:** Use **Temporary Token** (Opção 1) ⚡

---

## 🔗 REFERÊNCIAS

- [Meta Business API - Access Tokens](https://developers.facebook.com/docs/facebook-login/access-tokens)
- [WhatsApp Business API - Authentication](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started)
- [System Users - Meta Business](https://www.facebook.com/business/help/503306463479099)

---

## 📝 CHECKLIST DE RESOLUÇÃO

- [ ] ✅ Gerar novo token (temporário ou permanente)
- [ ] ✅ Atualizar token no frontend
- [ ] ✅ **ATIVAR o canal** (muito importante!)
- [ ] ✅ Salvar configuração
- [ ] ✅ Testar mensagem
- [ ] ✅ Verificar logs do backend
- [ ] ✅ Confirmar mensagem enviada

---

**Problema resolvido?** Execute teste completo com:
```bash
node test-webhook-whatsapp.js
```
