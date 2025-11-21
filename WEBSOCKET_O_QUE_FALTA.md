# 🔌 WebSocket: O Que Falta Para 100%

## 📅 Data: 13 de outubro de 2025
## 📊 Status Atual: **80% → 100% (faltam 20%)**

---

## 🎯 **RESUMO EXECUTIVO**

O WebSocket está **implementado e funcional**, mas **temporariamente desabilitado** devido a um bug de loop infinito causado por callbacks instáveis.

**Para deixar 100%:** Corrigir padrão de callbacks usando `useRef`.

**Tempo estimado:** 30-45 minutos

---

## ✅ **O QUE JÁ ESTÁ PRONTO (80%)**

### 1. **Backend Gateway 100% Funcional**
✅ Arquivo: `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`

```typescript
✅ Conexão com autenticação JWT
✅ Salas por usuário: user:{id}
✅ Salas por ticket: ticket:{id}
✅ Sala de atendentes: atendentes
✅ Eventos implementados:
   - atendente:online / offline
   - mensagem:nova
   - mensagem:digitando
   - ticket:atualizado
   - ticket:transferido
   - ticket:encerrado
```

### 2. **Frontend Hook Criado**
✅ Arquivo: `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts`

```typescript
✅ Conexão via socket.io-client
✅ Autenticação JWT
✅ Auto-reconnect
✅ Estado de conexão (connected, connecting, error)
✅ Callbacks para eventos
✅ Métodos: connect(), disconnect(), emit()
```

### 3. **Integração no MensagemService**
✅ Arquivo: `backend/src/modules/atendimento/services/mensagem.service.ts`

```typescript
✅ Emite evento após salvar mensagem:
   this.atendimentoGateway.notificarNovaMensagem(mensagemSalva);
```

### 4. **useEffect Corrigido**
✅ Removidas dependências instáveis que causavam loop

---

## ❌ **O QUE FALTA (20%)**

### **PROBLEMA: Callbacks Instáveis Causam Loop**

#### Código Atual (Desabilitado):
```typescript
// ChatOmnichannel.tsx - Linha 91
const { connected: wsConnected } = useWebSocket({
  enabled: false,      // ⚠️ DESABILITADO
  autoConnect: false,
  events: {}           // ⚠️ SEM CALLBACKS
});
```

#### Código Problemático Original:
```typescript
// ❌ CAUSA LOOP - Callbacks mudam a cada render
const { connected } = useWebSocket({
  enabled: true,
  events: {
    onNovoTicket: () => recarregarTickets(),
    onNovaMensagem: (msg) => {
      if (msg.ticketId === ticketAtual?.id) {
        recarregarMensagens();
      }
    }
  }
});
```

**Por que causa loop:**
- `recarregarTickets()` e `recarregarMensagens()` são recriadas a cada render
- Callbacks mudam → `useEffect` executa → desconecta → reconecta → loop

---

## 🔧 **SOLUÇÃO: Usar useRef para Callbacks Estáveis**

### **Passo 1: Criar Refs para Callbacks**

```typescript
// ChatOmnichannel.tsx - Adicionar após linha 70
const callbacksRef = useRef({
  recarregarTickets: () => {},
  recarregarMensagens: () => {},
  ticketAtualId: null as string | null,
});

// Atualizar refs quando funções mudarem
useEffect(() => {
  callbacksRef.current = {
    recarregarTickets: () => {
      setTicketsFiltrados([...ticketsFiltrados]); // Force refresh
      // ou chamar API novamente
    },
    recarregarMensagens: () => {
      // Lógica de recarregar mensagens
    },
    ticketAtualId: ticketSelecionado?.id || null,
  };
}, [ticketsFiltrados, ticketSelecionado]);
```

### **Passo 2: Passar Callbacks Estáveis para useWebSocket**

```typescript
// ChatOmnichannel.tsx - Modificar linha 91
const { connected: wsConnected } = useWebSocket({
  enabled: true,          // ✅ RE-HABILITAR
  autoConnect: true,
  events: {
    // ✅ Callbacks estáveis (não mudam)
    onNovoTicket: () => {
      console.log('📨 Novo ticket recebido via WebSocket');
      callbacksRef.current.recarregarTickets();
    },
    
    onNovaMensagem: (mensagem: any) => {
      console.log('💬 Nova mensagem via WebSocket:', mensagem);
      if (mensagem.ticketId === callbacksRef.current.ticketAtualId) {
        callbacksRef.current.recarregarMensagens();
      }
    },
    
    onTicketAtualizado: (ticket: any) => {
      console.log('🔄 Ticket atualizado via WebSocket:', ticket);
      callbacksRef.current.recarregarTickets();
    },
    
    onTicketTransferido: (ticket: any) => {
      console.log('👤 Ticket transferido via WebSocket:', ticket);
      callbacksRef.current.recarregarTickets();
    },
    
    onTicketEncerrado: (ticket: any) => {
      console.log('🏁 Ticket encerrado via WebSocket:', ticket);
      callbacksRef.current.recarregarTickets();
    },
  }
});
```

