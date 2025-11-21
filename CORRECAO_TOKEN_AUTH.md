# 🔐 Correção: Inconsistência de Nome do Token JWT

**Data**: 11 de novembro de 2025  
**Problema**: Erro 401 Unauthorized ao carregar oportunidades  
**Causa Raiz**: Nomes diferentes para o token JWT no localStorage

---

## 🐛 Problema Identificado

O sistema usava **dois nomes diferentes** para o token JWT:

| Arquivo | Nome Usado | Status |
|---------|-----------|--------|
| `authService.ts` | `'authToken'` | ✅ **CORRETO** |
| `api.ts` | `'authToken'` | ✅ Correto |
| `oportunidadesService.ts` | `'auth_token'` | ❌ **ERRADO** |
| `PipelinePage.tsx` | `'auth_token'` | ❌ **ERRADO** |

**Resultado**: O `oportunidadesService` não encontrava o token e enviava requisições **sem autenticação** → 401 Unauthorized.

---

## ✅ Correção Aplicada

### 1. `oportunidadesService.ts` (linha 25)

**ANTES**:
```typescript
const token = localStorage.getItem('auth_token');
```

**DEPOIS**:
```typescript
const token = localStorage.getItem('authToken'); // ✅ Mesmo nome usado em api.ts
```

### 2. `PipelinePage.tsx` (linhas 142 e 564)

**ANTES**:
```typescript
localStorage.removeItem('auth_token');
```

**DEPOIS**:
```typescript
localStorage.removeItem('authToken'); // ✅ Corrigido para 'authToken'
```

---

## 🎯 Nome Padronizado

**Token JWT**: `'authToken'` (sem underscore)

**Definido em**: `frontend-web/src/services/authService.ts`

```typescript
// authService.ts - linha 47
localStorage.setItem('authToken', token);
```

---

## 🧪 Como Testar

1. **Fazer login**:
   ```
   http://localhost:3000/login
   ```

2. **Verificar token no console**:
   ```javascript
   localStorage.getItem('authToken')
   // Deve retornar: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

3. **Acessar Pipeline**:
   ```
   http://localhost:3000/pipeline
   ```

4. **Resultado esperado**:
   - ✅ Sem erros 401
   - ✅ KPI cards carregam
   - ✅ Kanban/Lista funcionam
   - ✅ Console sem erros

---

## 📊 Status

| Item | Status |
|------|--------|
| Correção implementada | ✅ Concluído |
| TypeScript errors | ✅ 0 erros |
| Testes manuais | ⏳ **Aguardando login** |

---

## ⚠️ Observação Importante

Ainda existem **outros arquivos** com `'auth_token'` (underscore):

- `LoginDebug.tsx`
- `AnalyticsPage.tsx`
- `auditoriaService.ts`
- `mercadoPagoService.ts`
- Etc.

**ESSES ARQUIVOS DEVEM SER CORRIGIDOS TAMBÉM** para evitar problemas futuros.

---

## 🚀 Próximos Passos

1. ✅ **Login obrigatório** → `http://localhost:3000/login`
2. ✅ Testar Pipeline completo
3. 🔧 **Refatoração global**: Padronizar `'authToken'` em **TODOS** os arquivos
4. 📝 Documentar padrão de autenticação no `.github/copilot-instructions.md`

---

**Correção realizada por**: GitHub Copilot  
**Validação**: Aguardando testes do usuário
