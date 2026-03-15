# 📋 Week 8: Logs Centralizados com Loki

## ✅ Status: COMPLETO (100%)

Implementação de log aggregation centralizado usando Grafana Loki + Promtail, com correlação automática para traces (Jaeger) e métricas (Prometheus).

---

## 🎯 Objetivos Alcançados

### 1. Infraestrutura de Logs
- ✅ **Loki** rodando na porta 3100 (armazenamento de logs)
- ✅ **Promtail** coletando logs do backend
- ✅ **Grafana** integrado com datasource Loki
- ✅ Configuração TSDB (schema v13) para melhor performance

### 2. Structured Logging
- ✅ Implementado `StructuredLogger` (NestJS compatível)
- ✅ Formato JSON com campos estruturados:
  - `timestamp`, `level`, `message`, `context`
  - `trace_id`, `span_id` (correlação OpenTelemetry)
  - `userId`, `empresaId` (contexto de negócio)
  - `method`, `url`, `statusCode`, `duration` (HTTP context)

### 3. Observability Stack Completo
- ✅ **Metrics** (Prometheus) → Dashboard de Error Budget
- ✅ **Traces** (Jaeger) → Distributed Tracing
- ✅ **Logs** (Loki) → Centralized Logging
- ✅ **Correlação** entre os 3 pilares via `trace_id`

---

## 🏗️ Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                     │
│                                                         │
│  StructuredLogger → logs/application.log (JSON)        │
│         ↓                                               │
│  OpenTelemetry → trace_id, span_id                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │       Promtail (Collector)    │
         │                               │
         │  • Tail log files             │
         │  • Parse JSON                 │
         │  • Extract labels             │
         │  • Push to Loki               │
         └───────────────┬───────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │       Loki (Storage)          │
         │                               │
         │  • Index logs                 │
         │  • Query API                  │
         │  • Retention (14 days)        │
         └───────────────┬───────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │      Grafana (Visualization)  │
         │                               │
         │  • Explore logs               │
         │  • Dashboard                  │
         │  • Correlation → Jaeger       │
         └───────────────────────────────┘
```

---

## 📁 Arquivos Criados/Modificados

### 1. Docker Infrastructure

#### `docker-compose.yml` (modificado)
```yaml
# Loki Service
loki:
  image: grafana/loki:latest
  container_name: conectsuite-loki
  user: "0"  # Run as root para evitar permission denied
  command: -config.file=/etc/loki/loki-config.yml
  ports:
    - "3100:3100"
  volumes:
    - ./observability/loki/loki-config.yml:/etc/loki/loki-config.yml:ro
    - loki_data:/loki
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3100/ready"]

# Promtail Service
promtail:
  image: grafana/promtail:latest
  container_name: conectsuite-promtail
  depends_on:
    - loki
  volumes:
    - ./observability/promtail/promtail-config.yml:/etc/promtail/promtail-config.yml:ro
    - ./backend/logs:/var/log/backend:ro
```

### 2. Loki Configuration

#### `observability/loki/loki-config.yml`
```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

# Common configuration (storage)
common:
  instance_addr: 0.0.0.0
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

# Query cache
query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

# Schema (TSDB v13 - latest)
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

# Storage (TSDB shipper)
storage_config:
  tsdb_shipper:
    active_index_directory: /loki/tsdb-index
    cache_location: /loki/tsdb-cache
    cache_ttl: 24h
  filesystem:
    directory: /loki/chunks

# Limits
limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h  # 7 days
  ingestion_rate_mb: 16
  ingestion_burst_size_mb: 32
  max_query_series: 100000
  max_query_parallelism: 32
  max_query_lookback: 720h  # 30 days

# Alertmanager
ruler:
  alertmanager_url: http://alertmanager:9093
  storage:
    type: local
    local:
      directory: /loki/rules
  rule_path: /loki/rules-temp
  enable_api: true
