# 🔧 FIX: Mensagens Caindo para Todos os Atendentes

**Data**: 06/11/2025  
**Problema**: Mensagens de tickets atribuídos estão sendo enviadas para TODOS os atendentes logados, não apenas para o atendente designado.

---

## 🔍 **Diagnóstico**

### Comportamento Atual (INCORRETO)
1. Cliente envia mensagem WhatsApp
2. Backend processa e salva no banco
3. Gateway emite WebSocket para:
   - ✅ Sala do ticket: `ticket:${ticketId}` (correto)
   - ⚠️ **Sala de atendentes NÃO atribuídos**: `'atendentes'` com evento `'mensagem:nao-atribuida'` (correto SE ticket sem atendente)
   - ❌ **Sala GLOBAL de atendentes**: `'atendentes'` com evento `'nova_mensagem'` (SEMPRE, mesmo com atendente!)

### Código Problemático
**Arquivo**: `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`  
**Linhas 237-246**:

```typescript
// Notificar atendentes disponíveis se ticket não tiver atendente
if (!mensagem.atendenteId) {
  this.logger.log(`   🎯 Emitindo 'mensagem:nao-atribuida' para sala 'atendentes'...`);
  this.server.to('atendentes').emit('mensagem:nao-atribuida', mensagem);
}

// 🔥 PROBLEMA AQUI ⬇️
// TAMBÉM emitir globalmente para todos os atendentes
this.logger.log(`   🎯 Emitindo 'nova_mensagem' para sala 'atendentes' (global)...`);
this.server.to('atendentes').emit('nova_mensagem', mensagem); // ❌ SEMPRE EMITE!
```

**Por Que Está Errado**:
- A linha 246 emite **SEMPRE** para todos atendentes
- Mesmo quando `mensagem.atendenteId` está preenchido
- Isso faz com que TODOS os usuários logados vejam notificações de tickets que NÃO são seus

---

## ✅ **Solução**

### Lógica Correta
```
SE ticket TEM atendente:
   → Emitir apenas para: ticket:${ticketId} (atendente designado vê)
   
SE ticket NÃO TEM atendente:
   → Emitir para: ticket:${ticketId} (ninguém na sala ainda)
   → Emitir para: 'atendentes' (fila de não atribuídos)
```

### Código Corrigido

**Arquivo**: `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`  
**Método**: `notificarNovaMensagem()` (linhas 195-253)

```typescript
notificarNovaMensagem(mensagem: any) {
  this.logger.log(`📤 Notificando nova mensagem: ticket=${mensagem.ticketId}, remetente=${mensagem.remetente?.tipo}`);

  try {
    // 1️⃣ SEMPRE emitir para sala do ticket (atendente que está atendendo)
    const ticketRoom = `ticket:${mensagem.ticketId}`;
    this.logger.log(`   🎯 Emitindo 'nova_mensagem' para sala '${ticketRoom}'...`);
    this.server.to(ticketRoom).emit('nova_mensagem', mensagem);

    if (this.server?.sockets?.adapter) {
      this.logger.log(`   → Sala '${ticketRoom}': ${this.server.sockets.adapter.rooms.get(ticketRoom)?.size || 0} clientes`);
    }

    // 2️⃣ Se ticket NÃO tem atendente, emitir para fila de atendentes disponíveis
    if (!mensagem.atendenteId) {
      this.logger.log(`   🎯 Ticket SEM atendente - emitindo para fila 'atendentes'...`);
      this.server.to('atendentes').emit('mensagem:nao-atribuida', mensagem);

      if (this.server?.sockets?.adapter) {
        this.logger.log(`   → Sala 'atendentes' (fila): ${this.server.sockets.adapter.rooms.get('atendentes')?.size || 0} clientes`);
      }
    } else {
      // 3️⃣ Ticket COM atendente - emitir apenas para o atendente específico
      this.logger.log(`   ✅ Ticket COM atendente (${mensagem.atendenteId}) - notificando apenas atendente designado`);
      
      // Emitir para sala pessoal do atendente (caso não esteja na sala do ticket)
      this.server.to(`user:${mensagem.atendenteId}`).emit('nova_mensagem', mensagem);
      
      if (this.server?.sockets?.adapter) {
        this.logger.log(`   → Sala 'user:${mensagem.atendenteId}': ${this.server.sockets.adapter.rooms.get(`user:${mensagem.atendenteId}`)?.size || 0} clientes`);
      }
    }

    this.logger.log(`✅ Evento 'nova_mensagem' emitido com sucesso!`);
  } catch (error) {
    this.logger.error(`❌ Erro ao emitir evento: ${error.message}`);
    this.logger.error(error.stack);
  }
}
```

---

## 🎯 **Diferenças Antes/Depois**

### ❌ ANTES (Comportamento Incorreto)

**Ticket COM atendente**:
```
Cliente envia "Olá"
   ↓
Backend processa
   ↓
WebSocket emite para:
   ✅ ticket:abc123 (atendente João)
   ❌ atendentes (TODOS: João, Maria, Pedro) ← PROBLEMA!
   
Resultado:
   - João vê (correto)
   - Maria vê (ERRADO!)
   - Pedro vê (ERRADO!)
```

