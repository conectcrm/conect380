# 🧪 Guia de Testes: Integração Distribuição Avançada + Fila

## 📋 Objetivo

Validar que a integração entre **DistribuicaoAvancadaService** e **FilaService** está funcionando corretamente, com fallback automático para estratégia antiga quando necessário.

---

## 🎯 Cenários de Teste

### ✅ Teste 1: Distribuição Avançada COM Config Ativa

**Objetivo**: Verificar que tickets são distribuídos usando algoritmo avançado quando fila tem configuração ativa.

#### Setup

```sql
-- 1. Criar fila (se não existir)
INSERT INTO fila (id, nome, estrategia_distribuicao, empresa_id)
VALUES 
  ('fila-comercial-123', 'Comercial - Vendas', 'ROUND_ROBIN', 'empresa-456')
ON CONFLICT (id) DO NOTHING;

-- 2. Criar atendentes (se não existirem)
INSERT INTO "user" (id, nome, email, role, online, tickets_ativos)
VALUES 
  ('atendente-1', 'João Silva', 'joao@example.com', 'ATENDENTE', true, 2),
  ('atendente-2', 'Maria Santos', 'maria@example.com', 'ATENDENTE', true, 1),
  ('atendente-3', 'Pedro Costa', 'pedro@example.com', 'ATENDENTE', true, 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Vincular atendentes à fila
INSERT INTO fila_atendente (fila_id, atendente_id, prioridade)
VALUES 
  ('fila-comercial-123', 'atendente-1', 1),
  ('fila-comercial-123', 'atendente-2', 1),
  ('fila-comercial-123', 'atendente-3', 1)
ON CONFLICT (fila_id, atendente_id) DO NOTHING;

-- 4. Criar skills dos atendentes
INSERT INTO atendente_skill (id, atendente_id, skill, nivel_proficiencia)
VALUES 
  (uuid_generate_v4(), 'atendente-1', 'vendas', 4),
  (uuid_generate_v4(), 'atendente-1', 'negociacao', 5),
  (uuid_generate_v4(), 'atendente-2', 'vendas', 5),
  (uuid_generate_v4(), 'atendente-2', 'atendimento', 4),
  (uuid_generate_v4(), 'atendente-3', 'suporte', 3)
ON CONFLICT DO NOTHING;

-- 5. Criar configuração de distribuição avançada
INSERT INTO distribuicao_config (
  id, 
  fila_id, 
  algoritmo, 
  ativo, 
  prioridade_skills, 
  balanceamento_carga,
  consideracao_online,
  maximo_tickets_simultaneos
)
VALUES (
  uuid_generate_v4(),
  'fila-comercial-123',
  'skills',  -- Algoritmo skills-based
  true,      -- ATIVO!
  80,        -- 80% peso para skills
  20,        -- 20% peso para carga
  true,      -- Considerar apenas online
  5          -- Max 5 tickets por atendente
)
ON CONFLICT DO NOTHING;

-- 6. Criar ticket para testar
INSERT INTO ticket (
  id, 
  numero_protocolo,
  status, 
  empresa_id,
  contato_telefone,
  canal_id
)
VALUES (
  'ticket-test-001',
  'TICKET-001',
  'Aberto',
  'empresa-456',
  '+5511999999999',
  'canal-whatsapp-123'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Associar ticket à fila
UPDATE ticket 
SET fila_id = 'fila-comercial-123'
WHERE id = 'ticket-test-001';
```

#### Execução

**Opção A: Via API** (Recomendado)
```bash
POST http://localhost:3001/filas/distribuir
Content-Type: application/json

{
  "ticketId": "ticket-test-001",
  "filaId": "fila-comercial-123",
  "distribuicaoAutomatica": true
}
```

**Opção B: Via Service Direto** (TypeScript)
```typescript
const resultado = await this.filaService.distribuirTicket('empresa-456', {
  ticketId: 'ticket-test-001',
  filaId: 'fila-comercial-123',
  distribuicaoAutomatica: true,
});

console.log('Atendente:', resultado.atendente.nome);
console.log('Ticket:', resultado.ticket.status);
```

#### Validação

