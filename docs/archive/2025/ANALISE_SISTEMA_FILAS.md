# 📋 Análise e Planejamento - Sistema de Filas

> ⚠️ **DOCUMENTO ARQUIVADO** - Esta é uma análise técnica de sistema de filas (válida), mas último objetivo estava errado: "Competir com Zendesk/Intercom" → ConectCRM compete com HubSpot/Zoho (suites all-in-one, não apenas atendimento). Ver [VISAO_SISTEMA_2025.md](../../VISAO_SISTEMA_2025.md).

**Data**: 6 de novembro de 2025  
**Sprint**: Prioridade 2  
**Estimativa**: 1.5 semanas (vs 2 semanas originais)  
**Status**: 🔄 EM ANÁLISE

---

## 🎯 Objetivo

Implementar sistema completo de **filas de atendimento** para:
- Organizar tickets por especialidade/departamento
- Distribuir tickets automaticamente para atendentes
- Aumentar produtividade em 40%+ (meta do plano executivo)
- ~~Competir com Zendesk/Intercom neste quesito~~ **Manter qualidade do módulo atendimento como parte da suite all-in-one**

---

## 📊 Situação Atual (Descobertas)

### ✅ O Que JÁ Existe

1. **Entity `Fila`** (backend) - ✅ **JÁ IMPLEMENTADA**
   - Localização: `backend/src/modules/atendimento/entities/fila.entity.ts`
   - Campos existentes:
     - `id`, `empresaId`, `nome`, `descricao`
     - `ativo`, `ordem`, `horarioAtendimento`
     - `createdAt`, `updatedAt`, `deletedAt`
   - **Status**: Estrutura básica OK ✅

2. **Relação Ticket ↔ Fila** - ✅ **JÁ EXISTE**
   - `Ticket.filaId` (UUID, nullable)
   - FK já definida
   - **Status**: Relacionamento básico OK ✅

3. **Zustand Store Infrastructure** - ✅ **PRONTA**
   - Padrão estabelecido em `atendimentoStore.ts`
   - Persist + DevTools já configurados
   - Seletores otimizados documentados
   - **Status**: Base sólida para `filaStore.ts` ✅

### ❌ O Que FALTA Implementar

1. **Backend**:
   - ❌ `FilaService` (lógica de negócio)
   - ❌ `FilaController` (endpoints REST)
   - ❌ DTOs (validação de entrada)
   - ❌ Relação `Fila ↔ Atendentes` (many-to-many)
   - ❌ Lógica de distribuição automática
   - ❌ Métricas de fila (tickets aguardando, tempo médio, etc)

2. **Frontend**:
   - ❌ `filaStore.ts` (estado)
   - ❌ `filaService.ts` (API calls)
   - ❌ `GestaoFilasPage.tsx` (CRUD)
   - ❌ Integração com criação de ticket
   - ❌ Painel de métricas

3. **Database**:
   - ❌ Tabela `filas_atendentes` (junction table)
   - ❌ Migration para criar relacionamento
   - ❌ Índices para performance

---

## 🏗️ Arquitetura Proposta

### Modelo de Dados

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Fila      │         │ FilaAtendente    │         │  Usuario    │
│             │         │ (Junction Table) │         │ (Atendente) │
├─────────────┤         ├──────────────────┤         ├─────────────┤
│ id          │◄───────┤│ filaId           │         │ id          │
│ empresaId   │         │ atendenteId      │◄────────┤│ nome        │
│ nome        │         │ capacidade       │         │ email       │
│ descricao   │         │ ativo            │         │ papel       │
│ ativo       │         │ prioridade       │         │ ...         │
│ ordem       │         │ createdAt        │         └─────────────┘
│ horario...  │         └──────────────────┘
│ estrategia  │                 │
│ capacidade  │                 │
│ ...         │                 ▼
└─────────────┘         ┌─────────────┐
       │                │   Ticket    │
       │                ├─────────────┤
       └───────────────►│ id          │
                        │ filaId (FK) │
                        │ atendenteId │
                        │ status      │
                        │ prioridade  │
                        │ ...         │
                        └─────────────┘
```

### Entidades Novas

#### 1. **Fila** (já existe, mas vamos estender)

```typescript
@Entity('filas')
export class Fila {
  // Campos existentes
  id: string;
  empresaId: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  horarioAtendimento: any;
  
