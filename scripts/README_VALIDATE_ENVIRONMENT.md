# 🔍 Validação de Ambiente - README

## 📋 Visão Geral

Script PowerShell que **verifica se o ambiente de desenvolvimento está pronto** antes de iniciar o trabalho no ConectCRM.

### O Que Verifica

✅ **8 Verificações Automáticas:**

1. **Node.js e npm** - Versão mínima v18
2. **Docker** - Instalado e rodando
3. **Git** - Versão e branch atual
4. **Dependências** - node_modules (backend + frontend)
5. **Arquivos de Configuração** - .env, docker-compose.yml
6. **Portas** - 3000, 3001, 5432 disponíveis
7. **Espaço em Disco** - Mínimo 5 GB livres
8. **Variáveis de Ambiente** - DATABASE_*, JWT_SECRET

### Tempo de Execução

⚡ **5-10 segundos** para verificação completa

---

## 🚀 Como Usar

### 1. Verificação Simples

```powershell
.\scripts\validate-environment.ps1
```

**Output:**
```
═══════════════════════════════════════════════════════════════════
  🔍 VALIDAÇÃO DE AMBIENTE - ConectCRM
═══════════════════════════════════════════════════════════════════

  📦 NODE.JS
     ✅ Node.js: v20.11.0
     ✅ npm: 10.2.4

  🐳 DOCKER
     ✅ Docker instalado: Docker version 24.0.7
     ✅ Docker rodando

  📚 GIT
     ✅ Git: git version 2.43.0
     ✅ Branch atual: consolidacao-atendimento

  📦 DEPENDÊNCIAS DO PROJETO
     ✅ Backend node_modules instalado
     ✅ Frontend node_modules instalado

  ⚙️  ARQUIVOS DE CONFIGURAÇÃO
     ✅ backend\.env existe
     ✅ docker-compose.yml existe

  🔌 PORTAS
     ✅ Porta 3000 disponível
     ✅ Porta 3001 disponível
     ✅ Porta 5432 disponível

  💾 ESPAÇO EM DISCO
     ✅ Espaço disponível: 45.30 GB / 500.00 GB

  🔐 VARIÁVEIS DE AMBIENTE
     ✅ Todas as variáveis obrigatórias presentes

═══════════════════════════════════════════════════════════════════
  ✅ AMBIENTE PRONTO PARA DESENVOLVIMENTO
═══════════════════════════════════════════════════════════════════
```

---

### 2. Modo de Correção Automática

```powershell
.\scripts\validate-environment.ps1 -Fix
```

**O Que Corrige Automaticamente:**
- ✅ Instala node_modules (backend + frontend) se faltando
- ✅ Cria .env a partir de .env.example se não existir
- ✅ Tenta iniciar Docker Desktop se não estiver rodando

**Exemplo:**
```
  📦 DEPENDÊNCIAS DO PROJETO
     ❌ Backend node_modules não instalado
     🔧 Instalando dependências do backend...
     ✅ Backend node_modules instalado

  🐳 DOCKER
     ⚠️  Docker instalado mas não está rodando
     🔧 Tentando iniciar Docker Desktop...
     ✅ Docker rodando
```

---

### 3. Output em JSON (para CI/CD)

```powershell
.\scripts\validate-environment.ps1 -Json
```

**Output:**
```json
{
  "Timestamp": "2025-11-03 15:30:45",
  "CanDevelop": true,
  "Issues": [],
  "Checks": {
    "Node": {
      "Installed": true,
      "Version": "v20.11.0",
      "NpmVersion": "10.2.4",
      "Valid": true
    },
    "Docker": {
      "Installed": true,
      "Version": "Docker version 24.0.7",
      "Running": true
    },
    "Git": {
      "Installed": true,
      "Version": "git version 2.43.0",
      "Branch": "consolidacao-atendimento"
    },
    "BackendDeps": { "Installed": true },
    "FrontendDeps": { "Installed": true },
    "ConfigFiles": {
      "BackendEnv": true,
      "DockerCompose": true
    },
    "Ports": {
      "Required": [3000, 3001, 5432],
      "InUse": [],
      "AllAvailable": true
    },
    "Disk": {
      "FreeGB": 45.30,
      "TotalGB": 500.00,
      "PercentUsed": 90.94,
      "Sufficient": true
    },
    "EnvVars": {
      "FileExists": true,
      "AllPresent": true,
      "Missing": []
    }
  }
}
```

---

## 📊 Interpretando Resultados

### ✅ Tudo OK

```
✅ AMBIENTE PRONTO PARA DESENVOLVIMENTO
```

**Ação:** Pode começar a desenvolver!

```powershell
# Iniciar backend
npm run start:dev

# Em outro terminal, iniciar frontend
cd frontend-web
npm start
```

