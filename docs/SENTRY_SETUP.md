# Configuração de Variáveis de Ambiente para Sentry

Este documento descreve as variáveis de ambiente necessárias para configurar o Sentry no ConectCRM.

## 📋 Visão Geral

O Sentry está configurado para capturar erros e monitorar performance em:
- **Backend** (NestJS): `backend/src/main.ts`
- **Frontend** (React): `frontend-web/src/index.tsx`

## 🔧 Variáveis Obrigatórias

### Backend (.env)

Adicione as seguintes variáveis no arquivo `backend/.env`:

```env
# Sentry Configuration
SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
ENABLE_SENTRY=true
NODE_ENV=development
```

**Onde encontrar o DSN:**
1. Acesse https://sentry.io
2. Vá em Settings → Projects → Seu Projeto
3. Copie o valor de "Client Keys (DSN)"

**Valores de NODE_ENV:**
- `development` - Durante desenvolvimento (100% sample rate)
- `production` - Em produção (10% sample rate)

---

### Frontend (.env)

Adicione as seguintes variáveis no arquivo `frontend-web/.env`:

```env
# Sentry Configuration
REACT_APP_SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
REACT_APP_ENABLE_SENTRY=true
REACT_APP_VERSION=1.0.0
```

**Notas:**
- O DSN do frontend pode ser o mesmo ou diferente do backend (dependendo da sua organização no Sentry)
- `REACT_APP_VERSION` será usado para rastrear releases (incrementar a cada deploy)

---

## 📝 Exemplo Completo

### backend/.env
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sua_senha
DATABASE_NAME=conectcrm

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=7d

# Sentry - Error Tracking
SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
ENABLE_SENTRY=true
NODE_ENV=development

# APIs Externas
WHATSAPP_API_KEY=sua_chave
OPENAI_API_KEY=sk-...
```

### frontend-web/.env
```env
# API
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001

# Sentry - Error Tracking
REACT_APP_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
REACT_APP_ENABLE_SENTRY=true
REACT_APP_VERSION=1.0.0

# Features
REACT_APP_ENABLE_ANALYTICS=false
```

---

## 🎯 Como Obter o Sentry DSN

### Opção 1: Criar novo projeto Sentry (Recomendado)

1. **Criar conta Sentry** (se não tiver):
   - Acesse https://sentry.io
   - Clique em "Start Free"
   - Preencha os dados

2. **Criar projetos**:
   - Backend:
     - Name: `conectcrm-backend`
     - Platform: `Node.js`
   - Frontend:
     - Name: `conectcrm-frontend`
     - Platform: `React`

3. **Copiar DSN**:
   - Após criar cada projeto, copie o DSN que aparece na tela
   - Adicione nos respectivos arquivos `.env`

### Opção 2: Usar projeto existente

Se já tem projetos Sentry configurados:
1. Acesse https://sentry.io
2. Vá em Settings → Projects
3. Selecione o projeto
4. Em "Client Keys (DSN)", copie o valor
5. Cole no arquivo `.env` correspondente

---

## ⚙️ Configuração por Ambiente

### Desenvolvimento Local

```env
# backend/.env
ENABLE_SENTRY=true
NODE_ENV=development

# frontend-web/.env
REACT_APP_ENABLE_SENTRY=true
```

**Comportamento:**
- ✅ 100% das transações são rastreadas
- ✅ 100% dos erros são capturados
- ✅ Session replay ativo (0% sessões normais, 100% com erro)
- ✅ Console logs habilitados para debug

---

### Produção

```env
# backend/.env
ENABLE_SENTRY=true
NODE_ENV=production

# frontend-web/.env
REACT_APP_ENABLE_SENTRY=true
```

**Comportamento:**
- ⚡ 10% das transações são rastreadas (economia de quota)
- ✅ 100% dos erros são capturados
- ⚡ Session replay: 10% sessões normais, 100% com erro
- ❌ Console logs desabilitados

---

### Desabilitar Sentry (Testing/CI)

```env
# backend/.env
ENABLE_SENTRY=false

