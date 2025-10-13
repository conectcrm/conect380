# 🎯 SPRINT 1: Painel Contexto Cliente + Busca Rápida

## 📋 Objetivo
Implementar as **2 funcionalidades MAIS CRÍTICAS** para que agentes **não precisem sair do chat** durante atendimento.

---

## 🚀 Funcionalidades

### **1. Painel de Contexto do Cliente** ⭐⭐⭐⭐⭐
**Sidebar direita** com dados completos do cliente atual:
- 📊 Dados básicos (email, empresa, telefone, segmento)
- 📈 Estatísticas (total gasto, tickets resolvidos, avaliação)
- 📝 Histórico de propostas (últimas 5)
- 💰 Faturas (pendentes + pagas)
- 🎫 Tickets anteriores (últimos 5)
- ⚡ Ações rápidas (criar proposta, criar fatura, ver perfil completo)

### **2. Busca Rápida (Ctrl+K)** ⭐⭐⭐⭐⭐
**Modal estilo Command Palette** para buscar instantaneamente:
- 📄 Propostas (por número ou cliente)
- 💵 Faturas (por número ou status)
- 👤 Clientes (por nome, email, telefone)
- 📦 Pedidos (por número)
- ⚡ Enviar resultado direto no chat

---

## 🏗️ Arquitetura

### **Backend (NestJS)**
```
backend/src/modules/atendimento/
├── controllers/
│   ├── contexto-cliente.controller.ts  (NOVO)
│   └── busca-global.controller.ts      (NOVO)
├── services/
│   ├── contexto-cliente.service.ts     (NOVO)
│   └── busca-global.service.ts         (NOVO)
└── dto/
    ├── contexto-cliente.dto.ts         (NOVO)
    └── busca-global.dto.ts             (NOVO)
```

### **Frontend (React)**
```
frontend-web/src/components/chat/
├── PainelContextoCliente.tsx           (NOVO - 300 linhas)
├── BuscaRapida.tsx                     (NOVO - 250 linhas)
└── AtendimentoPage.tsx                 (MODIFICADO)

frontend-web/src/hooks/
└── useBuscaRapida.ts                   (NOVO - 100 linhas)
```

---

## 📊 API Endpoints

### **1. Contexto do Cliente**
```typescript
GET /api/atendimento/clientes/:clienteId/contexto

Response: {
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    empresa?: string;
    segmento: 'VIP' | 'Regular' | 'Novo';
    primeiroContato: Date;
    ultimoContato: Date;
  };
  
  estatisticas: {
    valorTotalGasto: number;      // R$ 25.450,00
    totalTickets: number;          // 20
    ticketsResolvidos: number;     // 18
    ticketsAbertos: number;        // 2
    avaliacaoMedia: number;        // 4.8
    tempoMedioResposta: string;   // "5 minutos"
  };
  
  historico: {
    propostas: Proposta[];         // Últimas 5
    faturas: Fatura[];             // Últimas 5
    tickets: Ticket[];             // Últimos 5
  };
}
```

### **2. Busca Global**
```typescript
POST /api/atendimento/busca-global

Body: {
  query: string;           // "João Silva"
  tipos?: string[];        // ['PROPOSTA', 'FATURA', 'CLIENTE']
  empresaId: string;
  limite?: number;         // Default: 10
}

Response: {
  resultados: [
    {
      tipo: 'PROPOSTA' | 'FATURA' | 'CLIENTE' | 'PEDIDO';
      id: string;
      titulo: string;        // "Proposta #2025-0015"
      subtitulo: string;     // "João Silva - R$ 5.200,00"
      status: string;        // "ENVIADA"
      valor?: number;
      data: Date;
      relevancia: number;    // 0-1
      
      // Dados completos
      dados: Proposta | Fatura | Cliente | Pedido;
    }
  ];
  
  totalResultados: number;
  tempoMs: number;
}
```

---

## 🎨 UI/UX Design

### **Painel Contexto Cliente**