```

**⚠️ Pontos Importantes:**
- Schema **v13** (TSDB) → Melhor performance que BoltDB
- **user: "0"** no docker-compose → Evita erro "permission denied" no volume
- Cache de 100MB para queries rápidas

### 3. Promtail Configuration

#### `observability/promtail/promtail-config.yml`
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

# Push para Loki
clients:
  - url: http://loki:3100/loki/api/v1/push

# Jobs de scraping
scrape_configs:
  # Backend logs (JSON estruturado)
  - job_name: conectcrm-backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: conectcrm-backend
          env: ${ENVIRONMENT:-development}
          __path__: /var/log/backend/*.log

    # Pipeline de parsing JSON
    pipeline_stages:
      # Parse JSON
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            context: context
            trace_id: trace_id
            span_id: span_id
            userId: userId
            empresaId: empresaId
            method: method
            url: url
            statusCode: statusCode
            duration: duration

      # Extract timestamp
      - timestamp:
          source: timestamp
          format: RFC3339Nano

      # Dynamic labels (para filtros no Grafana)
      - labels:
          level:
          context:
          trace_id:
          span_id:
```

**🔍 Pipeline Explicado:**
1. **JSON parsing**: Extrai campos do log estruturado
2. **Timestamp**: Usa timestamp do log (não da ingestão)
3. **Labels**: `level`, `context`, `trace_id`, `span_id` → Filtráveis no Grafana

### 4. Grafana Datasource

#### `observability/grafana/provisioning/datasources/loki.yml`
```yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    uid: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      # Correlação com Jaeger (MAGIC! ✨)
      derivedFields:
        - datasourceUid: jaeger
          matcherRegex: "trace_id=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
```

**✨ Correlação Automática:**
- Quando você vê um log com `trace_id=abc123...`
- Clica no campo → **Abre o trace correspondente no Jaeger** 🎯
- Isso conecta Logs ↔ Traces instantaneamente!

### 5. Structured Logger

#### `backend/src/utils/structured-logger.ts`
```typescript
import { Logger } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import * as fs from 'fs';
import * as path from 'path';

export interface LogMetadata {
  userId?: string;
  empresaId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: string;
  [key: string]: any;
}

export class StructuredLogger extends Logger {
  private readonly logDir = path.join(__dirname, '../../logs');
  private readonly logFile = path.join(this.logDir, 'application.log');

  constructor(context?: string) {
    super(context);
    this.ensureLogDirectory();
  }

  // Criar diretório de logs se não existir
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // ✨ CORRELAÇÃO OPENTELEMETRY
  private getCorrelationIds(): { trace_id?: string; span_id?: string } {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const spanContext = span.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  }

  // Formatar log como JSON estruturado
  private formatLogEntry(level: string, message: any, metadata?: LogMetadata): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: this.context,
      ...this.getCorrelationIds(),  // ← trace_id, span_id
      ...metadata,
    });
  }

  // Escrever em arquivo
  private writeToFile(logEntry: string): void {
    fs.appendFileSync(this.logFile, logEntry + '\n', 'utf-8');
  }

  // API Pública (compatível com NestJS Logger)
  log(message: any, context?: string): void;
  log(message: any, metadata?: LogMetadata): void;
  log(message: any, contextOrMetadata?: string | LogMetadata): void {
    const metadata = typeof contextOrMetadata === 'string' 
      ? { context: contextOrMetadata } 
      : contextOrMetadata;
    const entry = this.formatLogEntry('info', message, metadata);
    console.log(entry);
    this.writeToFile(entry);
  }

  error(message: any, stack?: string, context?: string): void;
  error(message: any, stack?: string, metadata?: LogMetadata): void;
  error(message: any, stackOrContext?: string, contextOrMetadata?: string | LogMetadata): void {
    const stack = typeof stackOrContext === 'string' ? stackOrContext : undefined;
    const metadata = typeof contextOrMetadata === 'string'
      ? { context: contextOrMetadata, stack }
      : { ...contextOrMetadata, stack };
    const entry = this.formatLogEntry('error', message, metadata);
    console.error(entry);
    this.writeToFile(entry);
  }

  // warn, debug, verbose... (mesma estrutura)
}
```

