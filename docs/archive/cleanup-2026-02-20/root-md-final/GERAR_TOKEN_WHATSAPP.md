# 🔑 Como Gerar Token Permanente do WhatsApp Business API

**Data**: 12 de outubro de 2025  
**Problema**: Token expirado causando erro 401 ao enviar mensagens  
**Status**: ⚠️ Ação necessária do usuário

---

## 🐛 **ERRO ATUAL**

```
❌ POST /api/atendimento/webhooks/whatsapp/:empresaId/enviar → 500
❌ Causa: Request failed with status code 401
❌ Motivo: Token WhatsApp expirado ou inválido
```

---

## 📋 **PASSO A PASSO: GERAR NOVO TOKEN**

### **1. Acessar Meta Developer Console**

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta Meta
3. Vá para: **Meus Apps** → Selecione seu app WhatsApp

### **2. Navegar até WhatsApp**

1. No menu lateral, clique em: **WhatsApp** → **API Setup**
2. Ou acesse: **WhatsApp** → **Getting Started**

### **3. Gerar Token Permanente**

#### **Opção A: Token Temporário (24h) - NÃO RECOMENDADO**
```
• Disponível na seção "Temporary access token"
• Expira em 24 horas
• Apenas para testes
```

#### **Opção B: Token Permanente (System User) - RECOMENDADO** ✅

1. **Criar System User**:
   - Vá para: **Configurações do App** → **Usuários do Sistema**
   - Clique em: **Adicionar Usuário do Sistema**
   - Nome: "ConectCRM WhatsApp Bot"
   - Role: **Admin**

2. **Gerar Token**:
   - Clique no usuário criado
   - Clique em: **Gerar Novo Token**
   - Selecione permissões:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
     - ✅ `business_management`
   - Clique em: **Gerar Token**
   - **⚠️ COPIE O TOKEN IMEDIATAMENTE** (não será mostrado novamente)

3. **Atribuir Ativos**:
   - Ainda na página do System User
   - Clique em: **Atribuir Ativos**
   - Selecione: **Contas do WhatsApp Business**
   - Marque seu número de WhatsApp
   - Permissões: **Gerenciar conta do WhatsApp Business**
   - Salvar

### **4. Copiar Informações Necessárias**

Você precisará de 3 informações:

```
✅ Token de Acesso: EAAxxxxxxxxxxxxxxxxxx (long string)
✅ Phone Number ID: 7044xxxxxxxxxx
✅ WhatsApp Business Account ID: 1922xxxxxxxxxx
```

**Onde encontrar**:
- **Token**: Acabou de gerar no passo 3
- **Phone Number ID**: WhatsApp → API Setup → "Phone number ID"
- **Account ID**: WhatsApp → API Setup → "WhatsApp Business Account ID"

---

## 🔄 **ATUALIZAR TOKEN NO SISTEMA**

### **Opção 1: Via Interface Web** (Recomendado)

1. **Acesse**: http://localhost:3000/configuracoes/integracoes

2. **Localize**: Card do WhatsApp Business API

3. **Clique**: Botão "Editar" ou ícone de configuração

4. **Preencha** os campos:
   ```
   Nome: WHATSAPP Principal (ou qualquer nome)
   Token de Acesso: [Cole o token gerado]
   Phone Number ID: [Cole o ID do telefone]
   Webhook Verify Token: [Token de verificação do webhook]
   ```

5. **Clique**: "Salvar" ou "Atualizar"

6. **Aguarde**: Mensagem de sucesso

### **Opção 2: Via SQL Direto** (Avançado)

```sql
-- ATENÇÃO: Substitua os valores entre < >

UPDATE atendimento_integracoes_config
SET credenciais = jsonb_set(
  credenciais,
  '{whatsapp_api_token}',
  '"<SEU_TOKEN_AQUI>"'
)
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND tipo = 'whatsapp_business_api'
  AND ativo = true;

-- Verificar atualização
SELECT 
  id,
  tipo,
  credenciais->>'whatsapp_api_token' as token_substring,
  ativo,
  atualizado_em
FROM atendimento_integracoes_config
WHERE tipo = 'whatsapp_business_api';
```

---

## ✅ **VALIDAR TOKEN ATUALIZADO**

### **Teste 1: Via Script**

Execute no terminal:
```bash
cd C:\Projetos\conectcrm
node test-enviar-mensagem.js
```

**Esperado**:
```
✅ Sucesso!
Resposta: {
  "success": true,
  "messageId": "wamid.xxx..."
}
```

### **Teste 2: Via Interface**

1. Acesse: http://localhost:3000/atendimento
2. Selecione: Ticket #2
3. Digite: "Teste novo token"
4. Envie

**Esperado**:
- ✅ Sem erro 500
- ✅ Mensagem enviada
- ✅ Aparece no WhatsApp

---

## 🔍 **TROUBLESHOOTING**

### **Erro: Token ainda inválido após atualizar**

**Possíveis causas**:
1. Token copiado incorretamente (espaços, quebras de linha)
2. Permissões insuficientes no System User
3. Ativos não atribuídos ao System User
4. Token de um app diferente

**Solução**:
- Gere novo token
- Verifique permissões
- Confirme atribuição de ativos
- Copie token novamente (sem espaços)

### **Erro: Phone Number ID incorreto**

**Sintoma**: Erro 400 ou "phone number not found"

**Solução**:
- Confirme Phone Number ID na Meta Console
- Verifique se o número está ativo
- Certifique-se de usar o ID correto (não o número de telefone)

### **Erro: Permissões negadas**

**Sintoma**: Erro 403 Forbidden

**Solução**:
- Adicione permissões ao System User:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
- Reative o token
- Atribua conta WhatsApp ao System User

---

## 📊 **CHECKLIST DE VERIFICAÇÃO**

Antes de reportar problema:

- [ ] Token gerado via System User (não temporário)
- [ ] Permissões corretas selecionadas
- [ ] Ativos atribuídos ao System User
- [ ] Token copiado completamente (sem espaços/quebras)
- [ ] Phone Number ID correto
- [ ] Token atualizado no banco de dados
- [ ] Backend reiniciado (se necessário)
- [ ] Teste via script executado
- [ ] Teste via interface realizado

---

## 🔗 **LINKS ÚTEIS**

- **Meta Developer Console**: https://developers.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **System User Setup**: https://developers.facebook.com/docs/development/create-an-app/system-user-access-token
- **Permissions Guide**: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started

---

## 🎯 **PRÓXIMO PASSO**

1. ⚠️ **Gerar novo token** na Meta Developer Console
2. ⚠️ **Atualizar token** no sistema (via /configuracoes/integracoes)
3. ✅ **Testar envio** novamente

**Tempo estimado**: 5-10 minutos

---

## 📝 **NOTAS IMPORTANTES**

### **Sobre Tokens Temporários**
- ❌ Expiram em 24 horas
- ❌ Não são adequados para produção
- ✅ Apenas para testes iniciais

### **Sobre System User Tokens**
- ✅ Não expiram (permanentes)
- ✅ Adequados para produção
- ✅ Podem ser revogados/regenerados
- ⚠️ Devem ser armazenados com segurança

### **Segurança**
- 🔒 Nunca compartilhe seu token publicamente
- 🔒 Não commite tokens no Git
- 🔒 Use variáveis de ambiente em produção
- 🔒 Revogue tokens comprometidos imediatamente

---

## ✅ **CONCLUSÃO**

O erro 401 é causado por token expirado. A solução é gerar um novo token permanente via System User na Meta Developer Console e atualizar no sistema.

**Status atual**: Aguardando ação do usuário para gerar novo token.
