# 📖 Módulo Omnichannel - Frontend

**Localização**: `frontend-web/src/features/atendimento/omnichannel/`  
**Versão**: 1.0.0  
**Última Atualização**: 11 de dezembro de 2025

---

## 🎯 Visão Geral

Módulo frontend responsável pela interface de chat omnichannel do ConectCRM. Permite que atendentes gerenciem conversas em tempo real de múltiplos canais (WhatsApp, Email, Chat Web) em uma única interface unificada.

### Features Implementadas

- ✅ Chat em tempo real via WebSocket
- ✅ Indicador "digitando..." entre atendentes
- ✅ Envio/recebimento de mensagens de texto
- ✅ Upload de arquivos (imagens, documentos, áudio)
- ✅ Gestão de tickets (visualizar, atribuir, transferir)
- ✅ Estados de carregamento e erro
- ✅ Responsividade mobile-first
- ✅ Design seguindo tema Crevasse

---

## 📁 Estrutura de Pastas

```
omnichannel/
├── components/                    # Componentes React
│   ├── ChatArea.tsx              # Área principal de chat
│   ├── ChatInput.tsx             # Input de mensagem
│   ├── MensagemCard.tsx          # Card de mensagem
│   ├── TicketCard.tsx            # Card de ticket
│   ├── TicketList.tsx            # Lista de tickets
│   ├── TicketHeader.tsx          # Cabeçalho do ticket
│   └── TypingIndicator.tsx       # Indicador "digitando..."
│
├── hooks/                         # Custom hooks
│   ├── useWebSocket.ts           # Hook WebSocket
│   ├── useAtendimentos.ts        # Hook de atendimentos
│   └── useTickets.ts             # Hook de tickets
│
├── services/                      # API services
│   ├── atendimentoService.ts     # Chamadas HTTP
│   └── ticketService.ts          # Chamadas específicas
│
├── stores/                        # State management
│   └── atendimentoStore.ts       # Zustand store
│
├── types/                         # TypeScript types
│   ├── Ticket.ts                 # Interface Ticket
│   ├── Mensagem.ts               # Interface Mensagem
│   └── Atendente.ts              # Interface Atendente
│
├── utils/                         # Utilitários
│   ├── statusUtils.ts            # Helpers de status
│   └── formatters.ts             # Formatadores
│
├── styles/                        # CSS módulos (se houver)
│   └── chat.css
│
└── ChatOmnichannel.tsx           # Componente raiz
```

---

## 🚀 Como Usar

### Importar e Usar

```typescript
import ChatOmnichannel from '../features/atendimento/omnichannel/ChatOmnichannel';

function App() {
  return (
    <Routes>
      <Route path="/atendimento/chat" element={<ChatOmnichannel />} />
    </Routes>
  );
}
```

### Registrar no Menu

```typescript
// frontend-web/src/config/menuConfig.ts
{
  id: 'atendimento-chat',
  title: 'Chat Omnichannel',
  path: '/atendimento/chat',
  icon: MessageSquare,
  parent: 'atendimento',
}
```

---

## 🔌 Hooks Disponíveis

### useWebSocket

Hook para gerenciar conexão WebSocket e eventos em tempo real.

```typescript
import { useWebSocket } from './hooks/useWebSocket';

const MyComponent = () => {
  const { 
    isConnected,
    entrarTicket,
    sairTicket,
    enviarMensagem,
    onNovaMensagem,
    onUsuarioDigitando 
  } = useWebSocket();

  useEffect(() => {
    onNovaMensagem((mensagem) => {
      console.log('Nova mensagem:', mensagem);
    });

    onUsuarioDigitando((data) => {
      console.log(`${data.nome} está digitando...`);
    });
  }, []);

  const handleEnviar = () => {
    enviarMensagem(ticketId, { conteudo: 'Olá!' });
  };

  return (
    <div>
      {isConnected ? '✅ Conectado' : '❌ Desconectado'}
    </div>
  );
};
```

**API**:

- `isConnected: boolean` - Status da conexão WebSocket
- `entrarTicket(ticketId: string)` - Entrar na sala de um ticket
- `sairTicket(ticketId: string)` - Sair da sala de um ticket
- `enviarMensagem(ticketId: string, mensagem: any)` - Enviar mensagem via WebSocket
- `onNovaMensagem(callback)` - Registrar callback para nova mensagem
- `onUsuarioDigitando(callback)` - Registrar callback para "digitando..."

---

### useAtendimentos

Hook para gerenciar lista de atendimentos (tickets).

