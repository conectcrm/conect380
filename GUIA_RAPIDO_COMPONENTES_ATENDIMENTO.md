# 🚀 Guia Rápido de Uso - Componentes de Atendimento

**Referência rápida para desenvolvedores**

---

## 📦 Instalação

```tsx
// Importação simplificada via barrel export
import { 
  TicketListAprimorado,
  TicketStats,
  TicketFilters,
  ChatHeader,
  TemplatesRapidos,
  useTicketFilters,
  useTemplateShortcuts,
  type TicketFiltersState
} from '@/features/atendimento/chat';
```

---

## 🎯 Uso Rápido

### **1. TicketStats** (KPIs)

```tsx
// Mais simples possível
<TicketStats tickets={tickets} />

// Onde tickets é:
const tickets = [
  { id: '1', status: 'aberto', ... },
  { id: '2', status: 'em_atendimento', ... },
  // ...
];
```

**Props:**
- `tickets`: Array<{ id, status, ... }>

**Saída:** 4 cards com métricas (Total, Abertos, Em Atendimento, Resolvidos)

---

### **2. TicketFilters** (Busca + Filtros)

```tsx
// Com hook (recomendado)
const { filters, setFilters, clearFilters } = useTicketFilters();

<TicketFilters 
  filters={filters}
  onChange={setFilters}
  onClearFilters={clearFilters}
/>

// Sem hook (manual)
const [filters, setFilters] = useState({
  search: '',
  status: '',
  prioridade: '',
  ordenacao: 'recente'
});

<TicketFilters 
  filters={filters}
  onChange={setFilters}
/>
```

**Props:**
- `filters`: TicketFiltersState
- `onChange`: (filters) => void
- `onClearFilters?`: () => void (opcional)

**Recursos:**
- Busca com debounce 300ms
- Filtro de status (6 opções)
- Filtro de prioridade (3 opções)
- Ordenação (recente/antigo/prioridade)
- Indicador de filtros ativos

---

### **3. ChatHeader** (Header)

```tsx
<ChatHeader
  ticket={activeTicket}
  contextoAberto={isOpen}
  onToggleContexto={() => setIsOpen(!isOpen)}
  onStatusChange={(status) => updateStatus(activeTicket.id, status)}
  onPrioridadeChange={(prio) => updatePriority(activeTicket.id, prio)}
/>
```

**Props:**
- `ticket`: Objeto do ticket ou `null`
- `contextoAberto`: boolean
- `onToggleContexto`: () => void
- `onStatusChange?`: (status: string) => void
- `onPrioridadeChange?`: (prioridade: string) => void

**Recursos:**
- Avatar automático com iniciais
- Badge VIP (se `ticket.clienteVip = true`)
- Dropdowns de status e prioridade
- Botão toggle painel contexto
- Responsivo

---

### **4. TemplatesRapidos** (Respostas)

```tsx
<TemplatesRapidos 
  onSelecionarTemplate={(texto) => setMessage(texto)}
  className="mr-2" // opcional
/>

// Com atalhos (bonus)
const { processShortcut } = useTemplateShortcuts();

const handleInput = (text: string) => {
  if (text.startsWith('/')) {
    const { found, replacement } = processShortcut(text);
    if (found && replacement) {
      setMessage(replacement);
      return;
    }
  }
  setMessage(text);
};
```

**Props:**
- `onSelecionarTemplate`: (texto: string) => void
- `className?`: string (opcional)

**Atalhos Disponíveis:**
```
/ola          → Saudação inicial
/aguarde      → Solicitar aguardo
/resolvido    → Problema resolvido
/email        → Envio de email
/retorno      → Retorno de contato
/telefone     → Solicitar telefone
/solicitemail → Solicitar email
/obrigado     → Agradecimento
/tchau        → Despedida
/horario      → Fora do horário
/verificando  → Verificando informações
/protocolo    → Protocolo gerado
```

---

### **5. TicketListAprimorado** (Lista)

```tsx
const { filters, setFilters, clearFilters } = useTicketFilters();
const [activeId, setActiveId] = useState(null);

<TicketListAprimorado
  tickets={tickets}
  activeTicketId={activeId}
  onTicketSelect={setActiveId}
  filters={filters}
  onFiltersChange={setFilters}
  onClearFilters={clearFilters}
/>
```

**Props:**
- `tickets`: Array de tickets
- `activeTicketId`: string | null
- `onTicketSelect`: (id: string) => void
- `filters`: TicketFiltersState
- `onFiltersChange`: (filters) => void
- `onClearFilters?`: () => void

**Formato do Ticket:**
```typescript
{
  id: string;
  numero: number | string;
  status: 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  assunto?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  clienteNome?: string;
  clienteVip?: boolean;
  ultimaMensagem?: string;
  mensagensNaoLidas?: number;
  criadoEm: Date | string;
  atualizadoEm?: Date | string;
}
```

