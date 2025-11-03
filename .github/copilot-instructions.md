# GitHub Copilot Instructions - ConectCRM

## 🎨 Design System - Leia ANTES de criar qualquer tela

**OBRIGATÓRIO**: Sempre consulte `frontend-web/DESIGN_GUIDELINES.md` antes de criar ou modificar páginas React.

## 🚀 Template Base para Novas Telas

**Arquivo**: `frontend-web/src/pages/_TemplatePage.tsx`

### Regra Principal
❗ **NUNCA crie uma página do zero** - sempre copie `_TemplatePage.tsx` como base:

```powershell
cp frontend-web/src/pages/_TemplatePage.tsx frontend-web/src/pages/NomeDaPagina.tsx
```

### Fluxo de Criação de Telas

1. **Copiar template** → `_TemplatePage.tsx`
2. **Buscar marcadores** → Todos os `[PERSONALIZAR]` no código
3. **Consultar cores** → Ver paleta em `DESIGN_GUIDELINES.md`
4. **Implementar service** → Conectar com backend
5. **Ajustar métricas** → Dashboard cards específicos
6. **Testar estados** → Loading, error, empty, success

## 📋 Padrões Obrigatórios

### Cores por Módulo
```typescript
// SEMPRE usar essas cores exatas:
const CORES_MODULOS = {
  comercial: '#159A9C',    // Teal
  atendimento: '#9333EA',  // Purple
  financeiro: '#16A34A',   // Green
  gestao: '#2563EB',       // Blue
  texto: '#002333',        // Primary dark
  secundario: '#B4BEC9'    // Secondary gray
};
```

### Estrutura de Página (OBRIGATÓRIA)

```tsx
// 1. Background SEMPRE gray-50
<div className="min-h-screen bg-gray-50">

  // 2. Header com BackToNucleus (OBRIGATÓRIO)
  <div className="bg-white border-b px-6 py-4">
    <BackToNucleus nucleusName="..." nucleusPath="..." />
  </div>

  // 3. Container principal
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      
      // 4. Header da página
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <h1 className="text-3xl font-bold text-[#002333] flex items-center">
          <IconeDoModulo className="h-8 w-8 mr-3 text-[COR_DO_MODULO]" />
          Título
        </h1>
      </div>

      // 5. Dashboard Cards (4 cards com gradientes)
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Cards com gradientes blue/green/gray/purple */}
      </div>

      // 6. Barra de busca/filtros
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <input className="focus:ring-2 focus:ring-[COR_DO_MODULO]" />
      </div>

      // 7. Grid de cards ou lista
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards com hover:shadow-lg */}
      </div>
    </div>
  </div>
</div>
```

## 🚫 O Que NUNCA Fazer

- ❌ Criar página sem BackToNucleus
- ❌ Usar cores diferentes da paleta
- ❌ Usar componentes shadcn/ui (Button, Card, etc.) - usar Tailwind puro
- ❌ Esquecer estado vazio com call-to-action
- ❌ Esquecer loading states
- ❌ Grid sem responsividade (mobile-first)
- ❌ Modal sem botão de fechar (X)
- ❌ Input sem `focus:ring-2 focus:ring-[COR]`

## ✅ O Que SEMPRE Fazer

- ✅ Copiar `_TemplatePage.tsx` como base
- ✅ Consultar `DESIGN_GUIDELINES.md`
- ✅ Usar cores da paleta exata
- ✅ Implementar todos os estados (loading, error, empty, success)
- ✅ Adicionar hover effects nos cards (`hover:shadow-lg`)
- ✅ Usar grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- ✅ Incluir BackToNucleus no header
- ✅ Dashboard cards com gradientes
- ✅ Badges de status padronizados

## 📦 Componentes Permitidos

### Importar do projeto:
```typescript
import { BackToNucleus } from '../components/navigation/BackToNucleus';
```

### Importar do Lucide React:
```typescript
import { 
  Users, FileText, DollarSign, Settings,
  Plus, Edit2, Trash2, Search, X,
  CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
```

### ❌ NÃO importar:
```typescript
// NUNCA use estes imports:
import { Button } from '../components/ui/button';        // ❌
import { Card } from '../components/ui/card';            // ❌
import { Dialog } from '../components/ui/dialog';        // ❌
```

## 🎯 Badges Padronizados

```tsx
// Status Ativo
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>

// Status Pendente
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pendente
</span>

// Status Inativo
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  Inativo
</span>
```

## 📱 Responsividade (OBRIGATÓRIO)

```tsx
// Grid padrão
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Dashboard cards
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Botões no header
className="flex flex-col sm:flex-row gap-3"
```

## 🔍 Referências de Código

Sempre que precisar de exemplo, consulte ESTAS páginas (nesta ordem):

1. **Template Base**: `frontend-web/src/pages/_TemplatePage.tsx`
2. **Comercial**: `frontend-web/src/pages/CotacaoPage.tsx`
3. **Atendimento**: `frontend-web/src/pages/GestaoEquipesPage.tsx`
4. **Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`

## 📝 Checklist Automático

Quando criar uma página, SEMPRE verifique:

- [ ] Copiou `_TemplatePage.tsx`?
- [ ] Substituiu todos os `[PERSONALIZAR]`?
- [ ] Cor do módulo correta?
- [ ] BackToNucleus implementado?
- [ ] 4 Dashboard cards com gradientes?
- [ ] Barra de busca com `focus:ring-2`?
- [ ] Grid responsivo?
- [ ] Estado vazio com CTA?
- [ ] Loading states?
- [ ] Error handling?
- [ ] Badges padronizados?
- [ ] Hover effects nos cards?
- [ ] Modal com botão X?
- [ ] TypeScript types definidos?
- [ ] Registrou rota em App.tsx?
- [ ] Adicionou no menuConfig.ts?

## 🎨 Dashboard Cards - Gradientes Padrão

```tsx
// Card 1 - Blue
<div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
  
// Card 2 - Green  
<div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">

// Card 3 - Gray
<div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">

// Card 4 - Purple/Yellow/Red (depende do módulo)
<div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
```

## 🚨 Error Handling Padrão

```typescript
try {
  // operação
} catch (err: unknown) {
  console.error('Erro:', err);
  const responseMessage = (err as any)?.response?.data?.message;
  const normalizedMessage = Array.isArray(responseMessage)
    ? responseMessage.join('. ')
    : responseMessage;
  const fallbackMessage = err instanceof Error ? err.message : undefined;
  setError(normalizedMessage || fallbackMessage || 'Erro genérico');
}
```

---

## 📛 Nomenclatura e Convenções (CRITICAL)

### Padrões de Nomenclatura

#### Backend (NestJS + TypeORM)

```typescript
// Entity - singular, PascalCase
equipe.entity.ts → export class Equipe

