# Frontend Chat em Tempo Real - Documentação

## 📦 Componentes Criados

### 1. Hooks

#### `useWebSocket.ts`
Hook para gerenciar conexão WebSocket com o backend.

**Recursos:**
- Auto-conexão com JWT
- Gerenciamento de estado (connected, connecting, error)
- Event handlers (on/off)
- Emit com validação
- Reconnection automática

**Exemplo de uso:**
```typescript
const { connected, emit, on, off } = useWebSocket({
  url: 'http://localhost:3001/atendimento',
  token: userToken,
  onConnect: () => console.log('Conectado!'),
  onDisconnect: (reason) => console.log('Desconectado:', reason),
});
```

#### `useChat.ts`
Hook de alto nível para gerenciar chat com WebSocket.

**Recursos:**
- Gerenciamento de mensagens
- Gerenciamento de tickets
- Lista de atendentes online
- Indicador "digitando..."
- Métodos: `entrarTicket()`, `sairTicket()`, `emitirDigitando()`, `alterarStatus()`

**Exemplo de uso:**
```typescript
const chat = useChat({
  token: userToken,
  ticketId: activeTicketId,
  onNovaMensagem: (msg) => console.log('Nova mensagem:', msg),
  onNovoTicket: (ticket) => console.log('Novo ticket:', ticket),
});
```

### 2. Componentes React

#### `ChatWindow`
Container principal do chat.

**Props:**
- `token: string` - JWT token para autenticação

**Recursos:**
- Indicador de conexão (online/offline/conectando)
- Layout responsivo com sidebar + área principal
- Gerenciamento de ticket ativo
- Integração com useChat hook

#### `TicketList`
Sidebar com lista de tickets.

**Props:**
- `tickets: Ticket[]` - Lista de tickets
- `activeTicketId: string | null` - ID do ticket ativo
- `onTicketSelect: (ticketId: string) => void` - Callback ao selecionar ticket

**Recursos:**
- Filtros por status (todos, abertos, em atendimento)
- Badge de contador
- Indicador de prioridade (🔴 alta, 🟡 média, 🟢 baixa)
- Formatação de tempo relativo
- Destaque visual do ticket ativo

#### `MessageList`
Área de mensagens do ticket.

**Props:**
- `mensagens: Mensagem[]` - Lista de mensagens
- `ticketId: string` - ID do ticket atual

**Recursos:**
- Agrupamento por data (Hoje, Ontem, DD de MMM)
- Auto-scroll para última mensagem
- Suporte a múltiplos tipos: TEXTO, IMAGEM, AUDIO, VIDEO, ARQUIVO
- Alinhamento por direção (enviada/recebida)
- Timestamp em cada mensagem

#### `MessageInput`
Input para enviar mensagens.

**Props:**
- `ticketId: string` - ID do ticket
- `onTyping: () => void` - Callback ao digitar

**Recursos:**
- Textarea com auto-resize
- Envio com Enter (Shift+Enter para quebrar linha)
- Emissão de evento "digitando" com debounce (500ms)
- Feedback visual de envio
- Tratamento de erros

#### `TypingIndicator`
Indicador "fulano está digitando..."

**Props:**
- `usuarioNome?: string` - Nome do usuário digitando

**Recursos:**
- Animação de bolinhas
- Exibição do nome do usuário (se disponível)

## 🚀 Como Usar

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` no frontend:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEBSOCKET_URL=http://localhost:3001/atendimento
```

### 2. Adicionar rota no App

```typescript
import { AtendimentoPage } from './pages/AtendimentoPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/atendimento" element={<AtendimentoPage />} />
        {/* outras rotas */}
      </Routes>
    </Router>
  );
}
```

### 3. Uso Básico

```typescript
import { ChatWindow } from './components/chat';

function AtendimentoPage() {
  const { token } = useAuth(); // ou localStorage.getItem('authToken')
  
  return <ChatWindow token={token} />;
}
```

### 4. Uso Avançado (com hook direto)

```typescript
import { useChat } from './hooks/useChat';

function CustomChatPage() {
  const [activeTicket, setActiveTicket] = useState(null);
  
  const chat = useChat({
    token: userToken,
    ticketId: activeTicket?.id,
    onNovaMensagem: (msg) => {
      // Mostrar notificação
      toast.success('Nova mensagem recebida!');
    },
    onNovoTicket: (ticket) => {
      // Adicionar à lista
      setTickets(prev => [ticket, ...prev]);
    },
  });
  
  return (
    <div>
      <h1>Tickets: {chat.tickets.length}</h1>
      <h2>Conectado: {chat.connected ? 'Sim' : 'Não'}</h2>
      
      {chat.tickets.map(ticket => (
        <div key={ticket.id} onClick={() => setActiveTicket(ticket)}>
          {ticket.numero}
        </div>
      ))}
      
      {activeTicket && (
        <div>
          {chat.mensagens
            .filter(m => m.ticketId === activeTicket.id)
            .map(msg => (
              <div key={msg.id}>{msg.conteudo}</div>
            ))
          }
        </div>
      )}
    </div>
  );
}
```

## 🔌 Eventos WebSocket