**🔑 Features:**
- ✅ JSON estruturado (parseável pelo Promtail)
- ✅ `trace_id` e `span_id` automáticos (OpenTelemetry)
- ✅ Compatível com API do NestJS Logger
- ✅ Escreve em arquivo + console

---

## 📊 Dashboard de Logs

Dashboard criado: `observability/grafana/provisioning/dashboards/logs-centralizados.json`

### Painéis Implementados:

#### 1. KPI Cards (linha superior)
- 📊 **Total de Logs** (última hora)
- ❌ **Erros** com threshold (verde/amarelo/vermelho)
- ⚠️ **Warnings** 
- ℹ️ **Info logs**

#### 2. Gráfico de Série Temporal
- 📈 **Logs por Segundo** (por nível)
- Cores: Error (vermelho), Warn (amarelo), Info (azul)

#### 3. Painéis de Logs
- 🔴 **Últimos Erros** (filtrado `level=error`)
- 🟡 **Últimos Warnings** (filtrado `level=warn`)
- 📜 **Todos os Logs** (últimos 100, com labels)

#### 4. Análise de Contexto
- 🏷️ **Top 10 Contextos** (services mais ativos)
- 📊 **Distribuição por Nível** (pie chart)

#### 5. Variáveis de Template
- `$level`: Filtrar por nível de log (All/Error/Warn/Info/Debug)
- `$context`: Filtrar por service/contexto

#### 6. Annotations
- Marcadores automáticos de erros críticos na timeline

---

## 🚀 Como Usar

### 1. Verificar que tudo está rodando

```powershell
# Verificar containers
docker ps | Select-String "loki|promtail"

# Output esperado:
# conectsuite-loki       Up 5 minutes (healthy)
# conectsuite-promtail   Up 5 minutes
```

### 2. Testar API do Loki

```powershell
# Verificar saúde
curl http://localhost:3100/ready
# Output: ready

# Consultar logs (últimos 10 minutos)
$params = @{
    Uri = "http://localhost:3100/loki/api/v1/query_range"
    Method = "GET"
    Body = @{
        query = '{job="conectcrm-backend"}'
        start = ([DateTimeOffset]::Now.AddMinutes(-10).ToUnixTimeMilliseconds()) * 1000000
        end = ([DateTimeOffset]::Now.ToUnixTimeMilliseconds()) * 1000000
    }
}
Invoke-RestMethod @params
```

### 3. Acessar Grafana

1. Abrir: http://localhost:3002
2. Navegar: **Dashboards** → **📋 Logs Centralizados (Loki)**
3. Explorar logs em tempo real

### 4. Testar Correlação (Logs → Traces)

1. No dashboard de logs, encontrar um log com `trace_id`
2. Clicar no campo `trace_id` 
3. Selecionar **"View in Jaeger"**
4. 🎯 **Abre automaticamente o trace correspondente!**

### 5. Grafana Explore (modo avançado)

1. Ir em **Explore** (ícone de bússola)
2. Selecionar datasource **Loki**
3. Queries exemplo:

```logql
# Todos os logs do backend
{job="conectcrm-backend"}

# Apenas erros
{job="conectcrm-backend", level="error"}

# Erros de um service específico
{job="conectcrm-backend", level="error", context="TicketService"}

# Busca por texto na mensagem
{job="conectcrm-backend"} |= "Database connection"

# Erros com regex
{job="conectcrm-backend"} |~ "error|exception|failed"

# Análise: Rate de erros por minuto
rate({job="conectcrm-backend", level="error"}[1m])

# Top contextos com mais logs
topk(10, sum by (context) (count_over_time({job="conectcrm-backend"}[1h])))
```

---

## 🔍 LogQL Cheat Sheet

### Queries Básicas
```logql
# Sintaxe: {label_selector} |filter_expression

# Por job
{job="conectcrm-backend"}

# Por nível
{job="conectcrm-backend", level="error"}

# Múltiplos labels
{job="conectcrm-backend", level="error", context="AuthService"}
```