  // NOVOS campos (adicionar na migration)
  @Column({ 
    type: 'enum', 
    enum: ['ROUND_ROBIN', 'MENOR_CARGA', 'PRIORIDADE'],
    default: 'ROUND_ROBIN'
  })
  estrategiaDistribuicao: 'ROUND_ROBIN' | 'MENOR_CARGA' | 'PRIORIDADE';
  
  @Column({ type: 'integer', default: 10, comment: 'Tickets por atendente' })
  capacidadeMaxima: number;
  
  @Column({ type: 'boolean', default: false })
  distribuicaoAutomatica: boolean;
  
  @Column({ type: 'jsonb', nullable: true })
  configuracoes: {
    tempoMaximoEspera?: number; // minutos
    prioridadePadrao?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    notificarAposMinutos?: number;
  };
  
  // Relacionamentos
  @OneToMany(() => FilaAtendente, fa => fa.fila)
  filasAtendentes: FilaAtendente[];
  
  @OneToMany(() => Ticket, ticket => ticket.fila)
  tickets: Ticket[];
}
```

#### 2. **FilaAtendente** (NOVA - Junction Table)

```typescript
@Entity('filas_atendentes')
@Index(['filaId', 'atendenteId'], { unique: true })
export class FilaAtendente {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'uuid', name: 'fila_id' })
  filaId: string;
  
  @ManyToOne(() => Fila, fila => fila.filasAtendentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fila_id' })
  fila: Fila;
  
  @Column({ type: 'uuid', name: 'atendente_id' })
  atendenteId: string;
  
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atendente_id' })
  atendente: Usuario;
  
  @Column({ type: 'integer', default: 10, comment: 'Tickets simultâneos' })
  capacidade: number;
  
  @Column({ type: 'integer', default: 1, comment: '1=alta, 10=baixa' })
  prioridade: number;
  
  @Column({ type: 'boolean', default: true })
  ativo: boolean;
  
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
  
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
```

---

## 🔄 Fluxo de Distribuição

### Estratégia: ROUND_ROBIN (Padrão)

```
1. Ticket criado → entra na fila
2. Sistema busca próximo atendente disponível
3. Critérios:
   - Atendente está ativo na fila
   - Capacidade não atingida (tickets atuais < capacidade)
   - Respeita ordem de prioridade
   - Rotação circular (evita sobrecarga de 1 atendente)
4. Ticket atribuído automaticamente
5. Atendente notificado (WebSocket)
```

### Estratégia: MENOR_CARGA (Opcional)

```
1. Ticket criado → entra na fila
2. Sistema busca atendente com MENOS tickets ativos
3. Se empate → usa prioridade configurada
4. Ticket atribuído
```

### Estratégia: PRIORIDADE (Opcional)

```
1. Ticket criado → entra na fila
2. Sistema ordena atendentes por campo 'prioridade'
3. Atribui para o de maior prioridade (menor número) disponível
4. Ticket atribuído
```

---

## 📐 DTOs Necessários

### CreateFilaDto

```typescript
export class CreateFilaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;
  
  @IsOptional()
  @IsEnum(['ROUND_ROBIN', 'MENOR_CARGA', 'PRIORIDADE'])
  estrategiaDistribuicao?: string;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  capacidadeMaxima?: number;
  
  @IsOptional()
  @IsBoolean()
  distribuicaoAutomatica?: boolean;
  
  @IsOptional()
  @IsObject()
  configuracoes?: any;
}
```

### AddAtendenteFilaDto

```typescript
export class AddAtendenteFilaDto {
  @IsUUID()
  atendenteId: string;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacidade?: number;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  prioridade?: number;
}
```

### AtribuirTicketDto

```typescript
export class AtribuirTicketDto {
  @IsUUID()
  ticketId: string;
  
  @IsUUID()
  filaId: string;
  
  @IsOptional()
  @IsBoolean()
  distribuicaoAutomatica?: boolean; // true = sistema atribui, false = manual
  
  @IsOptional()
  @IsUUID()
  atendenteId?: string; // Se distribuicaoAutomatica=false
}
```

---

## 🎯 Endpoints REST

### FilaController

```typescript
// CRUD Básico
GET    /api/filas                    // Listar todas
GET    /api/filas/:id                // Buscar uma
POST   /api/filas                    // Criar nova
PUT    /api/filas/:id                // Atualizar
DELETE /api/filas/:id                // Deletar (soft delete)

