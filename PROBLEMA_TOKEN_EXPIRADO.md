# 🔴 Problema: Token WhatsApp Expirado

**Data**: 12 de outubro de 2025, 16:36  
**Status**: ⚠️ **AMBOS OS TOKENS NO BANCO ESTÃO EXPIRADOS**

---

## 📊 Diagnóstico Completo

### 1️⃣ Tokens Encontrados no Banco de Dados

```
🔑 Token JSONB (credenciais):
   • Tamanho: 241 caracteres
   • Preview: EAALQrbLuMHwBPuHhWZB...77qfmZCgTnvSrAJQZDZD
   • Status: ❌ EXPIRADO (Erro 401)

🔑 Token Coluna (whatsapp_api_token):
   • Tamanho: 212 caracteres  
   • Preview: EAALQrbLuMHwBPs3ZAt6...xMrZBSYj0ZCGZCcUaJ5I
   • Status: ❌ EXPIRADO (Erro 401)
```

### 2️⃣ Testes Realizados

**Teste 1**: Validação direta com WhatsApp API
```bash
node test-validar-token-banco.js
```
**Resultado**: AMBOS os tokens retornam 401 Unauthorized ❌

**Teste 2**: Envio de mensagem pela página de atendimento
```
POST /api/atendimento/webhooks/whatsapp/:empresaId/enviar
```
**Resultado**: Erro 500 → 401 Unauthorized ❌

### 3️⃣ Causa Raiz

- User salvou token pela tela de integração
- Token salvo no banco **já estava expirado** ou **expirou depois**
- Backend busca token do banco (campo JSONB `credenciais`)
- WhatsApp API rejeita token com 401 Unauthorized

---

## 🔧 Solução Definitiva

### Passo 1: Gerar Token NOVO no Meta Business Suite

1. **Acesse**: https://business.facebook.com/settings
2. **Navegue**:
   - Selecione sua conta WhatsApp Business
   - Menu lateral: **System Users** (Usuários do Sistema)
   - Selecione usuário existente OU crie novo
3. **Gerar Token**:
   - Botão: **Generate New Token**
   - App: Selecione seu app WhatsApp Business
   - Permissões (marque AMBAS):
     - ✅ `whatsapp_business_messaging`
     - ✅ `whatsapp_business_management`
   - Expiração: **Never Expire** (recomendado) ou 60 dias
4. **Copiar**: Token começa com `EAAL...` (~241 caracteres)

### Passo 2: Salvar Token no Sistema

1. **Acesse**: http://localhost:3000/configuracoes/integracoes
2. **Localize**: Card "WhatsApp Business API"
3. **Cole**: Token novo no campo "API Token"
4. **⚠️ CRÍTICO**: Clique em **"Salvar"** ou **"Atualizar Configuração"**
   - NÃO apenas teste!
   - Aguarde toast de sucesso: "✅ Configuração salva com sucesso"

### Passo 3: Validar Token Salvo

Execute o script de validação:
```bash
cd C:\Projetos\conectcrm
node test-validar-token-banco.js
```

**Resultado Esperado**:
```
✅ TOKEN VÁLIDO!
📱 Phone Number verificado com sucesso
📞 Número: +55 62 9966-89991
👤 Nome: Seu Nome Verificado
```

### Passo 4: Testar Envio de Mensagem

1. **Acesse**: http://localhost:3000/atendimento
2. **Selecione**: Ticket #2 (Dhon Freitas)
3. **Digite**: "Teste com token novo"
4. **Clique**: Enviar

**Resultado Esperado**:
- ✅ Mensagem aparece no chat
- ✅ Chega no WhatsApp do celular
- ✅ Backend log: "✅ Mensagem enviada com sucesso!"

---

## 🎯 Scripts de Teste Criados

1. **`test-verificar-token-banco.js`**: Mostra tokens salvos no banco
2. **`test-validar-token-banco.js`**: Valida tokens direto na API WhatsApp
3. **`test-atendimento-envio.js`**: Simula envio pela página de atendimento
4. **`reiniciar-backend.ps1`**: Reinicia backend automaticamente

---

## 📋 Checklist de Resolução

- [ ] Token novo gerado no Meta Business Suite
- [ ] Token salvo pela tela de integração (botão "Salvar")
- [ ] Script de validação executado (test-validar-token-banco.js)
- [ ] Token validado com sucesso (sem 401)
- [ ] Backend reiniciado (se necessário)
- [ ] Mensagem enviada pela página de atendimento
- [ ] Mensagem chegou no WhatsApp

---

## 🔍 Logs de Debug Adicionados

Arquivo modificado: `backend/src/modules/atendimento/services/whatsapp-sender.service.ts`

Logs adicionados (após reiniciar backend):
```
🔍 DEBUG: Configuração encontrada: [UUID]
🔍 DEBUG: Campo credenciais existe? true
🔍 DEBUG: Token presente? true
🔍 DEBUG: Token (241 chars): EAALQrb...ZDZD
🔍 DEBUG: Phone ID: 704423209430762
```

---

## 📚 Documentação Relacionada

- `GERAR_TOKEN_WHATSAPP.md` - Guia completo para gerar token
- `SISTEMA_WHATSAPP_CONCLUIDO.md` - Visão geral do sistema
- `DIFERENCA_TESTE_VS_PRODUCAO.md` - Diferença entre telas

---

**Próxima Ação**: Gerar token novo no Meta Business Suite e salvar no sistema.
