# 🔍 Auditoria Completa: Tickets vs Demandas

**Data**: 2025-01-18  
**Sprint**: Sprint 0 - Preparação  
**Objetivo**: Mapear todas as diferenças entre Ticket e Demanda para planejar unificação

---

## 📊 Comparação de Campos (Entity-Level)

### Campos COMUNS (Existem em AMBAS)

| Campo | Ticket | Demanda | Observação |
|-------|--------|---------|------------|
| `id` | UUID (PK) | UUID (PK) | ✅ Mesmo tipo |
| `empresaId` | UUID (required) | UUID (required) | ✅ Multi-tenant |
| `status` | Enum (4 valores) | Type (5 valores) | ⚠️ **CONFLITO**: diferentes valores |
| `prioridade` | Enum (4 valores) | Type (4 valores) | ⚠️ **CONFLITO**: mesmos valores, tipos diferentes |
| `createdAt` | Timestamp | Timestamp | ✅ Mesmo tipo |
| `updatedAt` | Timestamp | Timestamp | ✅ Mesmo tipo |
| `contatoTelefone` | VARCHAR(20) | VARCHAR(20) | ✅ Mesmo tipo |

---

### Campos EXCLUSIVOS de TICKET

| Campo | Tipo | Nullable | Descrição | Ação na Unificação |
|-------|------|----------|-----------|-------------------|
| `numero` | INTEGER | ✅ | Número sequencial do ticket | ✅ **MANTER** - essencial para referência |
| `assunto` | VARCHAR(255) | ✅ | Assunto resumido | ⚠️ **MESCLAR com `titulo`** (Demanda usa `titulo`) |
| `severity` | Enum (4 níveis) | ✅ | Severidade técnica (BAIXA, MEDIA, ALTA, CRITICA) | ✅ **MANTER** - importante para Service Desk |
| `assignedLevel` | Enum (N1/N2/N3) | ❌ | Nível de suporte atribuído | ✅ **MANTER** - escalação técnica |
| `escalationReason` | VARCHAR(255) | ✅ | Motivo da escalação | ✅ **MANTER** - rastreabilidade |
| `escalationAt` | TIMESTAMP | ✅ | Data/hora da escalação | ✅ **MANTER** - SLA tracking |
| `slaTargetMinutes` | INTEGER | ✅ | Meta de SLA em minutos | ✅ **MANTER** - crítico para Service Desk |
| `slaExpiresAt` | TIMESTAMP | ✅ | Data/hora de vencimento SLA | ✅ **MANTER** - alertas automáticos |
| `canalId` | UUID | ✅ | Canal de origem (WhatsApp, Email, etc) | ✅ **MANTER** - roteamento omnichannel |
| `filaId` | UUID | ✅ | Fila de atendimento | ✅ **MANTER** - distribuição de carga |
| `fila` | Relation | ✅ | Relação ManyToOne com Fila | ✅ **MANTER** |
| `atendenteId` | UUID | ✅ | Atendente responsável | ⚠️ **MESCLAR com `responsavelId`** |
| `departamentoId` | UUID | ✅ | Departamento responsável | ✅ **MANTER** - organização hierárquica |
| `contatoNome` | VARCHAR(255) | ✅ | Nome do contato | ✅ **MANTER** - pode não ter cliente cadastrado |
| `contatoEmail` | VARCHAR(255) | ✅ | Email do contato | ✅ **MANTER** - comunicação assíncrona |
| `contatoFoto` | VARCHAR(512) | ✅ | URL da foto do perfil | ✅ **MANTER** - UX melhor |
| `data_abertura` | TIMESTAMP | ✅ | Data de abertura do ticket | ✅ **MANTER** - diferente de `createdAt` |
| `data_primeira_resposta` | TIMESTAMP | ✅ | Primeira resposta do atendente | ✅ **MANTER** - SLA de resposta |
| `data_resolucao` | TIMESTAMP | ✅ | Data de resolução técnica | ⚠️ **MESCLAR com `dataConclusao`** |
| `data_fechamento` | TIMESTAMP | ✅ | Data de encerramento definitivo | ✅ **MANTER** - pode reabrir após resolver |
| `ultima_mensagem_em` | TIMESTAMP | ✅ | Timestamp da última mensagem | ✅ **MANTER** - ordernação chat |
| `tags` | Relation M2M | ❌ | Tags do ticket | ✅ **MANTER** - categorização flexível |

**Total**: 22 campos exclusivos de Ticket

---

### Campos EXCLUSIVOS de DEMANDA

