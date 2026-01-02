# 🔄 Correção: Scroll Automático Inteligente

## ❌ PROBLEMA

Quando mensagens chegavam em tempo real, o chat **sempre** rolava automaticamente para o final, mesmo quando o usuário estava lendo mensagens antigas.

**Comportamento Indesejado:**
```
Usuário lendo mensagem de ontem
         ↓
Nova mensagem chega em tempo real
         ↓
Chat rola automaticamente para o final ❌
         ↓
Usuário perde a posição de leitura
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

**Scroll Inteligente** - Rola automaticamente apenas quando faz sentido:

### 🎯 Regras do Scroll Automático

O chat só rola automaticamente se:

1. **✅ Usuário acabou de enviar mensagem**
   - Quando você envia, sempre rola para ver sua mensagem

2. **✅ Usuário está perto do final** (menos de 100px)
   - Se já está vendo as últimas mensagens, continua acompanhando

3. **✅ Primeira carga de mensagens** (≤ 10 mensagens)
   - Quando abre o chat, centraliza nas últimas mensagens

### ❌ NÃO rola automaticamente se:

- Usuário está lendo mensagens antigas (scroll para cima)
- Usuário está no meio da conversa
- Nova mensagem chega, mas usuário não está próximo do final

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

**Arquivo:** `frontend-web/src/features/atendimento/omnichannel/components/ChatArea.tsx`

### 1. Refs Adicionadas

```typescript
const messagesContainerRef = useRef<HTMLDivElement>(null);
const ultimaMensagemCountRef = useRef(mensagens.length);
const foiEnviadaPeloUsuarioRef = useRef(false);
```

### 2. Lógica de Scroll Inteligente

```typescript
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  // Calcular distância do final
  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanciaDoFinal = scrollHeight - scrollTop - clientHeight;
  
  // Verificar se nova mensagem foi adicionada
  const novaMensagemAdicionada = mensagens.length > ultimaMensagemCountRef.current;
  ultimaMensagemCountRef.current = mensagens.length;

  // 🎯 Decidir se deve rolar
  const usuarioEstaPróximoDoFinal = distanciaDoFinal < 100;
  const deveRolar = 
    foiEnviadaPeloUsuarioRef.current ||      // Usuário enviou
    usuarioEstaPróximoDoFinal ||             // Está perto do final
    mensagens.length <= 10;                  // Primeira carga

  if (novaMensagemAdicionada && deveRolar) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Resetar flag
  foiEnviadaPeloUsuarioRef.current = false;
}, [mensagens, estaDigitando]);
```

### 3. Marcar Quando Usuário Envia

```typescript
const handleEnviar = () => {
  if (mensagemAtual.trim()) {
    // ✅ Marcar que foi o usuário que enviou
    foiEnviadaPeloUsuarioRef.current = true;
    onEnviarMensagem(mensagemAtual);
    setMensagemAtual('');
  }
};
```

### 4. Adicionar Ref no Container

```tsx
<div 
  ref={messagesContainerRef}  // ✅ Ref para medir scroll
  className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
>
  {/* mensagens */}
</div>
```

---

## 🧪 TESTES

### Cenário 1: Usuário Envia Mensagem ✅
```
1. Digitar "Olá"
2. Pressionar Enter
3. ✅ Chat rola para mostrar mensagem enviada
```

### Cenário 2: Mensagem Chega Quando Está no Final ✅
```
1. Estar visualizando últimas mensagens
2. Nova mensagem chega
3. ✅ Chat rola automaticamente para mostrar nova mensagem
```

### Cenário 3: Mensagem Chega Quando Está Lendo Histórico ✅
```
1. Rolar para cima para ler mensagens antigas
2. Nova mensagem chega
3. ✅ Chat NÃO rola (mantém posição de leitura)
```

### Cenário 4: Primeira Abertura do Chat ✅
```
1. Abrir conversa pela primeira vez
2. ✅ Chat rola para mostrar últimas mensagens
```

---

## 📊 Comportamento Comparado

### ❌ ANTES (Scroll Sempre)

| Situação | Comportamento |
|----------|---------------|
| Usuário envia mensagem | ✅ Rola para final |
| Nova mensagem (usuário no final) | ✅ Rola para final |
| Nova mensagem (usuário lendo histórico) | ❌ Rola para final (RUIM) |
| Primeira abertura | ✅ Rola para final |

### ✅ DEPOIS (Scroll Inteligente)

| Situação | Comportamento |
|----------|---------------|
| Usuário envia mensagem | ✅ Rola para final |
| Nova mensagem (usuário no final) | ✅ Rola para final |
| Nova mensagem (usuário lendo histórico) | ✅ Mantém posição (BOM) |
| Primeira abertura | ✅ Rola para final |

---

## 🎯 CONFIGURAÇÕES AJUSTÁVEIS

### Distância do Final (threshold)

```typescript
const usuarioEstaPróximoDoFinal = distanciaDoFinal < 100;
//                                                      ^^^
//                                                      Ajuste este valor
```

**Valores sugeridos:**
- `50` - Muito sensível (rola fácil)
- `100` - Balanceado ✅ (recomendado)
- `200` - Tolerante (difícil de rolar)

### Limite de Primeira Carga

```typescript
mensagens.length <= 10
//                  ^^
//                  Ajuste este valor
```

**Valores sugeridos:**
- `5` - Apenas para chats muito novos
- `10` - Balanceado ✅ (recomendado)
- `20` - Mais tolerante para chats curtos

---

## 🔍 DEBUG

Para verificar o comportamento:

```typescript
// Adicionar logs temporários no useEffect
console.log('📊 Scroll Info:', {
  distanciaDoFinal,
  usuarioEstaPróximoDoFinal,
  novaMensagemAdicionada,
  foiEnviadaPeloUsuario: foiEnviadaPeloUsuarioRef.current,
  deveRolar
});
```

---

## 💡 MELHORIAS FUTURAS (OPCIONAL)

### 1. Botão "Voltar ao Final"

Quando usuário está lendo histórico, mostrar botão flutuante:

```tsx
{!usuarioEstaPróximoDoFinal && (
  <button 
    onClick={() => messagesEndRef.current?.scrollIntoView()}
    className="fixed bottom-20 right-10 bg-blue-500 text-white p-3 rounded-full"
  >
    ↓ Ir para final
  </button>
)}
```

### 2. Indicador de Novas Mensagens

```tsx
{mensagensNaoLidas > 0 && (
  <div className="fixed bottom-20 right-10 bg-red-500 text-white px-3 py-1 rounded-full">
    {mensagensNaoLidas} novas
  </div>
)}
```

### 3. Scroll Suave com Animação

```typescript
messagesEndRef.current?.scrollIntoView({ 
  behavior: 'smooth',
  block: 'end',
  inline: 'nearest'
});
```

---

## ✅ RESULTADO

**Antes:**
- ❌ Scroll sempre automático
- ❌ Perdia posição ao ler histórico
- ❌ UX ruim para conversas longas

**Depois:**
- ✅ Scroll inteligente e contextual
- ✅ Mantém posição ao ler histórico
- ✅ UX profissional e suave
- ✅ Comportamento similar a WhatsApp Web

---

**Status:** ✅ IMPLEMENTADO E TESTADO  
**Data:** 14/10/2025  
**Arquivo:** `frontend-web/src/features/atendimento/omnichannel/components/ChatArea.tsx`
