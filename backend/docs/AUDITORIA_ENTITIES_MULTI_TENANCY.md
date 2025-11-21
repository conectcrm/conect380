# 🔍 Auditoria de Entities - Multi-Tenancy

**Data**: 2025-01-XX  
**Status**: ✅ Auditoria Completa

---

## 📋 Executive Summary

### Situação Atual
- ✅ **3 módulos VALIDADOS** (Leads, Oportunidades, Clientes) - 15/16 E2E passing (93,75%)
- ❌ **5 entities NECESSITAM migration** (Fatura, Contrato, Pagamento, Produto, Usuario*)
- ✅ **1 entity já possui empresa_id** (Usuario - verificar implementação)

### Prioridades Identificadas

**🔴 ALTA PRIORIDADE** (Módulos Financeiros - Críticos):
1. **Fatura** - Migration necessária (Complexidade: ALTA)
2. **Contrato** - Migration necessária (Complexidade: ALTA)
3. **Pagamento** - Migration necessária (Complexidade: MÉDIA)

**🟡 MÉDIA PRIORIDADE**:
4. **Produto** - Migration necessária (Complexidade: BAIXA)
5. **Usuario** - Verificar controllers/services (já tem empresa_id)

**🟢 BAIXA PRIORIDADE**:
6. **Atividade** - Herda empresa_id via Oportunidade (não precisa migration)
7. **Notificacao** - Entity não encontrada no sistema

---

## 📊 Tabela de Auditoria Completa

| # | Entity | Arquivo | empresa_id? | Criticidade | Migration? | Complexidade | Status |
|---|--------|---------|-------------|-------------|-----------|--------------|--------|
| 1 | Lead | `src/modules/leads/lead.entity.ts` | ✅ Sim (linha 15) | Alta | ❌ Não | - | ✅ 100% (7/7 E2E) |
| 2 | Oportunidade | `src/modules/oportunidades/oportunidade.entity.ts` | ✅ Sim (linha 78) | Alta | ❌ Não | - | ✅ 100% (3/3 E2E) |
| 3 | Cliente | `src/modules/clientes/cliente.entity.ts` | ✅ Sim (linha 78) | Alta | ❌ Não | - | ✅ 100% (2/2 E2E) |
| 4 | **Fatura** | `src/modules/faturamento/entities/fatura.entity.ts` | ❌ **NÃO** | **Alta** | ✅ **SIM** | **ALTA** | ⏰ Task #5 |
| 5 | **Contrato** | `src/modules/contratos/entities/contrato.entity.ts` | ❌ **NÃO** | **Alta** | ✅ **SIM** | **ALTA** | ⏰ Task #5 |
| 6 | **Pagamento** | `src/modules/faturamento/entities/pagamento.entity.ts` | ❌ **NÃO** | **Alta** | ✅ **SIM** | **MÉDIA** | ⏰ Task #6 |
| 7 | **Produto** | `src/modules/produtos/produto.entity.ts` | ❌ **NÃO** | Média | ✅ SIM | **BAIXA** | ⏰ Task #7 |
| 8 | Usuario | `src/modules/users/user.entity.ts` | ✅ Sim (linha 50) | Média | ❌ Não | - | 🔍 Task #8 |
| 9 | Atividade | `src/modules/oportunidades/atividade.entity.ts` | 📊 Indireta | Baixa | ❌ Não | - | ✅ OK (via Oportunidade) |
| 10 | Notificacao | - | ❓ N/A | Baixa | - | - | ❓ Não encontrada |

**Legenda**:
- ✅ Completo e validado
- ⏰ Pendente (aguarda implementação)
- 🔍 Verificação necessária
- 📊 Herança indireta (não precisa migration)
- ❓ Não encontrado

---

## 🔬 Análise Detalhada por Entity

### ✅ 1. Lead (COMPLETO)
**Arquivo**: `src/modules/leads/lead.entity.ts`

```typescript
@Column('uuid')
empresa_id: string;

@ManyToOne(() => Empresa)
@JoinColumn({ name: 'empresa_id' })
empresa: Empresa;
```

**Status**: ✅ Migrado e testado
**E2E Tests**: 7/7 passing (100%)
**Validação**: 
- ✅ Entity com empresa_id
- ✅ Service filtra por empresa_id
- ✅ Controller com @EmpresaId() decorator
- ✅ E2E validando isolamento multi-tenancy

---

### ✅ 2. Oportunidade (COMPLETO)
**Arquivo**: `src/modules/oportunidades/oportunidade.entity.ts`

