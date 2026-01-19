# 💻 Guia de Desenvolvimento Local - Conect360

Este guia ajuda desenvolvedores a configurar o ambiente local para trabalhar no Conect360.

---

## 📋 Pré-requisitos

### Obrigatórios

- ✅ **Node.js 22.16.x** (npm 10+) — o frontend só inicia com `NODE_OPTIONS=--max_old_space_size=4096`, então mantenha essa versão em todo o ambiente
- ✅ **PostgreSQL 15** ou superior
- ✅ **Redis 7** ou superior
- ✅ **Git**
- ✅ **npm** ou **yarn**

### Recomendados

- 💡 **VS Code** (com extensões recomendadas)
- 💡 **Docker Desktop** (para rodar PostgreSQL/Redis em containers)
- 💡 **Postman** ou **Thunder Client** (testar APIs)
- 💡 **Git Bash** ou **PowerShell** (Windows)

> Dica: use `nvm use 22.16.0` ou `fnm use 22.16` antes de rodar `npm start`. No Windows PowerShell, defina `set NODE_OPTIONS=--max_old_space_size=4096` ao iniciar o frontend, conforme já configurado no `package.json`.

---

## 🚀 Setup Rápido (5 minutos)

### Opção 1: Com Docker (Recomendado)

```powershell
# 1. Clonar repositório
git clone https://github.com/Dhonleno/conect360.git
cd conect360

# 2. Subir PostgreSQL e Redis
docker-compose up -d postgres redis

# 3. Backend - Configurar
cd backend
cp .env.example .env
# Editar .env com suas credenciais

# 4. Backend - Instalar e iniciar
npm install
npm run migration:run
npm run start:dev

# 5. Frontend - Em outro terminal
cd frontend-web
cp .env.example .env
npm install
npm start
```

### Opção 2: Sem Docker

```powershell
# 1. Instalar PostgreSQL e Redis localmente
# PostgreSQL: https://www.postgresql.org/download/
# Redis: https://redis.io/download/

# 2. Criar banco de dados
psql -U postgres
CREATE DATABASE conectcrm;
\q

# 3. Seguir passos 3-5 da Opção 1
```

---

## 🔧 Configuração Detalhada

### 1️⃣ Clonar Repositório

```powershell
# SSH (recomendado se tiver chave configurada)
git clone git@github.com:Dhonleno/conect360.git

# HTTPS
git clone https://github.com/Dhonleno/conect360.git

cd conect360
```

### 2️⃣ Configurar Backend

```powershell
cd backend

# Copiar .env de exemplo
cp .env.example .env

# Editar .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Configuração mínima do `.env`**:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=conectcrm

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=desenvolvimento-secret-key-minimo-32-caracteres
JWT_EXPIRATION=7d

# URLs (desenvolvimento local)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# WhatsApp (opcional para desenvolvimento)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id

# Anthropic (opcional para desenvolvimento)
ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ambiente
NODE_ENV=development
PORT=3001
```

> Consulte `docs/CREDENCIAIS_PADRAO.md` para os logins padrão usados pelos scripts (ex.: `admin@conectsuite.com.br` / `admin123`). Atualize esse documento se alterar qualquer credencial mencionada aqui.

```powershell
# Instalar dependências
npm install

# Rodar migrations
npm run migration:run

# Verificar se migrations rodaram
npm run migration:show

# Iniciar em modo desenvolvimento (watch mode)
npm run start:dev
```

**Backend deve iniciar em**: http://localhost:3001

### 3️⃣ Configurar Frontend

```powershell
# Em outro terminal
cd frontend-web

# Copiar .env
cp .env.example .env

# Editar .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Configuração mínima do `.env`**:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

```powershell
# Instalar dependências
npm install

# Iniciar servidor React
npm start
```

> Se usar outro terminal, lembre-se de exportar `NODE_OPTIONS=--max_old_space_size=4096` antes do `npm start` caso o sistema não herde a configuração do script.

**Frontend deve abrir em**: http://localhost:3000

---

## 🐳 Usando Docker (Recomendado)

### Stack Completa

```powershell
# Subir TUDO (PostgreSQL + Redis + Backend + Frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver apenas logs do backend
docker-compose logs -f backend