```
┌─────────────────────────────────────┐
│ 📊 CONTEXTO - João Silva          × │
├─────────────────────────────────────┤
│ [Info] [Histórico] [Ações]         │
├─────────────────────────────────────┤
│                                     │
│ ABA: INFO                           │
│ ├─ 📧 joao@email.com               │
│ ├─ 📱 +55 62 99668-9991            │
│ ├─ 🏢 Empresa XYZ Ltda             │
│ ├─ 🏷️ VIP                         │
│ └─ 📅 Cliente desde 15/08/2024     │
│                                     │
│ 📊 ESTATÍSTICAS                     │
│ ├─ 💰 R$ 25.450,00 gasto          │
│ ├─ 🎫 20 tickets (18 resolvidos)   │
│ ├─ ⭐ 4.8 avaliação               │
│ └─ ⚡ 5 min tempo médio resposta   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ ABA: HISTÓRICO                      │
│                                     │
│ 📄 PROPOSTAS (5)                    │
│ ├─ #2025-0015 | ENVIADA | R$ 5.2k │
│ ├─ #2025-0012 | APROVADA | R$ 3.1k│
│ └─ [Ver todas →]                   │
│                                     │
│ 💰 FATURAS (3 pendentes)            │
│ ├─ #2025-0032 | VENCE 15/10 | R$1k│
│ ├─ #2025-0028 | PAGA | R$ 1.2k    │
│ └─ [Ver todas →]                   │
│                                     │
│ 🎫 TICKETS ANTERIORES (5)           │
│ ├─ #1 RESOLVIDO | 3 dias atrás    │
│ ├─ #2 RESOLVIDO | 1 semana        │
│ └─ [Ver todos →]                   │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ ABA: AÇÕES                          │
│                                     │
│ [📄 Nova Proposta]                 │
│ [💰 Nova Fatura]                   │
│ [🎯 Nova Oportunidade]             │
│ [📅 Agendar Follow-up]             │
│ [🔗 Ver Perfil CRM]                │
│                                     │
└─────────────────────────────────────┘
```

### **Busca Rápida (Ctrl+K)**

```
┌─────────────────────────────────────────┐
│ 🔍 Buscar...                           │
│ [João Silva proposta_______________]   │
├─────────────────────────────────────────┤
│                                         │
│ PROPOSTAS (2)                           │
│ ├─ 📄 Proposta #2025-0015              │
│ │   João Silva - R$ 5.200,00 ENVIADA  │
│ │   [Enter: Ver] [Ctrl+S: Enviar chat]│
│ │                                       │
│ └─ 📄 Proposta #2025-0012              │
│     João Silva - R$ 3.100,00 APROVADA │
│                                         │
│ CLIENTES (1)                            │
│ └─ 👤 João Silva                       │
│     joao@email.com | 🏷️ VIP          │
│     [Enter: Ver perfil]                │
│                                         │
│ ⌨️ Ctrl+↑↓ navegar | Enter selecionar │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementação Passo-a-Passo

### **ETAPA 1: Backend - API Contexto Cliente** (2 dias)

#### **Passo 1.1: Criar DTOs**
```typescript
// backend/src/modules/atendimento/dto/contexto-cliente.dto.ts

export class ContextoClienteResponseDto {
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    empresa?: string;
    segmento: 'VIP' | 'Regular' | 'Novo';
    primeiroContato: Date;
    ultimoContato: Date;
  };
  
  estatisticas: {
    valorTotalGasto: number;
    totalTickets: number;
    ticketsResolvidos: number;
    ticketsAbertos: number;
    avaliacaoMedia: number;
    tempoMedioResposta: string;
  };
  
  historico: {
    propostas: any[];
    faturas: any[];
    tickets: any[];
  };
}
```

#### **Passo 1.2: Criar Service**
```typescript
// backend/src/modules/atendimento/services/contexto-cliente.service.ts

@Injectable()
export class ContextoClienteService {
  constructor(
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @InjectRepository(Proposta) private propostaRepo: Repository<Proposta>,
    @InjectRepository(Fatura) private faturaRepo: Repository<Fatura>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  async obterContexto(clienteId: string): Promise<ContextoClienteResponseDto> {
    // 1. Buscar cliente
    const cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    
    // 2. Buscar estatísticas
    const [propostas, faturas, tickets] = await Promise.all([
      this.propostaRepo.find({ where: { clienteId }, take: 5, order: { criadaEm: 'DESC' } }),
      this.faturaRepo.find({ where: { clienteId }, take: 5, order: { criadoEm: 'DESC' } }),
      this.ticketRepo.find({ where: { clienteId }, take: 5, order: { criadoEm: 'DESC' } }),
    ]);
    
    // 3. Calcular estatísticas
    const valorTotalGasto = await this.calcularValorTotal(clienteId);
    const avaliacaoMedia = await this.calcularAvaliacaoMedia(clienteId);
    
    // 4. Retornar contexto completo
    return {
      cliente: { ...cliente },
      estatisticas: { ... },
      historico: { propostas, faturas, tickets },
    };
  }
}
```

#### **Passo 1.3: Criar Controller**
```typescript
// backend/src/modules/atendimento/controllers/contexto-cliente.controller.ts

@Controller('api/atendimento/clientes')
export class ContextoClienteController {
  constructor(private contextoService: ContextoClienteService) {}

