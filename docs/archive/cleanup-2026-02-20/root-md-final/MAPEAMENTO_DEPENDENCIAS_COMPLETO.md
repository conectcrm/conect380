# 📊 Sprint 0.1 - Mapeamento Completo de Dependências

**Data**: 2025-01-18  
**Sprint**: Sprint 0 - Preparação e Auditoria  
**Status**: ✅ AUDITORIA COMPLETA

---

## 📋 Resumo Executivo

### Entities Analisadas
- ✅ **Ticket** (`ticket.entity.ts`) - 22 campos + relações
- ✅ **Demanda** (`demanda.entity.ts`) - 11 campos + relações

### Arquivos Mapeados
- **Backend usando Ticket**: 21+ arquivos
- **Backend usando Demanda**: 5 arquivos
- **Frontend usando Demanda**: 6+ componentes/páginas

### Decisão Arquitetural
- ✅ **EXPANDIR Ticket** (não criar nova entity)
- ✅ **MANTER Demanda** durante transição (2-3 sprints)
- ✅ **DEPRECAR gradualmente** Demanda após migração

---

## 🔍 Dependências Completas

### Backend - Arquivos que IMPORTAM Ticket

```typescript
// 1. MÓDULO TRIAGEM (3 arquivos)
backend/src/modules/triagem/
├── triagem.module.ts                     // Importa Ticket no TypeORM
├── services/atribuicao.service.ts        // Usa Ticket, StatusTicket
└── entities/sessao-triagem.entity.ts     // Relação ManyToOne com Ticket

// 2. MÓDULO ATENDIMENTO - ENTITIES (4 arquivos)
backend/src/modules/atendimento/entities/
├── distribuicao-log.entity.ts            // Relação com Ticket
├── tag.entity.ts                         // Many-to-Many com Ticket
└── canal.entity.ts                       // OneToMany com Ticket

// 3. MÓDULO ATENDIMENTO - SERVICES (9 arquivos)
backend/src/modules/atendimento/services/
├── contexto-cliente.service.ts           // Busca tickets do cliente
├── demanda.service.ts                    // Cria Ticket a partir de Demanda ⚠️
├── distribuicao.service.ts               // Distribui tickets para atendentes
├── distribuicao-avancada.service.ts      // Distribuição com algoritmos
├── fila.service.ts                       // Gerencia filas de tickets
├── inactivity-monitor.service.ts         // Monitora tickets inativos
├── mensagem.service.ts                   // Cria mensagens vinculadas a Ticket
├── online-status.service.ts              // Status online dos tickets
└── busca-global.service.ts               // Busca unificada de tickets

// 4. MÓDULO ATENDIMENTO - CONTROLLERS (2 arquivos)
backend/src/modules/atendimento/controllers/
├── mensagens.controller.ts               // Endpoints de mensagens
└── distribuicao.controller.ts            // Endpoints de distribuição

// 5. MÓDULO ATENDIMENTO - UTILS (2 arquivos)
backend/src/modules/atendimento/utils/
├── status-validator.ts                   // Valida StatusTicket
└── status-validator.spec.ts              // Testes do validator

// 6. TESTES (2 arquivos)
backend/src/modules/atendimento/services/
├── demanda.service.spec.ts               // Testa criação de Ticket
└── distribuicao.service.spec.ts          // Testa distribuição
```

**Total**: **21+ arquivos** dependem de Ticket

---

### Backend - Arquivos que IMPORTAM Demanda

```typescript
// 1. ENTITY RELACIONADA
backend/src/modules/atendimento/entities/
└── redmine-integration.entity.ts         // Integração Demanda → Redmine

// 2. SERVICE PRINCIPAL
backend/src/modules/atendimento/services/
├── demanda.service.ts                    // CRUD de Demandas
└── demanda.service.spec.ts               // Testes do service

// 3. MÓDULO
backend/src/modules/atendimento/
└── atendimento.module.ts                 // Registra Demanda no TypeORM

// 4. CONFIGURAÇÃO GLOBAL
backend/src/config/
└── database.config.ts                    // Lista Demanda nas entities
```