### Eventos Emitidos (Frontend → Backend)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `ticket:entrar` | `{ ticketId: string }` | Entrar na sala de um ticket |
| `ticket:sair` | `{ ticketId: string }` | Sair da sala de um ticket |
| `mensagem:digitando` | `{ ticketId: string }` | Indicar que está digitando |
| `atendente:status` | `{ status: 'online'\|'ocupado'\|'ausente'\|'offline' }` | Alterar status do atendente |

### Eventos Recebidos (Backend → Frontend)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `mensagem:nova` | `Mensagem` | Nova mensagem recebida |
| `mensagem:digitando` | `{ ticketId, usuarioNome }` | Alguém está digitando |
| `mensagem:nao-atribuida` | `{ mensagem, ticket }` | Mensagem sem atendente |
| `ticket:novo` | `Ticket` | Novo ticket criado |
| `ticket:status` | `{ ticketId, status }` | Status do ticket alterado |
| `ticket:atualizado` | `Ticket` | Ticket atualizado |
| `ticket:atribuido` | `{ ticketId, atendenteId }` | Ticket atribuído |
| `atendente:online` | `Atendente` | Atendente ficou online |
| `atendente:offline` | `Atendente` | Atendente ficou offline |
| `atendente:status` | `Atendente` | Status do atendente mudou |
| `notificacao` | `{ tipo, mensagem }` | Notificação genérica |

## 📊 Fluxo de Dados

```
1. Usuário acessa /atendimento
   ↓
2. ChatWindow renderiza com token
   ↓
3. useChat conecta ao WebSocket (auto-connect)
   ↓
4. Backend autentica JWT e adiciona à sala
   ↓
5. Frontend recebe lista de tickets (via API REST)
   ↓
6. Usuário seleciona ticket
   ↓
7. Frontend emite "ticket:entrar"
   ↓
8. Backend adiciona cliente à sala do ticket
   ↓
9. Frontend recebe mensagens em tempo real
   ↓
10. Usuário digita mensagem
    ↓
11. Frontend emite "mensagem:digitando" (debounce 500ms)
    ↓
12. Outros clientes recebem indicador "digitando..."
    ↓
13. Usuário envia mensagem (POST /mensagens)
    ↓
14. Backend salva no DB e emite "mensagem:nova" via WebSocket
    ↓
15. Todos os clientes da sala recebem a mensagem
```

## 🎨 Customização de Estilos

Os componentes usam Tailwind CSS. Para customizar:

```tsx
// Alterar cores do indicador de conexão
<div className="bg-green-500 text-white"> {/* online */}
<div className="bg-yellow-500 text-white"> {/* conectando */}
<div className="bg-red-500 text-white"> {/* offline */}

// Alterar largura da sidebar
<div className="w-80 bg-white"> {/* 320px */}

// Alterar cores das mensagens
<div className="bg-white text-gray-900"> {/* recebida */}
<div className="bg-blue-600 text-white"> {/* enviada */}
```

## 🧪 Testes

### Teste Manual

1. Abra duas abas do navegador
2. Faça login com usuários diferentes
3. Abra o mesmo ticket nas duas abas
4. Envie mensagens e observe em tempo real
5. Digite em uma aba e veja o indicador "digitando..." na outra

### Teste com Cliente Node.js

Use o arquivo `backend/test-websocket-client.js`:

```bash
cd backend
node test-websocket-client.js
```

## 🔧 Troubleshooting

### Conexão não estabelece

1. Verificar se backend está rodando (porta 3001)
2. Verificar se token JWT é válido
3. Verificar CORS no backend
4. Verificar console do navegador para erros

### Mensagens não aparecem em tempo real

1. Verificar se entrou na sala do ticket (`ticket:entrar`)
2. Verificar logs do backend (deve mostrar "Cliente entrou na sala")
3. Verificar se listeners estão registrados (`on('mensagem:nova')`)

### Indicador "digitando..." não funciona

1. Verificar se evento `mensagem:digitando` está sendo emitido
2. Verificar debounce (timeout de 500ms)
3. Verificar se está na mesma sala do ticket

## 📝 TODO / Próximos Passos

- [ ] Adicionar upload de arquivos
- [ ] Adicionar emoji picker
- [ ] Adicionar busca de mensagens
- [ ] Adicionar filtros avançados de tickets
- [ ] Adicionar transferência de ticket
- [ ] Adicionar tags
- [ ] Adicionar histórico de atendimentos
- [ ] Adicionar métricas em tempo real
- [ ] Adicionar notificações de desktop (Notification API)
- [ ] Adicionar som de notificação
- [ ] Adicionar modo escuro
- [ ] Adicionar testes unitários (Jest + React Testing Library)
- [ ] Adicionar testes E2E (Playwright)

## 🤝 Integração com Backend

O frontend espera as seguintes APIs REST:

### GET /mensagens?ticketId=:id
Retorna mensagens de um ticket.

### POST /mensagens
Cria uma nova mensagem.

**Body:**
```json
{
  "ticketId": "uuid",
  "tipo": "TEXTO",
  "conteudo": "mensagem",
  "direcao": "enviada"
}
```

### GET /tickets
Retorna lista de tickets.

### WebSocket /atendimento
Gateway WebSocket para comunicação em tempo real.

**Autenticação:**
```javascript
io('http://localhost:3001/atendimento', {
  auth: { token: 'JWT_TOKEN' }
});
```

## 📄 Licença

Este código faz parte do sistema ConectCRM.
