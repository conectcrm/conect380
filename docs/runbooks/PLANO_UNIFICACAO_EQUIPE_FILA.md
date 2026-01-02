# 📊 Análise de Impacto - Unificação Equipe → Fila

**Data**: 10 de novembro de 2025  
**Objetivo**: Mapear todos os pontos de impacto da consolidação Equipe (Triagem) → Fila (Atendimento)

---

## 🎯 Resumo Executivo

### **Escopo da Mudança**:
- **Remover**: Conceito de "Equipe" do módulo Triagem
- **Consolidar**: Usar apenas "Fila" do módulo Atendimento
- **Impacto**: 3 entidades, 1 service, 1 controller, 2 páginas frontend, 1 migration

### **Estratégia**:
1. ✅ **Preservar dados** - Migration migra equipes → filas
2. ✅ **Manter comportamento** - Funcionalidades continuam iguais
3. ✅ **Melhorar features** - Filas têm mais recursos (distribuição avançada, skills, SLA)

---

## 📦 Entidades Afetadas

### 1. **Equipe** (Triagem) ❌ REMOVER

**Arquivo**: `backend/src/modules/triagem/entities/equipe.entity.ts`

```typescript
@Entity('equipes')
export class Equipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  cor: string;

  @Column({ type: 'varchar', length: 50, default: 'users' })
  icone: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @OneToMany(() => AtendenteEquipe, ae => ae.equipe)
  membros: AtendenteEquipe[];

  @OneToMany(() => EquipeAtribuicao, ea => ea.equipe)
  atribuicoes: EquipeAtribuicao[];
}
```

**Mapeamento para Fila**:
| Campo Equipe | Campo Fila | Status |
|--------------|------------|--------|
| `id` | `id` | ✅ Direto |
| `empresaId` | `empresaId` | ✅ Direto |
| `nome` | `nome` | ✅ Direto |
| `descricao` | `descricao` | ✅ Direto |
| `cor` | - | ⚠️ Adicionar coluna em Fila |
| `icone` | - | ⚠️ Adicionar coluna em Fila |
| `ativo` | `ativo` | ✅ Direto |
| `membros` (AtendenteEquipe) | `atendentes` (FilaAtendente) | ✅ Estrutura similar |
| `atribuicoes` (EquipeAtribuicao) | - | ⚠️ Criar relacionamento Fila ↔ Núcleo/Departamento |

---

### 2. **AtendenteEquipe** (Triagem) ❌ REMOVER

**Arquivo**: `backend/src/modules/triagem/entities/atendente-equipe.entity.ts`

```typescript
@Entity('atendente_equipes')
export class AtendenteEquipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'atendente_id' })
  atendenteId: string;

  @Column({ type: 'uuid', name: 'equipe_id' })
  equipeId: string;

  @Column({ type: 'integer', default: 0 })
  prioridade: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
```

**Equivalente Existente**: `FilaAtendente` (Atendimento) ✅

```typescript
@Entity('fila_atendentes')
export class FilaAtendente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  filaId: string;

  @Column({ type: 'uuid' })
  atendenteId: string;

  @Column({ type: 'integer', default: 0 })
  prioridade: number; // ✅ JÁ EXISTE

  @Column({ type: 'boolean', default: true })
  ativo: boolean; // ✅ JÁ EXISTE
}
```

**Ação**: Migration migra `atendente_equipes` → `fila_atendentes`

---

### 3. **EquipeAtribuicao** (Triagem) ❌ REMOVER

**Arquivo**: `backend/src/modules/triagem/entities/equipe-atribuicao.entity.ts`

```typescript
@Entity('equipe_atribuicoes')
export class EquipeAtribuicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'equipe_id' })
  equipeId: string;

  @Column({ type: 'uuid', name: 'nucleo_id', nullable: true })
  nucleoId: string;

  @Column({ type: 'uuid', name: 'departamento_id', nullable: true })
  departamentoId: string;

  @Column({ type: 'integer', default: 0 })
  prioridade: number;
}
```

**Problema**: Fila NÃO tem relacionamento direto com Núcleo/Departamento! ⚠️

**Solução**: Criar nova junction table `fila_nucleos` (ou adicionar colunas em Fila)