  @Get(':clienteId/contexto')
  @UseGuards(JwtAuthGuard)
  async obterContexto(@Param('clienteId') clienteId: string) {
    return this.contextoService.obterContexto(clienteId);
  }
}
```

---

### **ETAPA 2: Backend - API Busca Global** (2 dias)

#### **Passo 2.1: Criar DTOs**
```typescript
// backend/src/modules/atendimento/dto/busca-global.dto.ts

export class BuscaGlobalRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;
  
  @IsOptional()
  @IsArray()
  tipos?: ('PROPOSTA' | 'FATURA' | 'CLIENTE' | 'PEDIDO')[];
  
  @IsString()
  @IsNotEmpty()
  empresaId: string;
  
  @IsOptional()
  @IsNumber()
  limite?: number = 10;
}

export class ResultadoBuscaDto {
  tipo: 'PROPOSTA' | 'FATURA' | 'CLIENTE' | 'PEDIDO';
  id: string;
  titulo: string;
  subtitulo: string;
  status: string;
  valor?: number;
  data: Date;
  relevancia: number;
  dados: any;
}
```

#### **Passo 2.2: Criar Service com Full-Text Search**
```typescript
// backend/src/modules/atendimento/services/busca-global.service.ts

@Injectable()
export class BuscaGlobalService {
  async buscar(dto: BuscaGlobalRequestDto): Promise<ResultadoBuscaDto[]> {
    const resultados: ResultadoBuscaDto[] = [];
    
    // Buscar em paralelo
    const [propostas, faturas, clientes, pedidos] = await Promise.all([
      this.buscarPropostas(dto.query, dto.empresaId),
      this.buscarFaturas(dto.query, dto.empresaId),
      this.buscarClientes(dto.query, dto.empresaId),
      this.buscarPedidos(dto.query, dto.empresaId),
    ]);
    
    // Unificar e ordenar por relevância
    resultados.push(...propostas, ...faturas, ...clientes, ...pedidos);
    resultados.sort((a, b) => b.relevancia - a.relevancia);
    
    return resultados.slice(0, dto.limite);
  }
  
  private async buscarPropostas(query: string, empresaId: string) {
    const propostas = await this.propostaRepo
      .createQueryBuilder('p')
      .where('p.empresaId = :empresaId', { empresaId })
      .andWhere('(p.numero ILIKE :query OR p.cliente ILIKE :query)', { query: `%${query}%` })
      .orderBy('p.criadaEm', 'DESC')
      .take(5)
      .getMany();
    
    return propostas.map(p => ({
      tipo: 'PROPOSTA',
      id: p.id,
      titulo: `Proposta #${p.numero}`,
      subtitulo: `${p.cliente} - R$ ${p.total.toFixed(2)}`,
      status: p.status,
      valor: p.total,
      data: p.criadaEm,
      relevancia: this.calcularRelevancia(query, p.numero + p.cliente),
      dados: p,
    }));
  }
  
  private calcularRelevancia(query: string, texto: string): number {
    const queryLower = query.toLowerCase();
    const textoLower = texto.toLowerCase();
    
    // Exact match = 1.0
    if (textoLower === queryLower) return 1.0;
    
    // Starts with = 0.8
    if (textoLower.startsWith(queryLower)) return 0.8;
    
    // Contains = 0.5
    if (textoLower.includes(queryLower)) return 0.5;
    
    // Default = 0.3
    return 0.3;
  }
}
```

---

### **ETAPA 3: Frontend - Painel Contexto Cliente** (3 dias)

#### **Passo 3.1: Criar componente PainelContextoCliente.tsx**
```typescript
// frontend-web/src/components/chat/PainelContextoCliente.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PainelContextoClienteProps {
  clienteId: string;
  ticketId: string;
  onClose: () => void;
}

