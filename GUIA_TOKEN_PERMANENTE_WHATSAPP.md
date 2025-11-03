# 🔑 Guia: Como Gerar Token Permanente do WhatsApp Business API

## 📋 Problema Atual

Erro `401 - Invalid OAuth access token` indica que o token expirou ou é inválido.

**Token temporário** (gerado em "Ferramentas da API") expira em **24 horas**.  
**Token permanente** (gerado em "System Users") **NÃO expira**.

---

## ✅ Solução: Gerar Token Permanente

### 1️⃣ Acessar System Users

🔗 **Link direto**: https://business.facebook.com/settings/system-users

### 2️⃣ Criar ou Usar System User

- Clique em **"Adicionar"** (ou use existente)
- Nome: `ConectCRM System User` (ou qualquer nome)
- Função: **Admin** ou **Employee**

### 3️⃣ Atribuir App WhatsApp

- No System User criado, clique em **"Adicionar ativos"**
- Selecione: **Apps**
- Marque seu **App WhatsApp Business**
- Permissões necessárias:
  - ✅ `whatsapp_business_messaging`
  - ✅ `whatsapp_business_management`

### 4️⃣ Gerar Token Permanente

- Clique em **"Gerar novo token"**
- Selecione seu **App WhatsApp**
- Selecione as **permissões**:
  - ✅ `whatsapp_business_messaging`
  - ✅ `whatsapp_business_management`
- Validade: **Nunca expira** (60 dias ou 90 dias)
- Clique em **"Gerar token"**
- **COPIE O TOKEN** (não será mostrado novamente!)

Token gerado terá formato: `EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🎯 Como Inserir na Tela de Integrações

### Passo a Passo

1. **Abrir sistema**: http://localhost:3000
2. **Menu lateral** → **Configurações** → **Integrações**
3. **Card WhatsApp Business API**
4. **Campo "Access Token"**:
   - Você verá instruções detalhadas
   - Botão **"Gerar Token Permanente"** (atalho direto)
5. **Colar token** gerado no Meta
6. **Preencher** `Phone Number ID` (encontra em: App WhatsApp → Início)
7. **Clicar em "Validar Token"** (verifica se está correto)
8. **Clicar em "Salvar Configuração"**

---

## 🧪 Testar Após Salvar

### 1. Validar Token
- Botão **"Validar Token"** deve mostrar ✅ **Token Válido**

### 2. Enviar Mensagem de Teste
- Seção **"Testar Envio de Mensagem"**
- Digite: `5562996689991` (seu número)
- Clique em **"Enviar Mensagem de Teste"**
- Deve aparecer: ✅ **Mensagem enviada com sucesso!**
- Verifique no celular se chegou

---

## 📂 Arquivos Modificados

### Frontend
- ✅ `frontend-web/src/pages/configuracoes/IntegracoesPage.tsx`
  - Adicionado box de instruções com badge "Permanente"
  - Link direto para System Users
  - Botão de atalho para gerar token
  - Validação visual do token

---

## 🔍 Verificar se Token Está Salvo

Execute no banco de dados:

```sql
SELECT 
  id,
  empresa_id,
  tipo,
  whatsapp_ativo,
  LEFT(whatsapp_api_token, 30) || '...' as token_inicio,
  whatsapp_phone_number_id,
  atualizado_em
FROM atendimento_integracoes_config
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND tipo = 'whatsapp_business_api';
```

---

## 🚨 Troubleshooting

### Erro: "Token inválido" ao validar
- ✅ Verificar se copiou token completo (sem espaços)
- ✅ Verificar se token tem permissões corretas
- ✅ Verificar se Phone Number ID está correto

### Erro: "Cannot parse access token"
- ✅ Token expirou → gerar novo token permanente
- ✅ Token de teste (24h) → usar token de System User

### Mensagem não chega no celular
- ✅ Verificar se número está correto (formato: 5562996689991)
- ✅ Verificar se webhook está configurado
- ✅ Verificar logs do backend (erro 401?)

---

## 🎯 Checklist Final

- [ ] Token permanente gerado no System Users
- [ ] Token colado na tela de Integrações
- [ ] Phone Number ID preenchido
- [ ] Botão "Validar Token" mostra ✅
- [ ] Configuração salva com sucesso
- [ ] Mensagem de teste enviada
- [ ] Mensagem chegou no celular

---

## 📱 Contato para Teste

**Número usado nos testes**: `5562996689991` (Dhonleno)

---

## 🔗 Links Úteis

- **System Users**: https://business.facebook.com/settings/system-users
- **Meta Developers**: https://developers.facebook.com/apps
- **Documentação WhatsApp API**: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Permissões necessárias**: https://developers.facebook.com/docs/whatsapp/business-management-api/permissions

---

**Última atualização**: 22/10/2025 14:55  
**Status**: ✅ Interface atualizada | ⏳ Aguardando geração de token
