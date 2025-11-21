# 🔌 WebSocket: Resumo do Que Falta

## 📊 Status: **80% → Faltam 20%**

---

## ✅ **O QUE JÁ FUNCIONA (80%)**

```
✅ Backend Gateway 100% pronto
✅ Hook useWebSocket criado
✅ Conexão + autenticação JWT
✅ Eventos implementados
✅ Integração no MensagemService
✅ useEffect corrigido (sem loops)
```

---

## ❌ **O QUE FALTA (20%)**

### **PROBLEMA ÚNICO: Callbacks Instáveis**

```typescript
// ❌ ATUAL - Desabilitado por causa de loop
const { connected } = useWebSocket({
  enabled: false,  // ← Desabilitado
  events: {}
});

// Causa: Callbacks mudam a cada render → loop infinito
```

---

## 🔧 **SOLUÇÃO: 3 Linhas de Código**

### **1. Criar Ref**
```typescript
const callbacksRef = useRef({
  recarregarTickets: () => {},
  recarregarMensagens: () => {},
  ticketAtualId: null,
});
```

### **2. Atualizar Ref**
```typescript
useEffect(() => {
  callbacksRef.current = {
    recarregarTickets: () => { /* lógica */ },
    recarregarMensagens: () => { /* lógica */ },
    ticketAtualId: ticketSelecionado?.id,
  };
}, [ticketSelecionado]);
```

### **3. Usar Ref no WebSocket**
```typescript
const { connected } = useWebSocket({
  enabled: true,  // ✅ Re-habilitar
  events: {
    onNovoTicket: () => callbacksRef.current.recarregarTickets(),
    onNovaMensagem: (msg) => {
      if (msg.ticketId === callbacksRef.current.ticketAtualId) {
        callbacksRef.current.recarregarMensagens();
      }
    }
  }
});
```

---

## ⏱️ **TEMPO: 30-45 minutos**

| Tarefa | Tempo |
|--------|-------|
| Criar refs + callbacks | 15 min |
| Re-habilitar WebSocket | 5 min |
| Testar (sem loops) | 10 min |
| Documentar | 10 min |

---

## 🎯 **IMPACTO DA CORREÇÃO**

### **ANTES (80%):**
```
[Mensagem enviada] → Polling em 30s → [Atualiza interface]
Latência: ~30 segundos
```

### **DEPOIS (100%):**
```
[Mensagem enviada] → WebSocket instantâneo → [Atualiza interface]
Latência: <1 segundo
```

**📈 30x mais rápido!**

---

## 🧪 **COMO VALIDAR**

### ✅ **Sucesso:**
```
🔌 Conectando ao WebSocket...
✅ WebSocket conectado!
💬 Nova mensagem via WebSocket
// SEM loops de desconexão
```

### ❌ **Falhou:**
```
🔌 Conectando...
✅ Conectado
🔌 Desconectando...
❌ Desconectado
// Loop infinito = callbacks instáveis ainda
```

---

## 📚 **ARQUIVOS ENVOLVIDOS**

**Frontend:**
- `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx` (modificar)
- `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts` (já OK)

**Backend:**
- `backend/src/modules/atendimento/gateways/atendimento.gateway.ts` (já OK)
- `backend/src/modules/atendimento/services/mensagem.service.ts` (já OK)

**✅ Backend 100% pronto, só falta frontend!**

---

## 🚨 **ALTERNATIVA SIMPLES**

Se não quiser corrigir WebSocket agora:

### **Reduzir polling de 30s → 5s**
```typescript
// Trocar intervalo
setInterval(() => recarregar(), 5000); // 5s em vez de 30s
```

✅ Mudança de 1 linha
❌ Latência ainda é 5s
❌ Mais requisições HTTP

---

## 🎉 **RESUMO**

```
┌────────────────────────────────────┐
│  PARA 100%: Corrigir Callbacks     │
├────────────────────────────────────┤
│  ⏱️  Tempo: 30-45 min              │
│  🔧 Código: useRef pattern         │
│  📈 Ganho: 30x mais rápido         │
│  🎯 Arquivo: ChatOmnichannel.tsx   │
└────────────────────────────────────┘
```

**Documentação completa:** `WEBSOCKET_O_QUE_FALTA.md`