// DTO - sufixo dto, kebab-case no arquivo
create-equipe.dto.ts → export class CreateEquipeDto
update-equipe.dto.ts → export class UpdateEquipeDto

// Service - singular, kebab-case no arquivo
equipe.service.ts → export class EquipeService

// Controller - singular, kebab-case no arquivo
equipe.controller.ts → export class EquipeController
  @Post('/equipes')           // ← rota no plural
  @Get('/equipes/:id')        // ← rota no plural
  
// Module - singular, kebab-case no arquivo
equipe.module.ts → export class EquipeModule
```

#### Frontend (React + TypeScript)

```typescript
// Service - singular, camelCase no arquivo
equipeService.ts → export const equipeService

// Page - sufixo Page, PascalCase
GestaoEquipesPage.tsx → export default GestaoEquipesPage

// Component - PascalCase
BackToNucleus.tsx → export const BackToNucleus

// Interface - PascalCase, prefixo I opcional
interface Equipe { ... }
interface CreateEquipeDto { ... }
```

### Consistência de Nomes Entre Backend e Frontend

**REGRA**: O nome da entidade deve ser CONSISTENTE em todo o sistema!

```typescript
// ✅ CORRETO - mesmo nome em todos os lugares
Backend:
  - equipe.entity.ts → class Equipe
  - equipe.service.ts → EquipeService
  - equipe.controller.ts → @Post('/equipes')
  
Frontend:
  - equipeService.ts → interface Equipe
  - GestaoEquipesPage.tsx → items: Equipe[]
  
// ❌ ERRADO - nomes diferentes confundem
Backend: class Team
Frontend: interface Equipe  // 🚫 NÃO FAÇA ISSO
```

### Rotas e Endpoints

```typescript
// SEMPRE plural nas rotas HTTP
POST   /equipes           // ✅ Criar
GET    /equipes           // ✅ Listar todos
GET    /equipes/:id       // ✅ Buscar um
PUT    /equipes/:id       // ✅ Atualizar
DELETE /equipes/:id       // ✅ Deletar
PATCH  /equipes/:id/...   // ✅ Ação específica

// ❌ NÃO use singular nas rotas
POST /equipe              // 🚫 ERRADO
```

### Estrutura de Módulos

```
backend/src/modules/
├── triagem/              # Nome do módulo (singular ou plural conforme domínio)
│   ├── entities/
│   │   ├── equipe.entity.ts
│   │   └── atendente.entity.ts
│   ├── dto/
│   │   ├── create-equipe.dto.ts
│   │   └── update-equipe.dto.ts
│   ├── services/
│   │   └── equipe.service.ts
│   ├── controllers/
│   │   └── equipe.controller.ts
│   └── triagem.module.ts
```

### Prefixos e Sufixos Obrigatórios

```typescript
// Backend
*.entity.ts    → Entidades do TypeORM
*.dto.ts       → Data Transfer Objects
*.service.ts   → Services com lógica de negócio
*.controller.ts → Controllers com rotas HTTP
*.module.ts    → Módulos do NestJS

// Frontend
*Page.tsx      → Páginas completas
*Service.ts    → Services de API
*Config.ts     → Arquivos de configuração
```

---

## 🎯 Este Arquivo é Lido Automaticamente

O GitHub Copilot lê este arquivo **automaticamente** quando você:
- Solicita criação de código
- Pede sugestões
- Usa chat do Copilot no VS Code

**Não precisa mencionar** - basta começar a codificar que o Copilot já seguirá estas regras!

---

## 🧠 Gestão de Contexto e Continuidade (IMPORTANTE)

### ⚠️ Problemas Comuns de IA

Agentes de IA podem:
- ❌ Esquecer qual etapa estava trabalhando
- ❌ Perder contexto entre requisições
- ❌ Repetir trabalho já feito
- ❌ Ignorar arquivos importantes criados anteriormente
- ❌ Não conectar backend com frontend

### ✅ SEMPRE Faça Isso Antes de Começar

Quando receber uma tarefa, **PRIMEIRO** faça uma checagem de contexto:

1. **Leia arquivos de progresso/documentação**:
   ```
   - Procure por arquivos .md na raiz do projeto
   - Leia CONCLUSAO_*, CONSOLIDACAO_*, CHECKLIST_*, README_*
   - Verifique se há documentação sobre a feature atual
   ```

2. **Verifique o que JÁ existe**:
   ```bash
   # Backend - procure por services, controllers, entities
   grep_search "nome-da-feature"
   
   # Frontend - procure por pages, components, services
   file_search "**/*NomeDaFeature*"
   ```

3. **Leia código relacionado antes de modificar**:
   ```
   - Sempre leia o arquivo COMPLETO antes de editar
   - Procure por imports e dependências
   - Verifique se há TODOs ou comentários importantes
   ```

4. **Confirme o estado atual**:
   - O backend já tem a rota?
   - O frontend já tem o service?
   - A entidade existe no banco?
   - A migração rodou?

### 📝 Fluxo Completo de Feature (SIGA NESTA ORDEM)

Quando criar uma feature completa (ex: "Gestão de Equipes"):

#### 1️⃣ Backend PRIMEIRO
```
[ ] 1.1. Criar Entity (TypeORM) em backend/src/modules/*/entities/
[ ] 1.2. Criar DTO (validações) em backend/src/modules/*/dto/
[ ] 1.3. Criar Service (lógica) em backend/src/modules/*/services/
[ ] 1.4. Criar Controller (rotas) em backend/src/modules/*/controllers/
[ ] 1.5. Registrar no Module (providers + controllers)
[ ] 1.6. Registrar entity em backend/src/config/database.config.ts
[ ] 1.7. Criar migration: npm run migration:generate
[ ] 1.8. Rodar migration: npm run migration:run
[ ] 1.9. TESTAR endpoint no Postman/Thunder Client
```

#### 2️⃣ Frontend DEPOIS
```
[ ] 2.1. Criar Service em frontend-web/src/services/
[ ] 2.2. Criar interfaces TypeScript no service
[ ] 2.3. COPIAR _TemplatePage.tsx para nova página
[ ] 2.4. Substituir todos [PERSONALIZAR]
[ ] 2.5. Conectar com service do item 2.1
[ ] 2.6. Registrar rota em App.tsx
[ ] 2.7. Adicionar no menuConfig.ts
[ ] 2.8. TESTAR na UI (criar, listar, editar, deletar)
```

#### 3️⃣ Validação Final
```
[ ] 3.1. Testar fluxo completo end-to-end
[ ] 3.2. Verificar estados: loading, error, empty, success
[ ] 3.3. Testar responsividade (mobile, tablet, desktop)
[ ] 3.4. Verificar console (sem erros)
[ ] 3.5. Documentar em arquivo CONSOLIDACAO_*.md
```

### 🔗 Conectando Backend e Frontend

**REGRA CRÍTICA**: O service do frontend DEVE espelhar as rotas do backend!

```typescript
// ❌ ERRADO - service desconectado do backend
export const criarEquipe = async (data: any) => {
  return api.post('/api/wrong-endpoint', data); // Endpoint não existe!
}