| Campo | Tipo | Nullable | Descrição | Ação na Unificação |
|-------|------|----------|-----------|-------------------|
| `clienteId` | UUID | ✅ | ID do cliente relacionado | ✅ **ADICIONAR ao Ticket** - essencial |
| `ticketId` | UUID | ✅ | ID do ticket pai | ❌ **REMOVER** - será desnecessário após unificar |
| `titulo` | VARCHAR(200) | ❌ | Título da demanda | ⚠️ **MESCLAR com `assunto`** |
| `descricao` | TEXT | ✅ | Descrição detalhada | ✅ **ADICIONAR ao Ticket** - contexto rico |
| `tipo` | Type (7 valores) | ❌ | Tipo: tecnica, comercial, financeira, suporte, reclamacao, solicitacao, outros | ✅ **ADICIONAR ao Ticket** - categorização |
| `dataVencimento` | TIMESTAMP | ✅ | Data limite | ✅ **ADICIONAR ao Ticket** - deadline tracking |
| `dataConclusao` | TIMESTAMP | ✅ | Data de conclusão | ⚠️ **MESCLAR com `data_resolucao`** |
| `responsavelId` | UUID | ✅ | ID do responsável | ⚠️ **MESCLAR com `atendenteId`** |
| `responsavel` | Relation | ✅ | Relação com User | ⚠️ **MESCLAR** |
| `autorId` | UUID | ❌ | Quem criou a demanda | ✅ **ADICIONAR ao Ticket** - rastreabilidade |
| `autor` | Relation | ❌ | Relação com User | ✅ **ADICIONAR ao Ticket** |

**Total**: 11 campos exclusivos de Demanda

---

## ⚠️ Conflitos de Nomenclatura

### Conflito 1: Status

**Ticket (Enum)**:
- `FILA` - Aguardando distribuição
- `EM_ATENDIMENTO` - Em atendimento ativo
- `ENVIO_ATIVO` - Cliente está digitando/aguardando resposta
- `ENCERRADO` - Finalizado

**Demanda (Type)**:
- `aberta` - Nova demanda
- `em_andamento` - Sendo trabalhada
- `aguardando` - Aguardando algo externo
- `concluida` - Finalizada com sucesso
- `cancelada` - Cancelada sem conclusão

**Decisão**: 
- ✅ **Expandir** StatusTicket para incluir valores de Demanda
- ✅ **Adicionar** `AGUARDANDO_CLIENTE`, `CONCLUIDO`, `CANCELADO`
- ✅ **Manter** compatibilidade com status atuais

**Enum Final Proposto**:
```typescript
export enum StatusTicket {
  // Status de Chat/Atendimento (mantidos)
  FILA = 'FILA',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  ENVIO_ATIVO = 'ENVIO_ATIVO',
  ENCERRADO = 'ENCERRADO',
  
  // Novos status de Demanda
  AGUARDANDO_CLIENTE = 'AGUARDANDO_CLIENTE',
  AGUARDANDO_INTERNO = 'AGUARDANDO_INTERNO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}
```

### Conflito 2: Prioridade

**Ticket (Enum MAIÚSCULO)**:
- `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`

**Demanda (Type minúsculo)**:
- `baixa`, `media`, `alta`, `urgente`

**Decisão**: 
- ✅ **Padronizar** para MAIÚSCULO (padrão Enum TypeScript)
- ⚠️ **Migração necessária**: converter lowercase → UPPERCASE

### Conflito 3: Título vs Assunto

- **Ticket**: `assunto` (VARCHAR 255, nullable)
- **Demanda**: `titulo` (VARCHAR 200, required)

**Decisão**:
- ✅ **Renomear** `assunto` → `titulo` (mais semântico)
- ✅ **Tornar obrigatório** (NOT NULL)
- ⚠️ **Migração**: copiar `assunto` → `titulo`, preencher nulls com "Sem título"

### Conflito 4: Responsável vs Atendente

- **Ticket**: `atendenteId` (atendente do chat)
- **Demanda**: `responsavelId` (responsável pela task)

**Decisão**:
- ✅ **MANTER AMBOS**!
  - `atendenteId` → quem atende o chat
  - `responsavelId` → quem executa a tarefa (pode ser diferente!)
- **Exemplo**: Atendente N1 cria ticket, escalona para técnico N3 (responsável)

---

## 📐 Estrutura Final Proposta (Entity Unificada)

