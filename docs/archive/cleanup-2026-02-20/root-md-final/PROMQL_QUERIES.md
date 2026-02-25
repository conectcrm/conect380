# 📊 PromQL Queries Úteis - ConectCRM

Queries Prometheus úteis para monitoramento e troubleshooting do ConectCRM.

---

## 🎯 SLOs & Error Budget

### Disponibilidade (99.9% target)

```promql
# Disponibilidade atual (30 dias)
sum(rate(http_requests_total{status=~"2.."}[30d])) 
/ 
sum(rate(http_requests_total[30d])) * 100

# Error budget restante (%)
100 - (
  sum(rate(http_requests_total{status=~"5.."}[30d])) 
  / 
  sum(rate(http_requests_total[30d])) * 100 * 1000
)

# Minutos de downtime no mês
(1 - (
  sum(rate(http_requests_total{status=~"2.."}[30d])) 
  / 
  sum(rate(http_requests_total[30d]))
)) * 30 * 24 * 60

# Burn rate (velocidade de consumo do error budget)
(
  sum(rate(http_requests_total{status=~"5.."}[1h])) 
  / 
  sum(rate(http_requests_total[1h]))
) / 0.001
```

### Latência (P95 < 2s target)

```promql
# Latência P95 (7 dias)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[7d])
)

# Latência P50, P95, P99
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m])) # P50
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) # P95
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) # P99

# Latência por rota (top 10 mais lentas)
topk(10, 
  histogram_quantile(0.95, 
    rate(http_request_duration_seconds_bucket[1h])
  ) by (route)
)

# Requests acima do SLO (> 2s)
sum(rate(http_request_duration_seconds_count{le="2"}[5m])) 
/ 
sum(rate(http_request_duration_seconds_count[5m])) * 100
```

### Error Rate (< 0.1% target)

```promql
# Taxa de erro 5xx (30 dias)
sum(rate(http_requests_total{status=~"5.."}[30d])) 
/ 
sum(rate(http_requests_total[30d])) * 100

# Taxa de erro por status code
sum(rate(http_requests_total[5m])) by (status)

# Top 10 rotas com mais erros
topk(10, 
  sum(rate(http_requests_total{status=~"5.."}[1h])) by (route)
)

# Erros por tipo
sum(rate(http_requests_total[5m])) by (status) > 0
```

---

## 🔥 Performance & Throughput

### Throughput (Requisições por segundo)

```promql
# RPS total
sum(rate(http_requests_total[5m]))

# RPS por método HTTP
sum(rate(http_requests_total[5m])) by (method)

# RPS por rota (top 10)
topk(10, sum(rate(http_requests_total[5m])) by (route))

# RPS por status code
sum(rate(http_requests_total[5m])) by (status)

# Comparar com 1 hora atrás (detectar drops)
(
  sum(rate(http_requests_total[5m])) 
  / 
  sum(rate(http_requests_total[5m] offset 1h))
) * 100
```

### Latência por Endpoint

```promql
# Latência média por rota
avg(rate(http_request_duration_seconds_sum[5m])) 
/ 
avg(rate(http_request_duration_seconds_count[5m])) 
by (route)

# Latência P95 por rota
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le)
)

# Rotas com latência > 1s (últimos 5min)
avg(rate(http_request_duration_seconds_sum[5m]) 
    / 
    rate(http_request_duration_seconds_count[5m])) 
by (route) > 1
```

### Concorrência

```promql
# Requisições ativas (em processamento)
http_requests_in_flight

# Requisições em fila (aguardando processamento)
http_requests_queued

# Taxa de saturação
http_requests_in_flight / http_requests_max_concurrent * 100
```

---

## 🗄️ Database (TypeORM)

### Connection Pool

```promql
# Pool atual vs máximo
typeorm_connection_pool_active / typeorm_connection_pool_max * 100

# Conexões idle
typeorm_connection_pool_idle

# Tempo de espera por conexão (P95)
histogram_quantile(0.95, 
  rate(typeorm_connection_acquire_duration_seconds_bucket[5m])
)

# Timeouts de conexão (por minuto)
rate(typeorm_connection_timeouts_total[1m]) * 60
```

### Query Performance

```promql
# Latência P95 de queries (todas)
histogram_quantile(0.95, 
  rate(typeorm_query_duration_seconds_bucket[5m])
)

# Queries lentas (> 1s) por entidade
sum(rate(typeorm_query_duration_seconds_count{le="1"}[5m])) by (entity)

# Query rate por operação
sum(rate(typeorm_queries_total[5m])) by (operation)

# Queries por segundo por entidade (top 10)
topk(10, sum(rate(typeorm_queries_total[5m])) by (entity))
```

### Database Errors

```promql
# Taxa de erros do banco
rate(typeorm_query_errors_total[5m])

# Erros por tipo
sum(rate(typeorm_query_errors_total[5m])) by (error_type)

# Deadlocks
rate(typeorm_deadlocks_total[5m])

# Timeout de queries
rate(typeorm_query_timeouts_total[5m])
```

---

## 🎫 Atendimento (Business Metrics)

### Tickets

```promql
# Tickets criados (por hora)
rate(tickets_criados_total[1h]) * 3600

# Tickets na fila (aguardando)
tickets_em_fila_total

# Tempo médio de primeira resposta (minutos)
avg(ticket_tempo_primeira_resposta_seconds) / 60

# Tempo médio de resolução (horas)
avg(ticket_tempo_resolucao_seconds) / 3600

# Taxa de abandono
rate(tickets_abandonados_total[1h]) 
/ 
rate(tickets_criados_total[1h]) * 100

# Taxa de conversão (resolução)
rate(tickets_resolvidos_total[1h]) 
/ 
rate(tickets_criados_total[1h]) * 100
```

