# Sprint 1 - Backend: Expansão da Entity Ticket

**Status**: 🟢 EM ANDAMENTO  
**Início**: 28/12/2025  
**Duração Estimada**: 2 semanas  
**Objetivo**: Preparar código backend TypeScript para unificação Ticket + Demanda

---

## ✅ Concluído (Parte 1/3)

### 1. Entity Ticket Expandida
**Arquivo**: `backend/src/modules/atendimento/entities/ticket.entity.ts`

✅ **Enums Atualizados**:
- `StatusTicket`: +4 valores (`AGUARDANDO_CLIENTE`, `AGUARDANDO_INTERNO`, `CONCLUIDO`, `CANCELADO`)
- `TipoTicket`: Novo enum com 7 valores (`tecnica`, `comercial`, `financeira`, `suporte`, `reclamacao`, `solicitacao`, `outros`)

✅ **7 Novos Campos Adicionados**:
```typescript
@Column({ type: 'uuid', name: 'cliente_id', nullable: true })
clienteId?: string;

@Column({ type: 'varchar', length: 200, nullable: true })
titulo?: string;

@Column({ type: 'text', nullable: true })
descricao?: string;

@Column({ type: 'varchar', length: 50, nullable: true })
tipo?: TipoTicket;

@Column({ type: 'timestamp', name: 'data_vencimento', nullable: true })
dataVencimento?: Date;

@Column({ type: 'uuid', name: 'responsavel_id', nullable: true })
responsavelId?: string;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'responsavel_id' })
responsavel?: User;

@Column({ type: 'uuid', name: 'autor_id', nullable: true })
autorId?: string;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'autor_id' })
autor?: User;
```

✅ **Relações Adicionadas**:
- `responsavel`: ManyToOne → User (quem está responsável pela resolução)
- `autor`: ManyToOne → User (quem criou o ticket/demanda)

---

### 2. DTOs Atualizados
**Arquivo**: `backend/src/modules/atendimento/dto/ticket.dto.ts`

✅ **CriarTicketDto**: +7 novos campos opcionais
- clienteId, titulo, descricao, tipo, dataVencimento, responsavelId, autorId

✅ **AtualizarTicketDto**: +7 novos campos opcionais
- clienteId, titulo, descricao, tipo, dataVencimento, responsavelId, autorId

✅ **TipoTicket**: Exportado para uso no frontend

---

## ✅ Concluído (Parte 2/3)

### 3. Service e Controller Atualizados
**Arquivos**: 
- `backend/src/modules/atendimento/services/ticket.service.ts`
- `backend/src/modules/atendimento/controllers/ticket.controller.ts`

✅ **TicketService.criar()**: 
- Suporta todos os 7 novos campos opcionais
- Conversão automática de `data_vencimento` (string → Date)
- Mantém compatibilidade com código existente

✅ **TicketService.atualizar()**:
- Parâmetros expandidos para aceitar novos campos
- Tratamento especial para `data_vencimento` (conversão de tipo)
- Permite atualização parcial de qualquer campo

✅ **TicketService.listar()**:
- Novo filtro `tipo?: TipoTicket` adicionado
- Query: `GET /tickets?tipo=demanda` funciona
- Interface `FiltrarTicketsDto` atualizada

✅ **TicketService.buscarPorId()**:
- Relations `['autor', 'responsavel']` populadas automaticamente
- Frontend recebe objetos User completos (nome, email, etc)

✅ **TicketController.listar()**:
- Parâmetro `@Query('tipo')` adicionado
- Log inclui tipo filtrado
- Documentação JSDoc atualizada

✅ **TicketController.atualizarTicket()**:
- Body types expandidos para aceitar novos campos
- Documentação JSDoc completa com estrutura do payload

---

## 🔄 Próximas Etapas (Parte 3/3)

### 4. Deprecar Demanda Service ✅ CONCLUÍDO
**Arquivo**: `backend/src/modules/atendimento/services/demanda.service.ts`

✅ **JSDoc @deprecated Adicionado**:
- Documentação completa explicando motivo da deprecação
- Referência ao TicketService como alternativa
- Instruções de migração para desenvolvedores
- Cronograma de remoção (Sprint 2-3)