### **Passo 3: Remover Comentário de Desabilitação**

```typescript
// Remover linha 90-91:
// ⚠️ TEMPORARIAMENTE DESABILITADO - Callbacks causavam loop infinito de reconexões
// Solução: Refatorar com useRef para callbacks estáveis (ver PROBLEMA_WEBSOCKET_LOOP.md)
```

### **Passo 4: Testar**

```typescript
// Console esperado:
🔌 Conectando ao WebSocket: http://localhost:3001
✅ WebSocket conectado! ID: xyz123
📨 Novo ticket recebido via WebSocket
💬 Nova mensagem via WebSocket: {...}
```

**✅ SEM LOOPS!**

---

## 📝 **CÓDIGO COMPLETO DA CORREÇÃO**

### **Arquivo: ChatOmnichannel.tsx**

```typescript
// ===== ADICIONAR APÓS LINHA 70 =====
const callbacksRef = useRef({
  recarregarTickets: () => {},
  recarregarMensagens: () => {},
  ticketAtualId: null as string | null,
});

useEffect(() => {
  callbacksRef.current = {
    recarregarTickets: () => {
      // Recarregar lista de tickets
      console.log('🔄 Recarregando tickets...');
      // Implementar lógica de reload (chamar API ou atualizar estado)
    },
    recarregarMensagens: () => {
      // Recarregar mensagens do ticket atual
      console.log('🔄 Recarregando mensagens...');
      // Implementar lógica de reload
    },
    ticketAtualId: ticketSelecionado?.id || null,
  };
}, [ticketSelecionado]);

// ===== SUBSTITUIR LINHAS 91-97 =====
const { connected: wsConnected } = useWebSocket({
  enabled: true,  // ✅ RE-HABILITADO
  autoConnect: true,
  events: {
    onNovoTicket: () => {
      console.log('📨 Novo ticket via WebSocket');
      callbacksRef.current.recarregarTickets();
    },
    onNovaMensagem: (mensagem: any) => {
      console.log('💬 Nova mensagem via WebSocket');
      if (mensagem.ticketId === callbacksRef.current.ticketAtualId) {
        callbacksRef.current.recarregarMensagens();
      }
    },
    onTicketAtualizado: (ticket: any) => {
      console.log('🔄 Ticket atualizado via WebSocket');
      callbacksRef.current.recarregarTickets();
    },
  }
});
```

---

## 🧪 **TESTES PÓS-CORREÇÃO**

### **Teste 1: Verificar Conexão**
1. Recarregar página (Ctrl+R)
2. Abrir console (F12)
3. Verificar logs:
   ```
   🔌 Conectando ao WebSocket...
   ✅ WebSocket conectado! ID: abc123
   ```
4. **✅ SEM loops de desconexão/reconexão**

### **Teste 2: Enviar Mensagem**
1. Abrir ticket
2. Enviar mensagem pelo chat
3. Verificar log no backend:
   ```
   📡 Evento WebSocket emitido: nova_mensagem
   ```
4. Verificar log no frontend:
   ```
   💬 Nova mensagem via WebSocket: {...}
   ```

### **Teste 3: Múltiplas Abas**
1. Abrir 2 abas com `/atendimento`
2. Enviar mensagem em uma aba
3. **✅ Outra aba deve atualizar automaticamente**

### **Teste 4: Novo Ticket via Webhook**
1. Enviar mensagem WhatsApp
2. Webhook cria ticket
3. **✅ Interface deve mostrar novo ticket sem refresh**

---

## 📊 **COMPARAÇÃO: ANTES x DEPOIS**