// ✅ CORRETO - verificar rota no Controller primeiro
// 1. Ler backend/src/modules/triagem/controllers/equipe.controller.ts
// 2. Ver que a rota é POST /equipes (sem /api/)
// 3. Espelhar no frontend:

export const criarEquipe = async (data: CreateEquipeDto) => {
  return api.post('/equipes', data);
}
```

### 📂 Estrutura de Arquivos - Espelho Backend/Frontend

```
backend/src/modules/triagem/
├── entities/
│   └── equipe.entity.ts          ← Define campos do banco
├── dto/
│   └── create-equipe.dto.ts      ← Define validações (class-validator)
├── services/
│   └── equipe.service.ts         ← Lógica de negócio
└── controllers/
    └── equipe.controller.ts      ← Rotas HTTP
    
frontend-web/src/
├── services/
│   └── equipeService.ts          ← ⚡ DEVE espelhar o controller
└── pages/
    └── GestaoEquipesPage.tsx     ← ⚡ DEVE usar o service
```

### 🎯 Checklist de "Não Perder Contexto"

Antes de responder ao usuário, SEMPRE verifique:

- [ ] Li todos os arquivos .md relacionados à tarefa atual?
- [ ] Procurei no código se a feature já existe parcialmente?
- [ ] Entendi se estou no backend ou frontend?
- [ ] Verifiquei se as entidades estão registradas?
- [ ] Confirmei que a migração rodou?
- [ ] Li o controller para saber as rotas exatas?
- [ ] Vi se o service frontend espelha o backend?
- [ ] Chequei se a página já está registrada em App.tsx?
- [ ] Verifiquei se está no menuConfig.ts?
- [ ] Testei antes de dizer "concluído"?

### 🚨 Sinais de que Você Perdeu Contexto

Se você está fazendo isso, **PARE** e releia o contexto:

- ❌ Criando rota que já existe
- ❌ Modificando arquivo sem ler ele primeiro
- ❌ Dizendo "agora vou criar X" quando X já existe
- ❌ Criando service frontend sem verificar o controller backend
- ❌ Pulando etapas (ex: criar página sem ter o service)
- ❌ Não mencionando arquivos que você criou 2 mensagens atrás

### 💡 Dicas para Manter Contexto

1. **Sempre mencione o que já foi feito**:
   ```
   ✅ "Vejo que já criamos a entity Equipe e o controller. 
       Agora vou criar o service frontend que se conecta à rota POST /equipes"
   ```

2. **Referencie arquivos anteriores**:
   ```
   ✅ "No arquivo equipe.controller.ts que criamos, a rota é GET /equipes/:id.
       Vou espelhar isso no equipeService.ts"
   ```

3. **Use grep/file_search antes de criar**:
   ```
   ✅ "Deixe-me verificar se já existe algo relacionado a 'equipe'..."
   ```

4. **Confirme estado antes de prosseguir**:
   ```
   ✅ "Antes de criar a página, vou confirmar que:
       - Backend tem a rota ✓
       - Service frontend existe ✓
       - Migration rodou ✓"
   ```

### 📋 Template de Resposta Ideal

Quando receber uma tarefa, estruture assim:

```markdown
## 🔍 Checagem de Contexto

- [x] Li documentação relacionada
- [x] Verifiquei código existente
- [x] Identifiquei dependências

## 📊 Estado Atual

- Backend: [controller existe? migration rodou?]
- Frontend: [service existe? página criada?]
- Integração: [testado? funcionando?]

## 🎯 Próximos Passos

1. [Etapa específica com arquivo exato]
2. [Etapa seguinte com validação]
3. [Teste final]

## 🚀 Executando...

[Aqui vão as tool calls e código]
```

### 🔄 Persistência de Progresso

Ao completar uma etapa grande, **sempre** crie/atualize um arquivo .md:

```markdown
# CONSOLIDACAO_NOME_FEATURE.md

## ✅ Concluído

- [x] Backend - Entity, DTO, Service, Controller
- [x] Frontend - Service, Página, Rota, Menu
- [x] Testes - Postman (backend) e UI (frontend)

## 📂 Arquivos Criados

### Backend
- `backend/src/modules/triagem/entities/equipe.entity.ts`
- `backend/src/modules/triagem/controllers/equipe.controller.ts`
- ...

### Frontend
- `frontend-web/src/services/equipeService.ts`
- `frontend-web/src/pages/GestaoEquipesPage.tsx`
- ...

## 🔗 Endpoints e Integrações

- POST /equipes → equipeService.criar()
- GET /equipes → equipeService.listar()
- ...

## 🧪 Como Testar

1. Backend: `npm run start:dev`
2. Frontend: `npm start`
3. Acessar: http://localhost:3000/gestao/equipes
```

---

## 🔧 Debugging e Troubleshooting

### Erros Comuns e Soluções

#### 1. EntityMetadataNotFoundError
```
❌ Erro: "No metadata for 'Equipe' was found"

✅ Solução:
1. Verificar se entity está em backend/src/config/database.config.ts
2. Adicionar import: import { Equipe } from '../modules/triagem/entities/equipe.entity';
3. Adicionar no array entities: [..., Equipe]
4. Reiniciar backend
```

#### 2. Erro 404 - Rota não encontrada
```
❌ Erro: POST /equipes retorna 404

✅ Solução:
1. Verificar se controller está registrado no module
2. Verificar se module está importado no app.module.ts
3. Verificar decorador @Controller() no controller
4. Verificar prefixo global (se houver) em main.ts
```

#### 3. CORS Error no Frontend
```
❌ Erro: "blocked by CORS policy"