```typescript
import { useAtendimentos } from './hooks/useAtendimentos';

const MyComponent = () => {
  const { tickets, loading, error, carregarTickets, atualizarTicket } = useAtendimentos();

  useEffect(() => {
    carregarTickets({ status: 'ABERTO' });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <ul>
      {tickets.map(ticket => (
        <li key={ticket.id}>{ticket.contato_nome}</li>
      ))}
    </ul>
  );
};
```

**API**:

- `tickets: Ticket[]` - Lista de tickets
- `loading: boolean` - Estado de carregamento
- `error: string | null` - Mensagem de erro (se houver)
- `carregarTickets(filtros?)` - Buscar tickets da API
- `atualizarTicket(ticketId, dados)` - Atualizar ticket

---

### useTickets

Hook simplificado para gerenciar estado local de tickets.

```typescript
const { ticketSelecionado, selecionarTicket, mensagens, adicionarMensagem } = useTickets();
```

---

## 📦 Services

### atendimentoService

Service principal para chamadas HTTP à API.

```typescript
import { atendimentoService } from './services/atendimentoService';

// Listar tickets
const tickets = await atendimentoService.listarTickets({ status: 'ABERTO' });

// Buscar ticket específico
const ticket = await atendimentoService.buscarTicket('ticket-id-123');

// Criar novo ticket
const novoTicket = await atendimentoService.criarTicket({
  contato_nome: 'João Silva',
  contato_telefone: '5511999998888',
  empresaId: 'empresa-123',
});

// Atribuir ticket
const ticketAtribuido = await atendimentoService.atribuirTicket('ticket-id', 'atendente-id');

// Listar mensagens de um ticket
const mensagens = await atendimentoService.listarMensagens('ticket-id');

// Enviar mensagem
const mensagem = await atendimentoService.enviarMensagem('ticket-id', {
  conteudo: 'Olá, como posso ajudar?',
  tipo: 'texto',
});

// Upload de arquivo
const arquivo = await atendimentoService.uploadArquivo(
  file,
  'ticket-id',
  (progress) => console.log(`Progresso: ${progress}%`)
);
```

---

## 🎨 Componentes

### ChatOmnichannel (Raiz)

Componente principal que une todos os sub-componentes.

**Props**: Nenhuma (usa context/hooks internamente)

**Estrutura**:
```
┌─────────────────────────────────────────┐
│  ChatOmnichannel                        │
│  ┌────────────┬─────────────────────┐   │
│  │            │                     │   │
│  │  TicketList│  TicketHeader       │   │
│  │            │                     │   │
│  │            ├─────────────────────┤   │
│  │            │                     │   │
│  │            │  ChatArea           │   │
│  │            │                     │   │
│  │            ├─────────────────────┤   │
│  │            │  ChatInput          │   │
│  └────────────┴─────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### TicketList

Lista de tickets na sidebar.

**Props**:
```typescript
interface TicketListProps {
  tickets: Ticket[];
  ticketSelecionado: string | null;
  onSelecionar: (ticketId: string) => void;
  loading?: boolean;
}
```

**Uso**:
```typescript
<TicketList
  tickets={tickets}
  ticketSelecionado={ticketAtual}
  onSelecionar={(id) => setTicketAtual(id)}
  loading={loading}
/>
```

---

### ChatArea

Área principal de mensagens.

**Props**:
```typescript
interface ChatAreaProps {
  ticketId: string;
  onEnviarMensagem: (mensagem: any) => void;
  isConnected: boolean;
}
```

**Features**:
- Scroll automático ao receber nova mensagem
- Lazy loading de mensagens antigas (scroll to top)
- Indicador "digitando..." de outros atendentes
- Estados de loading/error

---

### MensagemCard

Card de mensagem individual.

**Props**:
```typescript
interface MensagemCardProps {
  mensagem: Mensagem;
  isOwn: boolean; // Se é mensagem do próprio usuário
}
```

**Renderização Condicional**:
- **Texto**: `<p>{mensagem.conteudo}</p>`
- **Imagem**: `<img src={mensagem.arquivoUrl} />`
- **Áudio**: `<audio controls src={mensagem.arquivoUrl} />`
- **Documento**: `<a href={mensagem.arquivoUrl}>Download</a>`

---

### ChatInput

Input de mensagem com suporte a arquivos.

**Props**:
```typescript
interface ChatInputProps {
  onEnviar: (dados: { conteudo?: string; arquivo?: File }) => void;
  disabled?: boolean;
}
```

**Features**:
- Textarea auto-resize
- Botão de anexar arquivo
- Preview de arquivo selecionado
- Atalho `Ctrl+Enter` para enviar
- Emoji picker (opcional)

---

### TypingIndicator

Indicador de "digitando...".

**Props**:
```typescript
interface TypingIndicatorProps {
  usuarios: { id: string; nome: string }[];
}
```

**Renderização**:
```
João Silva está digitando...
João Silva e Maria Santos estão digitando...
João Silva, Maria Santos e mais 2 estão digitando...
```

---

## 🎨 Design System

### Paleta de Cores (Tema Crevasse)

```typescript
const CREVASSE_THEME = {
  primary: '#159A9C',        // Teal - Cor principal
  primaryHover: '#0F7B7D',   // Hover do primary
  text: '#002333',           // Texto principal
  textSecondary: '#B4BEC9',  // Texto secundário
  background: '#FFFFFF',     // Fundo principal
  backgroundSecondary: '#DEEFE7', // Fundos secundários
  border: '#B4BEC9',         // Bordas padrão
  borderLight: '#DEEFE7'     // Bordas claras
};
```

### Componentes Base

```typescript
// Botão Primário
<button className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors">
  Enviar
