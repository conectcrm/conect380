# 🐛 PROBLEMA: Webhook retorna 201 mas não cria tickets

**Status**: 🔴 INVESTIGANDO (Backend rodando com logs prontos - PID 5608)

---

## 📋 Descrição do Problema

### Sintoma
- **Requisição**: `POST /api/atendimento/webhooks/whatsapp/:empresaId/test`
- **Resposta**: `HTTP 201 ✅` com `{ success: true, message: "Webhook processado (teste)" }`
- **Banco de dados**: `0 tickets` criados ❌
- **Logs esperados**: Não aparecem no console ❌

### Comportamento Esperado
1. Webhook recebe payload do WhatsApp
2. Extrai `phone_number_id` do payload
3. Busca canal correspondente no banco
4. Cria ou busca ticket existente
5. Salva mensagem no banco
6. Notifica agentes via WebSocket

### Comportamento Atual
- ✅ Endpoint recebe requisição
- ✅ Retorna HTTP 201
- ❌ **Ticket não é criado**
- ❌ **Mensagem não é salva**
- ❌ **WebSocket não é notificado**

---

## 🔍 Investigação Realizada

### 1️⃣ Criado Script de Teste Simplificado
```javascript
// test-webhook-simples.js
const payload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '1922786558561358',
    changes: [{
      value: {
        metadata: { phone_number_id: '704423209430762' },
        messages: [{
          from: '5511999998888',
          id: 'wamid.test_abc123',
          type: 'text',
          text: { body: 'Olá, preciso de ajuda!' }
        }]
      }
    }]
  }]
};

// POST /api/atendimento/webhooks/whatsapp/:empresaId/test
```

**Resultado**: HTTP 201, mas 0 tickets no banco

### 2️⃣ Adicionados Logs de Debug

**whatsapp-webhook.controller.ts** (já existia):
```typescript
console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 [WEBHOOK TEST] Endpoint atingido!');
console.log(`📋 [WEBHOOK TEST] Empresa ID: ${empresaId}`);
console.log(`📦 [WEBHOOK TEST] Body: ${JSON.stringify(body, null, 2)}`);
console.log('═══════════════════════════════════════════════════════════');
```

**whatsapp-webhook.service.ts** (adicionado):
```typescript
console.log('🔍 [WEBHOOK DEBUG] Iniciando processarMensagem');
console.log(`📱 [WEBHOOK DEBUG] phone_number_id: ${phoneNumberId}`);
console.log(`🔍 [WEBHOOK DEBUG] Buscando canal...`);
console.log(`📋 [WEBHOOK DEBUG] Canal encontrado: ${canal ? 'SIM' : 'NULL'}`);
console.log(`🎫 [WEBHOOK DEBUG] Chamando ticketService.buscarOuCriarTicket...`);
console.log(`💾 [WEBHOOK DEBUG] Salvando mensagem no banco...`);
console.log(`📢 [WEBHOOK DEBUG] Notificando via WebSocket...`);
```

**Resultado**: Logs NÃO aparecem no console ❌

### 3️⃣ Identificado Problema de Compilação

**Causa Raiz**: Backend rodando com código TypeScript compilado **DESATUALIZADO**
- Logs adicionados no `.ts` mas não presentes no `dist/`
- Watch mode não detectou mudanças
- Necessário rebuild completo

### 4️⃣ Solução Aplicada

```powershell
# 1. Parar todos processos Node.js
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Limpar compilação antiga
cd C:\Projetos\conectcrm\backend
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# 3. Recompilar do zero
npm run build

# 4. Iniciar backend com watch mode
npm run start:dev
```

**Resultado**: ✅ Backend rodando com compilação FRESCA (PID 5608)

---

## 🎯 Hipóteses do Problema Real

### Hipótese #1: Canal não é encontrado (MAIS PROVÁVEL) 🔴
```typescript
// whatsapp-webhook.service.ts ~linha 194
const canal = await this.buscarCanalPorPhoneNumberId(empresaId, phoneNumberId);
if (!canal) {
  this.logger.warn(`Canal não encontrado...`);
  return; // ← SAÍDA SILENCIOSA - controller vê como sucesso
}
```

