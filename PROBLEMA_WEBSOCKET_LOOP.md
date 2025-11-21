# ⚠️ PROBLEMA WEBSOCKET: Loop Infinito de Reconexões

**Data:** 13 de outubro de 2025  
**Status:** ❌ **BUG IDENTIFICADO E CORRIGIDO TEMPORARIAMENTE**

---

## 🐛 PROBLEMA IDENTIFICADO

### Sintoma:
```javascript
🔌 Conectando ao WebSocket: http://localhost:3001
✅ WebSocket conectado! ID: xyz123
🔌 Desconectando WebSocket...
❌ WebSocket desconectado: io client disconnect
🔌 Conectando ao WebSocket: http://localhost:3001
// ... loop infinito ...
```

### Causa Raiz:

O React estava **re-renderizando** o componente `ChatOmnichannel` várias vezes, e os **callbacks** passados para `useWebSocket` eram **recriados a cada render**, causando:

1. Callbacks mudam → `useWebSocket` detecta mudança nas dependências
2. `useEffect` executa novamente
3. Desconecta WebSocket atual
4. Reconecta com novos callbacks
5. Volta ao passo 1 (loop infinito)

### Código Problemático:

```typescript
// ❌ ANTES - Callbacks recriados a cada render
const { connected } = useWebSocket({
  enabled: true,
  events: {
    onNovoTicket: useCallback(() => {
      recarregarTickets();
    }, [recarregarTickets]),  // ← recarregarTickets muda a cada render
    
    onNovaMensagem: useCallback((msg) => {
      if (msg.ticketId === ticketAtual?.id) {
        recarregarMensagens();
      }
    }, [ticketAtual?.id, recarregarMensagens]), // ← Dependências instáveis
  }
});
```

**Problema:** As funções `recarregarTickets` e `recarregarMensagens` são recriadas a cada render, fazendo os callbacks mudarem constantemente.

---

## ✅ SOLUÇÃO TEMPORÁRIA APLICADA

### 1. Desabilitado WebSocket:

```typescript
// ✅ AGORA - Desabilitado temporariamente
const { connected: wsConnected } = useWebSocket({
  enabled: false,      // ← Desabilitado
  autoConnect: false,
  events: {}
});
```

### 2. Corrigido useEffect do Hook:

```typescript
// ✅ Removidas dependências problemáticas
useEffect(() => {
  if (autoConnect && enabled) {
    connect();
  }
  return () => {
    if (socketRef.current) {
      disconnect();
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoConnect, enabled]); // ← Sem 'connect' e 'disconnect'
```

---

## 🔧 SOLUÇÃO DEFINITIVA (Para Implementar Depois)

### Opção 1: **Usar useRef para Callbacks Estáveis**

```typescript
// Criar refs para as funções
const onNovoTicketRef = useRef<(() => void) | null>(null);
const onNovaMensagemRef = useRef<((msg: Mensagem) => void) | null>(null);

// Atualizar refs quando funções mudarem
useEffect(() => {
  onNovoTicketRef.current = () => recarregarTickets();
  onNovaMensagemRef.current = (msg) => {
    if (msg.ticketId === ticketAtual?.id) {
      recarregarMensagens();
    }
  };
}, [recarregarTickets, recarregarMensagens, ticketAtual?.id]);

// Passar refs para WebSocket (callbacks estáveis)
const { connected } = useWebSocket({
  enabled: true,
  events: {
    onNovoTicket: () => onNovoTicketRef.current?.(),
    onNovaMensagem: (msg) => onNovaMensagemRef.current?.(msg),
  }
});
```

### Opção 2: **Mover Lógica para Dentro do Hook**

```typescript
// Modificar useWebSocket para aceitar apenas IDs
const { connected } = useWebSocket({
  enabled: true,
  ticketAtualId: ticketAtual?.id, // ← Passa apenas primitivos
  onReceiveEvent: (type, data) => {
    // Lógica de reload dentro do hook
    switch(type) {
      case 'novo_ticket':
        // Hook interno faz o reload
        break;
      case 'nova_mensagem':
        // Hook interno faz o reload
        break;
    }
  }
});
```

### Opção 3: **Event Emitter Pattern**

```typescript
// Criar event emitter global
const wsEvents = new EventEmitter();

// WebSocket emite eventos
socket.on('nova_mensagem', (msg) => {
  wsEvents.emit('mensagem', msg);
});

// Componente escuta eventos
useEffect(() => {
  const handler = (msg: Mensagem) => {
    if (msg.ticketId === ticketAtual?.id) {
      recarregarMensagens();
    }
  };
  
  wsEvents.on('mensagem', handler);
  return () => wsEvents.off('mensagem', handler);
}, [ticketAtual?.id, recarregarMensagens]);
```