**Opção A - Adicionar colunas em Fila** (Recomendado):
```typescript
@Entity('filas')
export class Fila {
  // ... campos existentes ...
  
  @Column({ type: 'uuid', name: 'nucleo_id', nullable: true })
  nucleoId?: string; // ✨ NOVO
  
  @Column({ type: 'uuid', name: 'departamento_id', nullable: true })
  departamentoId?: string; // ✨ NOVO
}
```

**Opção B - Criar junction table**:
```typescript
@Entity('fila_atribuicoes')
export class FilaAtribuicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'uuid' })
  filaId: string;
  
  @Column({ type: 'uuid', nullable: true })
  nucleoId?: string;
  
  @Column({ type: 'uuid', nullable: true })
  departamentoId?: string;
  
  @Column({ type: 'integer', default: 0 })
  prioridade: number;
}
```

**Decisão**: **Opção A** (mais simples, menos junções no banco)

---

## 🔧 Services Afetados

### 1. **AtribuicaoService** (Triagem) - REFATORAR ⚠️

**Arquivo**: `backend/src/modules/triagem/services/atribuicao.service.ts`

**Métodos que usam Equipe** (700 linhas):
```typescript
// ❌ REMOVER ou REFATORAR
async criarEquipe(empresaId: string, dto: CreateEquipeDto): Promise<Equipe>
async listarEquipes(empresaId: string): Promise<Equipe[]>
async buscarEquipe(id: string): Promise<Equipe>
async atualizarEquipe(id: string, dto: UpdateEquipeDto): Promise<Equipe>
async deletarEquipe(id: string): Promise<void>
async adicionarMembro(equipeId: string, atendenteId: string): Promise<AtendenteEquipe>
async removerMembro(equipeId: string, atendenteId: string): Promise<void>
async listarMembros(equipeId: string): Promise<AtendenteEquipe[]>

// ✅ MANTER (usam apenas atribuições de atendente direto)
async atribuirAtendente(dto: AtribuirAtendenteDto): Promise<AtendenteAtribuicao>
async removerAtribuicaoAtendente(atribuicaoId: string): Promise<void>
async listarAtribuicoesAtendente(atendenteId: string): Promise<AtendenteAtribuicao[]>
```

**Estratégia de Refatoração**:
1. **Deletar métodos** relacionados a Equipe (8 métodos)
2. **Criar novos métodos** que delegam para `FilaService`:
   ```typescript
   // Proxy para FilaService
   async atribuirEquipe(dto: AtribuirEquipeDto) {
     return this.filaService.atribuirFila({
       filaId: dto.equipeId, // ← conversão
       nucleoId: dto.nucleoId,
       departamentoId: dto.departamentoId,
     });
   }
   ```

---

### 2. **FilaService** (Atendimento) - ESTENDER ✅

**Arquivo**: `backend/src/modules/atendimento/services/fila.service.ts`

**Adicionar métodos**:
```typescript
/**
 * Atribuir fila a núcleo/departamento
 */
async atribuirFila(dto: {
  filaId: string;
  nucleoId?: string;
  departamentoId?: string;
}): Promise<Fila> {
  const fila = await this.filaRepository.findOne({ where: { id: dto.filaId } });
  
  if (!fila) {
    throw new NotFoundException('Fila não encontrada');
  }
  
  // Atualizar relacionamento
  fila.nucleoId = dto.nucleoId;
  fila.departamentoId = dto.departamentoId;
  
  return await this.filaRepository.save(fila);
}

/**
 * Listar filas de um núcleo
 */
async listarPorNucleo(nucleoId: string): Promise<Fila[]> {
  return await this.filaRepository.find({
    where: { nucleoId, ativo: true },
    relations: ['atendentes'],
  });
}

/**
 * Listar filas de um departamento
 */
async listarPorDepartamento(departamentoId: string): Promise<Fila[]> {
  return await this.filaRepository.find({
    where: { departamentoId, ativo: true },
    relations: ['atendentes'],
  });
}
```

---

## 🎮 Controllers Afetados

### 1. **EquipeController** (Triagem) - REMOVER OU DEPRECAR ❌

**Arquivo**: `backend/src/modules/triagem/controllers/equipe.controller.ts`

**Rotas Afetadas**:
```
❌ POST   /equipes              → usar POST /filas
❌ GET    /equipes              → usar GET /filas
❌ GET    /equipes/:id          → usar GET /filas/:id
❌ PUT    /equipes/:id          → usar PUT /filas/:id
❌ DELETE /equipes/:id          → usar DELETE /filas/:id
❌ POST   /equipes/:id/membros  → usar POST /filas/:id/atendentes
❌ DELETE /equipes/:id/membros/:atendenteId → usar DELETE /filas/:id/atendentes/:atendenteId
```

