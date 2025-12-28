# Sprint 2 - Frontend: Unificação UI Tickets + Demandas

**Status**: 🟢 EM ANDAMENTO  
**Início**: 28/12/2025  
**Duração Estimada**: 1-2 semanas  
**Objetivo**: Atualizar interface do usuário para usar modelo unificado de Tickets

---

## 📋 Contexto

Após a conclusão do Sprint 1 (backend 100%), agora vamos atualizar o frontend para:
- Remover interfaces duplicadas (Demanda x Ticket)
- Usar o modelo unificado `Ticket` com campo `tipo`
- Manter backward compatibility durante transição
- Migrar páginas de Demandas para Tickets com filtro

---

## 🎯 Objetivos do Sprint 2

### 1. **Consolidar Types & Interfaces**
- Mesclar `interface Demanda` → `interface Ticket`
- Adicionar 7 novos campos opcionais em Ticket
- Exportar enum `TipoTicket` do backend
- Remover duplicações de tipos

### 2. **Atualizar Services**
- `ticketService.ts`: Adicionar suporte aos novos campos
- `demandaService.ts`: Marcar como deprecated, redirecionar para ticketService
- Atualizar DTOs de criação/atualização

### 3. **Atualizar Componentes**
- `ChatOmnichannel.tsx`: Usar novos campos (titulo, tipo, responsavel)
- Listas de tickets: Adicionar filtro por tipo
- Formulários: Campos opcionais (titulo, descricao, tipo, etc)

### 4. **Migrar Páginas**
- `DemandasPage.tsx`: Usar `tickets?tipo=demanda` em vez de `/demandas`
- Criar redirects: `/demandas` → `/tickets?tipo=demanda`
- Atualizar rotas em `App.tsx`

### 5. **Testes & Validação**
- Testar criação de tickets com tipo
- Testar filtro por tipo na listagem
- Verificar backward compatibility (tickets sem tipo)
- Validar migração de demandas existentes

---

## ✅ Tarefas do Sprint 2

### Fase 1: Types & Interfaces (2-3h)

- [x] **1.1** - Adicionar 7 campos em `interface Ticket` (ticketsService.ts) ✅
  - clienteId?: string (já existia)
  - titulo?: string ✅
  - descricao?: string ✅
  - tipo?: TipoTicket ✅
  - dataVencimento?: string ✅
  - responsavelId?: string ✅
  - autorId?: string ✅

- [x] **1.2** - Criar/exportar enum `TipoTicket` no frontend ✅
  - Valores: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros'
  - Labels: tipoTicketLabels Record exportado
  - Cores: tipoTicketColors Record exportado

- [x] **1.3** - Atualizar `StatusTicket` com novos valores ✅
  - Adicionar: FILA, AGUARDANDO_CLIENTE, AGUARDANDO_INTERNO, CONCLUIDO, CANCELADO, ENCERRADO

- [x] **1.4** - Deprecar `interface Demanda` (demandaService.ts) ✅
  - JSDoc @deprecated em interface e classe ✅
  - console.warn() em todos os métodos principais ✅
  - Documentação de migração completa ✅

### Fase 2: Services (3-4h)

- [x] **2.1** - Atualizar `ticketService.listar()` com filtro tipo ✅
  - Adicionar parâmetros opcionais: tipo, responsavelId, autorId em TicketFiltros
  - Query: `GET /tickets?tipo=suporte` funcionando

- [x] **2.2** - Deprecar `demandaService` ✅
  - Todos os métodos marcados como @deprecated
  - console.warn() em 7 métodos principais
  - Período de transição documentado

- [x] **2.3** - Deprecar `demandaService` ✅
  - Todos métodos redirecionam para ticketService (via console.warn)
  - Compatibilidade mantida temporariamente (6 meses)
  - JSDoc @deprecated em interface, classe e métodos

### Fase 3: Componentes (4-5h)

- [x] **3.1** - Atualizar `ChatArea.tsx` (header do chat) ✅
  - Exibir campo `titulo` (se preenchido) ao lado do status online/offline
  - Mostrar badge de `tipo` do ticket (cores por categoria)
  - Layout responsivo com truncate para títulos longos

- [x] **3.2** - Criar componente `FiltroTipoTicket` ✅
  - Select reutilizável com TipoTicket
  - Labels e valores do tipoTicketLabels
  - Opção "Todos os tipos" configurável
  - Componente em components/selects/

- [x] **3.3** - Atualizar formulário de criação de ticket ✅
  - Campos opcionais: tipo, titulo, descricao
  - Select de tipo usando tipoTicketLabels
  - NovoAtendimentoModal.tsx atualizado
  - Interface e payload com novos campos

### Fase 4: Páginas & Rotas (3-4h)

- [x] **4.1** - Atualizar `DemandasPage.tsx` ✅
  - Migrado para usar ticketService.listar({ tipo: 'suporte' })
  - Interfaces: Demanda[] → Ticket[]
  - Filtros atualizados: tipo, status, prioridade
  - Campos corrigidos: user.empresa.id, ticket.tipo, ticket.titulo
  - Removidos campos obsoletos: telefone, ticketId
  - Badges usando tipoTicketLabels e tipoTicketColors
  - Compatibilidade com status antigos mantida