**Total**: **5 arquivos** dependem de Demanda

---

### Frontend - Arquivos que USAM Demanda

```typescript
// 1. COMPONENTE PRINCIPAL (ChatOmnichannel)
frontend-web/src/features/atendimento/omnichannel/
└── ChatOmnichannel.tsx                   // 16 ocorrências de "demanda"
    ├── import { Demanda } from './types'
    ├── import { useDemandas } from '../../../hooks/useDemandas'
    ├── import demandaService from '../../../services/demandaService'
    └── carregarDemandas({ clienteId, ticketId, telefone })

// 2. ROTAS (App.tsx)
frontend-web/src/
└── App.tsx                               // 4 ocorrências
    ├── import DemandasPage
    ├── import DemandaDetailPage
    ├── <Route path="/nuclei/atendimento/demandas" />
    └── <Route path="/nuclei/atendimento/demandas/:id" />

// 3. PÁGINAS
frontend-web/src/pages/
├── DemandasPage.tsx                      // Lista de demandas (CRUD)
└── DemandaDetailPage.tsx                 // Detalhe individual
    └── Usa: Demanda, StatusDemanda, TipoDemanda, PrioridadeDemanda

// 4. SERVICES
frontend-web/src/services/
└── demandaService.ts                     // API client (GET/POST/PUT/DELETE)

// 5. HOOKS
frontend-web/src/hooks/
└── useDemandas.ts                        // Hook React para state management

// 6. TYPES
frontend-web/src/features/atendimento/omnichannel/
└── types.ts                              // Interface Demanda
```

**Total**: **6+ arquivos** usam Demanda no frontend

---

## 🎯 Análise de Impacto

### Impacto ALTO ⚠️

Arquivos que **PRECISAM** ser atualizados na migração:

1. **demanda.service.ts** (backend)
   - Atualmente cria Tickets a partir de Demandas
   - **Ação**: Deprecar e redirecionar para ticket.service.ts

2. **DemandaDetailPage.tsx** (frontend)
   - Interface completa de CRUD de Demandas
   - **Ação**: Migrar para TicketDetailPage.tsx ou tornar compatível

3. **ChatOmnichannel.tsx** (frontend)
   - Usa `useDemandas()` hook no painel direito
   - **Ação**: Trocar por `useTickets()` com filtro de tipo

4. **database.config.ts** (backend)
   - Registra Demanda nas entities TypeORM
   - **Ação**: Remover após migration completa (Sprint 3+)

### Impacto MÉDIO 🟡

Arquivos que precisam **adaptação**:

1. **atendimento.module.ts**
   - Registra DemandaService como provider
   - **Ação**: Manter durante transição, marcar @deprecated

2. **App.tsx** (rotas)
   - Tem rotas `/demandas` e `/demandas/:id`
   - **Ação**: Redirecionar para `/tickets?tipo=demanda`

3. **useDemandas.ts** (hook)
   - Hook específico para Demandas
   - **Ação**: Unificar com useTickets() usando flag de filtro

### Impacto BAIXO ✅

Arquivos que **já funcionam** com modelo expandido:

1. **ticket.service.ts** - Já tem toda lógica de CRUD
2. **mensagem.service.ts** - Já vincula mensagens a tickets
3. **distribuicao.service.ts** - Já distribui tickets
4. **fila.service.ts** - Já gerencia filas

Estes **NÃO precisam** de mudanças significativas!

---

## 📦 Plano de Migration de Dados

### Fase 1: Preparação (Sprint 0)

