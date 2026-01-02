# 🔐 Correção de Segurança - Isolamento por Empresa

**Problema Identificado**: Controllers de Atendimento aceitam `empresaId` como query parameter, permitindo potencialmente acesso a dados de outras empresas.

## 🚨 Risco Atual

```typescript
// ❌ INSEGURO - empresaId vem do frontend
@Get()
async listar(@Query('empresaId') empresaId: string) {
  // Frontend pode enviar qualquer UUID
  // Se JWT não for validado, usuário pode ver dados de outras empresas!
}
```

## ✅ Correção Necessária

### Opção 1: Extrair do JWT (RECOMENDADO)

```typescript
// ✅ SEGURO - empresaId vem do token JWT
import { UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/atendimento/tickets')
@UseGuards(AuthGuard('jwt'))  // ← Garante autenticação
export class TicketController {
  
  @Get()
  async listar(
    @Request() req,  // ← Injeta request com user do JWT
    @Query('status') status?: string | string[],
    @Query('canalId') canalId?: string,
  ) {
    // ✅ empresa_id vem do JWT (não pode ser manipulado)
    const empresaId = req.user.empresa_id;
    
    const resultado = await this.ticketService.listar({
      empresaId,  // ← Sempre da empresa do usuário logado
      status,
      canalId,
    });
    
    return resultado;
  }
}
```

### Opção 2: Validar Correspondência (Defesa em Profundidade)

```typescript
// ✅ SEGURO - valida se empresaId do query bate com JWT
@Get()
@UseGuards(AuthGuard('jwt'))
async listar(
  @Request() req,
  @Query('empresaId') empresaId: string,
  @Query('status') status?: string | string[],
) {
  // Validar se empresaId fornecido bate com o do JWT
  if (empresaId !== req.user.empresa_id) {
    throw new ForbiddenException(
      'Você não tem permissão para acessar dados de outra empresa'
    );
  }
  
  // Prosseguir normalmente
  const resultado = await this.ticketService.listar({
    empresaId: req.user.empresa_id,  // ← Usar sempre do JWT
    status,
  });
  
  return resultado;
}
```

## 📋 Arquivos que Precisam de Correção

### Controllers de Atendimento:
1. ✅ `ticket.controller.ts` - Listar tickets
2. ✅ `analytics.controller.ts` - Dashboard e métricas
3. ✅ `distribuicao-avancada.controller.ts` - Distribuição de tickets
4. ✅ `configuracao-inatividade.controller.ts` - Configurações
5. ✅ `demanda.controller.ts` - Já usa `req.user.empresa_id` ✓

### Controllers de Outros Módulos:
6. ⚠️ `users.controller.ts` - Gestão de usuários
7. ⚠️ `clientes.controller.ts` - Gestão de clientes
8. ⚠️ `comercial/**/*.controller.ts` - Módulo comercial
9. ⚠️ `financeiro/**/*.controller.ts` - Módulo financeiro

## 🔧 Script de Correção Automática

```bash
# Buscar todos os controllers que usam empresaId sem validação
grep -r "Query('empresaId')" backend/src --include="*.controller.ts"

# Verificar se têm @UseGuards(AuthGuard('jwt'))
grep -B5 "Query('empresaId')" backend/src --include="*.controller.ts" | grep "UseGuards"
```

## 🎯 Plano de Ação

### CRÍTICO (Fazer ANTES do deploy):
1. ✅ Adicionar `@UseGuards(AuthGuard('jwt'))` em TODOS os controllers
2. ✅ Extrair `empresaId` de `req.user.empresa_id` ao invés de query param
3. ✅ Validar correspondência quando `empresaId` vier do frontend
4. ✅ Testar com 2 empresas diferentes para garantir isolamento

### IMPORTANTE (Fazer logo após deploy):
5. ⚠️ Auditoria completa de todos os controllers
6. ⚠️ Criar middleware global para validação de empresa
7. ⚠️ Adicionar testes automatizados de segurança
8. ⚠️ Implementar logs de tentativas de acesso cross-company

### RECOMENDADO (Médio prazo):
9. 💡 Criar decorator customizado `@CurrentEmpresa()` 
10. 💡 Implementar Row-Level Security no PostgreSQL
11. 💡 Adicionar rate limiting por empresa
12. 💡 Monitorar acessos suspeitos (Prometheus/Grafana)

## 📊 Status Atual vs Desejado

### Antes (INSEGURO):
```
Frontend → Query: empresaId=UUID → Backend → DB (filtra por UUID do query)
                     ↓
              Pode ser manipulado!
```