✅ Solução:
1. Verificar main.ts no backend:
   app.enableCors({ origin: 'http://localhost:3000' });
2. Verificar se backend está rodando
3. Verificar URL base no axios (frontend-web/src/services/api.ts)
```

#### 4. Migration Error
```
❌ Erro: "relation already exists"

✅ Solução:
1. Verificar migrations já rodadas: npm run migration:show
2. Reverter última: npm run migration:revert
3. Ou dropar tabela manualmente e rodar novamente
```

#### 5. TypeScript Type Error
```
❌ Erro: "Type 'Equipe' is not assignable to type..."

✅ Solução:
1. Verificar se interfaces backend e frontend são IGUAIS
2. Atualizar interfaces no service frontend
3. Executar: npm run build para ver erros completos
```

### Comandos de Diagnóstico

```powershell
# Backend - verificar se está rodando
Get-Process -Name node | Select-Object Id, ProcessName, StartTime

# Backend - ver logs em tempo real
cd backend
npm run start:dev

# Frontend - verificar build
cd frontend-web
npm run build

# Banco de dados - verificar conexão
# No backend, adicionar log temporário em database.config.ts

# Verificar portas em uso
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :3000  # Frontend

# Limpar node_modules e reinstalar
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd frontend-web
Remove-Item -Recurse -Force node_modules
npm install
```

### Logs e Debugging

```typescript
// Backend - adicionar logs temporários
console.log('🔍 [Controller] Recebido:', data);
console.log('🔍 [Service] Processando:', id);
console.log('✅ [Service] Resultado:', result);

// Frontend - debugar estado
console.log('🎨 [State] Items:', items);
console.log('🎨 [API] Response:', response.data);

// IMPORTANTE: Remover logs antes de commit!
```

### Quando Algo Não Funciona

**ANTES** de criar novo código, **SEMPRE**:

1. ✅ Ler o erro COMPLETO no console
2. ✅ Verificar se backend está rodando (porta 3001)
3. ✅ Verificar se frontend está rodando (porta 3000)
4. ✅ Abrir DevTools (F12) e ver Network tab
5. ✅ Verificar se migration rodou com sucesso
6. ✅ Testar endpoint direto (Postman/Thunder Client)
7. ✅ Verificar se entity está registrada
8. ✅ Verificar se module está importado

**NÃO** assuma que algo está certo - **SEMPRE VERIFIQUE**!

---

## 🔄 Execução de Comandos e Gerenciamento de Processos

### ⚠️ PROBLEMA CRÍTICO: Matar Processos Acidentalmente

**NUNCA** execute comandos que matam processos em execução sem intenção!

#### ❌ ERROS COMUNS:

```bash
# 1. ❌ ERRADO - Executar comando de servidor em terminal já ocupado
# Isso MATA o processo anterior!
run_in_terminal("npm run start:dev")  # Mata o backend que já estava rodando!

# 2. ❌ ERRADO - Tentar múltiplas vezes até acertar
run_in_terminal("cd backend && npm start")      # Erro
run_in_terminal("cd backend && npm run dev")    # Erro
run_in_terminal("cd backend && npm run start:dev")  # Acerta, mas já tentou 3x!

# 3. ❌ ERRADO - Executar frontend e backend no mesmo terminal
run_in_terminal("cd backend && npm run start:dev")
run_in_terminal("cd frontend-web && npm start")  # MATA o backend!
```

### ✅ SOLUÇÕES CORRETAS:

#### 1. **SEMPRE Usar `isBackground: true` para Servidores**

```typescript
// ✅ CORRETO - Servidor backend (processo contínuo)
run_in_terminal({
  command: "cd backend && npm run start:dev",
  explanation: "Iniciando servidor backend na porta 3001",
  isBackground: true  // ⚡ OBRIGATÓRIO para servidores!
});

// ✅ CORRETO - Servidor frontend (processo contínuo)
run_in_terminal({
  command: "cd frontend-web && npm start",
  explanation: "Iniciando servidor frontend na porta 3000",
  isBackground: true  // ⚡ OBRIGATÓRIO para servidores!
});
```

#### 2. **Verificar ANTES de Executar**

```typescript
// ✅ CORRETO - Verificar se já está rodando primeiro
// 1. Verificar processos node
run_in_terminal({
  command: "Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize",
  explanation: "Verificando se há processos Node.js rodando",
  isBackground: false
});

// 2. SE não estiver rodando, ENTÃO iniciar
// 3. SE já estiver rodando, apenas informar ao usuário
```

#### 3. **Usar Tasks para Processos Recorrentes**

```typescript
// ✅ MELHOR AINDA - Usar tasks do VS Code
// Processos que rodam frequentemente devem usar tasks!

// Backend
run_task({
  id: "shell: Start Backend (Nest 3001)",
  workspaceFolder: "c:\\Projetos\\conectcrm"
});

// Frontend
run_task({
  id: "shell: Start Frontend (React 3000)", 
  workspaceFolder: "c:\\Projetos\\conectcrm"
});
```

### 📋 Regras de Execução de Comandos

#### Regra 1: Identifique o Tipo de Comando

| Tipo | isBackground | Exemplo |
|------|--------------|---------|
| **Servidor/Watch** | `true` | `npm run start:dev`, `npm start`, `npm run dev` |
| **Build** | `false` | `npm run build`, `npm run migration:generate` |
| **Test único** | `false` | `npm test`, `npm run migration:run` |
| **Consulta** | `false` | `git status`, `Get-Process`, `ls` |

#### Regra 2: Comando Correto por Contexto

```bash
# Backend (NestJS)
✅ npm run start:dev      # Desenvolvimento (watch mode)
✅ npm run build          # Compilar TypeScript
✅ npm run start:prod     # Produção
❌ npm start              # NÃO existe no backend!
❌ npm run dev            # NÃO existe no backend!

# Frontend (React)
✅ npm start              # Desenvolvimento
✅ npm run build          # Build para produção
❌ npm run start:dev      # NÃO existe no frontend!
❌ npm run dev            # NÃO existe no frontend!

# Migrations
✅ npm run migration:generate -- src/migrations/NomeMigration
✅ npm run migration:run
✅ npm run migration:revert
✅ npm run migration:show
```

#### Regra 3: Fluxo de Verificação → Execução

```typescript
// ✅ FLUXO CORRETO

