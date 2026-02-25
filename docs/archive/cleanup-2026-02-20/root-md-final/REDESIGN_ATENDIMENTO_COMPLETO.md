# 🎨 Redesign Completo: Núcleo Atendimento

**Status**: 📋 PLANEJAMENTO  
**Data**: Janeiro 2025  
**Solicitante**: User (baseado em screenshot)  
**Objetivo**: Criar layout profissional full-width com estrutura de núcleo "Atendimento"

---

## 📸 Análise da Situação Atual

### **Problemas Identificados no Screenshot**
1. ❌ **Espaços vazios laterais** - Layout não usa toda área disponível
2. ❌ **Design pouco profissional** - Visual simples e desorganizado
3. ❌ **Falta de hierarquia visual** - Elementos sem destaque claro
4. ❌ **Sem filtros visíveis** - Impossível filtrar tickets rapidamente
5. ❌ **Sem estatísticas** - Agente não vê KPIs (abertos, em atendimento, etc)
6. ❌ **Lista de tickets pequena** - 320px é insuficiente para informações
7. ❌ **Sem área de ações rápidas** - Faltam botões para templates, status, etc
8. ❌ **Estrutura monolítica** - Tudo em `/atendimento`, sem subnúcleos

### **O Que Funciona Bem (Manter)**
- ✅ Backend 100% funcional (4 APIs REST)
- ✅ WebSocket real-time (mensagens, typing indicator)
- ✅ PainelContextoCliente (545 linhas, 3 abas)
- ✅ BuscaRapida (450 linhas, Ctrl+K)
- ✅ Hook useWhatsApp (gerencia estado completo)

---

## 🎯 Requisitos do Redesign

### **1. Layout Full-Width Profissional**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ DashboardLayout (sidebar global)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────────────────────────┬─────────────────────┐│
│ │ TICKETS     │ CHAT PRINCIPAL                  │ CONTEXTO CLIENTE    ││
│ │ 400px       │ flex-1 (usa todo espaço)        │ 380px (colapsável)  ││
│ │             │                                 │                     ││
│ │ [Stats]     │ ┌─────────────────────────────┐ │ ┌─────────────────┐││
│ │ 📊 KPIs     │ │ Header: Nome + Status       │ │ │ Aba: Info       │││
│ │             │ ├─────────────────────────────┤ │ │ Aba: Histórico  │││
│ │ [Filtros]   │ │                             │ │ │ Aba: Ações      │││
│ │ Status      │ │ MessageList                 │ │ │                 │││
│ │ Prioridade  │ │ (scrollable)                │ │ │ • Dados cliente │││
│ │ Busca       │ │                             │ │ │ • Segmento VIP  │││
│ │             │ │                             │ │ │ • Estatísticas  │││
│ │ [Lista]     │ │                             │ │ │ • Últimas 10    │││
│ │ #123 ⭐ VIP │ │                             │ │ │   compras       │││
│ │ #122 📌     │ │                             │ │ │ • Tickets ant.  │││
│ │ #121        │ │                             │ │ │                 │││
│ │ ...         │ └─────────────────────────────┘ │ └─────────────────┘││
│ │             │ ┌─────────────────────────────┐ │                     ││
│ │             │ │ [Templates] [Status] [📎]   │ │                     ││
│ │             │ │ MessageInput (auto-resize)  │ │                     ││
│ │             │ └─────────────────────────────┘ │                     ││
│ └─────────────┴─────────────────────────────────┴─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### **2. Estrutura de Núcleo "Atendimento"**
```
/atendimento (Layout Wrapper)
├── /atendimento/chat         → Chat principal (atual)
├── /atendimento/tickets      → Gerenciamento de tickets (tabela)
├── /atendimento/filas        → Gestão de filas de atendimento
├── /atendimento/agentes      → Gerenciamento de agentes
├── /atendimento/relatorios   → Analytics de atendimento
└── /atendimento/configuracoes→ Configurações do núcleo
```

