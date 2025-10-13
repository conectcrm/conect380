# 📱 Como Adicionar Número à Lista de Permissão (Whitelist)

## 🔴 PROBLEMA ATUAL

```
Erro: (#131030) Recipient phone number not in allowed list
```

**Causa**: Sua app WhatsApp está em **modo DESENVOLVIMENTO** (Development Mode).

**Solução**: Adicionar número `+55 62 99668-9991` à lista de permissão.

---

## ✅ PASSO A PASSO

### **1️⃣ Acessar Meta for Developers**

```
URL: https://developers.facebook.com/apps
```

1. Faça login com sua conta Facebook/Meta
2. Selecione sua app WhatsApp da lista

---

### **2️⃣ Navegar até Configuração WhatsApp**

**Opção A** - API Setup:
```
Menu lateral → WhatsApp → API Setup
```

**Opção B** - Configuration:
```
Menu lateral → WhatsApp → Configuration
```

---

### **3️⃣ Adicionar Número de Teste**

Procure a seção:
- **"Phone numbers"**
- **"To field phone numbers"**
- **"Test phone numbers"**
- **"Recipient phone numbers"**

Clique em:
- **"Add phone number"** ou
- **"Manage phone numbers"** ou
- **"Add recipient"**

---

### **4️⃣ Preencher Formulário**

```
Campo: Phone Number
Valor: +5562996689991

Ou formato alternativo:
Código País: +55
Número: 62996689991
```

**⚠️ IMPORTANTE**: 
- Sempre use código do país (`+55` para Brasil)
- Remova espaços, parênteses, hífens
- Formato final: `+5562996689991` (sem espaços)

---

### **5️⃣ Verificar Número**

1. Clique em **"Send code"** ou **"Verify"**
2. Você receberá um **código de 6 dígitos** no WhatsApp (`+55 62 99668-9991`)
3. Digite o código na página do Meta
4. Clique em **"Verify"** ou **"Confirm"**

---

### **6️⃣ Confirmar Adição**

✅ Número aparecerá na lista de números permitidos:
```
✓ +5562996689991
  Status: Verified
  Added: [data atual]
```

---

## 🧪 TESTAR

Após adicionar o número:

1. **Aguarde 1-2 minutos** (propagação das configurações)
2. Volte ao sistema: http://localhost:3000/atendimento
3. Selecione ticket do **Dhon Freitas** (`+55 62 99668-9991`)
4. Envie mensagem: `Teste após adicionar à whitelist!`
5. ✅ **Deve funcionar agora!**

---

## 📊 LIMITE DE NÚMEROS

**Modo Desenvolvimento**:
- ✅ Até **5 números** na whitelist
- ✅ Gratuito
- ⚠️ Apenas para testes

**Modo Produção** (após Business Verification):
- ✅ **Ilimitado** - qualquer número do mundo
- ✅ Mensagens para clientes reais
- ⚠️ Requer verificação da empresa

---

## 🔄 ADICIONAR MAIS NÚMEROS (opcional)

Se precisar testar com outros números:

1. Repita passos 3-6 para cada número
2. Máximo de **5 números** em modo desenvolvimento
3. Todos precisam ser verificados via código WhatsApp

**Exemplos**:
```
+5511999998888  (São Paulo)
+5521988887777  (Rio de Janeiro)
+5562996689991  (Goiânia) ← Já adicionado
```

---

## 🚀 IR PARA PRODUÇÃO (futuro)

Quando estiver pronto para **lançar oficialmente**:

### **Requisitos**:
1. ✅ Business Manager verificado
2. ✅ Empresa registrada no Meta
3. ✅ Documentos da empresa (CNPJ, etc.)
4. ✅ App testado completamente
5. ✅ Termos de serviço aceitos

### **Processo**:
```
1. Meta for Developers → Sua App
2. WhatsApp → Configuration
3. Procurar: "Request Production Access" ou "Go Live"
4. Preencher formulário de solicitação
5. Aguardar aprovação (1-7 dias)
```

### **Benefícios Produção**:
- ✅ Enviar para **qualquer número** do mundo
- ✅ Sem limite de destinatários
- ✅ Taxa de mensagens mais alta
- ✅ Suporte oficial do Meta

---

## 📞 NÚMEROS ATUAIS NO SISTEMA

Tickets existentes no banco:
```
Ticket #1: Maria Silva     → +55 11 99999-9999 (não está na whitelist)
Ticket #2: Dhon Freitas    → +55 62 99668-9991 (adicionar à whitelist!)
```

**Recomendação**: Adicione o número do **Ticket #2** (seu número) para testar agora!

---

## 🆘 TROUBLESHOOTING

### **Erro persiste após adicionar número?**

1. ✅ Verificar formato: `+5562996689991` (sem espaços)
2. ✅ Aguardar 2-3 minutos (cache do Meta)
3. ✅ Confirmar que o número foi **verificado** (código WhatsApp)
4. ✅ Verificar status na lista: "Verified" ✅

### **Não recebeu código de verificação?**

1. ✅ Confirmar que o WhatsApp está instalado no número
2. ✅ Verificar se tem acesso à internet
3. ✅ Tentar reenviar código: "Resend code"
4. ✅ Aguardar até 5 minutos

### **Erro ao adicionar número?**

```
Erro: "This phone number is already registered"
→ Número já usado em outra app WhatsApp
→ Remova de outra app ou use número diferente
```

---

## 📚 DOCUMENTAÇÃO OFICIAL

WhatsApp Business API - Development Mode:
```
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#phone-numbers
```

Business Verification:
```
https://www.facebook.com/business/help/159334372093366
```

---

## ✅ CHECKLIST

- [ ] Acessei https://developers.facebook.com/apps
- [ ] Selecionei minha app WhatsApp
- [ ] Naveguei até WhatsApp → API Setup
- [ ] Cliquei em "Add phone number"
- [ ] Adicionei: `+5562996689991`
- [ ] Recebi código no WhatsApp
- [ ] Verifiquei o código
- [ ] Número aparece como "Verified"
- [ ] Aguardei 2 minutos
- [ ] Testei envio novamente → ✅ SUCESSO!

---

**🎉 Depois de adicionar à whitelist, o sistema funcionará 100%!**
