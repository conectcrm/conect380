# 🏗️ Arquitetura do ConectSuite

**Versão**: 1.0.0  
**Última atualização**: 6 de novembro de 2025  
**Responsável**: Equipe ConectSuite

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura de Alto Nível](#-arquitetura-de-alto-nível)
3. [Backend (NestJS)](#-backend-nestjs)
4. [Frontend (React)](#-frontend-react)
5. [Banco de Dados](#-banco-de-dados)
6. [Tempo Real (WebSocket)](#-tempo-real-websocket)
7. [Integrações Externas](#-integrações-externas)
8. [Segurança e Multi-tenancy](#-segurança-e-multi-tenancy)
9. [Fluxo de Dados](#-fluxo-de-dados)
10. [Diretórios e Convenções](#-diretórios-e-convenções)

---

## 🎯 Visão Geral

ConectSuite é um **sistema CRM omnichannel** construído com arquitetura **cliente-servidor moderna**, utilizando:

- **Backend**: NestJS (Node.js + TypeScript)
- **Frontend**: React (TypeScript + Tailwind CSS)
- **Banco de Dados**: PostgreSQL com Row-Level Security (RLS)
- **Cache**: Redis
- **Tempo Real**: WebSocket (socket.io)
- **Infraestrutura**: Docker + AWS

### Características Principais

- ✅ **Multi-tenant** com isolamento total de dados (RLS)
- ✅ **Tempo real** com WebSocket bidirecional
- ✅ **Type-safe** 100% TypeScript
- ✅ **RESTful API** + WebSocket Gateway
- ✅ **Modular** e escalável
- ✅ **Testável** (Jest + Cypress)

---

## 🌐 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMADA CLIENTE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│   │  Browser Web  │  │ WhatsApp API  │  │  Telegram API │    │
│   │  (React SPA)  │  │   (Webhook)   │  │   (Webhook)   │    │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘    │
│           │                   │                   │             │
│           │ HTTP/WS           │ HTTPS             │ HTTPS       │
│           ▼                   ▼                   ▼             │
└─────────────────────────────────────────────────────────────────┘
             │                   │                   │
             ├───────────────────┴───────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                     CAMADA BACKEND (NestJS)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │          HTTP REST API + WebSocket Gateway              │  │
│   │                    (Porta 3001)                          │  │
│   └────────┬────────────────────────────┬───────────────────┘  │
│            │                             │                      │
│            ▼                             ▼                      │
│   ┌────────────────┐          ┌────────────────────┐          │
│   │   Controllers  │          │  WebSocket Gateway │          │
│   │  (HTTP Routes) │          │   (socket.io)      │          │
│   └────────┬───────┘          └─────────┬──────────┘          │
│            │                             │                      │
│            ▼                             ▼                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   Services (Lógica de Negócio)          │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│   │  │Atendimen│ │Triagem IA│ │Comercial │ │Financeiro│  │  │
│   │  │   to    │ │   Bot    │ │  CRM     │ │  ERP     │  │  │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│   └────────┬─────────────────────────────────┬──────────────┘  │
│            │                                  │                 │
│            ▼                                  ▼                 │
│   ┌────────────────┐                ┌─────────────────┐        │
│   │  Repositories  │                │  External APIs  │        │
│   │   (TypeORM)    │                │  (HTTP Clients) │        │
│   └────────┬───────┘                └─────────────────┘        │
│            │                                                     │
└────────────┼─────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐           ┌──────────────────┐          │
│   │   PostgreSQL     │           │      Redis       │          │
│   │   (Dados)        │           │     (Cache)      │          │
│   │   + RLS          │           │                  │          │
│   └──────────────────┘           └──────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRAÇÕES EXTERNAS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  WhatsApp  │  │ Anthropic  │  │   Stripe   │  │  SendGrid│ │
│  │   Business │  │   Claude   │  │  Payments  │  │   Email  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔙 Backend (NestJS)

### Estrutura de Módulos

```
backend/
├── src/
│   ├── main.ts                    # Bootstrap da aplicação
│   ├── app.module.ts              # Módulo raiz
│   │
│   ├── config/                    # Configurações globais
│   │   ├── database.config.ts     # TypeORM + Entities
│   │   └── cors.config.ts         # CORS origins
│   │
│   ├── modules/                   # Módulos de negócio
│   │   ├── auth/                  # Autenticação JWT
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       └── empresa.guard.ts
│   │   │
│   │   ├── atendimento/           # Módulo de Atendimento
│   │   │   ├── atendimento.module.ts
│   │   │   ├── entities/
│   │   │   │   ├── ticket.entity.ts
│   │   │   │   ├── mensagem.entity.ts
│   │   │   │   └── contato.entity.ts
│   │   │   ├── controllers/
│   │   │   │   ├── ticket.controller.ts
│   │   │   │   ├── mensagem.controller.ts
│   │   │   │   └── webhook.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── ticket.service.ts
│   │   │   │   ├── mensagem.service.ts
│   │   │   │   └── whatsapp.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-ticket.dto.ts
│   │   │   │   └── send-mensagem.dto.ts
│   │   │   └── gateways/
│   │   │       └── atendimento.gateway.ts  # WebSocket
│   │   │
│   │   ├── triagem/               # Triagem Inteligente (Bot)
│   │   │   ├── entities/
│   │   │   │   ├── fluxo-triagem.entity.ts
│   │   │   │   ├── bloco-fluxo.entity.ts
│   │   │   │   └── log-triagem.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── triagem-bot.service.ts
│   │   │   │   ├── triagem-ia.service.ts  # Anthropic Claude
│   │   │   │   └── fluxo.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── comercial/             # CRM (Clientes, Oportunidades)
│   │   │   ├── entities/
│   │   │   │   ├── cliente.entity.ts
│   │   │   │   ├── oportunidade.entity.ts
│   │   │   │   └── produto.entity.ts
│   │   │   └── services/
│   │   │
│   │   └── financeiro/            # ERP (Faturas, Pagamentos)
│   │       ├── entities/
│   │       │   ├── fatura.entity.ts
│   │       │   └── pagamento.entity.ts
│   │       └── services/
│   │           └── stripe.service.ts
│   │
│   ├── common/                    # Compartilhado
│   │   ├── decorators/
│   │   │   ├── empresa.decorator.ts
│   │   │   └── user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── empresa.interceptor.ts
│   │   └── utils/
│   │
│   └── migrations/                # Migrations TypeORM
│       ├── 1234567890-CreateDepartamentos.ts
│       └── ...
│
├── .env                           # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

### Camadas do Backend

#### 1. **Controllers** (Camada de Apresentação)
- Recebem requisições HTTP
- Validam entrada com DTOs (`class-validator`)
- Delegam lógica para Services
- Retornam respostas padronizadas

```typescript
@Controller('atendimento/tickets')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string) {
    return this.ticketService.listar(empresaId);
  }
}
```

#### 2. **Services** (Camada de Negócio)
- Contém TODA a lógica de negócio
- Não conhece HTTP (pode ser reutilizado em CLI, WebSocket, etc)
- Usa Repositories para acesso a dados
- Injeta outros Services quando necessário

```typescript
@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
  ) {}

  async listar(empresaId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({ where: { empresaId } });
  }
}
```

#### 3. **Repositories** (Camada de Dados)
- TypeORM Repository pattern
- CRUD automatizado
- Queries customizadas com QueryBuilder
- Suporta transações

```typescript
// Automático via @InjectRepository
const tickets = await this.ticketRepo.find();

// Custom Query
const tickets = await this.ticketRepo
  .createQueryBuilder('ticket')
  .leftJoinAndSelect('ticket.contato', 'contato')
  .where('ticket.status = :status', { status: 'ABERTO' })
  .getMany();
```

#### 4. **WebSocket Gateway** (Tempo Real)
- socket.io para comunicação bidirecional
- Eventos: `mensagem:nova`, `ticket:atualizado`, etc
- Rooms por empresa (isolamento)

```typescript
@WebSocketGateway({ cors: true })
export class AtendimentoGateway {
  @WebSocketServer()
  server: Server;

  emitirNovaMensagem(empresaId: string, mensagem: Mensagem) {
    this.server.to(`empresa:${empresaId}`).emit('mensagem:nova', mensagem);
  }
}
```

### Padrões de Código Backend

✅ **DO**:
- Validar TODA entrada com DTOs
- Usar `async/await` (não callbacks)
- Log com `Logger` do NestJS
- Try-catch em Services
- Retornar status HTTP corretos

❌ **DON'T**:
- Lógica de negócio em Controllers
- Queries SQL diretas (usar TypeORM)
- Logs com `console.log` (usar Logger)
- Expor erros de banco para cliente

---

## 🎨 Frontend (React)

### Estrutura de Diretórios

```
frontend-web/
├── public/
│   ├── index.html
│   └── assets/
│
├── src/
│   ├── index.tsx                  # Entry point
│   ├── App.tsx                    # Rotas principais
│   │
│   ├── pages/                     # Páginas completas
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── _TemplatePage.tsx      # Template base
│   │   └── _TemplateWithKPIsPage.tsx
│   │
│   ├── features/                  # Módulos por funcionalidade
│   │   ├── atendimento/
│   │   │   ├── omnichannel/
│   │   │   │   ├── ChatOmnichannel.tsx      # Página principal
│   │   │   │   ├── components/              # Componentes do chat
│   │   │   │   │   ├── AtendimentosSidebar.tsx
│   │   │   │   │   ├── ChatArea.tsx
│   │   │   │   │   └── ClientePanel.tsx
│   │   │   │   ├── hooks/                   # Custom hooks
│   │   │   │   │   ├── useAtendimentos.ts
│   │   │   │   │   ├── useMensagens.ts
│   │   │   │   │   ├── useHistoricoCliente.ts
│   │   │   │   │   └── useWebSocket.ts
│   │   │   │   ├── stores/                  # Zustand stores
│   │   │   │   │   ├── atendimentoStore.ts
│   │   │   │   │   └── atendimentoSelectors.ts
│   │   │   │   ├── services/                # API calls
│   │   │   │   │   └── atendimentoService.ts
│   │   │   │   ├── modals/                  # Modais
│   │   │   │   │   ├── NovoAtendimentoModal.tsx
│   │   │   │   │   └── TransferirAtendimentoModal.tsx
│   │   │   │   └── types/                   # TypeScript types
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   └── triagem/
│   │   │       ├── EditorFluxoTriagem.tsx
│   │   │       └── components/
│   │   │           ├── FluxoEditor.tsx
│   │   │           └── PreviewWhatsApp.tsx
│   │   │
│   │   ├── comercial/
│   │   │   ├── clientes/
│   │   │   ├── oportunidades/
│   │   │   └── cotacoes/
│   │   │
│   │   └── financeiro/
│   │       ├── faturas/
│   │       └── pagamentos/
│   │
│   ├── components/                # Componentes compartilhados
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── BackToNucleus.tsx
│   │   ├── ui/                    # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── navigation/
│   │       └── MenuConfig.ts
│   │
│   ├── contexts/                  # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── SidebarContext.tsx
│   │
│   ├── hooks/                     # Hooks globais
│   │   ├── useAuth.ts
│   │   ├── useNotas.ts
│   │   └── useDemandas.ts
│   │
│   ├── services/                  # API Services
│   │   ├── api.ts                 # Axios instance
│   │   ├── authService.ts
│   │   └── clienteService.ts
│   │
│   ├── utils/                     # Utilidades
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── avatar.ts
│   │
│   └── styles/                    # CSS Global
│       └── globals.css
│
├── .env
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### Camadas do Frontend

#### 1. **Pages** (Páginas Completas)
- Um componente = Uma rota
- Compõe vários components
- Gerencia estado da página com hooks

```typescript
export const ChatOmnichannel: React.FC = () => {
  const { tickets } = useAtendimentos();
  const { mensagens } = useMensagens();
  
  return (
    <div>
      <AtendimentosSidebar tickets={tickets} />
      <ChatArea mensagens={mensagens} />
      <ClientePanel />
    </div>
  );
};
```

#### 2. **Components** (Componentes Reutilizáveis)
- Responsabilidade única
- Props tipadas com TypeScript
- Sem lógica de negócio pesada

```typescript
interface ChatAreaProps {
  mensagens: Mensagem[];
  onEnviarMensagem: (texto: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  mensagens, 
  onEnviarMensagem 
}) => {
  // ...
};
```

#### 3. **Hooks** (Lógica Reutilizável)
- Encapsulam lógica com estado
- Conectam com services
- Podem usar outros hooks

```typescript
export const useAtendimentos = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarTickets = useCallback(async () => {
    setLoading(true);
    const data = await atendimentoService.listar();
    setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregarTickets();
  }, [carregarTickets]);

  return { tickets, loading, recarregar: carregarTickets };
};
```

#### 4. **Services** (Comunicação HTTP)
- Axios instance configurada
- Tratamento de erros centralizado
- Types para requests/responses

```typescript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const atendimentoService = {
  listar: () => api.get<Ticket[]>('/atendimento/tickets'),
  criar: (data: CreateTicketDto) => api.post('/atendimento/tickets', data),
};
```

#### 5. **Stores (Zustand)** (Estado Global)
- Estado compartilhado entre componentes
- Persist middleware (localStorage)
- DevTools para debug

```typescript
interface AtendimentoStore {
  tickets: Ticket[];
  ticketSelecionado: Ticket | null;
  setTickets: (tickets: Ticket[]) => void;
  selecionarTicket: (ticketId: string) => void;
}

export const useAtendimentoStore = create<AtendimentoStore>()(
  devtools(
    persist(
      (set) => ({
        tickets: [],
        ticketSelecionado: null,
        setTickets: (tickets) => set({ tickets }, false, 'setTickets'),
        selecionarTicket: (id) => 
          set(
            state => ({ 
              ticketSelecionado: state.tickets.find(t => t.id === id) 
            }),
            false,
            'selecionarTicket'
          ),
      }),
      { name: 'conectcrm-atendimento-storage' }
    ),
    { name: 'AtendimentoStore' }
  )
);
```

### Padrões de Código Frontend

✅ **DO**:
- Usar TypeScript SEMPRE
- Componentes funcionais com hooks
- Props tipadas com interfaces
- useCallback/useMemo para otimizar
- Tailwind CSS para estilização
- Individual selectors em Zustand

❌ **DON'T**:
- Componentes de classe (usar functional)
- Inline styles (usar Tailwind)
- Lógica de negócio em componentes (usar hooks/services)
- Composite selectors em Zustand (causa loops)
- Funções em dependências de useEffect (causa loops)

---

## 🗄️ Banco de Dados

### PostgreSQL + TypeORM

**Versão**: PostgreSQL 14+  
**ORM**: TypeORM 0.3.x

### Schema Multi-tenant

```sql
-- TODAS as tabelas têm empresa_id
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  contato_id UUID NOT NULL REFERENCES contatos(id),
  status VARCHAR(50) NOT NULL,
  canal VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- RLS: Isolamento automático por empresa
  CONSTRAINT fk_empresa FOREIGN KEY (empresa_id) 
    REFERENCES empresas(id) ON DELETE CASCADE
);

-- Row-Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY isolamento_empresa ON tickets
  USING (empresa_id = current_setting('app.current_empresa_id')::uuid);
```

### Entities TypeORM

```typescript
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Contato)
  @JoinColumn({ name: 'contato_id' })
  contato: Contato;

  @Column({ type: 'varchar', length: 50 })
  status: StatusAtendimentoType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Migrations

Migrations são criadas automaticamente a partir das entities:

```bash
# Gerar migration
npm run migration:generate -- src/migrations/AddColunaXYZ

# Rodar migrations
npm run migration:run

# Reverter última
npm run migration:revert
```

---

## ⚡ Tempo Real (WebSocket)

### Socket.io (Backend + Frontend)

**Backend** (`atendimento.gateway.ts`):
```typescript
@WebSocketGateway({ cors: true })
export class AtendimentoGateway {
  @WebSocketServer()
  server: Server;

  // Cliente conecta e entra na room da empresa
  handleConnection(client: Socket) {
    const empresaId = client.handshake.auth.empresaId;
    client.join(`empresa:${empresaId}`);
  }

  // Emitir para toda a empresa
  emitirNovaMensagem(empresaId: string, mensagem: Mensagem) {
    this.server
      .to(`empresa:${empresaId}`)
      .emit('mensagem:nova', mensagem);
  }
}
```

**Frontend** (`useWebSocket.ts`):
```typescript
export const useWebSocket = () => {
  const socket = useRef<Socket>();

  useEffect(() => {
    socket.current = io('http://localhost:3001', {
      auth: { empresaId: user.empresaId }
    });

    socket.current.on('mensagem:nova', (mensagem: Mensagem) => {
      // Atualizar store
      adicionarMensagem(mensagem);
    });

    return () => socket.current?.disconnect();
  }, []);
};
```

### Eventos Suportados

| Evento | Direção | Payload | Descrição |
|--------|---------|---------|-----------|
| `mensagem:nova` | Server → Client | `Mensagem` | Nova mensagem recebida |
| `ticket:atualizado` | Server → Client | `Ticket` | Ticket foi modificado |
| `ticket:novo` | Server → Client | `Ticket` | Novo ticket criado |
| `atendente:status` | Client → Server | `{ online: boolean }` | Status do atendente |

---

## 🔗 Integrações Externas

### 1. WhatsApp Business API

**Webhook URL**: `https://seu-dominio.com/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>` (sempre validar `X-Hub-Signature-256`)

```typescript
// Receber mensagens
@Post('webhooks/whatsapp/:empresaId')
async handleWebhook(
  @Param('empresaId') empresaId: string,
  @Headers('x-hub-signature-256') signature: string,
  @Body() body: any,
) {
  this.whatsappService.validarAssinatura(signature, body); // lança erro se inválido
  const mensagem = this.whatsappService.parsearMensagem(body);
  await this.mensagemService.criar({ ...mensagem, empresaId });
  
  // Emitir via WebSocket
  this.gateway.emitirNovaMensagem(mensagem.empresaId, mensagem);
}

// Enviar mensagens
async enviarMensagem(para: string, texto: string) {
  const response = await axios.post(
    'https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages',
    {
      messaging_product: 'whatsapp',
      to: para,
      type: 'text',
      text: { body: texto }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    }
  );
}
```

### 2. Anthropic Claude (IA)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async gerarRespostaIA(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return message.content[0].text;
}
```

### 3. Stripe (Pagamentos)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async criarPagamento(valor: number, clienteEmail: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: valor * 100, // centavos
    currency: 'brl',
    receipt_email: clienteEmail,
  });
  
  return paymentIntent.client_secret;
}
```

---

## 🔐 Segurança e Multi-tenancy

### Row-Level Security (RLS)

**Conceito**: Cada empresa vê APENAS seus dados.

```sql
-- 1. Habilitar RLS na tabela
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 2. Criar policy de isolamento
CREATE POLICY isolamento_empresa ON tickets
  USING (empresa_id = current_setting('app.current_empresa_id')::uuid);

-- 3. Backend seta empresa_id na sessão
SET app.current_empresa_id = 'uuid-empresa-aqui';
```

**Backend** (`empresa.interceptor.ts`):
```typescript
@Injectable()
export class EmpresaInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const empresaId = request.headers['x-empresa-id'];
    
    // Seta na sessão do PostgreSQL
    await this.connection.query(
      `SET app.current_empresa_id = '${empresaId}'`
    );
    
    return next.handle();
  }
}
```

### JWT Authentication

```typescript
// 1. Login gera token
const token = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  empresaId: user.empresaId,
});

// 2. Guard valida token
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@User() user: UserPayload) {
  return user;
}

// 3. Frontend envia em TODAS as requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
axios.defaults.headers.common['x-empresa-id'] = user.empresaId;
```

---

## 🔄 Fluxo de Dados

### Exemplo: Criar Novo Ticket

```
┌──────────┐
│ Frontend │
│  React   │
└────┬─────┘
     │
     │ 1. User clica "Novo Ticket"
     ▼
┌─────────────────────────────────┐
│ NovoAtendimentoModal.tsx        │
│  → handleSubmit()               │
└────┬────────────────────────────┘
     │
     │ 2. atendimentoService.criarTicket(data)
     ▼
┌─────────────────────────────────┐
│ atendimentoService.ts           │
│  → api.post('/tickets', data)   │
└────┬────────────────────────────┘
     │
     │ 3. HTTP POST + JWT + empresa-id
     ▼
┌─────────────────────────────────┐
│ Backend: TicketController       │
│  @Post() criar(@Body() dto)     │
└────┬────────────────────────────┘
     │
     │ 4. Valida DTO (class-validator)
     ▼
┌─────────────────────────────────┐
│ TicketService                   │
│  → ticketRepo.save(ticket)      │
└────┬────────────────────────────┘
     │
     │ 5. INSERT no PostgreSQL (com RLS)
     ▼
┌─────────────────────────────────┐
│ PostgreSQL + RLS                │
│  → Salvo com empresa_id correto │
└────┬────────────────────────────┘
     │
     │ 6. Ticket criado com sucesso
     ▼
┌─────────────────────────────────┐
│ AtendimentoGateway              │
│  → emitirNovoTicket(ticket)     │
└────┬────────────────────────────┘
     │
     │ 7. WebSocket broadcast
     ▼
┌──────────────────────────────────┐
│ Frontend: useWebSocket           │
│  → socket.on('ticket:novo')      │
│  → setTickets([...tickets, novo])│
└──────────────────────────────────┘
     │
     │ 8. UI atualiza automaticamente
     ▼
┌──────────┐
│ Frontend │
│ Atualiza │
└──────────┘
```

---

## 📁 Diretórios e Convenções

### Naming Conventions

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Backend** | | |
| Entity | `*.entity.ts` | `ticket.entity.ts` |
| Controller | `*.controller.ts` | `ticket.controller.ts` |
| Service | `*.service.ts` | `ticket.service.ts` |
| Module | `*.module.ts` | `ticket.module.ts` |
| DTO | `*.dto.ts` | `create-ticket.dto.ts` |
| Gateway | `*.gateway.ts` | `atendimento.gateway.ts` |
| **Frontend** | | |
| Page | `*Page.tsx` | `ChatOmnichannelPage.tsx` |
| Component | `*.tsx` | `ChatArea.tsx` |
| Hook | `use*.ts` | `useAtendimentos.ts` |
| Service | `*Service.ts` | `atendimentoService.ts` |
| Store | `*Store.ts` | `atendimentoStore.ts` |
| Type | `index.ts` ou `*.types.ts` | `types/index.ts` |

### Imports Order

```typescript
// 1. Imports externos
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 2. Imports internos (absolutos)
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

// 3. Imports relativos
import { ChatArea } from './components/ChatArea';
import { useAtendimentos } from './hooks/useAtendimentos';
import { Ticket } from './types';
```

---

## 🚀 Deploy e Ambientes

### Ambientes

| Ambiente | URL | Banco | Observações |
|----------|-----|-------|-------------|
| **Development** | localhost:3000 | PostgreSQL local | Hot reload |
| **Staging** | staging.conectcrm.com | AWS RDS | Mirror produção |
| **Production** | app.conectcrm.com | AWS RDS | Multi-AZ |

### Variáveis de Ambiente

**Backend** (`.env`):
```bash
NODE_ENV=production
APP_PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=xxx
WHATSAPP_ACCESS_TOKEN=xxx
ANTHROPIC_API_KEY=xxx
```

**Frontend** (`.env`):
```bash
REACT_APP_API_URL=https://api.conectcrm.com
REACT_APP_WS_URL=wss://api.conectcrm.com
```

---

## 📚 Recursos Adicionais

### Documentos Relacionados

- 📖 [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Padrões de código obrigatórios
- 🐛 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas comuns e soluções
- 🤝 [CONTRIBUTING.md](../CONTRIBUTING.md) - Como contribuir
- 🚀 [ONBOARDING.md](./ONBOARDING.md) - Guia para novos desenvolvedores

### Stack Documentation

- [NestJS Docs](https://docs.nestjs.com/)
- [React Docs](https://react.dev/)
- [TypeORM Docs](https://typeorm.io/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última revisão**: 6 de novembro de 2025  
**Próxima revisão**: Quando houver mudanças arquiteturais significativas
