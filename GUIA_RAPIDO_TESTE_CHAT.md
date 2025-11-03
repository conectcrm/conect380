# ⚡ GUIA RÁPIDO: Testar Chat com Envio Real

## 🎯 **OBJETIVO**
Validar que mensagens enviadas pelo chat chegam no WhatsApp do cliente.

---

## 🚀 **TESTE RÁPIDO (5 minutos)**

### **1. Iniciar Backend**
```powershell
cd C:\Projetos\conectcrm\backend
npm run start:dev
```
✅ Aguardar: `Nest application successfully started`

### **2. Iniciar Frontend**
```powershell
cd C:\Projetos\conectcrm\frontend-web
npm start
```
✅ Acessar: http://localhost:3000/atendimento

### **3. Enviar Mensagem de Teste**
**Opção A - Via Webhook (recomendado):**
- Enviar mensagem do seu celular para o número WhatsApp Business
- Sistema cria ticket automaticamente
- Responder pelo chat

**Opção B - Criar ticket manualmente:**
```sql
-- Pegar ID do canal WhatsApp
SELECT id FROM atendimento_canais WHERE tipo = 'whatsapp' LIMIT 1;

-- Criar ticket (substituir IDs)
INSERT INTO atendimento_tickets (
  id, numero, assunto, status, prioridade,
  canal_id, empresa_id, contato_telefone, contato_nome,
  data_abertura, created_at, updated_at
) VALUES (
  gen_random_uuid(), 1001, 'Teste Chat', 'ABERTO', 'MEDIA',
  '<CANAL_ID>', '<EMPRESA_ID>', '5511999887766', 'Teste',
  NOW(), NOW(), NOW()
);
```

### **4. Enviar no Chat**
1. Abrir ticket na interface
2. Digitar: "Teste de envio via chat"
3. Enviar (Enter)

### **5. Verificar**
✅ **Backend deve logar:**
```
📤 Enviando mensagem para ticket...
📱 Canal WhatsApp detectado, enviando...
✅ Mensagem enviada via WhatsApp: wamid.xxx
```

✅ **WhatsApp deve receber:**
Mensagem aparece na conversa do cliente

---

## ⚠️ **PROBLEMAS COMUNS**

### ❌ "Credenciais incompletas"
**Solução:** Rodar script de configuração
```powershell
.\atualizar-token-whatsapp.ps1
```

### ❌ "Recipient not in allowed list"
**Solução:** Número não está na whitelist do sandbox
- Adicionar em: https://developers.facebook.com/apps/
- WhatsApp → Configurações → Números de teste

### ❌ Mensagem salva mas não envia
**Verificar:**
```sql
-- Ticket tem canal?
SELECT canal_id FROM atendimento_tickets WHERE id = 'SEU_ID';

-- Canal é WhatsApp?
SELECT tipo FROM atendimento_canais WHERE id = 'CANAL_ID';
```

---

## ✅ **SUCESSO!**
Se mensagem chegou no WhatsApp:
- ✅ Integração funcionando
- ✅ Chat apto para atendimento real
- ✅ Pronto para produção (após configurar webhook público)

---

**📚 Documentação completa:** `CHAT_ENVIO_REAL_IMPLEMENTADO.md`