**Navegação Interna** (Tabs horizontal ou sidebar dentro do núcleo):
```tsx
<div className="border-b bg-white">
  <nav className="flex gap-1 px-6">
    <Link to="/atendimento/chat">💬 Chat</Link>
    <Link to="/atendimento/tickets">🎫 Tickets</Link>
    <Link to="/atendimento/filas">📋 Filas</Link>
    <Link to="/atendimento/agentes">👥 Agentes</Link>
    <Link to="/atendimento/relatorios">📊 Relatórios</Link>
    <Link to="/atendimento/configuracoes">⚙️ Config</Link>
  </nav>
</div>
```

### **3. Vinculação Cliente → Contatos**
```typescript
// Backend: Nova entity
@Entity('contatos')
export class Contato {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  telefone: string;

  @Column()
  cargo: string; // "Gerente", "Comprador", "Financeiro", etc

  @ManyToOne(() => Cliente, cliente => cliente.contatos)
  cliente: Cliente;

  @Column()
  clienteId: string; // FK
}

// Cliente (atualizar)
@Entity('clientes')
export class Cliente {
  // ... campos existentes

  @OneToMany(() => Contato, contato => contato.cliente)
  contatos: Contato[];
}

// Frontend: Dropdown no PainelContextoCliente
<div className="border-b p-4">
  <label className="text-xs text-gray-500 block mb-1">
    Contato Ativo
  </label>
  <select
    value={contatoSelecionadoId}
    onChange={handleMudarContato}
    className="w-full px-3 py-2 border rounded-lg focus:ring-[#159A9C]"
  >
    <option value="">Contato Principal</option>
    {cliente.contatos?.map(contato => (
      <option key={contato.id} value={contato.id}>
        {contato.nome} ({contato.cargo})
      </option>
    ))}
  </select>
</div>
```

### **4. Tema Padrão do Sistema** (Paleta Crevasse)
```typescript
// ThemeContext.tsx (já existe)
const crevassePalette = {
  primary: '#159A9C',        // Teal principal
  primaryHover: '#0F7B7D',   // Teal escuro
  primaryLight: '#DEEFE7',   // Verde claro suave
  primaryDark: '#0A5F61',    // Teal muito escuro
  secondary: '#B4BEC9',      // Cinza azulado
  dark: '#002333',           // Azul escuro (sidebar)
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Aplicar em componentes
<button className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white">
  Enviar
</button>

<input className="focus:ring-[#159A9C] focus:border-[#159A9C]" />

<div className="bg-[#DEEFE7] text-[#002333]">
  Notificação
</div>
```

---

## 🏗️ Arquitetura Proposta

### **Estrutura de Arquivos**
```
frontend-web/src/
├── layouts/
│   └── AtendimentoLayout.tsx         // NOVO: Layout wrapper do núcleo
├── features/
│   └── atendimento/
│       ├── chat/
│       │   ├── AtendimentoChatPage.tsx    // NOVO: Migrar atual
│       │   ├── TicketList.tsx             // MOVER: De components/chat
│       │   ├── MessageList.tsx            // MOVER
│       │   ├── MessageInput.tsx           // MOVER
│       │   ├── ChatHeader.tsx             // NOVO: Extrair do atual
│       │   ├── TicketFilters.tsx          // NOVO: Filtros
│       │   ├── TicketStats.tsx            // NOVO: KPIs
│       │   └── TemplatesRapidos.tsx       // NOVO: Respostas rápidas
│       ├── tickets/
│       │   └── AtendimentoTicketsPage.tsx // NOVO: Tabela todos tickets
│       ├── filas/
│       │   └── AtendimentoFilasPage.tsx   // NOVO: Gestão filas
│       ├── agentes/
│       │   └── AtendimentoAgentesPage.tsx // NOVO: Gestão agentes
│       ├── relatorios/
│       │   └── AtendimentoRelatoriosPage.tsx // NOVO: Analytics
│       └── configuracoes/
│           └── AtendimentoConfigPage.tsx  // NOVO: Config
└── components/
    ├── chat/
    │   ├── PainelContextoCliente.tsx      // MANTER (atualizar)
    │   ├── BuscaRapida.tsx                // MANTER
    │   └── TypingIndicator.tsx            // USAR (não está sendo usado)
    └── navigation/
        └── AtendimentoNavBar.tsx          // NOVO: Tabs internas
```