// 1. VERIFICAR se já está rodando
const verificacao = await run_in_terminal({
  command: "Get-Process -Name node -ErrorAction SilentlyContinue",
  explanation: "Verificando processos Node.js",
  isBackground: false
});

// 2. ANALISAR resultado (se retornou processos)

// 3a. SE JÁ ESTÁ RODANDO:
//     → Informar ao usuário
//     → NÃO executar novamente

// 3b. SE NÃO ESTÁ RODANDO:
//     → Executar com isBackground: true
//     → Aguardar alguns segundos
//     → Verificar se iniciou com sucesso
```

### 🎯 Templates de Execução

#### Template 1: Iniciar Backend

```typescript
// 1. Verificar se já está rodando
const backendRodando = await run_in_terminal({
  command: "Get-Process -Name node | Where-Object { $_.MainWindowTitle -like '*backend*' }",
  explanation: "Verificando se backend já está rodando",
  isBackground: false
});

// 2. Se não estiver, iniciar
if (!backendRodando || backendRodando.includes("não encontrado")) {
  await run_in_terminal({
    command: "cd backend && npm run start:dev",
    explanation: "Iniciando servidor backend NestJS na porta 3001",
    isBackground: true  // ⚡ CRÍTICO!
  });
  
  // 3. Aguardar inicialização
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 4. Verificar se iniciou
  const verificacao = await run_in_terminal({
    command: "curl http://localhost:3001",
    explanation: "Verificando se backend respondeu",
    isBackground: false
  });
}
```

#### Template 2: Iniciar Frontend

```typescript
// 1. Verificar se já está rodando
const frontendRodando = await run_in_terminal({
  command: "netstat -ano | findstr :3000",
  explanation: "Verificando se porta 3000 está em uso",
  isBackground: false
});

// 2. Se não estiver, iniciar
if (!frontendRodando || frontendRodando.includes("não encontrado")) {
  await run_in_terminal({
    command: "cd frontend-web && npm start",
    explanation: "Iniciando servidor React na porta 3000",
    isBackground: true  // ⚡ CRÍTICO!
  });
}
```

#### Template 3: Executar Migration

```typescript
// ❌ NÃO usar isBackground para migrations!
await run_in_terminal({
  command: "cd backend && npm run migration:run",
  explanation: "Executando migrations pendentes no banco de dados",
  isBackground: false  // ⚡ Migration precisa completar!
});

// ✅ Aguardar resultado antes de prosseguir
```

### 🚨 Sinais de Que Você Está Fazendo Errado

**PARE** se você está fazendo isso:

- ❌ Executando `npm run start:dev` com `isBackground: false`
- ❌ Tentando múltiplos comandos até acertar (npm start, npm run dev, npm run start:dev)
- ❌ Não verificando se processo já está rodando antes
- ❌ Executando servidor no mesmo terminal de outro servidor
- ❌ Não usando tasks para processos recorrentes
- ❌ Assumindo que comando vai funcionar sem verificar package.json primeiro

### ✅ Faça ISSO Em Vez Disso

```typescript
// 1. LEIA package.json PRIMEIRO
const packageJson = await read_file({
  filePath: "backend/package.json",
  startLine: 5,
  endLine: 20  // Scripts geralmente estão aqui
});

// 2. IDENTIFIQUE o comando correto
// Backend: "start:dev": "nest start --watch"
// Frontend: "start": "react-scripts start"

// 3. VERIFIQUE se já está rodando
const processos = await run_in_terminal({
  command: "Get-Process -Name node",
  isBackground: false
});

// 4. SE não estiver, EXECUTE com isBackground: true
// 5. SE já estiver, INFORME ao usuário (não mate o processo!)
```

### 📊 Checklist de Execução de Comandos

Antes de executar QUALQUER comando de servidor:

- [ ] Li o package.json para saber o comando EXATO?
- [ ] Verifiquei se processo já está rodando?
- [ ] Usei `isBackground: true` para servidores?
- [ ] Esperei alguns segundos após iniciar?
- [ ] Verifiquei se o servidor respondeu?
- [ ] Informei ao usuário o que está acontecendo?
- [ ] Tenho certeza que não vou matar processo existente?

### 🎓 Exemplo Completo: Iniciar Backend e Frontend

```typescript
// ✅ EXEMPLO COMPLETO E CORRETO

async function iniciarAmbienteDesenvolvimento() {
  // 1. BACKEND
  console.log("🔍 Verificando backend...");
  
  // 1.1. Verificar package.json
  const backendPackage = await read_file({
    filePath: "backend/package.json",
    startLine: 1,
    endLine: 30
  });
  // Confirmar que tem "start:dev" nos scripts
  
  // 1.2. Verificar se já está rodando
  const backendProcesso = await run_in_terminal({
    command: "netstat -ano | findstr :3001",
    explanation: "Verificando se porta 3001 (backend) está em uso",
    isBackground: false
  });
  
  // 1.3. Iniciar se não estiver
  if (!backendProcesso || backendProcesso.length === 0) {
    await run_in_terminal({
      command: "cd backend && npm run start:dev",
      explanation: "Iniciando servidor backend NestJS na porta 3001",
      isBackground: true  // ⚡ OBRIGATÓRIO!
    });
    
    console.log("⏳ Aguardando backend inicializar (5 segundos)...");
    await sleep(5000);
    
    // 1.4. Verificar se iniciou
    const verificacao = await run_in_terminal({
      command: "curl http://localhost:3001",
      explanation: "Verificando se backend está respondendo",
      isBackground: false
    });
    
    console.log("✅ Backend iniciado!");
  } else {
    console.log("✅ Backend já está rodando na porta 3001");
  }
  
  // 2. FRONTEND
  console.log("🔍 Verificando frontend...");
  
  // 2.1. Verificar package.json
  const frontendPackage = await read_file({
    filePath: "frontend-web/package.json",
    startLine: 1,
    endLine: 30
  });
  // Confirmar que tem "start" nos scripts
  
  // 2.2. Verificar se já está rodando
  const frontendProcesso = await run_in_terminal({
    command: "netstat -ano | findstr :3000",
    explanation: "Verificando se porta 3000 (frontend) está em uso",
    isBackground: false
  });
  
  // 2.3. Iniciar se não estiver
  if (!frontendProcesso || frontendProcesso.length === 0) {
    await run_in_terminal({
      command: "cd frontend-web && npm start",
      explanation: "Iniciando servidor React na porta 3000",
      isBackground: true  // ⚡ OBRIGATÓRIO!
    });
    
    console.log("✅ Frontend iniciando... (aguarde browser abrir)");
  } else {
    console.log("✅ Frontend já está rodando na porta 3000");
  }
  
  console.log("\n🚀 Ambiente de desenvolvimento pronto!");
  console.log("   Backend:  http://localhost:3001");
  console.log("   Frontend: http://localhost:3000");
}
```

---

## 🎓 Fluxo de Desenvolvimento Profissional

### Metodologia para Qualidade de Produção

Ao desenvolver **qualquer funcionalidade** (frontend, backend ou integração), siga este fluxo:

#### 1️⃣ Planejamento da Funcionalidade

**ANTES de gerar código**, sempre faça:

```markdown
## 📋 Análise da Tarefa