# frontend-web/.env
REACT_APP_ENABLE_SENTRY=false
```

**Quando usar:**
- ❌ Testes automatizados (E2E, unit tests)
- ❌ CI/CD pipelines
- ❌ Ambiente de staging sem monitoramento

---

## 🧪 Validação da Configuração

### 1. Verificar variáveis carregadas

**Backend:**
```typescript
// Adicionar temporariamente em backend/src/main.ts
console.log('SENTRY_DSN:', process.env.SENTRY_DSN ? 'Configurado ✓' : 'Não configurado ✗');
console.log('ENABLE_SENTRY:', process.env.ENABLE_SENTRY);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

**Frontend:**
```typescript
// Adicionar temporariamente em frontend-web/src/index.tsx
console.log('REACT_APP_SENTRY_DSN:', process.env.REACT_APP_SENTRY_DSN ? 'Configurado ✓' : 'Não configurado ✗');
console.log('REACT_APP_ENABLE_SENTRY:', process.env.REACT_APP_ENABLE_SENTRY);
```

### 2. Testar captura de erros

**Backend:**
```bash
curl -X POST http://localhost:3001/test-error
```

**Frontend:**
- Adicione rota temporária para `TestErrorComponent`
- Acesse http://localhost:3000/test-error
- Clique em "Testar Erro de Click"

### 3. Verificar no Sentry Dashboard

1. Acesse https://sentry.io
2. Vá em Issues
3. Deve aparecer o erro de teste
4. Verifique:
   - ✅ Stack trace completo
   - ✅ Environment correto (development/production)
   - ✅ Release/version correto
   - ✅ User context (se aplicável)

---

## 🚨 Erros Comuns e Soluções

### Erro: "Sentry não está capturando erros"

**Causa 1:** DSN não configurado
```bash
# Verificar se variável existe
echo $SENTRY_DSN                  # Linux/Mac
echo $env:SENTRY_DSN              # Windows PowerShell
```

**Solução:** Adicionar variável no .env e reiniciar servidor

---

**Causa 2:** ENABLE_SENTRY=false
```bash
# Verificar valor
grep ENABLE_SENTRY backend/.env
grep REACT_APP_ENABLE_SENTRY frontend-web/.env
```

**Solução:** Mudar para `true`

---

**Causa 3:** Servidor não reiniciado após mudar .env
**Solução:** 
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend-web && npm start
```

---

### Erro: "DSN inválido"

**Sintoma:** Console mostra erro "Invalid DSN"

**Causa:** DSN mal formatado ou incompleto

**Formato correto:**
```
https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
```

**Exemplo válido:**
```
https://abc123def456789@o1234567.ingest.sentry.io/8901234
```

**Solução:** Copiar DSN novamente do Sentry dashboard

---

### Erro: "Quota exceeded"

**Causa:** Limite de eventos Sentry atingido (plano free: 5k eventos/mês)

**Soluções:**
1. Reduzir sample rate:
   ```typescript
   tracesSampleRate: 0.05  // 5% ao invés de 10%
   ```

2. Filtrar mais erros não críticos:
   ```typescript
   ignoreErrors: [
     'ResizeObserver',
     'ChunkLoadError',
     'NetworkError',
     // Adicionar mais padrões aqui
   ]
   ```

3. Upgrade para plano pago do Sentry

---

## 📚 Referências

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Filtering Best Practices](https://docs.sentry.io/platforms/javascript/configuration/filtering/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**

- ✅ **Pode** commitar `.env.example` com valores fictícios
- ❌ **NÃO** commitar `.env` com DSN real
- ✅ DSN é considerado "público" (ok expor em frontend)
- ❌ Mas mesmo assim, adicione `.env` no `.gitignore`

**Verificar .gitignore:**
```bash
# Deve conter:
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## 📝 Checklist Final

Antes de considerar Sentry configurado:

- [ ] Variáveis adicionadas em `backend/.env`
- [ ] Variáveis adicionadas em `frontend-web/.env`
- [ ] DSN copiado corretamente (formato válido)
- [ ] ENABLE_SENTRY=true em ambos
- [ ] Backend reiniciado após mudar .env
- [ ] Frontend reiniciado após mudar .env
- [ ] Console mostra "📊 [Sentry] Error tracking habilitado..."
- [ ] Erro de teste capturado no Sentry dashboard
- [ ] Stack trace completo visível
- [ ] Environment/release tags corretos
- [ ] `.env` está no .gitignore
- [ ] Documentação atualizada para equipe

---

**Criado em:** Janeiro 2025  
**Mantido por:** Equipe ConectCRM  
**Última atualização:** Setup inicial Sentry
