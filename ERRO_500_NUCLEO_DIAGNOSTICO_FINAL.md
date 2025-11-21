# 🔍 Diagnóstico Final - Erro 500 GET /nucleos

**Data:** 16/outubro/2025, 15:15  
**Status:** ❌ NÃO RESOLVIDO - Requer intervenção manual

---

## 📋 Resumo Executivo

O endpoint `GET /nucleos` retorna erro 500. Os logs de debug implementados no `NucleoService.findAll()` **NÃO estão aparecendo**, indicando que o erro acontece **ANTES** da requisição chegar no service.

---

## ✅ O Que Funciona

1. **Backend compilando:**  
   - `npm run build` → ✅ Sem erros  
   - Código TypeScript → JavaScript compilado corretamente

2. **Backend rodando:**  
   - Porta 3001 ativa  
   - `/api-docs` acessível  
   - PID 20200 ativo

3. **Autenticação:**  
   - Login com `teste.triagem@test.com` / `teste123` → ✅ 200 OK  
   - JWT token gerado corretamente  
   - Token contém `empresa_id` (snake_case)

4. **Rota registrada:**  
   - Log mostra: `Mapped {/nucleos, GET} route +1ms`  
   - Endpoint existe e está ativo

5. **Entidades compiladas:**  
   - `nucleo-atendimento.entity.js` EXISTE em `dist/`  
   - Decorator `@Entity('nucleos_atendimento')` presente  
   - Todos os decorators TypeORM corretos

6. **Módulo registrado:**  
   - `TriagemModule` importado no `AppModule`  
   - `TypeOrmModule.forFeature([NucleoAtendimento, ...])` correto  
   - `NucleoService` e `NucleoController` registrados

---

## ❌ O Que NÃO Funciona

### Sintoma Principal
```http
GET /nucleos
Authorization: Bearer <valid-jwt>
→ HTTP 500 Internal Server Error
```

### Evidência Crítica
**Os logs `[DEBUG NUCLEO]` não aparecem no terminal!**

```typescript
// Linha 76 de nucleo.service.ts
console.log('[DEBUG NUCLEO] ========== INICIO findAll ==========');
// ↑ Este log NUNCA aparece no terminal!
```

Isso significa que **o código nunca chega no `NucleoService.findAll()`**.

---

## 🔎 Análise Técnica

### Erro Original (do log que você colou)
```
[DEBUG NUCLEO] ❌ ERRO CAPTURADO:
[DEBUG NUCLEO] Mensagem: No metadata for "NucleoAtendimento" was found.
[DEBUG NUCLEO] Stack: EntityMetadataNotFoundError: No metadata for "NucleoAtendimento" was found.
    at DataSource.getMetadata (node_modules\typeorm\data-source\DataSource.js:305:19)
    at Repository.createQueryBuilder (node_modules\typeorm\repository\Repository.js:33:53)
    at NucleoService.findAll (dist\src\modules\triagem\services\nucleo.service.js:59:18)
```

**Interpretação:**
- O erro acontece na linha 59 do JavaScript compilado
- Quando `this.nucleoRepository.createQueryBuilder('nucleo')` é chamado
- TypeORM não consegue encontrar metadata da entidade `NucleoAtendimento`

### Por Que os Logs Não Aparecem Agora?

**Hipóteses Possíveis:**

1. **Backend está rodando código antigo:**
   - Mesmo após `npm run build` e restart
   - Process caching ou hot-reload com problemas

2. **Erro acontece no controller ANTES do service:**
   - `@UseGuards(JwtAuthGuard)` pode estar falhando silenciosamente
   - Controller não consegue injetar `NucleoService`
   - Algum interceptor/middleware bloqueando

3. **TypeORM não inicializou a entidade:**
   - `NucleoAtendimento` não foi registrada no `DataSource`
   - Circular dependency entre User → NucleoAtendimento
   - Import de `User` está quebrado

---

## 🔧 Correções Já Aplicadas

### 1. Controllers - JWT Field (✅ FEITO)
**Arquivo:** `nucleo.controller.ts`, `fluxo.controller.ts`, `triagem.controller.ts`  
**Problema:** Usavam `req.user.empresaId` mas JWT tem `empresa_id`  
**Solução:** Mudado para `req.user.empresa_id` (18 ocorrências)

### 2. Import do User (✅ FEITO)
**Arquivo:** `nucleo-atendimento.entity.ts`  
**Problema:** Import de `User` estava com caminho errado  
**Solução:** Corrigido para `../../users/user.entity`

