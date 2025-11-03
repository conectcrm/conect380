# 🧪 Guia de Teste - Correção UUID Webhook

## ⚡ Teste Rápido (2 minutos)

### Passo 1: Enviar Mensagem WhatsApp
📱 Envie qualquer mensagem do seu celular **556296689991** para o número WhatsApp do ConectCRM

**Exemplo**:
```
Olá, testando webhook!
```

### Passo 2: Verificar Logs do Backend
Abra a janela do PowerShell onde o backend está rodando e procure por:

#### ✅ LOGS DE SUCESSO (esperados):
```
[Nest] LOG 📩 Webhook recebido - Empresa: f47ac10b-58cc-4372-a567-0e02b2c3d479
[Nest] LOG 🔍 Phone Number ID detectado: 704423209430762
[Nest] LOG ✅ Nova mensagem recebida
[Nest] LOG De: 556296689991
[Nest] LOG Tipo: text
[Nest] LOG Conteúdo: Olá, testando webhook!
```

#### ❌ LOGS DE ERRO (NÃO devem aparecer):
```
ERROR: invalid input syntax for type uuid: "default"  ❌ NÃO DEVE APARECER
```

---

## 🔍 Teste Detalhado (5 minutos)

### 1. Teste de Conectividade Backend

```powershell
# Verificar se backend está online
Invoke-WebRequest -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp?hub.mode=test&hub.verify_token=teste&hub.challenge=123" -Method GET

# Esperado: 403 Forbidden (token inválido, mas endpoint respondendo)
```

### 2. Enviar Mensagem de Teste

**Do celular 556296689991**, envie:
```
TESTE UUID
```

### 3. Verificar Banco de Dados

```powershell
# Conectar ao PostgreSQL
docker exec -it postgres-crm psql -U postgres -d conectcrm_db

# Verificar se integração está configurada
SELECT 
  empresa_id,
  tipo,
  ativo,
  configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id
FROM atendimento_integracoes_config
WHERE tipo = 'whatsapp_business_api';

# Esperado:
# empresa_id: f47ac10b-58cc-4372-a567-0e02b2c3d479
# tipo: whatsapp_business_api
# ativo: true
# phone_id: 704423209430762
```

### 4. Verificar Canal Ativo

```sql
SELECT 
  id,
  nome,
  tipo,
  ativo,
  status,
  configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id
FROM canais
WHERE tipo = 'whatsapp' AND ativo = true;

# Esperado:
# id: df104dd2-3b8d-42cf-a60f-8a43e54e7520
# nome: WHATSAPP Principal
# tipo: whatsapp
# ativo: true
# status: ATIVO
# phone_id: 704423209430762
```

---

## 📊 Cenários de Teste

### Cenário 1: Mensagem de Texto Simples
**Enviar**: `Olá`

**Esperado**:
- ✅ Webhook recebe
- ✅ Mensagem parseada
- ✅ Consulta integração (UUID correto)
- ✅ Marca como lida
- ✅ Verifica IA

### Cenário 2: Mensagem com Emoji
**Enviar**: `😀 Teste com emoji 🚀`

**Esperado**:
- ✅ Webhook recebe
- ✅ Emoji preservado
- ✅ Processamento completo

### Cenário 3: Mensagem Longa
**Enviar**: Texto com mais de 100 caracteres

**Esperado**:
- ✅ Webhook recebe texto completo
- ✅ Processamento sem erros

### Cenário 4: Múltiplas Mensagens Rápidas
**Enviar**: 3 mensagens em sequência rápida
1. `Teste 1`
2. `Teste 2`
3. `Teste 3`

**Esperado**:
- ✅ Todas recebidas
- ✅ Processadas em ordem
- ✅ Sem perda de mensagens

---

## 🎯 Checklist de Validação

### Funcionalidade Básica
- [ ] Backend online (porta 3001)
- [ ] Webhook endpoint acessível
- [ ] Canal WhatsApp ativo no banco
- [ ] Token válido configurado

### Teste de Mensagem
- [ ] Mensagem enviada do celular
- [ ] Webhook recebeu payload
- [ ] Payload parseado corretamente
- [ ] Logs mostram dados corretos (from, id, text)

### Correção UUID Validada
- [ ] ❌ **NÃO aparece erro**: `invalid input syntax for type uuid: "default"`
- [ ] ✅ **Aparece log**: `Empresa: f47ac10b-58cc-4372-a567-0e02b2c3d479`
- [ ] ✅ **Aparece log**: `Phone Number ID detectado: 704423209430762`
- [ ] ✅ Consulta ao banco bem-sucedida

