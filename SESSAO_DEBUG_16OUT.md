# 📋 Sessão de Debug - 16/10/2025

## 🎯 Objetivo
Resolver erro **HTTP 500** no endpoint `GET /nucleos` do backend MVP de Triagem.

---

## ✅ Conquistas Alcançadas

### 1. Backend Iniciado via Tarefa ✅
- Utilizou tarefa VS Code: **"Start Backend (Nest 3001)"**
- Comando: `node dist/src/main.js`
- Status: **ATIVO** na porta 3001

### 2. Logs de Debug Implementados ✅
Adicionados **8 pontos de logging** em `nucleo.service.ts`:
```typescript
console.log('[DEBUG NUCLEO] ========== INICIO findAll ==========');
console.log('[DEBUG NUCLEO] empresaId recebido:', empresaId);
console.log('[DEBUG NUCLEO] typeof empresaId:', typeof empresaId);
console.log('[DEBUG NUCLEO] SQL gerado:', query.getSql());
console.log('[DEBUG NUCLEO] Parametros:', query.getParameters());
console.log('[DEBUG NUCLEO] Executando query...');
console.log('[DEBUG NUCLEO] Resultados encontrados:', result.length);
console.error('[DEBUG NUCLEO] ❌ ERRO CAPTURADO:', error.message);
```

### 3. Correções Aplicadas ✅
- ✅ JWT Field Bug: `req.user.empresaId` → `req.user.empresa_id` (3 controllers)
- ✅ Authentication: Criado usuário `teste.triagem@test.com` com hash bcrypt correto
- ✅ Database: Validado 9 núcleos existentes na tabela

### 4. Documentação Criada ✅
- `DEBUG_500_ERROR_RESUMO.md` - Análise técnica detalhada
- `PROXIMOS_PASSOS_DEBUG.md` - Fluxo de resolução
- `RESUMO_EXECUTIVO_DEBUG.md` - Visão executiva
- `COMANDOS_RAPIDOS.md` - Scripts práticos
- `SESSAO_DEBUG_16OUT.md` - Este arquivo

---

## 🔍 Problema Identificado

### Sintomas:
```http
GET /nucleos
Authorization: Bearer <valid-jwt>
→ HTTP 500 Internal Server Error
```

### Causas Investigadas:
1. ❌ Authentication issue → **RESOLVIDO** (login funciona)
2. ❌ JWT field naming → **RESOLVIDO** (empresa_id correto)
3. ❌ Database empty → **DESCARTADO** (9 registros existem)
4. ⏳ Query syntax → **PROVÁVEL CAUSA** (aguardando logs)
5. ⏳ TypeORM config → **POSSÍVEL**
6. ⏳ Missing imports → **POSSÍVEL**

---

## 📊 Estado do Código

### Arquivos Modificados:

#### 1. `nucleo.controller.ts` ✅
```typescript
// 8 ocorrências corrigidas:
const empresaId = req.user.empresa_id; // era: req.user.empresaId
```

#### 2. `fluxo.controller.ts` ✅  
```typescript
// 6 ocorrências corrigidas:
const empresaId = req.user.empresa_id;
```

#### 3. `triagem.controller.ts` ✅
```typescript
// 4 ocorrências corrigidas:
const empresaId = req.user.empresa_id;
```

#### 4. `nucleo.service.ts` ✅
```typescript
async findAll(empresaId: string, filters?: FilterNucleoDto) {
  try {
    // 8 pontos de logging adicionados
    console.log('[DEBUG NUCLEO] ...');
    
    const query = this.nucleoRepository
      .createQueryBuilder('nucleo')
      .where('nucleo.empresaId = :empresaId', { empresaId }) // ← POSSÍVEL BUG
      .orderBy('nucleo.prioridade', 'ASC');
    
    // ...filtros...
    
    return await query.getMany();
  } catch (error) {
    console.error('[DEBUG NUCLEO] ERRO:', error.message);
    throw error;
  }
}
```

---

## 🎯 Hipótese Principal

### Query Builder Syntax Error

