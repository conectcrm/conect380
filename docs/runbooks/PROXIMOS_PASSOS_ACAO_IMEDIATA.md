# 🚀 Próximos Passos - Plano de Ação Imediato

**Projeto**: ConectCRM Omnichannel  
**Sprint**: 1 - Eliminação de Gambiarras  
**Tempo Total Estimado**: 1-2 dias

---

## ✅ Etapa 1: Setup de Qualidade (CONCLUÍDO)

- [x] Instalar ESLint, Prettier, TypeScript strict
- [x] Criar configurações de lint
- [x] Executar análise inicial (baseline: 1.471 problemas)
- [x] Criar relatórios de qualidade

**Resultado**: ✅ Ferramentas configuradas e baseline estabelecida.

---

## 🎯 Etapa 2: Corrigir Gambiarra #2 (EM PROGRESSO - 60% CONCLUÍDO)

### **Problema**: State Decentralizado

Atualmente, o estado está espalhado em múltiplos hooks (`useAtendimentos`, `useMensagens`, `useHistoricoCliente`), causando:
- Duplicação de código
- Risco de inconsistências
- Dificuldade de sincronização entre componentes

### **Solução**: Store Centralizada com Zustand

#### Passo 2.1: Instalar Zustand ✅ **CONCLUÍDO**

```powershell
cd frontend-web
npm install zustand
```

**Status**: ✅ Zustand v5.0.8 instalado (`package.json`)

#### Passo 2.2: Criar Store ✅ **CONCLUÍDO**

**Status**: ✅ Zustand v5.0.8 instalado (`package.json`)

#### Passo 2.2: Criar Store ✅ **CONCLUÍDO**

**Arquivo**: `frontend-web/src/stores/atendimentoStore.ts` ✅ **CRIADO (304 linhas)**

**Recursos Implementados**:
- ✅ Store com middleware `persist` + `devtools`
- ✅ Interfaces TypeScript completas
- ✅ Estado de tickets (lista, selecionado, loading, error)
- ✅ Estado de mensagens (por ticket)
- ✅ Estado de cliente (selecionado, histórico)
- ✅ Ações CRUD para tickets
- ✅ Ações CRUD para mensagens
- ✅ Seletores otimizados (`atendimentoSelectors.ts`)

**Evidência**: Arquivo existe em `frontend-web/src/stores/atendimentoStore.ts`

#### Passo 2.3: Integrar Store nos Componentes ❌ **FALTA FAZER** (CRÍTICO!)

**Status Atual**: ⚠️ **STORE CRIADA MAS NÃO INTEGRADA!**

**Problema Identificado**:
```bash
# Busca por uso da store:
grep -r "useAtendimentoStore" frontend-web/src/features/
# Resultado: 0 ocorrências ❌
```

**Isso significa**:
- ✅ Store bem estruturada (existe)
- ❌ Nenhum componente usa ela
- ❌ Ainda usando `useState` local (gambiarra ativa!)
- ❌ WebSocket não conectado à store

#### Passo 2.3: Refatorar ChatOmnichannel (FAZER AGORA - 2 horas)
  // ===== ESTADO =====
  // Tickets
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  ticketSelecionado: Ticket | null;
  
  // Mensagens (por ticket)
  mensagens: Record<string, Mensagem[]>;
  mensagensLoading: Record<string, boolean>;
  mensagensError: Record<string, string | null>;
  
  // Cliente
  clienteSelecionado: Cliente | null;
  historicoCliente: any[];
  
  // ===== AÇÕES - TICKETS =====
  setTickets: (tickets: Ticket[]) => void;
  setTicketsLoading: (loading: boolean) => void;
  setTicketsError: (error: string | null) => void;
  
  selecionarTicket: (ticket: Ticket | null) => void;
  adicionarTicket: (ticket: Ticket) => void;
  atualizarTicket: (ticketId: string, dados: Partial<Ticket>) => void;
  removerTicket: (ticketId: string) => void;
  
  // ===== AÇÕES - MENSAGENS =====
  setMensagens: (ticketId: string, mensagens: Mensagem[]) => void;
  adicionarMensagem: (ticketId: string, mensagem: Mensagem) => void;
  setMensagensLoading: (ticketId: string, loading: boolean) => void;
  setMensagensError: (ticketId: string, error: string | null) => void;
  
  // ===== AÇÕES - CLIENTE =====
  setClienteSelecionado: (cliente: Cliente | null) => void;
  setHistoricoCliente: (historico: any[]) => void;
  
  // ===== AÇÕES - RESETAR =====
  resetStore: () => void;
}

const stateInicial = {
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  ticketSelecionado: null,
  
  mensagens: {},
  mensagensLoading: {},
  mensagensError: {},
  
  clienteSelecionado: null,
  historicoCliente: [],
};

