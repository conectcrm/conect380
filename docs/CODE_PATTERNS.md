# 📐 Padrões de Código - ConectSuite

**Versão**: 1.0.0  
**Última atualização**: 6 de novembro de 2025

Este documento define os **padrões obrigatórios** de código do projeto. Todos os desenvolvedores devem seguir estas regras.

---

## 📋 Índice

1. [Princípios Gerais](#-princípios-gerais)
2. [TypeScript](#-typescript)
3. [Naming Conventions](#-naming-conventions)
4. [Backend (NestJS)](#-backend-nestjs)
5. [Frontend (React)](#-frontend-react)
6. [Zustand State Management](#-zustand-state-management)
7. [Hooks Customizados](#-hooks-customizados)
8. [Tratamento de Erros](#-tratamento-de-erros)
9. [Performance](#-performance)
10. [Testes](#-testes)

---

## 🎯 Princípios Gerais

### SOLID Principles

✅ **S - Single Responsibility**
```typescript
// ❌ Classe faz muita coisa
class TicketService {
  criar() {}
  enviarEmail() {}  // ← Deveria ser EmailService
  gerarPDF() {}     // ← Deveria ser PDFService
}

// ✅ Uma responsabilidade por classe
class TicketService {
  criar() {}
}

class EmailService {
  enviarEmail() {}
}
```

✅ **D - Dependency Injection**
```typescript
// ❌ Hard-coded dependency
class TicketService {
  private emailService = new EmailService();  // ← Difícil testar
}

// ✅ Inject via constructor
@Injectable()
class TicketService {
  constructor(private emailService: EmailService) {}  // ← Testável
}
```

### DRY (Don't Repeat Yourself)

```typescript
// ❌ Código duplicado
function formatarDataPt(data: Date) {
  return data.toLocaleDateString('pt-BR');
}

function formatarDataPtCompleta(data: Date) {
  return data.toLocaleDateString('pt-BR');  // Duplicado!
}

// ✅ Reutilizar
// utils/formatters.ts
export const formatarData = (data: Date, completo = false) => {
  return completo 
    ? data.toLocaleDateString('pt-BR', { dateStyle: 'full' })
    : data.toLocaleDateString('pt-BR');
};
```

### KISS (Keep It Simple, Stupid)

```typescript
// ❌ Over-engineering
const calcularTotal = (items: Item[]) => {
  return items.reduce((acc, item) => {
    const subtotal = item.quantidade * item.preco;
    const desconto = subtotal * (item.desconto / 100);
    const impostos = (subtotal - desconto) * 0.15;
    return acc + subtotal - desconto + impostos;
  }, 0);
};

// ✅ Simples e claro
const calcularTotal = (items: Item[]) => {
  return items.reduce((acc, item) => acc + item.total, 0);
};
```

---

## 🔷 TypeScript

### ✅ SEMPRE use TypeScript

```typescript
// ❌ JavaScript puro
function criarTicket(data) {
  return api.post('/tickets', data);
}

// ✅ TypeScript com types
interface CreateTicketDto {
  titulo: string;
  descricao: string;
  clienteId: string;
}

async function criarTicket(data: CreateTicketDto): Promise<Ticket> {
  const response = await api.post<Ticket>('/tickets', data);
  return response.data;
}
```

### Evite `any`

```typescript
// ❌ Any esconde problemas
const processar = (data: any) => {
  return data.map(item => item.valor);  // E se data não for array?
};

// ✅ Type correto
interface Item {
  valor: number;
}

const processar = (data: Item[]): number[] => {
  return data.map(item => item.valor);
};
```

### Use Union Types

```typescript
// ❌ String genérica
type Status = string;  // Aceita qualquer string!

// ✅ Union type
type StatusAtendimento = 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO' | 'RESOLVIDO';

const status: StatusAtendimento = 'ABERTO';  // ✅
const status2: StatusAtendimento = 'XPTO';   // ❌ TypeScript error!
```

### Interfaces vs Types

```typescript
// ✅ Interface para objetos/shapes
interface Ticket {
  id: string;
  titulo: string;
  status: StatusAtendimento;
}

// ✅ Type para unions/primitives
type StatusAtendimento = 'ABERTO' | 'RESOLVIDO';
type ID = string | number;

// ✅ Extend interface
interface TicketComCliente extends Ticket {
  cliente: Cliente;
}
```

### Strict TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                 // ✅ Todas as verificações estritas
    "noImplicitAny": true,          // ✅ Proibir any implícito
    "strictNullChecks": true,       // ✅ Verificar null/undefined
    "noUnusedLocals": true,         // ✅ Detectar variáveis não usadas
    "noUnusedParameters": true      // ✅ Detectar parâmetros não usados
  }
}
```

---

## 📛 Naming Conventions

### Geral

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Variáveis** | `camelCase` | `ticketSelecionado` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| **Funções** | `camelCase` | `carregarTickets()` |
| **Classes** | `PascalCase` | `TicketService` |
| **Interfaces** | `PascalCase` | `CreateTicketDto` |
| **Types** | `PascalCase` | `StatusAtendimento` |
| **Enums** | `PascalCase` | `StatusAtendimentoEnum` |
| **Arquivos** | `kebab-case` ou `PascalCase` | `ticket.service.ts` ou `ChatArea.tsx` |

### Backend (NestJS)

```typescript
// ✅ Sufixos obrigatórios
*.entity.ts       → ticket.entity.ts
*.controller.ts   → ticket.controller.ts
*.service.ts      → ticket.service.ts
*.module.ts       → ticket.module.ts
*.dto.ts          → create-ticket.dto.ts
*.gateway.ts      → atendimento.gateway.ts

// ✅ Classes com sufixos
export class Ticket {}              // Entity
export class TicketController {}    // Controller
export class TicketService {}       // Service
export class CreateTicketDto {}     // DTO
```

### Frontend (React)

```typescript
// ✅ Componentes: PascalCase
ChatArea.tsx        → export const ChatArea: React.FC
ClientePanel.tsx    → export const ClientePanel: React.FC

// ✅ Hooks: use + PascalCase
useAtendimentos.ts  → export const useAtendimentos
useMensagens.ts     → export const useMensagens

// ✅ Services: camelCase + Service
atendimentoService.ts  → export const atendimentoService

// ✅ Stores: camelCase + Store
atendimentoStore.ts    → export const useAtendimentoStore
```

### Variáveis Booleanas

```typescript
// ✅ Prefixo is/has/should/can
const isLoading = true;
const hasError = false;
const shouldRender = true;
const canEdit = false;

// ❌ Sem prefixo
const loading = true;      // Ambíguo
const error = false;       // Ambíguo
```

### Funções de Manipulação

```typescript
// ✅ Verbos + substantivo
handleClick()
handleSubmit()
handleChange()

// ✅ Ações específicas
carregarTickets()
criarTicket()
atualizarStatus()
deletarMensagem()

// ❌ Genérico demais
process()
doStuff()
handle()
```

---

## 🔙 Backend (NestJS)

### Estrutura de Controller

```typescript
@Controller('atendimento/tickets')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  // ✅ Padrão: verbo HTTP + substantivo plural
  @Get()
  async listar(@EmpresaId() empresaId: string): Promise<Ticket[]> {
    return this.ticketService.listar(empresaId);
  }

  @Get(':id')
  async buscarPorId(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
  ): Promise<Ticket> {
    return this.ticketService.buscarPorId(id, empresaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(
    @Body() dto: CreateTicketDto,
    @EmpresaId() empresaId: string,
  ): Promise<Ticket> {
    return this.ticketService.criar(dto, empresaId);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @EmpresaId() empresaId: string,
  ): Promise<Ticket> {
    return this.ticketService.atualizar(id, dto, empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
  ): Promise<void> {
    await this.ticketService.deletar(id, empresaId);
  }
}
```

### Estrutura de Service

```typescript
@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async listar(empresaId: string): Promise<Ticket[]> {
    this.logger.log(`Listando tickets da empresa ${empresaId}`);
    
    try {
      return await this.ticketRepo.find({
        where: { empresaId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar tickets: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro ao buscar tickets');
    }
  }

  async buscarPorId(id: string, empresaId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} não encontrado`);
    }

    return ticket;
  }

  async criar(dto: CreateTicketDto, empresaId: string): Promise<Ticket> {
    const ticket = this.ticketRepo.create({
      ...dto,
      empresaId,
      status: 'ABERTO',
    });

    return await this.ticketRepo.save(ticket);
  }
}
```

### DTOs com Validação

```typescript
import { IsString, IsUUID, IsOptional, IsEnum, Length } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(3, 200)
  titulo: string;

  @IsString()
  @IsOptional()
  @Length(0, 5000)
  descricao?: string;

  @IsUUID()
  contatoId: string;

  @IsEnum(['whatsapp', 'telegram', 'email', 'chat'])
  canal: CanalTipo;
}
```

### Error Handling

```typescript
// ✅ Exceptions específicas do NestJS
throw new NotFoundException('Ticket não encontrado');
throw new BadRequestException('Dados inválidos');
throw new UnauthorizedException('Não autorizado');
throw new ForbiddenException('Sem permissão');
throw new InternalServerErrorException('Erro interno');

// ❌ Não use Error genérico
throw new Error('Algo deu errado');  // ❌
```

### Logging

```typescript
// ✅ Logger do NestJS
private readonly logger = new Logger(TicketService.name);

this.logger.log('Operação iniciada');           // INFO
this.logger.warn('Aviso importante');           // WARN
this.logger.error('Erro crítico', error.stack); // ERROR
this.logger.debug('Debug info');                // DEBUG

// ❌ Não use console.log
console.log('teste');  // ❌ Remover antes de commit!
```

---

## 🎨 Frontend (React)

### Estrutura de Componente

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { Ticket } from '../types';
import { useAtendimentos } from '../hooks/useAtendimentos';

interface ChatAreaProps {
  ticketId: string;
  onClose: () => void;
}

/**
 * ChatArea - Área principal de chat com mensagens
 * 
 * @param ticketId - ID do ticket ativo
 * @param onClose - Callback ao fechar chat
 */
export const ChatArea: React.FC<ChatAreaProps> = ({ 
  ticketId, 
  onClose 
}) => {
  // 1. Hooks (ordem: state, context, custom)
  const [mensagem, setMensagem] = useState('');
  const { enviarMensagem, loading } = useAtendimentos();

  // 2. Callbacks (sempre com useCallback)
  const handleEnviar = useCallback(async () => {
    if (!mensagem.trim()) return;
    
    await enviarMensagem(ticketId, mensagem);
    setMensagem('');
  }, [mensagem, ticketId, enviarMensagem]);

  // 3. Effects
  useEffect(() => {
    // Lógica de efeito
  }, [/* deps */]);

  // 4. Early returns
  if (loading) {
    return <div>Carregando...</div>;
  }

  // 5. Render
  return (
    <div className="flex flex-col h-full">
      {/* Conteúdo */}
    </div>
  );
};
```

### Props Tipadas

```typescript
// ✅ Interface para props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  // ...
};

// ❌ Props sem type
export const Button = ({ children, onClick }) => {  // ❌
  // ...
};
```

### Estados Derivados

```typescript
// ❌ Estado desnecessário
const [total, setTotal] = useState(0);
const [items, setItems] = useState([]);

useEffect(() => {
  setTotal(items.reduce((acc, item) => acc + item.valor, 0));
}, [items]);

// ✅ Calcular direto (ou useMemo se pesado)
const [items, setItems] = useState([]);
const total = items.reduce((acc, item) => acc + item.valor, 0);

// ✅ Ou com useMemo se cálculo pesado
const total = useMemo(() => {
  return items.reduce((acc, item) => acc + item.valor, 0);
}, [items]);
```

### Conditional Rendering

```typescript
// ✅ Ternário simples
{isLoading ? <Spinner /> : <Content />}

// ✅ && para render condicional
{hasError && <ErrorMessage />}

// ✅ Early return para lógica complexa
if (isLoading) return <Spinner />;
if (hasError) return <ErrorMessage />;
return <Content />;

// ❌ Ternário aninhado (difícil ler)
{isLoading ? <Spinner /> : hasError ? <Error /> : hasData ? <Content /> : <Empty />}
```

### Event Handlers

```typescript
// ✅ Arrow function em callback
<button onClick={() => handleClick(id)}>Clique</button>

// ✅ Referência direta se sem parâmetros
<button onClick={handleClick}>Clique</button>

// ❌ Função anônima complexa (extrair)
<button onClick={() => {
  // 50 linhas de código aqui...  ❌
}}>
  Clique
</button>
```

---

## 🗄️ Zustand State Management

### ⚠️ PADRÕES CRÍTICOS (evitam loops infinitos)

#### ✅ DO: Individual Selectors

```typescript
// ✅ CORRETO: Cada propriedade selecionada individualmente
const tickets = useAtendimentoStore((state) => state.tickets);
const ticketSelecionado = useAtendimentoStore((state) => state.ticketSelecionado);
const setTickets = useAtendimentoStore((state) => state.setTickets);

// Zustand faz shallow comparison automaticamente = SEGURO
```

#### ❌ DON'T: Composite Selectors

```typescript
// ❌ ERRADO: Retorna novo objeto a cada render = LOOP INFINITO!
const { tickets, ticketSelecionado } = useAtendimentoStore((state) => ({
  tickets: state.tickets,
  ticketSelecionado: state.ticketSelecionado,
}));

// Problema: Novo objeto {} criado toda vez → Nova referência → Loop!
```

### Estrutura de Store

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface AtendimentoStore {
  // Estado
  tickets: Ticket[];
  ticketSelecionado: Ticket | null;
  loading: boolean;
  error: string | null;

  // Ações
  setTickets: (tickets: Ticket[]) => void;
  selecionarTicket: (ticketId: string) => void;
  resetar: () => void;
}

const estadoInicial = {
  tickets: [],
  ticketSelecionado: null,
  loading: false,
  error: null,
};

export const useAtendimentoStore = create<AtendimentoStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // ✅ Ações com nomes (para DevTools)
        setTickets: (tickets) => 
          set({ tickets }, false, 'setTickets'),

        selecionarTicket: (ticketId) =>
          set(
            (state) => ({
              ticketSelecionado: state.tickets.find(t => t.id === ticketId) || null,
            }),
            false,
            'selecionarTicket'
          ),

        resetar: () => 
          set(estadoInicial, false, 'resetar'),
      }),
      {
        name: 'conectcrm-atendimento-storage',
        partialize: (state) => ({
          // ⚠️ ATENÇÃO: Persiste APENAS o necessário (segurança)
          ticketSelecionado: state.ticketSelecionado,
        }),
        version: 1,
      }
    ),
    { 
      name: 'AtendimentoStore', 
      enabled: process.env.NODE_ENV === 'development' 
    }
  )
);
```

### Persist Strategy

```typescript
// ✅ Persiste APENAS dados sensíveis/importantes
partialize: (state) => ({
  ticketSelecionado: state.ticketSelecionado,
  clienteSelecionado: state.clienteSelecionado,
  // NÃO persiste:
  // - loading (estado temporário)
  // - error (estado temporário)
  // - tickets (lista completa, recarregar do servidor)
}),

// ❌ NÃO persista tudo
partialize: (state) => state,  // ❌ Muito pesado!
```

---

## 🪝 Hooks Customizados

### Estrutura Padrão

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseAtendimentosOptions {
  autoLoad?: boolean;
}

interface UseAtendimentosReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  recarregar: () => Promise<void>;
}

export const useAtendimentos = (
  options: UseAtendimentosOptions = {}
): UseAtendimentosReturn => {
  const { autoLoad = true } = options;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback para funções estáveis
  const carregarTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dados = await atendimentoService.listar();
      setTickets(dados);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
      setError('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Auto-load opcional
  useEffect(() => {
    if (autoLoad) {
      carregarTickets();
    }
    // ⚠️ NÃO inclua carregarTickets nas deps (causa loop!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return {
    tickets,
    loading,
    error,
    recarregar: carregarTickets,
  };
};
```

### ⚠️ ATENÇÃO: Dependências de useEffect

```typescript
// ❌ ERRADO: Função de useCallback nas deps = LOOP!
const carregarDados = useCallback(async () => {
  // ...
}, [clienteId]);

useEffect(() => {
  carregarDados();
}, [carregarDados]);  // ❌ Loop infinito!

// ✅ CORRETO: Apenas deps primitivas
const carregarDados = useCallback(async () => {
  // ...
}, [clienteId]);

useEffect(() => {
  carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [clienteId]);  // ✅ Sem função nas deps!
```

### ⚠️ ATENÇÃO: Objetos Aninhados nas Props

```typescript
// ❌ ERRADO: Objeto aninhado = nova referência toda vez
const clienteId = ticket?.contato?.cliente?.id;

useEffect(() => {
  carregar(clienteId);
}, [clienteId]);  // ❌ Pode mudar referência mesmo com mesmo ID!

// ✅ CORRETO: useMemo para estabilizar referência
const clienteIdEstavel = useMemo(
  () => ticket?.contato?.cliente?.id || null,
  [ticket?.contato?.cliente?.id]
);

useEffect(() => {
  carregar(clienteIdEstavel);
}, [clienteIdEstavel]);  // ✅ Referência estável!
```

---

## 🚨 Tratamento de Erros

### Backend

```typescript
// ✅ Try-catch em TODOS os services
async criar(dto: CreateTicketDto, empresaId: string): Promise<Ticket> {
  try {
    const ticket = this.ticketRepo.create({ ...dto, empresaId });
    return await this.ticketRepo.save(ticket);
  } catch (error) {
    this.logger.error(
      `Erro ao criar ticket: ${error.message}`,
      error.stack,
    );
    
    // ✅ Exception específica
    if (error.code === '23505') {  // Duplicate key
      throw new ConflictException('Ticket já existe');
    }
    
    throw new InternalServerErrorException('Erro ao criar ticket');
  }
}
```

### Frontend

```typescript
// ✅ Try-catch com tratamento específico
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);
    
    await atendimentoService.criar(data);
    
    toast.success('Ticket criado com sucesso!');
    onClose();
  } catch (err: unknown) {
    console.error('Erro ao criar ticket:', err);
    
    // ✅ Extrair mensagem do backend
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Erro desconhecido';
    
    const backendMessage = (err as any)?.response?.data?.message;
    const finalMessage = backendMessage || errorMessage;
    
    setError(finalMessage);
    toast.error(finalMessage);
  } finally {
    setLoading(false);
  }
};
```

---

## ⚡ Performance

### Memoização

```typescript
// ✅ useMemo para cálculos pesados
const ticketsFiltrados = useMemo(() => {
  return tickets.filter(t => t.status === 'ABERTO');
}, [tickets]);

// ✅ useCallback para funções passadas como props
const handleClick = useCallback((id: string) => {
  selecionarTicket(id);
}, [selecionarTicket]);

// ❌ Não use para tudo (over-optimization)
const nome = useMemo(() => user.nome, [user.nome]);  // ❌ Desnecessário!
```

### Debounce em Buscas

```typescript
// ✅ Aguardar 500ms após última tecla
const [searchTerm, setSearchTerm] = useState('');
const [debouncedTerm, setDebouncedTerm] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTerm(searchTerm);
  }, 500);

  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  if (debouncedTerm) {
    buscarTickets(debouncedTerm);
  }
}, [debouncedTerm]);
```

### Paginação

```typescript
// ✅ SEMPRE paginar listas grandes
const listar = async (page = 1, limit = 20) => {
  const [items, total] = await this.repo.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ❌ Retornar 10.000 registros de uma vez
const listar = async () => {
  return await this.repo.find();  // ❌ Vai travar!
};
```

---

## 🧪 Testes

### Backend (Jest)

```typescript
describe('TicketService', () => {
  let service: TicketService;
  let repository: Repository<Ticket>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    repository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  });

  describe('listar', () => {
    it('deve retornar lista de tickets', async () => {
      const mockTickets = [
        { id: '1', titulo: 'Ticket 1' },
        { id: '2', titulo: 'Ticket 2' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockTickets as any);

      const result = await service.listar('empresa-id');

      expect(result).toEqual(mockTickets);
      expect(repository.find).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-id' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
```

### Frontend (React Testing Library)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatArea } from './ChatArea';

describe('ChatArea', () => {
  it('deve renderizar mensagens', () => {
    const mensagens = [
      { id: '1', conteudo: 'Olá' },
      { id: '2', conteudo: 'Oi' },
    ];

    render(<ChatArea mensagens={mensagens} onEnviar={jest.fn()} />);

    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(screen.getByText('Oi')).toBeInTheDocument();
  });

  it('deve enviar mensagem ao clicar no botão', async () => {
    const handleEnviar = jest.fn();
    render(<ChatArea mensagens={[]} onEnviar={handleEnviar} />);

    const input = screen.getByPlaceholderText('Digite uma mensagem...');
    const button = screen.getByRole('button', { name: /enviar/i });

    await userEvent.type(input, 'Teste');
    await userEvent.click(button);

    await waitFor(() => {
      expect(handleEnviar).toHaveBeenCalledWith('Teste');
    });
  });
});
```

---

## 📚 Checklist Final

Antes de fazer PR, verifique:

### Código
- [ ] ✅ 100% TypeScript (sem `any`)
- [ ] ✅ Naming conventions seguidas
- [ ] ✅ Nenhum `console.log` esquecido
- [ ] ✅ Imports organizados
- [ ] ✅ Sem código comentado

### Backend
- [ ] ✅ DTOs com validação
- [ ] ✅ Try-catch em services
- [ ] ✅ Logger em vez de console.log
- [ ] ✅ Exceptions específicas do NestJS

### Frontend
- [ ] ✅ Props tipadas
- [ ] ✅ Individual selectors em Zustand (NÃO composite)
- [ ] ✅ useCallback/useMemo onde apropriado
- [ ] ✅ Funções NÃO nas deps de useEffect
- [ ] ✅ useMemo para objetos aninhados em props

### Performance
- [ ] ✅ Paginação em listas grandes
- [ ] ✅ Debounce em buscas
- [ ] ✅ Lazy loading se necessário

### Testes
- [ ] ✅ Testes unitários escritos
- [ ] ✅ Cobertura > 80%
- [ ] ✅ Todos os testes passando

---

**Dúvidas?** Consulte:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas comuns
- [ETAPA3_BUGS_CORRIGIDOS.md](../ETAPA3_BUGS_CORRIGIDOS.md) - Bugs de loop resolvidos

**Última revisão**: 6 de novembro de 2025
