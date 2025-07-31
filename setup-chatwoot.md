# 🚀 Setup Rápido do Chatwoot para WhatsApp

## 📋 **PASSO A PASSO PARA CONFIGURAR CHATWOOT**

### **1. Instalação Docker (Mais Simples)**

```bash
# Clonar Chatwoot
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot

# Configurar variáveis
cp .env.example .env

# Executar com Docker
docker-compose up -d

# Aguardar inicialização (2-3 minutos)
docker-compose logs -f
```

### **2. Acesso Inicial**
- URL: http://localhost:3000
- Criar conta admin na primeira vez
- Configurar empresa/organização

### **3. Configurar WhatsApp**

#### **Opção A: WhatsApp Cloud API (Oficial Meta)**
1. Ir em `Settings > Inboxes > Add Inbox`
2. Escolher "WhatsApp"
3. Selecionar "WhatsApp Cloud API"
4. Seguir wizard:
   - Conectar Facebook Business
   - Configurar número de telefone
   - Obter tokens de acesso

#### **Opção B: Provedor 360Dialog**
1. Criar conta em https://hub.360dialog.com
2. Obter Partner ID e API Key
3. No Chatwoot:
   - Provider: 360Dialog
   - Partner ID: seu_partner_id
   - API Key: sua_api_key

### **4. Obter Tokens para Integração**

1. **User Access Token:**
   - Ir em `Profile Settings > Access Token`
   - Gerar novo token
   - Copiar o token

2. **Account ID:**
   - URL da conta: `/app/accounts/{ACCOUNT_ID}`
   - Anotar o número do Account ID

3. **Inbox ID:**
   - Ir em `Settings > Inboxes`
   - Clicar na inbox do WhatsApp
   - URL: `/app/accounts/{ACCOUNT_ID}/settings/inboxes/{INBOX_ID}`
   - Anotar o Inbox ID

### **5. Configurar no ConectCRM**

Editar `backend/.env`:
```env
CHATWOOT_BASE_URL=http://localhost:3000
CHATWOOT_ACCESS_TOKEN=seu_user_token_aqui
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=id_da_inbox_whatsapp
```

### **6. Testar Conexão**

```bash
# Reiniciar backend
cd backend
npm run start:dev

# Testar no frontend
# Ir em qualquer proposta > Botão WhatsApp > Verificar se Chatwoot conecta
```

## 🎯 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Chatwoot rodando em localhost:3000
- [ ] Conta admin criada
- [ ] Inbox WhatsApp configurada
- [ ] User Access Token obtido
- [ ] Account ID e Inbox ID anotados
- [ ] Variáveis .env configuradas
- [ ] Backend reiniciado
- [ ] Teste de envio funcionando

## 🆘 **TROUBLESHOOTING**

### **Erro de Conexão:**
- Verificar se Chatwoot está rodando
- Checar URL base (http://localhost:3000)
- Validar Access Token

### **Erro de WhatsApp:**
- Verificar configuração da Inbox
- Checar se número está validado
- Confirmar API tokens do WhatsApp

### **Erro de Permissão:**
- Token deve ter permissões de agent ou admin
- Account ID deve estar correto

## 🌟 **VANTAGENS DO CHATWOOT**

✅ **Interface profissional** - Dashboard completo
✅ **Multi-agente** - Equipe pode atender junto
✅ **Histórico completo** - Todas as conversas salvas
✅ **Multi-canal** - WhatsApp + Email + Chat + FB
✅ **Analytics** - Relatórios de performance
✅ **Automações** - Respostas automáticas
✅ **API completa** - Integração total
✅ **Gratuito** - Open source sem custos

---

**🎉 RESULTADO FINAL:**
Sistema profissional de atendimento com envio automático de propostas por WhatsApp!