**1. Verificar logs do backend**:
```bash
# Deve aparecer:
✨ Distribuição Avançada: Ticket ticket-test-001 → Atendente [Nome]
```

**2. Verificar ticket atribuído**:
```sql
SELECT 
  t.id,
  t.numero_protocolo,
  t.atendente_id,
  u.nome AS atendente_nome,
  t.status
FROM ticket t
LEFT JOIN "user" u ON t.atendente_id = u.id
WHERE t.id = 'ticket-test-001';

-- Resultado esperado:
-- id                | numero_protocolo | atendente_id | atendente_nome  | status
-- ticket-test-001   | TICKET-001       | atendente-2  | Maria Santos    | Em atendimento
```

**3. Verificar log de distribuição criado**:
```sql
SELECT 
  dl.ticket_id,
  dl.atendente_id,
  u.nome AS atendente_nome,
  dl.algoritmo,
  dl.motivo,
  dl.carga_atendente,
  dl.sucesso,
  dl.created_at
FROM distribuicao_log dl
LEFT JOIN "user" u ON dl.atendente_id = u.id
WHERE dl.ticket_id = 'ticket-test-001'
ORDER BY dl.created_at DESC
LIMIT 1;

-- Resultado esperado:
-- algoritmo: 'skills'
-- motivo: 'Skills-based: vendas'
-- sucesso: true
```

**4. Verificar contador de tickets atualizado**:
```sql
SELECT id, nome, tickets_ativos 
FROM "user" 
WHERE id = 'atendente-2';

-- tickets_ativos deve ter aumentado em 1
```

#### ✅ Critérios de Sucesso

- [ ] Log mostra `✨ Distribuição Avançada`
- [ ] Ticket foi atribuído ao atendente correto (skills-based)
- [ ] Status do ticket mudou para `Em atendimento`
- [ ] Registro criado em `distribuicao_log` com `sucesso = true`
- [ ] Contador `tickets_ativos` do atendente aumentou
- [ ] Atendente escolhido tem a skill `vendas`

---

### ✅ Teste 2: Fallback para Estratégia Antiga (SEM Config)

**Objetivo**: Verificar que sistema usa estratégia antiga quando fila NÃO tem configuração avançada.

#### Setup

```sql
-- 1. Criar fila SEM config avançada
INSERT INTO fila (id, nome, estrategia_distribuicao, empresa_id)
VALUES 
  ('fila-suporte-789', 'Suporte Técnico', 'ROUND_ROBIN', 'empresa-456')
ON CONFLICT (id) DO NOTHING;

-- 2. Vincular atendentes à fila
INSERT INTO fila_atendente (fila_id, atendente_id, prioridade)
VALUES 
  ('fila-suporte-789', 'atendente-1', 1),
  ('fila-suporte-789', 'atendente-2', 1)
ON CONFLICT (fila_id, atendente_id) DO NOTHING;

-- 3. IMPORTANTE: NÃO criar distribuicao_config para esta fila!

-- 4. Criar ticket
INSERT INTO ticket (
  id, 
  numero_protocolo,
  status, 
  empresa_id,
  contato_telefone,
  canal_id,
  fila_id
)
VALUES (
  'ticket-test-002',
  'TICKET-002',
  'Aberto',
  'empresa-456',
  '+5511888888888',
  'canal-whatsapp-123',
  'fila-suporte-789'
)
ON CONFLICT (id) DO NOTHING;
```

#### Execução

```bash
POST http://localhost:3001/filas/distribuir
Content-Type: application/json

{
  "ticketId": "ticket-test-002",
  "filaId": "fila-suporte-789",
  "distribuicaoAutomatica": true
}
```

#### Validação

**1. Verificar logs do backend**:
```bash
# Deve aparecer:
⚠️ Distribuição Avançada não disponível para fila fila-suporte-789: Configuração de distribuição não encontrada

# E logo depois:
Ticket ticket-test-002 distribuído para [atendente-id]
```

