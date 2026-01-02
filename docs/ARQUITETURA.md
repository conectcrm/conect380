# 🏗️ Arquitetura ConectCRM

**Última Atualização**: 1º de janeiro de 2026

---

## 📋 Visão Geral

ConectCRM é um sistema **SaaS multi-tenant** de gestão empresarial que integra:
- Atendimento Omnichannel
- CRM e Vendas
- Financeiro
- Automação com IA

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS 10.x (Node.js, TypeScript)
- **ORM**: TypeORM 0.3.x
- **Database**: PostgreSQL 16.x
- **Cache**: Redis 7.x
- **Storage**: MinIO (S3-compatible)
- **Real-time**: Socket.io
- **Queue**: Bull (Redis-based)

### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State**: React Context + Hooks (Zustand para estado complexo)
- **Forms**: React Hook Form + class-validator
- **HTTP**: Axios
- **Real-time**: socket.io-client

### Integrações
- **IA**: OpenAI GPT-4, Anthropic Claude
- **Messaging**: WhatsApp (whatsapp-web.js), Twilio
- **Email**: SendGrid
- **Payments**: Stripe, Asaas
- **Monitoring**: (a definir: Sentry, New Relic)

### Infraestrutura
- **Containers**: Docker + Docker Compose
- **Orchestration**: (futuro: Kubernetes)
- **CI/CD**: GitHub Actions
- **Hosting**: (a definir: AWS, Azure, GCP)

---

## 🏛️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Pages     │  │ Components │  │  Services  │           │
│  │            │  │            │  │            │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST) + WebSocket
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (NestJS)                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  JwtAuthGuard → TenantContextMiddleware            │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MÓDULOS    │  │  GATEWAYS    │  │   WORKERS    │
│              │  │              │  │              │
│ • Atendimento│  │ • Socket.io  │  │ • Queue Jobs │
│ • CRM/Vendas │  │ • WhatsApp   │  │ • Scheduled  │
│ • Financeiro │  │              │  │              │
│ • Automação  │  │              │  │              │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAMADA DE PERSISTÊNCIA                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │     │
│  │  (RLS ativo) │  │   (Cache)    │  │  (Arquivos)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│              SERVIÇOS EXTERNOS (APIs)                       │
│  OpenAI | Anthropic | WhatsApp | Twilio | Stripe | SendGrid│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança Multi-Tenant (3-Layer)

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: JWT Authentication                                │
│ → Token contém empresa_id do usuário autenticado          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: TenantContextMiddleware (NestJS)                 │
│ → Extrai empresa_id do JWT                                │
│ → Chama set_current_tenant(empresa_id) no PostgreSQL      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Row Level Security (PostgreSQL)                  │
│ → TODAS as queries filtram por empresa_id automaticamente │
│ → Política: tenant_isolation_<tabela>                     │
│ → Status: 61/61 tabelas protegidas (100%)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados Principal

### Atendimento Completo (End-to-End)

```
1. Cliente envia mensagem (WhatsApp/Email/Chat)
   ↓
2. Gateway recebe e normaliza (Socket.io/HTTP)
   ↓
3. Bot IA faz triagem automática (OpenAI/Claude)
   ↓
4. Ticket criado e roteado para Equipe/Atendente
   ↓
5. Atendente resolve via Inbox Omnichannel
   ↓
6. Solução gera Proposta/Contrato (CRM)
   ↓
7. Contrato gera Fatura (Financeiro)
   ↓
8. Fatura processada via Stripe/Asaas
   ↓
9. Analytics agrega métricas (Dashboard)
```

---

## 📦 Estrutura de Módulos

### Backend (`backend/src/`)

```
backend/src/
├── modules/
│   ├── atendimento/          # 19 entities
│   │   ├── tickets/
│   │   ├── equipes/
│   │   ├── filas/
│   │   └── ...
│   ├── crm/                  # 6 entities
│   │   ├── clientes/
│   │   ├── oportunidades/
│   │   └── propostas/
│   ├── financeiro/           # 6 entities
│   │   ├── faturas/
│   │   ├── pagamentos/
│   │   └── assinaturas/
│   ├── automacao/            # 7 entities
│   │   ├── fluxos/
│   │   ├── eventos/
│   │   └── ia-insights/
│   └── configuracoes/        # 8 entities
│       ├── empresas/
│       ├── usuarios/
│       └── planos/
├── common/
│   ├── middleware/           # TenantContextMiddleware
│   ├── guards/               # JwtAuthGuard
│   └── decorators/
├── gateways/                 # WebSocket, WhatsApp
├── config/                   # Database, JWT, etc.
└── migrations/               # 81+ migrations com RLS
```

