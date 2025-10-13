# 🔄 Atualização de Token WhatsApp - Guia Completo

## 🎯 Problema Identificado

O token do WhatsApp Business API estava **expirado** (erro 401 Unauthorized).

### Verificação Realizada:
```
Token atual: EAALQrbLuMHwBPoXEne7QxOP6wuoo9Wk...
Status: ❌ 401 Unauthorized (EXPIRADO)
```

---

## ✅ Correções Aplicadas no Backend

### 1. **CanaisController.criar() - POST /api/atendimento/canais**

**Antes:**
```typescript
const canal = this.canalRepo.create({
  ...dto,  // ⚠️ Podia não salvar configuracao corretamente
  empresaId,
  ativo: false,
});
```

**Depois:**
```typescript
const canal = this.canalRepo.create({
  nome: dto.nome,
  tipo,
  empresaId,
  ativo: false,
  configuracao: dto.configuracao, // ✅ Salva estrutura completa
});

console.log('📝 [CanaisController] Configuracao salva:', JSON.stringify(canal.configuracao, null, 2));
```

### 2. **CanaisController.atualizar() - PUT /api/atendimento/canais/:id**

**Antes:**
```typescript
Object.assign(canal, dto); // ⚠️ Podia não atualizar configuracao
await this.canalRepo.save(canal);
```

**Depois:**
```typescript
// ✅ Atualizar campos explicitamente
if (dto.nome !== undefined) canal.nome = dto.nome;
if (dto.ativo !== undefined) canal.ativo = dto.ativo;
if (dto.configuracao !== undefined) {
  console.log('📝 [CanaisController] Atualizando configuracao:', JSON.stringify(dto.configuracao, null, 2));
  canal.configuracao = dto.configuracao;
}

await this.canalRepo.save(canal);
console.log('✅ [CanaisController] Configuracao atualizada:', JSON.stringify(canal.configuracao, null, 2));
```

---

## 🛠️ Scripts Criados

### 1. **update-whatsapp-token.ps1** ⭐ (RECOMENDADO)

Script PowerShell **interativo** que:
- ✅ Verifica o token atual no banco
- ✅ Solicita o novo token de forma interativa
- ✅ Valida o formato do token (deve começar com EAA)
- ✅ Atualiza o token no banco de dados
- ✅ **Testa o token na API do WhatsApp**
- ✅ Mostra informações da conta (nome, número, qualidade)

**Como usar:**
```powershell
.\update-whatsapp-token.ps1
```

### 2. **update-whatsapp-token.sql**

Script SQL manual com comandos para:
- Verificar token atual
- Atualizar token manualmente
- Verificar atualização

---

## 🎯 Como Atualizar o Token

### **OPÇÃO 1: Script PowerShell (RECOMENDADO) ✅**

```powershell
# Execute no PowerShell:
.\update-whatsapp-token.ps1
```

**O script vai:**
1. Mostrar o token atual (preview)
2. Pedir o novo token
3. Validar o formato
4. Atualizar no banco
5. **Testar na API do WhatsApp**
6. Mostrar informações da conta

---

### **OPÇÃO 2: Interface Web**

1. Acesse: **http://localhost:3000**
2. Vá em: **Configurações > Integrações > WhatsApp**
3. Cole o **novo token** no campo "Token de Acesso"
4. Clique: **"Salvar Configuração"**
5. Teste: **"Enviar Mensagem de Teste"**

**Observação:** Com as correções aplicadas, o token agora será salvo corretamente!

---

### **OPÇÃO 3: SQL Direto**