**Opção 1 - Remover completamente** (Breaking Change):
- Deletar controller
- Atualizar frontend para usar `/filas`

**Opção 2 - Deprecar + Proxy** (Retrocompatível):
```typescript
@Controller('equipes')
@ApiDeprecated('Use /filas em vez de /equipes')
export class EquipeController {
  constructor(private readonly filaService: FilaService) {}
  
  @Post()
  @ApiResponse({ status: 410, description: 'Endpoint descontinuado. Use POST /filas' })
  async criar() {
    throw new GoneException('Use POST /filas em vez de POST /equipes');
  }
  
  // ... outros endpoints com mensagem similar
}
```

**Decisão**: **Opção 1** (remover) - Sistema ainda em desenvolvimento, sem usuários externos

---

### 2. **FilaController** (Atendimento) - ESTENDER ✅

**Arquivo**: `backend/src/modules/atendimento/controllers/fila.controller.ts`

**Adicionar endpoints**:
```typescript
/**
 * POST /filas/:id/nucleo
 * Atribuir fila a núcleo
 */
@Post(':id/nucleo')
async atribuirNucleo(
  @Param('id') filaId: string,
  @Body('nucleoId') nucleoId: string,
) {
  return this.filaService.atribuirFila({ filaId, nucleoId });
}

/**
 * POST /filas/:id/departamento
 * Atribuir fila a departamento
 */
@Post(':id/departamento')
async atribuirDepartamento(
  @Param('id') filaId: string,
  @Body('departamentoId') departamentoId: string,
) {
  return this.filaService.atribuirFila({ filaId, departamentoId });
}

/**
 * GET /nucleos/:nucleoId/filas
 * Listar filas de um núcleo
 */
@Get('/nucleos/:nucleoId/filas')
async listarPorNucleo(@Param('nucleoId') nucleoId: string) {
  return this.filaService.listarPorNucleo(nucleoId);
}
```

---

## 🎨 Frontend Afetado

### 1. **GestaoEquipesPage** - REMOVER OU REDIRECIONAR ❌

**Arquivo**: `frontend-web/src/features/gestao/pages/GestaoEquipesPage.tsx`

**Status Atual**: Página funcional (650+ linhas)

**Opção 1 - Redirecionar para GestaoFilasPage**:
```tsx
// GestaoEquipesPage.tsx
const GestaoEquipesPage = () => {
  return <Navigate to="/atendimento/configuracoes?tab=filas" replace />;
};
```

**Opção 2 - Deprecar gradualmente**:
```tsx
<div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
  <p className="text-sm">
    ⚠️ Esta página será descontinuada. Use{' '}
    <Link to="/atendimento/configuracoes?tab=filas">Gestão de Filas</Link> para gerenciar equipes.
  </p>
</div>
```

**Decisão**: **Opção 1** (redirecionar) - Simplifica manutenção

---

### 2. **equipeService** - DEPRECAR OU PROXY ⚠️

**Arquivo**: `frontend-web/src/services/equipeService.ts`

**Status Atual**: Service completo com 8+ métodos

**Opção 1 - Deletar e usar filaService**:
```typescript
// Remover equipeService.ts
// Atualizar imports para usar filaService
```

**Opção 2 - Proxy para filaService**:
```typescript
// equipeService.ts (deprecated)
import filaService from './filaService';

/**
 * @deprecated Use filaService em vez de equipeService
 */
export const equipeService = {
  listar: () => filaService.listar(),
  criar: (dto: any) => filaService.criar(dto),
  atualizar: (id: string, dto: any) => filaService.atualizar(id, dto),
  // ... outros métodos
};

export default equipeService;
```

**Decisão**: **Opção 2** (proxy temporário) - Mantém compatibilidade durante transição

---

### 3. **GestaoAtribuicoesPage** - ATUALIZAR ⚠️

**Arquivo**: `frontend-web/src/features/gestao/pages/GestaoAtribuicoesPage.tsx`

**Usa**: `equipeService.listar()`, `equipeService.listarAtribuicoes()`, etc.

**Ação**: Trocar imports
```typescript
// ❌ ANTES
import equipeService from '../../../services/equipeService';

// ✅ DEPOIS
import filaService from '../../../services/filaService';
```

