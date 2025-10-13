# 💬 Atendimento Omnichannel - Documentação Backend Integration

## 📋 Visão Geral

Sistema completo de atendimento omnichannel com backend integration, WebSocket real-time e hooks reativos.

## 🎯 Status Atual - Fase 2 Completa

✅ **Fase 1 - Modais** (6/6 completos)
✅ **Fase 2 - Backend Integration** (4/4 completos)

### Componentes Implementados

#### 1️⃣ Service Layer (`atendimentoService.ts`)

API client completo com todos os endpoints necessários:

```typescript
import { atendimentoService } from './services/atendimentoService';

// Tickets
await atendimentoService.listarTickets({ status: 'aberto', page: 1 });
await atendimentoService.buscarTicket('ticket-123');
await atendimentoService.criarTicket(dadosNovoAtendimento);
await atendimentoService.transferirTicket('ticket-123', dadosTransferencia);
await atendimentoService.encerrarTicket('ticket-123', dadosEncerramento);
await atendimentoService.reabrirTicket('ticket-123');

// Mensagens
await atendimentoService.listarMensagens({ ticketId: 'ticket-123', page: 1 });
await atendimentoService.enviarMensagem({ ticketId: 'ticket-123', conteudo: 'Olá!' });
await atendimentoService.marcarComoLidas('ticket-123', ['msg-1', 'msg-2']);

// Contatos
await atendimentoService.buscarContatos({ busca: 'João' });
await atendimentoService.criarContato(dadosContato);
await atendimentoService.atualizarContato('contato-123', dadosEditados);
await atendimentoService.vincularCliente('contato-123', 'cliente-456');

// Clientes CRM
await atendimentoService.buscarClientes({ busca: 'Empresa XYZ' });

// Demandas
await atendimentoService.criarDemanda('ticket-123', novaDemanda);
await atendimentoService.listarDemandas('contato-123');

// Notas
await atendimentoService.criarNota('ticket-123', 'Nota importante', true);
await atendimentoService.listarNotas('contato-123');
await atendimentoService.excluirNota('nota-123');

// Extras
await atendimentoService.listarAtendentes();
await atendimentoService.listarTemplates();
await atendimentoService.buscarEstatisticas();
```

#### 2️⃣ Hook useAtendimentos

Gerenciamento completo de tickets com estado reativo:

```typescript
import { useAtendimentos } from './hooks/useAtendimentos';

const {
  // Estado
  tickets,
  ticketSelecionado,
  loading,
  error,
  totalTickets,
  paginaAtual,
  totalPaginas,

  // Filtros
  filtros,
  setFiltros,

  // Ações
  selecionarTicket,
  criarTicket,
  transferirTicket,
  encerrarTicket,
  reabrirTicket,
  recarregar,

  // Navegação
  irParaPagina,
} = useAtendimentos({
  autoRefresh: true,        // Auto-refresh a cada 30s
  refreshInterval: 30,      // Intervalo em segundos
  filtroInicial: {
    status: 'aberto',
    page: 1,
    limit: 50
  }
});

// Exemplo de uso
useEffect(() => {
  if (tickets.length > 0) {
    selecionarTicket(tickets[0].id);
  }
}, [tickets]);

// Filtrar por status
setFiltros({ status: 'resolvido', canal: 'whatsapp' });

// Criar novo ticket
const novoTicket = await criarTicket({
  canal: 'whatsapp',
  contato: { nome: 'João', telefone: '11999999999' },
  assunto: 'Dúvida sobre produto',
  descricao: 'Cliente tem dúvida...',
  prioridade: 'alta'
});
```

#### 3️⃣ Hook useMensagens

Gerenciamento de chat com scroll infinito e envio de mídia:

```typescript
import { useMensagens } from './hooks/useMensagens';

const {
  // Estado
  mensagens,
  loading,
  error,
  enviando,
  temMais,
  paginaAtual,

  // Ações
  enviarMensagem,
  enviarMensagemComAnexos,
  enviarAudio,
  carregarMais,
  marcarComoLidas,
  recarregar,

  // Refs
  mensagensRef,
} = useMensagens({
  ticketId: ticketAtual?.id || null,
  autoScroll: true,
  pageSize: 50
});

// Enviar mensagem de texto
await enviarMensagem('Olá! Como posso ajudar?');

// Enviar mensagem com arquivos
const arquivos = [file1, file2];
await enviarMensagemComAnexos('Segue os documentos', arquivos);

// Enviar áudio
const audioBlob = await gravarAudio();
await enviarAudio(audioBlob, 30); // 30 segundos

// Scroll infinito
<div 
  ref={mensagensRef}
  onScroll={(e) => {
    if (e.currentTarget.scrollTop === 0 && temMais && !loading) {
      carregarMais();
    }
  }}
>
  {mensagens.map(msg => <Mensagem key={msg.id} {...msg} />)}
</div>
```