### 3. Logs de Debug (✅ FEITO)
**Arquivo:** `nucleo.service.ts`  
**Adicionado:** 8 pontos de log com `console.log('[DEBUG NUCLEO] ...')`  
**Status:** Código compilado TEM os logs (verificado em `.js`)

---

## 🐛 Bugs Conhecidos Pendentes

### Bug #1: Query Builder Column Name (NÃO CORRIGIDO)
**Arquivo:** `backend/src/modules/triagem/services/nucleo.service.ts`  
**Linha:** 82

```typescript
// ERRADO (atual):
.where('nucleo.empresaId = :empresaId', { empresaId })

// CORRETO (deve ser):
.where('nucleo.empresa_id = :empresaId', { empresaId })
```

**Razão:** TypeORM QueryBuilder WHERE clause precisa do nome da coluna do banco (`empresa_id`), não do nome da propriedade TypeScript (`empresaId`).

**Impacto:** Se a requisição chegasse no service, este seria o erro causado.

---

## 📊 Timeline de Testes

| Hora | Ação | Resultado |
|------|------|-----------|
| 14:45 | Primeiro teste - logs [DEBUG NUCLEO] apareceram | ❌ Erro: "No metadata for NucleoAtendimento" |
| 14:50 | Corrigido import de User entity | - |
| 14:55 | Recompilado com `npm run build` | ✅ Build successful |
| 14:59 | Reiniciado backend (PID 20200) | ✅ Backend started |
| 15:00 | Teste GET /nucleos | ❌ 500 Error |
| 15:05 | Teste GET /nucleos | ❌ 500 Error - **SEM LOGS** |
| 15:10 | Teste GET /nucleos | ❌ 500 Error - **SEM LOGS** |

---

## 🚨 Problema Atual: Logs Desapareceram!

Nos primeiros testes, os logs `[DEBUG NUCLEO]` **APARECIAM** e mostravam o erro "No metadata".  
Agora, após recompilar e reiniciar, os logs **NÃO APARECEM MAIS**.

**Isso significa uma de duas coisas:**

1. **Backend não recarregou o código novo** → Requer restart REAL (kill process, não Ctrl+C)
2. **Erro acontece ANTES do service** → Controller, Guard ou Module não está funcionando

---

## 🎯 Próximas Ações Obrigatórias

### ⚠️ AÇÃO 1: Restart HARD do Backend (CRÍTICO - Fazer AGORA)

```powershell
# 1. MATAR TODOS os processos Node.js
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Aguardar 3 segundos
Start-Sleep -Seconds 3

# 3. Recompilar LIMPO
cd C:\Projetos\conectcrm\backend
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build

# 4. Iniciar backend NOVO
node dist/src/main.js
```

**Por quê?** Garante que NÃO há cache, NÃO há processo antigo, código LIMPO executando.

---

### ⚠️ AÇÃO 2: Teste Imediatamente Após Restart

```powershell
# Aguardar backend iniciar (ver "🚀 Conect CRM Backend rodando na porta 3001")
Start-Sleep -Seconds 5

# Fazer teste
$body = @{ email = 'teste.triagem@test.com'; senha = 'teste123' } | ConvertTo-Json
$response = Invoke-RestMethod -Method POST -Uri 'http://localhost:3001/auth/login' -Body $body -ContentType 'application/json'
$token = $response.data.access_token

# GET /nucleos
Invoke-RestMethod -Method GET -Uri 'http://localhost:3001/nucleos' -Headers @{ "Authorization" = "Bearer $token" }
```

**O que procurar no terminal do backend:**
- ✅ Se aparecer `[DEBUG NUCLEO]` → Código está executando, vá para AÇÃO 3
- ❌ Se NÃO aparecer `[DEBUG NUCLEO]` → Problema no controller/module, vá para AÇÃO 4

---

### ⚠️ AÇÃO 3: Se Logs Aparecerem - Corrigir Query Builder

**Arquivo:** `backend/src/modules/triagem/services/nucleo.service.ts`  
**Linha:** 82

```typescript
// TROCAR ESTA LINHA:
.where('nucleo.empresaId = :empresaId', { empresaId })

// POR ESTA:
.where('nucleo.empresa_id = :empresaId', { empresaId })
```

**Depois:**
```powershell
cd C:\Projetos\conectcrm\backend
npm run build
# Restart do backend (Ctrl+C e rodar novamente)
node dist/src/main.js
```

**Teste novamente.** Se sucesso, prossiga para testar todos os 25 endpoints com `test-api.ps1`.

---

### ⚠️ AÇÃO 4: Se Logs NÃO Aparecerem - Debug do Controller

**Adicionar log no controller:**

**Arquivo:** `backend/src/modules/triagem/controllers/nucleo.controller.ts`  
**Linha:** ~25 (método `findAll`)