### Depois (SEGURO):
```
Frontend → JWT Token → Backend → Extrai empresa_id do JWT → DB (filtra)
                          ↓
                    Não pode ser manipulado!
```

## 🧪 Como Testar Isolamento

### Teste 1: Criar 2 Empresas e 2 Usuários
```sql
-- Empresa A
INSERT INTO empresas (id, nome) VALUES ('uuid-a', 'Empresa A');
INSERT INTO users (id, nome, email, senha, empresa_id) 
VALUES ('user-a', 'User A', 'a@test.com', 'hash', 'uuid-a');

-- Empresa B  
INSERT INTO empresas (id, nome) VALUES ('uuid-b', 'Empresa B');
INSERT INTO users (id, nome, email, senha, empresa_id) 
VALUES ('user-b', 'User B', 'b@test.com', 'hash', 'uuid-b');
```

### Teste 2: Criar Tickets para Cada Empresa
```sql
INSERT INTO atendimento_tickets (id, empresaId, numero, status) 
VALUES ('ticket-a', 'uuid-a', 1, 'ABERTO');

INSERT INTO atendimento_tickets (id, empresaId, numero, status) 
VALUES ('ticket-b', 'uuid-b', 2, 'ABERTO');
```

### Teste 3: Tentar Acessar Dados de Outra Empresa
```bash
# Login como User A (empresa uuid-a)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","senha":"senha123"}'
# → Retorna token JWT

# Tentar listar tickets da Empresa B (deve FALHAR)
curl -X GET "http://localhost:3001/api/atendimento/tickets?empresaId=uuid-b" \
  -H "Authorization: Bearer <token-user-a>"
# ✅ ESPERADO: 403 Forbidden ou array vazio
# ❌ PROBLEMA: Se retornar tickets da Empresa B = FALHA DE SEGURANÇA!
```

## 📝 Exemplo Completo Corrigido

```typescript
// ticket.controller.ts - VERSÃO SEGURA
import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/atendimento/tickets')
@UseGuards(AuthGuard('jwt'))  // ✅ Proteção global do controller
export class TicketController {
  
  constructor(private readonly ticketService: TicketService) {}
  
  @Get()
  async listar(
    @Request() req,  // ✅ Injeta request autenticada
    @Query('status') status?: string | string[],
    @Query('canalId') canalId?: string,
    @Query('filaId') filaId?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    // ✅ SEGURANÇA: empresa_id vem do JWT, não do query
    const empresaId = req.user.empresa_id;
    
    // Log de auditoria
    this.logger.log(
      `🔐 User ${req.user.email} (empresa ${empresaId}) listando tickets`
    );
    
    const resultado = await this.ticketService.listar({
      empresaId,  // ✅ Sempre da empresa do token
      status: status ? (Array.isArray(status) ? status : [status]) : undefined,
      canalId,
      filaId,
      limite: limite ? parseInt(limite, 10) : 50,
      pagina: pagina ? parseInt(pagina, 10) : 1,
    });
    
    return {
      success: true,
      data: resultado.tickets,
      total: resultado.total,
    };
  }
  
  @Get(':id')
  async buscarPorId(
    @Request() req,
    @Param('id') ticketId: string,
  ) {
    const empresaId = req.user.empresa_id;
    
    // ✅ Service valida se ticket pertence à empresa
    const ticket = await this.ticketService.buscarPorId(ticketId);
    
    // ✅ Verificação adicional no controller
    if (ticket.empresaId !== empresaId) {
      throw new ForbiddenException(
        'Este ticket não pertence à sua empresa'
      );
    }
    
    return { success: true, data: ticket };
  }
}
```

## 🎯 Conclusão

**SIM**, quando alguém cria cadastro pela função "registro":
- ✅ Recebe `empresa_id` no momento do registro
- ✅ JWT contém `empresa_id` após login
- ✅ **PORÉM**: Atualmente falta validação no backend!

**AÇÃO NECESSÁRIA**:
- 🔴 **CRÍTICO**: Adicionar `@UseGuards(AuthGuard('jwt'))` e extrair `empresa_id` do JWT
- 🟡 **IMPORTANTE**: Testar isolamento entre empresas antes do deploy
- 🟢 **RECOMENDADO**: Auditoria completa de segurança pós-deploy

**Estimativa de correção**: 2-3 horas para todos os controllers

---

**Criado em**: 19/11/2025 14:15  
**Prioridade**: 🔴 CRÍTICA (Segurança)  
**Status**: ⚠️ PENDENTE CORREÇÃO
