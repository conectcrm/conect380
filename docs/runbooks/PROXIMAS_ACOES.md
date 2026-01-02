# Próximas Ações - Integração WhatsApp

**Data:** 12 de outubro de 2025  
**Status Atual:** ✅ Config WhatsApp salva | ⚠️ Webhook recebe mas não cria tickets

---

## ✅ Completado Hoje

### 1. Correção Entity Canal - Mapeamento de Colunas
**Problema:** Entity tinha propriedades para colunas inexistentes no banco  
**Solução:**  
- ✅ Corrigido `provedor` (era `provider`)
- ✅ Comentado `webhook_url` e `webhook_secret` (colunas não existem)
- ✅ Comentado `deleted_at` (coluna não existe)
- ✅ Adicionadas 5 colunas faltantes

**Resultado:** Configuração WhatsApp agora salva com sucesso! (HTTP 201) ✅

**Validação:**
```sql
SELECT * FROM atendimento_canais WHERE nome = 'WHATSAPP Principal';
```
- ✅ whatsapp_api_token
- ✅ whatsapp_phone_number_id  
- ✅ whatsapp_business_account_id
- ✅ whatsapp_webhook_verify_token

**Documentação Criada:**
- `CORRECAO_ENTITY_CANAL.md` - Detalhamento técnico completo
- `RESOLUCAO_COMPLETA_WHATSAPP.md` - Resumo executivo

---

## ⚠️ Problema Atual - Webhook Não Cria Tickets

### Sintomas
- ✅ Webhook recebido (HTTP 201)
- ✅ Backend responde "Webhook processado com sucesso"
- ❌ Nenhum ticket criado no banco de dados
- ❌ Nenhuma mensagem criada

### Teste Executado
```bash
node test-webhook-simples.js
```

**Resultado:**
```
✅ Webhook enviado! Status: 201
✅ Resposta: { success: true, message: "Webhook processado (teste)" }
❌ Tickets no banco: 0
```

### Investigação Realizada

1. **Webhook Controller** (`whatsapp-webhook.controller.ts`)
   - ✅ Endpoint `/test` funciona
   - ✅ Retorna HTTP 201
   - ✅ Chama `webhookService.processar()`

2. **Webhook Service** (`whatsapp-webhook.service.ts`)
   - ✅ Método `processar()` existe
   - ✅ Valida payload
   - ✅ Chama `processarMensagem()`
   - ✅ Chama `ticketService.buscarOuCriarTicket()`

3. **Ticket Service** (`ticket.service.ts`)
   - ✅ Método `buscarOuCriarTicket()` existe
   - ✅ Tem logs (`🔍 Buscando ticket...`, `✨ Criando novo ticket...`)
   - ❌ **LOGS NÃO APARECEM** - Método não está sendo executado!

4. **Banco de Dados**
   - ✅ Tabela `atendimento_tickets` existe
   - ✅ Schema correto
   - ❌ Nenhum registro criado

### Hipóteses

#### Hipótese 1: Erro Silencioso no processarMensagem
**Possível causa:** Exception não tratada antes de chamar `buscarOuCriarTicket`

**O que verificar:**
- Método `buscarCanalPorPhoneNumberId` pode estar retornando `null`
- Se canal não for encontrado, webhook retorna success mas não processa

**Evidência:**
```typescript
// whatsapp-webhook.service.ts linha 194
const canal = await this.buscarCanalPorPhoneNumberId(empresaId, phoneNumberId);

if (!canal) {
  this.logger.warn(`⚠️  Canal não encontrado para phone_number_id: ${phoneNumberId}`);
  await this.senderService.marcarComoLida(empresaId, messageId);
  return; // ← RETORNA SEM CRIAR TICKET!
}
```

**Como testar:**
1. Verificar se `buscarCanalPorPhoneNumberId` está encontrando o canal
2. Adicionar logs antes do `return` para confirmar

#### Hipótese 2: Property Access Error
**Possível causa:** Acesso a propriedade aninhada que não existe

**O que verificar:**
```typescript
// Linha 345
const phoneId = canal.configuracao?.credenciais?.whatsapp_phone_number_id;
```

Se `configuracao` for `null` ou `undefined`, `phoneId` será `undefined` e nunca matches.

