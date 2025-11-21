# 🔍 AUDITORIA - Gestão de Usuários do Sistema

## 📅 Data: 03 de Novembro de 2025

---

## 🎯 PROBLEMA IDENTIFICADO

**Duplicação e confusão** na gestão de usuários do sistema:
- ✅ Existe módulo **Users** (backend completo)
- ✅ Existe módulo **Atendentes** (subset de users para atendimento)
- ❌ **NÃO existe tela unificada** para gestão de usuários
- ❌ Confusão entre "usuários do sistema" e "atendentes"

---

## 📊 SITUAÇÃO ATUAL

### Backend

#### 1️⃣ Módulo `users` (Completo)

**Localização:** `backend/src/modules/users/`

**Entidade Principal:**
```typescript
@Entity('users')
export class User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  role: 'admin' | 'manager' | 'vendedor' | 'user';
  permissoes?: string[];
  empresa_id: string;
  avatar_url?: string;
  idioma_preferido: string;
  configuracoes?: { tema, notificacoes };
  ativo: boolean;
  ultimo_login?: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Controller Endpoints:**
```
GET    /users              → Listar usuários (com filtros)
GET    /users/profile      → Perfil do usuário logado
PUT    /users/profile      → Atualizar perfil
GET    /users/team         → Listar equipe da empresa
GET    /users/estatisticas → Dashboard stats
POST   /users              → Criar usuário
PUT    /users/:id          → Atualizar usuário
DELETE /users/:id          → Excluir usuário
PUT    /users/:id/reset-senha → Resetar senha
POST   /users/ativar-massa → Ativar múltiplos
POST   /users/desativar-massa → Desativar múltiplos
```

**Funcionalidades:**
- ✅ CRUD completo
- ✅ Autenticação e autorização
- ✅ Gestão de roles (admin, manager, vendedor, user)
- ✅ Gestão de permissões
- ✅ Filtros avançados (busca, role, ativo, ordenação, paginação)
- ✅ Estatísticas (total, ativos, por role)
- ✅ Operações em massa
- ✅ Reset de senha
- ✅ Multi-tenant (empresa_id)
- ✅ UserActivity (log de atividades)

---

#### 2️⃣ Módulo `atendimento/atendentes` (Subset)

**Localização:** `backend/src/modules/atendimento/entities/atendente.entity.ts`

**Entidade:**
```typescript
@Entity('atendentes')
export class Atendente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  senha: string;  // ← Hash bcrypt
  status: 'online' | 'ocupado' | 'ausente' | 'offline';
  ativo: boolean;
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}
```

**Purpose:**
- ❓ **Duplicação da entidade User?**
- ❓ **Por que existe uma tabela separada?**
- ✅ **Usado apenas para atendimento WhatsApp**
- ❌ **NÃO integrado com User**

**Endpoints:**
```
GET    /atendimento/atendentes    → Listar atendentes
POST   /atendimento/atendentes    → Criar atendente
PUT    /atendimento/atendentes/:id → Atualizar
DELETE /atendimento/atendentes/:id → Deletar
```

---

### Frontend

#### ❌ Não existe tela unificada de Usuários

**O que existe:**

1. **`GestaoAtendentesPage.tsx`** (717 linhas)
   - Gestão de atendentes (tabela `atendentes`)
   - CRUD completo
   - Status online/offline
   - Senha temporária
   - **NÃO integrado com Users**

2. **`usuariosService.ts`** (já existe)
   - Service para API `/users`
   - Funções: listar, criar, atualizar, excluir, ativar/desativar
   - **MAS NÃO TEM TELA CORRESPONDENTE!**

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Duplicação de Conceitos

**Problema:**
- `User` (tabela `users`) → Usuários do sistema completo
- `Atendente` (tabela `atendentes`) → Subset para atendimento

**Confusão:**
- ❓ Atendente é um tipo de User?
- ❓ São entidades separadas?
- ❓ Um User pode ser Atendente?

---

### 2. Falta de Tela Principal de Usuários

**O que falta:**
- ❌ Tela de gestão de **usuários do sistema** (`/gestao/usuarios`)
- ❌ Dashboard de usuários
- ❌ Filtros por role (admin, manager, vendedor, user)
- ❌ Gestão de permissões
- ❌ Visualização de atividades

**O que existe:**
- ✅ Backend completo (`UsersController` + `UsersService`)
- ✅ Service frontend (`usuariosService.ts`)
- ❌ **Falta APENAS a tela (UI)**

---

### 3. Inconsistência com CRMs Líderes

**CRMs de referência (Salesforce, HubSpot, Pipedrive):**

✅ **Tela de Usuários** com:
- Lista de todos os usuários da empresa
- Roles claros (Admin, Manager, User)
- Permissões granulares por módulo
- Status (ativo/inativo)
- Último login
- Filtros e busca
- Ações em massa
- Invite por email

✅ **Seção de Atendentes** (subset):
- Filtro especial na tela de usuários
- Ou aba "Atendentes" dentro de usuários
- **NÃO é módulo separado**

---

## 💡 SOLUÇÃO PROPOSTA

### Arquitetura Correta

```
┌─────────────────────────────────────────────────────────────┐
│                     USUÁRIOS (Principal)                     │
│                                                              │
│  Tabela: users                                              │
│  Roles: admin, manager, vendedor, user                      │
│  Permissões: gestão granular por módulo                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ATENDENTES (Subset)                      │  │
│  │                                                        │  │
│  │  Usuários com permissão de atendimento                │  │
│  │  Campo adicional: status_atendente                    │  │
│  │  (online, ocupado, ausente, offline)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Mudanças Necessárias