### Objetivo
- Descrever claramente o que será desenvolvido
- Identificar o problema que está sendo resolvido

### Contexto
- Backend: Verificar entities, services, controllers existentes
- Frontend: Verificar páginas, services, componentes relacionados
- Banco de dados: Verificar se precisa de migration

### Dependências
- APIs que serão consumidas
- Módulos do NestJS (backend)
- Bibliotecas React (frontend)
- Variáveis de ambiente necessárias
- Serviços externos (WhatsApp, OpenAI, etc.)

### Estrutura Proposta
- Nomes de arquivos (seguir convenções do projeto)
- Funções/métodos principais
- Componentes React (se frontend)
- Endpoints HTTP (se backend)
- Fluxo de dados (entrada → processamento → saída)
```

**Exemplo Prático**:
```markdown
Tarefa: "Criar gestão de produtos"

✅ CORRETO - Planejamento primeiro:
1. Verificar se já existe: grep_search "produto"
2. Backend: Entity, DTO, Service, Controller
3. Frontend: Service, Page (copiar _TemplatePage.tsx)
4. Cor do módulo: Comercial (#159A9C)
5. Dependências: TypeORM, class-validator, axios

❌ ERRADO - Começar direto:
"Vou criar a entity Produto..." (sem verificar antes)
```

#### 2️⃣ Desenvolvimento

**Escreva código de qualidade produção:**

```typescript
// ✅ Código Limpo e Modular

// Backend - Service bem estruturado
@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Busca todos os produtos ativos
   * @returns Lista de produtos
   * @throws NotFoundException se nenhum produto encontrado
   */
  async listarAtivos(): Promise<Produto[]> {
    try {
      const produtos = await this.produtoRepository.find({
        where: { ativo: true },
        order: { nome: 'ASC' },
      });
      
      if (produtos.length === 0) {
        throw new NotFoundException('Nenhum produto ativo encontrado');
      }
      
      return produtos;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao buscar produtos',
        error.message,
      );
    }
  }
}

// Frontend - Componente bem estruturado
const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await produtoService.listar();
      setProdutos(dados);
    } catch (err: unknown) {
      console.error('Erro ao carregar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  // ... resto do componente
};
```

**Boas Práticas Obrigatórias**:

- ✅ **Backend**:
  - Validação com `class-validator` em todos os DTOs
  - Try-catch em todos os métodos de service
  - Retornar status HTTP corretos (200, 201, 400, 404, 500)
  - Logs para debugging (`console.log` em dev, logger em prod)
  - Documentação com JSDoc

- ✅ **Frontend**:
  - Estados: loading, error, empty, success
  - Responsividade: mobile-first (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
  - Acessibilidade: labels, aria-labels, titles
  - Error boundaries para erros não tratados
  - Seguir DESIGN_GUIDELINES.md

- ✅ **Segurança**:
  - Nunca expor credenciais no código
  - Validar entrada do usuário (backend E frontend)
  - Sanitizar dados antes de usar em queries
  - Usar JWT para autenticação
  - HTTPS em produção

#### 3️⃣ Testes

**SEMPRE gerar testes** para código novo:

```typescript
// Backend - Teste de Service
describe('ProdutoService', () => {
  let service: ProdutoService;
  let repository: Repository<Produto>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProdutoService,
        {
          provide: getRepositoryToken(Produto),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProdutoService>(ProdutoService);
    repository = module.get<Repository<Produto>>(getRepositoryToken(Produto));
  });

  describe('listarAtivos', () => {
    it('deve retornar lista de produtos ativos', async () => {
      const mockProdutos = [
        { id: '1', nome: 'Produto A', ativo: true },
        { id: '2', nome: 'Produto B', ativo: true },
      ];
      
      jest.spyOn(repository, 'find').mockResolvedValue(mockProdutos as any);
      
      const result = await service.listarAtivos();
      
      expect(result).toEqual(mockProdutos);
      expect(repository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        order: { nome: 'ASC' },
      });
    });

    it('deve lançar NotFoundException quando não há produtos', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);
      
      await expect(service.listarAtivos()).rejects.toThrow(NotFoundException);
    });
  });
});

// Frontend - Teste de Componente
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProdutosPage from './ProdutosPage';
import * as produtoService from '../services/produtoService';

jest.mock('../services/produtoService');