---

### ⚠️ Avisos (Warnings)

```
⚠️  AMBIENTE OK COM AVISOS

Avisos (2):
  • Pouco espaço em disco (7.5 GB)
  • Porta 3000 em uso
```

**Ação:** Pode desenvolver, mas com cautela.

**Soluções:**
- **Espaço em disco baixo:** Limpar arquivos temporários, backups antigos
- **Porta em uso:** Parar processo que está usando a porta ou mudar porta do projeto

---

### ❌ Problemas Bloqueadores

```
❌ AMBIENTE NÃO ESTÁ PRONTO

Problemas (3):
  • Node.js não instalado
  • Backend node_modules não instalado
  • backend\.env não encontrado

💡 Tente executar com -Fix para correção automática:
   .\scripts\validate-environment.ps1 -Fix
```

**Ação:** Resolver problemas antes de desenvolver.

**Prioridade:**
1. Instalar ferramentas (Node.js, Docker, Git)
2. Executar `.\scripts\validate-environment.ps1 -Fix`
3. Verificar novamente

---

## 🔧 Problemas Comuns

### 1. Node.js Versão Incompatível

**Erro:**
```
❌ Node.js: v16.20.0 (mínimo: v18)
💡 Solução: https://nodejs.org/
```

**Solução:**
1. Acessar https://nodejs.org/
2. Baixar versão LTS (v20+)
3. Instalar (sobrescreve versão antiga)
4. Verificar: `node --version`

---

### 2. Docker Não Está Rodando

**Erro:**
```
⚠️  Docker instalado mas não está rodando
💡 Solução: Iniciar Docker Desktop
```

**Solução Manual:**
1. Abrir Docker Desktop
2. Aguardar 30-60 segundos (até ícone ficar verde)
3. Verificar novamente

**Solução Automática:**
```powershell
.\scripts\validate-environment.ps1 -Fix
```

---

### 3. node_modules Não Instalado

**Erro:**
```
❌ Backend node_modules não instalado
💡 Solução: cd backend && npm install
```

**Solução Manual:**
```powershell
# Backend
cd backend
npm install

# Frontend
cd ..\frontend-web
npm install
```

**Solução Automática:**
```powershell
.\scripts\validate-environment.ps1 -Fix
```

---

### 4. Arquivo .env Não Encontrado

**Erro:**
```
❌ backend\.env não encontrado
💡 Solução: Copiar .env.example para .env
```

**Solução Manual:**
```powershell
cd backend
Copy-Item .env.example .env
```

**Depois, editar `backend\.env` e configurar:**
```env
DATABASE_PASSWORD=sua_senha_aqui
JWT_SECRET=chave_secreta_forte_aqui
```

**Solução Automática:**
```powershell
.\scripts\validate-environment.ps1 -Fix
# Depois editar manualmente as credenciais
```

---

### 5. Porta em Uso

**Erro:**
```
⚠️  Porta 3001 em uso
```

**Identificar Processo:**
```powershell
# Windows
netstat -ano | findstr :3001

# Linux/macOS
lsof -i :3001
```

**Soluções:**
1. **Parar processo:** Se for backend antigo, fechar terminal
2. **Matar processo:** `taskkill /PID <PID> /F` (Windows) ou `kill -9 <PID>` (Linux/macOS)
3. **Mudar porta:** Editar `backend/src/main.ts` (trocar 3001 por outra porta)

---

### 6. Espaço em Disco Crítico

**Erro:**
```
❌ Espaço crítico: 2.5 GB / 500.00 GB
💡 Urgente: Liberar espaço em disco
```

**Ações:**
1. **Limpar temporários:** `.\scripts\limpeza-massa.ps1 -DryRun` (verificar) depois sem -DryRun
2. **Remover backups antigos:** Deletar arquivos em `backups/` mais antigos que 30 dias
3. **Limpar Docker:** `docker system prune -a --volumes` (cuidado: remove tudo!)
4. **Limpar node_modules:** Deletar em projetos antigos não usados

---

### 7. Variáveis de Ambiente Faltando

**Erro:**
```
❌ Variáveis faltando: DATABASE_PASSWORD, JWT_SECRET
💡 Solução: Editar backend\.env
```

**Solução:**
Editar `backend\.env` e adicionar:
```env
DATABASE_PASSWORD=postgres123
JWT_SECRET=chave-muito-forte-aleatoria-aqui-123456789
```

**Gerar JWT_SECRET forte:**
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## 🎯 Integração com VS Code

### Adicionar Task

