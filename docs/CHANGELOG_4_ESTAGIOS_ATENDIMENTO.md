# Changelog: Simplificação para 4 Estágios de Atendimento

**Data**: 10 de dezembro de 2025  
**Branch**: `consolidacao-atendimento`  
**Commit**: `1827b81`

## 🎯 Objetivo

Simplificar o fluxo de atendimento de **5 estágios** para **4 estágios**, alinhando com o mercado de atendimento omnichannel (Zendesk, Freshdesk, Intercom).

## 📊 Mudança de Estágios

### ❌ Removidos (5 estágios antigos):
1. **Aberto** - Ticket aguardando atribuição
2. **Aguardando** - Cliente parou de responder
3. **Resolvido** - Atendente marcou como resolvido
4. **Fechado** - Ticket finalizado permanentemente
5. **Em Atendimento** - Atendente está respondendo

### ✅ Novos (4 estágios):
1. **Fila** - Ticket aguardando atendimento (novo default)
2. **Em Atendimento** - Atendente está respondendo ativamente
3. **Envio Ativo** - Empresa inicia contato proativo omnichannel
4. **Encerrado** - Ticket finalizado (combina Resolvido + Fechado)

## 🔄 Mapeamento de Conversão

```sql
ABERTO       → FILA
AGUARDANDO   → ENVIO_ATIVO
RESOLVIDO    → ENCERRADO
FECHADO      → ENCERRADO
EM_ATENDIMENTO → EM_ATENDIMENTO (mantido)
```

## 🗄️ Alterações no Banco de Dados

### Migration: `1765306700000-SimplificarStatusTicketsManual.ts`

**Executada manualmente** via `npx typeorm query` em 5 passos:

```sql
-- 1. Converter valores existentes
UPDATE atendimento_tickets 
SET status = CASE 
  WHEN status = 'ABERTO' THEN 'FILA'
  WHEN status = 'AGUARDANDO' THEN 'ENVIO_ATIVO'
  WHEN status = 'RESOLVIDO' THEN 'ENCERRADO'
  WHEN status = 'FECHADO' THEN 'ENCERRADO'
  ELSE status 
END;

-- 2. Criar novo enum
CREATE TYPE atendimento_tickets_status_enum AS ENUM (
  'FILA', 
  'EM_ATENDIMENTO', 
  'ENVIO_ATIVO', 
  'ENCERRADO'
);

-- 3. Remover default antes de alterar tipo
ALTER TABLE atendimento_tickets 
ALTER COLUMN status DROP DEFAULT;

-- 4. Converter coluna para enum
ALTER TABLE atendimento_tickets 
ALTER COLUMN status TYPE atendimento_tickets_status_enum 
USING status::atendimento_tickets_status_enum;

-- 5. Definir novo default
ALTER TABLE atendimento_tickets 
ALTER COLUMN status SET DEFAULT 'FILA'::atendimento_tickets_status_enum;
```

**Resultado**:
- ✅ Coluna: `atendimento_tickets.status`
- ✅ Tipo: `USER-DEFINED` (enum PostgreSQL)
- ✅ Nome do tipo: `atendimento_tickets_status_enum`
- ✅ Default: `'FILA'`
- ✅ Dados convertidos: 2 FILA, 4 ENCERRADO (6 tickets totais na época)

## 🔧 Alterações no Backend

### Arquivos Modificados:

1. **`backend/src/modules/atendimento/entities/ticket.entity.ts`**
   - Atualizado enum `StatusTicket` com 4 valores
   - Removidos: ABERTO, AGUARDANDO, RESOLVIDO, FECHADO
   - Adicionados: FILA, ENVIO_ATIVO (mantidos: EM_ATENDIMENTO, ENCERRADO)

2. **`backend/src/migrations/1765306700000-SimplificarStatusTicketsManual.ts`**
   - Migration manual para conversão VARCHAR → ENUM
   - Método `up()`: 5 steps SQL
   - Método `down()`: Revert para VARCHAR