export function PainelContextoCliente({ clienteId, ticketId, onClose }: Props) {
  const [contexto, setContexto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'historico' | 'acoes'>('info');

  useEffect(() => {
    carregarContexto();
  }, [clienteId]);

  const carregarContexto = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/api/atendimento/clientes/${clienteId}/contexto`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContexto(response.data);
    } catch (error) {
      console.error('Erro ao carregar contexto:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">📊 Contexto do Cliente</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {/* Abas */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 ${abaAtiva === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setAbaAtiva('info')}
        >
          Info
        </button>
        <button
          className={`flex-1 py-2 ${abaAtiva === 'historico' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setAbaAtiva('historico')}
        >
          Histórico
        </button>
        <button
          className={`flex-1 py-2 ${abaAtiva === 'acoes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setAbaAtiva('acoes')}
        >
          Ações
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4">
        {abaAtiva === 'info' && <AbaInfo contexto={contexto} />}
        {abaAtiva === 'historico' && <AbaHistorico contexto={contexto} />}
        {abaAtiva === 'acoes' && <AbaAcoes clienteId={clienteId} ticketId={ticketId} />}
      </div>
    </div>
  );
}

// Sub-componentes...
function AbaInfo({ contexto }) { /* ... */ }
function AbaHistorico({ contexto }) { /* ... */ }
function AbaAcoes({ clienteId, ticketId }) { /* ... */ }
```

---

### **ETAPA 4: Frontend - Busca Rápida** (2 dias)

#### **Passo 4.1: Criar componente BuscaRapida.tsx**
```typescript
// frontend-web/src/components/chat/BuscaRapida.tsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface BuscaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
  onEnviarNoChat: (resultado: any) => void;
}

export function BuscaRapida({ isOpen, onClose, onEnviarNoChat }: Props) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus ao abrir
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Buscar ao digitar (debounce 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        buscar();
      } else {
        setResultados([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const buscar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const empresaId = localStorage.getItem('empresaId');
      
      const response = await axios.post(
        `${API_URL}/api/atendimento/busca-global`,
        { query, empresaId, limite: 10 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResultados(response.data.resultados);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultados[selectedIndex]) {
        handleSelecionar(resultados[selectedIndex]);
      }
    } else if (e.key === 's' && e.ctrlKey) {
      e.preventDefault();
      if (resultados[selectedIndex]) {
        onEnviarNoChat(resultados[selectedIndex]);
        onClose();
      }
    }
  };

  const handleSelecionar = (resultado: any) => {
    // Abrir em nova aba ou modal
    window.open(`/propostas/${resultado.id}`, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-32">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Input */}
        <div className="p-4 border-b">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="🔍 Buscar propostas, faturas, clientes..."
            className="w-full text-lg outline-none"
          />
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Buscando...
            </div>
          )}

          {!loading && resultados.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {!loading && resultados.length > 0 && (
            <div className="py-2">
              {agruparPorTipo(resultados).map(({ tipo, items }) => (
                <div key={tipo}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {tipo}S ({items.length})
                  </div>
                  {items.map((resultado, index) => (
                    <ResultadoItem
                      key={resultado.id}
                      resultado={resultado}
                      isSelected={resultados.indexOf(resultado) === selectedIndex}
                      onClick={() => handleSelecionar(resultado)}
                      onEnviarChat={() => onEnviarNoChat(resultado)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com atalhos */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-600 flex gap-4">
          <span>⌨️ ↑↓ navegar</span>
          <span>Enter selecionar</span>
          <span>Ctrl+S enviar no chat</span>
          <span>Esc fechar</span>
        </div>
      </div>
    </div>
  );
}

function ResultadoItem({ resultado, isSelected, onClick, onEnviarChat }) {
  return (
    <div
      className={`px-4 py-3 cursor-pointer border-l-4 ${
        isSelected ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium">{resultado.titulo}</div>
          <div className="text-sm text-gray-600">{resultado.subtitulo}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              resultado.status === 'APROVADA' ? 'bg-green-100 text-green-800' :
              resultado.status === 'ENVIADA' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {resultado.status}
            </span>
            {resultado.valor && (
              <span className="text-xs text-gray-500">
                R$ {resultado.valor.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnviarChat();
            }}
            className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
          >
            Enviar no chat
          </button>
        )}
      </div>
    </div>
  );
}

function agruparPorTipo(resultados: any[]) {
  const grupos: Record<string, any[]> = {};
  
  resultados.forEach(r => {
    if (!grupos[r.tipo]) {
      grupos[r.tipo] = [];
    }
    grupos[r.tipo].push(r);
  });
  
  return Object.entries(grupos).map(([tipo, items]) => ({ tipo, items }));
}
```

---

## ⏱️ Cronograma

| Etapa | Tarefa | Tempo | Status |
|-------|--------|-------|--------|
| 1️⃣ | Backend: API Contexto Cliente | 2 dias | 🔵 Pendente |
| 2️⃣ | Backend: API Busca Global | 2 dias | 🔵 Pendente |
| 3️⃣ | Frontend: Painel Contexto | 3 dias | 🔵 Pendente |
| 4️⃣ | Frontend: Busca Rápida | 2 dias | 🔵 Pendente |
| 5️⃣ | Integração + Testes | 1 dia | 🔵 Pendente |
| 6️⃣ | Documentação | 0.5 dia | 🔵 Pendente |
| **TOTAL** | | **10.5 dias** | |

---

## ✅ Checklist de Implementação

### **Backend**
- [ ] Criar DTO `ContextoClienteResponseDto`
- [ ] Criar service `ContextoClienteService`
- [ ] Criar controller `ContextoClienteController`
- [ ] Criar DTO `BuscaGlobalRequestDto`
- [ ] Criar service `BuscaGlobalService`
- [ ] Criar controller `BuscaGlobalController`
- [ ] Registrar controllers no módulo
- [ ] Testar endpoints com Postman/Insomnia

### **Frontend**
- [ ] Criar componente `PainelContextoCliente.tsx`
- [ ] Criar sub-componentes (AbaInfo, AbaHistorico, AbaAcoes)
- [ ] Criar componente `BuscaRapida.tsx`
- [ ] Criar hook `useBuscaRapida.ts`
- [ ] Integrar no `AtendimentoPage.tsx`
- [ ] Adicionar atalho global Ctrl+K
- [ ] Estilizar com Tailwind CSS
- [ ] Testar navegação por teclado

### **Testes**
- [ ] Testar API retorna dados corretos
- [ ] Testar painel renderiza histórico
- [ ] Testar busca filtra resultados
- [ ] Testar atalho Ctrl+K funciona
- [ ] Testar enviar resultado no chat
- [ ] Testar performance com muitos resultados

### **Documentação**
- [ ] Criar `IMPLEMENTACAO_SPRINT1.md`
- [ ] Documentar endpoints da API
- [ ] Documentar componentes React
- [ ] Criar screenshots/GIFs
- [ ] Atualizar README.md

---

## 🚀 Como Executar Após Implementação

### **1. Testar API Backend**
```bash
# Contexto do Cliente
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/atendimento/clientes/CLIENT_ID/contexto

# Busca Global
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"João","empresaId":"EMPRESA_ID"}' \
  http://localhost:3001/api/atendimento/busca-global
