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

## 🔄 Próximas Etapas (Parte 2/3)

### 3. Service e Controller
- [ ] Atualizar `TicketService` para lidar com novos campos
- [ ] Adicionar validações de negócio (ex: tipo obrigatório se tem descrição)
- [ ] Atualizar métodos `create()` e `update()` para popular relações User
- [ ] Adicionar filtros por `tipo` no método `findAll()`

### 4. Deprecar Demanda Service
- [ ] Adicionar decorator `@deprecated` em `DemandaService`
- [ ] Adicionar comentários JSDoc explicando a migração
- [ ] Criar wrapper methods que redirecionam para TicketService
- [ ] Adicionar warnings em logs quando DemandaService for usado

### 5. Testes Unitários
- [ ] `ticket.service.spec.ts`: Testar criação com novos campos
- [ ] Testar relações User (autor e responsavel)
- [ ] Testar enum TipoTicket
- [ ] Testar novos status (AGUARDANDO_CLIENTE, CONCLUIDO, etc)

---

## ⏭️ Próximas Etapas (Parte 3/3 - Após Migration SQL)

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

**Concluído**: 2/7 tarefas (28.6%)

- [x] 1. Entity Ticket expandida
- [x] 2. DTOs atualizados
- [ ] 3. Service e Controller
- [ ] 4. Deprecar Demanda Service
- [ ] 5. Testes unitários
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
1. **Commit atual**: Entity + DTOs atualizados
2. **Próximo commit**: Service + Controller + Testes
3. **Commit final**: Deprecation + Feature Flag

---

**Última atualização**: 28/12/2025 (Sprint 1 - Parte 1/3 concluída)