**2. Verificar ticket atribuído usando estratégia antiga**:
```sql
SELECT 
  t.id,
  t.atendente_id,
  u.nome AS atendente_nome,
  t.status
FROM ticket t
LEFT JOIN "user" u ON t.atendente_id = u.id
WHERE t.id = 'ticket-test-002';

-- Status deve ser: Em atendimento
-- Atendente escolhido via ROUND_ROBIN (primeiro da fila ou próximo na rotação)
```

**3. Verificar que NÃO há log em distribuicao_log**:
```sql
SELECT * FROM distribuicao_log WHERE ticket_id = 'ticket-test-002';

-- Resultado esperado: (vazio)
-- Log só é criado quando usa distribuição avançada
```

#### ✅ Critérios de Sucesso

- [ ] Log mostra warning `⚠️ Distribuição Avançada não disponível`
- [ ] Sistema NÃO quebrou (fallback funcionou)
- [ ] Ticket foi atribuído usando ROUND_ROBIN
- [ ] Status mudou para `Em atendimento`
- [ ] NÃO há registro em `distribuicao_log`
- [ ] Sistema continuou funcionando normalmente

---

### ✅ Teste 3: Algoritmo Menor-Carga

**Objetivo**: Verificar que algoritmo `menor-carga` escolhe atendente com menos tickets ativos.

#### Setup

```sql
-- 1. Configurar fila com algoritmo menor-carga
INSERT INTO distribuicao_config (
  id, 
  fila_id, 
  algoritmo, 
  ativo
)
VALUES (
  uuid_generate_v4(),
  'fila-comercial-123',
  'menor-carga',  -- Algoritmo menor-carga
  true
)
ON CONFLICT (fila_id) 
DO UPDATE SET algoritmo = 'menor-carga', ativo = true;

-- 2. Atualizar carga dos atendentes
UPDATE "user" SET tickets_ativos = 5 WHERE id = 'atendente-1';
UPDATE "user" SET tickets_ativos = 2 WHERE id = 'atendente-2';  -- Menor carga!
UPDATE "user" SET tickets_ativos = 4 WHERE id = 'atendente-3';

-- 3. Criar ticket
INSERT INTO ticket (
  id, 
  numero_protocolo,
  status, 
  empresa_id,
  contato_telefone,
  canal_id,
  fila_id
)
VALUES (
  'ticket-test-003',
  'TICKET-003',
  'Aberto',
  'empresa-456',
  '+5511777777777',
  'canal-whatsapp-123',
  'fila-comercial-123'
)
ON CONFLICT (id) DO NOTHING;
```

#### Execução

```bash
POST http://localhost:3001/filas/distribuir
Content-Type: application/json

{
  "ticketId": "ticket-test-003",
  "filaId": "fila-comercial-123",
  "distribuicaoAutomatica": true
}
```

#### Validação

```sql
-- Verificar que ticket foi para atendente com MENOR carga
SELECT 
  t.atendente_id,
  u.nome,
  u.tickets_ativos
FROM ticket t
JOIN "user" u ON t.atendente_id = u.id
WHERE t.id = 'ticket-test-003';

-- Resultado esperado:
-- atendente_id: atendente-2
-- nome: Maria Santos
-- tickets_ativos: 3 (era 2, agora +1)
```

#### ✅ Critérios de Sucesso

- [ ] Ticket atribuído ao atendente com MENOR carga (`atendente-2`)
- [ ] Log mostra algoritmo `menor-carga`
- [ ] `distribuicao_log.motivo` = "Atendente com menor carga de trabalho"
- [ ] Contador de tickets aumentou corretamente

---

### ✅ Teste 4: Algoritmo Híbrido (Skills + Carga)

**Objetivo**: Verificar que algoritmo híbrido balanceia skills e carga de trabalho.

#### Setup

