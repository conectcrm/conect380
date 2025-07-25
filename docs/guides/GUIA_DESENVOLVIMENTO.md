# 🚀 Guia de Desenvolvimento - Fênix CRM

## 📂 Estrutura do Projeto

```
C:\Projetos\fenixcrm\
├── backend/                 # API NestJS + TypeScript + PostgreSQL
├── frontend-web/           # Interface React + TypeScript
├── mobile/                 # App React Native (futuro)
└── scripts/               # Scripts de automação
```

## 🏃‍♂️ Comandos de Inicialização

### ⚙️ Backend (NestJS)
```bash
# Navegar para o backend
cd C:\Projetos\fenixcrm\backend

# Compilar e iniciar
npm run build
node "C:\Projetos\fenixcrm\backend\dist\main.js"

# Porta: http://localhost:3001
# Documentação API: http://localhost:3001/api-docs
```

### 🌐 Frontend (React)
```bash
# SEMPRE navegar primeiro para o diretório correto
cd C:\Projetos\fenixcrm\frontend-web

# Iniciar servidor de desenvolvimento (use um dos métodos abaixo)
npm start

# Alternativas se houver problemas com npm:
npx react-scripts start
.\start-frontend.bat  # Script batch personalizado

# Porta: http://localhost:3900
```

### 🐘 Banco de Dados (PostgreSQL Docker)
```bash
# Verificar se o container está rodando
docker ps

# Iniciar PostgreSQL (se não estiver rodando)
docker run --name conectcrm-postgres -e POSTGRES_DB=conectcrm_db -e POSTGRES_USER=conectcrm -e POSTGRES_PASSWORD=conectcrm123 -p 5434:5432 -d postgres:15-alpine
```

## 🔧 Configurações Importantes

### Portas do Sistema
- **Backend**: 3001
- **Frontend**: 3900  
- **PostgreSQL**: 5434 (mapeado do container 5432)

### Variáveis de Ambiente (.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm123
DATABASE_NAME=conectcrm_db
APP_PORT=3001
```

## 🛠️ Dependências Aprovadas

Sempre consultar `DEPENDENCIAS_APROVADAS.md` antes de instalar novas dependências.

**Regra**: Não instalar dependências sem aprovação prévia!

## 🧪 Teste de Conectividade

### Testar Backend
```bash
# Teste básico de API
(Invoke-WebRequest -Uri "http://localhost:3001/oportunidades/pipeline" -Method GET).Content
```

### Verificar Logs
```bash
# Backend em execução mostra:
# "🌐 Conect CRM Backend rodando na porta 3001"
# "📖 Documentação disponível em: http://localhost:3001/api-docs"
```

## 🔄 Fluxo de Desenvolvimento

1. **Sempre iniciar o PostgreSQL primeiro**
2. **Compilar e iniciar o backend**
3. **Navegar para frontend-web e iniciar React**
4. **Testar conectividade entre frontend e backend**

## 📋 Checklist Antes de Começar

- [ ] PostgreSQL rodando na porta 5434
- [ ] Backend compilado e rodando na porta 3001
- [ ] Estar no diretório correto: `C:\Projetos\fenixcrm\frontend-web`
- [ ] Frontend iniciado na porta 3900

## 🐛 Troubleshooting

### Erro "Could not read package.json"
- Verificar se está no diretório correto: `C:\Projetos\fenixcrm\frontend-web`
- **SOLUÇÃO DEFINITIVA**: Usar o arquivo start-frontend.bat ou criar um script específico

### Script de Inicialização Seguro (criar se não existir)
```batch
@echo off
cd /d "C:\Projetos\fenixcrm\frontend-web"
set PORT=3900
set NODE_OPTIONS=--max_old_space_size=4096
call npm start
pause
```

### Erro de porta em uso
- Matar processo: `taskkill /PID <PID> /F`
- Verificar portas: `netstat -ano | findstr :3001`

### Erro de conexão com banco
- Verificar se PostgreSQL está rodando: `docker ps`
- Verificar configurações no `.env`

### Erro de dependências ajv
- Executar: `npm install ajv@^8.0.0 ajv-keywords@^5.0.0`

---
*Documento atualizado em: 22/07/2025*
*Versão: 1.0*