</button>

// Botão Secundário
<button className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50">
  Cancelar
</button>

// Input
<input 
  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
  placeholder="Digite aqui..."
/>

// Badge de Status
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>
```

---

## 📱 Responsividade

### Breakpoints

```typescript
// Mobile: 0-767px
// Tablet: 768px-1023px
// Desktop: 1024px+

// Uso com Tailwind:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Layout Responsivo

**Desktop** (>=1024px):
```
┌──────────┬────────────────────────┐
│          │                        │
│  Sidebar │  Chat Area             │
│  (320px) │                        │
│          │                        │
└──────────┴────────────────────────┘
```

**Mobile** (<768px):
```
┌────────────────────────┐
│  Ticket List           │
│  (fullscreen)          │
│                        │
│  [Clica em ticket]     │
│  ↓                     │
│  Chat Area             │
│  (fullscreen)          │
│  [Botão voltar]        │
└────────────────────────┘
```

---

## 🐛 Debugging

### Habilitar Logs de Debug

```typescript
// localStorage
localStorage.setItem('DEBUG_WEBSOCKET', 'true');

// No código
if (localStorage.getItem('DEBUG_WEBSOCKET')) {
  console.log('[WebSocket] Evento:', event, data);
}
```

### DevTools do Socket.IO

```bash
# Instalar extensão
# Chrome: Socket.IO Debug Tool
# Firefox: Socket.IO Monitor
```

### React DevTools

Inspecionar hooks e state:
- Instalar React DevTools (extensão browser)
- Inspecionar componente `ChatOmnichannel`
- Ver estado de `useWebSocket`, `useAtendimentos`

---

## 🧪 Testes

### Testar Componente

```typescript
// __tests__/ChatOmnichannel.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatOmnichannel from '../ChatOmnichannel';

test('deve selecionar ticket e exibir chat', async () => {
  render(<ChatOmnichannel />);

  // Aguardar carregar tickets
  await waitFor(() => {
    expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
  });

  // Clicar no ticket
  userEvent.click(screen.getByText(/João Silva/i));

  // Verificar chat aberto
  expect(screen.getByTestId('chat-area')).toBeInTheDocument();
});
```

### Executar Testes

```bash
cd frontend-web
npm test -- ChatOmnichannel.test.tsx
```

---

## 🚀 Performance

### Otimizações Implementadas

1. **Memoização**: `useMemo` para listas filtradas
2. **Lazy Loading**: Componentes importados com `React.lazy`
3. **Debounce**: "digitando..." com debounce de 300ms
4. **Virtual Scrolling**: Lista de mensagens (se >100 itens)
5. **Code Splitting**: Bundle separado por rota

### Métricas

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| First Paint | ~1.2s | <1s |
| Time to Interactive | ~2.5s | <2s |
| Bundle Size | ~350KB | <300KB |
| WebSocket Latency | ~50ms | <100ms |

---

## ❓ FAQ

**P: Como adicionar novo tipo de mensagem (ex: localização)?**

R: 
1. Adicionar tipo no backend: `type: 'localizacao'`
2. Criar componente: `LocalizacaoCard.tsx`
3. Adicionar switch case em `MensagemCard.tsx`

**P: Como debugar mensagens não aparecendo?**

R:
1. Verificar se WebSocket está conectado: `useWebSocket().isConnected`
2. Ver logs no DevTools: tab Network → WS
3. Verificar se sala foi joined: `socket.emit('ticket:entrar')`

**P: Como adicionar notificações desktop?**

R: Ver `docs/OMNICHANNEL_ACOES_IMEDIATAS.md` - Ação 3: Notificações Desktop

---

## 📚 Recursos

- [React Docs](https://react.dev/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última atualização**: 11 de dezembro de 2025  
**Mantenedor**: Equipe Frontend ConectCRM