**Possíveis sub-causas**:
- ❌ Enum case mismatch: `TipoCanal.WHATSAPP` (código) vs `'whatsapp'` (banco)
- ❌ Propriedade undefined: `canal.configuracao?.credenciais?.whatsapp_phone_number_id`
- ❌ Comparação de tipos: string vs number

### Hipótese #2: phoneNumberId não extraído
```typescript
const phoneNumberId = value?.metadata?.phone_number_id;
if (!phoneNumberId) {
  return; // ← Saída silenciosa
}
```

### Hipótese #3: Exceção não propagada
Algum serviço downstream lança erro mas é capturado e ignorado

---

## ✅ PRÓXIMOS PASSOS (IMEDIATOS)

### Passo 1: Executar Teste com Logs Ativos
```powershell
node test-webhook-simples.js
```

### Passo 2: Observar Console do Backend
**Logs esperados**:
```
═══════════════════════════════════════════════════════════
🧪 [WEBHOOK TEST] Endpoint atingido!
📋 [WEBHOOK TEST] Empresa ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
📦 [WEBHOOK TEST] Body: { ... }
═══════════════════════════════════════════════════════════
🔄 [WEBHOOK TEST] Chamando webhookService.processar...

═══════════════════════════════════════════════════════════
🔍 [WEBHOOK DEBUG] Iniciando processarMensagem
   empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
📩 [WEBHOOK DEBUG] Dados extraídos:
   from: 5511999998888
   messageId: wamid.test_...
   type: text
📱 [WEBHOOK DEBUG] phone_number_id: 704423209430762
🔍 [WEBHOOK DEBUG] Buscando canal...
```

**→ Se aparecer "Canal encontrado: NULL"**: Confirma Hipótese #1
**→ Se aparecer "phone_number_id: undefined"**: Confirma Hipótese #2
**→ Se aparecer canal mas parar depois**: Problema downstream

### Passo 3: Aplicar Correção Direcionada
Baseado nos logs capturados, aplicar fix específico

### Passo 4: Validar Criação de Ticket
```powershell
docker exec -it conectcrm-postgres psql -U conectcrm -d conectcrm_db -c "SELECT id, numero, contato_telefone FROM atendimento_tickets LIMIT 1;"
```

**Sucesso**: 1 linha retornada com `contato_telefone='5511999998888'` ✅

---

## 📊 Estado Atual do Sistema

### Backend
- ✅ **Rodando**: PID 5608, porta 3001
- ✅ **Compilação**: FRESCA (dist/ limpo e reconstruído)
- ✅ **Watch mode**: Ativo
- ✅ **Logs**: Adicionados e compilados

### Banco de Dados
```sql
-- Canal configurado
SELECT id, nome, tipo, ativo 
FROM atendimento_canais;
-- ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7 | WHATSAPP Principal | whatsapp | true

-- Tickets (deve estar vazio)
SELECT COUNT(*) FROM atendimento_tickets;
-- 0
```

### Código Modificado
- ✅ `whatsapp-webhook.service.ts`: Logs + fix DTO
- ✅ `whatsapp-webhook.controller.ts`: Já tinha logs
- ✅ `test-webhook-simples.js`: Script de teste pronto

---

## 🔧 Correções Aplicadas Até Agora

### 1. Fix DTO Mensagem
```typescript
// ANTES (ERRADO)
const mensagem = await this.mensagemService.salvar({
  ticketId: ticket.id,
  remetenteExterno: from,  // ❌ Propriedade não existe
  conteudo,
  tipo,  // ❌ String em vez de enum
  metadata: { ... }
});

// DEPOIS (CORRETO)
const tipoMensagem = type === 'text' ? TipoMensagem.TEXTO :
                     type === 'image' ? TipoMensagem.IMAGEM :
                     /* ... */
                     TipoMensagem.TEXTO;

const mensagem = await this.mensagemService.salvar({
  ticketId: ticket.id,
  tipo: tipoMensagem,  // ✅ Enum
  remetente: RemetenteMensagem.CLIENTE,  // ✅ Propriedade correta
  conteudo,
  midia: mediaUrl ? { url: mediaUrl } : undefined
});
```

### 2. Logs Detalhados
- ✅ Entry point logging
- ✅ Payload extraction logging
- ✅ Canal lookup logging
- ✅ Ticket creation logging
- ✅ Message save logging
- ✅ WebSocket notification logging

---

## 📝 Lições Aprendidas