```typescript
@Get()
async findAll(
  @Req() req,
  @Query() filters: FilterNucleoDto,
): Promise<NucleoAtendimento[]> {
  console.log('[DEBUG CONTROLLER] ========== GET /nucleos CHAMADO ==========');
  console.log('[DEBUG CONTROLLER] req.user:', req.user);
  console.log('[DEBUG CONTROLLER] empresa_id:', req.user?.empresa_id);
  console.log('[DEBUG CONTROLLER] filters:', filters);
  
  const result = await this.nucleoService.findAll(req.user.empresa_id, filters);
  
  console.log('[DEBUG CONTROLLER] Service retornou:', result?.length, 'registros');
  return result;
}
```

**Recompilar e testar:**
```powershell
npm run build
# Restart backend
```

**Interpretar logs:**
- Se `[DEBUG CONTROLLER]` aparecer mas `[DEBUG NUCLEO]` não → Problema na chamada do service
- Se NENHUM log aparecer → Problema no Guard ou Middleware
- Se `[DEBUG CONTROLLER]` mostrar `req.user` undefined → Problema no JWT Guard

---

### ⚠️ AÇÃO 5: Se Erro Persistir - Verificar TypeORM Metadata

**Arquivo:** `backend/src/modules/triagem/triagem.module.ts`

**Adicionar log temporário:**
```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NucleoAtendimento } from './entities/nucleo-atendimento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NucleoAtendimento,
      FluxoTriagem,
      SessaoTriagem,
    ]),
  ],
  // ... resto do módulo
})
export class TriagemModule implements OnModuleInit {
  constructor(
    @InjectRepository(NucleoAtendimento)
    private readonly nucleoRepo: Repository<NucleoAtendimento>,
  ) {}

  onModuleInit() {
    console.log('[TRIAGEM MODULE] ========== MODULE INITIALIZED ==========');
    console.log('[TRIAGEM MODULE] NucleoAtendimento metadata exists:', !!this.nucleoRepo.metadata);
    console.log('[TRIAGEM MODULE] Table name:', this.nucleoRepo.metadata?.tableName);
  }
}
```

**Recompilar, reiniciar e verificar logs de inicialização do backend.**

Se mostrar `metadata exists: false` ou erro ao acessar `metadata`, o problema é TypeORM não registrou a entidade corretamente.

---

## 📝 Arquivos Importantes

### Código Fonte (TypeScript)
- `backend/src/modules/triagem/triagem.module.ts` → Registra entidades
- `backend/src/modules/triagem/entities/nucleo-atendimento.entity.ts` → Entidade com imports
- `backend/src/modules/triagem/services/nucleo.service.ts` → Service com logs (linha 76-100)
- `backend/src/modules/triagem/controllers/nucleo.controller.ts` → Controller GET /nucleos

### Código Compilado (JavaScript)
- `backend/dist/src/modules/triagem/triagem.module.js` → Module compilado
- `backend/dist/src/modules/triagem/entities/nucleo-atendimento.entity.js` → Entity compilada
- `backend/dist/src/modules/triagem/services/nucleo.service.js` → Service compilado (linha 55-100)
- `backend/dist/src/modules/triagem/controllers/nucleo.controller.js` → Controller compilado

### Banco de Dados
- Tabela: `nucleos_atendimento`
- Registros: 9 núcleos (verificado via psql)
- Coluna: `empresa_id` UUID NOT NULL

---

## 🎬 Conclusão

**Estado Atual:** Bloqueado - Logs de debug não aparecem mais  
**Causa Provável:** Backend não recarregou código ou erro pré-service  
**Próximo Passo:** AÇÃO 1 (Restart HARD) → AÇÃO 2 (Teste) → Decisão baseada em logs

**Quando Resolver:**
1. Corrigir query builder (`empresaId` → `empresa_id`)
2. Rodar `test-api.ps1` para validar 25 endpoints
3. Marcar todo de "Debugar erro 500" como completo
4. Prosseguir para criação das páginas frontend

---

## 💡 Aprendizados

1. **Console.log vs Logger:** `console.log()` é mais confiável para debug de erros que acontecem antes do NestJS logger estar pronto
2. **TypeORM Metadata:** Erros "No metadata" geralmente significam entidade não registrada no módulo ou circular dependency
3. **Restart Importância:** Hot reload nem sempre funciona, restart HARD é mais confiável
4. **Debug Incremental:** Adicionar logs no controller E service permite identificar onde exatamente o código para

---

**Última Atualização:** 16/out/2025, 15:15  
**Próxima Revisão:** Após executar AÇÃO 1 e AÇÃO 2