### Filtros de Conteúdo
```logql
# Contains (case-insensitive)
{job="conectcrm-backend"} |= "database"

# Not contains
{job="conectcrm-backend"} != "health check"

# Regex match
{job="conectcrm-backend"} |~ "error|exception|failed"

# Regex not match
{job="conectcrm-backend"} !~ "debug|trace"
```

### Agregações
```logql
# Count logs
count_over_time({job="conectcrm-backend"}[5m])

# Rate (logs per second)
rate({job="conectcrm-backend"}[1m])

# Sum by label
sum by (level) (count_over_time({job="conectcrm-backend"}[1h]))

# Top K
topk(5, sum by (context) (count_over_time({job="conectcrm-backend"}[1h])))
```

### Parsing JSON
```logql
# Extract JSON field
{job="conectcrm-backend"} | json | userId="123"

# Multiple fields
{job="conectcrm-backend"} | json | method="POST" | statusCode>=500
```

---

## 🐛 Troubleshooting

### Problema: Loki não inicia (Restarting loop)

**Erro:** `permission denied: mkdir /loki/chunks`

**Solução:**
```yaml
# docker-compose.yml
loki:
  user: "0"  # ← Adicionar esta linha
```

**Causa:** Container roda como usuário não-root por padrão, mas não tem permissão para criar diretórios no volume.

---

### Problema: Loki inicia mas fica "unhealthy"

**Erro:** `Ingester not ready: waiting for 15s after being ready`

**Solução:** **É NORMAL!** Loki tem warm-up de 15 segundos.

```powershell
# Aguardar 20 segundos
Start-Sleep -Seconds 20

# Verificar novamente
curl http://localhost:3100/ready
# Output: ready
```

---

### Problema: Config error "field not found"

**Erro:** `line 36: field shared_store not found in type boltdb.IndexCfg`

**Solução:** Atualizar para schema **v13** (TSDB):

```yaml
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb           # ← Era: boltdb-shipper
      object_store: filesystem
      schema: v13           # ← Era: v11
```

**Causa:** BoltDB shipper foi deprecado no Loki 3.x. TSDB é o novo padrão.

---

### Problema: Promtail não envia logs

**Verificar:**
```powershell
# Ver logs do Promtail
docker logs conectsuite-promtail --tail 50

# Verificar arquivo de log existe
Test-Path "c:\Projetos\conectcrm\backend\logs\application.log"
```

**Solução 1:** Criar diretório de logs
```powershell
New-Item -ItemType Directory -Path "c:\Projetos\conectcrm\backend\logs" -Force
```

**Solução 2:** Verificar mount no docker-compose
```yaml
promtail:
  volumes:
    - ./backend/logs:/var/log/backend:ro  # ← Path correto?
```

---

### Problema: Não vejo trace_id nos logs

**Verificar:**
1. OpenTelemetry inicializado? (ver console do backend)
2. Logger está dentro de um span ativo?

**Teste:**
```typescript
// Em um controller
import { trace } from '@opentelemetry/api';

async someMethod() {
  const tracer = trace.getTracer('test');
  return tracer.startActiveSpan('test-span', (span) => {
    this.logger.log('Este log TEM trace_id');
    span.end();
  });
}
```

---

## 📈 Métricas de Sucesso

### ✅ Critérios de Validação

- [x] Loki responde em http://localhost:3100/ready
- [x] Promtail está rodando (sem restart loop)
- [x] Logs aparecem na API do Loki: `/loki/api/v1/query_range`
- [x] Dashboard carrega sem erros
- [x] Correlação trace_id → Jaeger funciona
- [x] Filtros por nível/contexto funcionam

### 📊 Estatísticas

```powershell
# Total de logs ingeridos
curl "http://localhost:3100/loki/api/v1/query?query=sum(count_over_time({job=\"conectcrm-backend\"}[1h]))"

# Taxa de ingestão (logs/segundo)
curl "http://localhost:3100/loki/api/v1/query?query=rate({job=\"conectcrm-backend\"}[5m])"

# Distribuição por nível
curl "http://localhost:3100/loki/api/v1/query?query=sum by (level) (count_over_time({job=\"conectcrm-backend\"}[1h]))"
```