### SLA de Atendimento

```promql
# % de tickets respondidos em < 30min (P90)
histogram_quantile(0.90, 
  rate(ticket_tempo_primeira_resposta_seconds_bucket{le="1800"}[7d])
) < 1800

# % de tickets resolvidos em < 4h (P80)
histogram_quantile(0.80, 
  rate(ticket_tempo_resolucao_seconds_bucket{le="14400"}[30d])
) < 14400
```

### Atendentes

```promql
# Atendentes online
atendentes_online_total

# Atendentes por status
atendentes_total by (status)

# Carga de trabalho (tickets por atendente)
tickets_em_fila_total / atendentes_online_total

# Distribuição de tickets (por atendente)
sum(tickets_atribuidos_total) by (atendente_id)
```

---

## 💻 Recursos do Sistema

### CPU

```promql
# CPU usage (%)
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU por core
rate(node_cpu_seconds_total{mode!="idle"}[5m]) * 100

# Top 5 processos por CPU
topk(5, rate(process_cpu_seconds_total[5m]))
```

### Memória

```promql
# Memória usada (%)
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) 
/ 
node_memory_MemTotal_bytes * 100

# Memória usada (GB)
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024 / 1024

# Swap usage
node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes

# Memory pressure (taxa de page faults)
rate(node_vmstat_pgmajfault[5m])
```

### Disco

```promql
# Espaço livre (%)
(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100

# Espaço usado (GB)
(node_filesystem_size_bytes - node_filesystem_avail_bytes) / 1024 / 1024 / 1024

# IOPS (leitura)
rate(node_disk_reads_completed_total[5m])

# IOPS (escrita)
rate(node_disk_writes_completed_total[5m])

# Latência de I/O
rate(node_disk_io_time_seconds_total[5m])
```

### Rede

```promql
# Bytes recebidos (MB/s)
rate(node_network_receive_bytes_total[5m]) / 1024 / 1024

# Bytes enviados (MB/s)
rate(node_network_transmit_bytes_total[5m]) / 1024 / 1024

# Pacotes perdidos
rate(node_network_receive_drop_total[5m]) + rate(node_network_transmit_drop_total[5m])

# Erros de rede
rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m])
```

---

## 🚨 Alerting & Debugging

### Alertas Ativos

```promql
# Quantidade de alertas ativos
ALERTS

# Alertas por severidade
sum(ALERTS) by (severity)

# Alertas críticos ativos
ALERTS{severity="critical"}

# Histórico de firing (últimas 24h)
changes(ALERTS[24h])
```

### Anomaly Detection

```promql
# Desvio padrão de latência (detectar spikes)
stddev_over_time(
  histogram_quantile(0.95, 
    rate(http_request_duration_seconds_bucket[5m])
  )[1h:]
)

# Predição linear (próximas 4 horas)
predict_linear(
  http_requests_total[1h], 4 * 3600
)

# Rate de mudança (crescimento/queda)
deriv(
  sum(rate(http_requests_total[5m]))[10m:]
)
```

### Correlação de Eventos

```promql
# Erro rate vs Latência (correlação)
(
  sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
  sum(rate(http_requests_total[5m]))
) * 
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# CPU vs Request rate (correlação)
(100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) 
* 
sum(rate(http_requests_total[5m])) / 100
```

---

## 📈 Trends & Forecasting

### Crescimento de Tráfego

```promql
# Crescimento diário (%)
(
  sum(rate(http_requests_total[1d]))
  /
  sum(rate(http_requests_total[1d] offset 1d))
  - 1
) * 100

# Predição de tráfego (próxima semana)
predict_linear(
  sum(rate(http_requests_total[5m]))[7d:], 7 * 24 * 3600
)
```

### Capacidade

```promql
# Saturação do sistema (0-100%)
(
  (http_requests_in_flight / http_requests_max_concurrent) +
  (typeorm_connection_pool_active / typeorm_connection_pool_max) +
  ((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes)
) / 3 * 100

# Tempo até saturação (horas)
(100 - saturacao_atual) 
/ 
rate(saturacao[1h]) * 3600
```

---

## 🎯 Dashboards Sugeridos

### Panel 1: Golden Signals
- Latência (P50, P95, P99)
- Traffic (RPS)
- Errors (%)
- Saturation (%)

### Panel 2: SLO Overview
- Availability (30d, 7d, 1d)
- Latency SLO (P95 < 2s)
- Error Rate (< 0.1%)
- Error Budget Remaining

### Panel 3: Database Health
- Connection Pool Usage
- Query P95 Latency
- Slow Queries
- Deadlocks

### Panel 4: Business Metrics
- Tickets Created/Resolved
- Queue Size
- Response Time
- Conversion Rate

---

## 💡 Dicas de Performance

### Recording Rules (pré-calcular)

Criar recording rules para queries pesadas (em `alert-rules.yml`):

```yaml
groups:
  - name: recording_rules
    interval: 30s
    rules:
      # SLO Availability
      - record: slo:availability:30d
        expr: |
          sum(rate(http_requests_total{status=~"2.."}[30d])) 
          / 
          sum(rate(http_requests_total[30d])) * 100
      
      # Latency P95
      - record: slo:latency:p95:7d
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[7d])
          )
      
      # Error Rate
      - record: slo:error_rate:30d
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[30d])) 
          / 
          sum(rate(http_requests_total[30d])) * 100
```

Usar nos dashboards:
```promql
slo:availability:30d
slo:latency:p95:7d
slo:error_rate:30d
```

---

**Última atualização**: 17 de novembro de 2025