```sql
-- 1. Configurar fila com algoritmo híbrido
UPDATE distribuicao_config 
SET 
  algoritmo = 'hibrido',
  prioridade_skills = 70,       -- 70% peso para skills
  balanceamento_carga = 30      -- 30% peso para carga
WHERE fila_id = 'fila-comercial-123';

-- 2. Atualizar skills e cargas
-- Atendente 1: skill vendas=4, carga=1 (baixa)
UPDATE "user" SET tickets_ativos = 1 WHERE id = 'atendente-1';

-- Atendente 2: skill vendas=5, carga=3 (média)
UPDATE "user" SET tickets_ativos = 3 WHERE id = 'atendente-2';

-- Atendente 3: sem skill vendas, carga=0 (vazio)
UPDATE "user" SET tickets_ativos = 0 WHERE id = 'atendente-3';

-- 3. Criar ticket
INSERT INTO ticket (
  id, 
  numero_protocolo,
  status, 
  empresa_id,
  contato_telefone,
  canal_id,
  fila_id
)
VALUES (
  'ticket-test-004',
  'TICKET-004',
  'Aberto',
  'empresa-456',
  '+5511666666666',
  'canal-whatsapp-123',
  'fila-comercial-123'
)
ON CONFLICT (id) DO NOTHING;
```

#### Execução

```bash
POST http://localhost:3001/filas/distribuir
Content-Type: application/json

{
  "ticketId": "ticket-test-004",
  "filaId": "fila-comercial-123",
  "distribuicaoAutomatica": true
}
```

#### Validação

```sql
-- Verificar escolha híbrida
SELECT 
  dl.atendente_id,
  u.nome,
  dl.algoritmo,
  dl.motivo,
  u.tickets_ativos
FROM distribuicao_log dl
JOIN "user" u ON dl.atendente_id = u.id
WHERE dl.ticket_id = 'ticket-test-004';

-- Resultado esperado:
-- Provavelmente atendente-2 (Maria)
-- Motivo: 70% skills (vendas=5) + 30% carga (3 tickets) = melhor score
-- Algoritmo: hibrido
```

#### ✅ Critérios de Sucesso

- [ ] Ticket atribuído ao atendente com melhor score híbrido
- [ ] Log mostra `algoritmo = 'hibrido'`
- [ ] Motivo explica critério de escolha
- [ ] Atendente tem skills relevantes E carga balanceada

---

### ✅ Teste 5: Overflow para Fila Backup

**Objetivo**: Verificar que, se fila principal está cheia, ticket vai para fila backup.

#### Setup

```sql
-- 1. Criar fila backup
INSERT INTO fila (id, nome, estrategia_distribuicao, empresa_id)
VALUES 
  ('fila-backup-999', 'Backup - Overflow', 'MENOR_CARGA', 'empresa-456')
ON CONFLICT (id) DO NOTHING;

-- 2. Vincular atendente à fila backup
INSERT INTO fila_atendente (fila_id, atendente_id, prioridade)
VALUES 
  ('fila-backup-999', 'atendente-3', 1)
ON CONFLICT (fila_id, atendente_id) DO NOTHING;

-- 3. Configurar overflow na fila principal
UPDATE distribuicao_config 
SET 
  permitir_overflow = true,
  fila_backup_id = 'fila-backup-999'
WHERE fila_id = 'fila-comercial-123';

-- 4. Simular fila principal cheia (todos atendentes no limite)
UPDATE "user" SET tickets_ativos = 5 WHERE id IN ('atendente-1', 'atendente-2');

-- Atendente da backup tem espaço
UPDATE "user" SET tickets_ativos = 1 WHERE id = 'atendente-3';

-- 5. Criar ticket
INSERT INTO ticket (
  id, 
  numero_protocolo,
  status, 
  empresa_id,
  contato_telefone,
  canal_id,
  fila_id
)
VALUES (
  'ticket-test-005',
  'TICKET-005',
  'Aberto',
  'empresa-456',
  '+5511555555555',
  'canal-whatsapp-123',
  'fila-comercial-123'  -- Fila principal (cheia)
)
ON CONFLICT (id) DO NOTHING;
```

#### Execução

```bash
POST http://localhost:3001/filas/distribuir
Content-Type: application/json

{
  "ticketId": "ticket-test-005",
  "filaId": "fila-comercial-123",
  "distribuicaoAutomatica": true
}
```

#### Validação