3. **`backend/src/migrations/1765278941399-AddSeverityToTickets.ts`**
   - Adicionado `IF NOT EXISTS` para evitar conflito de tabela `dlq_reprocess_audit`

## 🎨 Alterações no Frontend

### Arquivos Modificados:

1. **`frontend-web/src/features/atendimento/omnichannel/types.ts`**
   - Type `StatusAtendimento` atualizado: `'fila' | 'em_atendimento' | 'envio_ativo' | 'encerrado'`

2. **`frontend-web/src/features/atendimento/omnichannel/hooks/useAtendimentos.ts`**
   - Função `normalizarStatusAtendimento()` reescrita
   - Mapeamento bidirecional: backend (UPPERCASE) ↔ frontend (lowercase)
   - Mantém compatibilidade com nomes antigos

3. **`frontend-web/src/features/atendimento/omnichannel/services/atendimentoService.ts`**
   - **FIX CRÍTICO**: Método `listarTickets()` agora converte status para UPPERCASE antes de enviar ao backend
   - Código: `status: params.status ? params.status.toUpperCase() : undefined`
   - **Motivo**: Enum PostgreSQL é case-sensitive, requer match exato

4. **`frontend-web/src/features/atendimento/omnichannel/utils/statusUtils.ts`**
   - Funções utilitárias atualizadas para 4 estágios

5. **`frontend-web/src/features/atendimento/omnichannel/components/AtendimentosSidebar.tsx`**
   - Sidebar com 4 tabs: Fila, Em Atendimento, Envio Ativo, Encerrado
   - Removidas tabs antigas

## 🐛 Bug Corrigido

### **Problema**: Tickets não apareciam na lista apesar do contador mostrar "2"

**Causa raiz**: Case sensitivity do enum PostgreSQL
- Frontend enviava: `GET /api/atendimento/tickets?status=fila` (lowercase)
- Backend esperava: `status='FILA'` (uppercase) no WHERE clause
- Query retornava vazio porque enum não fazia match case-insensitive

**Solução**: Conversão para uppercase no service antes da requisição
```typescript
const paramsBackend = {
  ...params,
  status: params.status ? params.status.toUpperCase() : undefined,
};
```

## 🧪 Como Testar

### Backend:
```powershell
cd backend
npm run start:dev

# Verificar enum no banco
npx typeorm query -d ormconfig.js "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'atendimento_tickets' AND column_name = 'status';"

# Verificar distribuição de tickets
npx typeorm query -d ormconfig.js "SELECT status, COUNT(*) FROM atendimento_tickets GROUP BY status;"
```

### Frontend:
```powershell
cd frontend-web
npm start

# Acessar: http://localhost:3000/nuclei/atendimento/omnichannel
# Verificar:
# - Tab Fila mostra tickets corretamente
# - Contador bate com lista
# - Não há tabs antigas
```

## 🔄 Rollback (Se Necessário)

```powershell
cd backend
npm run migration:revert
```

Isso executará o método `down()` da migration, que reverte a coluna para VARCHAR.

## ⚠️ BREAKING CHANGE

**API**: O enum `StatusTicket` mudou de 5 para 4 valores.

**Impacto**:
- ✅ Frontend atualizado (retrocompatível via mapeamento)
- ✅ Backend atualizado (enum novo)
- ✅ Database migrado (dados convertidos)
- ⚠️ APIs externas que usam status devem atualizar para novos valores

## 📚 Referências

- **Zendesk**: New, Open, Pending, Solved, Closed (5)
- **Freshdesk**: Open, Pending, Resolved, Closed (4)
- **Intercom**: Open, Snoozed, Closed (3)
- **ConectCRM**: Fila, Em Atendimento, Envio Ativo, Encerrado (4) ✅

## 👥 Equipe

- **Implementação**: AI Assistant
- **Aprovação**: [Pendente]
- **QA**: [Pendente]

---

**Status**: ✅ Implementado e commitado  
**Próximo**: Validação manual em produção