| Aspecto | Antes (80%) | Depois (100%) |
|---------|-------------|---------------|
| **WebSocket conecta** | ✅ Sim | ✅ Sim |
| **Eventos funcionam** | ❌ Loop infinito | ✅ Sem loops |
| **Mensagens tempo real** | ❌ Não (polling 30s) | ✅ Sim (instantâneo) |
| **Múltiplas abas** | ❌ Não sincronizam | ✅ Sincronizam |
| **Novo ticket** | ⏰ Espera polling | ✅ Aparece instantâneo |
| **Performance** | ⚠️ Polling constante | ✅ Apenas eventos |

---

## ⏱️ **ESTIMATIVA DE TEMPO**

| Tarefa | Tempo |
|--------|-------|
| Criar refs | 5 min |
| Implementar callbacks estáveis | 10 min |
| Atualizar useWebSocket | 5 min |
| Testar e validar | 10 min |
| Documentar e commit | 10 min |
| **TOTAL** | **30-45 min** |

---

## 🎯 **IMPACTO DA CORREÇÃO**

### **Antes (80%):**
```
[Atendente envia msg] → [Salva DB] → [Polling em 30s] → [Outro atendente vê]
Latência: ~30 segundos
```

### **Depois (100%):**
```
[Atendente envia msg] → [Salva DB] → [WebSocket emite] → [Outro atendente vê]
Latência: <1 segundo
```

### **Benefícios:**
- ⚡ **30x mais rápido** (30s → <1s)
- 📉 **Menos requisições HTTP** (sem polling)
- 🔄 **Sincronização perfeita** entre atendentes
- 🎯 **Experiência profissional** de atendimento

---

## 🚨 **ALTERNATIVAS (Se Não Quiser WebSocket)**

### **Opção 1: Reduzir Intervalo de Polling**
```typescript
// Trocar 30s → 5s
setInterval(() => recarregar(), 5000);
```
✅ Simples
❌ Mais carga no servidor
❌ Latência ainda é 5s

### **Opção 2: Server-Sent Events (SSE)**
```typescript
const eventSource = new EventSource('/api/atendimento/events');
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // Processar evento
};
```
✅ Mais simples que WebSocket
✅ Unidirecional (server → client)
❌ Não suporta mensagens client → server

### **Opção 3: Long Polling**
```typescript
async function longPoll() {
  const response = await fetch('/api/atendimento/poll');
  const data = await response.json();
  // Processar e chamar novamente
  longPoll();
}
```
✅ Funciona em qualquer navegador
❌ Mais complexo
❌ Mais carga no servidor

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Preparação:**
- [ ] Fazer backup do ChatOmnichannel.tsx
- [ ] Ler PROBLEMA_WEBSOCKET_LOOP.md
- [ ] Entender padrão useRef

### **Implementação:**
- [ ] Criar `callbacksRef` com useRef
- [ ] Criar useEffect para atualizar refs
- [ ] Modificar chamada do useWebSocket
- [ ] Adicionar callbacks estáveis
- [ ] Remover comentários de desabilitação

### **Validação:**
- [ ] Compilar sem erros
- [ ] Testar conexão WebSocket
- [ ] Verificar console (sem loops)
- [ ] Testar envio de mensagem
- [ ] Testar múltiplas abas
- [ ] Testar novo ticket via webhook

### **Documentação:**
- [ ] Atualizar PROBLEMA_WEBSOCKET_LOOP.md
- [ ] Marcar como resolvido
- [ ] Atualizar status: 80% → 100%

---

## 🎉 **RESULTADO ESPERADO**

Após implementar a correção:

```
┌─────────────────────────────────────────┐
│  WEBSOCKET: 100% FUNCIONAL              │
├─────────────────────────────────────────┤
│  ✅ Conexão estável                     │
│  ✅ Eventos em tempo real               │
│  ✅ Sem loops                           │
│  ✅ Múltiplas abas sincronizadas        │
│  ✅ Latência < 1 segundo                │
├─────────────────────────────────────────┤
│  SISTEMA: 100% INTEGRADO                │
└─────────────────────────────────────────┘
```

**🚀 Sistema de atendimento completo e profissional!**

---

## 📚 **DOCUMENTOS RELACIONADOS**

- `PROBLEMA_WEBSOCKET_LOOP.md` - Análise detalhada do bug
- `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts` - Hook
- `backend/src/modules/atendimento/gateways/atendimento.gateway.ts` - Gateway
- `CHAT_ENVIO_REAL_IMPLEMENTADO.md` - Documentação geral

---

**Status:** ⚠️ **Aguardando Correção (30-45 min)**  
**Impacto:** Latência de 30s → <1s  
**Dificuldade:** Média (padrão useRef)  
**Prioridade:** Alta (melhora significativa UX)