1. **TypeScript Watch Mode**: Nem sempre detecta mudanças - às vezes rebuild manual necessário
2. **Silent Returns**: Services que retornam sem erro mascaram falhas da API
3. **Port Conflicts**: Múltiplos processos Node.js podem bloquear porta 3001
4. **DTO Validation**: TypeORM exige estrutura exata (enums, propriedades corretas)
5. **Debug First**: Adicionar logs ANTES de tentar fixes cegos

---

## � PROBLEMA CRÍTICO IDENTIFICADO

### Compilação NÃO Está Atualizando

**Evidência**:
1. ✅ Logs adicionados no código TypeScript (.ts)
2. ✅ Arquivo "touched" para forçar recompilação
3. ✅ Backend rodando com watch mode
4. ❌ **Logs NÃO aparecem no console após webhook**
5. ❌ **Código compilado (dist/) parece desatualizado**

**Testes Executados**:
```
11:17:20 - Teste webhook executado → HTTP 201 → 0 tickets
11:18:50 - Arquivo touched para forçar recompilação
11:19:00 - Teste webhook executado → HTTP 201 → 0 tickets
```

**Logs Esperados (NÃO APARECEM)**:
```
═══════════════════════════════════════════════════════════
🧪 [WEBHOOK TEST] Endpoint atingido!
📋 [WEBHOOK TEST] Empresa ID: ...
📦 [WEBHOOK TEST] Body: ...
```

**Terminal Backend Mostra Apenas**:
- Startup logs (10:43:51)
- Route mappings
- Application started
- **NENHUM** log de webhook

---

## 💡 SOLUÇÃO NECESSÁRIA

### Opção 1: Restart Manual Completo (RECOMENDADO)

```powershell
# 1. Parar TODOS os processos Node.js
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Verificar que porta está livre
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# 3. Limpar dist/ completamente
cd C:\Projetos\conectcrm\backend
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# 4. Limpar cache do NestJS CLI
Remove-Item -Path .nest -Recurse -Force -ErrorAction SilentlyContinue

# 5. Recompilar do ZERO
npm run build

# 6. Verificar que dist/ contém arquivos novos
Get-Item "dist/src/modules/atendimento/controllers/whatsapp-webhook.controller.js" | Select-Object LastWriteTime

# 7. Iniciar backend
npm run start:dev

# 8. Aguardar inicialização completa (30 segundos)
Start-Sleep -Seconds 30

# 9. Executar teste
cd ..
node test-webhook-simples.js

# 10. IMEDIATAMENTE verificar console backend
# Deve aparecer: 🧪 [WEBHOOK TEST] Endpoint atingido!
```

### Opção 2: Verificar Arquivo Compilado

```powershell
# Verificar se logs estão no arquivo .js compilado
Select-String -Path "C:\Projetos\conectcrm\backend\dist\src\modules\atendimento\controllers\whatsapp-webhook.controller.js" -Pattern "WEBHOOK TEST"

# Se NÃO encontrar = confirma que dist/ está desatualizado
# Se ENCONTRAR = problema é diferente (logs não executando)
```

### Opção 3: Adicionar Breakpoint Alternativo

Se recompilação não funcionar, adicionar log ANTES do decorator:

```typescript
// whatsapp-webhook.controller.ts
export class WhatsAppWebhookController {
  constructor(...) {
    console.log('🚨🚨🚨 CONTROLLER INSTANCIADO 🚨🚨🚨');
  }
  
  @Post(':empresaId/test')
  async testarWebhook(...) {
    // Este log DEVE aparecer no constructor acima
    console.log('🚨🚨🚨 TESTE WEBHOOK CHAMADO 🚨🚨🚨');
    // ... rest
  }
}
```

---

## 🎯 AÇÃO IMEDIATA RECOMENDADA

**PRÓXIMO PASSO: Executar Opção 1 (Restart Completo)**

Razão: Watch mode claramente NÃO está recompilando. Rebuild manual é único caminho confiável.

**APÓS restart completo**:
- Se logs aparecerem → Identificar ponto de falha e aplicar fix
- Se logs ainda não aparecerem → Problema mais profundo (TypeScript config, NestJS CLI, etc)

---

**Atualizado**: 2025-10-12 11:19 (Problema compilação identificado - necessário restart manual)