### **Rotas Atualizadas**
```tsx
// App.tsx
import { AtendimentoLayout } from './layouts/AtendimentoLayout';
import { AtendimentoChatPage } from './features/atendimento/chat/AtendimentoChatPage';
import { AtendimentoTicketsPage } from './features/atendimento/tickets/AtendimentoTicketsPage';
// ... outros imports

<Route path="/atendimento" element={<AtendimentoLayout />}>
  <Route index element={<Navigate to="/atendimento/chat" replace />} />
  <Route path="chat" element={<AtendimentoChatPage />} />
  <Route path="tickets" element={<AtendimentoTicketsPage />} />
  <Route path="filas" element={<AtendimentoFilasPage />} />
  <Route path="agentes" element={<AtendimentoAgentesPage />} />
  <Route path="relatorios" element={<AtendimentoRelatoriosPage />} />
  <Route path="configuracoes" element={<AtendimentoConfigPage />} />
</Route>
```

---

## 🎨 Design Detalhado dos Componentes

### **1. TicketStats.tsx** (KPIs no topo)
```tsx
export function TicketStats({ tickets }: { tickets: Ticket[] }) {
  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === 'ABERTO').length,
    emAtendimento: tickets.filter(t => t.status === 'EM_ATENDIMENTO').length,
    resolvidos: tickets.filter(t => t.status === 'RESOLVIDO').length,
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 border-b">
      <StatCard
        icon="📊"
        label="Total"
        value={stats.total}
        color="text-gray-600"
      />
      <StatCard
        icon="📬"
        label="Abertos"
        value={stats.abertos}
        color="text-blue-600"
      />
      <StatCard
        icon="💬"
        label="Em Atendimento"
        value={stats.emAtendimento}
        color="text-yellow-600"
      />
      <StatCard
        icon="✅"
        label="Resolvidos"
        value={stats.resolvidos}
        color="text-green-600"
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
```

### **2. TicketFilters.tsx** (Filtros completos)
```tsx
export function TicketFilters({ filters, onChange }: TicketFiltersProps) {
  return (
    <div className="p-3 border-b space-y-2">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone..."
          value={filters.busca}
          onChange={(e) => onChange({ ...filters, busca: e.target.value })}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
      >
        <option value="todos">📋 Todos os Status</option>
        <option value="ABERTO">📬 Abertos</option>
        <option value="EM_ATENDIMENTO">💬 Em Atendimento</option>
        <option value="RESOLVIDO">✅ Resolvidos</option>
        <option value="FECHADO">🔒 Fechados</option>
      </select>

      {/* Prioridade */}
      <select
        value={filters.prioridade}
        onChange={(e) => onChange({ ...filters, prioridade: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
      >
        <option value="todas">⚡ Todas as Prioridades</option>
        <option value="ALTA">🔴 Alta</option>
        <option value="MEDIA">🟡 Média</option>
        <option value="BAIXA">🟢 Baixa</option>
      </select>

      {/* Ordenação */}
      <select
        value={filters.ordenacao}
        onChange={(e) => onChange({ ...filters, ordenacao: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
      >
        <option value="recente">🕒 Mais Recentes</option>
        <option value="antigo">⏳ Mais Antigos</option>
        <option value="prioridade">⚡ Por Prioridade</option>
      </select>
    </div>
  );
}
```

