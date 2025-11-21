# 📖 Runbooks - ConectCRM Alerting
## Guia de Resposta a Incidentes (Week 9)

**Versão**: 1.0  
**Última atualização**: 2025-11-18  
**Equipe responsável**: SRE / DevOps

---

## 📋 Índice

1. [Alertas Críticos](#alertas-críticos)
   - [APIDown](#1-apidown)
   - [DatabaseConnectionPoolExhausted](#2-databaseconnectionpoolexhausted)
   - [HighLatencyP99](#3-highlatencyp99)
   - [DiskSpaceRunningOut](#4-diskspacerunningout)
   - [SLOAvailabilityViolation](#5-sloavailabilityviolation)

2. [Alertas de Warning](#alertas-de-warning)
   - [HighHTTPErrorRate](#6-highhttperrorrate)
   - [HighLatencyP95](#7-highlatencyp95)
   - [SlowDatabaseQueries](#8-slowdatabasequeries)
   - [HighCPUUsage](#9-highcpuusage)
   - [HighMemoryUsage](#10-highmemoryusage)

3. [Alertas Baseados em Logs](#alertas-baseados-em-logs)
   - [CriticalLogDetected](#11-criticallogdetected)
   - [DatabaseConnectionErrors](#12-databaseconnectionerrors)
   - [MultipleFailedLogins](#13-multiplefailedlogins)
   - [PaymentProcessingErrors](#14-paymentprocessingerrors)

4. [Procedimentos Gerais](#procedimentos-gerais)
   - [Como Silenciar um Alerta](#como-silenciar-um-alerta)
   - [Como Escalar um Incidente](#como-escalar-um-incidente)
   - [Post-Mortem Template](#post-mortem-template)

---

## 🚨 Alertas Críticos

### 1. APIDown

**Severidade**: 🔴 CRITICAL  
**Descrição**: A API do ConectCRM está fora do ar e não responde a requisições.

#### 🎯 Impacto
- ❌ Clientes não conseguem acessar o sistema
- ❌ Tickets não podem ser criados/respondidos
- ❌ Dashboards não carregam dados
- 💰 **Impacto financeiro**: Alto (perda de receita)

#### 🔍 Diagnóstico

1. **Verificar se o backend está rodando**:
   ```powershell
   docker ps --filter "name=backend"
   ```
   
   - Se não aparecer: Backend está parado → Prosseguir para **Ação 1**
   - Se aparecer "unhealthy": Backend rodando mas com problemas → **Ação 2**

2. **Verificar logs recentes**:
   ```powershell
   docker logs conectsuite-backend --tail 100
   ```
   
   Procurar por:
   - `Error: listen EADDRINUSE` → Porta 3001 já em uso
   - `ECONNREFUSED` → Banco de dados não acessível
   - `Out of memory` → Falta de memória
   - Stack traces de exceptions não tratadas

3. **Verificar saúde do PostgreSQL**:
   ```powershell
   docker ps --filter "name=postgres"
   docker logs conectsuite-postgres --tail 50
   ```

#### ✅ Ações de Resolução

**Ação 1: Backend parado (restart)**
```powershell
# 1. Reiniciar container
docker-compose restart backend

# 2. Aguardar 10 segundos
Start-Sleep -Seconds 10

# 3. Verificar saúde
curl http://localhost:3001/health

# 4. Verificar logs de inicialização
docker logs conectsuite-backend --tail 50
```

**Ação 2: Backend unhealthy (investigar e restart)**
```powershell
# 1. Coletar logs detalhados
docker logs conectsuite-backend --tail 200 > backend-incident-$(Get-Date -Format 'yyyyMMdd-HHmmss').log

# 2. Verificar conexão com banco
Test-NetConnection -ComputerName localhost -Port 5432

# 3. Se DB está OK, restart forçado
docker-compose stop backend
docker-compose up -d backend

# 4. Monitorar startup
docker logs conectsuite-backend -f
```

**Ação 3: Banco de dados inacessível**
```powershell
# 1. Verificar se PostgreSQL está rodando
docker ps --filter "name=postgres"

# 2. Se não está rodando, iniciar
docker-compose start postgres

# 3. Aguardar DB ficar pronto (15s)
Start-Sleep -Seconds 15

# 4. Testar conexão
docker exec conectsuite-postgres pg_isready -U postgres

# 5. Reiniciar backend após DB subir
docker-compose restart backend
```

#### ⏱️ SLA de Resolução
- **Detecção → Ação**: < 2 minutos
- **Ação → Resolução**: < 5 minutos
- **MTTR Target**: < 7 minutos

#### 📊 Métricas de Sucesso
- [ ] API respondendo em `http://localhost:3001/health`
- [ ] Prometheus scraping com sucesso (0 erros em 2 minutos)
- [ ] Logs sem exceções críticas
- [ ] Frontend carregando normalmente

#### 📝 Checklist Pós-Incidente
- [ ] Documentar causa raiz no post-mortem
- [ ] Atualizar runbook se necessário
- [ ] Criar task para prevenir reincidência
- [ ] Notificar equipe e stakeholders

---

### 2. DatabaseConnectionPoolExhausted

**Severidade**: 🔴 CRITICAL  
**Descrição**: Pool de conexões com PostgreSQL está 90%+ ocupado.

#### 🎯 Impacto
- ⚠️ Requisições lentas (esperam conexão disponível)
- ❌ Timeouts em queries
- 💥 Possível queda da API se atingir 100%

#### 🔍 Diagnóstico

1. **Verificar estado atual do pool**:
   ```bash
   # Prometheus query
   (typeorm_connection_pool_active / typeorm_connection_pool_max) * 100
   ```

2. **Identificar conexões ativas no PostgreSQL**:
   ```sql
   SELECT 
     datname, 
     state, 
     COUNT(*) as connections,
     MAX(now() - query_start) as max_duration
   FROM pg_stat_activity 
   WHERE datname = 'conectcrm'
   GROUP BY datname, state;
   ```

3. **Identificar queries lentas (> 5s)**:
   ```sql
   SELECT 
     pid, 
     now() - query_start AS duration, 
     state, 
     query 
   FROM pg_stat_activity 
   WHERE state != 'idle' 
     AND now() - query_start > interval '5 seconds'
   ORDER BY duration DESC;
   ```

#### ✅ Ações de Resolução

**Ação 1: Aumentar pool temporariamente (curto prazo)**
```typescript
// backend/src/config/database.config.ts
extra: {
  max: 20,  // Aumentar de 10 para 20
  min: 2,
  idleTimeoutMillis: 30000,
}
```

**Ação 2: Matar queries lentas (emergência)**
```sql
-- Identificar PIDs de queries > 30s
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state != 'idle' 
  AND now() - query_start > interval '30 seconds'
  AND datname = 'conectcrm';
```

**Ação 3: Reiniciar backend (liberar conexões travadas)**
```powershell
docker-compose restart backend
```

#### 🛠️ Prevenção (Longo Prazo)
- [ ] Otimizar queries lentas (adicionar índices)
- [ ] Implementar connection pooling externo (PgBouncer)
- [ ] Monitorar query performance (APM)
- [ ] Configurar query timeout (30s)

---

### 3. HighLatencyP99

**Severidade**: 🔴 CRITICAL  
**Descrição**: 1% das requisições com latência > 5 segundos.

#### 🎯 Impacto
- 😤 Usuários experimentando lentidão extrema
- 📉 Degradação da experiência (UX ruim)
- ⚠️ SLO de latência em risco

#### 🔍 Diagnóstico

1. **Identificar rotas afetadas**:
   ```promql
   topk(5, 
     histogram_quantile(0.99, 
       sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
     )
   )
   ```

2. **Verificar traces no Jaeger**:
   - Acessar: http://localhost:16686
   - Filtrar por: `duration > 5s`
   - Ordenar por: Longest First
   - Analisar spans lentos (DB, external APIs, processing)

3. **Verificar logs de slow queries**:
   ```
   {job="conectcrm-backend"} |~ "(?i)query.*timeout|slow.*query"
   ```

#### ✅ Ações de Resolução

**Ação 1: Cache temporário em rotas lentas**
```typescript
// Adicionar cache in-memory (15 segundos)
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@CacheTTL(15)
@Get('/rota-lenta')
async rotaLenta() { ... }
```

**Ação 2: Otimizar query específica**
- Identificar query no trace do Jaeger
- Analisar EXPLAIN ANALYZE no PostgreSQL
- Adicionar índice se necessário

**Ação 3: Escalar recursos (curto prazo)**
- Aumentar CPU/RAM do backend (se containerizado)
- Ou reiniciar para limpar cache/memória

---

### 4. DiskSpaceRunningOut

**Severidade**: 🔴 CRITICAL  
**Descrição**: Disco com mais de 90% de uso.

#### 🎯 Impacto
- ❌ Backend não consegue escrever logs
- ❌ PostgreSQL não consegue gravar dados
- 💥 Sistema pode falhar completamente

#### 🔍 Diagnóstico

```powershell
# Verificar uso de disco
Get-PSDrive -PSProvider FileSystem

# Identificar maiores diretórios
Get-ChildItem -Path C:\Projetos\conectcrm -Recurse -Directory |
  ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB
    [PSCustomObject]@{
      Path = $_.FullName
      SizeGB = [Math]::Round($size, 2)
    }
  } | Sort-Object SizeGB -Descending | Select-Object -First 10
```

#### ✅ Ações de Resolução

**Ação 1: Limpar logs antigos**
```powershell
# Remover logs > 7 dias
Get-ChildItem -Path C:\Projetos\conectcrm\backend\logs -Recurse -File |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item -Force

# Remover Docker images não utilizadas
docker image prune -a --filter "until=168h" -f
```

**Ação 2: Limpar volumes Docker órfãos**
```powershell
docker volume prune -f
```

**Ação 3: Rotacionar logs do PostgreSQL**
```sql
-- Limpar logs antigos do PG
SELECT pg_rotate_logfile();
```

---

### 5. SLOAvailabilityViolation

**Severidade**: 🔴 CRITICAL  
**Descrição**: Success rate caiu abaixo de 99.9% no período mensal.

#### 🎯 Impacto
- 📉 SLO violado (contrato com clientes)
- 💸 Possível crédito/reembolso para clientes
- 📊 Error budget esgotado

#### 🔍 Diagnóstico

1. **Verificar taxa de erros atual**:
   ```promql
   1 - (sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d])))
   ```

2. **Identificar picos de erro**:
   - Dashboard: Week 6 - Error Budget Management
   - Gráfico: Error Rate Over Time

3. **Analisar logs de erros**:
   ```
   {job="conectcrm-backend", level="error"} 
   | json 
   | line_format "{{.timestamp}} [{{.context}}] {{.message}}"
   ```

#### ✅ Ações de Resolução

**Ação 1: Comunicar stakeholders**
- Notificar gerência sobre violação de SLO
- Preparar relatório de impacto
- Estimar tempo de recuperação

**Ação 2: Parar deploys (freeze)**
- Impedir novos deploys até estabilizar
- Rollback da última versão se necessário

**Ação 3: Investigar causa raiz**
- Revisar deploys recentes
- Analisar mudanças de configuração
- Verificar dependências externas (APIs)

---

## ⚠️ Alertas de Warning

### 6. HighHTTPErrorRate

**Descrição**: Taxa de erros HTTP 5xx > 5% por 3 minutos.

#### ✅ Ações
1. Verificar logs: `{level="error"} |~ "5\\d\\d"`
2. Identificar rota específica com erro
3. Checar traces no Jaeger
4. Se persistir > 10min, escalar para CRITICAL

---

### 7. HighLatencyP95

**Descrição**: 5% das requisições com latência > 2s.

#### ✅ Ações
1. Identificar rota lenta no Grafana
2. Analisar trace no Jaeger
3. Verificar slow queries no PostgreSQL
4. Adicionar cache se necessário

---

### 8. SlowDatabaseQueries

**Descrição**: P95 de query time > 1 segundo.

#### ✅ Ações
1. Identificar entity/tabela:
   ```promql
   topk(5, histogram_quantile(0.95, 
     sum(rate(typeorm_query_duration_seconds_bucket[5m])) by (le, entity)
   ))
   ```

2. Executar EXPLAIN ANALYZE:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
   ```

3. Criar índice se necessário:
   ```sql
   CREATE INDEX idx_tickets_status ON tickets(status);
   ```

---

## 📝 Alertas Baseados em Logs

### 11. CriticalLogDetected

**Descrição**: Logs com nível CRITICAL registrados.

#### ✅ Ações
1. Verificar log específico:
   ```
   {job="conectcrm-backend", level="critical"} | json
   ```

2. Identificar contexto (context, trace_id)
3. Rastrear no Jaeger pelo trace_id
4. Corrigir código se bug encontrado

---

### 12. DatabaseConnectionErrors

**Descrição**: Erros de conexão com PostgreSQL nos logs.

#### ✅ Ações
1. Verificar se PostgreSQL está rodando:
   ```powershell
   docker ps --filter "name=postgres"
   ```

2. Testar conectividade:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```

3. Verificar logs do PG:
   ```powershell
   docker logs conectsuite-postgres --tail 100
   ```

4. Reiniciar PostgreSQL se necessário:
   ```powershell
   docker-compose restart postgres
   ```

---

### 13. MultipleFailedLogins

**Descrição**: Mais de 20 tentativas de login falhadas em 5 minutos.

#### ✅ Ações
1. Identificar IPs suspeitos:
   ```
   {job="conectcrm-backend"} |~ "(?i)failed.*login" 
   | json 
   | line_format "{{.ip}} {{.username}}"
   ```

2. Bloquear IP temporariamente (se ataque):
   ```typescript
   // Adicionar ao rate limiter
   @Throttle(5, 60) // 5 tentativas por minuto
   @Post('/login')
   async login() { ... }
   ```

3. Notificar segurança se padrão de ataque

---

### 14. PaymentProcessingErrors

**Descrição**: Erros críticos no fluxo de pagamentos.

#### ✅ Ações
1. Verificar transações afetadas:
   ```
   {job="conectcrm-backend"} |~ "(?i)payment.*error" | json
   ```

2. Checar Stripe Dashboard:
   - https://dashboard.stripe.com/payments
   - Verificar failed payments

3. Notificar time financeiro imediatamente
4. Reprocessar pagamentos manualmente se necessário

---

## 🛠️ Procedimentos Gerais

### Como Silenciar um Alerta

**Quando usar**: Manutenção programada, falso positivo, incidente já conhecido.

**Via Alertmanager UI**:
1. Acessar: http://localhost:9093
2. Clicar no alerta
3. "Silence" → Preencher:
   - Duration: 1h, 4h, 24h
   - Comment: "Manutenção programada - deploy v2.1.0"
   - Created by: Seu nome
4. Confirmar

**Via CLI (amtool)**:
```powershell
docker exec conectsuite-alertmanager amtool silence add alertname="HighLatencyP95" --duration=2h --comment="Investigating"
```

---

### Como Escalar um Incidente

**Níveis de Escalação**:

**Nível 1 - SRE On-Call** (você):
- Alerts WARNING e INFO
- Troubleshooting inicial

**Nível 2 - SRE Lead**:
- Alerts CRITICAL não resolvidos em 15min
- Impacto em múltiplos clientes
- SLO violation

**Nível 3 - Engineering Manager + CTO**:
- Outage completo > 30min
- Perda de dados
- Incidente de segurança

**Canais de Comunicação**:
- Slack: `#incidents`
- Email: `sre-oncall@conectcrm.com`
- Phone: (emergência apenas)

---

### Post-Mortem Template

```markdown
# Post-Mortem: [Título do Incidente]

**Data**: 2025-11-18  
**Severidade**: Critical  
**Duração**: 15 minutos (10:30 - 10:45 UTC)  
**Impacto**: 1.200 usuários afetados, 500 requisições falhadas

## 📋 Sumário Executivo
[Descrição em 2-3 parágrafos sobre o que aconteceu]

## ⏱️ Timeline
- 10:30 - Alert disparado: APIDown
- 10:32 - On-call inicia investigação
- 10:35 - Identificada causa raiz: PostgreSQL connection pool exausto
- 10:40 - Ação implementada: Pool aumentado de 10 para 20 conexões
- 10:43 - Backend reiniciado
- 10:45 - Sistema restaurado, alerta resolvido

## 🔍 Causa Raiz
[Análise detalhada técnica do que causou o incidente]

## ✅ Ações Tomadas
1. Aumentado pool de conexões PostgreSQL
2. Reiniciado backend
3. Monitorado recovery por 15 minutos

## 🛡️ Prevenção (Action Items)
- [ ] Implementar auto-scaling de pool de conexões
- [ ] Adicionar alerta preventivo em 80% de uso
- [ ] Documentar troubleshooting de pool exhaustion
- [ ] Review code: identificar queries que não fecham conexões

## 📊 Métricas
- MTTR: 15 minutos ✅ (target < 30min)
- MTTD: 2 minutos ✅ (alerting funcionou)
- Impact: 1.200 usuários, 0,5% da base
```

---

## 🔗 Links Úteis

- **Prometheus Alerts**: http://localhost:9090/alerts
- **Alertmanager UI**: http://localhost:9093
- **Grafana Alerting Dashboard**: http://localhost:3002/d/alerting-dashboard
- **Jaeger Traces**: http://localhost:16686
- **Loki Logs**: http://localhost:3002/explore (datasource: Loki)

---

**Versão do documento**: 1.0  
**Próxima revisão**: Após cada incidente ou mensalmente  
**Mantenedores**: Equipe SRE ConectCRM