// Atendentes da Fila
GET    /api/filas/:id/atendentes     // Listar atendentes
POST   /api/filas/:id/atendentes     // Adicionar atendente
PUT    /api/filas/:id/atendentes/:atendenteId  // Atualizar config
DELETE /api/filas/:id/atendentes/:atendenteId  // Remover

// Tickets da Fila
GET    /api/filas/:id/tickets        // Tickets aguardando
POST   /api/filas/:id/tickets        // Atribuir ticket à fila
DELETE /api/filas/:id/tickets/:ticketId  // Remover ticket

// Distribuição
POST   /api/filas/:id/distribuir     // Distribuir tickets pendentes

// Métricas
GET    /api/filas/:id/metricas       // KPIs da fila
```

---

## 🎨 Frontend - Componentes

### 1. **GestaoFilasPage.tsx** (Nova Página)

**Localização**: `frontend-web/src/pages/configuracoes/GestaoFilasPage.tsx`

**Funcionalidades**:
- ✅ Listar todas as filas (cards ou tabela)
- ✅ Criar nova fila (modal)
- ✅ Editar fila (modal)
- ✅ Deletar fila (confirmação)
- ✅ Ver atendentes da fila
- ✅ Adicionar/remover atendentes
- ✅ Ver métricas da fila

**KPI Cards**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <KPICard 
    title="Total de Filas" 
    value={totalFilas} 
    icon={<Queue />}
  />
  <KPICard 
    title="Tickets Aguardando" 
    value={ticketsAguardando} 
    icon={<Clock />}
  />
  <KPICard 
    title="Atendentes Ativos" 
    value={atendentesAtivos} 
    icon={<Users />}
  />
  <KPICard 
    title="Tempo Médio Espera" 
    value={`${tempoMedio}min`} 
    icon={<Timer />}
  />
</div>
```

### 2. **SelecionarFilaModal.tsx** (Novo Componente)

**Quando aparece**: Ao criar novo ticket

**Funcionalidades**:
- ✅ Dropdown para selecionar fila
- ✅ Opção: "Distribuir automaticamente" (checkbox)
- ✅ Se desabilitado → dropdown para selecionar atendente manualmente
- ✅ Preview de atendentes disponíveis na fila

### 3. **FilaIndicator.tsx** (Novo Componente)

**Onde aparece**: ChatOmnichannel (header do ticket)

**Funcionalidades**:
- ✅ Badge mostrando nome da fila
- ✅ Cor baseada em prioridade
- ✅ Tooltip com info da fila

---

## 🗂️ Zustand Store

### filaStore.ts

```typescript
interface FilaState {
  // Estado
  filas: Fila[];
  filaSelecionada: Fila | null;
  loading: boolean;
  error: string | null;
  
  // Métricas (cache)
  metricas: Record<string, FilaMetricas>;
  
  // Ações
  setFilas: (filas: Fila[]) => void;
  selecionarFila: (fila: Fila | null) => void;
  criarFila: (fila: CreateFilaDto) => Promise<void>;
  atualizarFila: (id: string, fila: UpdateFilaDto) => Promise<void>;
  deletarFila: (id: string) => Promise<void>;
  
  // Atendentes
  adicionarAtendente: (filaId: string, dto: AddAtendenteDto) => Promise<void>;
  removerAtendente: (filaId: string, atendenteId: string) => Promise<void>;
  
  // Métricas
  carregarMetricas: (filaId: string) => Promise<void>;
  
  // Reset
  reset: () => void;
}
```

---

## 📋 Regras de Negócio

### 1. **Validações**

- ✅ Fila deve ter nome único por empresa
- ✅ Atendente pode estar em múltiplas filas
- ✅ Ticket só pode estar em 1 fila por vez
- ✅ Capacidade máxima por atendente: 1-50 tickets
- ✅ Prioridade: 1 (alta) a 10 (baixa)

### 2. **Distribuição Automática**

- ✅ Só distribui se `distribuicaoAutomatica = true` na fila
- ✅ Respeita horário de atendimento (se configurado)
- ✅ Não atribui para atendente com capacidade atingida
- ✅ Não atribui para atendente inativo
- ✅ Notifica atendente via WebSocket

### 3. **Métricas**

