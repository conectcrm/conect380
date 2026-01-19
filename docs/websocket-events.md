# 📡 WebSocket Gateway - Documentação de Eventos

> Escopo: eventos WebSocket do **módulo de Atendimento (Omnichannel)**.
>
> Para a documentação geral do sistema (suite all-in-one), comece por: [docs/INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)

## 📋 Índice

1. [Configuração](#-configuração)
2. [Autenticação](#-autenticação)
3. [Salas (Rooms)](#-salas-rooms)
4. [Eventos Cliente → Servidor](#-eventos-cliente--servidor)
5. [Eventos Servidor → Cliente](#-eventos-servidor--cliente)
6. [Exemplos de Uso](#-exemplos-de-uso)
7. [Boas Práticas](#-boas-práticas)
8. [Tratamento de Erros](#-tratamento-de-erros)

---

## 🔧 Configuração

### Endpoint WebSocket

```
ws://localhost:3001/atendimento
```

### Namespace

```
/atendimento
```

### Tecnologias

- **Backend**: Socket.IO (NestJS + @nestjs/websockets)
- **Frontend**: socket.io-client
- **Autenticação**: JWT (JSON Web Token)

### Instalação (Cliente)

```bash
npm install socket.io-client
```

---

## 🔐 Autenticação

### Método 1: Auth Object (Recomendado)

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3001/atendimento", {
  auth: {
    token: "SEU_JWT_TOKEN_AQUI",
  },
});
```

### Método 2: Headers

```javascript
const socket = io("http://localhost:3001/atendimento", {
  extraHeaders: {
    authorization: "Bearer SEU_JWT_TOKEN_AQUI",
  },
});
```

### Obter Token JWT

```bash
# Fazer login via API REST
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "senha": "suaSenha"
}

# Response:
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Validação

O token JWT é validado automaticamente no método `handleConnection()` do Gateway. Se o token for inválido ou estiver expirado, a conexão será rejeitada.

---

## 🏠 Salas (Rooms)

O Gateway gerencia automaticamente as seguintes salas:

> Nota (multi-tenant): o realtime é isolado por empresa. O gateway adiciona cada cliente na sala `empresa:{empresaId}` e, se for atendente, também em `empresa:{empresaId}:atendentes`. Onde este documento mencionar a sala `atendentes`, interprete como `empresa:{empresaId}:atendentes`.

### 1. Sala do Usuário

```
user:{userId}
```

- Todos os clientes conectados entram automaticamente
- Usada para notificações individuais
- Exemplo: `user:123e4567-e89b-12d3-a456-426614174000`

### 2. Sala da Empresa (Tenant)

```
empresa:{empresaId}
```

- Todos os clientes conectados entram automaticamente
- Usada para broadcasts restritos ao tenant (ex.: `ticket:novo`, `ticket:atualizado`)

### 3. Sala de Atendentes (Tenant)

```
empresa:{empresaId}:atendentes
```

- Apenas usuários com `role = 'atendente'` entram automaticamente
- Usada para notificações broadcast para todos os atendentes
- Exemplos: novos tickets, mensagens não atribuídas

### 4. Salas de Tickets

```
ticket:{ticketId}
```

- Entrada manual via evento `ticket:entrar`
- Usada para comunicação específica de um ticket
- Exemplo: `ticket:550e8400-e29b-41d4-a716-446655440000`

---

## 📤 Eventos Cliente → Servidor

### 1. `mensagem:digitando`

Notifica que o usuário está digitando uma mensagem.

**Payload:**

```typescript
{
  ticketId: string; // ID do ticket
}
```

**Exemplo:**

```javascript
socket.emit("mensagem:digitando", {
  ticketId: "550e8400-e29b-41d4-a716-446655440000",
});
```

**Comportamento:**

- Emite evento `mensagem:digitando` para todos os participantes do ticket
- Exclui o próprio cliente que emitiu

---

### 2. `ticket:entrar`

Entrar na sala de um ticket específico.

**Payload:**

```typescript
{
  ticketId: string; // ID do ticket
}
```

**Exemplo:**

```javascript
socket.emit("ticket:entrar", {
  ticketId: "550e8400-e29b-41d4-a716-446655440000",
});
```

**Comportamento:**

- Servidor valida autenticação + tenant antes de permitir o join
- Somente roles internas (atendentes/gestores/admin etc.) podem entrar na sala
- O ticket precisa existir no tenant atual (checagem via RLS usando `set_current_tenant(empresaId)`)
- Em caso de falha, o servidor retorna `success: false` e o cliente NÃO entra na sala

**Retorno (ack):**

```typescript
{ success: true; ticketId: string } | { success: false; error: string }
```

---

### 3. `ticket:sair`

Sair da sala de um ticket específico.

**Payload:**

```typescript
{
  ticketId: string; // ID do ticket
}
```

**Exemplo:**

```javascript
socket.emit("ticket:sair", {
  ticketId: "550e8400-e29b-41d4-a716-446655440000",
});
```

**Comportamento:**

- Cliente sai da sala `ticket:{ticketId}`
- Para de receber eventos específicos desse ticket

---

### 4. `atendente:status`

Alterar o status do atendente.

**Payload:**

```typescript
{
  status: "online" | "ocupado" | "ausente" | "offline";
}
```

**Exemplo:**

```javascript
socket.emit("atendente:status", {
  status: "ocupado",
});
```

**Comportamento:**

- Atualiza o status do atendente
- Emite evento `atendente:status` para todos os atendentes

---

## 📥 Eventos Servidor → Cliente

### 1. `mensagem:nova`

Nova mensagem recebida em um ticket.

**Payload:**

```typescript
{
  id: string;
  ticketId: string;
  ticketNumero: string;
  remetenteId: string;
  atendenteId?: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'arquivo';
  conteudo: string;
  metadados?: object;
  criadoEm: Date;
}
```

**Quem recebe:**

- Participantes da sala `ticket:{ticketId}`
- Se ticket sem atendente: também emite `mensagem:nao-atribuida` para atendentes

**Exemplo:**

```javascript
socket.on("mensagem:nova", (data) => {
  console.log("Nova mensagem:", data.conteudo);
  console.log("Ticket:", data.ticketNumero);
});
```

---

### 2. `mensagem:digitando`

Alguém está digitando uma mensagem.

**Payload:**

```typescript
{
  ticketId: string;
  usuarioId: string;
  usuarioNome?: string;
}
```

**Quem recebe:**

- Participantes da sala `ticket:{ticketId}` (exceto quem emitiu)

**Exemplo:**

```javascript
socket.on("mensagem:digitando", (data) => {
  console.log(`${data.usuarioNome} está digitando...`);
});
```

---

### 3. `mensagem:nao-atribuida`

Mensagem recebida em ticket sem atendente.

**Payload:**

```typescript
{
  mensagem: { ... },  // Objeto completo da mensagem
  ticket: { ... }     // Objeto completo do ticket
}
```

**Quem recebe:**

- Todos os atendentes online (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("mensagem:nao-atribuida", (data) => {
  console.log("⚠️ Mensagem sem atendente no ticket:", data.ticket.numero);
  // Exibir notificação para atendentes disponíveis
});
```

---

### 4. `ticket:novo`

Novo ticket criado no sistema.

**Payload:**

```typescript
{
  id: string;
  numero: string;
  empresaId: string;
  clienteId: string;
  canalId: string;
  filaId: string;
  atendenteId?: string;
  status: string;
  prioridade: string;
  assunto?: string;
  descricao?: string;
  criadoEm: Date;
}
```

**Quem recebe:**

- Todos os atendentes (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("ticket:novo", (data) => {
  console.log("🎫 Novo ticket:", data.numero);
  console.log("Prioridade:", data.prioridade);
  // Atualizar lista de tickets pendentes
});
```

---

### 5. `ticket:status`

Status de um ticket foi alterado.

**Payload:**

```typescript
{
  ticketId: string;
  status: 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
  ...ticket  // Dados completos do ticket
}
```

**Quem recebe:**

- Participantes da sala `ticket:{ticketId}`

**Exemplo:**

```javascript
socket.on("ticket:status", (data) => {
  console.log(`Ticket ${data.ticketId} alterado para: ${data.status}`);
  // Atualizar UI do ticket
});
```

---

### 6. `ticket:atualizado`

Dados de um ticket foram atualizados.

**Payload:**

```typescript
{
  ticketId: string;
  ...ticket  // Dados completos do ticket
}
```

**Quem recebe:**

- Todos os atendentes (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("ticket:atualizado", (data) => {
  console.log("Ticket atualizado:", data.ticketId);
  // Atualizar lista de tickets
});
```

---

### 7. `ticket:atribuido`

Ticket foi atribuído a um atendente.

**Payload:**

```typescript
{
  ticketId: string;
  atendenteId: string;
  ...ticket  // Dados completos do ticket
}
```

**Quem recebe:**

- Atendente específico (sala `user:{atendenteId}`)
- Todos os atendentes (sala `atendentes`) via `ticket:atualizado`

**Exemplo:**

```javascript
socket.on("ticket:atribuido", (data) => {
  console.log("👤 Ticket atribuído para você:", data.ticketId);
  // Notificar atendente, tocar som, etc.
});
```

---

### 8. `atendente:online`

Atendente ficou online.

**Payload:**

```typescript
{
  atendenteId: string;
  atendenteNome?: string;
  timestamp: Date;
}
```

**Quem recebe:**

- Todos os atendentes (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("atendente:online", (data) => {
  console.log(`✅ ${data.atendenteNome} ficou online`);
  // Atualizar lista de atendentes disponíveis
});
```

---

### 9. `atendente:offline`

Atendente ficou offline.

**Payload:**

```typescript
{
  atendenteId: string;
  atendenteNome?: string;
  timestamp: Date;
}
```

**Quem recebe:**

- Todos os atendentes (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("atendente:offline", (data) => {
  console.log(`⭕ ${data.atendenteNome} ficou offline`);
  // Atualizar lista de atendentes
});
```

---

### 10. `atendente:status`

Status de um atendente foi alterado.

**Payload:**

```typescript
{
  atendenteId: string;
  atendenteNome?: string;
  status: 'online' | 'ocupado' | 'ausente' | 'offline';
  timestamp: Date;
}
```

**Quem recebe:**

- Todos os atendentes (sala `atendentes`)

**Exemplo:**

```javascript
socket.on("atendente:status", (data) => {
  console.log(`${data.atendenteNome} agora está: ${data.status}`);
  // Atualizar status na interface
});
```

---

### 11. `notificacao`

Notificação genérica para o usuário.

**Payload:**

```typescript
{
  tipo: string;
  mensagem?: string;
  dados?: any;
  timestamp: Date;
}
```

**Quem recebe:**

- Usuário específico (sala `user:{userId}`) ou broadcast

**Exemplo:**

```javascript
socket.on("notificacao", (data) => {
  console.log(`🔔 [${data.tipo}] ${data.mensagem}`);
  // Exibir notificação toast/alert
});
```

---

## 💡 Exemplos de Uso

### Exemplo Completo: React + Socket.IO

```typescript
import { useEffect, useState } from "react";
import io from "socket.io-client";

function ChatComponent({ ticketId, jwtToken }) {
  const [socket, setSocket] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [digitando, setDigitando] = useState(false);

  // Conectar ao WebSocket
  useEffect(() => {
    const newSocket = io("http://localhost:3001/atendimento", {
      auth: { token: jwtToken },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Conectado ao WebSocket");

      // Entrar na sala do ticket
      newSocket.emit("ticket:entrar", { ticketId });
    });

    newSocket.on("mensagem:nova", (data) => {
      if (data.ticketId === ticketId) {
        setMensagens((prev) => [...prev, data]);
      }
    });

    newSocket.on("mensagem:digitando", (data) => {
      if (data.ticketId === ticketId) {
        setDigitando(true);
        setTimeout(() => setDigitando(false), 3000);
      }
    });

    newSocket.on("ticket:status", (data) => {
      console.log("Status alterado:", data.status);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado do WebSocket");
    });

    setSocket(newSocket);

    return () => {
      // Cleanup: sair do ticket e desconectar
      if (newSocket) {
        newSocket.emit("ticket:sair", { ticketId });
        newSocket.disconnect();
      }
    };
  }, [ticketId, jwtToken]);

  // Emitir evento "digitando"
  const handleDigitando = () => {
    if (socket) {
      socket.emit("mensagem:digitando", { ticketId });
    }
  };

  return (
    <div>
      {/* UI do chat */}
      <div className="mensagens">
        {mensagens.map((msg) => (
          <div key={msg.id}>{msg.conteudo}</div>
        ))}
        {digitando && <div className="digitando">Digitando...</div>}
      </div>

      <input type="text" onChange={handleDigitando} placeholder="Digite uma mensagem..." />
    </div>
  );
}
```

---

## ✅ Boas Práticas

### 1. Gerenciamento de Conexão

```javascript
// ✅ BOM: Sempre validar se está conectado antes de emitir
if (socket && socket.connected) {
  socket.emit("mensagem:digitando", { ticketId });
}

// ❌ RUIM: Emitir sem validar
socket.emit("mensagem:digitando", { ticketId });
```

### 2. Cleanup de Recursos

```javascript
// ✅ BOM: Limpar listeners e salas ao desmontar
useEffect(() => {
  // ... setup socket

  return () => {
    socket.emit("ticket:sair", { ticketId });
    socket.off("mensagem:nova");
    socket.off("mensagem:digitando");
    socket.disconnect();
  };
}, []);
```

### 3. Debounce em Eventos Frequentes

```javascript
// ✅ BOM: Debounce no evento "digitando"
import { debounce } from "lodash";

const emitirDigitando = debounce(() => {
  socket.emit("mensagem:digitando", { ticketId });
}, 500);

// Chamar no onChange do input
<input onChange={emitirDigitando} />;
```

### 4. Tratamento de Reconexão

```javascript
socket.on("reconnect", (attemptNumber) => {
  console.log("Reconectado após", attemptNumber, "tentativas");

  // Re-entrar nas salas necessárias
  socket.emit("ticket:entrar", { ticketId });
});
```

### 5. Logs Estruturados

```javascript
// ✅ BOM: Logs consistentes e informativos
socket.on("mensagem:nova", (data) => {
  console.log("[WebSocket] Nova mensagem recebida:", {
    ticketId: data.ticketId,
    tipo: data.tipo,
    timestamp: new Date().toISOString(),
  });
});
```

---

## ⚠️ Tratamento de Erros

### Erro de Autenticação

```javascript
socket.on("connect_error", (error) => {
  if (error.message.includes("Unauthorized") || error.message.includes("Token inválido")) {
    console.error("Token JWT inválido ou expirado");

    // Redirecionar para login ou renovar token
    window.location.href = "/login";
  }
});
```

### Erro de Conexão

```javascript
socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // Servidor desconectou (ex: token inválido)
    console.error("Desconectado pelo servidor");
  } else if (reason === "transport close") {
    // Perda de conexão de rede
    console.warn("Conexão perdida, tentando reconectar...");
  }
});
```

### Timeout de Reconexão

```javascript
const socket = io("http://localhost:3001/atendimento", {
  auth: { token },
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

socket.on("reconnect_failed", () => {
  console.error("Falha ao reconectar após múltiplas tentativas");
  // Exibir mensagem para o usuário recarregar a página
});
```

---

## 📊 Diagrama de Fluxo

```
┌─────────────┐                  ┌──────────────────┐
│   Cliente   │                  │   Gateway (WS)   │
│  (Browser)  │                  │   NestJS Server  │
└──────┬──────┘                  └────────┬─────────┘
       │                                  │
       │  1. Connect (JWT Token)          │
       │─────────────────────────────────>│
       │                                  │
       │  2. Validate JWT & Join Rooms   │
       │<─────────────────────────────────│
       │     (user:{id}, atendentes)      │
       │                                  │
       │  3. ticket:entrar {ticketId}     │
       │─────────────────────────────────>│
       │                                  │
       │  4. Join ticket:{ticketId}       │
       │<─────────────────────────────────│
       │                                  │
       │  5. mensagem:digitando           │
       │─────────────────────────────────>│
       │                                  │
       │  6. Broadcast to ticket room     │
       │<─────────────────────────────────│
       │     mensagem:digitando           │
       │                                  │
       │                   ┌──────────────┴─────────────┐
       │                   │ Controller creates message │
       │                   └──────────────┬─────────────┘
       │                                  │
       │  7. mensagem:nova                │
       │<─────────────────────────────────│
       │                                  │
       │  8. ticket:sair {ticketId}       │
       │─────────────────────────────────>│
       │                                  │
       │  9. Leave ticket:{ticketId}      │
       │<─────────────────────────────────│
       │                                  │
       │ 10. Disconnect                   │
       │─────────────────────────────────>│
       │                                  │
       │ 11. atendente:offline broadcast  │
       │<─────────────────────────────────│
       │                                  │
```

---

## 🔗 Links Úteis

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [JWT Authentication](https://jwt.io/)

---

## 📝 Notas Importantes

1. **Produção**: Em produção, configure CORS adequadamente:

   ```typescript
   @WebSocketGateway({
     cors: {
       origin: ['https://seudominio.com'],
       credentials: true,
     },
   })
   ```

2. **SSL/TLS**: Em produção com HTTPS, use `wss://` (WebSocket Secure):

   ```javascript
   const socket = io('wss://seudominio.com/atendimento', { ... });
   ```

3. **Load Balancing**: Para múltiplas instâncias do servidor, configure Redis Adapter:

   ```bash
   npm install @socket.io/redis-adapter redis
   ```

4. **Rate Limiting**: Implemente rate limiting para prevenir abuso:

   ```typescript
   // Exemplo: máximo 10 eventos "digitando" por minuto
   ```

5. **Monitoramento**: Use ferramentas como Socket.IO Admin UI para monitorar conexões

---

**Última atualização**: 11 de outubro de 2025  
**Versão**: 1.0.0  
**Autor**: Equipe ConectCRM
