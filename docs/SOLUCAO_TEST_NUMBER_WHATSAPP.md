# 📱 Como Adicionar Número de Teste no WhatsApp Manager

## 🎯 Problema Identificado

Você está usando um **Test Number** da Meta:
- Phone Number ID: `704423209430762`
- Número: `15551597121`
- Status: Test Number (não verificado)

**Limitação**: Só pode enviar mensagens para números previamente cadastrados como "Test Numbers".

---

## ✅ Solução Imediata: Adicionar Número de Teste

### Passo 1: Acessar WhatsApp Manager

1. Acessar: https://business.facebook.com/latest/whatsapp_manager
2. Login com sua conta Facebook Business
3. Selecionar seu App/Projeto

### Passo 2: Adicionar Número de Teste

1. No menu lateral: **"API Setup"** ou **"Configuration"**
2. Procurar seção: **"To"** ou **"Test Phone Numbers"**
3. Clicar em: **"Add Phone Number"** ou **"Manage Phone Numbers"**
4. Adicionar o número: **+55 62 99668-9991** (sem formatação: `5562996689991`)
5. Verificar: WhatsApp enviará código de verificação para esse número
6. Confirmar código recebido

**Após adicionar**: O número `5562996689991` poderá receber mensagens do Test Number.

---

## 🏢 Solução Definitiva: Usar Número Real de Produção

Para produção, você precisa de um **número real verificado**:

### Requisitos

1. **Número WhatsApp Real**: Dedicado para a empresa
2. **WhatsApp Business Account (WABA)**: Conta verificada
3. **Verificação do Número**: Processo de verificação da Meta
4. **Business Verification**: Empresa verificada no Facebook Business

### Passos

1. **Criar WABA Real**:
   - Acessar: https://business.facebook.com
   - Create WhatsApp Business Account
   - Fornecer informações da empresa

2. **Adicionar Número Real**:
   - WhatsApp Manager → Phone Numbers → Add Phone Number
   - Escolher: **"Use an existing phone number"**
   - Inserir número empresarial (ex: `5562999999999`)
   - Verificar via SMS ou chamada

3. **Verificar Negócio**:
   - Business Settings → Security Center
   - Start Verification
   - Enviar documentos (CNPJ, comprovante de endereço)
   - Aguardar aprovação (1-3 dias úteis)

4. **Obter Credenciais de Produção**:
   - Após verificação: Phone Number ID mudará
   - Token permanece o mesmo (mas regenerar é recomendado)
   - Atualizar credenciais no banco de dados

---

## 🔄 Atualizar Banco de Dados (Depois de Adicionar Teste ou Produção)

### Se Adicionou Número de Teste

```sql
-- Nenhuma alteração necessária no banco
-- O Phone Number ID continua o mesmo: 704423209430762
-- Apenas adicione números de teste no WhatsApp Manager
```

**Testar novamente**: Enviar mensagem para `5562996689991` (agora deve funcionar!)

### Se Configurou Número Real

```sql
-- Atualizar com novo Phone Number ID de produção
UPDATE atendimento_canais_configuracao 
SET 
  credenciais = jsonb_set(
    credenciais,
    '{whatsapp_phone_number_id}',
    '"SEU_NOVO_PHONE_NUMBER_ID_AQUI"'  -- Número real da WABA
  ),
  nome = 'WHATSAPP Produção',  -- Renomear para indicar produção
  "updatedAt" = NOW()
WHERE tipo = 'whatsapp_business_api'
  AND credenciais->>'whatsapp_phone_number_id' = '704423209430762';

-- Verificar atualização
SELECT 
  nome,
  credenciais->>'whatsapp_phone_number_id' as phone_id,
  "updatedAt"
FROM atendimento_canais_configuracao
WHERE tipo = 'whatsapp_business_api';
```

---

## 🧪 Testar Após Configuração

### Teste com Número Adicionado

1. Certifique-se que `5562996689991` foi adicionado como test number
2. No chat: Enviar mensagem para esse número
3. Verificar se mensagem chega (sem erro #133010)

**Resultado Esperado**:
```
[WhatsAppSenderService] ✅ Mensagem enviada! ID: wamid.xxx
```

### Teste com Número Real (Produção)

1. Após configurar número real e atualizar banco
2. Enviar mensagem para qualquer número válido
3. Sem limitações de test numbers

**Resultado Esperado**:
```
[WhatsAppSenderService] ✅ Mensagem enviada! ID: wamid.xxx
Quality Rating: GREEN
```

---

## 📊 Comparação: Test vs Produção

| Aspecto | Test Number | Número Real |
|---------|-------------|-------------|
| **Destinatários** | Apenas números cadastrados | Qualquer número válido |
| **Verificação** | Não requerida | Verificação completa |
| **Quality Rating** | UNKNOWN | GREEN/YELLOW/RED |
| **Limites** | 1000 msgs/dia | Variável (tier-based) |
| **Custo** | Gratuito | Pago (conversas) |
| **Uso Recomendado** | Desenvolvimento/Testes | Produção |

---

## 🎯 Recomendação

### Para Desenvolvimento (Agora):
1. ✅ Adicionar `5562996689991` como test number
2. ✅ Testar envio imediatamente
3. ✅ Continuar testes de BUG-003 (WebSocket)

### Para Produção (Depois):
1. 🏢 Criar WABA real com número empresarial
2. 📄 Verificar negócio com documentos
3. 🔄 Atualizar Phone Number ID no banco
4. 🚀 Deploy em produção

---

## 📞 Links Úteis

- **WhatsApp Manager**: https://business.facebook.com/latest/whatsapp_manager
- **API Setup**: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Test Numbers**: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#test-phone-numbers
- **Business Verification**: https://business.facebook.com/overview/verification

---

**Criado**: 11/12/2025 - 14:55  
**Status**: 🎯 Solução identificada - adicionar número de teste  
**Próximo Passo**: Adicionar `5562996689991` no WhatsApp Manager
