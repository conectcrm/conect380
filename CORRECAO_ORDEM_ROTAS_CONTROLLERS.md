# 🔧 Correção: Ordem de Rotas nos Controllers

## 📋 Problema Identificado

**Data**: 22 de outubro de 2025  
**Erro**: HTTP 500 ao buscar notas e demandas por ticket  
**Causa**: Conflito de roteamento no NestJS

### Logs de Erro no Frontend

```
GET http://localhost:3001/notas/ticket/cb9f1052-4b92-4ff4-8460-21d720fc5f3e 500 (Internal Server Error)
GET http://localhost:3001/demandas/ticket/cb9f1052-4b92-4ff4-8460-21d720fc5f3e 500 (Internal Server Error)
```

### Causa Raiz

No NestJS, a **ordem das rotas importa**! 

Rotas genéricas como `@Get(':id')` capturam **qualquer** requisição GET, inclusive rotas específicas como `/notas/ticket/:ticketId`.

#### Ordem ERRADA (antes):
```typescript
@Get(':id')                    // ❌ Captura tudo primeiro!
async buscarPorId(@Param('id') id: string) { }

@Get('cliente/:clienteId')     // 🚫 Nunca é alcançada
async buscarPorCliente() { }

@Get('ticket/:ticketId')       // 🚫 Nunca é alcançada
async buscarPorTicket() { }
```

Quando o frontend chamava `/notas/ticket/uuid-aqui`, o NestJS interpretava "ticket" como o `:id` e tentava buscar uma nota com ID "ticket", causando erro.

## ✅ Solução Aplicada

### Regra: **Rotas Específicas ANTES de Rotas Genéricas**

#### Ordem CORRETA (depois):
```typescript
@Get('cliente/:clienteId')        // ✅ Específica primeiro
async buscarPorCliente() { }

@Get('telefone/:telefone')        // ✅ Específica
async buscarPorTelefone() { }

@Get('ticket/:ticketId')          // ✅ Específica
async buscarPorTicket() { }

@Get('status/:status')            // ✅ Específica (só Demandas)
async buscarPorStatus() { }

@Get(':id')                       // ✅ Genérica por último!
async buscarPorId() { }
```

## 📂 Arquivos Alterados

### 1. `backend/src/modules/atendimento/controllers/nota-cliente.controller.ts`

**Antes** (linhas 60-102):
```typescript
@Get(':id')                    // ❌ Estava primeiro
@Get('cliente/:clienteId')
@Get('telefone/:telefone')
@Get('ticket/:ticketId')
```

**Depois** (linhas 60-102):
```typescript
@Get('cliente/:clienteId')     // ✅ Específicas primeiro
@Get('telefone/:telefone')
@Get('ticket/:ticketId')
@Get(':id')                    // ✅ Genérica por último
```

### 2. `backend/src/modules/atendimento/controllers/demanda.controller.ts`

**Antes** (linhas 63-120):
```typescript
@Get(':id')                    // ❌ Estava primeiro
@Get('cliente/:clienteId')
@Get('telefone/:telefone')
@Get('ticket/:ticketId')
@Get('status/:status')
```

**Depois** (linhas 63-120):
```typescript
@Get('cliente/:clienteId')     // ✅ Específicas primeiro
@Get('telefone/:telefone')
@Get('ticket/:ticketId')
@Get('status/:status')
@Get(':id')                    // ✅ Genérica por último
```

## 🎯 Resultado Esperado

Após a correção, as requisições devem funcionar corretamente:

| Endpoint | Antes | Depois |
|----------|-------|--------|
| `GET /notas/ticket/:ticketId` | ❌ 500 Error | ✅ 200 OK |
| `GET /demandas/ticket/:ticketId` | ❌ 500 Error | ✅ 200 OK |
| `GET /notas/:id` | ✅ Funcionava | ✅ Funciona |
| `GET /demandas/:id` | ✅ Funcionava | ✅ Funciona |
| `GET /notas/cliente/:clienteId` | ✅ Funcionava | ✅ Funciona |
| `GET /demandas/cliente/:clienteId` | ✅ Funcionava | ✅ Funciona |

## 📝 Lições Aprendidas

### Regras de Roteamento no NestJS

1. **Ordem das rotas importa**: Rotas são avaliadas na ordem em que aparecem no código
2. **Específicas antes de genéricas**: Sempre declarar rotas com caminhos literais antes de rotas com parâmetros
3. **Rotas com múltiplos segmentos**: `/cliente/:id/count` deve vir antes de `/:id`
4. **Padrão recomendado**:
   ```
   1. POST/PUT/PATCH/DELETE (não há conflito)
   2. GET com caminhos literais (/count, /status/:status)
   3. GET com segmentos específicos (/cliente/:id, /ticket/:id)
   4. GET genérico (/:id)
   ```

## 🧪 Como Testar

1. **Reiniciar backend** (se não estiver em watch mode):
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Testar no frontend**: Abrir chat e selecionar ticket
   - Notas devem carregar sem erro 500
   - Demandas devem carregar sem erro 500

3. **Testar endpoints manualmente** (via Postman/Thunder Client):
   ```
   GET /notas/ticket/cb9f1052-4b92-4ff4-8460-21d720fc5f3e
   GET /demandas/ticket/cb9f1052-4b92-4ff4-8460-21d720fc5f3e
   GET /notas/cliente/uuid-cliente
   GET /demandas/status/aberta
   ```

## 🔍 Debugging

Se o erro persistir, verificar:

1. **Backend recarregou?** Verificar logs do terminal
2. **Outros controllers**: Aplicar mesma correção se necessário
3. **Cache do frontend**: Limpar cache do navegador (Ctrl+Shift+R)
4. **Migration rodou?**: Verificar se tabelas existem no banco
   ```sql
   SELECT * FROM atendimento_notas_cliente LIMIT 1;
   SELECT * FROM atendimento_demandas LIMIT 1;
   ```

## ✅ Status

- [x] Identificado problema 1 (conflito de rotas)
- [x] Corrigido ordem de rotas em `nota-cliente.controller.ts`
- [x] Corrigido ordem de rotas em `demanda.controller.ts`
- [x] Identificado problema 2 (req.user.empresaId vs req.user.empresa_id)
- [x] Corrigido acesso a propriedades do user nos controllers
- [x] Backend reiniciado e recompilado
- [ ] Testado no frontend (aguardando teste do usuário)
- [ ] Validado endpoints via Postman (pendente)

## 🐛 Problema Adicional Descoberto

**Acesso incorreto às propriedades do User**:
- ❌ `req.user.userId` → Não existe
- ❌ `req.user.empresaId` → Não existe (é empresa_id com underscore)
- ✅ `req.user.id` → Correto (UUID do usuário)
- ✅ `req.user.empresa_id` → Correto (UUID da empresa)

### Correções Aplicadas

```typescript
// ❌ ANTES
const autorId = req.user.userId;
const empresaId = req.user.empresaId;

// ✅ DEPOIS
const autorId = req.user.id;
const empresaId = req.user.empresa_id;
```

---

**Próximo passo**: Recarregue o frontend (Ctrl+Shift+R) e teste novamente! 🚀