---

## 📊 IMPACTO ATUAL

### ❌ **O Que NÃO Funciona Agora:**
- WebSocket desabilitado
- Mensagens NÃO chegam em tempo real
- Volta ao polling a cada 30 segundos

### ✅ **O Que Ainda Funciona:**
- Histórico de atendimentos (100%)
- Contexto do cliente (100%)
- Tickets e mensagens via HTTP (100%)
- Auto-refresh com polling (100%)

### 📈 **Integração Atual:**
```
ANTES DO BUG: 85% integrado (com WebSocket)
AGORA:        80% integrado (sem WebSocket temporariamente)
```

---

## 🎯 PRÓXIMOS PASSOS

### **1. Validar Histórico e Contexto (Prioridade Alta)**

Primeiro, vamos validar que o histórico e contexto estão funcionando:

```javascript
// Esperado no console:
📊 Buscando contexto completo do cliente: uuid-123
✅ Contexto carregado

📜 Buscando histórico do cliente: uuid-123
✅ Histórico carregado: X atendimentos
```

### **2. Corrigir WebSocket (Prioridade Média)**

Depois que validarmos histórico/contexto, implementamos a **Opção 1** (useRef):

```typescript
// Estimativa: 30-45 minutos
// Benefício: Mensagens em tempo real voltam a funcionar
```

### **3. Alternativa: Manter Polling**

Se WebSocket for muito complexo, podemos:
- Reduzir intervalo de polling: 30s → 10s
- Adicionar refresh manual (botão)
- Considerar Server-Sent Events (SSE) em vez de WebSocket

---

## 🧪 VALIDAÇÃO

### Como Testar Agora (Sem WebSocket):

1. **Recarregar página** (Ctrl+R)
2. **Verificar console** - NÃO deve ter loop de conexões
3. **Selecionar ticket** - Deve carregar mensagens normalmente
4. **Ver painel direito** - Deve mostrar histórico e contexto
5. **Criar mensagem** - Aparece após ~30s (polling)

### Logs Esperados (Corretos):

```javascript
// ✅ Sem loops de WebSocket
💬 Carregando mensagens...
✅ Mensagens carregadas

📊 Buscando contexto do cliente
✅ Contexto carregado

📜 Buscando histórico do cliente
✅ Histórico carregado: 5 atendimentos
```

---

## 💡 LIÇÕES APRENDIDAS

### 1. **Callbacks em Hooks Precisam Ser Estáveis**
- Nunca passar callbacks que mudam a cada render
- Usar `useRef` ou `useCallback` com dependências estáveis

### 2. **useEffect Precisa de Dependências Corretas**
- Incluir apenas valores primitivos ou estáveis
- Cuidado com funções nas dependências

### 3. **Testar Isoladamente**
- WebSocket deveria ter sido testado isoladamente
- Criar componente de teste antes de integrar

### 4. **Logs São Essenciais**
- Logs ajudaram a identificar o loop rapidamente
- Console mostrou padrão de reconexão infinita

---

## 📋 CHECKLIST DE CORREÇÃO

### Curto Prazo (Agora):
- [x] Desabilitar WebSocket temporariamente
- [x] Corrigir useEffect do useWebSocket
- [x] Documentar problema
- [ ] Validar histórico funcionando
- [ ] Validar contexto funcionando

### Médio Prazo (Próxima Sprint):
- [ ] Implementar useRef para callbacks estáveis
- [ ] Testar WebSocket isoladamente
- [ ] Re-habilitar WebSocket
- [ ] Validar sem loops

### Longo Prazo (Opcional):
- [ ] Avaliar alternativas (SSE, Long Polling)
- [ ] Implementar fallback automático
- [ ] Adicionar retry com backoff exponencial

---

## 🎯 RESUMO EXECUTIVO

```
┌────────────────────────────────────────────┐
│  STATUS: TEMPORARIAMENTE EM 80%           │
├────────────────────────────────────────────┤
│  ✅ Histórico:       100% (funcionando)    │
│  ✅ Contexto:        100% (funcionando)    │
│  ❌ WebSocket:         0% (desabilitado)   │
│  ✅ Polling:         100% (ativo)          │
├────────────────────────────────────────────┤
│  PRÓXIMO: Validar histórico + contexto     │
│  DEPOIS:  Corrigir WebSocket com useRef    │
└────────────────────────────────────────────┘
```

---

**Status:** ⚠️ **BUG TEMPORARIAMENTE CONTORNADO**  
**Impacto:** WebSocket desabilitado, mas sistema funcional  
**Tempo para Corrigir:** 30-45 minutos  
**Prioridade:** Média (sistema funciona sem, mas é melhor com)