```typescript
@Column('uuid')
empresa_id: string;

@ManyToOne(() => Empresa)
@JoinColumn({ name: 'empresa_id' })
empresa: Empresa;
```

**Status**: ✅ Migrado e testado
**E2E Tests**: 3/3 passing (100%)
**Migration**: `1731513600000-AddEmpresaIdToOportunidades.ts` executada
**Validação**:
- ✅ Entity com empresa_id
- ✅ Service filtra por empresa_id
- ✅ Controller com @EmpresaId() decorator
- ✅ E2E validando isolamento multi-tenancy

---

### ✅ 3. Cliente (COMPLETO)
**Arquivo**: `src/modules/clientes/cliente.entity.ts`

```typescript
@Column('uuid')
empresa_id: string;

@ManyToOne(() => Empresa)
@JoinColumn({ name: 'empresa_id' })
empresa: Empresa;
```

**Status**: ✅ Verificado e testado (bug corrigido)
**E2E Tests**: 2/2 passing (100%)
**Bug Corrigido**: ClientesController.findById() agora lança NotFoundException (404) ao invés de retornar 200 OK
**Validação**:
- ✅ Entity já possuía empresa_id
- ✅ Service filtra por empresa_id
- ✅ Controller com @EmpresaId() decorator corrigido
- ✅ E2E validando isolamento multi-tenancy

---

### ❌ 4. Fatura (PENDENTE - HIGH PRIORITY)
**Arquivo**: `src/modules/faturamento/entities/fatura.entity.ts`

**Status Atual**: ❌ NÃO possui empresa_id

**Campos Relevantes**:
```typescript
@PrimaryGeneratedColumn()
id: number;

@Column()
contratoId: number;

@ManyToOne(() => Contrato, { eager: true })
contrato: Contrato;

@Column('uuid')
clienteId: string;

@ManyToOne(() => Cliente, { eager: false })
cliente: Cliente;

@Column('uuid')
usuarioResponsavelId: string;
```

**Análise**:
- ❌ Campo `empresa_id` não existe
- ⚠️ Relaciona com Contrato (que também não tem empresa_id)
- ⚠️ Relaciona com Cliente (que já tem empresa_id)
- ⚠️ Relaciona com Usuario (que já tem empresa_id)

**Migration Necessária**: ✅ SIM
**Complexidade**: **ALTA**
- Precisa adicionar empresa_id
- Precisa criar FK para empresas
- Precisa popular dados existentes (se houver)
- Precisa atualizar service para filtrar por empresa_id
- Precisa atualizar controller para usar @EmpresaId()
- Dependência: Contrato também precisa de empresa_id

**Estimativa**: 2-3 horas (incluindo Contrato)

**Migration SQL Planejada**:
```sql
-- 1. Adicionar coluna empresa_id
ALTER TABLE faturas 
ADD COLUMN empresa_id UUID NOT NULL;

-- 2. Criar FK
ALTER TABLE faturas 
ADD CONSTRAINT fk_faturas_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- 3. Criar índice
CREATE INDEX idx_faturas_empresa_id ON faturas(empresa_id);

-- 4. Popular dados existentes (buscar empresa_id do cliente)
UPDATE faturas f
SET empresa_id = c.empresa_id
FROM clientes c
WHERE f.clienteId = c.id;
```

---

### ❌ 5. Contrato (PENDENTE - HIGH PRIORITY)
**Arquivo**: `src/modules/contratos/entities/contrato.entity.ts`

**Status Atual**: ❌ NÃO possui empresa_id

**Campos Relevantes**:
```typescript
@PrimaryGeneratedColumn()
id: number;

@Column('uuid', { nullable: true })
propostaId: string;

@ManyToOne(() => Proposta, { eager: false, nullable: true })
proposta: Proposta;

@Column('uuid')
clienteId: string;

@Column('uuid')
usuarioResponsavelId: string;
```

**Análise**:
- ❌ Campo `empresa_id` não existe
- ⚠️ Relaciona com Cliente (que já tem empresa_id)
- ⚠️ Relaciona com Proposta (verificar se tem empresa_id)
- ⚠️ Relaciona com Usuario (que já tem empresa_id)
- ⚠️ Fatura depende de Contrato

**Migration Necessária**: ✅ SIM
**Complexidade**: **ALTA**
- Precisa adicionar empresa_id
- Precisa criar FK para empresas
- Precisa popular dados existentes (se houver)
- Precisa atualizar service para filtrar por empresa_id
- Precisa atualizar controller para usar @EmpresaId()
- Bloqueador: Fatura precisa de empresa_id de Contrato

**Estimativa**: 2-3 horas (incluindo Fatura)

