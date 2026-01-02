# 🔄 Guia de Migração de Ambiente - ConectCRM

## 📋 Checklist de Migração Completa

### 1. 🗂️ Backup do Projeto
```bash
# 1. Faça backup completo do projeto
# Copie toda a pasta C:\Projetos\conectcrm para um drive externo ou nuvem

# 2. Verifique se todos os arquivos estão incluídos
dir C:\Projetos\conectcrm /s > lista_arquivos_backup.txt
```

### 2. 📦 Exportar Configurações do VS Code

#### 2.1 Extensões Instaladas
```bash
# Execute no terminal do VS Code para listar extensões
code --list-extensions > vscode-extensions.txt
```

#### 2.2 Configurações do VS Code
- Copie a pasta: `%APPDATA%\Code\User\settings.json`
- Copie a pasta: `%APPDATA%\Code\User\keybindings.json`
- Copie workspace settings: `.vscode\` (já está no projeto)

### 3. 🐳 Backup do Docker/PostgreSQL

#### 3.1 Backup do Banco de Dados
```bash
# Conecte no container PostgreSQL e faça backup
docker exec -i conectcrm-postgres pg_dump -U conectcrm -d conectcrm_db > backup_conectcrm.sql

# Ou use o comando direto
pg_dump -h localhost -p 5434 -U conectcrm -d conectcrm_db > backup_conectcrm_completo.sql
```

#### 3.2 Backup das Configurações Docker
- Copie: `backend\docker-compose.yml`
- Copie: `backend\ormconfig.js`
- Copie volumes Docker se necessário

### 4. 📋 Informações de Ambiente

#### 4.1 Versões Instaladas
```bash
# Anote as versões atuais
node --version > versoes_ambiente.txt
npm --version >> versoes_ambiente.txt
docker --version >> versoes_ambiente.txt
git --version >> versoes_ambiente.txt
```

#### 4.2 Variáveis de Ambiente
- Copie arquivos `.env` de todos os módulos
- Documente portas utilizadas (3001, 3000, 5434)

### 5. 🔑 Credenciais e Tokens
- Tokens de API (se houver)
- Credenciais de banco
- Chaves SSH/GPG
- Configurações Git

---

## 🚀 Instalação na Nova Máquina

### 1. 📥 Softwares Necessários

#### 1.1 Instalar Node.js
```bash
# Baixe e instale Node.js LTS da versão atual
# https://nodejs.org/

# Verificar instalação
node --version
npm --version
```

#### 1.2 Instalar Docker Desktop
```bash
# Baixe e instale Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Verificar instalação
docker --version
docker-compose --version
```

#### 1.3 Instalar Git
```bash
# Baixe e instale Git
# https://git-scm.com/downloads

# Configurar Git
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

#### 1.4 Instalar VS Code
```bash
# Baixe e instale VS Code
# https://code.visualstudio.com/

# Instalar extensões salvas
code --install-extension < vscode-extensions.txt
```

### 2. 🗂️ Restaurar Projeto

#### 2.1 Copiar Projeto
```bash
# Copie toda a pasta do projeto para C:\Projetos\conectcrm
# Mantenha a mesma estrutura de pastas
```

#### 2.2 Instalar Dependências Backend
```bash
cd C:\Projetos\conectcrm\backend
npm install
```

#### 2.3 Instalar Dependências Frontend
```bash
cd C:\Projetos\conectcrm\frontend-web
npm install
```

#### 2.4 Instalar Dependências Mobile (se usado)
```bash
cd C:\Projetos\conectcrm\mobile
npm install
```

### 3. 🐳 Restaurar Banco de Dados

#### 3.1 Iniciar PostgreSQL
```bash
cd C:\Projetos\conectcrm\backend
docker-compose up -d
```

#### 3.2 Restaurar Backup
```bash
# Aguarde o container inicializar (30-60 segundos)
# Restaure o backup
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db < backup_conectcrm_completo.sql
```

### 4. ✅ Verificar Instalação

#### 4.1 Testar Backend
```bash
cd C:\Projetos\conectcrm\backend
npm run build
npm run start:dev
```

#### 4.2 Testar Frontend
```bash
cd C:\Projetos\conectcrm\frontend-web
npm start
```

#### 4.3 Testar Integração
- Acesse http://localhost:3000
- Faça login com admin@conectsuite.com.br / admin123
- Teste funcionalidades principais

---

## 🛠️ Scripts Automatizados

