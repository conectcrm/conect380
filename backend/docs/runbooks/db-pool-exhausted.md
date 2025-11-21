# Runbook: Database Connection Pool Exhausted
**Severity**: CRITICAL  
**Impact**: Requisições falhando com timeout, degradação severa de performance

## 🚨 Sintomas
- Alerta `DatabaseConnectionPoolExhausted` disparado
- Logs mostrando "TimeoutError: ResourceRequest timed out"
- API respondendo 503 ou timeout em endpoints que acessam DB
- Métrica `typeorm_connection_pool_active` próxima de `typeorm_connection_pool_max`

## 🔍 Diagnóstico Rápido (2 minutos)

### 1. Verificar estado do pool
```bash
# Acessar métricas Prometheus
curl http://localhost:3001/metrics | grep typeorm_connection_pool

# Esperado:
# typeorm_connection_pool_max 20
# typeorm_connection_pool_active 18-20 (PROBLEMA!)
# typeorm_connection_pool_idle 0-2
```

### 2. Verificar conexões ativas no PostgreSQL
```sql
-- Conectar ao banco
psql -U conectcrm -d conectcrm

-- Ver conexões por estado
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = 'conectcrm'
GROUP BY state;

-- Ver queries longas (> 1min)
SELECT 
  pid, 
  now() - query_start as duration, 
  state,
  query 
FROM pg_stat_activity 
WHERE state != 'idle' 
  AND query_start < now() - interval '1 minute'
ORDER BY duration DESC;
```

### 3. Verificar se há lock/deadlock
```sql
-- Verificar locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Verificar processos bloqueados
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;
```

## 🔧 Soluções Imediatas

### Solução 1: Aumentar pool temporariamente (< 2min)
```typescript
// backend/src/config/database.config.ts
extra: {
  max: 30,  // Era 20, aumentar temporariamente
  min: 5,
  idle: 10000,
  acquire: 60000,  // Timeout maior
  evict: 1000
}
```

```bash
# Reiniciar aplicação
pm2 restart conectcrm-api

# Verificar se resolveu
curl http://localhost:3001/metrics | grep typeorm_connection_pool_active
```

### Solução 2: Matar conexões longas (CUIDADO!)
```sql
-- Ver conexões idle há mais de 5min
SELECT pid, state, now() - state_change as idle_time
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND state_change < now() - interval '5 minutes';

-- Matar conexão específica
SELECT pg_terminate_backend(<PID>);

-- OU matar todas idle em transação > 5min
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND state_change < now() - interval '5 minutes';
```

### Solução 3: Reiniciar aplicação (última opção)
```bash
# Restart graceful
pm2 reload conectcrm-api

# Se não resolver, restart forçado
pm2 restart conectcrm-api
```

## 🔍 Root Cause Analysis (10-15min)

### Causa 1: Conexões não sendo liberadas
**Sintoma**: Pool sempre cheio, queries rápidas mas pool não libera

**Investigação**:
```typescript
// Procurar por queryRunner não finalizado
grep -r "queryRunner.connect()" backend/src --include="*.ts"
grep -r "queryRunner.release()" backend/src --include="*.ts"

// Verificar se todos os connects têm release correspondente
```

**Fix**:
```typescript
// ❌ ERRADO - Não libera conexão
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
const result = await queryRunner.query('SELECT ...');
return result; // BUG: Não liberou!

// ✅ CORRETO - Sempre liberar
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
try {
  const result = await queryRunner.query('SELECT ...');
  return result;
} finally {
  await queryRunner.release(); // SEMPRE liberar
}
```

### Causa 2: Queries lentas/travadas
**Sintoma**: Conexões ficam presas em queries longas

**Investigação**:
```sql
-- Ver queries mais lentas (últimas 24h)
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1s
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Fix**:
- Adicionar índices em colunas usadas em WHERE/JOIN
- Otimizar queries N+1 (usar relations no TypeORM)
- Adicionar paginação em listagens grandes

### Causa 3: Tráfego excessivo
**Sintoma**: Pool adequado, mas tráfego maior que capacidade

**Investigação**:
```bash
# Verificar requests/segundo
curl http://localhost:3001/metrics | grep http_requests_total

# Comparar com baseline normal
```

**Fix**:
- Escalar horizontalmente (adicionar instâncias)
- Implementar cache (Redis) para queries frequentes
- Otimizar endpoints mais chamados

### Causa 4: Leak de transações
**Sintoma**: Muitas conexões "idle in transaction"

**Investigação**:
```sql
SELECT count(*)
FROM pg_stat_activity
WHERE state = 'idle in transaction';
```

**Fix**:
```typescript
// ❌ ERRADO - Transação não finalizada
await queryRunner.startTransaction();
const result = await queryRunner.query('INSERT ...');
return result; // BUG: Não commitou!

// ✅ CORRETO - Sempre commit/rollback
await queryRunner.startTransaction();
try {
  const result = await queryRunner.query('INSERT ...');
  await queryRunner.commitTransaction();
  return result;
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

## 📋 Checklist de Recuperação

- [ ] Pool voltou a < 80% de uso?
- [ ] Latência de requisições normalizada?
- [ ] Sem conexões "idle in transaction" > 1min?
- [ ] Logs sem TimeoutError?
- [ ] Funcionalidades críticas testadas?

## 🛡️ Prevenção

### Configurações Recomendadas

```typescript
// database.config.ts
extra: {
  max: 20,                // Pool máximo
  min: 5,                 // Pool mínimo mantido
  idle: 10000,            // Liberar após 10s idle
  acquire: 30000,         // Timeout 30s para adquirir conexão
  evict: 1000,            // Checar idle a cada 1s
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000    // Matar query > 10s
}
```

### Monitoring Alerts

```yaml
# alert-rules.yml
- alert: DatabaseConnectionPoolWarning
  expr: typeorm_connection_pool_active / typeorm_connection_pool_max > 0.8
  for: 5m
  severity: warning

- alert: DatabaseConnectionPoolCritical
  expr: typeorm_connection_pool_active / typeorm_connection_pool_max > 0.9
  for: 2m
  severity: critical
```

### Code Review Checklist

- [ ] Todo `queryRunner.connect()` tem `release()` no finally?
- [ ] Todo `startTransaction()` tem `commit/rollback`?
- [ ] Queries grandes usam paginação?
- [ ] Não há queries N+1?
- [ ] Timeout configurado em queries longas?

## 📞 Escalação

| Tempo | Ação |
|---|---|
| 0-5min | On-call tenta soluções imediatas |
| 5-10min | Escalar para DBA/Backend Lead |
| 10min+ | Considerar escalar DB (mais recursos) |

## 🔗 Links Úteis
- [Dashboard Database](http://grafana.conectcrm.com/d/database)
- [TypeORM Connection Docs](https://typeorm.io/data-source-options)
- [PostgreSQL pg_stat_activity](https://www.postgresql.org/docs/current/monitoring-stats.html)

## 📝 Pós-Incidente
1. Documentar query/código que causou o leak
2. Criar fix e testes para prevenir recorrência
3. Revisar configurações de pool
4. Considerar implementar circuit breaker