# Parar tudo
docker-compose down

# Parar e limpar volumes (cuidado: apaga dados do banco!)
docker-compose down -v
```

### Apenas Database e Cache

```powershell
# Subir apenas PostgreSQL e Redis
docker-compose up -d postgres redis

# Backend e Frontend rodando localmente (npm run start:dev)
```

### Comandos Úteis

```powershell
# Ver containers rodando
docker ps

# Acessar PostgreSQL
docker exec -it conectsuite-postgres psql -U postgres -d conectcrm

# Acessar Redis
docker exec -it conectsuite-redis redis-cli

# Ver logs de um container
docker logs conectsuite-backend -f

# Reiniciar um container
docker restart conectsuite-backend

# Parar um container
docker stop conectsuite-backend

# Iniciar um container parado
docker start conectsuite-backend
```

---

## 🧪 Rodando Testes

### Backend

```powershell
cd backend

# Todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Coverage
npm run test:cov

# Teste específico
npm test -- equipe.service.spec.ts
```

### Frontend

```powershell
cd frontend-web

# Todos os testes
npm test

# Coverage
npm test -- --coverage --watchAll=false

# Teste específico
npm test -- GestaoEquipesPage
```

---

## 🔍 Comandos de Desenvolvimento

### Backend (NestJS)

```powershell
# Desenvolvimento (watch mode)
npm run start:dev

# Debug mode
npm run start:debug

# Build para produção
npm run build

# Rodar build de produção
npm run start:prod

# Linting
npm run lint

# Format código
npm run format

# Migrations
npm run migration:generate -- src/migrations/NomeMigration
npm run migration:run
npm run migration:revert
npm run migration:show
```

### Frontend (React)

```powershell
# Desenvolvimento
npm start

# Build para produção
npm run build

# Teste do build (serve localmente)
npx serve -s build

# Linting
npm run lint

# Eject (cuidado!)
npm run eject
```

---

## 🛠️ VS Code - Configuração Recomendada

### Extensões Essenciais

Instale estas extensões no VS Code:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "github.copilot",
    "github.vscode-pull-request-github"
  ]
}
```

Para adicionar:
1. Criar `.vscode/extensions.json` (arquivo acima)
2. VS Code vai sugerir instalar automaticamente

### Settings Recomendados

Criar `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  }
}
```

### Tasks do VS Code

Já configuradas em `.vscode/tasks.json`:

- **Start Backend (Nest 3001)** - `Ctrl+Shift+B`
- **Start Backend Dev (watch)** - Desenvolvimento
- **Start Frontend (React 3000)** - Frontend

Para rodar:
1. `Ctrl+Shift+P`
2. Digitar "Run Task"
3. Selecionar task

---

## 🐛 Troubleshooting

### Backend não inicia

**Erro: "connect ECONNREFUSED localhost:5432"**

```powershell
# Verificar se PostgreSQL está rodando
# Docker:
docker ps | findstr postgres

# Local (Windows):
Get-Service -Name postgresql*

# Testar conexão
psql -h localhost -U postgres -d conectcrm
```

**Erro: "EntityMetadataNotFoundError"**

```powershell
# Verificar se entity está registrada
# Editar: backend/src/config/database.config.ts
# Adicionar entity no array 'entities'

# Reiniciar backend
```

**Erro: Migration não roda**

```powershell
cd backend

# Ver migrations pendentes
npm run migration:show

# Reverter última
npm run migration:revert

# Rodar novamente
npm run migration:run
```

### Frontend não carrega

**Erro: "Network Error" ao chamar API**

```bash
# Verificar se backend está rodando
curl http://localhost:3001/health

# Verificar CORS no backend (main.ts)
app.enableCors({ origin: 'http://localhost:3000' });

# Verificar .env do frontend
REACT_APP_API_URL=http://localhost:3001
```

**Erro: "Module not found"**

```powershell
# Limpar node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Erros de Porta em Uso

```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :3000  # Frontend