describe('ProdutosPage', () => {
  it('deve exibir loading inicialmente', () => {
    render(<ProdutosPage />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('deve exibir produtos após carregamento', async () => {
    const mockProdutos = [
      { id: '1', nome: 'Produto A', ativo: true },
    ];
    
    (produtoService.listar as jest.Mock).mockResolvedValue(mockProdutos);
    
    render(<ProdutosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Produto A')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando falhar', async () => {
    (produtoService.listar as jest.Mock).mockRejectedValue(
      new Error('Erro de rede')
    );
    
    render(<ProdutosPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/erro/i)).toBeInTheDocument();
    });
  });
});
```

**Cenários de Teste Obrigatórios**:
- ✅ Caso de sucesso (happy path)
- ✅ Dados vazios/nulos
- ✅ Erros de rede
- ✅ Validação de entrada inválida
- ✅ Permissões negadas (se aplicável)

#### 4️⃣ Validação Manual

**Após criar código, SEMPRE descrever como testar:**

```markdown
## 🧪 Como Testar Manualmente

### Backend
1. Iniciar servidor: `cd backend && npm run start:dev`
2. Abrir Postman/Thunder Client
3. Testar endpoints:
   - GET http://localhost:3001/produtos
     Espera: 200 OK com array de produtos
   - POST http://localhost:3001/produtos
     Body: { "nome": "Teste", "ativo": true }
     Espera: 201 Created com produto criado
   - GET http://localhost:3001/produtos/id-invalido
     Espera: 404 Not Found

### Frontend
1. Iniciar app: `cd frontend-web && npm start`
2. Navegar: http://localhost:3000/produtos
3. Verificar:
   - [ ] Loading aparece inicialmente
   - [ ] Lista de produtos carrega
   - [ ] Clicar em "Novo Produto" abre modal
   - [ ] Preencher formulário e salvar funciona
   - [ ] Editar produto funciona
   - [ ] Deletar produto funciona
   - [ ] Estados vazios aparecem quando não há dados
   - [ ] Mensagens de erro aparecem em caso de falha
4. Testar responsividade:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1920px)
5. Verificar console (F12):
   - [ ] Sem erros no console
   - [ ] Network tab: status 200/201 nas requisições
```

#### 5️⃣ Revisão Final

**Antes de concluir, SEMPRE revisar:**

```markdown
## 🔍 Checklist de Qualidade

### Código
- [ ] Sem código duplicado
- [ ] Funções pequenas e focadas (princípio SRP)
- [ ] Nomes descritivos (variáveis, funções, componentes)
- [ ] Comentários onde necessário (lógica complexa)
- [ ] Sem console.log esquecidos (remover antes de commit)
- [ ] Imports organizados e sem não usados

### Performance
- [ ] Queries otimizadas (sem N+1)
- [ ] useEffect com dependências corretas (frontend)
- [ ] Debounce em buscas (se aplicável)
- [ ] Lazy loading de componentes pesados (se aplicável)
- [ ] Imagens otimizadas (se aplicável)

### Segurança
- [ ] Validação de entrada (backend E frontend)
- [ ] Sanitização de dados
- [ ] Autenticação verificada
- [ ] Sem credenciais no código
- [ ] CORS configurado corretamente

### Boas Práticas
- [ ] Seguir convenções do projeto (nomenclatura)
- [ ] Seguir design system (cores, componentes)
- [ ] TypeScript types corretos (sem any)
- [ ] Error handling completo
- [ ] Testes escritos e passando

### Acessibilidade (Frontend)
- [ ] Labels em inputs
- [ ] Aria-labels em ícones/botões
- [ ] Navegação por teclado funciona
- [ ] Contraste de cores adequado (WCAG 2.1)
- [ ] Foco visível em elementos interativos
```

**Sugestões de Melhoria Automáticas**:

```typescript
// ❌ ANTES - Código com problemas
const handleSave = () => {
  api.post('/produtos', data).then(res => {
    setItems([...items, res.data]);
  });
};

// ✅ DEPOIS - Código melhorado
const handleSave = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const novoProduto = await produtoService.criar(data);
    
    setItems(prev => [...prev, novoProduto]);
    toast.success('Produto criado com sucesso!');
    setShowDialog(false);
  } catch (err: unknown) {
    console.error('Erro ao criar produto:', err);
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'Erro ao criar produto';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

### 🎯 Objetivo Final

**Gerar código que possa ir direto para produção com MÍNIMO de retrabalho.**

- ✅ Planejado e contextualizado
- ✅ Limpo e modular
- ✅ Testado (unitário + manual)
- ✅ Documentado
- ✅ Revisado para qualidade profissional

**Qualidade > Velocidade** - Fazer certo da primeira vez economiza tempo depois!

---

## 🔐 Segurança e Variáveis de Ambiente

### Variáveis de Ambiente (.env)

**NUNCA** commite credenciais no código! Use variáveis de ambiente:

#### Backend (.env)
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sua_senha_aqui
DATABASE_NAME=conectcrm

# JWT
JWT_SECRET=chave_secreta_muito_forte_aqui
JWT_EXPIRATION=7d

# APIs Externas
WHATSAPP_API_KEY=sua_chave_aqui
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### ❌ NUNCA Faça Isso:
```typescript
// 🚫 ERRADO - credenciais hardcoded
const apiKey = 'sk-1234567890abcdef';
const password = 'minhasenha123';
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### ✅ SEMPRE Faça Isso:
```typescript
// ✅ CORRETO - usar variáveis de ambiente

// Backend (NestJS)
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}
  
  async conectar() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const dbPassword = this.configService.get<string>('DATABASE_PASSWORD');
  }
}

// Frontend (React)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
```

### Arquivos .env no .gitignore

```gitignore
# SEMPRE adicionar no .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Template .env.example

**SEMPRE** crie arquivo `.env.example` com valores fictícios:

```bash
# .env.example - Commitar este arquivo
DATABASE_HOST=localhost
DATABASE_PASSWORD=sua_senha_aqui  # ← Não colocar senha real
OPENAI_API_KEY=sk-your-key-here   # ← Não colocar chave real
JWT_SECRET=your-secret-here       # ← Não colocar secret real
```

---

## 📝 Git e Commits

### Mensagens de Commit Padronizadas

Use **Conventional Commits**:

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Tipos
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (sem mudança de código)
refactor: # Refatoração (sem nova feature ou fix)
test:     # Adicionar/modificar testes
chore:    # Tarefas de build, configs, etc.
perf:     # Melhoria de performance
```

### Exemplos:
```bash
# Nova feature
git commit -m "feat(atendimento): adicionar gestão de equipes"
git commit -m "feat(comercial): criar página de cotações"

# Bug fix
git commit -m "fix(chat): corrigir scroll automático de mensagens"
git commit -m "fix(auth): resolver erro de login com JWT expirado"

# Documentação
git commit -m "docs: adicionar instruções do Copilot"
git commit -m "docs(readme): atualizar guia de instalação"

# Refatoração
git commit -m "refactor(equipes): extrair lógica para service"
git commit -m "refactor: renomear componentes para padrão PascalCase"

# Testes
git commit -m "test(produtos): adicionar testes unitários do service"

# Performance
git commit -m "perf(database): otimizar query de atendentes disponíveis"
```

### O Que NÃO Commitar

```bash
# ❌ NUNCA commitar:
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
Thumbs.db
*.swp
*.swo
temp-*.ts
test-*.js
debug-*.tsx
exemplo-*.md
```

### Antes de Commitar

**SEMPRE** verifique:

```powershell
# 1. Ver o que mudou
git status
git diff

# 2. Verificar se não tem arquivos sensíveis
git status | Select-String ".env|node_modules|dist|*.log"

# 3. Adicionar apenas arquivos específicos (não use git add .)
git add backend/src/modules/triagem/entities/equipe.entity.ts
git add frontend-web/src/pages/GestaoEquipesPage.tsx

# 4. Commitar com mensagem descritiva
git commit -m "feat(atendimento): adicionar gestão de equipes"