```sql
-- 1. Criar campos novos em Ticket (sem quebrar nada)
ALTER TABLE atendimento_tickets
  ADD COLUMN IF NOT EXISTS cliente_id UUID,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS data_vencimento TIMESTAMP,
  ADD COLUMN IF NOT EXISTS responsavel_id UUID,
  ADD COLUMN IF NOT EXISTS autor_id UUID;

-- 2. Renomear assunto → titulo (com fallback)
ALTER TABLE atendimento_tickets
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);

UPDATE atendimento_tickets
SET titulo = COALESCE(assunto, 'Sem título')
WHERE titulo IS NULL;

ALTER TABLE atendimento_tickets
  ALTER COLUMN titulo SET NOT NULL;

-- 3. Expandir enum de Status
-- ⚠️ PostgreSQL não permite ALTER ENUM direto!
-- Solução: Criar novo tipo e migrar

CREATE TYPE status_ticket_v2 AS ENUM (
  'FILA',
  'EM_ATENDIMENTO',
  'ENVIO_ATIVO',
  'ENCERRADO',
  'AGUARDANDO_CLIENTE',
  'AGUARDANDO_INTERNO',
  'CONCLUIDO',
  'CANCELADO'
);

-- Migration será feita via TypeORM (mais seguro)
```

### Fase 2: Cópia de Dados (Sprint 1)

```sql
-- Copiar todas as Demandas para Tickets
INSERT INTO atendimento_tickets (
  id,                    -- Gerar novo UUID
  numero,                -- Gerar sequencial
  titulo,                -- De demanda.titulo
  descricao,             -- De demanda.descricao
  tipo,                  -- De demanda.tipo
  status,                -- Mapear status_demanda → status_ticket
  prioridade,            -- Converter lowercase → UPPERCASE
  empresa_id,            -- De demanda.empresa_id
  cliente_id,            -- De demanda.cliente_id (NOVO!)
  contato_telefone,      -- De demanda.contato_telefone
  responsavel_id,        -- De demanda.responsavel_id (NOVO!)
  autor_id,              -- De demanda.autor_id (NOVO!)
  data_vencimento,       -- De demanda.data_vencimento (NOVO!)
  data_resolucao,        -- De demanda.data_conclusao
  data_abertura,         -- De demanda.created_at
  created_at,            -- De demanda.created_at
  updated_at             -- De demanda.updated_at
)
SELECT
  gen_random_uuid(),                                          -- Novo ID
  nextval('ticket_numero_seq'),                               -- Sequencial
  titulo,
  descricao,
  tipo,
  CASE
    WHEN status = 'aberta' THEN 'FILA'
    WHEN status = 'em_andamento' THEN 'EM_ATENDIMENTO'
    WHEN status = 'aguardando' THEN 'AGUARDANDO_CLIENTE'
    WHEN status = 'concluida' THEN 'CONCLUIDO'
    WHEN status = 'cancelada' THEN 'CANCELADO'
    ELSE 'FILA'
  END,
  UPPER(prioridade),                                          -- BAIXA, MEDIA, ALTA, URGENTE
  empresa_id,
  cliente_id,
  contato_telefone,
  responsavel_id,
  autor_id,
  data_vencimento,
  data_conclusao,
  created_at,
  created_at,
  updated_at
FROM atendimento_demandas
WHERE NOT EXISTS (
  -- Evitar duplicação se rodar script 2x
  SELECT 1 FROM atendimento_tickets t
  WHERE t.cliente_id = atendimento_demandas.cliente_id
    AND t.titulo = atendimento_demandas.titulo
    AND t.created_at = atendimento_demandas.created_at
);

-- Validar: contar registros
SELECT
  (SELECT COUNT(*) FROM atendimento_demandas) AS demandas_total,
  (SELECT COUNT(*) FROM atendimento_tickets WHERE tipo IS NOT NULL) AS tickets_migrados,
  (SELECT COUNT(*) FROM atendimento_tickets WHERE tipo IS NULL) AS tickets_originais;
```

### Fase 3: Validação (Sprint 2)

