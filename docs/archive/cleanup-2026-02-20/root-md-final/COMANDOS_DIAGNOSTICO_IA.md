# 🔧 Comandos Úteis para Diagnóstico - ConectCRM

> **Para Agentes de IA**: Use estes comandos para verificar estado do sistema

---

## 🔍 Verificar o que JÁ EXISTE

### Backend - Procurar Features

```bash
# Procurar por entity
grep_search "class.*Entity" --includePattern="backend/src/**/*.entity.ts"

# Procurar por controller de uma feature
grep_search "equipe" --includePattern="backend/src/**/*.controller.ts"

# Procurar por service
grep_search "equipe" --includePattern="backend/src/**/*.service.ts"

# Ver todas as entities registradas
read_file backend/src/config/database.config.ts

# Listar arquivos de um módulo
list_dir backend/src/modules/triagem
```

### Frontend - Procurar Páginas e Services

```bash
# Procurar páginas existentes
file_search "**/*Page.tsx"

# Procurar service específico
file_search "**/*equipeService*"

# Ver rotas registradas
read_file frontend-web/src/App.tsx

# Ver configuração do menu
read_file frontend-web/src/config/menuConfig.ts
```

---

## 🚀 Verificar Estado dos Serviços

### Backend (NestJS)

```powershell
# Ver se backend está rodando
Get-Process -Name node | Select-Object Id, ProcessName, StartTime

# Ver logs do backend em tempo real
cd backend
npm run start:dev

# Verificar se porta 3001 está em uso
netstat -ano | findstr :3001

# Compilar TypeScript e ver erros
cd backend
npm run build
```

### Frontend (React)

```powershell
# Ver se frontend está rodando
Get-Process -Name node | Where-Object { $_.MainWindowTitle -like "*frontend*" }

# Iniciar frontend
cd frontend-web
npm start

# Verificar se porta 3000 está em uso
netstat -ano | findstr :3000

# Build e ver erros TypeScript
cd frontend-web
npm run build
```

---

## 🗄️ Migrations e Banco de Dados

### Ver Estado das Migrations

```powershell
cd backend

# Listar migrations executadas
npm run migration:show

# Criar nova migration
npm run migration:generate -- src/migrations/NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert
```

### Diagnóstico de Erros de Entity

```bash
# Ver se entity está registrada
read_file backend/src/config/database.config.ts

# Procurar entity no projeto
grep_search "class Equipe" --includePattern="**/*.entity.ts"

# Ver se module importa a entity
grep_search "Equipe" --includePattern="backend/src/modules/triagem/triagem.module.ts"
```

---

## 🧪 Testar Endpoints (Backend)

### Usar run_in_terminal para testes rápidos

```powershell
# Testar se backend responde (health check)
curl http://localhost:3001/

# Testar endpoint específico (GET)
curl http://localhost:3001/equipes

# Testar endpoint com autenticação
# Primeiro fazer login e pegar token:
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body (@{ username="admin"; password="senha" } | ConvertTo-Json) -ContentType "application/json"
$token = $response.access_token

# Depois usar o token:
curl http://localhost:3001/equipes -H "Authorization: Bearer $token"
```

---

## 📂 Verificar Estrutura de Arquivos

### Listar estrutura completa

```bash
# Backend - estrutura de um módulo
list_dir backend/src/modules/triagem

# Frontend - estrutura de páginas
list_dir frontend-web/src/pages

# Frontend - estrutura de services
list_dir frontend-web/src/services
```

### Procurar arquivos específicos

```bash
# Encontrar todos os DTOs
file_search "**/*.dto.ts"

# Encontrar todas as entities
file_search "**/*.entity.ts"

# Encontrar todas as páginas React
file_search "**/*Page.tsx"

# Encontrar arquivos de configuração
file_search "**/config/*.ts"
```

---

## 🔍 Analisar Código Existente

### Ler arquivos importantes

```bash
# Ver todas as rotas do backend
grep_search "@Post\\(|@Get\\(|@Put\\(|@Delete\\(|@Patch\\(" --isRegexp=true --includePattern="**/*.controller.ts"

# Ver todas as entities
grep_search "export class.*Entity" --isRegexp=true --includePattern="**/*.entity.ts"

# Ver imports de um arquivo
read_file --startLine=1 --endLine=30 backend/src/modules/triagem/controllers/equipe.controller.ts

# Ver só os decoradores de rota
grep_search "@(Post|Get|Put|Delete|Patch)" --isRegexp=true --includePattern="backend/src/modules/triagem/controllers/*.controller.ts"
```

---

## 🚨 Diagnóstico de Erros Comuns

### EntityMetadataNotFoundError

```bash
# 1. Verificar se entity existe
file_search "**/equipe.entity.ts"

# 2. Ver se está registrada no database.config.ts
grep_search "Equipe" --includePattern="backend/src/config/database.config.ts"

# 3. Ver imports no database.config.ts
read_file --startLine=1 --endLine=50 backend/src/config/database.config.ts
```

### Rota 404 - Controller não encontrado

```bash
# 1. Verificar se controller existe
file_search "**/*equipe.controller.ts"

# 2. Ver se está registrado no module
grep_search "EquipeController" --includePattern="**/*.module.ts"

# 3. Ver decorador do controller
grep_search "@Controller" --includePattern="**/equipe.controller.ts"
```

### CORS Error