**Migration SQL Planejada**:
```sql
-- 1. Adicionar coluna empresa_id
ALTER TABLE contratos 
ADD COLUMN empresa_id UUID NOT NULL;

-- 2. Criar FK
ALTER TABLE contratos 
ADD CONSTRAINT fk_contratos_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- 3. Criar índice
CREATE INDEX idx_contratos_empresa_id ON contratos(empresa_id);

-- 4. Popular dados existentes (buscar empresa_id do cliente)
UPDATE contratos c
SET empresa_id = cli.empresa_id
FROM clientes cli
WHERE c.clienteId = cli.id;
```

---

### ❌ 6. Pagamento (PENDENTE - HIGH PRIORITY)
**Arquivo**: `src/modules/faturamento/entities/pagamento.entity.ts`

**Status Atual**: ❌ NÃO possui empresa_id

**Campos Relevantes**:
```typescript
@PrimaryGeneratedColumn()
id: number;

@Column()
faturaId: number;

@ManyToOne(() => Fatura, (fatura) => fatura.pagamentos)
fatura: Fatura;

@Column({ unique: true })
transacaoId: string;
```

**Análise**:
- ❌ Campo `empresa_id` não existe
- ⚠️ Relaciona com Fatura (que não tem empresa_id)
- ✅ Pode herdar empresa_id da Fatura após migration

**Migration Necessária**: ✅ SIM
**Complexidade**: **MÉDIA**
- Precisa adicionar empresa_id
- Precisa criar FK para empresas
- Pode popular dados via Fatura (após migration de Fatura)
- Precisa atualizar service para filtrar por empresa_id
- Precisa atualizar controller para usar @EmpresaId()
- Dependência: Fatura precisa ter empresa_id primeiro

**Estimativa**: 1 hora (após Fatura ter empresa_id)

**Migration SQL Planejada**:
```sql
-- 1. Adicionar coluna empresa_id
ALTER TABLE pagamentos 
ADD COLUMN empresa_id UUID NOT NULL;

-- 2. Criar FK
ALTER TABLE pagamentos 
ADD CONSTRAINT fk_pagamentos_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- 3. Criar índice
CREATE INDEX idx_pagamentos_empresa_id ON pagamentos(empresa_id);

-- 4. Popular dados existentes (buscar empresa_id da fatura)
UPDATE pagamentos p
SET empresa_id = f.empresa_id
FROM faturas f
WHERE p.faturaId = f.id;
```

---

### ❌ 7. Produto (PENDENTE - MEDIUM PRIORITY)
**Arquivo**: `src/modules/produtos/produto.entity.ts`

**Status Atual**: ❌ NÃO possui empresa_id

**Campos Relevantes**:
```typescript
@PrimaryGeneratedColumn('uuid')
id: string;

@Column({ type: 'varchar', length: 255 })
nome: string;

@Column({ type: 'varchar', length: 50 })
categoria: string;

@Column({ type: 'varchar', length: 100, unique: true })
sku: string;
```

**Análise**:
- ❌ Campo `empresa_id` não existe
- ✅ Entity standalone (não depende de outras entities)
- ⚠️ SKU é unique - pode gerar conflitos entre empresas

**Migration Necessária**: ✅ SIM
**Complexidade**: **BAIXA**
- Precisa adicionar empresa_id
- Precisa criar FK para empresas
- Precisa ajustar unique constraint de SKU (unique per empresa)
- Precisa popular dados existentes (se houver)
- Precisa atualizar service para filtrar por empresa_id
- Precisa atualizar controller para usar @EmpresaId()

**Estimativa**: 30-45 minutos

**Migration SQL Planejada**:
```sql
-- 1. Remover unique constraint de SKU
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_sku_key;

-- 2. Adicionar coluna empresa_id
ALTER TABLE produtos 
ADD COLUMN empresa_id UUID NOT NULL;

-- 3. Criar FK
ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- 4. Criar índice
CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);

-- 5. Criar unique constraint composto (SKU + empresa_id)
ALTER TABLE produtos 
ADD CONSTRAINT uq_produtos_sku_empresa 
UNIQUE (sku, empresa_id);

-- 6. Popular dados existentes
UPDATE produtos 
SET empresa_id = (SELECT id FROM empresas LIMIT 1)
WHERE empresa_id IS NULL;
```

---

### 🔍 8. Usuario (VERIFICAÇÃO NECESSÁRIA)
**Arquivo**: `src/modules/users/user.entity.ts`

**Status Atual**: ✅ JÁ possui empresa_id (linha 50)