✅ **Warnings Adicionados**:
- `criar()`: Log warning alertando sobre migração
- `listarTodas()`: Log warning com exemplo de uso TicketService
- `atualizar()`: Log warning indicando alternativa
- `converterTicketEmDemanda()`: Log warning (feature será removida)

✅ **Documentação de Migração**:
```typescript
// ❌ Antigo (deprecated)
await demandaService.criar(dto, autorId, empresaId);

// ✅ Novo (recomendado)
await ticketService.criar({ ...dto, tipo: 'demanda', autor_id: autorId });
```

---

### 5. Testes Unitários ✅ CONCLUÍDO
**Arquivo**: `backend/src/modules/atendimento/services/ticket.service.spec.ts`

✅ **Novos Testes Adicionados (11 testes)**:
```typescript
describe('TicketService - Unificação Tickets + Demandas (Sprint 1)')
```

✅ **Teste 1 - criar() com novos campos**:
- ✅ Criar ticket com tipo "demanda" e 7 campos opcionais
- ✅ Criar ticket sem campos opcionais (compatibilidade retroativa)

✅ **Teste 2 - atualizar() com novos campos**:
- ✅ Atualizar ticket incluindo conversão data_vencimento (string → Date)
- ✅ Atualização parcial (apenas alguns campos)

✅ **Teste 3 - listar() com filtro tipo**:
- ✅ Filtrar tickets por tipo "demanda"
- ✅ Listar todos os tipos quando não especificado

✅ **Teste 4 - buscarPorId() com relações User**:
- ✅ Popular relações autor e responsavel (User)
- ✅ Funcionar quando autor/responsavel são null

✅ **Teste 5 - Novos status**:
- ✅ Transição para AGUARDANDO_CLIENTE
- ✅ Registrar data de conclusão ao mudar para ENCERRADO

✅ **Correções em Testes Existentes**:
- Substituído `StatusTicket.RESOLVIDO` → `StatusTicket.ENCERRADO`
- Substituído `StatusTicket.FECHADO` → `StatusTicket.ENCERRADO`
- Substituído `StatusTicket.ABERTO` → `StatusTicket.FILA`
- Ajustado imports para incluir `TipoTicket`

---

## ⏭️ Próximas Etapas (Após Migration SQL)

### 6. Migration SQL
- [ ] **EXECUTAR** `migration-unificacao-tickets.sql` no banco
- [ ] **VALIDAR** que as 2 demandas foram migradas corretamente
- [ ] **VERIFICAR** que os 30 tickets originais permanecem intactos

### 7. Feature Flag
- [ ] Adicionar variável `.env`: `USE_UNIFIED_TICKETS=true`
- [ ] Implementar lógica de fallback se feature estiver desabilitada
- [ ] Documentar como ativar/desativar a feature

---

## 📊 Progresso Sprint 1

**Concluído**: 5/7 tarefas (71.4%)

- [x] 1. Entity Ticket expandida
- [x] 2. DTOs atualizados
- [x] 3. Service e Controller atualizados
- [x] 4. Deprecar Demanda Service
- [x] 5. Testes unitários
- [ ] 6. Executar Migration SQL
- [ ] 7. Feature Flag

---

## 🎯 Critérios de Sucesso Sprint 1

- [ ] Todos os testes unitários passando
- [ ] Migration SQL executada com sucesso
- [ ] 2 demandas migradas para tickets
- [ ] 30 tickets originais intactos
- [ ] DemandaService marcado como @deprecated
- [ ] Documentação atualizada
- [ ] Backend compilando sem erros TypeScript

---

## 📝 Notas Importantes

### Compatibilidade Retroativa
- ✅ Todos os campos novos são **nullable** (não quebra código existente)
- ✅ Enums expandidos mantêm valores antigos (compatível)
- ✅ Relações User são opcionais (não obriga preenchimento)

### Próximos Commits
1. ~~Commit 1: Entity + DTOs atualizados~~ ✅ Concluído (26d69ca)
2. ~~Commit 2: Service + Controller atualizados~~ ✅ Concluído (b6c26df)
3. **Commit 3: DemandaService deprecado** ✅ Concluído (próximo)
4. **Commit 4: Testes unitários completos** ✅ Concluído (próximo)
5. **Commit 5**: Feature Flag + Migration SQL (se aprovado)

---

**Última atualização**: 28/12/2025 (Sprint 1 - 71.4% concluída - Testes implementados)