```bash
# 1. Verificar configuração CORS no main.ts
grep_search "enableCors" --includePattern="backend/src/main.ts"

# 2. Ver porta do backend
grep_search "listen\\(" --isRegexp=true --includePattern="backend/src/main.ts"

# 3. Ver URL base do frontend
grep_search "baseURL" --includePattern="frontend-web/src/services/api.ts"
```

### Migration Error

```powershell
# Ver estado atual das migrations
cd backend
npm run migration:show

# Ver última migration criada
$lastMigration = Get-ChildItem -Path "src/migrations" -Filter "*.ts" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Última migration: $($lastMigration.Name)"
```

---

## 📊 Análise de Integração Backend ↔ Frontend

### Verificar se rotas batem

```bash
# 1. Ler rotas do backend controller
read_file backend/src/modules/triagem/controllers/equipe.controller.ts

# 2. Ler service do frontend
read_file frontend-web/src/services/equipeService.ts

# 3. Comparar:
# - Backend: @Post('/equipes') deve ter
# - Frontend: api.post('/equipes', ...) correspondente
```

### Verificar tipos TypeScript

```bash
# 1. Ver DTO do backend
read_file backend/src/modules/triagem/dto/create-equipe.dto.ts

# 2. Ver interface do frontend
grep_search "interface.*Equipe" --isRegexp=true --includePattern="frontend-web/src/services/equipeService.ts"

# 3. Verificar se campos são os MESMOS
```

---

## 🧹 Limpeza e Rebuild

### Quando algo está muito quebrado

```powershell
# Backend - limpar e reinstalar
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
npm install
npm run build

# Frontend - limpar e reinstalar
cd frontend-web
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force build
npm install
npm run build

# Reiniciar ambos
# Terminal 1:
cd backend
npm run start:dev

# Terminal 2:
cd frontend-web
npm start
```

---

## 📝 Criar Documentação de Progresso

### Template para arquivo CONSOLIDACAO_*.md

```powershell
# Criar novo arquivo de consolidação
$featureName = "GESTAO_EQUIPES"  # Personalizar
$fileName = "CONSOLIDACAO_$featureName.md"

# Criar com template básico
@"
# Consolidação - $featureName

## ✅ Concluído

### Backend
- [ ] Entity criada
- [ ] DTO criado
- [ ] Service criado
- [ ] Controller criado
- [ ] Registrado no Module
- [ ] Entity em database.config.ts
- [ ] Migration gerada
- [ ] Migration executada
- [ ] Testado no Postman

### Frontend
- [ ] Service criado
- [ ] Interfaces TypeScript
- [ ] Página criada (copiou _TemplatePage.tsx?)
- [ ] Rota registrada em App.tsx
- [ ] Menu registrado em menuConfig.ts
- [ ] Testado na UI

## 📂 Arquivos Criados

### Backend
- \`backend/src/modules/.../entities/nome.entity.ts\`
- \`backend/src/modules/.../dto/create-nome.dto.ts\`
- \`backend/src/modules/.../services/nome.service.ts\`
- \`backend/src/modules/.../controllers/nome.controller.ts\`

### Frontend
- \`frontend-web/src/services/nomeService.ts\`
- \`frontend-web/src/pages/NomePage.tsx\`

## 🔗 Endpoints

| Método | Rota | Frontend |
|--------|------|----------|
| POST | /nome | nomeService.criar() |
| GET | /nome | nomeService.listar() |
| GET | /nome/:id | nomeService.buscar(id) |
| PUT | /nome/:id | nomeService.atualizar(id, data) |
| DELETE | /nome/:id | nomeService.deletar(id) |

## 🧪 Como Testar

1. Backend: \`cd backend && npm run start:dev\`
2. Frontend: \`cd frontend-web && npm start\`
3. Abrir: http://localhost:3000/caminho/da/pagina
4. Testar CRUD completo

## 📊 Status

- Backend: ✅ Funcionando
- Frontend: ✅ Funcionando
- Integração: ✅ Testada
- Documentação: ✅ Completa
"@ | Out-File -FilePath $fileName -Encoding UTF8

Write-Host "✅ Arquivo criado: $fileName" -ForegroundColor Green
```

---

## 🎯 Workflow Completo de Verificação

Use este workflow ANTES de dizer "concluído":

```bash
# 1. Backend existe?
file_search "**/*equipe.controller.ts"
read_file backend/src/modules/triagem/controllers/equipe.controller.ts

# 2. Entity registrada?
grep_search "Equipe" --includePattern="backend/src/config/database.config.ts"

# 3. Migration rodou?
# (executar no terminal)
cd backend && npm run migration:show

# 4. Frontend service existe?
file_search "**/*equipeService*"
read_file frontend-web/src/services/equipeService.ts

# 5. Página existe?
file_search "**/*GestaoEquipes*"
read_file frontend-web/src/pages/GestaoEquipesPage.tsx

# 6. Rota registrada?
grep_search "GestaoEquipesPage" --includePattern="frontend-web/src/App.tsx"

# 7. Menu registrado?
grep_search "equipes" --includePattern="frontend-web/src/config/menuConfig.ts"

# 8. Testar na prática
# (executar no terminal)
cd backend && npm run start:dev  # Terminal 1
cd frontend-web && npm start     # Terminal 2
# Abrir http://localhost:3000/gestao/equipes
```

---

**Última atualização**: Outubro 2025  
**Use estes comandos para SEMPRE verificar antes de criar código novo!**