**Como testar:**
```sql
-- Verificar estrutura exata do config
SELECT 
  id,
  nome,
  config,
  config->'credenciais' as credenciais,
  config->'credenciais'->'whatsapp_phone_number_id' as phone_id
FROM atendimento_canais 
WHERE nome = 'WHATSAPP Principal';
```

#### Hipótese 3: Tipo do Canal Incorreto
**Possível causa:** `tipo` está como `'whatsapp'` mas código busca `TipoCanal.WHATSAPP`

**O que verificar:**
```sql
SELECT id, nome, tipo FROM atendimento_canais;
```

Verificar se tipo é exatamente `'WHATSAPP'` (maiúsculas) ou `'whatsapp'` (minúsculas).

**No código:**
```typescript
// whatsapp-webhook.service.ts linha 342
const canais = await this.canalRepo.find({
  where: { empresaId, tipo: TipoCanal.WHATSAPP, ativo: true },
});
```

**TipoCanal.WHATSAPP** pode ser diferente do valor no banco!

---

## 🎯 Próximas Ações

### Ação 1: Adicionar Logs Detalhados no Webhook Service ⭐ PRIORITÁRIO
**Objetivo:** Descobrir exatamente onde o processamento está parando

**Arquivo:** `backend/src/modules/atendimento/services/whatsapp-webhook.service.ts`

**Modificações:**
```typescript
private async processarMensagem(...) {
  console.log('═══════════════════════════════════════');
  console.log('🔍 [WEBHOOK] Iniciando processarMensagem');
  console.log(`   empresaId: ${empresaId}`);
  console.log(`   from: ${from}`);
  console.log(`   messageId: ${messageId}`);
  
  const phoneNumberId = value?.metadata?.phone_number_id;
  console.log(`   phoneNumberId: ${phoneNumberId}`);
  
  const canal = await this.buscarCanalPorPhoneNumberId(empresaId, phoneNumberId);
  console.log(`   canal encontrado: ${canal ? canal.nome : 'NULL'}`);
  
  if (!canal) {
    console.log('❌ [WEBHOOK] Canal não encontrado - ABORTANDO');
    console.log('═══════════════════════════════════════');
    return;
  }
  
  console.log('✅ [WEBHOOK] Chamando ticketService.buscarOuCriarTicket');
  const ticket = await this.ticketService.buscarOuCriarTicket(...);
  console.log(`✅ [WEBHOOK] Ticket criado/encontrado: ${ticket.id}`);
  console.log('═══════════════════════════════════════');
}
```

### Ação 2: Verificar Enum TipoCanal
**Arquivo:** `backend/src/modules/atendimento/entities/canal.entity.ts`

**Verificar:**
```typescript
export enum TipoCanal {
  WHATSAPP = 'WHATSAPP',  // ← Maiúsculas?
  // ou
  WHATSAPP = 'whatsapp',  // ← Minúsculas?
}
```

**Comparar com banco:**
```sql
SELECT DISTINCT tipo FROM atendimento_canais;
```

**Se diferente, corrigir:**
- Opção A: Alterar enum para match banco
- Opção B: Usar `tipo.toLowerCase()` na busca

### Ação 3: Adicionar Endpoint de Debug
**Criar:** `GET /api/atendimento/webhooks/whatsapp/debug/:empresaId`

**Retorna:**
```json
{
  "empresaId": "...",
  "canais": [
    {
      "id": "...",
      "nome": "WHATSAPP Principal",
      "tipo": "whatsapp",
      "ativo": true,
      "phoneNumberId": "704423209430762",
      "hasConfiguracao": true,
      "hasCredenciais": true
    }
  ]
}
```

Permite verificar se canal está sendo encontrado corretamente.

### Ação 4: Teste Unitário do buscarCanalPorPhoneNumberId
**Criar:** `backend/src/modules/atendimento/services/whatsapp-webhook.service.spec.ts`

**Testar:**
1. Buscar canal com phone_number_id correto → deve retornar canal
2. Buscar canal com phone_number_id inexistente → deve retornar null
3. Buscar canal com configuracao.credenciais null → deve retornar null

### Ação 5: Script de Teste Direto
**Criar:** `test-ticket-creation.js`