---

## 🗄️ Migrations

### **Nova Migration - ConsolidacaoEquipeFila**

**Arquivo**: `backend/src/migrations/[timestamp]-ConsolidacaoEquipeFila.ts`

**Etapas**:
```sql
-- 1. ADICIONAR colunas em 'filas'
ALTER TABLE filas 
  ADD COLUMN cor VARCHAR(7) DEFAULT '#3B82F6',
  ADD COLUMN icone VARCHAR(50) DEFAULT 'inbox',
  ADD COLUMN nucleo_id UUID,
  ADD COLUMN departamento_id UUID;

-- 2. MIGRAR dados de 'equipes' → 'filas'
INSERT INTO filas (id, empresa_id, nome, descricao, cor, icone, ativo, created_at, updated_at)
SELECT id, empresa_id, nome, descricao, cor, icone, ativo, created_at, updated_at
FROM equipes;

-- 3. MIGRAR 'atendente_equipes' → 'fila_atendentes'
INSERT INTO fila_atendentes (fila_id, atendente_id, prioridade, ativo, created_at)
SELECT equipe_id, atendente_id, prioridade, ativo, created_at
FROM atendente_equipes;

-- 4. MIGRAR 'equipe_atribuicoes' → colunas em 'filas'
UPDATE filas f
SET nucleo_id = ea.nucleo_id,
    departamento_id = ea.departamento_id
FROM equipe_atribuicoes ea
WHERE f.id = ea.equipe_id;

-- 5. REMOVER tabelas antigas
DROP TABLE IF EXISTS atendente_equipes CASCADE;
DROP TABLE IF EXISTS equipe_atribuicoes CASCADE;
DROP TABLE IF EXISTS equipes CASCADE;
```

**Reversão (down)**:
```sql
-- 1. RECRIAR tabelas
CREATE TABLE equipes (...);
CREATE TABLE atendente_equipes (...);
CREATE TABLE equipe_atribuicoes (...);

-- 2. MIGRAR de volta 'filas' → 'equipes'
INSERT INTO equipes (...)
SELECT id, empresa_id, nome, descricao, cor, icone, ativo, created_at, updated_at
FROM filas
WHERE nucleo_id IS NOT NULL OR departamento_id IS NOT NULL; -- apenas filas que eram equipes

-- 3. MIGRAR de volta 'fila_atendentes' → 'atendente_equipes'
-- 4. RECRIAR 'equipe_atribuicoes'
-- 5. REMOVER colunas adicionadas em 'filas'
ALTER TABLE filas 
  DROP COLUMN cor,
  DROP COLUMN icone,
  DROP COLUMN nucleo_id,
  DROP COLUMN departamento_id;
```

---

## 📋 Checklist de Implementação

### **Fase 1: Backend - Entities e Migrations** (1 dia)
- [ ] Adicionar colunas `cor`, `icone`, `nucleoId`, `departamentoId` em `Fila` entity
- [ ] Criar migration `ConsolidacaoEquipeFila`
- [ ] Testar migration (up e down) em banco de desenvolvimento
- [ ] Validar dados migrados (contagem de registros)

### **Fase 2: Backend - Services** (1 dia)
- [ ] Adicionar métodos em `FilaService`:
  - `atribuirFila()`
  - `listarPorNucleo()`
  - `listarPorDepartamento()`
- [ ] Refatorar `AtribuicaoService`:
  - Remover métodos de Equipe
  - Criar proxies para `FilaService`
- [ ] Atualizar `DistribuicaoService` (se usar Equipe)
- [ ] Testar services com testes unitários

### **Fase 3: Backend - Controllers** (1 dia)
- [ ] Adicionar endpoints em `FilaController`:
  - `POST /filas/:id/nucleo`
  - `POST /filas/:id/departamento`
  - `GET /nucleos/:nucleoId/filas`
- [ ] Remover `EquipeController` (ou deprecar)
- [ ] Atualizar documentação Swagger
- [ ] Testar endpoints com Postman/Thunder Client

### **Fase 4: Frontend - Services** (meio dia)
- [ ] Adicionar métodos em `filaService`:
  - `atribuirNucleo()`
  - `atribuirDepartamento()`
  - `listarPorNucleo()`
- [ ] Criar proxy em `equipeService` (deprecated)
- [ ] Atualizar interfaces TypeScript