```powershell
$newToken = "SEU_NOVO_TOKEN_AQUI"
$query = "UPDATE canais SET configuracao = jsonb_set(configuracao, '{credenciais,whatsapp_api_token}', '`"$newToken`"') WHERE tipo = 'whatsapp';"
docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "$query"
```

---

## 📋 Como Gerar Novo Token do WhatsApp

### **Token Temporário (Rápido, mas expira em 24-60 dias) ⚠️**

1. Acesse: https://business.facebook.com/settings/whatsapp-business-accounts
2. Selecione sua conta WhatsApp Business
3. Clique em **"API Setup"**
4. Na seção **"Temporary Access Token"**:
   - Clique em **"Generate Token"**
   - Selecione permissões: **whatsapp_business_messaging**
   - Copie o token (começa com `EAA...`)

---

### **Token Permanente (RECOMENDADO! Nunca expira) ✅**

1. **Acesse System Users:**
   - URL: https://business.facebook.com/settings/system-users

2. **Crie um System User:**
   - Nome: `ConectCRM API`
   - Função: **Admin** ou **Desenvolvedor**

3. **Adicione Ativos:**
   - Clique em **"Adicionar Ativos"**
   - Selecione: **WhatsApp Business Account**
   - Permita **controle total**

4. **Gere Token Permanente:**
   - Clique em **"Gerar novo token"**
   - Selecione o **App** conectado ao WhatsApp
   - **Permissões necessárias:**
     - ✅ `whatsapp_business_messaging`
     - ✅ `whatsapp_business_management`
   - **Duração:** Selecione **"Nunca expira"** ✅

5. **Copie e guarde o token** em local seguro

---

## 🧪 Como Testar o Novo Token

### **1. Teste via Script (Automático) ✅**

```powershell
.\update-whatsapp-token.ps1
```

O script já testa automaticamente!

---

### **2. Teste via Interface Web**

1. Acesse: **http://localhost:3000**
2. Vá em: **Configurações > Integrações > WhatsApp**
3. Clique em: **"Enviar Mensagem de Teste"**
4. Digite um número de teste
5. Clique em **"Enviar"**

**Resultado esperado:** ✅ Mensagem enviada com sucesso!

---

### **3. Teste Manual via PowerShell**

```powershell
$token = "SEU_TOKEN_AQUI"
$phoneId = "SEU_PHONE_NUMBER_ID"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-WebRequest `
    -Uri "https://graph.facebook.com/v21.0/$phoneId?fields=display_phone_number,verified_name,quality_rating" `
    -Headers $headers `
    -Method GET
```

**Resultado esperado:**
```json
{
  "display_phone_number": "+55 62 9966-8999",
  "verified_name": "Conect CRM",
  "quality_rating": "GREEN",
  "id": "704423209430762"
}
```

---

## 🔍 Logs de Debug Adicionados

Com as correções aplicadas, o backend agora mostra logs detalhados:

### **POST /canais (Criar canal)**
```
🔍 [CanaisController] POST /atendimento/canais chamado
🔍 [CanaisController] Tipo: whatsapp
🔍 [CanaisController] DTO: { nome: "WHATSAPP Principal", tipo: "whatsapp", configuracao: {...} }
📝 [CanaisController] Criando canal normal: whatsapp
📝 [CanaisController] Configuracao recebida: {
  "credenciais": {
    "whatsapp_api_token": "EAA...",
    "whatsapp_phone_number_id": "704423209430762",
    ...
  }
}
✅ [CanaisController] Canal salvo com ID: ba2cd64e-09e6-4849-991f-b1d5cdafc500
✅ [CanaisController] Configuracao salva: {...}
```

### **PUT /canais/:id (Atualizar canal)**
```
🔍 [CanaisController] PUT /atendimento/canais/:id chamado
🔍 [CanaisController] ID: ba2cd64e-09e6-4849-991f-b1d5cdafc500
🔍 [CanaisController] DTO: {...}
📝 [CanaisController] Atualizando configuracao: {...}
✅ [CanaisController] Canal atualizado
✅ [CanaisController] Configuracao atualizada: {...}
```

---

## ⚠️ Estrutura Esperada no Banco

### **Tabela: canais**

```json
{
  "id": "ba2cd64e-09e6-4849-991f-b1d5cdafc500",
  "tipo": "whatsapp",
  "nome": "WHATSAPP Principal",
  "ativo": false,
  "configuracao": {
    "credenciais": {
      "whatsapp_api_token": "EAA...",
      "whatsapp_phone_number_id": "704423209430762",
      "whatsapp_business_account_id": "1922786558561358",
      "whatsapp_webhook_verify_token": "conectcrm_webhook_token_123"
    }
  }
}
```

