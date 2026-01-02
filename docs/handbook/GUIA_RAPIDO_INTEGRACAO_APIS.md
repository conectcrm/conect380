# 🚀 Guia Rápido - Integração APIs FASE 4

## ⚡ Como Usar em 5 Minutos

### 1. Importar o Hook de Tickets

```typescript
import { useTickets } from '../hooks/useTickets';

function MeuComponente() {
  const empresaId = 'sua-empresa-id';
  
  const {
    tickets,        // Array de tickets
    loading,        // Boolean: está carregando?
    erro,           // String: mensagem de erro (null se OK)
    total,          // Number: total de tickets no backend
    atualizarStatus,      // Function: atualiza status
    atualizarPrioridade,  // Function: atualiza prioridade
    recarregar,           // Function: recarrega lista
  } = useTickets(empresaId);

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {erro && <p>Erro: {erro}</p>}
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.numero}</div>
      ))}
    </div>
  );
}
```

---

### 2. Importar o Hook de Mensagens

```typescript
import { useMessages } from '../hooks/useMessages';

function ChatArea({ ticketId }: { ticketId: string }) {
  const {
    mensagens,      // Array de mensagens
    loading,        // Boolean: está carregando?
    enviando,       // Boolean: está enviando mensagem?
    enviarMensagem, // Function: envia mensagem de texto
    enviarArquivo,  // Function: envia arquivo
  } = useMessages(ticketId);

  const handleEnviar = async () => {
    await enviarMensagem('Olá, como posso ajudar?');
  };

  return (
    <div>
      {mensagens.map(msg => (
        <p key={msg.id}>{msg.conteudo}</p>
      ))}
      <button onClick={handleEnviar} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
}
```

---

### 3. Usar Services Diretamente (Sem Hook)

```typescript
import { ticketsService } from '../services/ticketsService';
import { messagesService } from '../services/messagesService';

// Listar tickets
const resposta = await ticketsService.listar({
  empresaId: 'abc-123',
  status: 'aguardando',
  limite: 20,
});
console.log(resposta.data); // Array de tickets

// Enviar mensagem
const msg = await messagesService.enviar({
  ticketId: 'ticket-123',
  conteudo: 'Olá!',
  tipo: TipoMensagem.TEXTO,
});
console.log(msg.data); // Mensagem criada
```

---

### 4. Converter Tipos (API ↔ Componente)

```typescript
import {
  converterTicketAPIParaComponente,
  converterStatusComponenteParaAPI,
} from '../utils/ticketAdapters';

// API retornou ticket com enum StatusTicket.AGUARDANDO
const ticketDaAPI = { status: StatusTicket.AGUARDANDO, ... };

// Converter para string 'aguardando' (componentes)
const ticketParaUI = converterTicketAPIParaComponente(ticketDaAPI);
console.log(ticketParaUI.status); // 'aguardando'

// Converter de volta para enum ao enviar para API
const statusEnum = converterStatusComponenteParaAPI('em_atendimento');
// statusEnum = StatusTicket.EM_ATENDIMENTO
```

---

### 5. Configurar empresaId no LocalStorage

```javascript
// Execute no console do navegador antes de usar
localStorage.setItem('empresaId', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
localStorage.setItem('token', 'seu-jwt-token-aqui'); // Opcional
```

---

## 🎯 Exemplos de Uso Completo

### Exemplo 1: Lista de Tickets com Filtros

```typescript
import { useTickets } from '../hooks/useTickets';
import { StatusTicket } from '../types/ticket';

function TicketsDashboard() {
  const empresaId = localStorage.getItem('empresaId') || '';
  
  const { tickets, loading, erro, atualizarStatus } = useTickets(empresaId, {
    status: ['aguardando', 'em_atendimento'], // Filtro inicial
    limite: 50,
  });

  const handleResolverTicket = async (ticketId: string) => {
    try {
      await atualizarStatus(ticketId, StatusTicket.RESOLVIDO);
      alert('Ticket resolvido com sucesso!');
    } catch (err) {
      alert('Erro ao resolver ticket');
    }
  };

  if (loading) return <div>Carregando tickets...</div>;
  if (erro) return <div>Erro: {erro}</div>;

  return (
    <div>
      <h1>Meus Tickets ({tickets.length})</h1>
      {tickets.map(ticket => (
        <div key={ticket.id}>
          <h3>#{ticket.numero} - {ticket.assunto}</h3>
          <p>Status: {ticket.status}</p>
          <button onClick={() => handleResolverTicket(ticket.id)}>
            Resolver
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

### Exemplo 2: Chat de Mensagens

```typescript
import { useMessages } from '../hooks/useMessages';
import { TipoMensagem } from '../services/messagesService';

