# ✅ Sentry Setup - Status e Próximos Passos

## 📊 Status Atual: 75% Completo

### ✅ Completado

1. **Instalação de Pacotes** ✅
   - Backend: `@sentry/node`, `@sentry/profiling-node`
   - Frontend: `@sentry/react`
   - Verificado: Pacotes instalados com sucesso

2. **Configuração Backend** ✅
   - Arquivo: `backend/src/main.ts` (linhas 32-101)
   - Status: **JÁ estava configurado** (descoberto durante implementação)
   - Features: Performance monitoring, profiling, error filtering
   - Sample rates: 10% prod / 100% dev

3. **Configuração Frontend** ✅
   - Arquivo: `frontend-web/src/index.tsx`
   - Integrations: `browserTracingIntegration()`, `replayIntegration()`
   - Error filtering: ResizeObserver, ChunkLoadError, HMR
   - Sample rates: 10% tracing prod / 100% dev, session replay 100% on error

4. **ErrorBoundary Component** ✅
   - Arquivo: `frontend-web/src/components/common/ErrorBoundary.tsx`
   - Captura erros de renderização React
   - Envia para Sentry com component stack
   - UI de fallback profissional (Tailwind)
   - HOC helper: `withErrorBoundary()`
   - **Integrado em App.tsx** ✅

5. **TestError Component** ✅
   - Arquivo: `frontend-web/src/components/common/TestErrorComponent.tsx`
   - 5 tipos de teste:
     - Click handler error
     - Async Promise rejection
     - Network error (fetch)
     - Null reference error
     - Render error (componentDidCatch)
   - UI com instruções e checklist
   - Console logs para debug

6. **Documentação** ✅
   - Arquivo: `docs/SENTRY_SETUP.md` (completo)
   - Variáveis de ambiente explicadas
   - Como obter DSN do Sentry
   - Troubleshooting comum
   - Checklist de validação

7. **Arquivos .env.example** ✅
   - Backend: `backend/.env.example` atualizado
   - Frontend: `frontend-web/.env.example` atualizado
   - Variáveis Sentry documentadas

8. **Compilação** ✅
   - Frontend: Build sem erros nos novos arquivos
   - TypeScript: 0 erros em ErrorBoundary, TestErrorComponent, App.tsx
   - Warnings: Apenas pré-existentes (não relacionados ao Sentry)

---

## ⏳ Pendente (25%)

### 🔴 CRÍTICO - Necessário para Sentry funcionar

#### 1. Configurar Variáveis de Ambiente (.env)

**Backend** (`backend/.env`):
```env
SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
ENABLE_SENTRY=true
NODE_ENV=development
```

**Frontend** (`frontend-web/.env`):
```env
REACT_APP_SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
REACT_APP_ENABLE_SENTRY=true
REACT_APP_VERSION=1.0.0
```

**Como obter DSN:**
1. Acesse https://sentry.io
2. Crie conta (se não tiver)
3. Crie 2 projetos:
   - `conectcrm-backend` (Platform: Node.js)
   - `conectcrm-frontend` (Platform: React)
4. Copie DSN de cada projeto
5. Cole nos arquivos `.env`

**Tempo estimado:** 10 minutos

---

#### 2. Testar Captura de Erros

**Backend Test:**
```bash
# Reiniciar backend após configurar .env
cd backend
npm run start:dev

# Verificar console para mensagem:
# "📊 [Sentry] Error tracking habilitado no backend"

# Criar endpoint de teste temporário (ou usar existente que gera erro)
# Verificar se erro aparece no Sentry dashboard
```

**Frontend Test:**
```bash
# Reiniciar frontend após configurar .env
cd frontend-web
npm start

# Verificar console para mensagem:
# "📊 [Sentry] Error tracking habilitado no frontend"
```

**Adicionar rota de teste temporária** (apenas dev):

Em `frontend-web/src/App.tsx`, adicionar:
```tsx
// APENAS PARA DESENVOLVIMENTO - REMOVER EM PRODUÇÃO
{process.env.NODE_ENV === 'development' && (
  <Route path="/test-error" element={<TestErrorComponent />} />
)}
```

**Executar testes:**
1. Acesse http://localhost:3000/test-error
2. Clique em cada botão de erro
3. Verifique console: "📤 [Sentry] Enviando erro..."
4. Acesse Sentry dashboard
5. Confirme que erros apareceram

**Tempo estimado:** 20 minutos

---

### 🟡 OPCIONAL - Melhorias e Otimizações

#### 3. Adicionar User Context no Sentry

**Backend** (`main.ts`):
```typescript
// Adicionar após Sentry.init()
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.nome,
});
```

**Frontend** (após login):
```typescript
import * as Sentry from '@sentry/react';

// Em AuthContext ou após login bem-sucedido
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.nome,
});
```

**Tempo estimado:** 15 minutos

---

#### 4. Criar Seed Data para E2E Tests

**Problema:** E2E tests falham porque não há tickets/mensagens no DB

**Solução:** Criar script de seed

**Arquivo:** `backend/src/scripts/seed-test-data.ts`