```typescript
@Entity('atendimento_tickets')
export class Ticket {
  // ===== IDENTIFICAÇÃO =====
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', nullable: false })
  numero: number;  // Sequencial auto-increment

  @Column({ type: 'varchar', length: 200, nullable: false })
  titulo: string;  // RENOMEADO de 'assunto'

  @Column({ type: 'text', nullable: true })
  descricao: string;  // NOVO - de Demanda

  // ===== CLASSIFICAÇÃO =====
  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: TipoTicket;  // NOVO - de Demanda (tecnica, comercial, etc)

  @Column({ type: 'varchar', length: 20, default: StatusTicket.FILA })
  status: StatusTicket;  // EXPANDIDO (8 valores)

  @Column({ type: 'varchar', length: 20, default: PrioridadeTicket.MEDIA })
  prioridade: PrioridadeTicket;

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: SeveridadeTicket;

  @Column({ type: 'varchar', length: 10, default: 'N1' })
  assignedLevel: NivelAtendimentoTicket;

  // ===== RELACIONAMENTOS =====
  @Column({ type: 'uuid', nullable: false })
  empresaId: string;

  @Column({ type: 'uuid', nullable: true })
  clienteId: string;  // NOVO - de Demanda

  @Column({ type: 'uuid', nullable: true })
  canalId: string;

  @Column({ type: 'uuid', nullable: true })
  filaId: string;

  @ManyToOne(() => Fila)
  fila: Fila;

  @Column({ type: 'uuid', nullable: true })
  departamentoId: string;

  @Column({ type: 'uuid', nullable: true })
  atendenteId: string;  // Quem atende o chat

  @Column({ type: 'uuid', nullable: true })
  responsavelId: string;  // NOVO - quem executa a tarefa

  @ManyToOne(() => User)
  responsavel: User;  // NOVO

  @Column({ type: 'uuid', nullable: false })
  autorId: string;  // NOVO - quem criou

  @ManyToOne(() => User)
  autor: User;  // NOVO

  // ===== CONTATO =====
  @Column({ type: 'varchar', length: 20, nullable: true })
  contatoTelefone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contatoNome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contatoEmail: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  contatoFoto: string;

  // ===== SLA & ESCALAÇÃO =====
  @Column({ type: 'integer', nullable: true })
  slaTargetMinutes: number;

  @Column({ type: 'timestamp', nullable: true })
  slaExpiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  escalationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  escalationAt: Date;

  // ===== DATAS =====
  @Column({ type: 'timestamp', nullable: true })
  dataAbertura: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataPrimeiraResposta: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataVencimento: Date;  // NOVO - de Demanda

  @Column({ type: 'timestamp', nullable: true })
  dataResolucao: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataFechamento: Date;

  @Column({ type: 'timestamp', nullable: true })
  ultimaMensagemEm: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== TAGS =====
  @ManyToMany(() => Tag)
  @JoinTable({ name: 'ticket_tags' })
  tags: Tag[];
}
```

**Total de campos**: 36 campos (vs 22 Ticket + 11 Demanda originais)

---

## 🔢 Estatísticas do Banco de Dados

### Consultas SQL para Auditoria

```sql
-- 1. Contar registros de Tickets
SELECT COUNT(*) AS total_tickets FROM atendimento_tickets;

-- 2. Contar registros de Demandas
SELECT COUNT(*) AS total_demandas FROM atendimento_demandas;

-- 3. Ver distribuição de status - Tickets
SELECT status, COUNT(*) as quantidade 
FROM atendimento_tickets 
GROUP BY status 
ORDER BY quantidade DESC;

-- 4. Ver distribuição de status - Demandas
SELECT status, COUNT(*) as quantidade 
FROM atendimento_demandas 
GROUP BY status 
ORDER BY quantidade DESC;

-- 5. Verificar demandas vinculadas a tickets
SELECT COUNT(*) as demandas_com_ticket 
FROM atendimento_demandas 
WHERE ticket_id IS NOT NULL;

-- 6. Verificar tickets sem assunto (nulls)
SELECT COUNT(*) as tickets_sem_assunto 
FROM atendimento_tickets 
WHERE assunto IS NULL;

-- 7. Verificar demandas por tipo
SELECT tipo, COUNT(*) as quantidade 
FROM atendimento_demandas 
GROUP BY tipo 
ORDER BY quantidade DESC;

-- 8. Verificar prioridades - Tickets
SELECT prioridade, COUNT(*) as quantidade 
FROM atendimento_tickets 
GROUP BY prioridade;

-- 9. Verificar prioridades - Demandas (lowercase)
SELECT prioridade, COUNT(*) as quantidade 
FROM atendimento_demandas 
GROUP BY prioridade;

-- 10. Verificar relacionamento Fila
SELECT f.nome, COUNT(t.id) as total_tickets
FROM atendimento_tickets t
LEFT JOIN atendimento_filas f ON t.fila_id = f.id
GROUP BY f.nome;
```

