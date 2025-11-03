# 🤖 Guia Rápido para Agentes de IA - ConectCRM

> **Propósito**: Checklist rápido para não perder contexto durante desenvolvimento

---

## 🎯 ANTES de Qualquer Tarefa

### ✅ Checklist de Contexto (OBRIGATÓRIO)

```markdown
[ ] 1. Li arquivos .md relacionados? (CONSOLIDACAO_*, CONCLUSAO_*, README_*)
[ ] 2. Procurei se a feature já existe? (grep_search, file_search)
[ ] 3. Li o arquivo COMPLETO antes de editar?
[ ] 4. Verifiquei estado atual: backend rodando? frontend rodando? migration ok?
[ ] 5. Confirmei se não vou duplicar trabalho já feito?
```

---

## 🚀 Criar Nova Feature Full-Stack

### Ordem EXATA de Execução:

#### 1️⃣ BACKEND (Sempre primeiro!)
```
1. Entity      → backend/src/modules/*/entities/*.entity.ts
2. DTO         → backend/src/modules/*/dto/*.dto.ts
3. Service     → backend/src/modules/*/services/*.service.ts
4. Controller  → backend/src/modules/*/controllers/*.controller.ts
5. Module      → Registrar providers + controllers
6. Database    → Adicionar entity em database.config.ts
7. Migration   → npm run migration:generate && npm run migration:run
8. TESTE       → Postman/Thunder Client (não pule isso!)
```

#### 2️⃣ FRONTEND (Só depois do backend!)
```
1. Service     → frontend-web/src/services/*Service.ts
2. Interfaces  → Espelhar DTOs do backend no service
3. Página      → cp _TemplatePage.tsx → NovaPaginaPage.tsx
4. Customizar  → Buscar todos [PERSONALIZAR] e substituir
5. Rotas       → Registrar em App.tsx
6. Menu        → Adicionar em menuConfig.ts
7. TESTE       → Abrir browser e testar CRUD completo
```

#### 3️⃣ VALIDAÇÃO (Sempre validar!)
```
1. End-to-end  → Criar, listar, editar, deletar via UI
2. Estados     → Testar loading, error, empty, success
3. Responsive  → Mobile, tablet, desktop
4. Console     → F12 → Sem erros
5. Documentar  → Criar CONSOLIDACAO_*.md
```

---

## 🎨 Criar Nova Tela (Frontend)

### Comando Único:
```powershell
cp frontend-web/src/pages/_TemplatePage.tsx frontend-web/src/pages/MinhaPage.tsx
```

### Então:
```
1. Buscar TODOS os [PERSONALIZAR]
2. Escolher cor do módulo:
   - Comercial: #159A9C
   - Atendimento: #9333EA
   - Financeiro: #16A34A
   - Gestão: #2563EB
3. Conectar com service do backend
4. Ajustar dashboard cards
5. Remover comentários de instrução
6. Registrar rota + menu
```

### ❌ NÃO FAÇA:
- Criar página do zero
- Usar cores diferentes
- Usar shadcn/ui (Button, Card, Dialog)
- Esquecer BackToNucleus

---

## 🔗 Conectar Backend ↔ Frontend

### Regra de Ouro:
**Frontend service ESPELHA o backend controller!**

```typescript
// 1. LER o controller backend PRIMEIRO
@Controller('equipes')
export class EquipeController {
  @Post()  // ← POST /equipes
  @Get()   // ← GET /equipes
  @Get(':id') // ← GET /equipes/:id
}

// 2. ESPELHAR no service frontend
export const equipeService = {
  criar: (data) => api.post('/equipes', data),      // ✅
  listar: () => api.get('/equipes'),                // ✅
  buscar: (id) => api.get(`/equipes/${id}`),        // ✅
};

// ❌ ERRADO - não inventar rotas
criar: (data) => api.post('/api/equipe/create', data) // 🚫
```

---

## 📛 Nomenclatura Consistente

| Contexto | Singular/Plural | Exemplo |
|----------|----------------|---------|
| Entity class | Singular | `class Equipe` |
| Arquivo entity | Singular | `equipe.entity.ts` |
| Service class | Singular | `class EquipeService` |
| Controller rota | **PLURAL** | `@Post('/equipes')` |
| Frontend service | Singular | `equipeService.ts` |
| Frontend interface | Singular | `interface Equipe` |
| Página React | Descritivo | `GestaoEquipesPage.tsx` |

### ⚠️ CRÍTICO:
**Nome da entidade = MESMO em todo o sistema!**