function ChatBox({ ticketId }: { ticketId: string | null }) {
  const [texto, setTexto] = React.useState('');
  
  const {
    mensagens,
    loading,
    enviando,
    enviarMensagem,
    enviarArquivo,
  } = useMessages(ticketId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    
    await enviarMensagem(texto);
    setTexto('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      await enviarArquivo(arquivo);
    }
  };

  if (!ticketId) return <div>Selecione um ticket</div>;
  if (loading) return <div>Carregando mensagens...</div>;

  return (
    <div>
      <div className="mensagens">
        {mensagens.map(msg => (
          <div key={msg.id} className={msg.direcao}>
            <p>{msg.conteudo}</p>
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={enviando}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      <input type="file" onChange={handleUpload} />
    </div>
  );
}
```

---

### Exemplo 3: Integração Completa (Página Pronta)

```typescript
import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { useMessages } from '../hooks/useMessages';
import { TicketListAprimorado } from '../features/atendimento/chat/TicketListAprimorado';

function AtendimentoPage() {
  const empresaId = localStorage.getItem('empresaId') || '';
  const [ticketAtivoId, setTicketAtivoId] = useState<string | null>(null);
  
  const { tickets, loading: loadingTickets } = useTickets(empresaId);
  const { mensagens, enviarMensagem } = useMessages(ticketAtivoId);

  return (
    <div className="flex h-screen">
      {/* Lista de tickets */}
      <TicketListAprimorado
        tickets={tickets}
        activeTicketId={ticketAtivoId}
        onTicketSelect={setTicketAtivoId}
        filters={{}}
        onFiltersChange={() => {}}
      />

      {/* Área de chat */}
      <div className="flex-1">
        {ticketAtivoId ? (
          <>
            {mensagens.map(msg => (
              <div key={msg.id}>{msg.conteudo}</div>
            ))}
            <input
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  enviarMensagem(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </>
        ) : (
          <p>Selecione um ticket</p>
        )}
      </div>
    </div>
  );
}
```

---

## 📘 Referência Rápida de APIs

### ticketsService

```typescript
ticketsService.listar(filtros: TicketFiltros)
ticketsService.buscar(ticketId: string, empresaId: string)
ticketsService.atualizarStatus(ticketId, empresaId, { status, atendenteId? })
ticketsService.atualizarPrioridade(ticketId, empresaId, { prioridade })
ticketsService.atribuirAtendente(ticketId, empresaId, { atendenteId })
```

### messagesService

```typescript
messagesService.listar(filtros: BuscarMensagensFiltros)
messagesService.enviar(dados: CriarMensagemDto)
messagesService.marcarComoLida({ mensagemIds: string[] })
messagesService.uploadArquivo(ticketId: string, arquivo: File)
messagesService.buscar(mensagemId: string)
```

---

## 🔧 Troubleshooting

### ❌ Erro: "empresaId é obrigatório"

**Solução**: Configure o empresaId no localStorage:
```javascript
localStorage.setItem('empresaId', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
```

### ❌ Erro 401: Unauthorized

**Solução**: Configure o token JWT:
```javascript
localStorage.setItem('token', 'seu-token-jwt-aqui');
```

### ❌ Tickets não carregam

**Verificações**:
1. Backend está rodando na porta 3001?
2. `API_URL` está correto? (padrão: `http://localhost:3001`)
3. Abra DevTools → Network → veja se requisição foi feita
4. Verifique console por erros CORS

### ❌ Mensagens não aparecem

**Verificações**:
1. `ticketId` está correto e não é `null`?
2. Hook `useMessages` está recebendo o `ticketId`?
3. Verifique logs do console: `✅ X mensagens carregadas`

---

## 📚 Documentação Completa

Para detalhes técnicos completos, veja:
- `FASE4_INTEGRACAO_APIS_COMPLETA.md` - Documentação técnica detalhada
- `frontend-web/src/services/ticketsService.ts` - Código do service de tickets
- `frontend-web/src/hooks/useTickets.ts` - Código do hook de tickets
- `frontend-web/src/pages/AtendimentoIntegradoPage.tsx` - Exemplo completo funcional

---

**✅ Pronto para usar! Integração 100% funcional.**