**⚠️ EXECUTAR ESTAS QUERIES ANTES DE QUALQUER MIGRATION!**

---

## 📂 Mapeamento de Dependências

### Arquivos que USAM Ticket Entity

```bash
# Buscar imports de Ticket
grep -r "import.*Ticket.*from.*ticket.entity" backend/src/ --include="*.ts"
```

**Esperado**:
- `ticket.service.ts`
- `ticket.controller.ts`
- `mensagem.entity.ts` (relacionamento)
- `atendimento.module.ts` (registro no TypeORM)
- `database.config.ts` (lista de entities)
- `*.dto.ts` (DTOs que usam StatusTicket)

### Arquivos que USAM Demanda Entity

```bash
# Buscar imports de Demanda
grep -r "import.*Demanda.*from.*demanda.entity" backend/src/ --include="*.ts"
```

**Esperado**:
- `demanda.service.ts`
- `demanda.controller.ts`
- `atendimento.module.ts`
- `database.config.ts`
- `*.dto.ts`

### Frontend que Consome Demandas

```bash
# Buscar no frontend
grep -r "demanda" frontend-web/src/ --include="*.tsx" --include="*.ts"
```

**Esperado**:
- `demandaService.ts` (API calls)
- `*DemandaPage.tsx` (páginas de gestão)
- Tipos/interfaces TypeScript

---

## 🚨 Riscos Identificados

### Risco 1: Dados de Produção
- ⚠️ **CRÍTICO**: Banco pode ter tickets/demandas de PRODUÇÃO
- ✅ **Mitigação**: Backup COMPLETO antes de qualquer migration
- ✅ **Rollback**: Script de reversão testado

### Risco 2: Status Incompatíveis
- ⚠️ **ALTO**: Demandas usam lowercase (`aberta`), Tickets usam UPPERCASE (`FILA`)
- ✅ **Mitigação**: Migration com ALTER TYPE + UPDATE
- ⚠️ **Impacto**: Frontend precisa atualizar tipos

### Risco 3: Foreign Keys
- ⚠️ **MÉDIO**: `demanda.ticketId` aponta para tickets
- ✅ **Mitigação**: Preservar relacionamento na migration
- ⚠️ **Decisão**: Após unificar, ticketId vira redundante

### Risco 4: Null Constraints
- ⚠️ **MÉDIO**: `assunto` é nullable, `titulo` não é
- ✅ **Mitigação**: Preencher nulls antes de tornar NOT NULL
- ⚠️ **Script**: `UPDATE ... SET titulo = 'Sem título' WHERE titulo IS NULL`

### Risco 5: Controllers Duplicados
- ⚠️ **MÉDIO**: 2 controllers, 2 services, 2 DTOs
- ✅ **Mitigação**: Manter ambos funcionando durante transição
- ⚠️ **Deprecação gradual**: Marcar Demanda como @deprecated

---

## ✅ Checklist de Segurança

Antes de QUALQUER migration:

- [ ] **Backup do banco completo**
  ```bash
  pg_dump -U postgres -d conectcrm > backup_pre_unificacao_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Git tag de segurança**
  ```bash
  git tag -a pre-unificacao-tickets -m "Backup antes de unificar Tickets e Demandas"
  git push origin pre-unificacao-tickets
  ```

- [ ] **Executar queries de auditoria** (seção anterior)

- [ ] **Salvar output das queries** em arquivo `.txt`

- [ ] **Contar registros totais**:
  - Total de Tickets: `______`
  - Total de Demandas: `______`
  - Demandas com ticket_id: `______`

- [ ] **Verificar espaço em disco** (migrations podem duplicar dados temporariamente)

- [ ] **Testar script de rollback** em ambiente de dev

- [ ] **Documentar credenciais de acesso** ao banco (se precisar restaurar)

- [ ] **Notificar equipe** sobre manutenção programada

---

## 📅 Próximos Passos

### Sprint 0 (Atual) - Preparação

- [x] **0.1.1** - Ler entities Ticket e Demanda ✅
- [x] **0.1.2** - Mapear campos e conflitos ✅
- [ ] **0.1.3** - Executar queries de auditoria (próximo passo)
- [ ] **0.1.4** - Salvar output das queries
- [ ] **0.1.5** - Buscar dependências (grep import)
- [ ] **0.1.6** - Listar controllers/services/DTOs
- [ ] **0.2.1** - Criar backup do banco
- [ ] **0.2.2** - Criar git tag
- [ ] **0.3.1** - Escrever script de migration (expansão de Ticket)
- [ ] **0.3.2** - Escrever script de rollback
- [ ] **0.3.3** - Revisar com equipe

### Sprint 1 - Expansão Backend

- [ ] **1.1** - Adicionar novos campos em Ticket (migration)
- [ ] **1.2** - Expandir StatusTicket enum
- [ ] **1.3** - Criar TipoTicket enum
- [ ] **1.4** - Atualizar DTOs
- [ ] **1.5** - Marcar Demanda como @deprecated

### Sprint 2 - Migration de Dados

- [ ] **2.1** - Script de cópia Demanda → Ticket
- [ ] **2.2** - Validar integridade referencial
- [ ] **2.3** - Testes de regressão
- [ ] **2.4** - Atualizar frontend para novo modelo

---

## 📝 Notas da Análise

### Observações Importantes

1. **Ticket é mais completo** para Chat/Atendimento:
   - Tem campos de SLA (slaTargetMinutes, slaExpiresAt)
   - Tem severidade e nível de escalação (N1/N2/N3)
   - Tem dados de canal e fila (omnichannel)
   - Tem timestamps detalhados (abertura, primeira_resposta, resolução, fechamento)
   - Tem tags (Many-to-Many)

2. **Demanda é mais simples** mas tem valor:
   - Campo `descricao` (TEXT) - mais espaço que VARCHAR
   - Campo `tipo` - categorização semântica
   - Campo `dataVencimento` - deadline tracking
   - Relações com `autor` e `responsavel` - rastreabilidade
   - Campo `clienteId` - vínculo direto com cliente

3. **Melhor estratégia**: **EXPANDIR Ticket** (não criar nova entity)
   - Ticket já tem toda infraestrutura de atendimento
   - Adicionar campos de Demanda que faltam
   - Migrar dados de Demanda → Ticket
   - Deprecar Demanda gradualmente

4. **Status precisa cobrir ambos os casos**:
   - Chat: FILA → EM_ATENDIMENTO → ENCERRADO
   - Tarefa: ABERTA → EM_ANDAMENTO → AGUARDANDO → CONCLUIDO

5. **Não remover Demanda imediatamente**:
   - Manter tabela durante transição
   - Frontend pode ter código legado
   - Possibilitar rollback fácil

---

## 🎯 Decisões Arquiteturais

### Decisão 1: Entity Única vs Herança

**Avaliado**:
- Opção A: `Ticket` base + `DemandaTicket` (herança)
- Opção B: Entity única `Ticket` com campos opcionais
- Opção C: Duas entities separadas (status atual)

**Escolhido**: **Opção B** (Entity única expandida)

**Motivos**:
- ✅ Simplicidade de queries (1 tabela = 1 query)
- ✅ Facilita relatórios unificados
- ✅ Evita JOINs desnecessários
- ✅ Mais próximo do padrão Movidesk
- ✅ Campos nullable não geram overhead significativo

### Decisão 2: Migração Big Bang vs Gradual

**Avaliado**:
- Opção A: Migrar todos os dados de uma vez (Big Bang)
- Opção B: Manter ambas as entities durante 1-2 sprints

**Escolhido**: **Opção B** (Gradual)

**Motivos**:
- ✅ Permite testes em produção sem risco
- ✅ Frontend pode ser atualizado por partes
- ✅ Rollback mais fácil se houver problemas
- ✅ Equipe pode se adaptar gradualmente
- ⚠️ Requer manutenção de 2 services temporariamente

### Decisão 3: Nome do Campo (titulo vs assunto)

**Avaliado**:
- `titulo` (de Demanda)
- `assunto` (de Ticket)
- `titulo` e `assunto` (ambos)

**Escolhido**: **titulo** (renomear assunto → titulo)

**Motivos**:
- ✅ Mais semântico e universal
- ✅ `titulo` é NOT NULL (força melhor prática)
- ✅ Padrão da indústria (Jira, Zendesk usam "title/titulo")
- ✅ Evita confusão com "subject" de email

---

**Documento gerado automaticamente pela auditoria da Sprint 0**  
**Próximo arquivo**: `BACKUP_SEGURANCA.md` (após executar queries SQL)