```sql
-- 1. Verificar integridade referencial
SELECT d.id, d.titulo, d.cliente_id, t.id AS ticket_migrado
FROM atendimento_demandas d
LEFT JOIN atendimento_tickets t
  ON t.cliente_id = d.cliente_id
  AND t.titulo = d.titulo
  AND DATE(t.created_at) = DATE(d.created_at)
WHERE t.id IS NULL;  -- Se retornar algo, migration falhou!

-- 2. Comparar contagens
SELECT
  'Demandas' AS origem,
  tipo,
  COUNT(*) AS quantidade
FROM atendimento_demandas
GROUP BY tipo
UNION ALL
SELECT
  'Tickets Migrados' AS origem,
  tipo,
  COUNT(*) AS quantidade
FROM atendimento_tickets
WHERE descricao IS NOT NULL  -- Flag: veio de Demanda
GROUP BY tipo;

-- 3. Verificar status
SELECT status, COUNT(*)
FROM atendimento_tickets
WHERE tipo IS NOT NULL
GROUP BY status;
```

### Fase 4: Limpeza (Sprint 3+)

```sql
-- ⚠️ SÓ EXECUTAR APÓS VALIDAÇÃO 100% OK!
-- ⚠️ FAZER BACKUP ANTES!

-- 1. Marcar Demandas como migradas (não deletar ainda!)
ALTER TABLE atendimento_demandas
  ADD COLUMN IF NOT EXISTS migrado_para_ticket_id UUID;

UPDATE atendimento_demandas d
SET migrado_para_ticket_id = (
  SELECT t.id
  FROM atendimento_tickets t
  WHERE t.cliente_id = d.cliente_id
    AND t.titulo = d.titulo
    AND DATE(t.created_at) = DATE(d.created_at)
  LIMIT 1
);

-- 2. Verificar se TODAS foram migradas
SELECT COUNT(*) AS demandas_nao_migradas
FROM atendimento_demandas
WHERE migrado_para_ticket_id IS NULL;
-- Deve retornar 0!

-- 3. Soft delete (manter durante 2-3 meses)
ALTER TABLE atendimento_demandas
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

UPDATE atendimento_demandas
SET deleted_at = NOW()
WHERE migrado_para_ticket_id IS NOT NULL;

-- 4. Hard delete (após 3+ meses em produção)
-- DROP TABLE atendimento_demandas;  -- ⚠️ CUIDADO EXTREMO!
```

---

## 🔄 Estratégia de Transição

### Opção A: Big Bang (NÃO RECOMENDADO)

❌ Migrar tudo de uma vez  
❌ Alto risco de downtime  
❌ Difícil rollback  

### Opção B: Blue-Green Deploy (RECOMENDADO)

✅ Manter ambas as entities durante transição  
✅ Frontend escolhe qual usar via feature flag  
✅ Rollback instantâneo se houver problema  

**Implementação**:

```typescript
// backend/src/config/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_UNIFIED_TICKETS: process.env.USE_UNIFIED_TICKETS === 'true',
};

// demanda.service.ts
@Injectable()
export class DemandaService {
  async criar(dto: CreateDemandaDto) {
    if (FEATURE_FLAGS.USE_UNIFIED_TICKETS) {
      // Nova lógica: criar Ticket diretamente
      return this.ticketService.criar({
        titulo: dto.titulo,
        descricao: dto.descricao,
        tipo: dto.tipo,
        status: 'FILA',
        // ... mapear campos
      });
    }
    
    // Lógica antiga (fallback)
    return this.demandaRepository.save(dto);
  }
}
```

**Rollback**:
```bash
# Se algo der errado, desliga flag:
USE_UNIFIED_TICKETS=false npm run start:prod
```

---

## 📅 Cronograma Detalhado

### Sprint 0 - Preparação (1 semana) ✅ EM ANDAMENTO

- [x] **0.1** - Auditoria completa de entities ✅
- [x] **0.2** - Mapear dependências ✅
- [ ] **0.3** - Executar queries SQL de contagem
- [ ] **0.4** - Criar backup do banco
- [ ] **0.5** - Git tag `pre-unificacao`
- [ ] **0.6** - Escrever script de migration (SQL)
- [ ] **0.7** - Escrever script de rollback (SQL)
- [ ] **0.8** - Testar migration em ambiente dev