### Funcionalidades Avançadas
- [ ] Mensagem marcada como lida no WhatsApp
- [ ] Verificação de IA executada (se configurada)
- [ ] Auto-resposta enviada (se IA ativa)

---

## 🚨 Problemas Conhecidos e Soluções

### ❌ Erro: "invalid input syntax for type uuid"

**Causa**: Backend ainda está com código antigo (não reiniciado)

**Solução**:
```powershell
# 1. Verificar hora de início do processo
Get-Process -Name node | Select-Object StartTime, Id

# 2. Se anterior à compilação, reiniciar:
Stop-Process -Name node -Force

# 3. Iniciar novamente:
cd C:\Projetos\conectcrm\backend
node dist/src/main.js
```

### ❌ Webhook não recebe mensagens

**Verificar**:
1. Canal está ativo? `SELECT ativo, status FROM canais WHERE id = 'df104dd2-3b8d-42cf-a60f-8a43e54e7520'`
2. Token válido? Ver `RESOLVER_ERRO_401_WHATSAPP.md`
3. Webhook configurado no Meta? Ver `GUIA_ATIVAR_WEBHOOK_WHATSAPP.md`

### ❌ Mensagem recebida mas não marcada como lida

**Verificar credenciais**:
```sql
SELECT 
  configuracao->'credenciais'->>'whatsapp_api_token' as token,
  configuracao->'credenciais'->>'whatsapp_phone_number_id' as phone_id,
  ativo
FROM canais
WHERE id = 'df104dd2-3b8d-42cf-a60f-8a43e54e7520';
```

**Token deve ter**:
- 247 caracteres
- Começar com `EAALQrbLuMHw...`
- Não expirado (Temporary Token dura 24h)

---

## 📸 Screenshots Esperados

### Backend Logs - Sucesso ✅
```
[Nest] 12345  - 2024 LOG [WhatsAppWebhookController] 📩 Webhook recebido - Empresa: f47ac10b-58cc-4372-a567-0e02b2c3d479
[Nest] 12345  - 2024 LOG [WhatsAppWebhookController] 🔍 Phone Number ID detectado: 704423209430762
[Nest] 12345  - 2024 LOG [WhatsAppWebhookService] ✅ Nova mensagem recebida
[Nest] 12345  - 2024 LOG [WhatsAppWebhookService] De: 556296689991
[Nest] 12345  - 2024 LOG [WhatsAppWebhookService] ID: wamid.HBgMNTU2Mjk2Njg5OTkxFQIAEhggQUM4MDI4OEU1QTE2MjA0OUM0Mjk4RTQxNEIzMTc0MTcA
[Nest] 12345  - 2024 LOG [WhatsAppWebhookService] Tipo: text
[Nest] 12345  - 2024 LOG [WhatsAppWebhookService] Conteúdo: TESTE UUID
```

### WhatsApp - Mensagem Marcada como Lida ✅
Você verá **dois checks azuis** ✓✓ na mensagem enviada do celular

---

## 🎬 Próximos Passos Após Teste Bem-Sucedido

1. ✅ Confirmar correção funcionando
2. 📝 Atualizar checklist em `CORRECAO_UUID_WEBHOOK.md`
3. 🔄 Implementar melhorias futuras:
   - Adicionar `DEFAULT_EMPRESA_ID` ao `.env`
   - Implementar lookup de empresa por `phone_number_id`
   - Adicionar cache de integrações
4. 📊 Monitorar logs por 24h
5. 🚀 Deploy para produção (se ambiente de dev)

---

## 📚 Documentação Relacionada

- **Correção Completa**: [CORRECAO_UUID_WEBHOOK.md](./CORRECAO_UUID_WEBHOOK.md)
- **Ativação Webhook**: [GUIA_ATIVAR_WEBHOOK_WHATSAPP.md](./GUIA_ATIVAR_WEBHOOK_WHATSAPP.md)
- **Erro 401**: [RESOLVER_ERRO_401_WHATSAPP.md](./RESOLVER_ERRO_401_WHATSAPP.md)
- **Teste Completo**: [TESTE_WEBHOOK_WHATSAPP.md](./TESTE_WEBHOOK_WHATSAPP.md)

---

**🎯 Resultado Esperado**: Webhook recebendo e processando mensagens sem erros de UUID!