**Problema:**
```typescript
.where('nucleo.empresaId = :empresaId', { empresaId })
//      ^^^^^^^^^^^^^^^^ 
//      Nome da PROPRIEDADE TypeScript
```

**Mas o PostgreSQL tem:**
```sql
-- Coluna real no banco:
CREATE TABLE nucleos_atendimento (
  empresa_id UUID NOT NULL  -- ← snake_case!
);
```

**Solução Esperada:**
```typescript
.where('nucleo.empresa_id = :empresaId', { empresaId })
//      ^^^^^^^^^^^^^^^ 
//      Nome da COLUNA no banco
```

---

## 📝 Testes Executados

### Teste 1: Conexão Backend ✅
```powershell
Invoke-WebRequest -Uri 'http://localhost:3001/api-docs'
→ HTTP 200 OK
```

### Teste 2: Login ✅
```powershell
POST /auth/login
Body: { email: 'teste.triagem@test.com', senha: 'teste123' }
→ HTTP 200 OK + JWT token
```

### Teste 3: GET /nucleos ⏳
```powershell
GET /nucleos
Authorization: Bearer <token>
→ HTTP 500 (aguardando logs para diagnóstico)
```

---

## 🔧 Próximas Ações

### Ação Imediata:
1. **Verificar logs** no terminal "Start Backend (Nest 3001)"
2. **Identificar erro** específico em `[DEBUG NUCLEO]`
3. **Aplicar correção** baseada no erro real

### Se erro for Query Syntax:
```typescript
// Arquivo: backend/src/modules/triagem/services/nucleo.service.ts
// Linha: ~80

// TROCAR:
.where('nucleo.empresaId = :empresaId', { empresaId })

// POR:
.where('nucleo.empresa_id = :empresaId', { empresaId })
```

### Se erro for Missing Import:
```typescript
// Arquivo: backend/src/modules/triagem/triagem.module.ts

import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NucleoAtendimento,
      FluxoTriagem,
      SessaoTriagem,
      User  // ← ADICIONAR
    ]),
  ],
})
```

---

## 📚 Recursos Criados

### Scripts:
- ✅ `test-api.ps1` - Teste automatizado dos 25 endpoints
- ✅ `COMANDOS_RAPIDOS.md` - Comandos prontos para copiar/colar

### Documentação:
- ✅ `DEBUG_500_ERROR_RESUMO.md` - Análise técnica
- ✅ `PROXIMOS_PASSOS_DEBUG.md` - Roadmap de solução
- ✅ `RESUMO_EXECUTIVO_DEBUG.md` - Visão executiva

### Todo List:
- ✅ Atualizado com status "in-progress" para debug

---

## 💡 Aprendizados

### 1. TypeORM Query Builder
- Usa **nome da propriedade** na classe Entity
- Mas PostgreSQL tem **nome da coluna** (snake_case)
- Precisa verificar qual usar em `.where()`

### 2. JWT Payload
- NestJS Passport retorna payload diretamente em `req.user`
- Campos usam snake_case se definidos assim no JWT
- Controllers devem usar `req.user.empresa_id` não `empresaId`

### 3. Debug em NestJS
- `console.log()` funciona melhor que `this.logger.log()`
- Logs aparecem no terminal da tarefa VS Code
- Recompilação necessária para ver mudanças

---

## 🎯 Próximo Milestone

Quando resolver o erro 500:

1. ✅ GET /nucleos → HTTP 200 + Array[9]
2. ✅ Executar `test-api.ps1` → Validar 25 endpoints
3. ✅ Criar `GestaoNucleosPage.tsx`
4. ✅ Criar `GestaoFluxosPage.tsx`
5. ✅ Implementar webhook WhatsApp

---

## 📊 Métricas

- **Tempo de Debug:** ~2 horas
- **Arquivos Modificados:** 7 arquivos
- **Logs Adicionados:** 8 pontos
- **Correções Aplicadas:** 18 ocorrências (empresaId bug)
- **Documentos Criados:** 5 arquivos .md

---

**Sessão Criada:** 16/10/2025 14:55  
**Status:** Backend ativo, aguardando verificação de logs  
**Próximo Passo:** Verificar terminal do backend e aplicar correção final