### **Campo importante:** `configuracao.credenciais.whatsapp_api_token`

Todos os serviços buscam o token neste caminho:
- `ValidacaoIntegracoesService`
- `WhatsAppSenderService`
- `WhatsAppBusinessApiAdapter`

---

## 🚀 Próximos Passos

### **1. Reiniciar o Backend** ⚠️

Para aplicar as correções:

```powershell
cd backend
npm run start:dev
```

### **2. Atualizar o Token**

Execute o script:

```powershell
.\update-whatsapp-token.ps1
```

### **3. Testar Envio de Mensagem**

Via interface:
1. http://localhost:3000
2. Configurações > Integrações > WhatsApp
3. "Enviar Mensagem de Teste"

### **4. Verificar Logs**

No terminal do backend, você verá:
```
✅ [CanaisController] Configuracao salva
🧪 [ValidacaoIntegracoesService] Testando WhatsApp...
✅ Mensagem enviada com sucesso!
```

---

## 📞 Estrutura dos Dados

### **Frontend → Backend (POST /canais)**

```json
{
  "nome": "WHATSAPP Principal",
  "tipo": "whatsapp",
  "configuracao": {
    "credenciais": {
      "whatsapp_phone_number_id": "704423209430762",
      "whatsapp_api_token": "EAA...",
      "whatsapp_webhook_verify_token": "conectcrm_webhook_token_123",
      "whatsapp_business_account_id": "1922786558561358"
    }
  }
}
```

### **Backend → Banco de Dados**

```sql
INSERT INTO canais (id, tipo, nome, ativo, configuracao)
VALUES (
  uuid_generate_v4(),
  'whatsapp',
  'WHATSAPP Principal',
  false,
  '{"credenciais": {"whatsapp_api_token": "EAA...", ...}}'::jsonb
);
```

---

## 🔧 Troubleshooting

### **Erro: "Token inválido ou expirado"**

**Solução:**
1. Gere um novo token (preferencialmente permanente)
2. Execute: `.\update-whatsapp-token.ps1`
3. Teste na API do WhatsApp (o script faz isso automaticamente)

---

### **Erro: "Configuração não foi salva"**

**Solução:**
1. Reinicie o backend (para aplicar as correções)
2. Verifique os logs do backend (`npm run start:dev`)
3. Procure por: `✅ [CanaisController] Configuracao salva`

---

### **Erro: "Token salvo mas não está funcionando"**

**Verificações:**

1. **Token está no lugar certo?**
   ```sql
   SELECT configuracao->'credenciais'->>'whatsapp_api_token' 
   FROM canais 
   WHERE tipo = 'whatsapp';
   ```

2. **Token é válido?**
   ```powershell
   # Execute o script para testar
   .\update-whatsapp-token.ps1
   ```

3. **Backend foi reiniciado?**
   ```powershell
   cd backend
   npm run start:dev
   ```

---

## ✅ Checklist de Validação

- [ ] Backend reiniciado com correções aplicadas
- [ ] Novo token gerado (preferencialmente permanente)
- [ ] Token atualizado via script ou interface
- [ ] Token testado na API do WhatsApp (status 200 OK)
- [ ] Mensagem de teste enviada com sucesso
- [ ] Logs do backend mostram configuração salva
- [ ] Webhook configurado e funcionando

---

## 📚 Referências

- **Meta Business Manager:** https://business.facebook.com/settings/whatsapp-business-accounts
- **System Users:** https://business.facebook.com/settings/system-users
- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp/business-management-api
- **Token Permanente:** https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

---

## 🎉 Resumo

1. ✅ **Correções aplicadas** no CanaisController (POST e PUT)
2. ✅ **Scripts criados** para atualização fácil do token
3. ✅ **Logs adicionados** para debug facilitado
4. ✅ **Documentação completa** criada
5. ⏳ **Reiniciar backend** e atualizar token (próximo passo)

---

**Criado em:** 11/10/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