Editar `.vscode/tasks.json` (criar se não existir):

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🔍 Validar Ambiente",
      "type": "shell",
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${workspaceFolder}/scripts/validate-environment.ps1"
      ],
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "🔧 Validar e Corrigir Ambiente",
      "type": "shell",
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${workspaceFolder}/scripts/validate-environment.ps1",
        "-Fix"
      ],
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

**Usar:**
1. `Ctrl + Shift + P`
2. Digite: `Tasks: Run Task`
3. Selecione: `🔍 Validar Ambiente` ou `🔧 Validar e Corrigir Ambiente`

---

## 🤖 Integração com CI/CD

### GitHub Actions

```yaml
name: Validar Ambiente

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Validar Ambiente
        run: |
          pwsh ./scripts/validate-environment.ps1 -Json > validation.json
          cat validation.json
      
      - name: Verificar Status
        run: |
          $result = Get-Content validation.json | ConvertFrom-Json
          if (-not $result.CanDevelop) {
            Write-Error "Ambiente inválido!"
            exit 1
          }
```

---

### GitLab CI

```yaml
validate-environment:
  stage: test
  image: mcr.microsoft.com/powershell:latest
  script:
    - pwsh ./scripts/validate-environment.ps1 -Json > validation.json
    - cat validation.json
    - |
      $result = Get-Content validation.json | ConvertFrom-Json
      if (-not $result.CanDevelop) {
        Write-Error "Ambiente inválido!"
        exit 1
      }
  artifacts:
    paths:
      - validation.json
    expire_in: 1 week
```

---

## 📈 Benefícios

### Antes (Manual)

```
Developer inicia trabalho:
1. Tenta rodar backend → erro (node_modules não instalado)
2. npm install → demora 5 minutos
3. Tenta rodar novamente → erro (.env não existe)
4. Copia .env.example
5. Tenta rodar novamente → erro (Docker não está rodando)
6. Inicia Docker
7. Aguarda 2 minutos
8. Tenta rodar novamente → finalmente funciona!

Total: ~10-15 minutos de frustração
```

### Depois (Automático)

```
Developer inicia trabalho:
1. .\scripts\validate-environment.ps1 -Fix
   ✅ Verificando ambiente... (5 segundos)
   🔧 Corrigindo problemas... (30 segundos)
   ✅ Ambiente pronto!

2. npm run start:dev → funciona de primeira!

Total: ~35 segundos
```

**Ganho:** 95% mais rápido (35 seg vs 10-15 min)

---

## 🎓 Casos de Uso

### 1. Onboarding de Novo Developer

```powershell
# Primeiro dia no projeto
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite

# Verificar e corrigir ambiente
.\scripts\validate-environment.ps1 -Fix

# Se tudo OK, começar a trabalhar
npm run start:dev
```

---

### 2. Após Reinstalar Sistema Operacional

```powershell
# Ambiente limpo, instalar ferramentas
# 1. Instalar Node.js v20+
# 2. Instalar Docker Desktop
# 3. Instalar Git

# Clonar projeto
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite

# Deixar script configurar o resto
.\scripts\validate-environment.ps1 -Fix
```

---

### 3. Antes de Começar a Desenvolver (Daily)

```powershell
# Toda manhã antes de codar
.\scripts\validate-environment.ps1

# Se tudo OK:
✅ AMBIENTE PRONTO PARA DESENVOLVIMENTO

# Iniciar trabalho
npm run start:dev
```

---

### 4. Troubleshooting de Ambiente

```powershell
# Algo não está funcionando...
# Developer: "Não sei o que está errado"

# Rodar validação
.\scripts\validate-environment.ps1

# Output mostra exatamente o problema:
❌ Porta 3001 em uso
💡 Solução: Parar processo que está usando a porta

# Problema identificado em 5 segundos!
```

---

## 📚 Referências

- **Script:** `scripts/validate-environment.ps1`
- **Documentação:** Este arquivo
- **Roadmap:** `ROADMAP_MELHORIAS.md` (Sprint 1 - Validação de Ambiente)
- **Scripts relacionados:**
  - `scripts/health-check.ps1` - Verificar serviços rodando
  - `scripts/backup-database.ps1` - Backup de banco
  - `scripts/limpeza-massa.ps1` - Limpar arquivos temporários

---

## 🔄 Próximas Melhorias

- [ ] Verificar versões específicas de dependências (package.json)
- [ ] Validar conexão com banco de dados PostgreSQL
- [ ] Verificar configuração de Redis (se configurado)
- [ ] Detectar e sugerir atualizações de dependências desatualizadas
- [ ] Modo interativo: perguntar antes de corrigir cada problema
- [ ] Suporte a macOS e Linux (atualmente otimizado para Windows)

---

**Mantido por:** Equipe ConectCRM  
**Última atualização:** Novembro 2025