```typescript
import { Connection } from 'typeorm';
import { Ticket } from '../modules/atendimento/entities/ticket.entity';
import { Mensagem } from '../modules/atendimento/entities/mensagem.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';

export async function seedTestData(connection: Connection) {
  // Criar usuário atendente de teste
  const atendente = await connection.getRepository(Usuario).save({
    email: 'atendente@conectsuite.com.br',
    senha: hashSync('senha123', 10),
    nome: 'Atendente Teste',
    ativo: true,
  });

  // Criar 5 tickets de teste
  for (let i = 1; i <= 5; i++) {
    const ticket = await connection.getRepository(Ticket).save({
      numero: `TEST-${i}`,
      status: 'aguardando',
      prioridade: i % 3 === 0 ? 'alta' : 'media',
      atendenteId: atendente.id,
    });

    // Criar 3 mensagens por ticket
    for (let j = 1; j <= 3; j++) {
      await connection.getRepository(Mensagem).save({
        ticketId: ticket.id,
        conteudo: `Mensagem de teste ${j} do ticket ${i}`,
        tipo: j % 2 === 0 ? 'enviada' : 'recebida',
      });
    }
  }

  console.log('✅ Test data seeded successfully!');
}
```

**Executar:**
```bash
cd backend
npm run seed:test
```

**Tempo estimado:** 30 minutos

---

#### 5. Corrigir Backend Compilation Errors (Pré-existentes)

**Erros:**
1. `dlq.controller.ts` - DlqStatus export issue
2. `dlq-reprocess.service.ts` - JobCounts undefined
3. `notifications.processor.ts` - moveToDelayed missing (3x)

**Não bloqueia Sentry**, mas importante para produção.

**Tempo estimado:** 45 minutos

---

## 📋 Checklist Rápido

Execute na ordem:

### AGORA (30 minutos)

- [ ] **1. Obter Sentry DSN**
  - [ ] Criar conta em https://sentry.io
  - [ ] Criar projeto backend
  - [ ] Criar projeto frontend
  - [ ] Copiar DSN de ambos

- [ ] **2. Configurar .env**
  - [ ] Adicionar variáveis em `backend/.env`
  - [ ] Adicionar variáveis em `frontend-web/.env`
  - [ ] Verificar formato DSN correto

- [ ] **3. Reiniciar servidores**
  - [ ] Backend: `cd backend && npm run start:dev`
  - [ ] Frontend: `cd frontend-web && npm start`
  - [ ] Verificar console: mensagens "📊 [Sentry] Error tracking habilitado..."

- [ ] **4. Adicionar rota de teste (temporária)**
  ```tsx
  // Em App.tsx
  {process.env.NODE_ENV === 'development' && (
    <Route path="/test-error" element={<TestErrorComponent />} />
  )}
  ```

- [ ] **5. Testar captura de erros**
  - [ ] Acessar http://localhost:3000/test-error
  - [ ] Clicar em "Testar Erro de Click"
  - [ ] Verificar console: "📤 [Sentry] Enviando erro..."
  - [ ] Acessar Sentry dashboard
  - [ ] Confirmar erro capturado

---

### HOJE (mais 1 hora)

- [ ] **6. Testar todos os tipos de erro**
  - [ ] Click handler error
  - [ ] Async Promise error
  - [ ] Network error
  - [ ] Null reference error
  - [ ] Render error (vai quebrar a página - ErrorBoundary aparece)

- [ ] **7. Validar no Sentry dashboard**
  - [ ] Stack traces completos
  - [ ] Environment correto (development)
  - [ ] Release/version correto
  - [ ] Breadcrumbs (console logs antes do erro)

- [ ] **8. Adicionar User Context** (opcional)
  - [ ] Backend: Sentry.setUser após autenticação
  - [ ] Frontend: Sentry.setUser após login

---

### ESTA SEMANA (Week 1 completion)

- [ ] **9. Criar seed data para E2E tests**
  - [ ] Script seed-test-data.ts
  - [ ] Executar e validar
  - [ ] Re-executar E2E tests

- [ ] **10. Corrigir erros de compilação backend** (opcional)
  - [ ] dlq.controller.ts
  - [ ] dlq-reprocess.service.ts
  - [ ] notifications.processor.ts

- [ ] **11. Documentar em README**
  - [ ] Adicionar seção Sentry no README.md
  - [ ] Mencionar SENTRY_SETUP.md
  - [ ] Atualizar CHANGELOG.md

---

## 🎯 Objetivo Final

**Sentry 100% funcional** = Todos os checklist acima marcados ✅

**Resultado esperado:**
- ✅ Backend captura erros automaticamente
- ✅ Frontend captura erros de render, eventos, async
- ✅ ErrorBoundary mostra UI de fallback amigável
- ✅ Sentry dashboard mostra todos os erros com contexto completo
- ✅ E2E tests executam com sucesso (após seed data)

---

## 🚀 Comandos Rápidos

```powershell
# 1. Reiniciar backend
cd backend
npm run start:dev

# 2. Reiniciar frontend
cd frontend-web
npm start

# 3. Verificar erros TypeScript
cd frontend-web
npm run build

# 4. Executar E2E tests (após seed data)
npx playwright test e2e/omnichannel

# 5. Ver logs Sentry no console
# Backend: tail -f backend-logs.txt (ou console)
# Frontend: F12 → Console
```

---

## 📞 Suporte

Se encontrar problemas:
1. **Verificar console** - mensagens "📊 [Sentry]" devem aparecer
2. **Consultar** `docs/SENTRY_SETUP.md` - troubleshooting detalhado
3. **Testar DSN** - copiar novamente do Sentry dashboard
4. **Reiniciar servidores** - variáveis .env só carregam no boot

---

**Status:** 75% completo  
**Blocker:** Configurar variáveis .env com Sentry DSN  
**Tempo para 100%:** ~30 minutos (configurar + testar)  
**Criado em:** Janeiro 2025  
**Última atualização:** Implementação inicial completa