- ✅ Tickets aguardando = tickets com `filaId` mas sem `atendenteId`
- ✅ Tickets em atendimento = tickets com `filaId` e `atendenteId`
- ✅ Tempo médio espera = média do tempo entre `createdAt` e `atribuidoEm`
- ✅ Taxa de resolução = tickets resolvidos / total tickets

---

## ⏱️ Estimativa de Tempo (Revisada)

| Tarefa | Original | Revisada | Motivo |
|--------|----------|----------|--------|
| Backend (Service + Controller) | 3 dias | **2 dias** | Entity já existe ✅ |
| Frontend (Store + Service) | 2 dias | **1.5 dias** | Infraestrutura pronta ✅ |
| UI (Páginas + Componentes) | 3 dias | **2.5 dias** | Templates prontos ✅ |
| Integração + Testes | 2 dias | **1.5 dias** | Padrões estabelecidos ✅ |
| Documentação | 1 dia | **0.5 dia** | Framework de docs pronto ✅ |
| **TOTAL** | **11 dias** | **8 dias** | **-27% tempo** ✅ |

**Conversão**: 8 dias úteis = **1.6 semanas** (arredondado para **1.5 semanas** no plano)

---

## 🚀 Plano de Execução

### Sprint Breakdown (1.5 semanas = 7.5 dias úteis)

```
DIA 1-2: Backend Foundation
├── Criar FilaAtendente entity
├── Criar DTOs (Create, Update, Add)
├── Criar migration
├── Implementar FilaService (CRUD básico)
├── Implementar FilaController (endpoints REST)
└── Testes unitários básicos

DIA 3-4: Lógica de Distribuição + Frontend Base
├── Implementar lógica ROUND_ROBIN
├── Implementar métricas
├── Criar filaStore.ts
├── Criar filaService.ts (API calls)
└── Testes do store

DIA 5-6: UI Components
├── GestaoFilasPage.tsx (CRUD)
├── SelecionarFilaModal.tsx
├── FilaIndicator.tsx
├── Integrar com criação de ticket
└── Adicionar ao menu de configurações

DIA 7: Integração + Testes E2E
├── Testar fluxo completo
├── Corrigir bugs
├── Validar regras de negócio
└── Performance testing

DIA 8 (meio dia): Documentação
├── Atualizar ARCHITECTURE.md
├── Criar FILAS_GUIDE.md
├── Atualizar CHANGELOG.md
└── Screenshots/GIFs
```

---

## 📊 Critérios de Sucesso

### Funcionalidades Mínimas (MVP)

- [x] ✅ Entity Fila já existe
- [ ] ⏳ CRUD de filas funcionando (backend + frontend)
- [ ] ⏳ Atendentes podem ser associados a filas
- [ ] ⏳ Tickets podem ser atribuídos a filas
- [ ] ⏳ Distribuição ROUND_ROBIN funciona
- [ ] ⏳ UI de gestão de filas completa
- [ ] ⏳ Integração com chat omnichannel

### Métricas de Qualidade

- [ ] ⏳ Cobertura de testes > 80%
- [ ] ⏳ Performance: < 200ms para atribuir ticket
- [ ] ⏳ Sem erros TypeScript
- [ ] ⏳ Documentação completa

### Impacto Esperado (do Plano Executivo)

- [ ] ⏳ Aumento de 40% na produtividade do atendimento
- [ ] ⏳ Redução de 50% no tempo de primeira resposta
- [ ] ⏳ Competitividade com Zendesk/Intercom

---

## 🎯 Próximo Passo Imediato

### ✅ 5.1: Análise e Planejamento - **CONCLUÍDO**

Este documento serve como blueprint completo para implementação.

### 🔄 5.2: Backend - Entities & DTOs - **PRÓXIMO**

**Ação**: Criar `FilaAtendente` entity + DTOs de validação

**Tempo estimado**: 2-3 horas

**Arquivos a criar**:
1. `backend/src/modules/atendimento/entities/fila-atendente.entity.ts`
2. `backend/src/modules/atendimento/dto/create-fila.dto.ts`
3. `backend/src/modules/atendimento/dto/update-fila.dto.ts`
4. `backend/src/modules/atendimento/dto/add-atendente-fila.dto.ts`

---

**Preparado por**: GitHub Copilot (AI Agent)  
**Data**: 6 de novembro de 2025  
**Status**: ✅ Análise completa - Pronto para implementação