```
✅ Backend: class Equipe → Frontend: interface Equipe
❌ Backend: class Team  → Frontend: interface Equipe (NÃO!)
```

---

## 🚨 Troubleshooting Rápido

### EntityMetadataNotFoundError
```
→ Adicionar entity em backend/src/config/database.config.ts
```

### Rota 404
```
→ Verificar: Controller registrado no Module?
→ Verificar: Module importado em app.module.ts?
```

### CORS Error
```
→ Backend rodando na porta 3001?
→ main.ts tem app.enableCors({ origin: 'http://localhost:3000' })?
```

### Migration já existe
```
→ npm run migration:show
→ npm run migration:revert (se necessário)
```

### TypeScript type error
```
→ Interfaces backend e frontend são IGUAIS?
→ npm run build (ver erros completos)
```

---

## 💬 Template de Resposta ao Usuário

Use esta estrutura em TODA resposta:

```markdown
## 🔍 Checagem de Contexto

- [x] Li: [arquivos.md relevantes]
- [x] Verifiquei: [código existente]
- [x] Estado: Backend [ok/não ok] | Frontend [ok/não ok]

## 📊 O Que Já Existe

- Backend: [entity? controller? migration?]
- Frontend: [service? página? rota?]

## 🎯 Vou Fazer Agora

1. [Etapa 1 - arquivo específico]
2. [Etapa 2 - validação]
3. [Etapa 3 - teste]

## 🚀 Executando...

[tool calls aqui]

## ✅ Resultado

[O que foi criado/modificado + como testar]
```

---

## 📋 Sinais de que Você Perdeu Contexto

### 🚨 PARE se você está fazendo isso:

- [ ] Criando rota que já existe
- [ ] Modificando arquivo sem ler primeiro
- [ ] Dizendo "agora vou criar X" quando X já foi criado
- [ ] Criando frontend service sem ler backend controller
- [ ] Pulando etapas (página sem service, por exemplo)
- [ ] Não mencionando arquivos criados anteriormente
- [ ] Assumindo que algo está certo sem verificar

### ✅ Faça ISSO em vez disso:

```markdown
"Deixe-me verificar o estado atual antes de prosseguir..."
→ grep_search "nome-da-feature"
→ read_file backend/.../controller.ts
→ "Vejo que já temos o controller com POST /equipes. 
    Agora vou criar o service frontend que conecta com essa rota."
```

---

## 🔄 Persistir Progresso

### Ao completar feature grande, CRIAR:

```markdown
# CONSOLIDACAO_NOME_FEATURE.md

## ✅ Concluído
- Backend: Entity, DTO, Service, Controller, Migration
- Frontend: Service, Página, Rota, Menu
- Testes: ✅ Postman + ✅ UI

## 📂 Arquivos
- backend/src/.../equipe.entity.ts
- frontend-web/src/services/equipeService.ts
- frontend-web/src/pages/GestaoEquipesPage.tsx

## 🔗 Integrações
POST /equipes → equipeService.criar()
GET /equipes → equipeService.listar()

## 🧪 Como Testar
1. Backend: npm run start:dev
2. Frontend: npm start
3. Abrir: http://localhost:3000/gestao/equipes
```

---

## 📚 Referências Sempre Atualizadas

### Design System
- **Instruções completas**: `.github/copilot-instructions.md`
- **Design guidelines**: `frontend-web/DESIGN_GUIDELINES.md`
- **Template página**: `frontend-web/src/pages/_TemplatePage.tsx`

### Exemplos Práticos
- **Comercial**: `frontend-web/src/pages/CotacaoPage.tsx`
- **Atendimento**: `frontend-web/src/pages/GestaoEquipesPage.tsx`

### Backend
- **Database config**: `backend/src/config/database.config.ts`
- **Exemplo entity**: `backend/src/modules/triagem/entities/equipe.entity.ts`
- **Exemplo controller**: `backend/src/modules/triagem/controllers/equipe.controller.ts`

---

## 🎯 Regra de Ouro

> **"Sempre verifique o que JÁ EXISTE antes de criar algo novo!"**

```bash
# ANTES de criar QUALQUER arquivo:
grep_search "nome-relacionado"
file_search "**/*Nome*"
read_file arquivo-relacionado.ts

# DEPOIS de criar:
read_file arquivo-criado.ts  # Confirmar que está correto
```

---

**Última atualização**: Outubro 2025  
**Este arquivo É LIDO pelo GitHub Copilot automaticamente**