```javascript
// Teste direto do TicketService sem passar pelo webhook
const ticketService = // injetar do NestJS
const ticket = await ticketService.buscarOuCriarTicket({
  empresaId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  canalId: 'ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7',
  clienteNumero: '5511999998888',
  clienteNome: 'João Silva Teste',
  assunto: 'Teste direto',
  origem: 'WHATSAPP',
});

console.log('Ticket criado:', ticket);
```

Se funcionar → problema está no webhook service  
Se falhar → problema está no ticket service

---

## 📊 Estado do Sistema

### Backend
- ✅ Rodando (porta 3001)
- ✅ Entity Canal corrigida
- ✅ Config WhatsApp salva
- ⚠️ Webhook não cria tickets

### Banco de Dados
- ✅ Tabela `atendimento_canais` OK
- ✅ Canal ativo: `ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7`
- ✅ Config completa salva
- ❌ Tabela `atendimento_tickets` vazia

### Testes
- ✅ `executar-testes.ps1 -Teste Integracao` → 75% (era 25%)
- ✅ Webhook HTTP 201
- ❌ Ticket não criado

---

## 🔄 Fluxo Esperado vs Atual

### Esperado ✅
```
1. Webhook recebido → POST /webhooks/whatsapp/:empresaId/test
2. Validar payload → OK
3. Extrair mensagem → OK
4. Buscar canal por phone_number_id → OK?
5. Criar/buscar ticket → ❌ NÃO ACONTECE
6. Salvar mensagem → ❌ NÃO ACONTECE
7. Notificar WebSocket → ❌ NÃO ACONTECE
```

### Atual ⚠️
```
1. Webhook recebido → ✅ POST OK
2. Retorna HTTP 201 → ✅ Success response
3. ??? → ⚠️ Processo para aqui
4. Nenhum ticket criado → ❌
```

---

## 📝 Decisões Técnicas Pendentes

### 1. Property Name: config vs configuracao
**Situação:**
- Banco de dados: coluna `config`
- Entity: property `configuracao` com `@Column({ name: 'config' })`
- Service: acessa `canal.configuracao`

**Funciona?** ✅ Sim, TypeORM faz o mapeamento

**Melhor prática:** Manter consistente (ou tudo inglês ou tudo português)

### 2. Tipo do Canal: Case Sensitivity
**Banco:** `tipo = 'whatsapp'` (minúsculas)  
**Enum:** `TipoCanal.WHATSAPP = ?`

**Precisa verificar!**

### 3. Logs de Produção
**Atual:** Muitos `console.log` para debug  
**Recomendado:** Usar `this.logger.debug()` que pode ser desabilitado em produção

---

## 🎓 Lições Aprendidas

1. **TypeORM Mapping**: Property name pode diferir do column name usando `@Column({ name: '...' })`
2. **Errors Silenciosos**: Sempre adicionar try-catch e logs em processamento assíncrono
3. **Testing**: Testes end-to-end podem passar mas lógica de negócio falhar silenciosamente
4. **Enums**: Case sensitivity importa! `'whatsapp'` ≠ `'WHATSAPP'`

---

## ✅ Critérios de Sucesso

Para considerar o webhook 100% funcional:

1. ✅ Webhook recebe mensagem (HTTP 201)
2. ❌ Canal encontrado por phone_number_id
3. ❌ Ticket criado/buscado no banco
4. ❌ Mensagem salva no banco
5. ❌ WebSocket notifica frontend
6. ❌ Teste end-to-end passa 100%

**Progresso:** 1/6 (17%) → Precisa atingir 6/6 (100%)

---

## 📚 Documentação de Referência

- [CORRECAO_ENTITY_CANAL.md](./backend/CORRECAO_ENTITY_CANAL.md) - Correções da Entity
- [RESOLUCAO_COMPLETA_WHATSAPP.md](./RESOLUCAO_COMPLETA_WHATSAPP.md) - Resumo do progresso
- [GUIA_TESTES.md](./backend/GUIA_TESTES.md) - Como executar testes
- [INTEGRACAO_COMPLETA.md](./backend/INTEGRACAO_COMPLETA.md) - Arquitetura webhook

---

**Última atualização:** 12/10/2025 11:00  
**Próximo passo sugerido:** Ação 1 (Adicionar logs detalhados)