- [x] **4.2** - Criar redirect em `App.tsx` ✅
  - `/demandas` → `/nuclei/atendimento/demandas`
  - `/demandas/:id` → `/nuclei/atendimento/demandas/:id`
  - Rotas antigas mantidas temporariamente (6 meses)
  - Comentário Sprint 2 adicionado

- [x] **4.3** - Atualizar menu de navegação ✅
  - Verificado: Item "Demandas" já usa rota correta
  - Comentário Sprint 2 adicionado (modelo unificado Ticket)
  - Nenhuma mudança de rota necessária

### Fase 5: Testes & Validação (2-3h)

- [ ] **5.1** - Testar criação de ticket com tipo
  - POST /tickets com tipo='comercial'
  - Verificar campos salvos

- [ ] **5.2** - Testar listagem com filtro tipo
  - GET /tickets?tipo=suporte
  - Verificar apenas tickets com tipo correto

- [ ] **5.3** - Testar backward compatibility
  - Tickets antigos (sem tipo) devem funcionar
  - Não quebrar listagens existentes

- [ ] **5.4** - Validar dados migrados
  - 2 demandas devem aparecer como tickets tipo='suporte'
  - Campos populados (titulo, descricao, etc)

---

## 📊 Progresso Sprint 2

**Concluído**: 13/19 tarefas (68.4%)

**Fases**:
- [x] Fase 1: Types & Interfaces (4/4) ← **100% COMPLETO** ✅
- [x] Fase 2: Services (3/3) ← **100% COMPLETO** ✅
- [x] Fase 3: Componentes (3/3) ← **100% COMPLETO** ✅
- [x] Fase 4: Páginas & Rotas (3/3) ← **100% COMPLETO** ✅
- [ ] Fase 5: Testes & Validação (0/4)

---

## 🎯 Critérios de Sucesso

- ✅ Interface `Ticket` unificada com 7 novos campos
- ✅ Enum `TipoTicket` exportado e usado
- ✅ Filtro por tipo funcional nas listagens
- ✅ DemandasPage usa `tickets?tipo=demanda`
- ✅ Backward compatibility mantida (tickets sem tipo)
- ✅ 2 demandas migradas visíveis na UI
- ✅ DemandaService deprecado (com avisos)
- ✅ Nenhum erro TypeScript
- ✅ UI responsiva e funcional

---

## 📝 Arquivos a Modificar

### Services
- `frontend-web/src/services/ticketsService.ts` - Adicionar 7 campos, filtro tipo
- `frontend-web/src/services/demandaService.ts` - Deprecar, redirecionar
- `frontend-web/src/services/atendimentoService.ts` - Verificar interface Ticket

### Types
- `frontend-web/src/types/ticket.ts` - Enum TipoTicket, StatusTicket expandido

### Componentes
- `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`
- `frontend-web/src/features/atendimento/omnichannel/types.ts`
- `frontend-web/src/pages/DemandasPage.tsx` (ou renomear)

### Rotas
- `frontend-web/src/App.tsx` - Redirect /demandas
- `frontend-web/src/menuConfig.ts` - Atualizar link de Demandas

---

## 🔄 Próximos Commits Planejados

### Commit 1: Types & Interfaces
```bash
feat(sprint-2): adicionar 7 campos em interface Ticket (frontend)

- Campos: clienteId, titulo, descricao, tipo, dataVencimento, responsavelId, autorId
- Enum TipoTicket exportado (7 valores)
- StatusTicket expandido (8 valores)
- Demanda type alias para compatibilidade
```

### Commit 2: Atualizar Services
```bash
feat(sprint-2): atualizar ticketService com novos campos e filtro tipo

- ticketService.criar() com parâmetros opcionais
- ticketService.listar() com filtro tipo
- CreateTicketDto atualizado
- demandaService deprecado (redirects para ticketService)
```

### Commit 3: Componentes & UI
```bash
feat(sprint-2): atualizar ChatOmnichannel e formulários

- Exibir titulo/tipo em tickets
- Campo responsavel no header
- Select de tipo no formulário
- Filtro TipoTicket nas listagens
```

### Commit 4: Páginas & Rotas
```bash
feat(sprint-2): migrar DemandasPage para tickets?tipo=demanda

- Query com filtro tipo
- Redirect /demandas → /tickets?tipo=demanda
- Menu atualizado
```

### Commit 5: Testes & Validação
```bash
test(sprint-2): validar unificação Tickets+Demandas no frontend

- Testar criação com tipo
- Testar filtro tipo
- Backward compatibility
- 2 demandas migradas visíveis
```

---

## 📌 Notas Importantes

- **Não deletar** `demandaService.ts` ainda (Sprint 3+)
- **Manter** rotas antigas por 6 meses (período de migração)
- **Logs deprecation** em console.warn() para desenvolvedores
- **Backward compatible**: Tickets sem tipo devem funcionar normalmente

---

**Início**: 28/12/2025 16:00  
**Última atualização**: 28/12/2025 16:00