### **3. TicketList.tsx** (Lista aprimorada)
```tsx
export function TicketList({ tickets, activeTicketId, onTicketSelect }: TicketListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {tickets.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          Nenhum ticket encontrado
        </div>
      ) : (
        tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            active={ticket.id === activeTicketId}
            onClick={() => onTicketSelect(ticket.id)}
          />
        ))
      )}
    </div>
  );
}

function TicketCard({ ticket, active, onClick }: TicketCardProps) {
  const segmento = ticket.cliente?.segmento; // Assumindo vinculação

  return (
    <div
      onClick={onClick}
      className={`p-3 border-b cursor-pointer transition-colors ${
        active
          ? 'bg-[#DEEFE7] border-l-4 border-l-[#159A9C]'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Header: Número + Status + Prioridade */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            #{ticket.numero}
          </span>
          {segmento === 'VIP' && (
            <span className="text-xs">⭐</span>
          )}
          {ticket.prioridade === 'ALTA' && (
            <span className="text-xs">🔴</span>
          )}
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Nome do Contato */}
      <div className="font-medium text-sm text-gray-900 mb-1">
        {ticket.contatoNome || 'Sem nome'}
      </div>

      {/* Última mensagem (preview) */}
      <div className="text-xs text-gray-500 truncate mb-1">
        {ticket.ultimaMensagem || 'Nenhuma mensagem'}
      </div>

      {/* Footer: Tempo + Canal */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>📱 {ticket.contatoTelefone}</span>
        <span>{formatTimeAgo(ticket.updatedAt)}</span>
      </div>
    </div>
  );
}
```

### **4. ChatHeader.tsx** (Cabeçalho aprimorado)
```tsx
export function ChatHeader({ ticket, onToggleContexto, contextoAberto }: ChatHeaderProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white border-b px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Info do Contato */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-full flex items-center justify-center text-white font-semibold">
            {ticket.contatoNome?.[0]?.toUpperCase() || '?'}
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {ticket.contatoNome || 'Sem nome'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Ticket #{ticket.numero}</span>
              <span>•</span>
              <span>📱 {ticket.contatoTelefone}</span>
              {ticket.cliente?.segmento === 'VIP' && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600 font-medium">⭐ VIP</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Ações */}
        <div className="flex items-center gap-2">
          {/* Status Atual */}
          <StatusBadge status={ticket.status} size="lg" />

          {/* Botão Mudar Status */}
          <select
            value={ticket.status}
            onChange={(e) => handleMudarStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] cursor-pointer"
          >
            <option value="ABERTO">📬 Aberto</option>
            <option value="EM_ATENDIMENTO">💬 Em Atendimento</option>
            <option value="RESOLVIDO">✅ Resolvido</option>
            <option value="FECHADO">🔒 Fechado</option>
          </select>

          {/* Botão Ações Rápidas */}
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mais ações"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {/* Toggle Painel Contexto */}
          <button
            onClick={onToggleContexto}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            title={contextoAberto ? 'Ocultar contexto' : 'Mostrar contexto'}
          >
            <span>{contextoAberto ? '✖️' : '📊'}</span>
            <span>{contextoAberto ? 'Ocultar' : 'Contexto'}</span>
          </button>
        </div>
      </div>

      {/* Dropdown Ações Rápidas */}
      {showActions && (
        <div className="absolute right-6 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
            <Users className="w-4 h-4" /> Transferir Ticket
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Adicionar Nota
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Adicionar Tag
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Fechar Ticket
          </button>
        </div>
      )}
    </div>
  );
}
```

### **5. TemplatesRapidos.tsx** (Respostas rápidas)
```tsx
export function TemplatesRapidos({ onSelecionarTemplate }: TemplatesRapidosProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    { id: 1, titulo: 'Saudação', texto: 'Olá! Como posso ajudar você hoje?' },
    { id: 2, titulo: 'Aguarde', texto: 'Por favor, aguarde um momento enquanto verifico isso para você.' },
    { id: 3, titulo: 'Resolvido', texto: 'Problema resolvido! Posso ajudar com algo mais?' },
    { id: 4, titulo: 'Transferir', texto: 'Vou transferir você para um especialista. Um momento, por favor.' },
    { id: 5, titulo: 'Horário', texto: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Respostas rápidas"
      >
        <MessageSquare className="w-5 h-5 text-gray-600" />
      </button>

      {showTemplates && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-900">
              Respostas Rápidas
            </h3>
          </div>
          <div className="py-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelecionarTemplate(template.texto);
                  setShowTemplates(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {template.titulo}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {template.texto}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### **6. AtendimentoLayout.tsx** (Layout Wrapper)
```tsx
export function AtendimentoLayout() {
  return (
    <div className="flex flex-col h-screen">
      {/* Navegação Interna do Núcleo */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            💬 Núcleo de Atendimento
          </h1>
          <nav className="flex gap-1">
            <NavLink to="/atendimento/chat">Chat</NavLink>
            <NavLink to="/atendimento/tickets">Tickets</NavLink>
            <NavLink to="/atendimento/filas">Filas</NavLink>
            <NavLink to="/atendimento/agentes">Agentes</NavLink>
            <NavLink to="/atendimento/relatorios">Relatórios</NavLink>
            <NavLink to="/atendimento/configuracoes">
              <Settings className="w-4 h-4" />
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

function NavLink({ to, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-[#159A9C] text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}
```

---

## 📦 Backend: Vinculação Cliente → Contatos

### **1. Entity Contato**
```typescript
// backend/src/modules/crm/entities/contato.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('contatos')
export class Contato {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  telefone: string;

  @Column({ nullable: true })
  cargo: string; // "Gerente", "Comprador", "Financeiro", etc

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: false })
  principal: boolean; // Contato principal da empresa

  @ManyToOne(() => Cliente, cliente => cliente.contatos)
  cliente: Cliente;

  @Column()
  clienteId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **2. Atualizar Entity Cliente**
```typescript
// backend/src/modules/crm/entities/cliente.entity.ts
import { OneToMany } from 'typeorm';
import { Contato } from './contato.entity';

@Entity('clientes')
export class Cliente {
  // ... campos existentes

  @OneToMany(() => Contato, contato => contato.cliente)
  contatos: Contato[];
}
```

### **3. Migration**
```typescript
// backend/src/migrations/XXXX-create-contatos-table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateContatosTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contatos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'telefone',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'cargo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'principal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'clienteId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'contatos',
      new TableForeignKey({
        columnNames: ['clienteId'],
        referencedTableName: 'clientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contatos');
  }
}
```

### **4. Controller Contatos**
```typescript
// backend/src/modules/crm/controllers/contatos.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ContatosService } from '../services/contatos.service';
import { CreateContatoDto, UpdateContatoDto } from '../dto/contato.dto';

@Controller('api/crm/clientes/:clienteId/contatos')
@UseGuards(JwtAuthGuard)
export class ContatosController {
  constructor(private readonly contatosService: ContatosService) {}

  @Get()
  async listar(@Param('clienteId') clienteId: string) {
    return this.contatosService.listarPorCliente(clienteId);
  }

  @Post()
  async criar(
    @Param('clienteId') clienteId: string,
    @Body() createContatoDto: CreateContatoDto,
  ) {
    return this.contatosService.criar(clienteId, createContatoDto);
  }

  @Patch(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() updateContatoDto: UpdateContatoDto,
  ) {
    return this.contatosService.atualizar(id, updateContatoDto);
  }

  @Delete(':id')
  async remover(@Param('id') id: string) {
    return this.contatosService.remover(id);
  }
}
```

### **5. Service Contatos**
```typescript
// backend/src/modules/crm/services/contatos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contato } from '../entities/contato.entity';
import { CreateContatoDto, UpdateContatoDto } from '../dto/contato.dto';

@Injectable()
export class ContatosService {
  constructor(
    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,
  ) {}

  async listarPorCliente(clienteId: string): Promise<Contato[]> {
    return this.contatoRepository.find({
      where: { clienteId, ativo: true },
      order: { principal: 'DESC', nome: 'ASC' },
    });
  }

  async criar(clienteId: string, createContatoDto: CreateContatoDto): Promise<Contato> {
    const contato = this.contatoRepository.create({
      ...createContatoDto,
      clienteId,
    });
    return this.contatoRepository.save(contato);
  }

  async atualizar(id: string, updateContatoDto: UpdateContatoDto): Promise<Contato> {
    const contato = await this.contatoRepository.findOne({ where: { id } });
    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }
    Object.assign(contato, updateContatoDto);
    return this.contatoRepository.save(contato);
  }

  async remover(id: string): Promise<void> {
    await this.contatoRepository.update(id, { ativo: false });
  }
}
```

---

## 🚀 Plano de Implementação

### **FASE 1: Infraestrutura Base** (4 horas)
1. ✅ **Backend: Criar Entity Contato** (30min)
   - `contato.entity.ts`
   - Atualizar `cliente.entity.ts`
   - Migration

2. ✅ **Backend: APIs de Contatos** (1h)
   - Controller + Service + DTOs
   - Endpoints CRUD

3. ✅ **Frontend: Criar AtendimentoLayout** (1h)
   - `layouts/AtendimentoLayout.tsx`
   - Navegação interna (tabs)
   - Outlet para rotas

4. ✅ **Frontend: Reorganizar Estrutura** (1h 30min)
   - Mover `AtendimentoPage` → `AtendimentoChatPage`
   - Criar pasta `features/atendimento/chat/`
   - Mover componentes atuais
   - Atualizar imports

---

### **FASE 2: Layout Chat Full-Width** (4 horas)
5. ✅ **TicketStats.tsx** (30min)
   - 4 cards de KPIs
   - Cálculo de estatísticas

6. ✅ **TicketFilters.tsx** (1h)
   - Busca
   - Status
   - Prioridade
   - Ordenação

7. ✅ **TicketList.tsx Aprimorada** (1h)
   - Layout 400px
   - Cards melhorados
   - Indicadores VIP/prioridade

8. ✅ **ChatHeader.tsx** (1h)
   - Extrair do atual
   - Dropdown de status
   - Menu de ações

9. ✅ **TemplatesRapidos.tsx** (30min)
   - Dropdown com templates
   - Integração com MessageInput

---

### **FASE 3: Vinculação Cliente → Contatos** (2 horas)
10. ✅ **Atualizar PainelContextoCliente** (1h)
    - Dropdown de contatos
    - Carregar contatos do cliente
    - Mudar contato ativo

11. ✅ **API Integration** (30min)
    - Buscar contatos ao abrir painel
    - Estado de contato selecionado

12. ✅ **Testes** (30min)
    - Criar contatos de teste
    - Testar dropdown
    - Testar mudança de contato

---

### **FASE 4: Páginas do Núcleo** (4 horas)
13. ✅ **AtendimentoTicketsPage** (1h)
    - Tabela com todos tickets
    - Filtros avançados
    - Paginação

14. ✅ **AtendimentoFilasPage** (1h)
    - Lista de filas
    - Distribuição de tickets
    - Agentes por fila

15. ✅ **AtendimentoAgentesPage** (1h)
    - Lista de agentes
    - Status (online, offline, ocupado)
    - Tickets atribuídos

16. ✅ **AtendimentoRelatoriosPage** (1h)
    - Gráficos de atendimento
    - Tempo médio de resposta
    - Satisfação do cliente

---

### **FASE 5: Ajustes Finais** (2 horas)
17. ✅ **Responsividade** (30min)
    - Mobile: ocultar contexto por padrão
    - Tablet: layout adaptado

18. ✅ **Testes End-to-End** (1h)
    - WebSocket mantém funcionando
    - Busca rápida (Ctrl+K) funciona
    - Painel contexto carrega dados
    - Navegação entre telas

19. ✅ **Documentação** (30min)
    - Atualizar README
    - Screenshots do novo layout
    - Guia de uso

---

## 📊 Estimativa de Tempo

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Infraestrutura Base | 4h |
| 2 | Layout Chat Full-Width | 4h |
| 3 | Vinculação Cliente → Contatos | 2h |
| 4 | Páginas do Núcleo | 4h |
| 5 | Ajustes Finais | 2h |
| **TOTAL** | | **16h** (2 dias) |

---

## ✅ Checklist de Implementação

### **Backend**
- [ ] Entity `Contato`
- [ ] Migration `create-contatos-table`
- [ ] Controller `ContatosController`
- [ ] Service `ContatosService`
- [ ] DTOs `CreateContatoDto`, `UpdateContatoDto`
- [ ] Atualizar `Cliente.entity` (OneToMany)
- [ ] Compilar e testar (0 erros)

### **Frontend - Estrutura**
- [ ] Layout `AtendimentoLayout.tsx`
- [ ] Rota `/atendimento` com Outlet
- [ ] Navegação interna (tabs)
- [ ] Mover `AtendimentoPage` → `AtendimentoChatPage`
- [ ] Reorganizar pasta `features/atendimento/`

### **Frontend - Chat**
- [ ] Componente `TicketStats.tsx`
- [ ] Componente `TicketFilters.tsx`
- [ ] Atualizar `TicketList.tsx`
- [ ] Componente `ChatHeader.tsx`
- [ ] Componente `TemplatesRapidos.tsx`
- [ ] Atualizar `PainelContextoCliente.tsx` (dropdown contatos)
- [ ] Layout full-width (400px + flex-1 + 380px)

### **Frontend - Páginas**
- [ ] `AtendimentoTicketsPage.tsx`
- [ ] `AtendimentoFilasPage.tsx`
- [ ] `AtendimentoAgentesPage.tsx`
- [ ] `AtendimentoRelatoriosPage.tsx`
- [ ] `AtendimentoConfigPage.tsx`

### **Testes**
- [ ] Backend: CRUD contatos funciona
- [ ] Frontend: Layout full-width sem espaços
- [ ] WebSocket: Mensagens real-time funcionam
- [ ] Busca rápida: Ctrl+K funciona
- [ ] Painel contexto: Carrega dados
- [ ] Navegação: Troca entre telas
- [ ] Dropdown: Troca contato ativo
- [ ] Tema: Cores #159A9C aplicadas

---

## 🎯 Resultado Final Esperado

**Antes (Atual)**:
```
┌────────────────────────────────────────────────────┐
│ [Espaço] [Tickets 320px] [Chat] [Contexto] [Espaço]│
│                                                     │
│ ❌ Espaços vazios                                   │
│ ❌ Sem filtros                                      │
│ ❌ Sem stats                                        │
│ ❌ Sem templates                                    │
│ ❌ Estrutura monolítica                            │
└────────────────────────────────────────────────────┘
```

**Depois (Redesign)**:
```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar Global (DashboardLayout)                           │
├─────────────────────────────────────────────────────────────┤
│ Navegação: [Chat] [Tickets] [Filas] [Agentes] [Relatórios]│
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬────────────────────────┬────────────────────┐ │
│ │ TICKETS  │ CHAT PRINCIPAL         │ CONTEXTO CLIENTE   │ │
│ │ 400px    │ flex-1 (full-width)    │ 380px (colapsável) │ │
│ │          │                        │                    │ │
│ │ [Stats]  │ ┌────────────────────┐ │ [Dropdown Contatos]│ │
│ │ KPIs     │ │ Header + Ações     │ │ João Silva (Ger.) │ │
│ │          │ ├────────────────────┤ │ Maria (Comprador)  │ │
│ │ [Filtros]│ │ MessageList        │ │                    │ │
│ │ Status   │ │                    │ │ [Info Cliente]     │ │
│ │ Prior.   │ │                    │ │ Segmento: VIP ⭐   │ │
│ │ Busca    │ │                    │ │ Ticket: 15 abertos │ │
│ │          │ │                    │ │                    │ │
│ │ [Lista]  │ └────────────────────┘ │ [Histórico]        │ │
│ │ #123 ⭐  │ [Templates] [Status]   │ Últimas compras    │ │
│ │ #122 🔴  │ MessageInput           │ Faturas pendentes  │ │
│ └──────────┴────────────────────────┴────────────────────┘ │
│                                                             │
│ ✅ Full-width sem espaços                                  │
│ ✅ Filtros completos                                       │
│ ✅ Stats em tempo real                                     │
│ ✅ Templates rápidos                                       │
│ ✅ Estrutura de núcleo                                     │
│ ✅ Vinculação Cliente → Contatos                           │
│ ✅ Tema #159A9C aplicado                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Próximos Passos

**Aguardando aprovação do user para:**
1. ✅ Confirmar arquitetura proposta
2. ✅ Confirmar design dos componentes
3. ✅ Confirmar estrutura de rotas
4. ✅ Confirmar vinculação Cliente → Contatos

**Após aprovação, iniciar implementação:**
- FASE 1: Backend (Contatos)
- FASE 2: Layout Chat
- FASE 3: Vinculação Frontend
- FASE 4: Páginas do Núcleo
- FASE 5: Testes e Ajustes

---

**Documento criado**: Janeiro 2025  
**Última atualização**: Janeiro 2025  
**Autor**: GitHub Copilot + User  
**Status**: 📋 AGUARDANDO APROVAÇÃO