#### 1️⃣ Backend (Refatoração)

**OPÇÃO A: Deprecar tabela `atendentes`** (Recomendado)

- ❌ Remover entidade `Atendente`
- ✅ Adicionar campo `status_atendente` em `User`
- ✅ Adicionar permissão `ATENDIMENTO` em `User.permissoes`
- ✅ Migração para mover dados de `atendentes` → `users`

**OPÇÃO B: Manter tabela `atendentes` (Relação)**

- ✅ Criar relação OneToOne entre `User` e `Atendente`
- ✅ `Atendente.user_id` → FK para `User.id`
- ⚠️ Mais complexo, mas mantém separação

---

#### 2️⃣ Frontend (Nova Tela)

**Criar:** `frontend-web/src/pages/GestaoUsuariosPage.tsx`

**Features:**

✅ **Dashboard Cards (4)**
- Total de usuários
- Ativos
- Por role (admin, manager, vendedor, user)
- Online hoje

✅ **Filtros Avançados**
- Busca (nome, email)
- Role (dropdown)
- Status (ativo/inativo)
- Último login (range de datas)
- Ordenação (nome, email, data de criação)

✅ **Tabela de Usuários**
- Avatar
- Nome
- Email
- Role (badge colorido)
- Status (ativo/inativo)
- Último login
- Ações (editar, desativar, resetar senha)

✅ **Modal de Criação/Edição**
- Nome*
- Email*
- Telefone
- Role* (dropdown)
- Permissões (checkboxes por módulo)
  - [ ] Comercial
  - [ ] Atendimento
  - [ ] Financeiro
  - [ ] Gestão
- Avatar (upload opcional)
- Senha (somente criação)
- Ativo (toggle)

✅ **Ações em Massa**
- Selecionar múltiplos
- Ativar/desativar em massa
- Resetar senhas
- Deletar (confirmação)

✅ **Aba "Atendentes"** (opcional)
- Filtro para usuários com permissão ATENDIMENTO
- Status online/offline
- Gestão de disponibilidade

---

## 📋 PLANO DE AÇÃO

### Fase 1: Backend (2h)

**Decisão:** Qual opção seguir?
- [ ] Opção A: Deprecar `atendentes` (mais limpo)
- [ ] Opção B: Relação User-Atendente (mais complexo)

**Tarefas (Opção A - Recomendada):**

1. ✅ Adicionar campo `status_atendente` em `User` entity
   ```typescript
   @Column({
     type: 'enum',
     enum: StatusAtendente,
     nullable: true,
   })
   status_atendente?: StatusAtendente;
   ```

2. ✅ Criar migration para:
   - Adicionar coluna `status_atendente` em `users`
   - Migrar dados de `atendentes` → `users` (matching por email)
   - Adicionar permissão 'ATENDIMENTO' aos migrados
   - **NÃO deletar tabela `atendentes`** ainda (manter backup)

3. ✅ Adicionar endpoint em `UsersController`:
   ```typescript
   @Get('atendentes')
   async listarAtendentes(@CurrentUser() user: User) {
     // Retornar users com permissão ATENDIMENTO
   }
   ```

4. ✅ Atualizar `UsersService`:
   ```typescript
   async listarAtendentes(empresa_id: string) {
     return this.userRepository.find({
       where: {
         empresa_id,
         permissoes: Like('%ATENDIMENTO%'),
         ativo: true,
       },
     });
   }
   ```

---

### Fase 2: Frontend (4h)

**Criar página completa:**

1. ✅ Copiar `_TemplateWithKPIsPage.tsx`
   ```powershell
   cp frontend-web/src/pages/_TemplateWithKPIsPage.tsx frontend-web/src/pages/GestaoUsuariosPage.tsx
   ```