**Ticket SEM atendente**:
```
Cliente envia "Preciso ajuda"
   ↓
Backend processa
   ↓
WebSocket emite para:
   ✅ ticket:xyz789 (ninguém ainda)
   ✅ atendentes (fila: todos veem) ← CORRETO!
   
Resultado:
   - Todos veem na fila (correto)
```

---

### ✅ DEPOIS (Comportamento Correto)

**Ticket COM atendente**:
```
Cliente envia "Olá"
   ↓
Backend processa
   ↓
WebSocket emite para:
   ✅ ticket:abc123 (atendente João)
   ✅ user:id-joao (sala pessoal do João)
   
Resultado:
   - João vê (correto)
   - Maria NÃO vê (correto!)
   - Pedro NÃO vê (correto!)
```

**Ticket SEM atendente**:
```
Cliente envia "Preciso ajuda"
   ↓
Backend processa
   ↓
WebSocket emite para:
   ✅ ticket:xyz789 (ninguém ainda)
   ✅ atendentes (fila: todos veem)
   
Resultado:
   - Todos veem na fila (correto)
   - Após atribuição, só atendente designado vê
```

---

## 🧪 **Testes Necessários**

### Teste 1: Mensagem em Ticket COM Atendente
1. Cliente envia mensagem pelo WhatsApp
2. Bot faz triagem e designa para João
3. Cliente envia segunda mensagem: "Olá"
4. **Verificar**:
   - ✅ João vê a mensagem
   - ✅ Maria NÃO vê a mensagem
   - ✅ Pedro NÃO vê a mensagem

### Teste 2: Mensagem em Ticket SEM Atendente
1. Cliente envia mensagem pelo WhatsApp
2. Ticket criado mas não atribuído
3. **Verificar**:
   - ✅ Ticket aparece na fila para todos
   - ✅ Todos os atendentes veem notificação

### Teste 3: Mensagem Após Atribuição Manual
1. João atribui ticket para si mesmo
2. Cliente envia mensagem
3. **Verificar**:
   - ✅ João vê a mensagem
   - ✅ Outros atendentes NÃO veem

---

## 📊 **Campos Relevantes**

### Mensagem (objeto)
```typescript
{
  id: 'uuid',
  ticketId: 'uuid-do-ticket',
  conteudo: 'Olá',
  tipo: 'TEXTO',
  remetenteTipo: 'CLIENTE',
  atendenteId: 'uuid-do-atendente', // ← CAMPO CHAVE!
  createdAt: '2025-11-06T...'
}
```

### Ticket (objeto)
```typescript
{
  id: 'uuid',
  numero: 272,
  atendenteId: 'uuid' | null, // ← NULL = não atribuído
  status: 'ABERTO' | 'EM_ATENDIMENTO' | ...
  contatoTelefone: '+5562996689991',
  empresaId: 'uuid'
}
```

---

## 🚀 **Implementação**

### Passo 1: Aplicar Correção
Editar arquivo:
```
backend/src/modules/atendimento/gateways/atendimento.gateway.ts
```

Substituir método `notificarNovaMensagem()` (linhas 195-253) pelo código corrigido acima.

### Passo 2: Reiniciar Backend
```powershell
cd backend
npm run start:dev
```

### Passo 3: Testar
1. Abrir 2 navegadores (João e Maria)
2. Fazer login com usuários diferentes
3. Enviar mensagem WhatsApp
4. Bot designa para João
5. Enviar segunda mensagem
6. **Verificar**: Só João vê, Maria não vê

---

## 📝 **Resumo da Correção**

**Mudança Principal**:
- ❌ **ANTES**: Linha 246 emitia **SEMPRE** para `'atendentes'`
- ✅ **DEPOIS**: 
  - Se `!mensagem.atendenteId` → emitir para `'atendentes'` (fila)
  - Se `mensagem.atendenteId` → emitir para `user:${atendenteId}` (atendente específico)

**Resultado**:
- Mensagens só vão para o atendente certo
- Fila de não atribuídos funciona corretamente
- Privacidade de conversas respeitada

---

## ⚠️ **Observações Importantes**

1. **Frontend**: Não precisa mudar nada! A correção é 100% no backend.
2. **Sala `ticket:${id}`**: Atendente automaticamente entra quando abre o chat.
3. **Sala `user:${id}`**: Atendente entra ao conectar (linha 121 do gateway).
4. **Compatibilidade**: Fix não quebra nenhuma funcionalidade existente.

---

## ✅ **Checklist Pós-Correção**

- [ ] Código alterado em `atendimento.gateway.ts`
- [ ] Backend reiniciado
- [ ] Teste 1: Mensagem com atendente (só atendente vê)
- [ ] Teste 2: Mensagem sem atendente (fila vê)
- [ ] Teste 3: Atribuição manual funciona
- [ ] Logs do backend confirmam comportamento correto
- [ ] Frontend não mostra mensagens de outros atendentes

---

**Status**: ✅ Correção documentada e pronta para aplicação  
**Impacto**: Crítico - afeta privacidade de conversas  
**Complexidade**: Baixa - mudança em 1 método apenas  
**Risco**: Mínimo - lógica mais restritiva (fail-safe)