### **Fase 5: Frontend - Pages** (meio dia)
- [ ] Atualizar `GestaoAtribuicoesPage` (trocar equipeService → filaService)
- [ ] Criar redirect em `GestaoEquipesPage`
- [ ] Atualizar menu (remover item "Equipes" ou apontar para "Filas")
- [ ] Testar UI (criar, editar, deletar, atribuir)

### **Fase 6: Testes E2E** (1 dia)
- [ ] Testar fluxo completo:
  - Bot WhatsApp → escolhe núcleo → cria ticket
  - Ticket atribuído à fila correta
  - Distribuição automática funciona
- [ ] Testar criação de fila via UI
- [ ] Testar atribuição de fila a núcleo/departamento
- [ ] Testar adição de atendentes à fila
- [ ] Validar que não há referências a "Equipe" na UI

### **Fase 7: Documentação** (meio dia)
- [ ] Atualizar README.md (remover menção a Equipes)
- [ ] Atualizar AUDITORIA_PROGRESSO_REAL.md
- [ ] Criar guia de migração para desenvolvedores
- [ ] Documentar breaking changes (se houver API externa)

---

## ⚠️ Riscos e Mitigações

### **Risco 1: Perda de Dados** 🔴
**Probabilidade**: Baixa  
**Impacto**: Alto

**Mitigação**:
- ✅ Backup do banco antes de rodar migration
- ✅ Testar migration em ambiente de desenvolvimento primeiro
- ✅ Validar contagem de registros antes/depois
- ✅ Implementar reversão (down) completa

### **Risco 2: Breaking Changes em APIs** 🟡
**Probabilidade**: Média  
**Impacto**: Médio

**Mitigação**:
- ✅ Manter `equipeService` como proxy (frontend)
- ✅ Deprecar `/equipes` endpoints em vez de remover imediatamente
- ✅ Adicionar logs de uso de endpoints deprecated
- ✅ Comunicar mudanças com antecedência (se houver API externa)

### **Risco 3: Bugs em Distribuição Automática** 🟡
**Probabilidade**: Média  
**Impacto**: Alto

**Mitigação**:
- ✅ Testar todos os 3 algoritmos de distribuição
- ✅ Validar que `filaId` funciona onde antes era `equipeId`
- ✅ Adicionar logs detalhados no `DistribuicaoService`
- ✅ Manter `DistribuicaoLog` para auditoria

### **Risco 4: Inconsistências na UI** 🟢
**Probabilidade**: Baixa  
**Impacto**: Baixo

**Mitigação**:
- ✅ Fazer grep global por "Equipe" e "equipe" no frontend
- ✅ Testar todas as telas relacionadas
- ✅ Validar que menus estão atualizados
- ✅ Code review focado em consistência

---

## 📊 Métricas de Sucesso

### **Código**:
- ✅ 3 entities removidas (`Equipe`, `AtendenteEquipe`, `EquipeAtribuicao`)
- ✅ 1 service simplificado (`AtribuicaoService`: 700 → ~300 linhas)
- ✅ 1 controller removido (`EquipeController`)
- ✅ -40% de duplicação de código

### **Funcionalidade**:
- ✅ 100% das features de Equipe disponíveis em Fila
- ✅ Distribuição automática funciona igual (ou melhor)
- ✅ Atribuição de núcleo/departamento funciona
- ✅ UI de gestão de filas equivalente à de equipes

### **Performance**:
- ✅ Menos JOIN queries (Fila tem nucleoId/departamentoId direto)
- ✅ Distribuição unificada (sem lógica duplicada)
- ✅ Menos tabelas no banco (3 a menos)

---

## 🚀 Próximos Passos

1. ✅ **Decisão final**: Confirmar unificação Equipe → Fila
2. 🟡 **Criar branch**: `feat/unificacao-equipe-fila`
3. ⏳ **Implementar Fase 1**: Entities + Migration
4. ⏳ **Testar migration**: Rodar em dev e validar dados
5. ⏳ **Continuar fases 2-7**: Conforme checklist

---

**Estimativa Total**: **6-9 dias** (1 semana útil)  
**Complexidade**: Média-Alta  
**Benefício**: Alto (elimina duplicação, simplifica manutenção)

---

**Preparado por**: GitHub Copilot  
**Data**: 10 de novembro de 2025  
**Status**: ✅ Análise completa, pronto para implementação
