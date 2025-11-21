# 🚀 Onboarding - ConectSuite

**Versão**: 1.0.0  
**Última atualização**: 6 de novembro de 2025

Bem-vindo ao time ConectSuite! Este guia vai te levar do zero até seu primeiro commit em produção.

---

## 📋 Índice

1. [Antes de Começar](#-antes-de-começar)
2. [Setup do Ambiente](#-setup-do-ambiente)
3. [Primeira Build](#-primeira-build)
4. [Conhecendo o Projeto](#-conhecendo-o-projeto)
5. [Primeira Tarefa](#-primeira-tarefa)
6. [Onde Buscar Ajuda](#-onde-buscar-ajuda)
7. [Próximos Passos](#-próximos-passos)

---

## 🎯 Antes de Começar

### Objetivo deste Guia

Ao final deste onboarding você terá:
- ✅ Ambiente de desenvolvimento funcionando
- ✅ Projeto rodando localmente (backend + frontend)
- ✅ Conhecimento da estrutura do código
- ✅ Seu primeiro commit/PR feito
- ✅ Confiança para trabalhar autonomamente

**Tempo estimado**: 2-4 horas

---

## 💻 Setup do Ambiente

### 1️⃣ Pré-requisitos

Instale estas ferramentas **ANTES** de clonar o projeto:

#### Obrigatórios

- [ ] **Node.js** (18.17.0 ou superior)
  - Download: https://nodejs.org/
  - Verificar: `node --version`

- [ ] **npm** (9.x ou superior)
  - Vem com Node.js
  - Verificar: `npm --version`

- [ ] **Git** (2.x ou superior)
  - Download: https://git-scm.com/
  - Verificar: `git --version`

- [ ] **PostgreSQL** (14 ou superior)
  - Download: https://www.postgresql.org/download/
  - OU usar Docker (recomendado): `docker pull postgres:14`
  - Verificar: `psql --version` ou `docker --version`

- [ ] **Redis** (6.x ou superior)
  - Docker: `docker pull redis:6`
  - OU instalar localmente

#### Recomendados

- [ ] **VS Code**
  - Download: https://code.visualstudio.com/
  - Extensões recomendadas (ver `.vscode/extensions.json`)

- [ ] **Docker Desktop** (facilita PostgreSQL + Redis)
  - Download: https://www.docker.com/products/docker-desktop

- [ ] **Postman** ou **Thunder Client** (testar APIs)
  - Postman: https://www.postman.com/
  - Thunder Client: Extensão do VS Code

---

### 2️⃣ Clonar Repositório

```bash
# Clonar o projeto
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite

# Ou se já tiver acesso SSH
git clone git@github.com:Dhonleno/conectsuite.git
cd conectsuite

# Verificar branch atual (deve ser 'develop')
git branch
```

---

### 3️⃣ Configurar Banco de Dados

#### Opção A: Docker (Recomendado)

```bash
# Iniciar PostgreSQL + Redis + pgAdmin
docker-compose up -d

# Verificar se estão rodando
docker ps

# Você deve ver:
# - conectcrm-postgres (porta 5434)
# - conectcrm-redis (porta 6379)
# - conectcrm-pgadmin (porta 5050)
```

#### Opção B: Instalação Local

```bash
# Criar banco de dados
psql -U postgres
CREATE DATABASE conectcrm_db;
CREATE USER conectcrm WITH PASSWORD 'conectcrm123';
GRANT ALL PRIVILEGES ON DATABASE conectcrm_db TO conectcrm;
\q
```

---

### 4️⃣ Configurar Variáveis de Ambiente

```bash
# Backend
cd backend
cp .env.example .env

# Editar .env com suas credenciais
# Abrir em editor de texto ou VS Code
code .env
```

**Variáveis obrigatórias** (`.env`):

```bash
# Database (ajustar se necessário)
DATABASE_HOST=localhost
DATABASE_PORT=5434          # Docker = 5434, Local = 5432
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm123
DATABASE_NAME=conectcrm_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_123
JWT_EXPIRATION=7d

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# APIs Externas (pedir ao time se não tiver)
WHATSAPP_API_KEY=pedir_ao_time
OPENAI_API_KEY=pedir_ao_time
ANTHROPIC_API_KEY=pedir_ao_time
```

**Frontend** (.env na raiz de `frontend-web/`):

```bash
cd frontend-web
cp .env.example .env

# Conteúdo padrão (geralmente não precisa alterar)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

---

### 5️⃣ Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-web
npm install
```

**Tempo estimado**: 5-10 minutos (dependendo da internet)

---

## 🏗️ Primeira Build

### 1️⃣ Rodar Migrations

```bash
cd backend

# Ver migrations pendentes
npm run migration:show

# Executar migrations
npm run migration:run

# Deve ver algo como:
# ✅ CreateTicketsTable1234567890
# ✅ CreateMensagensTable1234567891
# ...
```

---

### 2️⃣ Iniciar Backend

```bash
cd backend
npm run start:dev

# Aguardar até ver:
# 🚀 Application is running on: http://localhost:3001
```

**Testar se está funcionando**:

```bash
# Em outro terminal
curl http://localhost:3001/api/auth/health

# Deve retornar: {"status":"ok"}
```

---

### 3️⃣ Iniciar Frontend

```bash
# Em novo terminal
cd frontend-web
npm start

# Aguardar até ver:
# Compiled successfully!
# Local: http://localhost:3000
```

**Navegador deve abrir automaticamente** em `http://localhost:3000`

---

### 4️⃣ Primeiro Login

1. Abrir `http://localhost:3000`
2. Usar credenciais padrão:
   - **Email**: `admin@conectcrm.com`
   - **Senha**: `admin123`
3. Se funcionar, está tudo OK! ✅

**Se não funcionar**: Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📂 Conhecendo o Projeto

### Estrutura de Pastas

```
conectsuite/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── modules/         # Módulos de negócio
│   │   │   ├── atendimento/ # Chat, tickets, triagem
│   │   │   ├── auth/        # Autenticação JWT
│   │   │   ├── empresas/    # Multi-tenancy
│   │   │   └── usuarios/    # Gestão de usuários
│   │   ├── common/          # Guards, interceptors, pipes
│   │   ├── config/          # Configs (DB, Redis, etc)
│   │   └── gateways/        # WebSocket (socket.io)
│   ├── test/                # Testes E2E
│   └── migrations/          # Migrations TypeORM
│
├── frontend-web/            # React App
│   ├── src/
│   │   ├── features/        # Módulos por feature
│   │   │   ├── atendimento/ # Chat omnichannel
│   │   │   ├── auth/        # Login, logout
│   │   │   └── dashboard/   # Dashboard principal
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls
│   │   ├── stores/          # Estado Zustand
│   │   └── App.tsx          # Rotas principais
│   └── public/              # Assets estáticos
│
├── docs/                    # Documentação técnica
│   ├── ARCHITECTURE.md      # 📖 Arquitetura do sistema
│   ├── CODE_PATTERNS.md     # 📐 Padrões de código
│   ├── TROUBLESHOOTING.md   # 🔧 Solução de problemas
│   ├── CONTRIBUTING.md      # 🤝 Como contribuir
│   └── ONBOARDING.md        # 🚀 Este arquivo!
│
├── docker-compose.yml       # PostgreSQL + Redis + pgAdmin
└── README.md                # Overview do projeto
```

---

### Stack Tecnológica

#### Backend
- **Framework**: NestJS 10.x
- **Linguagem**: TypeScript 5.x
- **Banco de Dados**: PostgreSQL 14+ (com RLS para multi-tenancy)
- **ORM**: TypeORM
- **Cache**: Redis 6.x
- **WebSocket**: socket.io
- **Autenticação**: JWT (Passport)
- **Validação**: class-validator
- **Testes**: Jest

#### Frontend
- **Framework**: React 18.x
- **Linguagem**: TypeScript 5.x
- **State Management**: Zustand 5.x
- **Estilização**: Tailwind CSS 3.x
- **Roteamento**: React Router 6.x
- **HTTP Client**: Axios
- **WebSocket**: socket.io-client
- **Testes**: React Testing Library + Jest

#### Integrações
- **WhatsApp**: Meta Cloud API + whatsapp-web.js
- **IA**: Anthropic Claude 3.5 Sonnet
- **Email**: SendGrid
- **SMS**: Twilio
- **Pagamentos**: Stripe

---

### Módulos Principais

#### 🎫 Atendimento
- Chat omnichannel (WhatsApp, Web, etc)
- Tickets de atendimento
- Triagem automática por IA
- Gestão de equipes e atendentes
- Histórico de conversas

**Arquivos importantes**:
- Backend: `backend/src/modules/atendimento/`
- Frontend: `frontend-web/src/features/atendimento/`

#### 🔐 Autenticação
- Login/Logout
- JWT tokens
- Refresh tokens
- Multi-tenancy (empresa_id)

**Arquivos importantes**:
- Backend: `backend/src/modules/auth/`
- Frontend: `frontend-web/src/features/auth/`

#### 🏢 Empresas (Multi-tenancy)
- RLS (Row-Level Security) no PostgreSQL
- Cada empresa vê apenas seus dados
- Interceptor automático em requisições

**Arquivos importantes**:
- Backend: `backend/src/modules/empresas/`
- Config: `backend/src/common/interceptors/empresa.interceptor.ts`

---

## 🎯 Primeira Tarefa

### Objetivo

**Fazer uma pequena alteração e abrir seu primeiro PR.**

Sugestões de tarefas simples para começar:

#### Opção 1: Melhorar Documentação

1. Ler [CODE_PATTERNS.md](./CODE_PATTERNS.md)
2. Adicionar um exemplo que falta
3. Abrir PR com a melhoria

#### Opção 2: Corrigir Bug Pequeno

1. Procurar issues com label `good first issue`
2. Reproduzir o bug localmente
3. Corrigir e adicionar teste
4. Abrir PR

#### Opção 3: Adicionar Teste

1. Escolher um arquivo sem testes (ou com cobertura baixa)
2. Criar arquivo `.spec.ts` ou `.test.tsx`
3. Adicionar testes básicos (sucesso + erro)
4. Abrir PR

---

### Passo a Passo (Exemplo: Melhorar Docs)

```bash
# 1. Atualizar develop
git checkout develop
git pull origin develop

# 2. Criar branch
git checkout -b docs/melhorar-code-patterns

# 3. Fazer alteração
# Editar docs/CODE_PATTERNS.md no VS Code

# 4. Ver diff
git diff docs/CODE_PATTERNS.md

# 5. Commitar
git add docs/CODE_PATTERNS.md
git commit -m "docs: adicionar exemplo de useMemo em CODE_PATTERNS"

# 6. Push
git push origin docs/melhorar-code-patterns

# 7. Abrir PR no GitHub
# https://github.com/Dhonleno/conectsuite/pulls
# Clicar em "Compare & pull request"
# Preencher template (ver CONTRIBUTING.md)
# Solicitar review
```

---

### Checklist da Primeira Tarefa

- [ ] Branch criada a partir de `develop`
- [ ] Alteração feita e testada localmente
- [ ] Commit segue Conventional Commits
- [ ] PR aberto com título descritivo
- [ ] Template de PR preenchido
- [ ] Revisores solicitados
- [ ] CI passando (se tiver)
- [ ] Feedback de code review implementado
- [ ] PR mergeado! 🎉

**Parabéns, você é oficialmente um contribuidor!**

---

## 🆘 Onde Buscar Ajuda

### 1. Documentação (Comece Aqui!)

- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender estrutura do projeto
- 📐 [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Padrões a seguir
- 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas comuns
- 🤝 [CONTRIBUTING.md](./CONTRIBUTING.md) - Workflow de contribuição

### 2. Código Existente

**Melhor forma de aprender: ler código bom!**

Exemplos de código bem estruturado:

- **Backend**:
  - `backend/src/modules/atendimento/services/ticket.service.ts`
  - `backend/src/modules/auth/controllers/auth.controller.ts`

- **Frontend**:
  - `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`
  - `frontend-web/src/stores/atendimentoStore.ts`

### 3. Testes

**Testes são documentação executável!**

- Backend: `backend/src/**/*.spec.ts`
- Frontend: `frontend-web/src/**/*.test.tsx`

### 4. Issues e PRs Anteriores

Procure por issues similares:
- `label:bug` - Correções de bugs
- `label:enhancement` - Novas features
- `label:good first issue` - Boas para começar

### 5. Time (Última Opção)

**Antes de perguntar**, verifique se:
- Consultou documentação acima
- Pesquisou no código
- Procurou issues/PRs similares
- Tentou debugar (console.log, breakpoints)

**Se ainda precisar**:
- Abra issue com tag `question`
- Use template de troubleshooting
- Inclua contexto completo (erro, tentativas, ambiente)

---

## 🚀 Próximos Passos

### Semana 1: Familiarização

- [ ] Ler toda documentação em `docs/`
- [ ] Explorar código (backend e frontend)
- [ ] Rodar testes localmente
- [ ] Fazer primeira contribuição (docs/bug/teste)
- [ ] Participar de code review

### Semana 2-4: Pequenas Features

- [ ] Pegar issue com `good first issue`
- [ ] Implementar feature simples
- [ ] Adicionar testes
- [ ] Receber e implementar feedback
- [ ] Mergear PR

### Mês 2: Features Médias

- [ ] Pegar issue sem label de iniciante
- [ ] Feature que toca backend E frontend
- [ ] Revisar PRs de outros devs
- [ ] Contribuir para discussões técnicas

### Mês 3+: Autonomia Completa

- [ ] Trabalhar em features complexas
- [ ] Propor melhorias de arquitetura
- [ ] Mentorar novos desenvolvedores
- [ ] Liderar iniciativas técnicas

---

## 🎓 Recursos de Aprendizado

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### NestJS
- [NestJS Official Docs](https://docs.nestjs.com/)
- [NestJS Course (free)](https://www.udemy.com/course/nestjs-zero-to-hero/)

### React
- [React Docs (new)](https://react.dev/)
- [React Patterns](https://reactpatterns.com/)
- [React Testing Library](https://testing-library.com/react)

### Zustand
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand Best Practices](https://tkdodo.eu/blog/working-with-zustand)

### PostgreSQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [TypeORM Docs](https://typeorm.io/)

### Multi-tenancy
- [Row-Level Security (RLS)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 💡 Dicas de Produtividade

### VS Code

**Extensões essenciais** (ver `.vscode/extensions.json`):
- ESLint
- Prettier
- TypeScript Vue Plugin
- GitLens
- Thunder Client (testar APIs)
- Error Lens (ver erros inline)

**Atalhos úteis**:
- `Ctrl+P` - Buscar arquivo
- `Ctrl+Shift+F` - Buscar no projeto
- `Ctrl+Space` - Autocomplete
- `F12` - Ir para definição
- `Shift+F12` - Ver referências

---

### Terminal

**Aliases úteis** (adicionar no `.bashrc` ou `.zshrc`):

```bash
# Atalhos
alias be="cd ~/projetos/conectsuite/backend"
alias fe="cd ~/projetos/conectsuite/frontend-web"
alias dps="docker ps"
alias gst="git status"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gpl="git pull"
alias gps="git push"

# Backend
alias bdev="cd ~/projetos/conectsuite/backend && npm run start:dev"
alias btest="cd ~/projetos/conectsuite/backend && npm test"

# Frontend
alias fdev="cd ~/projetos/conectsuite/frontend-web && npm start"
alias ftest="cd ~/projetos/conectsuite/frontend-web && npm test"
```

---

### Git

**Comandos frequentes**:

```bash
# Ver status de forma bonita
git log --oneline --graph --all

# Ver diff antes de commitar
git diff --cached

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Atualizar branch com develop
git checkout develop
git pull
git checkout feature/minha-branch
git rebase develop
```

---

## ✅ Checklist de Conclusão

Você completou o onboarding quando:

- [ ] ✅ Ambiente de dev funcionando (backend + frontend)
- [ ] ✅ Consegue rodar projeto localmente sem erros
- [ ] ✅ Fez login na aplicação
- [ ] ✅ Leu toda documentação em `docs/`
- [ ] ✅ Entendeu estrutura do projeto (pastas e arquivos principais)
- [ ] ✅ Sabe onde procurar ajuda (docs, código, issues, time)
- [ ] ✅ Criou primeira branch
- [ ] ✅ Fez primeiro commit seguindo padrões
- [ ] ✅ Abriu primeiro PR
- [ ] ✅ PR foi mergeado! 🎉

---

## 🎉 Parabéns!

**Você concluiu o onboarding!**

Agora você está pronto para contribuir com o ConectSuite. Lembre-se:

- 💬 **Pergunte** quando tiver dúvida
- 📖 **Leia** código existente
- 🧪 **Teste** antes de commitar
- 🤝 **Colabore** em code reviews
- 🚀 **Melhore** continuamente

**Bem-vindo ao time! 🚀**

---

**Última revisão**: 6 de novembro de 2025  
**Mantenedores**: Equipe ConectSuite  
**Feedback**: Abra issue com tag `docs` para sugerir melhorias neste guia