### Sprint 1 - Expansão Backend (2 semanas)

- [ ] **1.1** - Adicionar novos campos em Ticket (migration TypeORM)
- [ ] **1.2** - Expandir StatusTicket enum (8 valores)
- [ ] **1.3** - Criar TipoTicket enum (7 valores)
- [ ] **1.4** - Atualizar DTOs (CreateTicketDto, UpdateTicketDto)
- [ ] **1.5** - Adicionar relações com User (autor, responsavel)
- [ ] **1.6** - Criar índices otimizados (tipo, cliente_id, responsavel_id)
- [ ] **1.7** - Testes unitários (ticket.service.spec.ts)
- [ ] **1.8** - Testes E2E (tickets.e2e-spec.ts)

### Sprint 2 - Migration de Dados (1 semana)

- [ ] **2.1** - Executar migration SQL (copiar Demandas → Tickets)
- [ ] **2.2** - Validar integridade referencial
- [ ] **2.3** - Comparar contagens (antes vs depois)
- [ ] **2.4** - Adicionar flag `migrado_para_ticket_id` em Demanda
- [ ] **2.5** - Deprecar DemandaService (@deprecated JSDoc)
- [ ] **2.6** - Adicionar feature flag USE_UNIFIED_TICKETS
- [ ] **2.7** - Testes de regressão completos

### Sprint 3 - Atualização Frontend (2 semanas)

- [ ] **3.1** - Unificar types (Demanda → Ticket)
- [ ] **3.2** - Atualizar ChatOmnichannel (usar useTickets)
- [ ] **3.3** - Migrar DemandasPage → TicketsPage
- [ ] **3.4** - Adicionar filtro de tipo (técnica, comercial, etc)
- [ ] **3.5** - Atualizar rotas (/demandas → /tickets?tipo=X)
- [ ] **3.6** - Atualizar demandaService (redirecionar para ticketService)
- [ ] **3.7** - Testes E2E frontend (Playwright/Cypress)

### Sprint 4 - Limpeza e Deprecação (1 semana)

- [ ] **4.1** - Soft delete de Demandas (deleted_at)
- [ ] **4.2** - Monitorar logs por 2-4 semanas
- [ ] **4.3** - Remover código deprecated (se sem erros)
- [ ] **4.4** - Hard delete de tabela atendimento_demandas
- [ ] **4.5** - Remover DemandaService, DemandaController
- [ ] **4.6** - Atualizar documentação final

---

## 🧪 Testes Essenciais

### Backend Tests

```typescript
// ticket.service.spec.ts
describe('TicketService - Unificação', () => {
  it('deve criar ticket com campos de demanda', async () => {
    const dto = {
      titulo: 'Teste',
      descricao: 'Descrição completa',
      tipo: 'tecnica',
      status: StatusTicket.FILA,
      clienteId: 'uuid-cliente',
      autorId: 'uuid-autor',
    };
    
    const ticket = await service.criar(dto);
    
    expect(ticket.titulo).toBe('Teste');
    expect(ticket.descricao).toBe('Descrição completa');
    expect(ticket.tipo).toBe('tecnica');
    expect(ticket.clienteId).toBe('uuid-cliente');
  });

  it('deve migrar demanda para ticket preservando dados', async () => {
    const demanda = await criarDemandaMock();
    
    const ticket = await service.migrarDemanda(demanda.id);
    
    expect(ticket.titulo).toBe(demanda.titulo);
    expect(ticket.descricao).toBe(demanda.descricao);
    expect(ticket.clienteId).toBe(demanda.clienteId);
    expect(ticket.status).toBeDefined();
  });
});
```

### Frontend Tests