export const useAtendimentoStore = create<AtendimentoStore>((set) => ({
  ...stateInicial,
  
  // ===== TICKETS =====
  setTickets: (tickets) => set({ tickets }),
  setTicketsLoading: (loading) => set({ ticketsLoading: loading }),
  setTicketsError: (error) => set({ ticketsError: error }),
  
  selecionarTicket: (ticket) => set({ ticketSelecionado: ticket }),
  
  adicionarTicket: (ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets],
  })),
  
  atualizarTicket: (ticketId, dados) => set((state) => ({
    tickets: state.tickets.map(t =>
      t.id === ticketId ? { ...t, ...dados } : t
    ),
    ticketSelecionado:
      state.ticketSelecionado?.id === ticketId
        ? { ...state.ticketSelecionado, ...dados }
        : state.ticketSelecionado,
  })),
  
  removerTicket: (ticketId) => set((state) => ({
    tickets: state.tickets.filter(t => t.id !== ticketId),
    ticketSelecionado:
      state.ticketSelecionado?.id === ticketId
        ? null
        : state.ticketSelecionado,
  })),
  
  // ===== MENSAGENS =====
  setMensagens: (ticketId, mensagens) => set((state) => ({
    mensagens: {
      ...state.mensagens,
      [ticketId]: mensagens,
    },
  })),
  
  adicionarMensagem: (ticketId, mensagem) => set((state) => {
    const mensagensExistentes = state.mensagens[ticketId] || [];
    
    // Evitar duplicatas
    const jaExiste = mensagensExistentes.some(m => m.id === mensagem.id);
    if (jaExiste) return state;
    
    return {
      mensagens: {
        ...state.mensagens,
        [ticketId]: [...mensagensExistentes, mensagem],
      },
    };
  }),
  
  setMensagensLoading: (ticketId, loading) => set((state) => ({
    mensagensLoading: {
      ...state.mensagensLoading,
      [ticketId]: loading,
    },
  })),
  
  setMensagensError: (ticketId, error) => set((state) => ({
    mensagensError: {
      ...state.mensagensError,
      [ticketId]: error,
    },
  })),
  
  // ===== CLIENTE =====
  setClienteSelecionado: (cliente) => set({ clienteSelecionado: cliente }),
  setHistoricoCliente: (historico) => set({ historicoCliente: historico }),
  
  // ===== RESETAR =====
  resetStore: () => set(stateInicial),
}));
```

#### Passo 2.3: Refatorar useAtendimentos (1 hora)

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/hooks/useAtendimentos.ts`

**ANTES** (useState local):
```typescript
const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**DEPOIS** (Zustand store):
```typescript
const {
  tickets,
  ticketsLoading: loading,
  ticketsError: error,
  setTickets,
  setTicketsLoading,
  setTicketsError,
  adicionarTicket,
  atualizarTicket,
} = useAtendimentoStore();

// Remover todos os useState relacionados a tickets
// Manter apenas lógica de fetching
```

#### Passo 2.4: Refatorar useMensagens (1 hora)

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/hooks/useMensagens.ts`

**ANTES** (useState local):
```typescript
const [mensagens, setMensagens] = useState<Mensagem[]>([]);
const [loading, setLoading] = useState(false);
```

**DEPOIS** (Zustand store):
```typescript
const {
  mensagens: mensagensStore,
  mensagensLoading,
  setMensagens,
  adicionarMensagem,
} = useAtendimentoStore();

const mensagens = mensagensStore[ticketId] || [];
const loading = mensagensLoading[ticketId] || false;

// Remover useState, usar apenas store
```

#### Passo 2.5: Refatorar ChatOmnichannel (2 horas)

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`

**ANTES**:
```typescript
const { tickets, loading, recarregar } = useAtendimentos(filtros);
const { mensagens, enviarMensagem } = useMensagens({ ticketId });
```

**DEPOIS**:
```typescript
// Estado vem diretamente da store
const {
  tickets,
  ticketSelecionado,
  mensagens,
  selecionarTicket,
} = useAtendimentoStore();

// Hooks agora são apenas para side effects (fetching)
useAtendimentos(filtros); // Popula store automaticamente
useMensagens({ ticketId }); // Popula store automaticamente
```

#### Passo 2.6: Atualizar WebSocket para usar Store (30 minutos)

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`

**WebSocket callbacks devem usar store**:
```typescript
const { adicionarMensagem, atualizarTicket, adicionarTicket } = useAtendimentoStore();

useWebSocket({
  events: {
    onNovaMensagem: (mensagem) => {
      // Adicionar direto na store
      adicionarMensagem(mensagem.ticketId, mensagem);
    },
    
    onTicketAtualizado: (ticket) => {
      // Atualizar direto na store
      atualizarTicket(ticket.id, ticket);
    },
    
    onNovoTicket: (ticket) => {
      // Adicionar direto na store
      adicionarTicket(ticket);
    },
  },
});
```