#### 4️⃣ Socket Context (WebSocket)

WebSocket real-time para mensagens e notificações:

```typescript
import { SocketProvider, useSocket } from './contexts/SocketContext';

// No App.tsx ou em nível superior
function App() {
  return (
    <SocketProvider>
      <ChatOmnichannel />
    </SocketProvider>
  );
}

// Dentro de um componente
function ChatComponent() {
  const { 
    connected, 
    onNovaMensagem, 
    onTicketAtualizado,
    onUsuarioDigitando,
    enviarDigitando,
    entrarSalaTicket,
    sairSalaTicket
  } = useSocket();

  useEffect(() => {
    // Escutar novas mensagens
    const cleanup1 = onNovaMensagem((mensagem) => {
      console.log('Nova mensagem:', mensagem);
      // Adicionar ao estado, tocar som, etc
    });

    // Escutar tickets atualizados
    const cleanup2 = onTicketAtualizado((ticket) => {
      console.log('Ticket atualizado:', ticket);
      // Atualizar lista
    });

    // Escutar digitação
    const cleanup3 = onUsuarioDigitando(({ ticketId, nomeUsuario }) => {
      console.log(`${nomeUsuario} está digitando no ticket ${ticketId}`);
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, []);

  // Entrar na sala de um ticket ao selecioná-lo
  useEffect(() => {
    if (ticketId) {
      entrarSalaTicket(ticketId);
      return () => sairSalaTicket(ticketId);
    }
  }, [ticketId]);

  // Enviar indicador de digitação
  const handleInputChange = (texto: string) => {
    enviarDigitando(ticketId);
  };

  return (
    <div>
      {connected ? '🟢 Conectado' : '🔴 Desconectado'}
    </div>
  );
}
```

## 🔧 Estrutura de Arquivos

```
omnichannel/
├── services/
│   └── atendimentoService.ts       # API client (570 linhas)
├── hooks/
│   ├── useAtendimentos.ts          # Hook de tickets (300 linhas)
│   └── useMensagens.ts             # Hook de mensagens (310 linhas)
├── contexts/
│   └── SocketContext.tsx           # WebSocket provider (240 linhas)
├── modals/
│   ├── NovoAtendimentoModal.tsx    # Criar ticket (487 linhas)
│   ├── TransferirAtendimentoModal.tsx  # Transferir (336 linhas)
│   ├── EncerrarAtendimentoModal.tsx    # Encerrar (306 linhas)
│   ├── EditarContatoModal.tsx      # Editar contato (266 linhas)
│   ├── VincularClienteModal.tsx    # Vincular CRM (164 linhas)
│   └── AbrirDemandaModal.tsx       # Criar demanda (243 linhas)
├── components/
│   ├── AtendimentosSidebar.tsx
│   ├── ChatArea.tsx
│   └── ClientePanel.tsx
├── types.ts                        # Interfaces TypeScript
├── mockData.ts                     # Dados mock (temporário)
├── index.ts                        # Exports centralizados
└── ChatOmnichannel.tsx             # Componente principal
```

## 📊 Estatísticas

### Fase 1 - Modais
- **6 modais**: 1.802 linhas
- **3 commits**: 1de83ad, 28b62c4, 2cbde84
- **0 erros TypeScript**

### Fase 2 - Backend Integration
- **4 arquivos**: 1.420 linhas
- **1 commit**: 0119a55
- **0 erros TypeScript**

**Total**: 3.222 linhas de código funcional

## 🚀 Próximas Etapas (Fase 3)

### Features Avançadas

1. **Componente FileUpload** 📎
   - Drag & drop
   - Preview de imagens
   - Progress bar
   - Validação de tipos

2. **Sistema de Respostas Rápidas** ⚡
   - Biblioteca de templates
   - Categorização
   - Variáveis dinâmicas
   - Atalhos de teclado

3. **Emoji Picker** 😀
   - Integração no input
   - Categorias
   - Busca
   - Recentes

4. **Refinamentos** ✨
   - Testes unitários
   - Testes de integração
   - Performance optimization
   - Acessibilidade (a11y)
   - Documentação adicional

## 🔌 Integração com Backend

### Endpoints Esperados

O service está preparado para consumir os seguintes endpoints:

```
GET    /api/atendimento/tickets                    # Listar tickets
GET    /api/atendimento/tickets/:id                # Buscar ticket
POST   /api/atendimento/tickets                    # Criar ticket
POST   /api/atendimento/tickets/:id/transferir     # Transferir
POST   /api/atendimento/tickets/:id/encerrar       # Encerrar
POST   /api/atendimento/tickets/:id/reabrir        # Reabrir

GET    /api/atendimento/tickets/:id/mensagens      # Listar mensagens
POST   /api/atendimento/tickets/:id/mensagens      # Enviar mensagem
POST   /api/atendimento/tickets/:id/mensagens/marcar-lidas

GET    /api/atendimento/contatos/buscar            # Buscar contatos
POST   /api/atendimento/contatos                   # Criar contato
PUT    /api/atendimento/contatos/:id               # Atualizar contato
POST   /api/atendimento/contatos/:id/vincular-cliente

GET    /api/clientes/buscar                        # Buscar clientes CRM

GET    /api/atendimento/contatos/:id/historico     # Histórico
GET    /api/atendimento/contatos/:id/demandas      # Demandas
POST   /api/atendimento/tickets/:id/demandas       # Criar demanda

POST   /api/atendimento/tickets/:id/notas          # Criar nota
GET    /api/atendimento/contatos/:id/notas         # Listar notas
DELETE /api/atendimento/notas/:id                  # Excluir nota

GET    /api/atendimento/atendentes                 # Listar atendentes
GET    /api/atendimento/templates                  # Templates
GET    /api/atendimento/estatisticas               # Estatísticas
```

### Eventos WebSocket

```javascript
// Cliente emite
socket.emit('digitando', { ticketId });
socket.emit('entrar-ticket', { ticketId });
socket.emit('sair-ticket', { ticketId });

// Cliente escuta
socket.on('nova-mensagem', (mensagem) => { ... });
socket.on('ticket-atualizado', (ticket) => { ... });
socket.on('usuario-digitando', ({ ticketId, nomeUsuario }) => { ... });
socket.on('status-mensagem', ({ mensagemId, status }) => { ... });
```

## 🎨 Padrões e Convenções

### Imports

```typescript
// Prefira importar do index.ts
import { 
  useAtendimentos, 
  useMensagens, 
  atendimentoService,
  SocketProvider 
} from '@features/atendimento/omnichannel';
```

### Error Handling

Todos os services e hooks tratam erros consistentemente:

```typescript
try {
  await atendimentoService.criarTicket(dados);
} catch (error: any) {
  const mensagem = error.response?.data?.message || 'Erro ao criar ticket';
  console.error('❌', mensagem);
  // Exibir toast, atualizar estado, etc
}
```

### TypeScript

Tipos estão bem definidos e exportados:

```typescript
import type { 
  Ticket, 
  Mensagem, 
  NovoAtendimentoData 
} from '@features/atendimento/omnichannel';
```

## 📝 Notas Importantes

1. **Mock Data**: Atualmente `ChatOmnichannel.tsx` ainda usa `mockData.ts`. Após implementar o backend, substituir por hooks reais.

2. **Autenticação**: O socket e os services esperam token em `localStorage.getItem('authToken')`.

3. **Socket.IO**: Certifique-se de que o backend tem Socket.IO configurado na mesma porta da API ou ajuste a URL no `SocketContext.tsx`.

4. **CORS**: Backend deve permitir CORS para o frontend em desenvolvimento.

## 🐛 Troubleshooting

### Socket não conecta
- Verificar se token está no localStorage
- Verificar URL da API no `.env`
- Verificar se backend tem Socket.IO rodando

### Hooks retornam vazio
- Verificar se backend está respondendo
- Verificar Network tab no DevTools
- Verificar console do backend para erros

### TypeScript errors
- Rodar `npm install socket.io-client` se necessário
- Verificar versões das dependências

## ✅ Testes Manuais Recomendados

1. **Listar tickets** por status (aberto/resolvido/retorno)
2. **Selecionar ticket** e carregar mensagens
3. **Enviar mensagem** de texto
4. **Enviar mensagem** com arquivo
5. **Criar novo ticket** com wizard
6. **Transferir ticket** para outro atendente
7. **Encerrar ticket** com follow-up
8. **Editar contato** e verificar atualização
9. **Vincular cliente** CRM ao contato
10. **Criar demanda** vinculada ao ticket
11. **WebSocket**: verificar mensagens em tempo real

---

**Status**: ✅ Fase 2 Completa - Pronto para integração com backend real!

**Próximo passo**: Implementar endpoints no backend ou prosseguir com Fase 3 (features avançadas).