```sql
-- Verificar overflow
SELECT 
  dl.ticket_id,
  dl.atendente_id,
  u.nome,
  dl.fila_id,
  dl.motivo
FROM distribuicao_log dl
JOIN "user" u ON dl.atendente_id = u.id
WHERE dl.ticket_id = 'ticket-test-005';

-- Resultado esperado:
-- atendente_id: atendente-3
-- fila_id: fila-backup-999 (BACKUP, não principal!)
-- motivo: "Overflow para fila backup (fila-backup-999)"
```

#### ✅ Critérios de Sucesso

- [ ] Ticket foi para fila BACKUP (não principal)
- [ ] Atendente escolhido está na fila backup
- [ ] Log mostra motivo = "Overflow para fila backup"
- [ ] Sistema detectou que fila principal estava cheia

---

## 🚀 Script de Teste Automatizado (PowerShell)

```powershell
# test-distribuicao-integracao.ps1

$baseUrl = "http://localhost:3001"
$empresaId = "empresa-456"

Write-Host "🧪 Iniciando testes de integração Distribuição Avançada" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Com Config Ativa
Write-Host "✅ Teste 1: Distribuição com Config Ativa" -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "$baseUrl/filas/distribuir" -Method POST -Body (@{
    ticketId = "ticket-test-001"
    filaId = "fila-comercial-123"
    distribuicaoAutomatica = $true
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "   Atendente: $($response1.atendente.nome)" -ForegroundColor Green
Write-Host "   Status: $($response1.ticket.status)" -ForegroundColor Green
Write-Host ""

# Teste 2: Sem Config (Fallback)
Write-Host "✅ Teste 2: Fallback para Estratégia Antiga" -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "$baseUrl/filas/distribuir" -Method POST -Body (@{
    ticketId = "ticket-test-002"
    filaId = "fila-suporte-789"
    distribuicaoAutomatica = $true
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "   Atendente: $($response2.atendente.nome)" -ForegroundColor Green
Write-Host "   Status: $($response2.ticket.status)" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Testes concluídos!" -ForegroundColor Cyan
```

**Executar**:
```bash
.\test-distribuicao-integracao.ps1
```

---

## 📊 Monitoramento Pós-Implantação

### Queries Úteis

**1. Taxa de uso de distribuição avançada vs antiga**:
```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM distribuicao_log WHERE ticket_id = t.id)
    THEN 'Avançada'
    ELSE 'Antiga'
  END AS tipo_distribuicao,
  COUNT(*) AS total
FROM ticket t
WHERE t.created_at >= NOW() - INTERVAL '24 hours'
  AND t.atendente_id IS NOT NULL
GROUP BY tipo_distribuicao;
```

**2. Algoritmos mais usados**:
```sql
SELECT 
  algoritmo,
  COUNT(*) AS vezes_usado,
  ROUND(AVG(tempo_processamento_ms), 2) AS tempo_medio_ms
FROM distribuicao_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY algoritmo
ORDER BY vezes_usado DESC;
```

**3. Taxa de fallback (erros)**:
```sql
SELECT 
  DATE(created_at) AS data,
  COUNT(*) FILTER (WHERE sucesso = true) AS sucessos,
  COUNT(*) FILTER (WHERE sucesso = false) AS falhas,
  ROUND(COUNT(*) FILTER (WHERE sucesso = false)::NUMERIC / COUNT(*) * 100, 2) AS taxa_falha_pct
FROM distribuicao_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
```

---

## ✅ Checklist Final

Antes de considerar integração concluída:

- [ ] **Teste 1**: Distribuição com config ativa funcionando
- [ ] **Teste 2**: Fallback para estratégia antiga funcionando
- [ ] **Teste 3**: Algoritmo menor-carga funcionando
- [ ] **Teste 4**: Algoritmo híbrido funcionando
- [ ] **Teste 5**: Overflow para fila backup funcionando
- [ ] Logs estão sendo criados em `distribuicao_log`
- [ ] Contadores `tickets_ativos` estão atualizando
- [ ] Backend não tem erros de compilação
- [ ] Não há warnings de dependência circular
- [ ] Sistema antigo continua funcionando para filas sem config
- [ ] Documentação atualizada

---

**Próximo passo**: Após todos os testes passarem, marcar integração como ✅ CONCLUÍDA e mover para produção!