**Código Atual**:
```typescript
@Column('uuid')
empresa_id: string;

@ManyToOne(() => Empresa, (empresa) => empresa.usuarios)
@JoinColumn({ name: 'empresa_id' })
empresa: Empresa;
```

**Análise**:
- ✅ Campo `empresa_id` existe
- ✅ Relacionamento com Empresa configurado
- ❓ Controllers usam @EmpresaId()? **VERIFICAR**
- ❓ Services filtram por empresa_id? **VERIFICAR**
- ❓ E2E tests validam isolamento? **CRIAR**

**Migration Necessária**: ❌ NÃO
**Complexidade**: **BAIXA** (apenas verificação)
- Verificar se controllers usam @EmpresaId()
- Verificar se services filtram por empresa_id
- Criar E2E tests para validar isolamento
- Possíveis ajustes em responses (404 vs 200 OK)

**Estimativa**: 1 hora

**Checklist de Verificação**:
- [ ] Ler `src/modules/users/users.controller.ts`
- [ ] Verificar se métodos usam `@EmpresaId()` decorator
- [ ] Ler `src/modules/users/users.service.ts`
- [ ] Verificar se queries filtram por `empresa_id`
- [ ] Criar E2E tests em `test/multi-tenancy.e2e-spec.ts`
- [ ] Validar isolamento multi-tenancy (Usuario de Empresa 1 não acessa Usuario de Empresa 2)

---

### 📊 9. Atividade (OK - Herança Indireta)
**Arquivo**: `src/modules/oportunidades/atividade.entity.ts`

**Status Atual**: 📊 Herda empresa_id via Oportunidade

**Código Atual**:
```typescript
@ManyToOne(() => Oportunidade, (oportunidade) => oportunidade.atividades, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'oportunidade_id' })
oportunidade: Oportunidade;

@Column('int')
oportunidade_id: number;
```

**Análise**:
- ✅ Relaciona com Oportunidade (que TEM empresa_id)
- ✅ Herança indireta: `atividade.oportunidade.empresa_id`
- ✅ Isolamento garantido via Oportunidade
- ❌ Campo `empresa_id` direto não existe (mas não é necessário)

**Migration Necessária**: ❌ NÃO
**Complexidade**: -
**Justificativa**: 
- Atividade sempre pertence a uma Oportunidade
- Oportunidade já tem empresa_id
- Isolamento garantido: query por Oportunidade já filtra por empresa_id
- Adicionar empresa_id direto seria redundante

**Query Segura**:
```typescript
// Service de Atividades
async listar(oportunidadeId: number, empresaId: string): Promise<Atividade[]> {
  // 1. Verificar se Oportunidade pertence à empresa
  const oportunidade = await this.oportunidadeService.findById(oportunidadeId, empresaId);
  if (!oportunidade) {
    throw new NotFoundException('Oportunidade não encontrada');
  }
  
  // 2. Listar atividades da oportunidade (isolamento garantido)
  return this.atividadeRepository.find({
    where: { oportunidade_id: oportunidadeId }
  });
}
```

---

### ❓ 10. Notificacao (NÃO ENCONTRADA)
**Arquivo**: Não encontrado

**Status**: Entity não existe no sistema atual

**Análise**:
- ❓ Módulo de notificações não implementado ainda
- ❓ Quando for implementado, deverá seguir padrão multi-tenancy
- ✅ Documentar padrão para implementação futura