```

### **2. Testar Frontend**
```bash
# 1. Abrir página de atendimento
http://localhost:3000/atendimento

# 2. Selecionar um ticket

# 3. Painel de contexto deve aparecer à direita automaticamente

# 4. Pressionar Ctrl+K para abrir busca rápida

# 5. Digitar "João Silva" e ver resultados

# 6. Pressionar Ctrl+S para enviar no chat
```

---

## 📊 Métricas de Sucesso

### **Antes (sem implementação)**
- ⏱️ Tempo médio para buscar proposta: **2 minutos**
- 🔄 Agente precisa sair do chat: **5x por atendimento**
- 📉 Produtividade: **30 tickets/dia**

### **Depois (com implementação)**
- ⏱️ Tempo médio para buscar proposta: **5 segundos** (-96%)
- 🔄 Agente precisa sair do chat: **0x** (-100%)
- 📈 Produtividade: **60 tickets/dia** (+100%)

---

## 🎯 Próximos Passos (SPRINT 2)

Após concluir SPRINT 1, implementar:
1. ✅ Respostas Rápidas com variáveis
2. ✅ Ações Rápidas CRM (criar proposta inline)
3. ✅ Status de mensagens ✓✓
4. ✅ Notas internas

---

## 📝 Notas de Implementação

### **Decisões Arquiteturais**
1. **Painel colapsável** - Para não ocupar espaço quando não necessário
2. **Busca com debounce 300ms** - Evitar requisições excessivas
3. **Navegação por teclado** - Agilidade para usuários avançados
4. **Cache no frontend** - Evitar recarregar contexto a cada mudança de ticket
5. **Lazy loading histórico** - Carregar apenas quando necessário

### **Performance**
- API de contexto: **< 200ms**
- API de busca: **< 500ms**
- Renderização painel: **< 100ms**
- Abertura modal busca: **instantâneo**

### **Segurança**
- ✅ Autenticação JWT obrigatória
- ✅ Validação de empresaId (isolamento multi-tenant)
- ✅ Sanitização de inputs
- ✅ Rate limiting nas APIs

---

**Pronto para começar implementação!** 🚀