2. ✅ Implementar features:
   - Dashboard com 4 KPIs
   - Filtros avançados
   - Tabela responsiva
   - Modal CRUD
   - Gestão de permissões
   - Ações em massa

3. ✅ Registrar rota em `App.tsx`:
   ```typescript
   <Route path="/gestao/usuarios" element={<GestaoUsuariosPage />} />
   ```

4. ✅ Adicionar no `menuConfig.ts`:
   ```typescript
   {
     title: 'Usuários',
     path: '/gestao/usuarios',
     icon: Users,
   }
   ```

---

### Fase 3: Refatoração (2h)

**Atualizar módulos que usam `atendentes`:**

1. ✅ `AtendimentoDashboard.tsx`
   - Trocar `atendenteService` por `usuariosService.listarAtendentes()`

2. ✅ `GestaoEquipesPage.tsx`
   - Atualizar para buscar atendentes de `users`

3. ✅ `TriagemPage.tsx`
   - Atualizar atribuições para usar `users`

4. ✅ Deprecar `GestaoAtendentesPage.tsx`
   - Redirecionar para `/gestao/usuarios?aba=atendentes`
   - Ou remover completamente

---

## 🎯 RESULTADO ESPERADO

### Tela Unificada de Usuários

```
┌─────────────────────────────────────────────────────────────────┐
│  ⬅️ Voltar para Gestão    🔄 Atualizar    ➕ Novo Usuário      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Gestão de Usuários                                          │
│                                                                  │
│  ┌───────────┬───────────┬───────────┬───────────┐             │
│  │   Total   │  Ativos   │  Admins   │  Online   │             │
│  │    42     │    38     │     5     │    12     │             │
│  └───────────┴───────────┴───────────┴───────────┘             │
│                                                                  │
│  🔍 Buscar usuário...    📋 Role: [Todos ▼]  ☑️ Apenas ativos  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☐  👤  João Silva        Administrador    🟢 Ativo      │   │
│  │     joao@empresa.com     Admin            Há 2 horas    │   │
│  │                                         [✏️] [🔒] [🗑️]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐  👤  Maria Santos      Gerente         🟢 Ativo      │   │
│  │     maria@empresa.com    Manager         Há 5 horas    │   │
│  │                                         [✏️] [🔒] [🗑️]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ☐  👤  Carlos Oliveira   Vendedor        🔴 Inativo    │   │
│  │     carlos@empresa.com   Vendedor        Há 2 dias     │   │
│  │                                         [✏️] [🔒] [🗑️]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [◀ Anterior]  Página 1 de 3  [Próximo ▶]                      │
│                                                                  │
│  📌 2 selecionados  [✅ Ativar] [❌ Desativar] [🗑️ Excluir]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ BENEFÍCIOS DA SOLUÇÃO

### 1. Alinhamento com CRMs Líderes

✅ Gestão centralizada de usuários  
✅ Roles e permissões claras  
✅ Filtros avançados  
✅ Ações em massa  
✅ Dashboard informativo  

---

### 2. Simplificação da Arquitetura

✅ Uma única tabela `users`  
✅ Atendentes = Users com permissão ATENDIMENTO  
✅ Menos duplicação de código  
✅ Mais fácil de manter  

---

### 3. Experiência do Usuário

✅ Interface consistente  
✅ Fácil de encontrar usuários  
✅ Gestão intuitiva de permissões  
✅ Ações rápidas (ativar/desativar/resetar senha)  

---

## 🤔 DECISÃO NECESSÁRIA

**Pergunta para o usuário:**

1. **Deprecar tabela `atendentes`?** (Recomendado)
   - ✅ Mais limpo e simples
   - ✅ Alinha com padrão de mercado
   - ⚠️ Requer migração de dados

2. **Manter `atendentes` como relação?**
   - ✅ Preserva dados atuais
   - ⚠️ Mais complexo de manter
   - ⚠️ Duplicação de conceitos

---

## 📊 ESTIMATIVA DE TEMPO

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 1 | Backend (migration + endpoints) | 2h |
| 2 | Frontend (tela completa) | 4h |
| 3 | Refatoração (módulos dependentes) | 2h |
| 4 | Testes e ajustes | 1h |
| | **TOTAL** | **9h (~1.5 dias)** |

---

## 🎯 PRÓXIMO PASSO

**Aguardando decisão:**

1. ✅ **Opção A**: Deprecar `atendentes` → migrar para `users`
2. ⚠️ **Opção B**: Manter `atendentes` → criar relação

**Após decisão:**
- Implementar backend (Fase 1)
- Criar tela frontend (Fase 2)
- Refatorar módulos (Fase 3)
- Testar e documentar

---

**Aguardando seu comando para prosseguir!** 🚀