```typescript
// ChatOmnichannel.test.tsx
describe('ChatOmnichannel - Demandas Unificadas', () => {
  it('deve carregar tickets com tipo demanda', async () => {
    render(<ChatOmnichannel />);
    
    await waitFor(() => {
      expect(screen.getByText('Demandas Técnicas')).toBeInTheDocument();
    });
  });

  it('deve criar nova demanda usando Ticket entity', async () => {
    const { criarTicket } = usarTicketService();
    
    await criarTicket({
      titulo: 'Nova Demanda',
      tipo: 'comercial',
      clienteId: 'uuid-123',
    });
    
    expect(mockApi.post).toHaveBeenCalledWith('/tickets', expect.any(Object));
  });
});
```

---

## 📊 Métricas de Sucesso

### KPIs da Migration

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Zero Data Loss** | 100% | Comparar contagens antes/depois |
| **Downtime** | < 5 min | Monitorar uptime durante deploy |
| **Rollback Time** | < 2 min | Tempo para reverter feature flag |
| **Query Performance** | +0% | Comparar tempo de resposta /tickets |
| **Frontend Errors** | 0 | Monitorar Sentry/console |
| **Backend Errors 500** | 0 | Logs do NestJS |
| **Testes Passando** | 100% | CI/CD pipeline |

### Queries de Validação

```sql
-- Executar ANTES e DEPOIS da migration:

-- 1. Total de tickets/demandas
SELECT 'ANTES' AS momento, 
       (SELECT COUNT(*) FROM atendimento_tickets) AS tickets,
       (SELECT COUNT(*) FROM atendimento_demandas) AS demandas;

-- 2. Total DEPOIS (esperado: tickets = tickets_antes + demandas_antes)
SELECT 'DEPOIS' AS momento,
       COUNT(*) AS tickets_total,
       COUNT(*) FILTER (WHERE tipo IS NULL) AS tickets_originais,
       COUNT(*) FILTER (WHERE tipo IS NOT NULL) AS tickets_migrados
FROM atendimento_tickets;

-- 3. Verificar se alguma demanda não foi migrada
SELECT COUNT(*) AS demandas_nao_migradas
FROM atendimento_demandas d
WHERE NOT EXISTS (
  SELECT 1 FROM atendimento_tickets t
  WHERE t.cliente_id = d.cliente_id
    AND t.titulo = d.titulo
    AND DATE(t.created_at) = DATE(d.created_at)
);
-- Deve retornar 0!
```

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados | Baixa | **CRÍTICO** | Backup completo + validação SQL |
| Query lenta após migration | Média | Alto | Criar índices em campos novos |
| Frontend quebrado | Média | Alto | Feature flag + rollback instantâneo |
| Status incompatíveis | Alta | Médio | Mapeamento explícito + testes |
| Foreign keys quebradas | Baixa | Alto | Validar integridade antes de deletar |
| Downtime prolongado | Baixa | Alto | Blue-Green deploy + smoke tests |

---

## 🚀 Próximos Passos IMEDIATOS

### Agora (Sprint 0.3)

1. ✅ **Executar queries SQL de contagem**:
   ```bash
   psql -U postgres -d conectcrm -f queries-auditoria.sql > auditoria-resultados.txt
   ```

2. ✅ **Criar backup do banco**:
   ```bash
   pg_dump -U postgres -d conectcrm > backup_pre_unificacao_20250118.sql
   ```

3. ✅ **Git tag de segurança**:
   ```bash
   git add .
   git commit -m "docs: auditoria completa Tickets vs Demandas (Sprint 0.1)"
   git tag -a pre-unificacao-tickets -m "Backup antes de unificar Tickets e Demandas"
   git push origin main --tags
   ```

4. ✅ **Escrever migration SQL** (próximo arquivo: `MIGRATION_SQL_UNIFICACAO.md`)

### Depois (Sprint 0.4 - 0.8)

- Testar migration em ambiente dev
- Escrever rollback SQL
- Validar com queries de integridade
- Documentar procedimento de deploy

---

**Status**: ✅ **AUDITORIA COMPLETA**  
**Próximo documento**: `MIGRATION_SQL_UNIFICACAO.md`  
**Próxima ação**: Executar queries de contagem no banco