---

## 🎨 Exemplo Completo

```tsx
import { useState } from 'react';
import {
  TicketListAprimorado,
  ChatHeader,
  TemplatesRapidos,
  useTicketFilters
} from '@/features/atendimento/chat';

export function AtendimentoPage() {
  // Estado
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [contextoAberto, setContextoAberto] = useState(true);
  const { filters, setFilters, clearFilters } = useTicketFilters();

  // Ticket ativo
  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Handlers
  const handleStatusChange = (status: string) => {
    // TODO: API call
    console.log('Mudar status:', status);
  };

  const handlePrioridadeChange = (prioridade: string) => {
    // TODO: API call
    console.log('Mudar prioridade:', prioridade);
  };

  const handleSelecionarTemplate = (texto: string) => {
    // TODO: Inserir no input de mensagem
    console.log('Template:', texto);
  };

  return (
    <div className="flex h-screen">
      {/* Lista 400px */}
      <TicketListAprimorado
        tickets={tickets}
        activeTicketId={activeTicketId}
        onTicketSelect={setActiveTicketId}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ChatHeader
          ticket={activeTicket}
          contextoAberto={contextoAberto}
          onToggleContexto={() => setContextoAberto(!contextoAberto)}
          onStatusChange={handleStatusChange}
          onPrioridadeChange={handlePrioridadeChange}
        />

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {activeTicket ? (
            <p>Chat com {activeTicket.contatoNome}</p>
          ) : (
            <p>Selecione um ticket</p>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-3">
            <TemplatesRapidos onSelecionarTemplate={handleSelecionarTemplate} />
            <textarea className="flex-1 border rounded-lg p-2" />
            <button className="px-6 bg-blue-600 text-white rounded-lg">
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Painel Contexto (opcional) */}
      {contextoAberto && (
        <div className="w-80 bg-white border-l p-4">
          <h3 className="font-semibold mb-4">Contexto</h3>
          {/* ... */}
        </div>
      )}
    </div>
  );
}
```

---

## 🔌 Integração com API

### **Buscar Tickets**

```tsx
useEffect(() => {
  async function loadTickets() {
    const response = await fetch('/api/tickets');
    const data = await response.json();
    setTickets(data);
  }
  loadTickets();
}, []);
```

### **Atualizar Status**

```tsx
const handleStatusChange = async (status: string) => {
  await fetch(`/api/tickets/${activeTicketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  
  // Atualizar estado local
  setTickets(prev => 
    prev.map(t => t.id === activeTicketId ? { ...t, status } : t)
  );
};
```

### **Buscar Contatos (API Pronta!)**

```tsx
// API já implementada no backend!
const response = await fetch(`/api/crm/clientes/${clienteId}/contatos`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const contatos = await response.json();
// [{ id, nome, email, telefone, cargo, principal, ativo }]

// Renderizar dropdown
<select>
  {contatos.map(c => (
    <option key={c.id} value={c.id}>
      {c.nome} {c.principal && '⭐'} - {c.cargo}
    </option>
  ))}
</select>
```

---

## 💡 Dicas

### **Performance**

```tsx
// Use useMemo para filtros pesados
const filteredTickets = useMemo(() => {
  return tickets.filter(/* ... */);
}, [tickets, filters]);
```

### **Acessibilidade**

```tsx
// Adicione aria-labels
<button aria-label="Abrir templates de resposta rápida">
  Templates
</button>
```

### **Responsividade**

```tsx
// Hide/show em breakpoints
<div className="hidden lg:block">
  {/* Desktop only */}
</div>

<div className="block lg:hidden">
  {/* Mobile only */}
</div>
```

---

## 🐛 Troubleshooting

### **Filtros não funcionam**

✅ Verifique se está usando o hook `useTicketFilters()`  
✅ Confira se `onChange` está chamando `setFilters`  
✅ Certifique-se que tickets têm as propriedades corretas

### **Templates não aparecem**

✅ Verifique se o dropdown está aberto  
✅ Confira z-index (deve ser 50+)  
✅ Teste click outside funcionando

### **Badge VIP não aparece**

✅ Ticket deve ter `clienteVip: true`  
✅ Verifique renderização condicional

### **TypeScript errors**

✅ Importe tipos: `import type { TicketFiltersState } from '...'`  
✅ Defina interfaces completas  
✅ Use `?.` para propriedades opcionais

---

## 📚 Referências

- **Documentação completa:** `FASE2_FRONTEND_COMPLETO.md`
- **Exemplo integrado:** `AtendimentoChatExample.tsx`
- **API Backend:** `FASE1_BACKEND_COMPLETO.md`

---

**Versão:** 1.0  
**Data:** 12/10/2025  
**Status:** ✅ Pronto para uso