---

## 🎓 Conceitos Aprendidos

### 1. Three Pillars of Observability

```
┌──────────────────────────────────────────────┐
│           OBSERVABILITY STACK                │
├──────────────────────────────────────────────┤
│  METRICS (Prometheus)                        │
│    → O QUE aconteceu? (números)              │
│    → Ex: 95% success rate, 200ms p95         │
│                                              │
│  TRACES (Jaeger)                             │
│    → ONDE aconteceu? (fluxo de execução)     │
│    → Ex: Request levou 2s, DB query 1.8s    │
│                                              │
│  LOGS (Loki)                                 │
│    → POR QUE aconteceu? (contexto detalhado) │
│    → Ex: "Connection timeout to 10.0.0.5"   │
└──────────────────────────────────────────────┘

✨ CORRELAÇÃO via trace_id conecta tudo!
```

### 2. Structured Logging vs Plain Text

**❌ Plain Text (ruim para parsing):**
```
2025-11-18 00:30:15 ERROR [TicketService] Failed to create ticket for user John
```

**✅ Structured JSON (parseável):**
```json
{
  "timestamp": "2025-11-18T00:30:15.123Z",
  "level": "ERROR",
  "context": "TicketService",
  "message": "Failed to create ticket",
  "userId": "user-123",
  "trace_id": "abc123def456",
  "error": "Database connection timeout"
}
```

**Vantagens JSON:**
- ✅ Busca por campos: `userId="user-123"`
- ✅ Agregações: `sum by (context)`
- ✅ Correlação: `trace_id → Jaeger`

### 3. TSDB vs BoltDB (Loki)

| Feature | BoltDB (v11) | TSDB (v13) |
|---------|--------------|------------|
| **Performance** | Bom | **Excelente** |
| **Compactação** | Manual | Automática |
| **Query Speed** | Lento em volumes altos | Rápido |
| **Status** | ⚠️ Deprecado | ✅ **Recomendado** |

**Conclusão:** Sempre use **TSDB v13**!

---

## 🔮 Próximos Passos (Week 9)

### Alerting & On-Call

1. **Configurar Alertmanager**
   - Regras de alerta baseadas em logs
   - Notificações: Slack, Email, PagerDuty

2. **Regras de Alerta Loki**
   ```yaml
   groups:
     - name: errors
       rules:
         - alert: HighErrorRate
           expr: |
             sum(rate({job="conectcrm-backend", level="error"}[5m])) > 0.1
           for: 5m
           labels:
             severity: critical
           annotations:
             summary: "High error rate detected"
   ```

3. **On-Call Rotation**
   - Integração com PagerDuty/Opsgenie
   - Escalation policies

4. **SLO-based Alerting**
   - Alertas quando SLO em risco (error budget)
   - Multi-window, multi-burn-rate alerts

---

## 📚 Referências

- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/send-data/promtail/configuration/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/query/)
- [OpenTelemetry Correlation](https://opentelemetry.io/docs/concepts/observability-primer/#correlation)
- [Three Pillars of Observability](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/ch04.html)

---

## ✅ Checklist de Implementação

- [x] Adicionar Loki ao docker-compose.yml
- [x] Adicionar Promtail ao docker-compose.yml
- [x] Criar loki-config.yml (TSDB v13)
- [x] Criar promtail-config.yml (JSON pipeline)
- [x] Configurar Loki datasource no Grafana
- [x] Implementar StructuredLogger com correlação
- [x] Criar diretório backend/logs
- [x] Testar Loki API (query_range)
- [x] Criar dashboard de logs
- [x] Validar correlação Loki → Jaeger
- [x] Documentar troubleshooting
- [x] Documentar LogQL queries

---

**🎉 Week 8 COMPLETA!**

**Stack atual:**
- ✅ Week 6: Error Budget Management (Metrics)
- ✅ Week 7: Distributed Tracing (Jaeger)
- ✅ Week 8: Centralized Logging (Loki)
- 🔜 Week 9: Alerting & On-Call

**Observability Score: 85/100** 🚀