# Matar processo (Windows - substitua <PID>)
taskkill /PID <PID> /F
```

### Redis Connection Error

```powershell
# Docker
docker ps | findstr redis
docker start conectsuite-redis

# Local (Windows)
redis-cli ping
# Deve retornar: PONG

# Se não instalado, usar Docker
docker-compose up -d redis
```

---

## 📊 Verificar Saúde do Sistema

```powershell
# Backend health check
curl http://localhost:3001/health

# Ver logs backend (PM2 se estiver usando)
pm2 logs conectsuite-backend

# Ver logs Docker
docker-compose logs -f backend

# PostgreSQL - Ver conexões ativas
psql -U postgres -d conectcrm -c "SELECT count(*) FROM pg_stat_activity;"

# Redis - Verificar
redis-cli ping

# Frontend - Build test
cd frontend-web
npm run build
```

---

## 🔄 Workflow Diário Recomendado

### Início do Dia

```powershell
# 1. Atualizar código
git pull origin consolidacao-atendimento

# 2. Subir infraestrutura (se usando Docker)
docker-compose up -d postgres redis

# 3. Backend - Atualizar deps e migrations
cd backend
npm install
npm run migration:run
npm run start:dev

# 4. Frontend - Atualizar deps e iniciar
cd ../frontend-web
npm install
npm start
```

### Durante Desenvolvimento

```powershell
# Criar nova feature
git checkout -b feature/minha-feature

# Fazer alterações...

# Testar backend
cd backend
npm test

# Testar frontend
cd frontend-web
npm test

# Commitar (seguir Conventional Commits)
git add .
git commit -m "feat: adicionar nova funcionalidade"
```

### Fim do Dia

```powershell
# Push das alterações
git push origin feature/minha-feature

# Parar Docker (se quiser)
docker-compose down

# Ou deixar rodando para amanhã
```

---

## 📚 Recursos Úteis

### Documentação

- **README.md** - Visão geral do projeto
- **CONTRIBUTING.md** - Como contribuir
- **DESIGN_GUIDELINES.md** - Padrões de UI/UX
- **.github/copilot-instructions.md** - Regras de desenvolvimento

### APIs e Integrações

- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Anthropic Claude**: https://docs.anthropic.com/
- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev
- **TypeORM**: https://typeorm.io

### Ferramentas

- **Postman Collection**: (criar em `/docs/postman/`)
- **Thunder Client**: Extensão VS Code para testar APIs
- **pgAdmin**: Interface gráfica para PostgreSQL

---

## 🎯 Dicas de Produtividade

### 1. Usar Aliases

**PowerShell** (`$PROFILE`):
```powershell
# Backend
function be { cd C:\Projetos\conectcrm\backend }
function bestart { cd C:\Projetos\conectcrm\backend; npm run start:dev }

# Frontend
function fe { cd C:\Projetos\conectcrm\frontend-web }
function festart { cd C:\Projetos\conectcrm\frontend-web; npm start }

# Docker
function dcu { docker-compose up -d }
function dcd { docker-compose down }
function dcl { docker-compose logs -f }
```

### 2. Atalhos VS Code

- `Ctrl+Shift+P` - Command Palette
- `Ctrl+P` - Quick Open (arquivos)
- `Ctrl+Shift+F` - Busca global
- `Ctrl+`` - Terminal
- `F5` - Debug
- `Ctrl+Shift+B` - Run Task

### 3. Hot Reload

Ambos backend e frontend têm hot reload:
- **Backend**: Salvar arquivo → NestJS recompila automaticamente
- **Frontend**: Salvar arquivo → React recarrega navegador

### 4. Debugger

**Backend (VS Code)**:
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Debug Backend",
  "port": 9229
}
```

Iniciar backend em debug mode:
```powershell
npm run start:debug
```

---

## 🤝 Precisa de Ajuda?

- **Documentação**: Leia `SUPPORT.md`
- **Issues**: https://github.com/Dhonleno/conect360/issues
- **Discussions**: https://github.com/Dhonleno/conect360/discussions

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0