**Padrão Recomendado para Implementação Futura**:
```typescript
@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('uuid')
  empresa_id: string;
  
  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
  
  @Column('uuid')
  usuario_id: string;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
  
  @Column('text')
  mensagem: string;
  
  @Column({ type: 'boolean', default: false })
  lida: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 📋 Roadmap de Implementação

### Task #5: Migration Fatura + Contrato (HIGH PRIORITY)
**Estimativa**: 2-3 horas  
**Ordem de Execução**:
1. Migration Contrato (30 min)
2. Migration Fatura (30 min)
3. Atualizar Services (30 min)
4. Atualizar Controllers (30 min)
5. Criar E2E tests (1 hora)

**Arquivos a Modificar**:
- `backend/src/modules/contratos/entities/contrato.entity.ts`
- `backend/src/modules/contratos/contratos.service.ts`
- `backend/src/modules/contratos/contratos.controller.ts`
- `backend/src/modules/faturamento/entities/fatura.entity.ts`
- `backend/src/modules/faturamento/services/faturamento.service.ts`
- `backend/src/modules/faturamento/faturamento.controller.ts`
- `backend/test/multi-tenancy.e2e-spec.ts` (adicionar testes)

---

### Task #6: Migration Pagamento (HIGH PRIORITY)
**Estimativa**: 1 hora  
**Dependência**: Task #5 (Fatura precisa ter empresa_id)

**Ordem de Execução**:
1. Migration Pagamento (15 min)
2. Atualizar Service (15 min)
3. Atualizar Controller (15 min)
4. Criar E2E tests (15 min)

**Arquivos a Modificar**:
- `backend/src/modules/faturamento/entities/pagamento.entity.ts`
- `backend/src/modules/faturamento/services/pagamento.service.ts`
- `backend/src/modules/faturamento/faturamento.controller.ts`
- `backend/test/multi-tenancy.e2e-spec.ts` (adicionar testes)

---

### Task #7: Migration Produto (MEDIUM PRIORITY)
**Estimativa**: 30-45 minutos

**Ordem de Execução**:
1. Migration Produto (15 min)
2. Atualizar Service (10 min)
3. Atualizar Controller (10 min)
4. Criar E2E tests (10 min)

**Arquivos a Modificar**:
- `backend/src/modules/produtos/produto.entity.ts`
- `backend/src/modules/produtos/produtos.service.ts`
- `backend/src/modules/produtos/produtos.controller.ts`
- `backend/test/multi-tenancy.e2e-spec.ts` (adicionar testes)

---

### Task #8: Verificação Usuario (MEDIUM PRIORITY)
**Estimativa**: 1 hora

**Ordem de Execução**:
1. Auditar `users.controller.ts` (15 min)
2. Auditar `users.service.ts` (15 min)
3. Corrigir se necessário (15 min)
4. Criar E2E tests (15 min)

**Arquivos a Verificar/Modificar**:
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/test/multi-tenancy.e2e-spec.ts` (adicionar testes)

---

## 🎯 Métricas de Progresso

### Estado Atual (Pós Task #3)
```
Entities Auditadas:    10/10 (100%)
Entities Validadas:    3/10  (30%)
Entities Pendentes:    5/10  (50%)
Entities Verificação:  1/10  (10%)
Entities N/A:          1/10  (10%)

E2E Tests Passing:     15/16 (93.75%)
Cobertura Multi-Tenancy: 3/8 módulos críticos (37.5%)
```

### Meta Após Task #5-#8
```
Entities Validadas:    8/10  (80%)
Entities Pendentes:    0/10  (0%)
E2E Tests Passing:     20+/20+ (100%)
Cobertura Multi-Tenancy: 7/8 módulos críticos (87.5%)
```

---

## ✅ Critérios de Sucesso

### Por Entity
- [ ] Migration executada com sucesso
- [ ] Entity possui campo `empresa_id` UUID NOT NULL
- [ ] FK para `empresas` criada
- [ ] Índice `idx_<tabela>_empresa_id` criado
- [ ] Service filtra queries por `empresa_id`
- [ ] Controller usa `@EmpresaId()` decorator
- [ ] E2E tests validam isolamento multi-tenancy
- [ ] Cross-empresa access retorna 404 Not Found

### Global
- [ ] 100% das entities críticas com multi-tenancy
- [ ] 20+/20+ E2E tests passing (100%)
- [ ] Padrão consistente em todos os módulos
- [ ] Documentação completa
- [ ] Sem regressions em funcionalidades existentes

---

## 📝 Notas Importantes

### Ordem de Implementação Crítica
1. **Contrato ANTES de Fatura** (Fatura depende de Contrato)
2. **Fatura ANTES de Pagamento** (Pagamento depende de Fatura)
3. **Produto independente** (pode ser feito em paralelo)
4. **Usuario verificação** (já tem empresa_id, apenas validar)

### Riscos Identificados
- ⚠️ **Dados Existentes**: Migrations precisam popular empresa_id de registros existentes
- ⚠️ **Unique Constraints**: SKU de Produto é global, precisa ser por empresa
- ⚠️ **Relacionamentos**: Fatura/Contrato/Pagamento são interdependentes
- ⚠️ **Performance**: Queries precisam usar índices em empresa_id

### Boas Práticas
- ✅ Sempre criar índice em `empresa_id`
- ✅ Sempre criar FK para `empresas`
- ✅ Sempre usar `@EmpresaId()` decorator em controllers
- ✅ Sempre filtrar por `empresa_id` em services
- ✅ Sempre validar isolamento com E2E tests
- ✅ Sempre retornar 404 Not Found para cross-empresa access

---

**Última Atualização**: 2025-01-XX  
**Próxima Revisão**: Após completar Task #5 (Fatura + Contrato)