### Script de Backup (backup-ambiente.ps1)
```powershell
# Criar backup completo
Write-Host "🔄 Iniciando backup do ambiente ConectCRM..." -ForegroundColor Yellow

# 1. Criar pasta de backup
$backupPath = "C:\Backup\ConectCRM-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Path $backupPath -Force

# 2. Copiar projeto
Write-Host "📂 Copiando projeto..." -ForegroundColor Green
Copy-Item -Path "C:\Projetos\conectcrm" -Destination "$backupPath\conectcrm" -Recurse

# 3. Backup banco de dados
Write-Host "🗄️ Fazendo backup do banco..." -ForegroundColor Green
docker exec -i conectcrm-postgres pg_dump -U conectcrm -d conectcrm_db > "$backupPath\backup_conectcrm.sql"

# 4. Listar extensões VS Code
Write-Host "🔌 Exportando extensões VS Code..." -ForegroundColor Green
code --list-extensions > "$backupPath\vscode-extensions.txt"

# 5. Copiar configurações VS Code
Write-Host "⚙️ Copiando configurações VS Code..." -ForegroundColor Green
Copy-Item -Path "$env:APPDATA\Code\User\settings.json" -Destination "$backupPath\" -ErrorAction SilentlyContinue
Copy-Item -Path "$env:APPDATA\Code\User\keybindings.json" -Destination "$backupPath\" -ErrorAction SilentlyContinue

# 6. Salvar versões
Write-Host "📋 Salvando informações de versões..." -ForegroundColor Green
@"
Node.js: $(node --version)
NPM: $(npm --version)
Docker: $(docker --version)
Git: $(git --version)
Data Backup: $(Get-Date)
"@ | Out-File "$backupPath\versoes-ambiente.txt"

Write-Host "✅ Backup concluído em: $backupPath" -ForegroundColor Green
Write-Host "📁 Copie esta pasta para a nova máquina" -ForegroundColor Cyan
```

### Script de Restauração (restaurar-ambiente.ps1)
```powershell
# Script para restaurar na nova máquina
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath
)

Write-Host "🔄 Iniciando restauração do ambiente ConectCRM..." -ForegroundColor Yellow

# 1. Verificar se backup existe
if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Pasta de backup não encontrada: $BackupPath" -ForegroundColor Red
    exit 1
}

# 2. Criar estrutura de pastas
Write-Host "📁 Criando estrutura de pastas..." -ForegroundColor Green
New-Item -ItemType Directory -Path "C:\Projetos" -Force

# 3. Copiar projeto
Write-Host "📂 Restaurando projeto..." -ForegroundColor Green
Copy-Item -Path "$BackupPath\conectcrm" -Destination "C:\Projetos\" -Recurse -Force

# 4. Instalar dependências backend
Write-Host "📦 Instalando dependências backend..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\backend"
npm install

# 5. Instalar dependências frontend
Write-Host "📦 Instalando dependências frontend..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\frontend-web"
npm install

# 6. Iniciar Docker
Write-Host "🐳 Iniciando Docker..." -ForegroundColor Green
Set-Location "C:\Projetos\conectcrm\backend"
docker-compose up -d

# 7. Aguardar PostgreSQL
Write-Host "⏳ Aguardando PostgreSQL inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 8. Restaurar banco
if (Test-Path "$BackupPath\backup_conectcrm.sql") {
    Write-Host "🗄️ Restaurando banco de dados..." -ForegroundColor Green
    Get-Content "$BackupPath\backup_conectcrm.sql" | docker exec -i conectcrm-postgres psql -U conectcrm -d conectcrm_db
}

# 9. Instalar extensões VS Code
if (Test-Path "$BackupPath\vscode-extensions.txt") {
    Write-Host "🔌 Instalando extensões VS Code..." -ForegroundColor Green
    Get-Content "$BackupPath\vscode-extensions.txt" | ForEach-Object { code --install-extension $_ }
}

Write-Host "✅ Restauração concluída!" -ForegroundColor Green
Write-Host "🚀 Execute 'npm run start:dev' no backend e 'npm start' no frontend" -ForegroundColor Cyan
```

---

## 📝 Checklist Final

### ✅ Antes de Migrar
- [ ] Backup completo do projeto
- [ ] Backup do banco de dados
- [ ] Lista de extensões VS Code
- [ ] Configurações VS Code
- [ ] Documentar versões de software
- [ ] Salvar credenciais importantes

### ✅ Na Nova Máquina
- [ ] Node.js instalado
- [ ] Docker Desktop instalado
- [ ] Git instalado
- [ ] VS Code instalado
- [ ] Projeto copiado
- [ ] Dependências instaladas
- [ ] Banco restaurado
- [ ] Extensões VS Code instaladas
- [ ] Teste completo funcionando

### ✅ Verificação Final
- [ ] Backend compila sem erros
- [ ] Frontend inicia corretamente
- [ ] Login funciona
- [ ] Banco de dados acessível
- [ ] Todas as funcionalidades testadas

---

## 🆘 Troubleshooting

### Problemas Comuns

#### PostgreSQL não conecta
```bash
# Verificar se container está rodando
docker ps

# Reiniciar se necessário
docker-compose down
docker-compose up -d
```

#### Erro de dependências Node
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Erro de permissões Docker
```bash
# Executar Docker Desktop como administrador
# Ou adicionar usuário ao grupo docker
```

### 📞 Contatos de Suporte
- Documentação: Consulte README.md do projeto
- Issues: Verifique logs detalhados
- Community: Stack Overflow para problemas gerais

---

**📝 Nota**: Mantenha este guia atualizado conforme o projeto evolui!