### Frontend (`frontend-web/src/`)

```
frontend-web/src/
├── pages/                    # Páginas completas
│   ├── atendimento/
│   ├── comercial/
│   ├── financeiro/
│   └── configuracoes/
├── features/                 # Features modulares
│   ├── atendimento/
│   │   └── omnichannel/
│   └── automacao/
├── components/
│   ├── common/               # Componentes reutilizáveis
│   └── navigation/           # BackToNucleus, etc.
├── services/                 # Axios services (API)
├── hooks/                    # useConfirmation, etc.
├── utils/                    # Helpers
└── App.tsx                   # Rotas principais
```

---

## 🔗 Relacionamentos Entre Módulos

### Cliente (Entidade Central)
```
Cliente
  ├── Tickets (Atendimento)
  ├── Oportunidades (CRM)
  ├── Propostas (CRM)
  ├── Contratos (CRM)
  └── Faturas (Financeiro)
```

### Ticket/Demanda (Núcleo do Atendimento)
```
Ticket
  ├── Cliente
  ├── Canal (WhatsApp, Email, Chat)
  ├── Atendente
  ├── Equipe
  ├── Fila
  ├── Mensagens (histórico)
  ├── Notas (internas)
  └── Atividades (logs)
```

### Proposta → Contrato → Fatura (Funil Completo)
```
Proposta
  ├── Cliente
  ├── Produtos/Serviços
  └─→ Contrato
      ├── Assinatura (se recorrente)
      └─→ Faturas
          └─→ Pagamentos
```

---

## 🚀 Performance e Escalabilidade

### Otimizações Implementadas
- ✅ Eager Loading (TypeORM relations)
- ✅ Índices em empresa_id (todas as 61 tabelas)
- ✅ Cache Redis para configurações
- ✅ Debounce em buscas (frontend)
- ✅ Lazy loading de componentes (React.lazy)
- ✅ Paginação em listagens grandes
- ✅ Connection pooling (PostgreSQL)

### Próximas Otimizações (Roadmap)
- 🔲 CDN para assets estáticos
- 🔲 Server-side rendering (Next.js?)
- 🔲 Database read replicas
- 🔲 Horizontal scaling (Kubernetes)
- 🔲 GraphQL (Apollo) para queries complexas

---

## 📐 Padrões Arquiteturais

### Backend (NestJS)
- **Padrão**: MVC + Repository Pattern
- **Entities**: TypeORM entities (1 por tabela)
- **DTOs**: Validação com class-validator
- **Services**: Lógica de negócio
- **Controllers**: Rotas HTTP + validação
- **Modules**: Encapsulamento de features

### Frontend (React)
- **Padrão**: Component-Based Architecture
- **State**: Context API + Hooks (local), Zustand (global)
- **Data Fetching**: Services com Axios
- **Error Handling**: Error Boundaries + toast notifications
- **Routing**: React Router v6

---

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Críticas

#### Backend (`.env`)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm123
DATABASE_NAME=conectcrm_db

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRATION=7d

# APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
WHATSAPP_API_KEY=...

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

#### Frontend (`.env`)
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

---

## 📚 Referências

- **Design Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`
- **Multi-Tenant**: `SISTEMA_100_MULTI_TENANT_FINAL.md`
- **Testes Multi-Tenant**: `TESTES_MULTI_TENANT_COMPLETOS.md`
- **Governança**: `GOVERNANCA_DESENVOLVIMENTO_IA.md`
- **Módulos**: `docs/MODULOS.md`
- **Decisões Técnicas**: `docs/DECISOES_TECNICAS.md`

---

**Elaborado por**: Equipe ConectCRM  
**Revisão**: GitHub Copilot Agent