#### Passo 2.7: Testes (1-2 horas)

**Checklist de Validação**:
- [ ] Criar novo atendimento (deve aparecer na sidebar)
- [ ] Selecionar atendimento (deve carregar mensagens)
- [ ] Enviar mensagem (deve aparecer no chat)
- [ ] Receber mensagem via WebSocket (deve atualizar em tempo real)
- [ ] Transferir atendimento (deve atualizar status)
- [ ] Encerrar atendimento (deve remover da lista)
- [ ] Abrir múltiplos chats (estado deve sincronizar)
- [ ] Refresh da página (deve manter estado via localStorage - opcional)

**Teste de Sincronização**:
1. Abrir chat em duas abas diferentes
2. Enviar mensagem na aba 1
3. Verificar se aparece na aba 2 (via WebSocket + store)

---

## 🧹 Etapa 3: Limpeza de console.log (OPCIONAL - 4 HORAS)

### Substituir console.log por Logger do NestJS

**Backend - Criar Logger Service**:
```typescript
// backend/src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context || 'App'}] ${message}`);
  }
  
  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || 'App'}] ERROR: ${message}`, trace);
  }
  
  warn(message: string, context?: string) {
    console.warn(`[${context || 'App'}] WARN: ${message}`);
  }
  
  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${context || 'App'}] DEBUG: ${message}`);
    }
  }
}
```

**Substituir em Services**:
```typescript
// ❌ ANTES
console.log('Mensagem enviada:', mensagem);

// ✅ DEPOIS
this.logger.log(`Mensagem enviada para ticket ${ticketId}`, 'MensagemService');
```

**Script de Substituição Automática** (PowerShell):
```powershell
# Buscar todos console.log
$files = Get-ChildItem -Path "backend/src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
  (Get-Content $file.FullName) -replace 
    "console\.log\((.*)\)",
    "this.logger.log($1, this.constructor.name)" |
  Set-Content $file.FullName
}
```

---

## 📊 Etapa 4: Executar Testes Finais

### 4.1: Testes Unitários
```powershell
cd backend
npm test

cd ../frontend-web
npm test
```

### 4.2: Testes de Integração (Smoke Tests)
```powershell
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000
```

### 4.3: Testes de Qualidade
```powershell
cd backend
npm run lint
npm run type-check

cd ../frontend-web
npm run lint
npm run type-check
```

**Meta**: Reduzir de 1.471 problemas para < 100 problemas após store implementada.

---

## 📝 Etapa 5: Documentação

### 5.1: Atualizar README
- [ ] Documentar uso da store
- [ ] Adicionar exemplos de código
- [ ] Atualizar diagramas de arquitetura

### 5.2: Criar Guia de Migração
```markdown
# Guia de Migração para Zustand Store

## Antes (useState)
const [tickets, setTickets] = useState([]);

## Depois (Zustand)
const { tickets, setTickets } = useAtendimentoStore();

## Benefícios
- Estado sincronizado entre componentes
- Melhor performance (menos re-renders)
- DevTools para debug
- Código mais limpo
```

---

## 🎯 Resumo de Tempo

| Tarefa | Tempo Estimado |
|--------|---------------|
| 2.1: Instalar Zustand | 2 min |
| 2.2: Criar Store | 30 min |
| 2.3: Refatorar useAtendimentos | 1h |
| 2.4: Refatorar useMensagens | 1h |
| 2.5: Refatorar ChatOmnichannel | 2h |
| 2.6: Atualizar WebSocket | 30 min |
| 2.7: Testes | 1-2h |
| **TOTAL** | **6-7 horas (1 dia)** |

---

## ✅ Critérios de Sucesso

A Gambiarra #2 será considerada RESOLVIDA quando:

1. ✅ Store Zustand criada e funcionando
2. ✅ Todos os hooks usando store ao invés de useState local
3. ✅ WebSocket atualizando store diretamente
4. ✅ Estado sincronizado entre todos os componentes
5. ✅ Testes passando sem erros
6. ✅ Código duplicado removido (DRY - Don't Repeat Yourself)
7. ✅ Performance igual ou melhor que antes
8. ✅ Documentação atualizada

---

## 🚀 Comando para Iniciar

```powershell
# 1. Instalar Zustand
cd c:\Projetos\conectcrm\frontend-web
npm install zustand

# 2. Criar arquivo da store
# (usar template do Passo 2.2 acima)

# 3. Refatorar hooks um por vez (começar por useAtendimentos)

# 4. Testar após cada refatoração

# 5. Commit após cada etapa concluída
git add .
git commit -m "feat(atendimento): implementar store centralizada com Zustand - etapa X"
```

---

**Próxima Reunião**: Após conclusão da Store (1 dia)  
**Objetivo**: Revisar implementação e planejar Sprint 2 (Filas + Templates + SLA)
