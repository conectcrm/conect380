# 🔴 Debug do Erro 500 em GET /nucleos

**Data:** 16/10/2025 14:45  
**Status:** Backend iniciado via tarefa VS Code, testando endpoint

## Problema

Endpoint `GET /nucleos` retorna **HTTP 500 Internal Server Error** apesar de:
- ✅ Login funcionando (JWT correto)
- ✅ Database com 9 núcleos
- ✅ Entity mapping correto
- ✅ Controllers corrigidos (empresa_id)

## Logs de Debug Adicionados

Arquivo: `backend/src/modules/triagem/services/nucleo.service.ts`

```typescript
async findAll(empresaId: string, filters?: FilterNucleoDto) {
  try {
    console.log('[DEBUG NUCLEO] ========== INICIO findAll ==========');
    console.log('[DEBUG NUCLEO] empresaId recebido:', empresaId);
    console.log('[DEBUG NUCLEO] typeof empresaId:', typeof empresaId);
    
    const query = this.nucleoRepository
      .createQueryBuilder('nucleo')
      .where('nucleo.empresaId = :empresaId', { empresaId })
      .orderBy('nucleo.prioridade', 'ASC')
      .addOrderBy('nucleo.nome', 'ASC');
    
    console.log('[DEBUG NUCLEO] SQL gerado:', query.getSql());
    console.log('[DEBUG NUCLEO] Parametros:', query.getParameters());
    console.log('[DEBUG NUCLEO] Executando query...');
    
    const result = await query.getMany();
    
    console.log('[DEBUG NUCLEO] Query executada com sucesso!');
    console.log('[DEBUG NUCLEO] Resultados encontrados:', result.length);
    console.log('[DEBUG NUCLEO] ========== FIM findAll ==========');
    
    return result;
  } catch (error) {
    console.error('[DEBUG NUCLEO] ❌ ERRO CAPTURADO:');
    console.error('[DEBUG NUCLEO] Mensagem:', error.message);
    console.error('[DEBUG NUCLEO] Stack:', error.stack);
    console.error('[DEBUG NUCLEO] ========== FIM COM ERRO ==========');
    throw error;
  }
}
```

## Backend Iniciado

**Modo:** Task VS Code → `Start Backend (Nest 3001)`  
**Comando:** `node dist/src/main.js`  
**Porta:** 3001

## Teste em Andamento

```powershell
# Login
POST http://localhost:3001/auth/login
Body: { email: 'teste.triagem@test.com', senha: 'teste123' }

# Get Núcleos
GET http://localhost:3001/nucleos
Headers: { Authorization: 'Bearer <token>' }
```

## Próximos Passos

1. **Verificar logs do terminal backend** - Deve mostrar `[DEBUG NUCLEO]`
2. **Identificar erro específico** - SQL, TypeORM, ou campo inválido
3. **Corrigir problema** - Baseado no stack trace real
4. **Testar novamente** - Validar correção

## Hipóteses de Causa

### 1. Query Builder Syntax (Mais Provável)
```typescript
// PROBLEMA: .where() usa nome da PROPRIEDADE não da COLUNA
.where('nucleo.empresaId = :empresaId', { empresaId })

// DEVE SER (provavelmente):
.where('nucleo.empresa_id = :empresaId', { empresaId })
```

### 2. User Entity Não Importada
```typescript
// NucleoAtendimento tem relação com User (supervisor)
@ManyToOne(() => User, { nullable: true })
supervisor: User;

// TriagemModule pode não ter User no imports
```

### 3. TypeORM Synchronize False
```typescript
// Se synchronize: false e schema desatualizado
// Pode causar erro ao tentar acessar colunas
```

## Comandos Úteis

```powershell
# Ver logs do backend (terminal da tarefa)
# Procurar por: [DEBUG NUCLEO]

# Verificar database
$env:PGPASSWORD='conectcrm123'
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT id, nome, empresa_id FROM nucleos_atendimento LIMIT 3;"

# Recompilar se necessário
cd C:\Projetos\conectcrm\backend
npm run build

# Reiniciar tarefa backend no VS Code
# Ctrl+Shift+P → Tasks: Restart Running Task
```

## Correções Já Aplicadas

### 1. JWT Field Naming Bug ✅
```typescript
// ANTES (errado):
const empresaId = req.user.empresaId; // undefined

// DEPOIS (correto):
const empresaId = req.user.empresa_id; // do JWT payload
```

**Arquivos corrigidos:**
- `nucleo.controller.ts` - 8 ocorrências
- `fluxo.controller.ts` - 6 ocorrências  
- `triagem.controller.ts` - 4 ocorrências

### 2. Authentication Fixed ✅
- Usuário criado: `teste.triagem@test.com`
- Senha: `teste123`
- Hash bcrypt correto no banco
- Login retorna token válido

### 3. Database Validated ✅
```sql
-- Tabela existe
\d nucleos_atendimento

-- 9 registros presentes
SELECT COUNT(*) FROM nucleos_atendimento; -- 9

-- Coluna é empresa_id (snake_case)
\d nucleos_atendimento | grep empresa
-- empresa_id | uuid | not null
```

## Estado Final Esperado

Após identificar o erro real nos logs `[DEBUG NUCLEO]`:

✅ `GET /nucleos` retorna HTTP 200  
✅ Array com 9 núcleos  
✅ Todos 25 endpoints funcionando  
✅ MVP pronto para testes completos

---

**Última Atualização:** 16/10/2025 14:45  
**Próxima Ação:** Verificar logs do terminal backend e aplicar correção específica