# 5. Push
git push origin nome-da-branch
```

---

## ⚡ Performance e Otimização

### Backend (NestJS)

#### 1. Queries Otimizadas (TypeORM)

```typescript
// ❌ PROBLEMA: N+1 Query
async listarEquipes() {
  const equipes = await this.equipeRepository.find();
  // Para cada equipe, faz nova query = N+1
  for (const equipe of equipes) {
    equipe.membros = await this.membroRepository.find({ 
      where: { equipeId: equipe.id } 
    });
  }
  return equipes;
}

// ✅ SOLUÇÃO: Eager Loading com Relations
async listarEquipes() {
  return await this.equipeRepository.find({
    relations: ['membros', 'atribuicoes'],  // 1 query só!
    order: { nome: 'ASC' },
  });
}

// ✅ MELHOR AINDA: Query Builder para mais controle
async listarEquipes() {
  return await this.equipeRepository
    .createQueryBuilder('equipe')
    .leftJoinAndSelect('equipe.membros', 'membros')
    .leftJoinAndSelect('equipe.atribuicoes', 'atribuicoes')
    .where('equipe.ativo = :ativo', { ativo: true })
    .orderBy('equipe.nome', 'ASC')
    .getMany();
}
```

#### 2. Paginação

```typescript
// ❌ RUIM: Retornar tudo
async listar() {
  return await this.repository.find();  // Pode retornar 10k registros!
}

// ✅ BOM: Paginação
async listar(page: number = 1, limit: number = 20) {
  const [items, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  
  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

#### 3. Caching

```typescript
// Backend - Cachear dados que mudam pouco
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ConfigService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  
  async getConfig() {
    const cacheKey = 'system_config';
    
    // Tentar pegar do cache
    let config = await this.cacheManager.get(cacheKey);
    
    if (!config) {
      // Se não está no cache, buscar do banco
      config = await this.configRepository.findOne();
      // Cachear por 1 hora
      await this.cacheManager.set(cacheKey, config, 3600);
    }
    
    return config;
  }
}
```

### Frontend (React)

#### 1. useMemo e useCallback

```typescript
// ❌ RUIM: Recalcula toda vez que renderiza
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('');
  
  // ⚠️ Recalcula em TODA renderização
  const produtosFiltrados = produtos.filter(p => 
    p.nome.includes(filtro)
  );
  
  // ⚠️ Nova função criada em TODA renderização
  const handleSearch = (e) => {
    setFiltro(e.target.value);
  };
};

// ✅ BOM: Memoização
const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('');
  
  // ✅ Só recalcula se produtos ou filtro mudarem
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [produtos, filtro]);
  
  // ✅ Função estável, não recria em toda renderização
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(e.target.value);
  }, []);
};
```

#### 2. Debounce em Buscas

```typescript
// ❌ RUIM: Faz requisição a cada tecla
const handleSearch = (e) => {
  const query = e.target.value;
  api.get(`/produtos?search=${query}`);  // Chamada em TODA tecla!
};

// ✅ BOM: Debounce (espera 500ms após última tecla)
import { useState, useEffect } from 'react';

const ProdutosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState([]);
  
  useEffect(() => {
    // Debounce: só busca 500ms após parar de digitar
    const timer = setTimeout(async () => {
      if (searchTerm) {
        const response = await api.get(`/produtos?search=${searchTerm}`);
        setProdutos(response.data);
      }
    }, 500);
    
    return () => clearTimeout(timer);  // Limpa timer anterior
  }, [searchTerm]);
  
  return (
    <input 
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
};
```

#### 3. Lazy Loading de Componentes

```typescript
// ❌ RUIM: Importa tudo no bundle inicial
import GestaoEquipesPage from './pages/GestaoEquipesPage';
import CotacaoPage from './pages/CotacaoPage';
import ProdutosPage from './pages/ProdutosPage';

// ✅ BOM: Lazy load (só carrega quando usar)
import { lazy, Suspense } from 'react';

const GestaoEquipesPage = lazy(() => import('./pages/GestaoEquipesPage'));
const CotacaoPage = lazy(() => import('./pages/CotacaoPage'));
const ProdutosPage = lazy(() => import('./pages/ProdutosPage'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Routes>
        <Route path="/gestao/equipes" element={<GestaoEquipesPage />} />
        <Route path="/comercial/cotacoes" element={<CotacaoPage />} />
      </Routes>
    </Suspense>
  );
}
```

#### 4. Otimizar Listas Grandes

```typescript
// Para listas muito grandes (1000+ items), use virtualização
import { FixedSizeList } from 'react-window';

const ListaGrande = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].nome}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## 🌍 Internacionalização e Localização

### Datas e Horários

```typescript
// ❌ RUIM: Formato hardcoded
const data = '2025-10-18';  // Ambíguo

// ✅ BOM: Usar biblioteca de datas
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const dataFormatada = format(new Date(), "dd 'de' MMMM 'de' yyyy", { 
  locale: ptBR 
});
// "18 de outubro de 2025"

const horaFormatada = format(new Date(), 'HH:mm:ss');
// "14:30:45"
```

### Moeda

```typescript
// ❌ RUIM: Concatenação manual
const preco = 'R$ ' + valor.toFixed(2);

// ✅ BOM: Intl.NumberFormat
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

formatarMoeda(1234.56);  // "R$ 1.234,56"
```

---

## 📊 Logging e Monitoramento

### Backend - Logs Estruturados

```typescript
// ❌ RUIM: console.log sem contexto
console.log('Erro');
console.log(data);

// ✅ BOM: Logs estruturados com contexto
import { Logger } from '@nestjs/common';

@Injectable()
export class EquipeService {
  private readonly logger = new Logger(EquipeService.name);
  
  async criar(dto: CreateEquipeDto) {
    this.logger.log(`Criando equipe: ${dto.nome}`);
    
    try {
      const equipe = await this.repository.save(dto);
      this.logger.log(`Equipe criada com sucesso: ${equipe.id}`);
      return equipe;
    } catch (error) {
      this.logger.error(
        `Erro ao criar equipe: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

### Frontend - Error Boundary

```typescript
// Capturar erros não tratados
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado:', error, errorInfo);
    // Enviar para serviço de monitoramento (Sentry, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Algo deu errado.</h1>;
    }
    
    return this.props.children;
  }
}

// Usar no App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

**Última atualização**: Outubro 2025  
**Mantenedores**: Equipe ConectCRM
